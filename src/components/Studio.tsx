import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CATEGORIES, TOOLS, byCat, type Cat, type Tool } from "../lib/catalog";
import * as E from "../lib/engine";

type Job = {
  id: string;
  file: File;
  status: "fila" | "processando" | "ok" | "erro";
  pct: number;
  label: string;
  outs: E.OutFile[];
  error?: string;
  ms?: number;
};
type Hist = { tool: string; file: string; out: string; when: string; ok: boolean };

const uid = () => Math.random().toString(36).slice(2);


type IconName = "file" | "convert" | "image" | "table" | "slides" | "split" | "merge" | "rotate" | "compress" | "scan" | "info" | "search" | "sparkle" | "edit" | "archive" | "tools" | "clock" | "check" | "alert" | "download" | "close" | "arrow";

const iconDrawings: Record<IconName, ReactNode> = {
  file: <><path d="M6 2.75h8l4.5 4.5V21H6z" /><path d="M14 2.75v5h4.5M9 12h6M9 16h6" /></>,
  convert: <><path d="M4 7h13l-3-3m3 3-3 3M20 17H7l3 3m-3-3 3-3" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
  table: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M4 9h16M4 15h16M10 9v12M15 9v12" /></>,
  slides: <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 21h8M12 18v3M7 14l3-3 3 2 4-5" /></>,
  split: <><circle cx="6" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><path d="M8 7l11 10M8 17 19 7" /></>,
  merge: <><rect x="3" y="3" width="11" height="13" rx="1.5" /><path d="M8 19h11a2 2 0 0 0 2-2V8M12 10h8m-3-3 3 3-3 3" /></>,
  rotate: <><path d="M20 7v5h-5" /><path d="M20 12a8 8 0 1 1-2.3-5.65L20 8" /></>,
  compress: <><path d="M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5" /><path d="m4 4 5 5m11-5-5 5M4 20l5-5m11 5-5-5" /></>,
  scan: <><path d="M4 8V5a1 1 0 0 1 1-1h3m8 0h3a1 1 0 0 1 1 1v3M4 16v3a1 1 0 0 0 1 1h3m8 0h3a1 1 0 0 0 1-1v-3M7 9h10M7 12h10M7 15h7" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 10.5v5M12 7.5h.01" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
  sparkle: <><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3ZM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14ZM5 15l.7 1.8L7.5 17.5l-1.8.7L5 20l-.7-1.8-1.8-.7 1.8-.7L5 15Z" /></>,
  edit: <><path d="m4 16 10.5-10.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4ZM13 7l4 4" /></>,
  archive: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M3 5h18v4H3zM10 13h4" /></>,
  tools: <><path d="M14.5 5.5a4.3 4.3 0 0 0-5.5 5.5L4 16a2 2 0 0 0 3 3l5-5a4.3 4.3 0 0 0 5.5-5.5L15 11l-2-2 2.5-3.5Z" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
  alert: <><path d="M12 3 2.7 19h18.6L12 3Z" /><path d="M12 9v4m0 3h.01" /></>,
  download: <><path d="M12 3v12m-4-4 4 4 4-4" /><path d="M4 17v3h16v-3" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  arrow: <><path d="M4 12h16m-5-5 5 5-5 5" /></>,
};

function SvgIcon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconDrawings[name]}
    </svg>
  );
}

function categoryIcon(id: string, name: string): IconName {
  const value = `${id} ${name}`.toLowerCase();
  if (/(^|[\s_-])(ia|ai)(?=$|[\s_-])|intelig/.test(value)) return "sparkle";
  if (/conv|convers/.test(value)) return "convert";
  if (/img|imag|foto/.test(value)) return "image";
  if (/ocr|texto|text/.test(value)) return "scan";
  if (/pdf|edit|organ/.test(value)) return "file";
  if (/util|ferrament|tool/.test(value)) return "tools";
  return "file";
}

function toolIcon(tool: Tool): IconName {
  if (tool.kind === "convert" && tool.target) {
    const target = tool.target.toLowerCase();
    if (/^(jpg|jpeg|png|webp|gif|bmp|tiff?)$/.test(target)) return "image";
    if (/^(xls|xlsx|csv)$/.test(target)) return "table";
    if (/^(ppt|pptx)$/.test(target)) return "slides";
    if (/^(pdf|doc|docx|odt|rtf|txt|html)$/.test(target)) return "file";
  }
  const byKind: Record<string, IconName> = {
    convert: "convert", split: "split", rotate: "rotate", compress: "compress",
    image: "image", img2pdf: "image", merge: "merge", zip: "archive",
    "ocr-text": "scan", "ocr-pdf": "scan", info: "info", detect: "search",
    analyze: "sparkle", rename: "edit",
  };
  return byKind[tool.kind] || categoryIcon(String(tool.cat), "");
}

function acceptsFile(file: File, accepted: string): boolean {
  const rules = (accepted || "").trim().toLowerCase();
  if (!rules || rules === "*" || rules === "*/*" || rules === "*.*") return true;
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase() || (name.endsWith(".pdf") ? "application/pdf" : "");
  return rules.split(",").some((part) => {
    const rule = part.trim();
    if (!rule) return false;
    if (rule === "*" || rule === "*/*" || rule === "*.*") return true;
    if (rule.startsWith("*.")) return name.endsWith(rule.slice(1));
    if (rule.startsWith(".")) return name.endsWith(rule);
    if (rule.endsWith("/*")) return mime.startsWith(rule.slice(0, -1));
    if (rule === "application/pdf" && name.endsWith(".pdf")) return true;
    if (rule.includes("/")) return mime === rule;
    return name.endsWith(`.${rule}`);
  });
}

/* ---------------- Dropzone ---------------- */
function Drop({ tool, onFiles }: { tool: Tool; onFiles: (f: File[]) => void }) {
  const [over, setOver] = useState(false);
  const inp = useRef<HTMLInputElement>(null);
  const dir = useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(e) => (e.preventDefault(), setOver(true))}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
      className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${over ? "border-brand bg-brand-soft" : "border-brand/30 bg-brand-soft/40"}`}
    >
      <input ref={inp} type="file" hidden multiple={tool.multi} accept={tool.accept === "*" ? undefined : tool.accept} onChange={(e) => onFiles(Array.from(e.target.files || []))} />
      <input ref={dir} type="file" hidden {...({ webkitdirectory: "", directory: "" } as any)} onChange={(e) => onFiles(Array.from(e.target.files || []))} />
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand text-white">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
      </div>
      <p className="mt-3 font-semibold text-ink">Arraste e solte aqui</p>
      <p className="text-sm text-ink/50">Aceita: {tool.accept === "*" ? "qualquer arquivo" : tool.accept}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button onClick={() => inp.current?.click()} className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-brand">Escolher arquivos</button>
        <button onClick={() => dir.current?.click()} className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:text-brand">Escolher pasta inteira</button>
      </div>
    </div>
  );
}

/* ---------------- Workspace ---------------- */
function Workspace({ tool, onClose, pushHist, initialFile = null, rejectedFile = null, onBeforeRun }: {
  tool: Tool;
  onClose: () => void;
  pushHist: (h: Hist) => void;
  initialFile?: File | null;
  rejectedFile?: File | null;
  onBeforeRun?: () => void;
}) {
  const [jobs, setJobs] = useState<Job[]>(() => initialFile
    ? [{ id: uid(), file: initialFile, status: "fila", pct: 0, label: "", outs: [] }]
    : []);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<string>("");
  const [opts, setOpts] = useState({
    target: tool.target || (tool.cat === "img" ? "webp" : "pdf"),
    quality: 0.8,
    maxWidth: 0,
    grayscale: false,
    ranges: "1-3",
    mode: "extract" as "extract" | "remove" | "each",
    deg: 90,
    lang: "por+eng",
  });

  const addFiles = (fs: File[]) =>
    setJobs((j) => [...j, ...fs.map((f) => ({ id: uid(), file: f, status: "fila" as const, pct: 0, label: "", outs: [] }))]);

  const upd = (id: string, p: Partial<Job>) => setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...p } : j)));

  const runJob = async (job: Job): Promise<E.OutFile[]> => {
    const onP: E.Progress = (pct, label) => upd(job.id, { pct: Math.min(99, Math.round(pct)), label: label || "" });
    const f = job.file;
    switch (tool.kind) {
      case "convert":
        return E.convertFile(f, opts.target, onP);
      case "split":
        return E.splitPdf(f, opts.ranges, opts.mode);
      case "rotate":
        return E.rotatePdf(f, opts.deg);
      case "compress":
        return E.compressPdf(f, opts.quality, 1.3, onP);
      case "image":
        return E.transformImage(f, { target: opts.target, quality: opts.quality, maxWidth: opts.maxWidth || undefined, grayscale: opts.grayscale });
      case "ocr-text": {
        const txt = E.ext(f.name) === "pdf" ? await ocrPdf(f, onP) : await E.ocr(f, onP, opts.lang);
        setReport((r) => r + `\n\n### ${f.name}\n` + txt.trim());
        return [{ name: `${E.base(f.name)}-ocr.txt`, blob: new Blob([txt], { type: "text/plain" }) }];
      }
      case "ocr-pdf":
        return E.ocrToSearchablePdf(f, onP);
      case "info": {
        const i = await E.pdfInfo(f);
        setReport((r) => r + `\n\n### ${f.name}\n` + Object.entries(i).map(([k, v]) => `${k}: ${v}`).join("\n"));
        return [];
      }
      case "detect": {
        const d = E.detectType(f);
        setReport((r) => r + `\n\n### ${f.name}\ncategoria: ${d.cat}\nextensão: .${d.ext}\nMIME: ${d.mime}\ntamanho: ${E.fmtSize(d.size)}`);
        return [];
      }
      case "analyze": {
        const text = await E.convertFile(f, "txt", onP).then(async (o) => await o[0].blob.text());
        const a = E.analyzeText(text);
        const body =
          tool.id === "ia-keywords"
            ? a.keywords.map(([w, n], i) => `${i + 1}. ${w} (${n}x)`).join("\n")
            : a.summary.map((s) => "• " + s).join("\n\n");
        setReport((r) => r + `\n\n### ${f.name}\n${a.palavras} palavras · ${a.sentencas} frases · leitura ${a.leitura}\n\n${body || "Sem texto suficiente."}`);
        return [{ name: `${E.base(f.name)}-${tool.id === "ia-keywords" ? "keywords" : "resumo"}.txt`, blob: new Blob([body], { type: "text/plain" }) }];
      }
      case "rename": {
        const text = await (await E.convertFile(f, "txt", onP))[0].blob.text();
        const n = E.suggestName(text, f.name);
        setReport((r) => r + `\n\n### ${f.name}\nSugestão: ${n}`);
        return [{ name: n, blob: f }];
      }
      default:
        return [];
    }
  };

  const ocrPdf = async (f: File, onP: E.Progress) => {
    const cs = await E.pdfPagesToCanvas(f, 2, (p, l) => onP(p * 0.3, l));
    let out = "";
    for (let i = 0; i < cs.length; i++) {
      const b = await E.canvasBlob(cs[i], "image/png");
      out += `\n--- Página ${i + 1} ---\n` + (await E.ocr(b, (p, l) => onP(30 + ((i + p / 100) / cs.length) * 70, l), opts.lang));
    }
    return out;
  };

  const run = async () => {
    if (!jobs.length || running) return;
    onBeforeRun?.();
    setRunning(true);
    setReport("");
    const pending = jobs.filter((j) => j.status !== "ok");
    if (tool.kind === "merge" || tool.kind === "img2pdf" || tool.kind === "zip") {
      const id = pending[0]?.id;
      pending.forEach((j) => upd(j.id, { status: "processando", pct: 10 }));
      try {
        const files = pending.map((j) => j.file);
        const onP: E.Progress = (pct, label) => pending.forEach((j) => upd(j.id, { pct: Math.round(pct), label: label || "" }));
        const outs =
          tool.kind === "merge"
            ? await E.mergePdfs(files, onP)
            : tool.kind === "img2pdf"
            ? await E.imagesToOnePdf(files, onP)
            : [await E.zipFiles(files.map((f) => ({ name: f.name, blob: f })))];
        pending.forEach((j, i) => upd(j.id, { status: "ok", pct: 100, outs: i === 0 ? outs : [] }));
        pushHist({ tool: tool.label, file: `${files.length} arquivos`, out: outs[0].name, when: new Date().toLocaleString("pt-BR"), ok: true });
      } catch (err: any) {
        pending.forEach((j) => upd(j.id, { status: "erro", error: err.message }));
        if (id) pushHist({ tool: tool.label, file: "lote", out: err.message, when: new Date().toLocaleString("pt-BR"), ok: false });
      }
      setRunning(false);
      return;
    }
    for (const job of pending) {
      upd(job.id, { status: "processando", pct: 1 });
      const t0 = performance.now();
      try {
        const outs = await runJob(job);
        upd(job.id, { status: "ok", pct: 100, outs, ms: Math.round(performance.now() - t0), label: "" });
        pushHist({ tool: tool.label, file: job.file.name, out: outs.map((o) => o.name).join(", ") || "relatório", when: new Date().toLocaleString("pt-BR"), ok: true });
      } catch (err: any) {
        upd(job.id, { status: "erro", error: err?.message || "falhou", pct: 100 });
        pushHist({ tool: tool.label, file: job.file.name, out: err?.message || "erro", when: new Date().toLocaleString("pt-BR"), ok: false });
      }
    }
    setRunning(false);
  };

  const allOuts = jobs.flatMap((j) => j.outs);
  const sel = (v: string, set: (s: string) => void, list: string[]) => (
    <select value={v} onChange={(e) => set(e.target.value)} className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-brand">
      {list.map((o) => <option key={o} value={o}>{o.toUpperCase()}</option>)}
    </select>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="my-8 w-full max-w-3xl rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-black/5 p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand">{CATEGORIES.find((c) => c.id === tool.cat)?.name}</p>
            <h3 className="mt-1 text-2xl font-semibold text-ink">{tool.label}</h3>
            <p className="mt-1 text-sm text-ink/55">{tool.desc}</p>
          </div>
          <button onClick={onClose} aria-label="Fechar ferramenta" className="rounded-lg p-2 text-ink/40 hover:bg-brand-soft hover:text-brand"><SvgIcon name="close" className="h-5 w-5" /></button>
        </div>

        <div className="space-y-5 p-6">
          {initialFile && jobs.some((job) => job.file === initialFile && job.status === "fila") && (
            <p className="flex items-start gap-2 rounded-xl bg-brand-soft px-4 py-3 text-sm text-ink/70" role="status">
              <SvgIcon name="file" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>O arquivo <strong className="break-all text-ink">{initialFile.name}</strong> já está na fila. Ajuste as opções e clique em Executar.</span>
            </p>
          )}
          {rejectedFile && jobs.length === 0 && (
            <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
              <SvgIcon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>O arquivo <strong className="break-all">{rejectedFile.name}</strong> não é compatível com esta ferramenta. Escolha um arquivo aceito abaixo.</span>
            </p>
          )}
          <Drop tool={tool} onFiles={addFiles} />

          {/* opções */}
          <div className="flex flex-wrap items-center gap-3">
            {tool.kind === "image" && (
              <>
                {sel(opts.target, (v) => setOpts({ ...opts, target: v }), ["png", "jpg", "webp"])}
                <label className="flex items-center gap-2 text-sm text-ink/60">
                  Qualidade {Math.round(opts.quality * 100)}%
                  <input type="range" min={10} max={100} value={opts.quality * 100} onChange={(e) => setOpts({ ...opts, quality: +e.target.value / 100 })} className="accent-brand" />
                </label>
                <label className="flex items-center gap-2 text-sm text-ink/60">
                  Largura máx.
                  <input type="number" min={0} value={opts.maxWidth} onChange={(e) => setOpts({ ...opts, maxWidth: +e.target.value })} className="w-24 rounded-lg border border-ink/15 px-2 py-1.5 text-sm" placeholder="0 = original" />
                </label>
                <label className="flex items-center gap-2 text-sm text-ink/60">
                  <input type="checkbox" checked={opts.grayscale} onChange={(e) => setOpts({ ...opts, grayscale: e.target.checked })} className="accent-brand" /> Tons de cinza
                </label>
              </>
            )}
            {tool.kind === "split" && (
              <>
                <select value={opts.mode} onChange={(e) => setOpts({ ...opts, mode: e.target.value as any })} className="rounded-lg border border-ink/15 px-3 py-2 text-sm font-medium">
                  <option value="extract">Extrair páginas</option>
                  <option value="remove">Remover páginas</option>
                  <option value="each">Separar uma a uma</option>
                </select>
                {opts.mode !== "each" && (
                  <input value={opts.ranges} onChange={(e) => setOpts({ ...opts, ranges: e.target.value })} placeholder="ex: 1-3,5,8" className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
                )}
              </>
            )}
            {tool.kind === "rotate" && sel(String(opts.deg), (v) => setOpts({ ...opts, deg: +v }), ["90", "180", "270"])}
            {tool.kind === "compress" && (
              <label className="flex items-center gap-2 text-sm text-ink/60">
                Qualidade {Math.round(opts.quality * 100)}%
                <input type="range" min={20} max={95} value={opts.quality * 100} onChange={(e) => setOpts({ ...opts, quality: +e.target.value / 100 })} className="accent-brand" />
              </label>
            )}
            {(tool.kind === "ocr-text" || tool.kind === "ocr-pdf") && sel(opts.lang, (v) => setOpts({ ...opts, lang: v }), ["por+eng", "por", "eng", "spa"])}
            {tool.kind === "convert" && !tool.target && sel(opts.target, (v) => setOpts({ ...opts, target: v }), ["pdf", "docx", "xlsx", "pptx", "txt", "csv", "json", "html", "jpg", "png"])}
            {tool.target && <span className="rounded-lg bg-brand-soft px-3 py-2 text-sm font-semibold text-brand-dark">Saída: {tool.target.toUpperCase()}</span>}
          </div>

          {/* fila */}
          {jobs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink/40">
                <span>Fila de processamento ({jobs.length})</span>
                <button onClick={() => setJobs([])} className="text-brand hover:underline">limpar</button>
              </div>
              {jobs.map((j) => (
                <div key={j.id} className="rounded-xl border border-black/5 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-ink">{j.file.name}</span>
                    <span className="shrink-0 text-xs text-ink/45">
                      {E.fmtSize(j.file.size)} ·{" "}
                      <b className={j.status === "ok" ? "text-brand" : j.status === "erro" ? "text-red-500" : "text-ink/60"}>{j.status}</b>
                      {j.ms ? ` · ${j.ms}ms` : ""}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-soft">
                    <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${j.pct}%` }} />
                  </div>
                  {j.label && <p className="mt-1 text-xs text-ink/45">{j.label}</p>}
                  {j.error && <p className="mt-1 text-xs text-red-500">{j.error}</p>}
                  {j.outs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {j.outs.map((o) => (
                        <button key={o.name} onClick={() => E.download(o)} className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand">
                          <SvgIcon name="download" className="h-3.5 w-3.5 shrink-0" /> {o.name} ({E.fmtSize(o.blob.size)})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {report && (
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-ink p-4 text-xs leading-relaxed text-white/85">{report.trim()}</pre>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={run}
              disabled={!jobs.length || running}
              className="rounded-xl bg-brand px-6 py-3 font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              {running ? "Processando…" : `Executar (${jobs.filter((j) => j.status !== "ok").length})`}
            </button>
            {allOuts.length > 1 && (
              <button onClick={async () => E.download(await E.zipFiles(allOuts))} className="rounded-xl border border-ink/15 px-6 py-3 font-semibold text-ink hover:border-brand hover:text-brand">
                Baixar tudo em ZIP ({allOuts.length})
              </button>
            )}
            {report && (
              <button onClick={() => navigator.clipboard.writeText(report.trim())} className="rounded-xl border border-ink/15 px-6 py-3 font-semibold text-ink hover:border-brand hover:text-brand">
                Copiar relatório
              </button>
            )}
          </div>
          <p className="text-xs text-ink/40">
            100% no seu navegador — nada é enviado para servidores. PDF.js e o OCR rodam em Web Workers paralelos para não travar a interface.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Seção pública ---------------- */
type StudioProps = {
  selectedFile?: File | null;
  onClearSelectedFile?: () => void;
  onBeforeRun?: () => void;
};

export default function Studio({ selectedFile = null, onClearSelectedFile, onBeforeRun }: StudioProps = {}) {
  const [cat, setCat] = useState<Cat>("pdf");
  const [open, setOpen] = useState<Tool | null>(null);
  const [q, setQ] = useState("");
  const [hist, setHist] = useState<Hist[]>(() => {
    try { return JSON.parse(localStorage.getItem("pdfchange:hist") || "[]"); } catch { return []; }
  });

  useEffect(() => localStorage.setItem("pdfchange:hist", JSON.stringify(hist.slice(0, 40))), [hist]);
  const pushHist = useCallback((h: Hist) => setHist((x) => [h, ...x].slice(0, 40)), []);

  const list = useMemo(() => {
    const src = q.trim() ? TOOLS : byCat(cat);
    return q.trim() ? src.filter((t) => (t.label + t.desc).toLowerCase().includes(q.toLowerCase())) : src;
  }, [cat, q]);

  const groups = useMemo(() => {
    const m = new Map<string, Tool[]>();
    list.forEach((t) => {
      const g = t.group || "Ferramentas";
      m.set(g, [...(m.get(g) || []), t]);
    });
    return [...m.entries()];
  }, [list]);

  const selectedFileFits = Boolean(open && selectedFile && acceptsFile(selectedFile, open.accept));

  return (
    <section id="conversoes" className="scroll-mt-20 bg-white py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-sm font-bold uppercase tracking-widest text-brand">Conversões</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Edite, converta, mude seu PDF.</h2>
            <p className="mt-3 text-ink/55">
              {TOOLS.length} ferramentas reais executadas no seu dispositivo: fila de processamento, progresso em tempo real, lote, pasta inteira e histórico.
            </p>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar ferramenta… (ex: webp, ocr, excel)"
            className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm outline-none focus:border-brand sm:w-80"
          />
        </div>

        {selectedFile && (
          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-brand/20 bg-brand-soft/50 px-4 py-3" role="status">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand"><SvgIcon name="file" className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">Arquivo selecionado:</p>
              <p className="mt-0.5 break-all text-sm font-medium text-ink">{selectedFile.name}</p>
              <p className="mt-1 text-xs text-ink/60">Escolha uma ferramenta para usar este arquivo.</p>
            </div>
            {onClearSelectedFile && (
              <div className="w-full pl-[52px] sm:w-auto sm:pl-0">
                <button type="button" onClick={onClearSelectedFile} className="rounded-lg text-sm font-semibold text-brand hover:underline sm:px-3 sm:py-2">Remover arquivo</button>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => { setCat(c.id); setQ(""); }}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${cat === c.id && !q ? "bg-ink text-white" : "bg-brand-soft text-ink/70 hover:text-brand-dark"}`}
            >
              <SvgIcon name={categoryIcon(String(c.id), c.name)} className="mr-1.5 inline-block h-4 w-4 align-[-0.15em]" />{c.name}
              <span className="ml-2 text-xs opacity-50">{byCat(c.id).length}</span>
            </button>
          ))}
        </div>
        {!q && <p className="mt-3 text-sm text-ink/45">{CATEGORIES.find((c) => c.id === cat)?.desc}</p>}

        {groups.map(([g, items]) => (
          <div key={g} className="mt-10">
            {groups.length > 1 && <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-ink/35">{g}</h3>}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setOpen(t)}
                  className="group rounded-2xl border border-black/5 bg-white p-5 text-left transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/10"
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><SvgIcon name={toolIcon(t)} className="h-5 w-5" /></span>
                    <span className="font-semibold text-ink">{t.label}</span>
                  </div>
                  <p className="mt-3 text-sm text-ink/55">{t.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand opacity-0 transition group-hover:opacity-100">Abrir <SvgIcon name="arrow" className="h-4 w-4" /></span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* histórico */}
        <div className="mt-14 rounded-3xl border border-black/5 bg-brand-soft/50 p-6">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-ink"><SvgIcon name="clock" className="h-5 w-5 text-brand" /> Histórico de conversões</h3>
            {hist.length > 0 && <button onClick={() => setHist([])} className="text-sm font-semibold text-brand hover:underline">Limpar</button>}
          </div>
          {hist.length === 0 ? (
            <p className="mt-3 text-sm text-ink/50">Nenhuma conversão ainda — ela aparece aqui e fica salva no seu navegador.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-ink/40">
                  <tr><th className="pb-2">Ferramenta</th><th className="pb-2">Entrada</th><th className="pb-2">Saída</th><th className="pb-2">Quando</th></tr>
                </thead>
                <tbody className="text-ink/70">
                  {hist.slice(0, 8).map((h, i) => (
                    <tr key={i} className="border-t border-black/5">
                      <td className="py-2 font-medium text-ink">
                        <span className="inline-flex items-center gap-2">
                          <SvgIcon name={h.ok ? "check" : "alert"} className={`h-4 w-4 shrink-0 ${h.ok ? "text-brand" : "text-red-500"}`} />
                          <span className="sr-only">{h.ok ? "Concluído:" : "Erro:"}</span>{h.tool}
                        </span>
                      </td>
                      <td className="max-w-[12rem] truncate py-2">{h.file}</td>
                      <td className="max-w-[14rem] truncate py-2">{h.out}</td>
                      <td className="py-2 whitespace-nowrap">{h.when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {open && (
        <Workspace
          key={open.id}
          tool={open}
          onClose={() => setOpen(null)}
          pushHist={pushHist}
          initialFile={selectedFileFits ? selectedFile : null}
          rejectedFile={selectedFile && !selectedFileFits ? selectedFile : null}
          onBeforeRun={onBeforeRun}
        />
      )}
    </section>
  );
}
