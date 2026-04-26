import MiniSearch from "minisearch";
import { areAdjacentSkills, labelForSkill } from "./skills";
import { scoreInterest, simulateOutreach } from "./outreach";
import type { CandidateProfile, CandidateScore, EvidencePath, JDProfile, ScoreFactor } from "./types";

export function discoverCandidates(jd: JDProfile, candidates: CandidateProfile[], limit = 8): CandidateProfile[] {
  const miniSearch = new MiniSearch<CandidateProfile>({
    fields: ["headline", "location", "domainsText", "skillsText", "projectsText"],
    storeFields: ["id"],
    searchOptions: {
      boost: { skillsText: 3, domainsText: 2, headline: 1.5 },
      fuzzy: 0.15,
      prefix: true
    },
    idField: "id",
    extractField: (document, fieldName) => {
      if (fieldName === "domainsText") return document.domains.join(" ");
      if (fieldName === "skillsText") return document.skills.map((skill) => `${skill.skill} ${skill.evidence}`).join(" ");
      if (fieldName === "projectsText") return document.projects.map((project) => `${project.name} ${project.summary} ${project.skills.join(" ")}`).join(" ");
      const value = document[fieldName as keyof CandidateProfile];
      return typeof value === "string" ? value : "";
    }
  });

  miniSearch.addAll(candidates);
  const query = [
    jd.roleTitle,
    jd.domain,
    ...jd.mustHaveSkills.map((skill) => skill.skill),
    ...jd.niceToHaveSkills.map((skill) => skill.skill)
  ].join(" ");
  const ids = miniSearch.search(query).map((result) => result.id);
  const rankedIds = new Set(ids);
  const discovered = ids
    .map((id) => candidates.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is CandidateProfile => Boolean(candidate));

  for (const candidate of candidates) {
    if (!rankedIds.has(candidate.id)) discovered.push(candidate);
  }

  return discovered.slice(0, limit);
}

export function scoreCandidate(candidate: CandidateProfile, jd: JDProfile, weights = { match: 0.6, interest: 0.4 }): CandidateScore {
  const match = scoreMatch(candidate, jd);
  const transcript = simulateOutreach(candidate, jd);
  const interest = scoreInterest(candidate, jd);
  const combinedScore = Math.round(match.score * weights.match + interest.score * weights.interest);
  const suggestedAction = suggestAction(match.score, interest.score, combinedScore);
  const auditNotes = [
    "Scores are decision-support signals for recruiter review, not automated rejection.",
    "Protected attributes are not part of the scoring model.",
    "Outreach transcript is simulated for prototype assessment."
  ];

  return {
    candidate,
    matchScore: match.score,
    interestScore: interest.score,
    combinedScore,
    matchFactors: match.factors,
    interestFactors: interest.factors,
    evidencePaths: match.evidencePaths,
    transcript,
    suggestedAction,
    auditNotes
  };
}

export function scoreMatch(candidate: CandidateProfile, jd: JDProfile): {
  score: number;
  factors: ScoreFactor[];
  evidencePaths: EvidencePath[];
} {
  const evidencePaths = buildEvidencePaths(candidate, jd);
  const skillCoverage = scoreSkillCoverage(evidencePaths, jd);
  const skillDepth = scoreSkillDepth(candidate, evidencePaths);
  const seniority = scoreSeniority(candidate, jd);
  const domain = scoreDomain(candidate, jd);
  const location = scoreLocation(candidate, jd);
  const adjacent = scoreAdjacent(evidencePaths, jd);
  const availabilityComp = scoreAvailabilityComp(candidate, jd);
  const penalty = scoreDealbreakerPenalty(candidate, jd);

  const factors: ScoreFactor[] = [
    { name: "Skill coverage", score: skillCoverage, weight: 0.35, reason: "Direct must-have and nice-to-have skill coverage from profile evidence." },
    { name: "Skill depth", score: skillDepth, weight: 0.15, reason: "Years, level, recency, and project evidence on matched skills." },
    { name: "Seniority fit", score: seniority, weight: 0.15, reason: `${candidate.yearsExperience} years and ${candidate.seniority} profile compared with ${jd.seniority} JD.` },
    { name: "Domain relevance", score: domain, weight: 0.1, reason: `${candidate.domains.join(", ")} compared with ${jd.domain}.` },
    { name: "Location/work mode", score: location, weight: 0.1, reason: `${candidate.location} and ${candidate.workModes.join("/")} compared with ${jd.location} ${jd.workMode}.` },
    { name: "Adjacent skills", score: adjacent, weight: 0.1, reason: "Skill graph gives partial credit for transferable adjacent skills." },
    { name: "Availability/compensation", score: availabilityComp, weight: 0.05, reason: "Prototype uses stated candidate availability and compensation preferences when JD provides enough signal." }
  ];

  const weighted = weightedAverage(factors);
  const score = Math.round(Math.max(0, weighted - penalty));
  return { score, factors, evidencePaths };
}

function buildEvidencePaths(candidate: CandidateProfile, jd: JDProfile): EvidencePath[] {
  const requirements = [...jd.mustHaveSkills, ...jd.niceToHaveSkills];
  return requirements.map((requirement) => {
    const direct = candidate.skills.find((skill) => skill.normalizedSkill === requirement.normalizedSkill);
    if (direct) {
      return {
        jdSkill: requirement.normalizedSkill,
        candidateSkill: direct.normalizedSkill,
        relation: "direct",
        evidence: direct.evidence,
        contribution: requirement.importance === "must" ? 1 : 0.65
      };
    }

    const adjacent = candidate.skills.find((skill) => areAdjacentSkills(skill.normalizedSkill, requirement.normalizedSkill));
    if (adjacent) {
      return {
        jdSkill: requirement.normalizedSkill,
        candidateSkill: adjacent.normalizedSkill,
        relation: "adjacent",
        evidence: `${labelForSkill(adjacent.normalizedSkill)} is adjacent to ${labelForSkill(requirement.normalizedSkill)} in the skill graph. ${adjacent.evidence}`,
        contribution: requirement.importance === "must" ? 0.45 : 0.35
      };
    }

    return {
      jdSkill: requirement.normalizedSkill,
      candidateSkill: "missing",
      relation: "missing",
      evidence: `No direct or adjacent evidence found for ${requirement.skill}.`,
      contribution: 0
    };
  });
}

function scoreSkillCoverage(paths: EvidencePath[], jd: JDProfile): number {
  const total = jd.mustHaveSkills.length + jd.niceToHaveSkills.length * 0.5 || 1;
  const earned = paths.reduce((sum, path) => {
    const isNice = jd.niceToHaveSkills.some((skill) => skill.normalizedSkill === path.jdSkill);
    return sum + path.contribution * (isNice ? 0.5 : 1);
  }, 0);
  return clamp((earned / total) * 100);
}

function scoreSkillDepth(candidate: CandidateProfile, paths: EvidencePath[]): number {
  const matched = paths
    .filter((path) => path.relation !== "missing")
    .map((path) => candidate.skills.find((skill) => skill.normalizedSkill === path.candidateSkill))
    .filter(Boolean);
  if (!matched.length) return 20;

  const depth = matched.reduce((sum, skill) => {
    if (!skill) return sum;
    const level = skill.level === "expert" ? 100 : skill.level === "advanced" ? 82 : 62;
    const recency = skill.lastUsed >= 2025 ? 100 : skill.lastUsed === 2024 ? 82 : 65;
    const years = Math.min(100, skill.years * 15);
    return sum + level * 0.45 + recency * 0.25 + years * 0.3;
  }, 0) / matched.length;
  return clamp(depth);
}

function scoreSeniority(candidate: CandidateProfile, jd: JDProfile): number {
  const order = ["intern", "junior", "mid", "senior", "staff", "lead", "manager"];
  const diff = Math.abs(order.indexOf(candidate.seniority) - order.indexOf(jd.seniority));
  const yearsTarget = jd.constraints.minYears ?? (jd.seniority === "senior" ? 6 : jd.seniority === "staff" ? 9 : 3);
  const yearsScore = candidate.yearsExperience >= yearsTarget ? 100 : (candidate.yearsExperience / yearsTarget) * 85;
  return clamp(yearsScore - diff * 10);
}

function scoreDomain(candidate: CandidateProfile, jd: JDProfile): number {
  const exact = candidate.domains.some((domain) => domain.toLowerCase() === jd.domain.toLowerCase());
  if (exact) return 100;
  const partial = candidate.domains.some((domain) => domain.toLowerCase().includes(jd.domain.toLowerCase()) || jd.domain.toLowerCase().includes(domain.toLowerCase()));
  if (partial) return 82;
  const adjacent = candidate.domains.some((domain) => /ai|workflow|saas|product|hr tech/i.test(`${domain} ${jd.domain}`));
  return adjacent ? 68 : 45;
}

function scoreLocation(candidate: CandidateProfile, jd: JDProfile): number {
  const modeScore = jd.workMode === "unspecified" ? 75 : candidate.workModes.includes(jd.workMode) ? 100 : 50;
  const locationScore =
    jd.location === "Unspecified" || /remote/i.test(jd.location)
      ? 80
      : candidate.location.toLowerCase().includes(jd.location.toLowerCase()) || jd.location.toLowerCase().includes(candidate.location.split(",")[0].toLowerCase())
        ? 100
        : 62;
  return clamp(modeScore * 0.65 + locationScore * 0.35);
}

function scoreAdjacent(paths: EvidencePath[], jd: JDProfile): number {
  const requirements = jd.mustHaveSkills.length + jd.niceToHaveSkills.length || 1;
  const adjacentCount = paths.filter((path) => path.relation === "adjacent").length;
  const directCount = paths.filter((path) => path.relation === "direct").length;
  return clamp(((directCount * 0.7 + adjacentCount * 1) / requirements) * 100);
}

function scoreAvailabilityComp(candidate: CandidateProfile, jd: JDProfile): number {
  const availability = clamp(100 - Math.max(0, candidate.preferences.availabilityWeeks - 4) * 8);
  if (!jd.constraints.compensation || !candidate.preferences.compensationMin) return availability;
  const numbers = jd.constraints.compensation.match(/\d[\d,]*/g)?.map((value) => Number(value.replace(/,/g, ""))) ?? [];
  if (!numbers.length) return availability;
  const maxComp = Math.max(...numbers);
  const comp = maxComp >= candidate.preferences.compensationMin ? 100 : clamp(45 + (maxComp / candidate.preferences.compensationMin) * 45);
  return clamp(availability * 0.55 + comp * 0.45);
}

function scoreDealbreakerPenalty(candidate: CandidateProfile, jd: JDProfile): number {
  const dealbreakers = jd.constraints.dealbreakers.join(" ").toLowerCase();
  let penalty = 0;
  if (/onsite only|must be onsite/.test(dealbreakers) && !candidate.workModes.includes("onsite")) penalty += 18;
  if (/must have/.test(dealbreakers)) {
    const missingMust = jd.mustHaveSkills.filter((skill) => !candidate.skills.some((candidateSkill) => candidateSkill.normalizedSkill === skill.normalizedSkill));
    penalty += Math.min(15, missingMust.length * 3);
  }
  return penalty;
}

function suggestAction(match: number, interest: number, combined: number): string {
  if (combined >= 85) return "Prioritize for recruiter follow-up today.";
  if (match >= 80 && interest < 70) return "Strong match; tailor outreach around likely objections.";
  if (interest >= 80 && match < 72) return "Interested candidate; review gaps before advancing.";
  if (combined >= 70) return "Keep on shortlist and request recruiter review.";
  return "Hold as backup unless the funnel needs more coverage.";
}

function weightedAverage(factors: ScoreFactor[]): number {
  const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
  return factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0) / totalWeight;
}

function clamp(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}
