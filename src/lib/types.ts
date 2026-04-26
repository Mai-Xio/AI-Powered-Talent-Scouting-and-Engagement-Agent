import { z } from "zod";

export const skillRequirementSchema = z.object({
  skill: z.string(),
  normalizedSkill: z.string(),
  importance: z.enum(["must", "nice"]),
  evidence: z.string(),
  weight: z.number().min(0).max(1)
});

export const jdProfileSchema = z.object({
  roleTitle: z.string(),
  seniority: z.enum(["intern", "junior", "mid", "senior", "staff", "lead", "manager"]),
  domain: z.string(),
  location: z.string(),
  workMode: z.enum(["remote", "hybrid", "onsite", "unspecified"]),
  responsibilities: z.array(z.string()),
  mustHaveSkills: z.array(skillRequirementSchema),
  niceToHaveSkills: z.array(skillRequirementSchema),
  constraints: z.object({
    minYears: z.number().nullable(),
    compensation: z.string().nullable(),
    dealbreakers: z.array(z.string())
  }),
  summary: z.string(),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string())
});

export type SkillRequirement = z.infer<typeof skillRequirementSchema>;
export type JDProfile = z.infer<typeof jdProfileSchema>;

export type SkillLevel = "working" | "advanced" | "expert";

export type SkillEvidence = {
  skill: string;
  normalizedSkill: string;
  years: number;
  lastUsed: number;
  level: SkillLevel;
  evidence: string;
};

export type CandidateProfile = {
  id: string;
  name: string;
  headline: string;
  location: string;
  workModes: Array<"remote" | "hybrid" | "onsite">;
  seniority: JDProfile["seniority"];
  yearsExperience: number;
  domains: string[];
  skills: SkillEvidence[];
  projects: Array<{
    name: string;
    summary: string;
    skills: string[];
    impact: string;
  }>;
  preferences: {
    roles: string[];
    locations: string[];
    workModes: Array<"remote" | "hybrid" | "onsite">;
    compensationMin?: number;
    openToRecruiter: number;
    availabilityWeeks: number;
    motivators: string[];
    concerns: string[];
  };
  persona: {
    responseStyle: string;
    strongestInterest: string;
    likelyObjection: string;
    closingSignal: string;
  };
};

export type ScoreFactor = {
  name: string;
  score: number;
  weight: number;
  reason: string;
};

export type EvidencePath = {
  jdSkill: string;
  candidateSkill: string;
  relation: "direct" | "alias" | "adjacent" | "missing";
  evidence: string;
  contribution: number;
};

export type OutreachTurn = {
  speaker: "agent" | "candidate";
  message: string;
};

export type InterestBreakdown = {
  openness: ScoreFactor;
  timeline: ScoreFactor;
  motivation: ScoreFactor;
  compensation: ScoreFactor;
  workMode: ScoreFactor;
  objectionRisk: ScoreFactor;
  specificity: ScoreFactor;
};

export type CandidateScore = {
  candidate: CandidateProfile;
  matchScore: number;
  interestScore: number;
  combinedScore: number;
  matchFactors: ScoreFactor[];
  interestFactors: ScoreFactor[];
  evidencePaths: EvidencePath[];
  transcript: OutreachTurn[];
  suggestedAction: string;
  auditNotes: string[];
};

export type AgentWeights = {
  match: number;
  interest: number;
};

export type AgentRunRequest = {
  jdText: string;
  searchMode?: "seeded" | "grounded" | "uploaded";
  weights?: AgentWeights;
  uploadedCandidates?: CandidateProfile[];
};

export type ModelBudgetLedger = {
  geminiRequests: number;
  openRouterRequests: number;
  cached: boolean;
  fallbacksUsed: string[];
  notes: string[];
  aiAgentUsed: boolean;
  models: {
    gemini: string;
    openRouter: string;
  };
  limits: {
    gemini: {
      rpm: number;
      tpm: number;
      rpd: number;
    };
    openRouter: {
      rpm: number;
      rpd: number;
    };
  };
  usage: {
    estimatedGeminiTokens: number;
    estimatedOpenRouterTokens: number;
  };
};

export type KnowledgeGraphNode = {
  id: string;
  label: string;
  type: "jd" | "candidate" | "skill" | "domain";
  score?: number;
};

export type KnowledgeGraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  strength: number;
};

export type AgentRunResult = {
  id: string;
  createdAt: string;
  durationMs: number;
  jdProfile: JDProfile;
  candidatesConsidered: number;
  shortlist: CandidateScore[];
  graph: {
    nodes: KnowledgeGraphNode[];
    edges: KnowledgeGraphEdge[];
  };
  modelBudget: ModelBudgetLedger;
  exports: {
    csv: string;
    json: string;
  };
};
