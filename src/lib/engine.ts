/* PDF Change — motor de conversão real (client-side) */
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, StandardFonts, degrees } from "pdf-lib";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import JSZip from "jszip";
import Papa from "papaparse";
import UTIF from "utif";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import PptxGenJS from "pptxgenjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export type OutFile = { name: string; blob: Blob };
export type Progress = (pct: number, label?: string) => void;

export const ext = (n: string) => (n.split(".").pop() || "").toLowerCase();
export const base = (n: string) => n.replace(/\.[^.]+$/, "");

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  bmp: "image/bmp",
  txt: "text/plain",
  csv: "text/csv",
  json: "application/json",
  html: "text/html",
  xml: "application/xml",
  zip: "application/zip",
};

export const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "bmp", "tif", "tiff", "gif"];

/* ---------------- helpers ---------------- */

async function buf(f: File | Blob) {
  return new Uint8Array(await f.arrayBuffer());
}

export async function pdfDoc(f: File) {
  return pdfjsLib.getDocument({ data: await buf(f) }).promise;
}

export async function pdfPagesText(f: File, onP?: Progress): Promise<string[]> {
  const doc = await pdfDoc(f);
  const out: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    let last = -1;
    let line = "";
    const lines: string[] = [];
    for (const it of tc.items as any[]) {
      const y = Math.round(it.transform[5]);
      if (last !== -1 && Math.abs(y - last) > 3) {
        lines.push(line.trim());
        line = "";
      }
      line += it.str + (it.hasEOL ? "" : " ");
      last = y;
    }
    if (line.trim()) lines.push(line.trim());
    out.push(lines.join("\n"));
    onP?.((i / doc.numPages) * 100, `Lendo página ${i}/${doc.numPages}`);
  }
  return out;
}

export async function pdfPagesToCanvas(f: File, scale = 2, onP?: Progress) {
  const doc = await pdfDoc(f);
  const canvases: HTMLCanvasElement[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const vp = page.getViewport({ scale });
    const c = document.createElement("canvas");
    c.width = vp.width;
    c.height = vp.height;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    await page.render({ canvas: c, canvasContext: ctx, viewport: vp } as any).promise;
    canvases.push(c);
    onP?.((i / doc.numPages) * 100, `Renderizando página ${i}/${doc.numPages}`);
  }
  return canvases;
}

export async function fileToCanvas(f: File | Blob, name = "img"): Promise<HTMLCanvasElement> {
  const e = ext(name);
  if (e === "tif" || e === "tiff") {
    const ab = await f.arrayBuffer();
    const ifds = UTIF.decode(ab);
    UTIF.decodeImage(ab, ifds[0]);
    const rgba = UTIF.toRGBA8(ifds[0]);
    const c = document.createElement("canvas");
    c.width = ifds[0].width;
    c.height = ifds[0].height;
    c.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(rgba), c.width, c.height), 0, 0);
    return c;
  }
  const bmp = await createImageBitmap(f as Blob);
  const c = document.createElement("canvas");
  c.width = bmp.width;
  c.height = bmp.height;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0);
  return c;
}

export const canvasBlob = (c: HTMLCanvasElement, type = "image/png", q = 0.92) =>
  new Promise<Blob>((res) => c.toBlob((b) => res(b!), type, q));

function textPdf(pages: string[], title: string): Blob {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  pdf.setProperties({ title });
  const W = 595.28, M = 48, LH = 14;
  let first = true;
  for (const text of pages) {
    const lines = pdf.splitTextToSize(text || " ", W - M * 2) as string[];
    let y = M;
    if (!first) pdf.addPage();
    first = false;
    pdf.setFont("helvetica", "normal").setFontSize(11);
    for (const ln of lines) {
      if (y > 790) {
        pdf.addPage();
        y = M;
      }
      pdf.text(ln, M, y);
      y += LH;
    }
  }
  return pdf.output("blob");
}

async function textDocx(text: string, title: string): Promise<Blob> {
  const paras = [
    new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
    ...text.split("\n").map((l) => new Paragraph({ children: [new TextRun(l)] })),
  ];
  const doc = new Document({ sections: [{ children: paras }] });
  return Packer.toBlob(doc);
}

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

function htmlDoc(title: string, body: string) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:820px;margin:40px auto;padding:0 20px;color:#0a0a0a;line-height:1.6}
h2{color:#5b6cff;border-bottom:2px solid #eef0ff;padding-bottom:6px;margin-top:40px}</style></head><body>${body}</body></html>`;
}

const htmlToText = (html: string) => {
  const d = new DOMParser().parseFromString(html, "text/html");
  d.querySelectorAll("script,style").forEach((n) => n.remove());
  return (d.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
};

async function readText(f: File) {
  return await f.text();
}

async function sourceText(f: File, onP?: Progress): Promise<string> {
  const e = ext(f.name);
  if (e === "pdf") return (await pdfPagesText(f, onP)).join("\n\n");
  if (e === "docx") return (await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() })).value;
  if (e === "pptx") return (await pptxText(f)).join("\n\n");
  if (e === "html" || e === "htm") return htmlToText(await readText(f));
  if (e === "xlsx" || e === "xls") {
    const wb = XLSX.read(await f.arrayBuffer());
    return wb.SheetNames.map((n) => XLSX.utils.sheet_to_csv(wb.Sheets[n])).join("\n\n");
  }
  if (IMAGE_EXTS.includes(e)) return await ocr(f, onP);
  return await readText(f);
}

async function pptxText(f: File): Promise<string[]> {
  const zip = await JSZip.loadAsync(await f.arrayBuffer());
  const names = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => +a.replace(/\D/g, "") - +b.replace(/\D/g, ""));
  const out: string[] = [];
  for (const n of names) {
    const xml = await zip.file(n)!.async("string");
    const txt = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]).join("\n");
    out.push(txt);
  }
  return out;
}

/* ---------------- OCR (worker real do tesseract.js) ---------------- */
let ocrWorker: any = null;
export async function ocr(src: File | Blob, onP?: Progress, lang = "por+eng"): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  if (!ocrWorker) {
    onP?.(5, "Carregando modelo OCR…");
    ocrWorker = await createWorker(lang, 1, {
      logger: (m: any) => m.status === "recognizing text" && onP?.(10 + m.progress * 88, "Reconhecendo texto…"),
    });
  }
  const r = await ocrWorker.recognize(src);
  return r.data.text as string;
}

/* ---------------- tabelas ---------------- */
function rowsFromText(text: string): string[][] {
  return text
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => l.split(/\s{2,}|\t|;|,(?=\S)/).map((c) => c.trim()));
}

function sheetToPdf(wb: XLSX.WorkBook, title: string): Blob {
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  pdf.setProperties({ title });
  let first = true;
  for (const sn of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[sn], { header: 1, blankrows: false });
    if (!first) pdf.addPage();
    first = false;
    let y = 48;
    pdf.setFontSize(13).setTextColor(91, 108, 255).text(sn, 40, y);
    y += 22;
    pdf.setFontSize(9).setTextColor(10, 10, 10);
    const cols = Math.max(1, ...rows.map((r) => r.length));
    const w = (842 - 80) / cols;
    rows.forEach((r, ri) => {
      if (y > 560) {
        pdf.addPage();
        y = 48;
      }
      if (ri === 0) pdf.setFont("helvetica", "bold");
      else pdf.setFont("helvetica", "normal");
      for (let c = 0; c < cols; c++) {
        const v = String(r[c] ?? "");
        pdf.text(pdf.splitTextToSize(v, w - 6)[0] || "", 40 + c * w, y);
      }
      y += 16;
    });
  }
  return pdf.output("blob");
}

/* ---------------- conversão principal ---------------- */
export async function convertFile(f: File, target: string, onP?: Progress): Promise<OutFile[]> {
  const e = ext(f.name);
  const b = base(f.name);
  const t = target.toLowerCase();
  const mk = (blob: Blob, suffix = t, name = b) => [{ name: `${name}.${suffix}`, blob }];

  /* ---- imagem -> imagem ---- */
  if (IMAGE_EXTS.includes(e) && ["jpg", "jpeg", "png", "webp"].includes(t)) {
    onP?.(30, "Decodificando imagem…");
    const c = await fileToCanvas(f, f.name);
    const blob = await canvasBlob(c, MIME[t === "jpeg" ? "jpg" : t], 0.92);
    onP?.(100);
    return mk(blob);
  }

  /* ---- qualquer imagem -> pdf ---- */
  if (IMAGE_EXTS.includes(e) && t === "pdf") {
    const pdf = await PDFDocument.create();
    const c = await fileToCanvas(f, f.name);
    const png = await canvasBlob(c, "image/png");
    const img = await pdf.embedPng(await buf(png));
    const page = pdf.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    onP?.(100);
    return mk(new Blob([(await pdf.save()) as any], { type: MIME.pdf }));
  }

  /* ---- pdf -> imagens ---- */
  if (e === "pdf" && ["jpg", "jpeg", "png"].includes(t)) {
    const cs = await pdfPagesToCanvas(f, 2, onP);
    const outs: OutFile[] = [];
    for (let i = 0; i < cs.length; i++)
      outs.push({ name: `${b}-p${i + 1}.${t}`, blob: await canvasBlob(cs[i], MIME[t === "jpeg" ? "jpg" : t], 0.92) });
    return outs;
  }

  /* ---- pdf -> dados/documentos ---- */
  if (e === "pdf") {
    if (t === "pdfa") {
      const src = await PDFDocument.load(await buf(f), { ignoreEncryption: true });
      src.setTitle(b);
      src.setProducer("PDF Change");
      src.setCreator("PDF Change");
      src.setCreationDate(new Date());
      const bytes = await src.save({ useObjectStreams: false });
      return mk(new Blob([bytes as any], { type: MIME.pdf }), "pdf", `${b}-pdfa`);
    }
    const pages = await pdfPagesText(f, onP);
    const all = pages.join("\n\n");
    const hasText = all.replace(/\s/g, "").length > 20;
    const text = hasText ? all : await ocr(f.type ? await (async () => (await canvasBlob((await pdfPagesToCanvas(f, 2))[0])) )() : f, onP);
    switch (t) {
      case "txt":
        return mk(new Blob([text], { type: MIME.txt }));
      case "json":
        return mk(new Blob([JSON.stringify({ file: f.name, pages: pages.map((p, i) => ({ page: i + 1, text: p })) }, null, 2)], { type: MIME.json }));
      case "html":
        return mk(new Blob([htmlDoc(b, pages.map((p, i) => `<h2>Página ${i + 1}</h2><p>${esc(p).replace(/\n/g, "<br>")}</p>`).join(""))], { type: MIME.html }));
      case "csv": {
        const rows = rowsFromText(text);
        return mk(new Blob([Papa.unparse(rows)], { type: MIME.csv }));
      }
      case "xlsx": {
        const wb = XLSX.utils.book_new();
        pages.forEach((p, i) => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rowsFromText(p)), `Pagina${i + 1}`.slice(0, 31)));
        const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        return mk(new Blob([out], { type: MIME.xlsx }));
      }
      case "docx":
        return mk(await textDocx(text, b));
      case "pptx": {
        const p = new PptxGenJS();
        pages.forEach((pg, i) => {
          const s = p.addSlide();
          s.addText(`Página ${i + 1}`, { x: 0.4, y: 0.3, fontSize: 20, bold: true, color: "5B6CFF" });
          s.addText(pg.slice(0, 2500) || " ", { x: 0.4, y: 1, w: 9, h: 4.6, fontSize: 12, color: "0A0A0A" });
        });
        const blob = (await p.write({ outputType: "blob" })) as Blob;
        return mk(blob);
      }
    }
  }

  /* ---- planilhas ---- */
  if (["xlsx", "xls", "csv"].includes(e)) {
    const wb = e === "csv" ? XLSX.read(await readText(f), { type: "string" }) : XLSX.read(await f.arrayBuffer());
    const sh = wb.Sheets[wb.SheetNames[0]];
    if (t === "csv") return mk(new Blob([XLSX.utils.sheet_to_csv(sh)], { type: MIME.csv }));
    if (t === "json") return mk(new Blob([JSON.stringify(XLSX.utils.sheet_to_json(sh), null, 2)], { type: MIME.json }));
    if (t === "xlsx") return mk(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: MIME.xlsx }));
    if (t === "pdf") return mk(sheetToPdf(wb, b));
    if (t === "html") return mk(new Blob([htmlDoc(b, XLSX.utils.sheet_to_html(sh))], { type: MIME.html }));
    if (t === "txt") return mk(new Blob([XLSX.utils.sheet_to_txt(sh)], { type: MIME.txt }));
  }

  /* ---- texto / documentos ---- */
  const text = await sourceText(f, onP);
  switch (t) {
    case "txt":
      return mk(new Blob([text], { type: MIME.txt }));
    case "pdf":
      return mk(textPdf(e === "pptx" ? await pptxText(f) : text.split(/\f/), b));
    case "docx":
      return mk(await textDocx(text, b));
    case "html":
      if (e === "docx") {
        const r = await mammoth.convertToHtml({ arrayBuffer: await f.arrayBuffer() });
        return mk(new Blob([htmlDoc(b, r.value)], { type: MIME.html }));
      }
      return mk(new Blob([htmlDoc(b, `<p>${esc(text).replace(/\n/g, "<br>")}</p>`)], { type: MIME.html }));
    case "json":
      return mk(new Blob([JSON.stringify({ file: f.name, text }, null, 2)], { type: MIME.json }));
    case "csv":
      return mk(new Blob([Papa.unparse(rowsFromText(text))], { type: MIME.csv }));
    case "xlsx": {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rowsFromText(text)), "Dados");
      return mk(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: MIME.xlsx }));
    }
    case "pptx": {
      const p = new PptxGenJS();
      const chunks = e === "pptx" ? await pptxText(f) : text.match(/[\s\S]{1,1200}/g) || [" "];
      chunks.forEach((ch, i) => {
        const s = p.addSlide();
        s.addText(`${b} — ${i + 1}`, { x: 0.4, y: 0.3, fontSize: 20, bold: true, color: "5B6CFF" });
        s.addText(ch, { x: 0.4, y: 1, w: 9, h: 4.6, fontSize: 12 });
      });
      return mk((await p.write({ outputType: "blob" })) as Blob);
    }
  }
  throw new Error(`Conversão ${e.toUpperCase()} → ${t.toUpperCase()} não suportada.`);
}

/* ---------------- OCR tools ---------------- */
export async function ocrToSearchablePdf(f: File, onP?: Progress): Promise<OutFile[]> {
  const canvases = IMAGE_EXTS.includes(ext(f.name)) ? [await fileToCanvas(f, f.name)] : await pdfPagesToCanvas(f, 2, onP);
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < canvases.length; i++) {
    const c = canvases[i];
    const png = await canvasBlob(c, "image/png");
    const img = await pdf.embedPng(await buf(png));
    const page = pdf.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    const txt = await ocr(png, (p, l) => onP?.(((i + p / 100) / canvases.length) * 100, l));
    // camada de texto invisível (pesquisável)
    txt.split("\n").forEach((line, li) => {
      if (!line.trim()) return;
      page.drawText(line.replace(/[^\x20-\x7E\u00C0-\u00FF]/g, ""), {
        x: 4,
        y: img.height - 14 - li * 14,
        size: 11,
        font,
        opacity: 0,
      });
    });
  }
  return [{ name: `${base(f.name)}-pesquisavel.pdf`, blob: new Blob([(await pdf.save()) as any], { type: MIME.pdf }) }];
}

/* ---------------- ferramentas PDF ---------------- */
export async function mergePdfs(files: File[], onP?: Progress): Promise<OutFile[]> {
  const out = await PDFDocument.create();
  for (let i = 0; i < files.length; i++) {
    const src = await PDFDocument.load(await buf(files[i]), { ignoreEncryption: true });
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
    onP?.(((i + 1) / files.length) * 100, `Unindo ${files[i].name}`);
  }
  return [{ name: "pdf-change-unido.pdf", blob: new Blob([(await out.save()) as any], { type: MIME.pdf }) }];
}

export function parseRanges(spec: string, total: number): number[] {
  const set = new Set<number>();
  spec.split(",").forEach((part) => {
    const m = part.trim().match(/^(\d+)\s*(?:-\s*(\d+))?$/);
    if (!m) return;
    const a = +m[1], bb = m[2] ? +m[2] : a;
    for (let i = a; i <= Math.min(bb, total); i++) if (i >= 1) set.add(i);
  });
  return [...set].sort((x, y) => x - y);
}

export async function splitPdf(f: File, spec: string, mode: "extract" | "remove" | "each"): Promise<OutFile[]> {
  const src = await PDFDocument.load(await buf(f), { ignoreEncryption: true });
  const total = src.getPageCount();
  if (mode === "each") {
    const outs: OutFile[] = [];
    for (let i = 0; i < total; i++) {
      const d = await PDFDocument.create();
      const [p] = await d.copyPages(src, [i]);
      d.addPage(p);
      outs.push({ name: `${base(f.name)}-p${i + 1}.pdf`, blob: new Blob([(await d.save()) as any], { type: MIME.pdf }) });
    }
    return outs;
  }
  const sel = parseRanges(spec || `1-${total}`, total);
  const idx = mode === "extract" ? sel.map((n) => n - 1) : [...Array(total).keys()].filter((i) => !sel.includes(i + 1));
  if (!idx.length) throw new Error("Nenhuma página restante com esse intervalo.");
  const d = await PDFDocument.create();
  const pages = await d.copyPages(src, idx);
  pages.forEach((p) => d.addPage(p));
  return [{ name: `${base(f.name)}-${mode === "extract" ? "extraido" : "sem-paginas"}.pdf`, blob: new Blob([(await d.save()) as any], { type: MIME.pdf }) }];
}

export async function rotatePdf(f: File, deg: number): Promise<OutFile[]> {
  const d = await PDFDocument.load(await buf(f), { ignoreEncryption: true });
  d.getPages().forEach((p) => p.setRotation(degrees((p.getRotation().angle + deg) % 360)));
  return [{ name: `${base(f.name)}-rotacionado.pdf`, blob: new Blob([(await d.save()) as any], { type: MIME.pdf }) }];
}

/** Compressão real: rasteriza páginas em JPEG com qualidade/escala reduzidas. */
export async function compressPdf(f: File, quality = 0.6, scale = 1.2, onP?: Progress): Promise<OutFile[]> {
  const canvases = await pdfPagesToCanvas(f, scale, (p, l) => onP?.(p * 0.6, l));
  const pdf = await PDFDocument.create();
  for (let i = 0; i < canvases.length; i++) {
    const jpg = await canvasBlob(canvases[i], "image/jpeg", quality);
    const img = await pdf.embedJpg(await buf(jpg));
    const page = pdf.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    onP?.(60 + ((i + 1) / canvases.length) * 40, "Compactando…");
  }
  return [{ name: `${base(f.name)}-comprimido.pdf`, blob: new Blob([(await pdf.save()) as any], { type: MIME.pdf }) }];
}

export async function pdfInfo(f: File) {
  const d = await PDFDocument.load(await buf(f), { ignoreEncryption: true });
  const doc = await pdfDoc(f);
  const meta: any = await doc.getMetadata();
  return {
    paginas: d.getPageCount(),
    titulo: d.getTitle() || "—",
    autor: d.getAuthor() || "—",
    produtor: meta?.info?.Producer || "—",
    criado: d.getCreationDate()?.toLocaleString("pt-BR") || "—",
    tamanho: (f.size / 1024).toFixed(1) + " KB",
    cifrado: meta?.info?.IsEncrypted ? "sim" : "não",
  };
}

/* ---------------- imagens ---------------- */
export async function transformImage(
  f: File,
  opts: { target: string; quality: number; maxWidth?: number; grayscale?: boolean }
): Promise<OutFile[]> {
  let c = await fileToCanvas(f, f.name);
  if (opts.maxWidth && c.width > opts.maxWidth) {
    const r = opts.maxWidth / c.width;
    const n = document.createElement("canvas");
    n.width = Math.round(c.width * r);
    n.height = Math.round(c.height * r);
    n.getContext("2d")!.drawImage(c, 0, 0, n.width, n.height);
    c = n;
  }
  if (opts.grayscale) {
    const ctx = c.getContext("2d")!;
    const d = ctx.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < d.data.length; i += 4) {
      const g = 0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2];
      d.data[i] = d.data[i + 1] = d.data[i + 2] = g;
    }
    ctx.putImageData(d, 0, 0);
  }
  const blob = await canvasBlob(c, MIME[opts.target] || "image/png", opts.quality);
  return [{ name: `${base(f.name)}.${opts.target}`, blob }];
}

export async function imagesToOnePdf(files: File[], onP?: Progress): Promise<OutFile[]> {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < files.length; i++) {
    const c = await fileToCanvas(files[i], files[i].name);
    const jpg = await canvasBlob(c, "image/jpeg", 0.9);
    const img = await pdf.embedJpg(await buf(jpg));
    const page = pdf.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    onP?.(((i + 1) / files.length) * 100, files[i].name);
  }
  return [{ name: "imagens.pdf", blob: new Blob([(await pdf.save()) as any], { type: MIME.pdf }) }];
}

/* ---------------- IA local ---------------- */
const STOP = new Set("a o as os de da do das dos e em um uma para com que por no na nos nas se ao à é foi ser são como mais ou pelo pela sobre entre the of and to in for is are this that".split(" "));

export function analyzeText(text: string) {
  const words = text.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [];
  const freq = new Map<string, number>();
  words.forEach((w) => !STOP.has(w) && freq.set(w, (freq.get(w) || 0) + 1));
  const keywords = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 40);
  const scored = sentences.map((s) => {
    const ws = s.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [];
    const sc = ws.reduce((a, w) => a + (freq.get(w) || 0), 0) / Math.sqrt(ws.length || 1);
    return { s: s.trim(), sc };
  });
  const summary = scored
    .sort((a, b) => b.sc - a.sc)
    .slice(0, 5)
    .sort((a, b) => sentences.indexOf(a.s) - sentences.indexOf(b.s))
    .map((x) => x.s);
  const chars = text.length;
  const readMin = Math.max(1, Math.round(words.length / 200));
  return { palavras: words.length, caracteres: chars, sentencas: sentences.length, leitura: `${readMin} min`, keywords, summary };
}

export function suggestName(text: string, original: string) {
  const { keywords } = analyzeText(text);
  const slug = keywords.slice(0, 4).map((k) => k[0]).join("-") || "documento";
  const d = new Date().toISOString().slice(0, 10);
  return `${d}-${slug}.${ext(original)}`;
}

export function detectType(f: File) {
  const e = ext(f.name);
  const cat = IMAGE_EXTS.includes(e) ? "Imagem" : ["pdf"].includes(e) ? "PDF" : ["docx", "doc", "txt", "html", "htm", "rtf"].includes(e) ? "Documento" : ["xlsx", "xls", "csv", "json", "xml"].includes(e) ? "Dados" : ["pptx", "ppt"].includes(e) ? "Apresentação" : "Outro";
  return { ext: e, cat, mime: f.type || MIME[e] || "desconhecido", size: f.size };
}

/* ---------------- utilidades ---------------- */
export async function zipFiles(files: OutFile[], name = "pdf-change.zip"): Promise<OutFile> {
  const zip = new JSZip();
  files.forEach((f) => zip.file(f.name, f.blob));
  return { name, blob: await zip.generateAsync({ type: "blob" }) };
}

export function download(f: OutFile) {
  const url = URL.createObjectURL(f.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = f.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export const fmtSize = (n: number) => (n > 1048576 ? (n / 1048576).toFixed(2) + " MB" : (n / 1024).toFixed(1) + " KB");
