import { describe, expect, it } from "vitest";
import { runRecruiterAgent } from "@/lib/agent";
import { sampleJds } from "@/lib/samples";

describe("runRecruiterAgent", () => {
  it("runs without model keys by using deterministic fallbacks", async () => {
    const result = await runRecruiterAgent({
      jdText: sampleJds[0].text,
      weights: { match: 60, interest: 40 }
    });

    expect(result.shortlist.length).toBeGreaterThan(0);
    expect(result.modelBudget.fallbacksUsed.join(" ")).toContain("deterministic JD parser");
    expect(result.graph.nodes.some((node) => node.type === "jd")).toBe(true);
  });
});
