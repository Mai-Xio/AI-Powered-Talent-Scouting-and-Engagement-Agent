import { jdProfileSchema, type JDProfile, type ModelBudgetLedger } from "../types";
import { estimateTokens, fetchWithTimeout, getModelBudgetConfig, reserveModelCall } from "../model-budget";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

export async function parseWithGemini(jdText: string, fallback: JDProfile, ledger: ModelBudgetLedger): Promise<JDProfile> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (process.env.NODE_ENV === "test") {
    ledger.fallbacksUsed.push("Gemini disabled in tests; used deterministic JD parser.");
    return fallback;
  }
  if (!apiKey) {
    ledger.fallbacksUsed.push("Gemini key missing; used deterministic JD parser.");
    return fallback;
  }

  try {
    const config = getModelBudgetConfig();
    const estimatedTokens = estimateTokens(jdText) + 900;
    if (!reserveModelCall("gemini", estimatedTokens, ledger)) {
      return fallback;
    }

    const model = config.gemini.model;
    const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are the JD Parser Agent in a recruiter decision-support system. Extract this job description into strict JSON matching the schema. Use only the JD text. Do not infer protected attributes. Normalize skills to concise kebab-case identifiers. If evidence is weak, keep the deterministic fallback semantics. JD:\n\n${jdText}`
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              roleTitle: { type: "string" },
              seniority: { type: "string", enum: ["intern", "junior", "mid", "senior", "staff", "lead", "manager"] },
              domain: { type: "string" },
              location: { type: "string" },
              workMode: { type: "string", enum: ["remote", "hybrid", "onsite", "unspecified"] },
              responsibilities: { type: "array", items: { type: "string" } },
              mustHaveSkills: { type: "array", items: skillSchema },
              niceToHaveSkills: { type: "array", items: skillSchema },
              constraints: {
                type: "object",
                properties: {
                  minYears: { type: "number", nullable: true },
                  compensation: { type: "string", nullable: true },
                  dealbreakers: { type: "array", items: { type: "string" } }
                }
              },
              summary: { type: "string" },
              confidence: { type: "number" },
              warnings: { type: "array", items: { type: "string" } }
            },
            required: ["roleTitle", "seniority", "domain", "location", "workMode", "responsibilities", "mustHaveSkills", "niceToHaveSkills", "constraints", "summary", "confidence", "warnings"]
          }
        }
      })
    }, config.timeoutMs.gemini);

    if (!response.ok) {
      ledger.fallbacksUsed.push(`Gemini parse failed with ${response.status}; used deterministic JD parser.`);
      return fallback;
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      ledger.fallbacksUsed.push("Gemini returned no text; used deterministic JD parser.");
      return fallback;
    }

    return jdProfileSchema.parse(JSON.parse(text));
  } catch (error) {
    ledger.fallbacksUsed.push(error instanceof Error && error.name === "AbortError" ? "Gemini parse timed out; used deterministic JD parser." : "Gemini parse threw an error; used deterministic JD parser.");
    return fallback;
  }
}

const skillSchema = {
  type: "object",
  properties: {
    skill: { type: "string" },
    normalizedSkill: { type: "string" },
    importance: { type: "string", enum: ["must", "nice"] },
    evidence: { type: "string" },
    weight: { type: "number" }
  },
  required: ["skill", "normalizedSkill", "importance", "evidence", "weight"]
};
