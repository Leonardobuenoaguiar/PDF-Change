import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
function Workspace({ tool, onClose, pushHist }: { tool: Tool; onClose: () => void; pushHist: (h: Hist) => void }) {
  const [jobs, setJobs] = useState<Job[]>([]);
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
          <button onClick={onClose} className="rounded-lg p-2 text-ink/40 hover:bg-brand-soft hover:text-brand">✕</button>
        </div>

        <div className="space-y-5 p-6">
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
                        <button key={o.name} onClick={() => E.download(o)} className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand">
                          ⬇ {o.name} ({E.fmtSize(o.blob.size)})
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
export default function Studio() {
  const [cat, setCat] = useState<Cat>("conv");
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

        <div className="mt-8 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => { setCat(c.id); setQ(""); }}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${cat === c.id && !q ? "bg-ink text-white" : "bg-brand-soft text-ink/70 hover:text-brand-dark"}`}
            >
              <span className="mr-1.5">{c.icon}</span>{c.name}
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
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand">{CATEGORIES.find((c) => c.id === t.cat)?.icon}</span>
                    <span className="font-semibold text-ink">{t.label}</span>
                  </div>
                  <p className="mt-3 text-sm text-ink/55">{t.desc}</p>
                  <span className="mt-4 inline-block text-sm font-semibold text-brand opacity-0 transition group-hover:opacity-100">Abrir →</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* histórico */}
        <div className="mt-14 rounded-3xl border border-black/5 bg-brand-soft/50 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ink">🕑 Histórico de conversões</h3>
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
                      <td className="py-2 font-medium text-ink">{h.ok ? "✅" : "⚠️"} {h.tool}</td>
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

      {open && <Workspace tool={open} onClose={() => setOpen(null)} pushHist={pushHist} />}
    </section>
  );
}
