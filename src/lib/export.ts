import type { AgentRunResult, CandidateScore } from "./types";

export function toShortlistCsv(shortlist: CandidateScore[]): string {
  const rows = [
    [
      "rank",
      "candidate",
      "headline",
      "location",
      "match_score",
      "interest_score",
      "combined_score",
      "suggested_action",
      "top_evidence"
    ]
  ];

  shortlist.forEach((score, index) => {
    rows.push([
      String(index + 1),
      score.candidate.name,
      score.candidate.headline,
      score.candidate.location,
      String(score.matchScore),
      String(score.interestScore),
      String(score.combinedScore),
      score.suggestedAction,
      score.evidencePaths
        .filter((path) => path.relation !== "missing")
        .slice(0, 3)
        .map((path) => `${path.jdSkill}:${path.evidence}`)
        .join(" | ")
    ]);
  });

  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

export function toResultJson(result: Omit<AgentRunResult, "exports">): string {
  return JSON.stringify(result, null, 2);
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
