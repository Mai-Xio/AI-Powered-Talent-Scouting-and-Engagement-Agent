"use client";

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Download,
  FileJson,
  Gauge,
  GitBranch,
  Loader2,
  MessageSquareText,
  Network,
  Play,
  Search,
  Upload,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { AgentRunResult, CandidateProfile, CandidateScore } from "@/lib/types";
import { cn, formatScore } from "@/lib/utils";

type Sample = {
  id: string;
  title: string;
  text: string;
};

type Props = {
  samples: Sample[];
};

const stages = [
  { id: "parse", label: "Parse", icon: ClipboardList },
  { id: "discover", label: "Discover", icon: Search },
  { id: "match", label: "Match", icon: Gauge },
  { id: "outreach", label: "Outreach", icon: MessageSquareText },
  { id: "rank", label: "Rank", icon: Users }
];

export function RecruiterWorkspace({ samples }: Props) {
  const [jdText, setJdText] = useState(samples[0]?.text ?? "");
  const [weights, setWeights] = useState({ match: 60, interest: 40 });
  const [uploadedCandidates, setUploadedCandidates] = useState<CandidateProfile[]>([]);
  const [result, setResult] = useState<AgentRunResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"graph" | "transcript" | "audit">("graph");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [lastRunMs, setLastRunMs] = useState<number | null>(null);

  const selectedCandidate = result?.shortlist.find((item) => item.candidate.id === selectedId) ?? result?.shortlist[0] ?? null;
  const progressStage = isRunning ? "outreach" : result ? "rank" : "parse";
  const runTimeLabel = isRunning ? `Running ${formatDuration(elapsedMs)}` : lastRunMs ? `Last run ${formatDuration(lastRunMs)}` : "Ready";
  const agentStatus = result?.modelBudget.aiAgentUsed ? "AI agent used" : result ? "Fallback-safe run" : "Ready";

  useEffect(() => {
    if (!isRunning || !runStartedAt) return;
    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - runStartedAt);
    }, 250);
    return () => window.clearInterval(timer);
  }, [isRunning, runStartedAt]);

  async function runAgent() {
    const clientStartedAt = Date.now();
    setIsRunning(true);
    setError(null);
    setElapsedMs(0);
    setRunStartedAt(clientStartedAt);
    try {
      const response = await fetch("/api/run-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jdText,
          searchMode: uploadedCandidates.length ? "uploaded" : "seeded",
          weights: { match: weights.match, interest: weights.interest },
          uploadedCandidates
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Agent run failed.");
      }
      setResult(payload as AgentRunResult);
      setSelectedId((payload as AgentRunResult).shortlist[0]?.candidate.id ?? null);
      setLastRunMs((payload as AgentRunResult).durationMs || Date.now() - clientStartedAt);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Agent run failed.");
    } finally {
      setIsRunning(false);
      setRunStartedAt(null);
    }
  }

  function loadSample(id: string) {
    const sample = samples.find((item) => item.id === id);
    if (sample) {
      setJdText(sample.text);
      setResult(null);
      setSelectedId(null);
    }
  }

  function downloadExport(kind: "csv" | "json") {
    if (!result) return;
    const content = kind === "csv" ? result.exports.csv : result.exports.json;
    const blob = new Blob([content], { type: kind === "csv" ? "text/csv" : "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `recruiter-shortlist-${result.id}.${kind}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleCandidateUpload(file: File | null) {
    if (!file) return;
    const text = await file.text();
    const parsed = JSON.parse(text) as CandidateProfile[] | { candidates: CandidateProfile[] };
    const candidates = Array.isArray(parsed) ? parsed : parsed.candidates;
    setUploadedCandidates(candidates ?? []);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col gap-4 px-4 py-4 lg:px-6">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-white">
              <Bot size={20} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-normal text-ink">Recruiter Agent</h1>
              <p className="text-sm text-slate-600">JD to ranked candidate shortlist with match and interest evidence.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("metric-pill", isRunning ? "border-blue-200 bg-blue-50 text-cobalt" : "border-emerald-200 bg-emerald-50 text-spruce")}>
            {runTimeLabel}
          </span>
          <span className="metric-pill">{agentStatus}</span>
          <select
            aria-label="Sample job description"
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
            onChange={(event) => loadSample(event.target.value)}
            defaultValue={samples[0]?.id}
          >
            {samples.map((sample) => (
              <option key={sample.id} value={sample.id}>
                {sample.title}
              </option>
            ))}
          </select>
          <label className="secondary-button cursor-pointer">
            <Upload size={16} />
            Upload
            <input
              className="hidden"
              type="file"
              accept="application/json"
              onChange={(event) => handleCandidateUpload(event.target.files?.[0] ?? null)}
            />
          </label>
          <button className="primary-button" onClick={runAgent} disabled={isRunning}>
            {isRunning ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
            {isRunning ? "Running" : "Run"}
          </button>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4">
          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <SectionTitle step="1" title="Job Description" />
              <span className="metric-pill">{jdText.length} chars</span>
            </div>
            <textarea
              value={jdText}
              onChange={(event) => setJdText(event.target.value)}
              className="min-h-[420px] w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-cobalt focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <SectionTitle step="1A" title="Ranking Weights" />
              <span className="metric-pill">{uploadedCandidates.length ? `${uploadedCandidates.length} uploaded` : "Seeded corpus"}</span>
            </div>
            <WeightSlider label="Match" value={weights.match} onChange={(value) => setWeights({ match: value, interest: 100 - value })} />
            <WeightSlider label="Interest" value={weights.interest} onChange={(value) => setWeights({ match: 100 - value, interest: value })} />
          </div>
        </aside>

        <section className="flex min-w-0 flex-col gap-4">
          <Pipeline activeStage={progressStage} complete={Boolean(result)} loading={isRunning} elapsedMs={elapsedMs} result={result} />

          {error ? (
            <div className="panel flex items-center gap-3 border-rose-200 bg-rose-50 p-4 text-rosewood">
              <AlertTriangle size={18} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : null}

          <div className="grid gap-4 2xl:grid-cols-[minmax(360px,0.82fr)_minmax(540px,1.18fr)]">
            <div className="panel min-h-[650px] p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <SectionTitle step="3" title="Ranked Shortlist" size="lg" />
                  <p className="text-sm text-slate-600">
                    {result ? `${result.candidatesConsidered} candidates considered` : "Run the agent to score candidates"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="icon-button" aria-label="Download CSV" title="Download CSV" onClick={() => downloadExport("csv")} disabled={!result}>
                    <Download size={17} />
                  </button>
                  <button className="icon-button" aria-label="Download JSON" title="Download JSON" onClick={() => downloadExport("json")} disabled={!result}>
                    <FileJson size={17} />
                  </button>
                </div>
              </div>

              {result ? (
                <div className="space-y-3">
                  {result.shortlist.map((score, index) => (
                    <CandidateCard
                      key={score.candidate.id}
                      score={score}
                      rank={index + 1}
                      selected={selectedCandidate?.candidate.id === score.candidate.id}
                      onSelect={() => setSelectedId(score.candidate.id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>

            <div className="panel min-h-[650px] overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
                <div>
                  <SectionTitle step="4" title={selectedCandidate?.candidate.name ?? "Candidate Review"} size="lg" />
                  <p className="text-sm text-slate-600">{selectedCandidate?.candidate.headline ?? "Graph, transcript, and audit trail"}</p>
                </div>
                <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
                  <ViewButton active={activeView === "graph"} label="Evidence" icon={Network} onClick={() => setActiveView("graph")} />
                  <ViewButton active={activeView === "transcript"} label="Transcript" icon={MessageSquareText} onClick={() => setActiveView("transcript")} />
                  <ViewButton active={activeView === "audit"} label="Audit" icon={GitBranch} onClick={() => setActiveView("audit")} />
                </div>
              </div>
              <div className="h-[590px] overflow-auto p-4">
                {result && selectedCandidate && activeView === "graph" ? <EvidenceGraph result={result} selected={selectedCandidate} /> : null}
                {selectedCandidate && activeView === "transcript" ? <TranscriptPanel score={selectedCandidate} /> : null}
                {result && selectedCandidate && activeView === "audit" ? <AuditPanel result={result} score={selectedCandidate} /> : null}
                {!selectedCandidate ? <EmptyState /> : null}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function Pipeline({
  activeStage,
  complete,
  loading,
  elapsedMs,
  result
}: {
  activeStage: string;
  complete: boolean;
  loading: boolean;
  elapsedMs: number;
  result: AgentRunResult | null;
}) {
  const activeIndex = stages.findIndex((stage) => stage.id === activeStage);
  return (
    <div className="panel p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <SectionTitle step="2" title="Agent Run" />
          <p className="text-sm text-slate-600">
            {loading ? `Working for ${formatDuration(elapsedMs)}` : result ? `Completed in ${formatDuration(result.durationMs)}` : "Paste a JD and run the agent."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="metric-pill">Gemini JD parse</span>
          <span className="metric-pill">Nemotron review</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const done = complete || index < activeIndex;
          const active = index === activeIndex && loading;
          return (
            <div
              key={stage.id}
              className={cn(
                "flex min-h-14 items-center gap-3 rounded-md border px-3 py-2",
                done ? "border-emerald-200 bg-emerald-50 text-spruce" : active ? "border-blue-200 bg-blue-50 text-cobalt" : "border-slate-200 bg-white text-slate-500"
              )}
            >
              {active ? <Loader2 className="animate-spin" size={18} /> : done ? <CheckCircle2 size={18} /> : <Icon size={18} />}
              <span className="text-sm font-semibold">{stage.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionTitle({ step, title, size = "sm" }: { step: string; title: string; size?: "sm" | "lg" }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-ink px-1.5 text-[11px] font-bold text-white">
        {step}
      </span>
      <h2 className={cn("truncate font-semibold text-ink", size === "lg" ? "text-lg" : "text-sm uppercase tracking-wide text-slate-600")}>{title}</h2>
    </div>
  );
}

function WeightSlider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="mb-3 block">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-ink">{value}%</span>
      </div>
      <input
        type="range"
        min={10}
        max={90}
        step={5}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-cobalt"
      />
    </label>
  );
}

function CandidateCard({ score, rank, selected, onSelect }: { score: CandidateScore; rank: number; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border p-4 text-left transition hover:border-cobalt hover:bg-blue-50/40",
        selected ? "border-cobalt bg-blue-50" : "border-slate-200 bg-white"
      )}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink text-xs font-bold text-white">{rank}</span>
            <h3 className="truncate text-base font-semibold text-ink">{score.candidate.name}</h3>
          </div>
          <p className="mt-1 text-sm text-slate-600">{score.candidate.headline}</p>
        </div>
        <ScoreBadge label="Combined" value={score.combinedScore} tone="ink" />
      </div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        <ScoreBadge label="Match" value={score.matchScore} tone="blue" />
        <ScoreBadge label="Interest" value={score.interestScore} tone="green" />
        <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-700">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Location</div>
          <div className="truncate">{score.candidate.location}</div>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-800">{score.suggestedAction}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {score.evidencePaths
          .filter((path) => path.relation !== "missing")
          .slice(0, 4)
          .map((path) => (
            <span key={`${path.jdSkill}-${path.candidateSkill}`} className="metric-pill">
              {path.jdSkill}
            </span>
          ))}
      </div>
    </button>
  );
}

function ScoreBadge({ label, value, tone }: { label: string; value: number; tone: "ink" | "blue" | "green" }) {
  const classes = {
    ink: "bg-ink text-white",
    blue: "bg-blue-50 text-cobalt border-blue-100",
    green: "bg-emerald-50 text-spruce border-emerald-100"
  };
  return (
    <div className={cn("rounded-md border px-2 py-2 text-center", classes[tone])}>
      <div className="text-[11px] font-semibold uppercase tracking-wide opacity-75">{label}</div>
      <div className="text-lg font-bold leading-none">{formatScore(value)}</div>
    </div>
  );
}

function ViewButton({
  active,
  label,
  icon: Icon,
  onClick
}: {
  active: boolean;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition",
        active ? "bg-white text-ink shadow-sm" : "text-slate-600 hover:text-ink"
      )}
      onClick={onClick}
      type="button"
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function EvidenceGraph({ result, selected }: { result: AgentRunResult; selected: CandidateScore }) {
  const matched = selected.evidencePaths.filter((path) => path.relation !== "missing");
  const missing = selected.evidencePaths.filter((path) => path.relation === "missing");
  const topFactors = [...selected.matchFactors].sort((left, right) => right.weight - left.weight).slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <MiniMetric label="JD" value={result.jdProfile.roleTitle} />
        <MiniMetric label="Candidate" value={selected.candidate.name} />
        <MiniMetric label="Combined score" value={String(selected.combinedScore)} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Agent Path</h3>
        <div className="grid gap-2 md:grid-cols-5">
          {["JD parsed", "Candidates found", "Match scored", "Interest assessed", "Shortlist ranked"].map((step, index) => (
            <div key={step} className="rounded-md border border-blue-100 bg-blue-50 p-3 text-center text-sm font-semibold text-cobalt">
              <div className="mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-md bg-cobalt text-xs text-white">{index + 1}</div>
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Requirement Evidence</h3>
          <span className="metric-pill">{matched.length} matched / {selected.evidencePaths.length} checked</span>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="grid grid-cols-[1fr_110px_1.4fr_90px] bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            <div>JD requirement</div>
            <div>Relation</div>
            <div>Candidate evidence</div>
            <div>Credit</div>
          </div>
          {selected.evidencePaths.map((path) => (
            <div key={`${path.jdSkill}-${path.candidateSkill}`} className="grid grid-cols-[1fr_110px_1.4fr_90px] gap-3 border-t border-slate-200 px-3 py-3 text-sm">
              <div className="font-semibold text-ink">{path.jdSkill}</div>
              <div>
                <span
                  className={cn(
                    "inline-flex rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide",
                    path.relation === "direct"
                      ? "bg-emerald-50 text-spruce"
                      : path.relation === "adjacent"
                        ? "bg-blue-50 text-cobalt"
                        : "bg-rose-50 text-rosewood"
                  )}
                >
                  {path.relation}
                </span>
              </div>
              <div className="leading-6 text-slate-700">{path.evidence}</div>
              <div className="font-bold text-ink">{Math.round(path.contribution * 100)}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FactorList title="Match Drivers" factors={topFactors} />
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Gaps To Review</h3>
          {missing.length ? (
            <div className="space-y-2">
              {missing.map((path) => (
                <div key={path.jdSkill} className="rounded-md border border-rose-100 bg-rose-50 p-3 text-sm leading-6 text-rosewood">
                  <span className="font-semibold">{path.jdSkill}:</span> {path.evidence}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-spruce">
              No missing required evidence found in the current scoring pass.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TranscriptPanel({ score }: { score: CandidateScore }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amberline">
        Simulated outreach for prototype scoring.
      </div>
      {score.transcript.map((turn, index) => (
        <div key={`${turn.speaker}-${index}`} className={cn("flex", turn.speaker === "agent" ? "justify-start" : "justify-end")}>
          <div
            className={cn(
              "max-w-[86%] rounded-lg border p-3 text-sm leading-6",
              turn.speaker === "agent" ? "border-slate-200 bg-white text-slate-800" : "border-blue-200 bg-blue-50 text-slate-900"
            )}
          >
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">{turn.speaker}</div>
            {turn.message}
          </div>
        </div>
      ))}
      <FactorList title="Interest Factors" factors={score.interestFactors} />
    </div>
  );
}

function AuditPanel({ result, score }: { result: AgentRunResult; score: CandidateScore }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <MiniMetric label="Run ID" value={result.id} />
        <MiniMetric label="Gemini calls" value={String(result.modelBudget.geminiRequests)} />
        <MiniMetric label="OpenRouter calls" value={String(result.modelBudget.openRouterRequests)} />
        <MiniMetric label="Gemini model" value={result.modelBudget.models.gemini} />
        <MiniMetric label="OpenRouter model" value={result.modelBudget.models.openRouter} />
        <MiniMetric label="AI agent used" value={result.modelBudget.aiAgentUsed ? "Yes" : "Fallback"} />
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
        Rate guard: Gemini {result.modelBudget.limits.gemini.rpm} RPM / {result.modelBudget.limits.gemini.tpm.toLocaleString()} TPM / {result.modelBudget.limits.gemini.rpd} RPD; OpenRouter {result.modelBudget.limits.openRouter.rpm} RPM / {result.modelBudget.limits.openRouter.rpd} RPD.
      </div>
      <FactorList title="Match Factors" factors={score.matchFactors} />
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Evidence Paths</h3>
        <div className="space-y-2">
          {score.evidencePaths.map((path) => (
            <details key={`${path.jdSkill}-${path.candidateSkill}`} className="rounded-lg border border-slate-200 bg-white p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-slate-800">
                <span>{path.jdSkill} to {path.candidateSkill}</span>
                <ChevronDown size={16} />
              </summary>
              <p className="mt-2 text-sm leading-6 text-slate-600">{path.evidence}</p>
            </details>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Safety Notes</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          {[...score.auditNotes, ...result.modelBudget.fallbacksUsed, ...result.modelBudget.notes].map((note) => (
            <li key={note} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FactorList({ title, factors }: { title: string; factors: CandidateScore["matchFactors"] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="space-y-2">
        {factors.map((factor) => (
          <div key={factor.name} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-800">{factor.name}</span>
              <span className="text-sm font-bold text-ink">{factor.score}</span>
            </div>
            <div className="mb-2 h-2 overflow-hidden rounded bg-slate-100">
              <div className="h-full rounded bg-cobalt" style={{ width: `${factor.score}%` }} />
            </div>
            <p className="text-sm leading-6 text-slate-600">{factor.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 truncate text-sm font-bold text-ink">{value}</div>
    </div>
  );
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${Math.max(0, Math.round(ms))}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}m ${remainder}s`;
}

function EmptyState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <div>
        <Bot className="mx-auto mb-3 text-slate-400" size={32} />
        <p className="text-sm font-semibold text-slate-700">Agent output will appear here.</p>
      </div>
    </div>
  );
}
