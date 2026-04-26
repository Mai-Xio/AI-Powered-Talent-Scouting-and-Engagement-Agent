import { seededCandidates } from "./candidates";
import { toResultJson, toShortlistCsv } from "./export";
import { parseWithGemini } from "./llm/gemini";
import { reviewShortlistWithOpenRouter } from "./llm/openrouter";
import { createLedger, getCached, setCached, sha256 } from "./model-budget";
import { parseJobDescription } from "./parser";
import { discoverCandidates, scoreCandidate } from "./scoring";
import { labelForSkill } from "./skills";
import type { AgentRunRequest, AgentRunResult, CandidateProfile, KnowledgeGraphEdge, KnowledgeGraphNode } from "./types";

const defaultWeights = { match: 0.6, interest: 0.4 };

export async function runRecruiterAgent(request: AgentRunRequest): Promise<AgentRunResult> {
  const startedAt = Date.now();
  const ledger = createLedger();
  const weights = normalizeWeights(request.weights);
  const hash = await sha256(JSON.stringify({ jdText: request.jdText, weights, uploaded: request.uploadedCandidates?.length ?? 0 }));
  const cached = getCached<AgentRunResult>(hash);

  if (cached) {
    return {
      ...cached,
      durationMs: Date.now() - startedAt,
      modelBudget: {
        ...cached.modelBudget,
        cached: true,
        notes: [...cached.modelBudget.notes, "Served from in-memory cache for this dev session."]
      }
    };
  }

  const deterministicJd = parseJobDescription(request.jdText);
  const jdProfile = await parseWithGemini(request.jdText, deterministicJd, ledger);
  const corpus = mergeCandidateCorpus(seededCandidates, request.uploadedCandidates ?? []);
  const discovered = discoverCandidates(jdProfile, corpus, 8);
  let shortlist = discovered
    .map((candidate) => scoreCandidate(candidate, jdProfile, weights))
    .sort((left, right) => right.combinedScore - left.combinedScore)
    .slice(0, 6);

  const agentReviews = await reviewShortlistWithOpenRouter(jdProfile, shortlist, ledger);
  shortlist = attachAgentReviews(shortlist, agentReviews);

  const resultWithoutExports = {
    id: hash.slice(0, 12),
    createdAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    jdProfile,
    candidatesConsidered: discovered.length,
    shortlist,
    graph: buildKnowledgeGraph(jdProfile, shortlist),
    modelBudget: ledger
  };

  const result: AgentRunResult = {
    ...resultWithoutExports,
    exports: {
      csv: toShortlistCsv(shortlist),
      json: toResultJson(resultWithoutExports)
    }
  };

  return setCached(hash, result);
}

function normalizeWeights(weights?: AgentRunRequest["weights"]) {
  if (!weights) return defaultWeights;
  const match = Math.max(0, weights.match);
  const interest = Math.max(0, weights.interest);
  const total = match + interest || 1;
  return {
    match: match / total,
    interest: interest / total
  };
}

function mergeCandidateCorpus(seed: CandidateProfile[], uploaded: CandidateProfile[]): CandidateProfile[] {
  const byId = new Map(seed.map((candidate) => [candidate.id, candidate]));
  for (const candidate of uploaded) {
    byId.set(candidate.id, candidate);
  }
  return [...byId.values()];
}

function buildKnowledgeGraph(jd: AgentRunResult["jdProfile"], shortlist: AgentRunResult["shortlist"]): AgentRunResult["graph"] {
  const nodes: KnowledgeGraphNode[] = [
    { id: "jd", label: jd.roleTitle, type: "jd", score: jd.confidence },
    { id: `domain-${jd.domain}`, label: jd.domain, type: "domain" }
  ];
  const edges: KnowledgeGraphEdge[] = [
    { id: "jd-domain", source: "jd", target: `domain-${jd.domain}`, label: "operates in", strength: 0.8 }
  ];

  const requiredSkills = [...jd.mustHaveSkills, ...jd.niceToHaveSkills].slice(0, 10);
  for (const skill of requiredSkills) {
    nodes.push({ id: `skill-${skill.normalizedSkill}`, label: labelForSkill(skill.normalizedSkill), type: "skill" });
    edges.push({
      id: `jd-${skill.normalizedSkill}`,
      source: "jd",
      target: `skill-${skill.normalizedSkill}`,
      label: skill.importance === "must" ? "requires" : "prefers",
      strength: skill.importance === "must" ? 1 : 0.55
    });
  }

  for (const score of shortlist.slice(0, 5)) {
    nodes.push({
      id: `candidate-${score.candidate.id}`,
      label: score.candidate.name,
      type: "candidate",
      score: score.combinedScore
    });
    edges.push({
      id: `jd-${score.candidate.id}`,
      source: "jd",
      target: `candidate-${score.candidate.id}`,
      label: `${score.combinedScore} combined`,
      strength: score.combinedScore / 100
    });

    for (const path of score.evidencePaths.filter((item) => item.relation !== "missing").slice(0, 4)) {
      const skillNode = `skill-${path.jdSkill}`;
      edges.push({
        id: `${score.candidate.id}-${path.jdSkill}`,
        source: `candidate-${score.candidate.id}`,
        target: skillNode,
        label: path.relation,
        strength: path.contribution
      });
    }
  }

  return {
    nodes: dedupeNodes(nodes),
    edges
  };
}

function dedupeNodes(nodes: KnowledgeGraphNode[]): KnowledgeGraphNode[] {
  return [...new Map(nodes.map((node) => [node.id, node])).values()];
}

function attachAgentReviews(
  shortlist: AgentRunResult["shortlist"],
  reviews: Awaited<ReturnType<typeof reviewShortlistWithOpenRouter>>
): AgentRunResult["shortlist"] {
  if (!reviews.length) return shortlist;
  const byCandidateId = new Map(reviews.map((review) => [review.candidateId, review]));
  return shortlist.map((score) => {
    const review = byCandidateId.get(score.candidate.id);
    if (!review) return score;

    return {
      ...score,
      suggestedAction: review.suggestedAction || score.suggestedAction,
      auditNotes: [
        ...score.auditNotes,
        `AI agent reviewer note: ${review.recruiterNote}`,
        `AI outreach angle: ${review.outreachAngle}`,
        `AI risk flag: ${review.riskFlag}`,
        `AI review confidence: ${Math.round(review.confidence * 100)}%`
      ]
    };
  });
}
