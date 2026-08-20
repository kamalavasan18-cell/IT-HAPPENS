import { useMemo, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { AlertCircle, ArrowRight, BarChart3, CheckCircle2, FileText, Link2, RefreshCw, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { analyzeEvidence, getSampleInputs, type EvidenceField, type EvidenceReport, type RequirementStatus } from "@shared/evidence";

type View = "overview" | "graph" | "trust";

const statusStyles: Record<RequirementStatus | EvidenceField["status"], string> = {
  STRONG: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  WEAK: "bg-amber-50 text-amber-700 ring-amber-200",
  MISSING: "bg-rose-50 text-rose-700 ring-rose-200",
  AMBIGUOUS: "bg-violet-50 text-violet-700 ring-violet-200",
  FOUND: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  UNPARSEABLE: "bg-slate-100 text-slate-600 ring-slate-200",
};

const statusLabels: Record<RequirementStatus | EvidenceField["status"], string> = {
  STRONG: "Strong",
  WEAK: "Partial",
  MISSING: "Missing",
  AMBIGUOUS: "Ambiguous",
  FOUND: "Verified",
  UNPARSEABLE: "Unparseable",
};

function StatusPill({ status }: { status: RequirementStatus | EvidenceField["status"] }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusStyles[status]}`}>{statusLabels[status]}</span>;
}

function ScoreRing({ score }: { score: number }) {
  return <div className="relative grid size-40 place-items-center rounded-full" style={{ background: `conic-gradient(#0f766e ${score * 3.6}deg, #e2e8f0 0deg)` }}><div className="grid size-32 place-items-center rounded-full bg-white shadow-inner"><div className="text-center"><div className="font-display text-4xl font-semibold tracking-tight text-slate-950">{score}</div><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">fit score</div></div></div></div>;
}

function EmptyState({ onSample }: { onSample: () => void }) {
  return <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center shadow-sm"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Sparkles className="size-6" /></div><h2 className="mt-5 font-display text-2xl font-semibold text-slate-950">Your evidence room is ready</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Add a resume and a role brief to see deterministic field extraction, requirement links, and a transparent fit score.</p><button onClick={onSample} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 active:scale-[.98]"><Sparkles className="size-4" />Load a sample analysis</button></div>;
}

export default function Home() {
  const { user } = useAuth();
  const sample = useMemo(() => getSampleInputs(), []);
  const [resume, setResume] = useState("");
  const [job, setJob] = useState("");
  const [report, setReport] = useState<EvidenceReport | null>(null);
  const [view, setView] = useState<View>("overview");
  const [inputError, setInputError] = useState("");
  const [fileNotice, setFileNotice] = useState("");
  const resumeFileRef = useRef<HTMLInputElement>(null);

  const runAnalysis = () => {
    if (!resume.trim() || !job.trim()) {
      setInputError("Add both a resume and a role brief before running analysis.");
      setReport(null);
      return;
    }
    setInputError("");
    setReport(analyzeEvidence(resume, job));
    setView("overview");
  };

  const loadSample = () => {
    setResume(sample.resume);
    setJob(sample.job);
    setReport(analyzeEvidence(sample.resume, sample.job));
    setInputError("");
    setFileNotice("");
    setView("overview");
  };

  const handleResumeFile = async (file?: File) => {
    if (!file) return;
    const supported = /\.(txt|md|text|csv)$/i.test(file.name) || file.type.startsWith("text/");
    if (!supported) {
      setFileNotice("This prototype only parses text-based files. PDF and DOCX inputs are reported as UNPARSEABLE rather than guessed.");
      return;
    }
    if (file.size > 2_000_000) {
      setFileNotice("Files are limited to 2 MB for safe browser analysis.");
      return;
    }
    setResume(await file.text());
    setFileNotice(`${file.name} loaded. Review the text, then run analysis.`);
  };

  return <div className="min-h-screen bg-[#f7f8f5] text-slate-900">
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-[#f7f8f5]/90 backdrop-blur-xl"><div className="container flex h-16 items-center justify-between gap-6"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-900/10"><ShieldCheck className="size-5" /></div><div><div className="font-display text-lg font-semibold tracking-tight">Evidence OS</div><div className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:block">Decision-grade hiring signals</div></div></div><div className="flex items-center gap-2"><span className="hidden items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200 sm:flex"><span className="size-1.5 rounded-full bg-emerald-500" />Local deterministic mode</span>{user ? <div className="grid size-9 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">{(user.name ?? "U").slice(0, 1).toUpperCase()}</div> : <button onClick={() => startLogin()} className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950 sm:block">Sign in</button>}</div></div></header>
    <main className="container py-8 lg:py-12">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-end"><div><div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-teal-800"><span className="size-1.5 rounded-full bg-teal-600" />Evidence-first workspace</div><h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-slate-950 sm:text-6xl">Make the hiring signal <span className="text-teal-700">traceable.</span></h1><p className="mt-5 max-w-xl text-base leading-7 text-slate-600">Turn a resume and role brief into a reviewable evidence graph. No inferred claims, no black-box ranking—just retained source text and repeatable logic.</p></div><div className="grid grid-cols-3 gap-3 rounded-3xl border border-slate-200 bg-white/75 p-4 shadow-sm"><div className="rounded-2xl bg-slate-950 p-4 text-white"><BarChart3 className="mb-8 size-5 text-teal-300" /><div className="font-display text-2xl font-semibold">10</div><div className="mt-1 text-xs text-slate-400">evidence fields</div></div><div className="rounded-2xl bg-teal-50 p-4 text-teal-950"><Link2 className="mb-8 size-5 text-teal-700" /><div className="font-display text-2xl font-semibold">1:1</div><div className="mt-1 text-xs text-teal-800/70">claim to source</div></div><div className="rounded-2xl bg-amber-50 p-4 text-amber-950"><RefreshCw className="mb-8 size-5 text-amber-700" /><div className="font-display text-2xl font-semibold">0</div><div className="mt-1 text-xs text-amber-800/70">hidden inferences</div></div></div></section>
      <section className="mt-10 grid gap-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,.06)] lg:grid-cols-2 lg:p-6"><div><div className="mb-3 flex items-center justify-between"><label htmlFor="resume" className="flex items-center gap-2 text-sm font-bold text-slate-900"><FileText className="size-4 text-teal-700" />Candidate resume</label><button onClick={() => resumeFileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><Upload className="size-3.5" />Upload text</button><input ref={resumeFileRef} type="file" accept=".txt,.md,.text,.csv" className="hidden" onChange={event => handleResumeFile(event.target.files?.[0])} /></div><textarea id="resume" value={resume} onChange={event => setResume(event.target.value)} placeholder="Paste resume text here…" className="min-h-64 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10" />{fileNotice && <p className="mt-2 text-xs font-medium text-amber-700">{fileNotice}</p>}</div><div><div className="mb-3 flex items-center justify-between"><label htmlFor="job" className="flex items-center gap-2 text-sm font-bold text-slate-900"><Sparkles className="size-4 text-amber-600" />Role brief</label><span className="text-xs text-slate-400">Paste requirements or a job description</span></div><textarea id="job" value={job} onChange={event => setJob(event.target.value)} placeholder="Paste the role brief here…" className="min-h-64 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><button onClick={loadSample} className="text-xs font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-teal-700">Use sample inputs</button><button onClick={runAnalysis} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-teal-800 active:scale-[.98]">Analyze evidence <ArrowRight className="size-4" /></button></div></div>{inputError && <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 lg:col-span-2"><AlertCircle className="size-4 shrink-0" />{inputError}</div>}</section>
      {!report ? <div className="mt-8"><EmptyState onSample={loadSample} /></div> : <section className="mt-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_50px_rgba(15,23,42,.06)]"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5 lg:p-6"><div><div className="flex items-center gap-3"><h2 className="font-display text-2xl font-semibold tracking-tight text-slate-950">{report.candidate.name}</h2><StatusPill status={report.trust.parserHealth === "HEALTHY" ? "FOUND" : "AMBIGUOUS"} /></div><p className="mt-1 text-sm text-slate-500">Analysis fingerprint <span className="font-mono text-xs text-slate-700">{report.fingerprint}</span></p></div><div className="flex rounded-xl bg-slate-100 p-1"><button onClick={() => setView("overview")} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${view === "overview" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>Overview</button><button onClick={() => setView("graph")} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${view === "graph" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>Evidence graph</button><button onClick={() => setView("trust")} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${view === "trust" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>Trust center</button></div></div>{view === "overview" && <div className="grid gap-8 p-5 lg:grid-cols-[220px_1fr] lg:p-8"><div className="flex flex-col items-center"><ScoreRing score={report.score} /><p className="mt-4 text-center text-xs leading-5 text-slate-500">A weighted score from <strong className="text-slate-700">retained resume evidence</strong>, not model confidence.</p></div><div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-teal-50 p-4"><div className="text-xs font-semibold text-teal-800">Evidence coverage</div><div className="mt-2 font-display text-3xl font-semibold text-teal-950">{report.trust.coverage}%</div></div><div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs font-semibold text-slate-600">Supported claims</div><div className="mt-2 font-display text-3xl font-semibold text-slate-950">{report.trust.supportedClaims}<span className="text-base text-slate-400">/{report.requirements.length}</span></div></div><div className="rounded-2xl bg-amber-50 p-4"><div className="text-xs font-semibold text-amber-800">Why not 100</div><div className="mt-2 font-display text-3xl font-semibold text-amber-950">{report.trust.unsupportedClaims}</div></div></div><div className="mt-7"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900">Requirement readout</h3><button onClick={() => setView("graph")} className="text-xs font-semibold text-teal-700 hover:text-teal-900">Open graph <ArrowRight className="ml-1 inline size-3" /></button></div><div className="space-y-2">{report.requirements.slice(0, 6).map(item => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3"><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-800">{item.label}</div><div className="mt-0.5 truncate text-xs text-slate-500">{item.evidence}</div></div><StatusPill status={item.status} /></div>)}</div></div></div></div>}{view === "graph" && <div className="grid gap-4 p-5 lg:grid-cols-2 lg:p-8">{report.links.map(link => <div key={link.requirementId} className="relative rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><div className="font-semibold text-slate-900">{link.requirement}</div><StatusPill status={link.status} /></div><div className="my-3 h-px bg-slate-100" /><div className="flex items-start gap-3"><div className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${link.status === "MISSING" ? "bg-rose-50 text-rose-600" : "bg-teal-50 text-teal-700"}`}><Link2 className="size-3.5" /></div><p className="text-sm leading-6 text-slate-600">{link.evidence}</p></div></div>)}{report.links.length === 0 && <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500 lg:col-span-2">No explicit requirements were found in the role brief. Add requirement language or known skill terms to create the graph.</div>}</div>}{view === "trust" && <div className="grid gap-8 p-5 lg:grid-cols-[1fr_1.2fr] lg:p-8"><div className="rounded-2xl bg-slate-950 p-6 text-white"><div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-teal-300" />Trust contract</div><p className="mt-4 text-sm leading-6 text-slate-300">Every displayed claim is linked to a deterministic extractor and a retained source excerpt. Re-running this input produces the same fingerprint.</p><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/10 p-3"><div className="text-xs text-slate-400">Determinism</div><div className="mt-1 font-semibold text-teal-300">{report.determinism.status}</div></div><div className="rounded-xl bg-white/10 p-3"><div className="text-xs text-slate-400">Parser health</div><div className="mt-1 font-semibold text-teal-300">{report.trust.parserHealth}</div></div></div></div><div><h3 className="text-sm font-bold text-slate-900">Field health</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{report.fields.map(item => <div key={item.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5"><div className="flex min-w-0 items-center gap-2"><CheckCircle2 className={`size-4 shrink-0 ${item.status === "FOUND" ? "text-emerald-600" : "text-slate-300"}`} /><span className="truncate text-sm font-medium text-slate-700">{item.label}</span></div><StatusPill status={item.status} /></div>)}</div><div className="mt-6 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500"><strong className="text-slate-700">Fingerprint:</strong> {report.fingerprint}. Missing fields: {report.trust.missingFields}. Ambiguous fields: {report.trust.ambiguousFields}.</div></div></div>}</section>}
    </main>
    <footer className="container flex flex-col gap-2 border-t border-slate-200/80 py-8 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>Evidence OS · deterministic by design</span><span>Prototype boundary: text-based inputs only; no source documents are persisted.</span></footer>
  </div>;
}
