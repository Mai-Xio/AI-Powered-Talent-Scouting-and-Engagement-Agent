import { describe, expect, it } from "vitest";
import { parseJobDescription } from "@/lib/parser";
import { sampleJds } from "@/lib/samples";

describe("parseJobDescription", () => {
  it("extracts structured fields and normalized skills from a recruiter AI JD", () => {
    const parsed = parseJobDescription(sampleJds[0].text);

    expect(parsed.roleTitle).toContain("Senior AI Product Engineer");
    expect(parsed.seniority).toBe("senior");
    expect(parsed.domain).toBe("HR Tech");
    expect(parsed.workMode).toBe("remote");
    expect(parsed.mustHaveSkills.map((skill) => skill.normalizedSkill)).toContain("rag");
    expect(parsed.mustHaveSkills.map((skill) => skill.normalizedSkill)).toContain("vector-search");
    expect(parsed.niceToHaveSkills.map((skill) => skill.normalizedSkill)).toContain("fastapi");
  });
});
