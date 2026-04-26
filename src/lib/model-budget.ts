import type { ModelBudgetLedger } from "./types";
import { createHash } from "node:crypto";

const memoryCache = new Map<string, unknown>();
const ONE_MINUTE = 60_000;
const ONE_DAY = 24 * 60 * 60_000;

type Provider = "gemini" | "openRouter";

type ProviderWindow = {
  minuteStartedAt: number;
  minuteRequests: number;
  dayStartedAt: number;
  dayRequests: number;
  minuteTokens: number;
};

const providerWindows: Record<Provider, ProviderWindow> = {
  gemini: createWindow(),
  openRouter: createWindow()
};

export function createLedger(): ModelBudgetLedger {
  const config = getModelBudgetConfig();
  return {
    geminiRequests: 0,
    openRouterRequests: 0,
    cached: false,
    fallbacksUsed: [],
    aiAgentUsed: false,
    models: {
      gemini: config.gemini.model,
      openRouter: config.openRouter.model
    },
    limits: {
      gemini: {
        rpm: config.gemini.rpm,
        tpm: config.gemini.tpm,
        rpd: config.gemini.rpd
      },
      openRouter: {
        rpm: config.openRouter.rpm,
        rpd: config.openRouter.rpd
      }
    },
    usage: {
      estimatedGeminiTokens: 0,
      estimatedOpenRouterTokens: 0
    },
    notes: [
      "Gemini is reserved for structured JD extraction; deterministic parsing validates and backs it up.",
      "OpenRouter Nemotron is reserved for one shortlist-review agent call per uncached run.",
      `Configured limits: Gemini ${config.gemini.rpm} RPM / ${config.gemini.tpm.toLocaleString()} TPM / ${config.gemini.rpd} RPD; OpenRouter free ${config.openRouter.rpm} RPM / ${config.openRouter.rpd} RPD.`
    ]
  };
}

export async function sha256(input: string): Promise<string> {
  return createHash("sha256").update(input).digest("hex");
}

export function getCached<T>(key: string): T | null {
  return (memoryCache.get(key) as T | undefined) ?? null;
}

export function setCached<T>(key: string, value: T): T {
  memoryCache.set(key, value);
  return value;
}

export function getModelBudgetConfig() {
  return {
    gemini: {
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
      rpm: toPositiveInt(process.env.GEMINI_RATE_LIMIT_RPM, 15),
      tpm: toPositiveInt(process.env.GEMINI_RATE_LIMIT_TPM, 250_000),
      rpd: toPositiveInt(process.env.GEMINI_RATE_LIMIT_RPD, 500)
    },
    openRouter: {
      model: process.env.OPENROUTER_MODEL ?? "nvidia/nemotron-3-super-120b-a12b:free",
      rpm: toPositiveInt(process.env.OPENROUTER_RATE_LIMIT_RPM, 20),
      rpd: toPositiveInt(process.env.OPENROUTER_RATE_LIMIT_RPD, 50)
    },
    timeoutMs: {
      gemini: toPositiveInt(process.env.GEMINI_TIMEOUT_MS, 12_000),
      openRouter: toPositiveInt(process.env.OPENROUTER_TIMEOUT_MS, 25_000)
    }
  };
}

export function reserveModelCall(provider: Provider, estimatedTokens: number, ledger: ModelBudgetLedger): boolean {
  const config = getModelBudgetConfig();
  const now = Date.now();
  const window = providerWindows[provider];
  resetWindowIfNeeded(window, now);

  const providerConfig = config[provider];
  if (window.minuteRequests + 1 > providerConfig.rpm) {
    ledger.fallbacksUsed.push(`${providerLabel(provider)} skipped to protect the ${providerConfig.rpm} RPM limit.`);
    return false;
  }

  if (window.dayRequests + 1 > providerConfig.rpd) {
    ledger.fallbacksUsed.push(`${providerLabel(provider)} skipped to protect the ${providerConfig.rpd} RPD limit.`);
    return false;
  }

  if (provider === "gemini" && window.minuteTokens + estimatedTokens > config.gemini.tpm) {
    ledger.fallbacksUsed.push(`Gemini skipped to protect the ${config.gemini.tpm.toLocaleString()} TPM limit.`);
    return false;
  }

  window.minuteRequests += 1;
  window.dayRequests += 1;
  window.minuteTokens += estimatedTokens;

  if (provider === "gemini") {
    ledger.geminiRequests += 1;
    ledger.usage.estimatedGeminiTokens += estimatedTokens;
  } else {
    ledger.openRouterRequests += 1;
    ledger.usage.estimatedOpenRouterTokens += estimatedTokens;
  }

  return true;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function createWindow(): ProviderWindow {
  const now = Date.now();
  return {
    minuteStartedAt: now,
    minuteRequests: 0,
    dayStartedAt: now,
    dayRequests: 0,
    minuteTokens: 0
  };
}

function resetWindowIfNeeded(window: ProviderWindow, now: number) {
  if (now - window.minuteStartedAt >= ONE_MINUTE) {
    window.minuteStartedAt = now;
    window.minuteRequests = 0;
    window.minuteTokens = 0;
  }
  if (now - window.dayStartedAt >= ONE_DAY) {
    window.dayStartedAt = now;
    window.dayRequests = 0;
  }
}

function toPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function providerLabel(provider: Provider): string {
  return provider === "gemini" ? "Gemini" : "OpenRouter";
}
