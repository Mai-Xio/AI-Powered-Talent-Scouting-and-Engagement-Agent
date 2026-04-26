import { describe, expect, it } from "vitest";
import { runRecruiterAgent } from "@/lib/agent";
import { sampleJds } from "@/lib/samples";

describe("agent exports", () => {
  it("returns CSV and JSON exports for a full run", async () => {
    const result = await runRecruiterAgent({ jdText: sampleJds[0].text });

    expect(result.exports.csv).toContain("rank,candidate,headline");
    expect(result.exports.csv).toContain("Maya Shah");
    expect(JSON.parse(result.exports.json).jdProfile.roleTitle).toContain("Senior AI Product Engineer");
  });
});
