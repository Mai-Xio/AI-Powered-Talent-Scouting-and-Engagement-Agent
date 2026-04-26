import { describe, expect, it } from "vitest";
import { seededCandidates } from "@/lib/candidates";
import { parseJobDescription } from "@/lib/parser";
import { discoverCandidates, scoreCandidate } from "@/lib/scoring";
import { sampleJds } from "@/lib/samples";

describe("candidate scoring", () => {
  it("keeps the intended HR AI candidates near the top", () => {
    const jd = parseJobDescription(sampleJds[0].text);
    const discovered = discoverCandidates(jd, seededCandidates, 8);
    const ranked = discovered
      .map((candidate) => scoreCandidate(candidate, jd))
      .sort((left, right) => right.combinedScore - left.combinedScore);

    expect(ranked.slice(0, 3).map((score) => score.candidate.name)).toContain("Maya Shah");
    expect(ranked[0].matchScore).toBeGreaterThanOrEqual(80);
    expect(ranked[0].evidencePaths.some((path) => path.relation === "direct")).toBe(true);
  });

  it("uses adjacent skills without giving full direct-match credit", () => {
    const jd = parseJobDescription(sampleJds[1].text);
    const maya = seededCandidates.find((candidate) => candidate.id === "maya-shah");
    expect(maya).toBeDefined();

    const score = scoreCandidate(maya!, jd);
    expect(score.evidencePaths.some((path) => path.relation === "adjacent")).toBe(true);
    expect(score.matchScore).toBeLessThan(90);
  });
});
