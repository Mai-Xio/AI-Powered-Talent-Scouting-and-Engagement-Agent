import type { CandidateProfile, InterestBreakdown, OutreachTurn, ScoreFactor, JDProfile } from "./types";

export function simulateOutreach(candidate: CandidateProfile, jd: JDProfile): OutreachTurn[] {
  const role = jd.roleTitle;
  const workMode = jd.workMode === "unspecified" ? "flexible work setup" : `${jd.workMode} setup`;
  const domain = jd.domain;
  const candidateHook = candidate.preferences.motivators[0] ?? "product impact";

  return [
    {
      speaker: "agent",
      message: `Hi ${candidate.name.split(" ")[0]}, I am reaching out about a ${role} role in ${domain}. Your work on ${candidate.projects[0]?.name ?? "similar systems"} stood out, especially around ${candidateHook}. Would you be open to a quick fit check?`
    },
    {
      speaker: "candidate",
      message: `${opennessPhrase(candidate.preferences.openToRecruiter)} The domain is ${domain.toLowerCase().includes("hr") ? "very relevant" : "interesting"}, and I would want to understand the product scope, team ownership, and ${candidate.persona.likelyObjection.toLowerCase()}`
    },
    {
      speaker: "agent",
      message: `The team is building an explainable recruiter workspace with JD parsing, skill-graph matching, and simulated outreach. It is ${workMode}, and the recruiter remains the decision maker. What would make this worth exploring?`
    },
    {
      speaker: "candidate",
      message: `${candidate.persona.strongestInterest} I could consider next steps in about ${candidate.preferences.availabilityWeeks} weeks. My main motivators are ${candidate.preferences.motivators.slice(0, 2).join(" and ")}. ${candidate.persona.closingSignal}`
    }
  ];
}

export function scoreInterest(candidate: CandidateProfile, jd: JDProfile): {
  score: number;
  factors: ScoreFactor[];
  breakdown: InterestBreakdown;
} {
  const openness = clamp(candidate.preferences.openToRecruiter * 100);
  const timeline = clamp(100 - Math.max(0, candidate.preferences.availabilityWeeks - 2) * 7);
  const motivation = clamp(domainOverlap(candidate.domains, jd.domain) * 70 + roleOverlap(candidate, jd) * 30);
  const compensation = scoreCompensation(candidate, jd);
  const workMode = scoreWorkMode(candidate, jd);
  const objectionRisk = clamp(100 - candidate.preferences.concerns.length * 16);
  const specificity = clamp(65 + candidate.projects.length * 10 + candidate.preferences.motivators.length * 4);

  const breakdown: InterestBreakdown = {
    openness: factor("Openness", openness, 0.2, "Candidate persona has a calibrated recruiter openness signal."),
    timeline: factor("Timeline", timeline, 0.15, `${candidate.preferences.availabilityWeeks} week availability window.`),
    motivation: factor("Role motivation", motivation, 0.2, "Candidate motivators and domain history align with the JD."),
    compensation: factor("Compensation fit", compensation, 0.1, jd.constraints.compensation ? "Compensation was compared against candidate floor." : "No compensation range was provided, so this is neutral."),
    workMode: factor("Work mode fit", workMode, 0.15, "Candidate work mode preferences are compared with the JD."),
    objectionRisk: factor("Objection risk", objectionRisk, 0.1, candidate.persona.likelyObjection),
    specificity: factor("Response specificity", specificity, 0.1, "Transcript includes concrete motivators, concerns, and next-step signals.")
  };

  const factors = Object.values(breakdown);
  const score = weightedAverage(factors);
  return { score, factors, breakdown };
}

function opennessPhrase(score: number): string {
  if (score >= 0.8) return "Yes, I am actively open to a focused conversation.";
  if (score >= 0.6) return "I am selectively open if the role is a strong fit.";
  return "I am not actively looking, but I will listen if the match is unusually strong.";
}

function scoreWorkMode(candidate: CandidateProfile, jd: JDProfile): number {
  if (jd.workMode === "unspecified") return 75;
  return candidate.preferences.workModes.includes(jd.workMode) ? 96 : candidate.workModes.includes(jd.workMode) ? 78 : 42;
}

function scoreCompensation(candidate: CandidateProfile, jd: JDProfile): number {
  if (!jd.constraints.compensation || !candidate.preferences.compensationMin) return 75;
  const numbers = jd.constraints.compensation.match(/\d[\d,]*/g)?.map((value) => Number(value.replace(/,/g, ""))) ?? [];
  if (!numbers.length) return 70;
  const max = Math.max(...numbers);
  return max >= candidate.preferences.compensationMin ? 95 : clamp(55 + (max / candidate.preferences.compensationMin) * 35);
}

function domainOverlap(domains: string[], jdDomain: string): number {
  return domains.some((domain) => domain.toLowerCase() === jdDomain.toLowerCase()) ? 1 : domains.some((domain) => jdDomain.toLowerCase().includes(domain.toLowerCase()) || domain.toLowerCase().includes(jdDomain.toLowerCase())) ? 0.75 : 0.35;
}

function roleOverlap(candidate: CandidateProfile, jd: JDProfile): number {
  const title = jd.roleTitle.toLowerCase();
  return candidate.preferences.roles.some((role) => title.includes(role.toLowerCase()) || role.toLowerCase().includes(title)) ? 1 : /ai|engineer|product/.test(title) ? 0.65 : 0.4;
}

function factor(name: string, score: number, weight: number, reason: string): ScoreFactor {
  return { name, score: Math.round(clamp(score)), weight, reason };
}

function weightedAverage(factors: ScoreFactor[]): number {
  const totalWeight = factors.reduce((sum, item) => sum + item.weight, 0);
  return Math.round(factors.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}
