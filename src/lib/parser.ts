import { extractKnownSkills, getSkill, labelForSkill } from "./skills";
import { JDProfile, jdProfileSchema, SkillRequirement } from "./types";

const senioritySignals: Array<[JDProfile["seniority"], RegExp]> = [
  ["staff", /\bstaff\b|\bprincipal\b/i],
  ["lead", /\blead\b|\bhead of\b/i],
  ["manager", /\bmanager\b|\bmanagement\b/i],
  ["senior", /\bsenior\b|\bsr\b/i],
  ["mid", /\bmid\b|\bintermediate\b/i],
  ["junior", /\bjunior\b|\bentry\b/i],
  ["intern", /\bintern\b|\binternship\b/i]
];

const workModeSignals: Array<[JDProfile["workMode"], RegExp]> = [
  ["remote", /\bremote\b|distributed/i],
  ["hybrid", /\bhybrid\b/i],
  ["onsite", /\bon[- ]?site\b|in office/i]
];

export function parseJobDescription(jdText: string): JDProfile {
  const text = jdText.trim();
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const roleTitle = inferRoleTitle(lines, text);
  const seniority = senioritySignals.find(([, regex]) => regex.test(text))?.[0] ?? "mid";
  const workMode = workModeSignals.find(([, regex]) => regex.test(text))?.[0] ?? "unspecified";
  const location = inferLocation(text);
  const skills = extractKnownSkills(text);
  const mustSection = extractSection(text, /must have|required skills|requirements/i, /nice to have|preferred|bonus|compensation|salary/i);
  const niceSection = extractSection(text, /nice to have|preferred|bonus|good to have/i, /compensation|salary|benefits|about us/i);
  const mustHaveSkills: SkillRequirement[] = [];
  const niceToHaveSkills: SkillRequirement[] = [];

  for (const skill of skills) {
    const evidence = skill.evidence || skill.label;
    const inMustSection = sectionContainsSkill(mustSection, skill.id);
    const inNiceSection = sectionContainsSkill(niceSection, skill.id);
    const isNice = (inNiceSection && !inMustSection) || /nice to have|preferred|bonus|plus|good to have/i.test(evidence);
    const requirement: SkillRequirement = {
      skill: labelForSkill(skill.id),
      normalizedSkill: skill.id,
      importance: isNice ? "nice" : "must",
      evidence,
      weight: isNice ? 0.45 : 1
    };
    if (isNice) {
      niceToHaveSkills.push(requirement);
    } else {
      mustHaveSkills.push(requirement);
    }
  }

  const responsibilities = inferResponsibilities(lines);
  const domain = inferDomain(text, roleTitle);
  const minYears = inferMinYears(text);
  const compensation = inferCompensation(text);
  const warnings: string[] = [];

  if (mustHaveSkills.length < 3) {
    warnings.push("The JD has few explicit must-have skills, so the agent leans more on adjacent skills and project evidence.");
  }
  if (workMode === "unspecified") {
    warnings.push("Work mode was not explicit; location fit receives a neutral score.");
  }

  const parsed = {
    roleTitle,
    seniority,
    domain,
    location,
    workMode,
    responsibilities,
    mustHaveSkills,
    niceToHaveSkills,
    constraints: {
      minYears,
      compensation,
      dealbreakers: inferDealbreakers(lines)
    },
    summary: `${roleTitle} in ${domain} with ${mustHaveSkills.length} core skills and ${niceToHaveSkills.length} bonus skills.`,
    confidence: Math.min(0.95, 0.55 + skills.length * 0.05 + responsibilities.length * 0.04),
    warnings
  };

  return jdProfileSchema.parse(parsed);
}

function inferRoleTitle(lines: string[], text: string): string {
  const titleLine = lines.find((line) => /engineer|developer|manager|recruiter|designer|analyst|architect|lead/i.test(line));
  if (titleLine && titleLine.length < 90) return cleanTitle(titleLine);

  const match = text.match(/(?:hiring|role|position|job title)[:\s-]+([^\n.]+)/i);
  if (match?.[1]) return cleanTitle(match[1]);

  return "AI Product Engineer";
}

function cleanTitle(title: string): string {
  return title
    .replace(/^#+\s*/, "")
    .replace(/^(job title|role|position)[:\s-]+/i, "")
    .trim();
}

function inferResponsibilities(lines: string[]): string[] {
  const responsibilityLines = lines.filter((line) =>
    /build|own|lead|design|partner|develop|ship|measure|improve|integrate|evaluate/i.test(line)
  );
  return responsibilityLines.slice(0, 6).map((line) => line.replace(/^[-*]\s*/, ""));
}

function inferDomain(text: string, roleTitle: string): string {
  const joined = `${roleTitle} ${text}`.toLowerCase();
  if (/recruit|talent|candidate|ats|hiring/.test(joined)) return "HR Tech";
  if (/health|clinical|patient/.test(joined)) return "Health Tech";
  if (/fintech|payment|bank|risk/.test(joined)) return "Fintech";
  if (/support|knowledge base|ticket/.test(joined)) return "Customer Support AI";
  if (/ai|llm|rag|machine learning|semantic/.test(joined)) return "AI";
  return "B2B SaaS";
}

function inferLocation(text: string): string {
  const locationMatch = text.match(/\b(?:location|based in|office)[:\s-]+([^\n.]+)/i);
  if (locationMatch?.[1]) return locationMatch[1].trim();
  const city = text.match(/\b(Bengaluru|Bangalore|Pune|London|Berlin|Austin|Toronto|Remote|India|US|UK|Europe)\b/i);
  return city?.[1] ?? "Unspecified";
}

function inferMinYears(text: string): number | null {
  const match = text.match(/(\d+)\+?\s*(?:years|yrs)/i);
  return match?.[1] ? Number(match[1]) : null;
}

function inferCompensation(text: string): string | null {
  const match = text.match(/(?:salary|compensation|pay|range)[:\s-]+([^\n.]+)/i);
  return match?.[1]?.trim() ?? null;
}

function inferDealbreakers(lines: string[]): string[] {
  return lines
    .filter((line) => /must be|requirement|dealbreaker|only/i.test(line))
    .slice(0, 4)
    .map((line) => line.replace(/^[-*]\s*/, ""));
}

function extractSection(text: string, start: RegExp, end: RegExp): string {
  const startMatch = start.exec(text);
  if (!startMatch || startMatch.index === undefined) return "";
  const startIndex = startMatch.index + startMatch[0].length;
  const rest = text.slice(startIndex);
  const endMatch = end.exec(rest);
  return endMatch && endMatch.index !== undefined ? rest.slice(0, endMatch.index) : rest;
}

function sectionContainsSkill(section: string, skillId: string): boolean {
  const skill = getSkill(skillId);
  if (!skill || !section) return false;
  const lower = section.toLowerCase();
  return [skill.label, ...skill.aliases].some((term) => lower.includes(term.toLowerCase()));
}
