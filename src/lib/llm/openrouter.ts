import { z } from "zod";
import { estimateTokens, fetchWithTimeout, getModelBudgetConfig, reserveModelCall } from "../model-budget";
import type { CandidateScore, JDProfile, ModelBudgetLedger } from "../types";

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const shortlistReviewSchema = z.object({
  reviews: z.array(
    z.object({
      candidateId: z.string(),
      recruiterNote: z.string(),
      outreachAngle: z.string(),
      riskFlag: z.string(),
      suggestedAction: z.string(),
      confidence: z.number().min(0).max(1)
    })
  )
});

export type ShortlistAgentReview = z.infer<typeof shortlistReviewSchema>["reviews"][number];

export async function reviewShortlistWithOpenRouter(
  jd: JDProfile,
  shortlist: CandidateScore[],
  ledger: ModelBudgetLedger
): Promise<ShortlistAgentReview[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (process.env.NODE_ENV === "test") {
    ledger.fallbacksUsed.push("OpenRouter disabled in tests; used deterministic explanations.");
    return [];
  }
  if (!apiKey) {
    ledger.fallbacksUsed.push("OpenRouter key missing; used deterministic explanations.");
    return [];
  }

  const payload = JSON.stringify({
    jd: {
      roleTitle: jd.roleTitle,
      seniority: jd.seniority,
      domain: jd.domain,
      location: jd.location,
      workMode: jd.workMode,
      mustHaveSkills: jd.mustHaveSkills,
      niceToHaveSkills: jd.niceToHaveSkills,
      constraints: jd.constraints
    },
    candidates: shortlist.slice(0, 6).map((score) => ({
      candidateId: score.candidate.id,
      name: score.candidate.name,
      headline: score.candidate.headline,
      matchScore: score.matchScore,
      interestScore: score.interestScore,
      combinedScore: score.combinedScore,
      suggestedAction: score.suggestedAction,
      evidencePaths: score.evidencePaths.slice(0, 8),
      matchFactors: score.matchFactors,
      interestFactors: score.interestFactors,
      transcript: score.transcript
    }))
  });

  const config = getModelBudgetConfig();
  const estimatedTokens = estimateTokens(payload) + 1_500;
  if (!reserveModelCall("openRouter", estimatedTokens, ledger)) {
    return [];
  }

  try {
    const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Recruiter Agent Prototype"
      },
      body: JSON.stringify({
        model: config.openRouter.model,
        messages: [
          {
            role: "system",
            content: [
              "You are the Shortlist Review Agent for a recruiter decision-support app.",
              "Use only the provided JD, scores, evidence paths, and simulated transcript.",
              "Do not use or infer protected attributes.",
              "Do not reject candidates. Give recruiter-facing review notes, risk flags, and outreach angles.",
              "Return only valid JSON with this shape: {\"reviews\":[{\"candidateId\":\"...\",\"recruiterNote\":\"...\",\"outreachAngle\":\"...\",\"riskFlag\":\"...\",\"suggestedAction\":\"...\",\"confidence\":0.0}]}"
            ].join(" ")
          },
          {
            role: "user",
            content: payload
          }
        ],
        max_tokens: 1400,
        temperature: 0.15
      })
    }, config.timeoutMs.openRouter);

    if (!response.ok) {
      ledger.fallbacksUsed.push(`OpenRouter shortlist review failed with ${response.status}; used deterministic review notes.`);
      return [];
    }

    const data = (await response.json()) as OpenRouterResponse;
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      ledger.fallbacksUsed.push("OpenRouter shortlist review returned no content; used deterministic review notes.");
      return [];
    }

    const parsed = shortlistReviewSchema.parse(JSON.parse(extractJson(text)));
    ledger.aiAgentUsed = true;
    ledger.notes.push(`OpenRouter Shortlist Review Agent used ${config.openRouter.model} for recruiter notes and outreach strategy.`);
    return parsed.reviews;
  } catch (error) {
    ledger.fallbacksUsed.push(error instanceof Error && error.name === "AbortError" ? "OpenRouter shortlist review timed out; used deterministic review notes." : "OpenRouter shortlist review threw or returned invalid JSON; used deterministic review notes.");
    return [];
  }
}

export async function polishTopCandidateExplanation(score: CandidateScore, ledger: ModelBudgetLedger): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (process.env.NODE_ENV === "test") {
    ledger.fallbacksUsed.push("OpenRouter disabled in tests; used deterministic explanations.");
    return null;
  }
  if (!apiKey) {
    ledger.fallbacksUsed.push("OpenRouter key missing; used deterministic explanations.");
    return null;
  }

  try {
    const config = getModelBudgetConfig();
    const estimatedTokens = estimateTokens(JSON.stringify(score.evidencePaths.slice(0, 4))) + 500;
    if (!reserveModelCall("openRouter", estimatedTokens, ledger)) {
      return null;
    }

    const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Recruiter Agent Prototype"
      },
      body: JSON.stringify({
        model: config.openRouter.model,
        messages: [
          {
            role: "system",
            content: "Write a concise recruiter-facing explanation. Do not mention protected attributes. Do not invent facts."
          },
          {
            role: "user",
            content: JSON.stringify({
              candidate: score.candidate.name,
              matchScore: score.matchScore,
              interestScore: score.interestScore,
              evidence: score.evidencePaths.slice(0, 4)
            })
          }
        ],
        max_tokens: 180,
        temperature: 0.2
      })
    }, config.timeoutMs.openRouter);

    if (!response.ok) {
      ledger.fallbacksUsed.push(`OpenRouter explanation failed with ${response.status}; used deterministic explanations.`);
      return null;
    }

    const data = (await response.json()) as OpenRouterResponse;
    return data.choices?.[0]?.message?.content ?? null;
  } catch (error) {
    ledger.fallbacksUsed.push(error instanceof Error && error.name === "AbortError" ? "OpenRouter explanation timed out; used deterministic explanations." : "OpenRouter explanation threw an error; used deterministic explanations.");
    return null;
  }
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? trimmed;
}
