import { useEffect, useState } from "react";
import { Logo } from "./components/Logo";
import Studio from "./components/Studio";

const steps = [
  { n: "01", t: "Envie", d: "Arraste seus arquivos ou escolha do seu dispositivo." },
  { n: "02", t: "Transforme", d: "Escolha a ferramenta e ajuste as opções em um clique." },
  { n: "03", t: "Baixe", d: "Receba o resultado pronto, com os arquivos apagados depois." },
];

function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/95 text-white backdrop-blur">
      <style>{`
        .pdf-change-nav-logo,
        .pdf-change-nav-logo > * {
          background: transparent !important;
        }
        .pdf-change-nav-logo,
        .pdf-change-nav-logo * {
          color: #fff !important;
        }
      `}</style>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-1.5 px-3 py-3 sm:gap-2 sm:px-5 sm:py-3.5">
        <div className="pdf-change-nav-logo shrink-0 whitespace-nowrap px-1 py-1 sm:px-2">
          <Logo />
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium text-white/75 md:flex">
          <a href="#conversoes" className="hover:text-brand">Ferramentas</a>
          <a href="#como" className="hover:text-brand">Como funciona</a>
          <a href="#doar" className="hover:text-brand">Doar</a>
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <a href="#conversoes" className="whitespace-nowrap rounded-lg bg-brand px-2 py-2 text-xs font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark sm:px-4 sm:text-sm">
            <span className="min-[400px]:hidden">Começar</span>
            <span className="hidden min-[400px]:inline">Começar grátis</span>
          </a>
          <button onClick={() => setOpen(!open)} className="shrink-0 rounded-lg border border-white/20 p-2 md:hidden" aria-label="menu">
            <svg viewBox="0 0 24 24" className="h-4 w-4" stroke="currentColor" strokeWidth={2} fill="none"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
        </div>
      </div>
      {open && (
        <div className="flex flex-col gap-1 border-t border-white/10 px-5 py-3 md:hidden">
          {["Ferramentas", "Como funciona", "Doar"].map((x, i) => (
            <a key={x} href={["#conversoes", "#como", "#doar"][i]} onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 text-sm text-white/75">{x}</a>
          ))}
        </div>
      )}
    </header>
  );
}

function ToolsTicker() {
  const tools = [
    "Converter PDF para Word",
    "Converter PDF para JPG",
    "Comprimir arquivos",
    "Juntar PDFs",
    "Dividir PDFs",
  ];

  return (
    <section aria-label="O que você pode fazer no PDF Change" className="relative overflow-hidden border-y border-white/10 bg-ink py-5">
      <style>{`
        @keyframes pdf-change-tools-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .pdf-change-tools-viewport {
          position: relative;
          overflow: hidden;
        }
        .pdf-change-tools-track {
          display: flex;
          width: max-content;
          animation: pdf-change-tools-scroll 38s linear infinite;
        }
        .pdf-change-tools-group {
          box-sizing: border-box;
          display: flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: space-around;
          gap: 2rem;
          min-width: 100vw;
          margin: 0;
          padding: 0 2rem;
          list-style: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .pdf-change-tools-track {
            width: 100%;
            animation: none;
          }
          .pdf-change-tools-group {
            width: 100%;
            min-width: 0;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.75rem 1.5rem;
            padding: 0 1.5rem;
          }
          .pdf-change-tools-copy,
          .pdf-change-tools-fade {
            display: none;
          }
        }
      `}</style>
      <div className="pdf-change-tools-viewport">
        <div className="pdf-change-tools-fade pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-ink to-transparent" aria-hidden="true" />
        <div className="pdf-change-tools-fade pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-ink to-transparent" aria-hidden="true" />
        <div className="pdf-change-tools-track">
          {[0, 1].map((copy) => (
            <ul key={copy} className={`pdf-change-tools-group ${copy === 1 ? "pdf-change-tools-copy" : ""}`} aria-hidden={copy === 1 ? true : undefined}>
              {tools.map((tool) => (
                <li key={tool} className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium text-white/80">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                  {tool}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}

// Alguns navegadores não implementam a iteração assíncrona de ReadableStream
// usada pelo PDF.js. Só adiciona a compatibilidade quando ela está ausente.
function ensureReadableStreamAsyncIterator() {
  if (typeof ReadableStream === "undefined" || typeof Symbol === "undefined" || typeof Symbol.asyncIterator !== "symbol") return;
  const prototype = ReadableStream.prototype as any;
  if (typeof prototype[Symbol.asyncIterator] === "function") return;

  const iterator = typeof prototype.values === "function"
    ? prototype.values
    : async function* (this: ReadableStream<unknown>) {
        const reader = this.getReader();
        let completed = false;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              completed = true;
              break;
            }
            yield value;
          }
        } finally {
          if (!completed) {
            try { await reader.cancel(); } catch { /* mantém o erro original, se houver */ }
          }
          reader.releaseLock();
        }
      };

  try {
    Object.defineProperty(prototype, Symbol.asyncIterator, {
      configurable: true,
      writable: true,
      value: iterator,
    });
  } catch {
    // Se o protótipo estiver bloqueado, o motor exibirá o erro de conversão.
  }
}

type HeroProps = {
  file: File | null;
  onFileChange: (file: File | null) => void;
};

function Hero({ file, onFileChange }: HeroProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  function chooseFile(next: File) {
    setError("");
    if (next.type !== "application/pdf" && !next.name.toLowerCase().endsWith(".pdf")) {
      onFileChange(null);
      setError("Selecione um arquivo PDF para continuar.");
      return;
    }
    if (next.size > 100 * 1024 * 1024) {
      onFileChange(null);
      setError("O arquivo deve ter no máximo 100 MB.");
      return;
    }
    onFileChange(next);
  }

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
        <div>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight text-ink md:text-6xl">
            Seu PDF,<br />do jeito que<br /><span className="text-brand">você precisa.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-ink/60">
            Converta, junte, divida e assine documentos direto no navegador. Rápido, seguro e sem instalar nada.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#conversoes" className="rounded-xl bg-brand px-6 py-3.5 font-semibold text-white shadow-xl shadow-brand/30 transition hover:bg-brand-dark">
              Transformar um PDF
            </a>
            <a href="#como" className="rounded-xl border border-ink/15 px-6 py-3.5 font-semibold text-ink transition hover:border-brand hover:text-brand">
              Ver como funciona
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-ink/50">
            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 3 7.5 7 10 4-2.5 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
              Sem armazenamento em servidor.
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2M9 2h6M12 5V2" /></svg>
              Média de 3s por arquivo
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 translate-x-6 translate-y-6 rounded-3xl bg-brand" />
          <div className="animate-floaty rounded-3xl border border-black/5 bg-white p-6 shadow-2xl shadow-ink/10">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">Converter arquivo</p>
              <span className="rounded-md bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Beta</span>
            </div>
            <label
              className={`mt-4 flex h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-brand-soft/60 p-4 text-center transition focus-within:ring-2 focus-within:ring-brand/50 hover:border-brand ${dragging ? "border-brand" : "border-brand/40"}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const dropped = e.dataTransfer.files[0];
                if (dropped) chooseFile(dropped);
              }}
            >
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                aria-label="Selecionar arquivo PDF"
                onChange={(e) => {
                  const selected = e.currentTarget.files?.[0];
                  if (selected) chooseFile(selected);
                  e.currentTarget.value = "";
                }}
              />
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-white">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
              </div>
              <p className="max-w-full truncate text-sm font-medium text-ink">{file?.name ?? "Arraste seu PDF aqui"}</p>
              <p className="text-xs text-ink/50">{file ? "Toque ou clique para trocar o arquivo" : "PDF · até 100 MB"}</p>
            </label>
            {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
            <a href="#conversoes" className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-center text-sm font-semibold text-white transition hover:bg-brand">
              Escolher tipo de conversão
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
            </a>
            {file && <p className="mt-3 text-center text-xs text-ink/55">Seu PDF será adicionado às ferramentas compatíveis.</p>}
          </div>
        </div>
      </div>
      <ToolsTicker />
    </section>
  );
}

function How() {
  return (
    <section id="como" className="bg-brand-soft/70 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="max-w-lg text-4xl font-semibold tracking-tight text-ink">Três passos. Zero complicação.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl bg-white p-7 shadow-sm">
              <span className="text-5xl font-bold text-brand/25">{s.n}</span>
              <h3 className="mt-4 text-xl font-semibold text-ink">{s.t}</h3>
              <p className="mt-2 text-sm text-ink/55">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Donation() {
  // Chave Pix de telefone no formato internacional.
  const pixKey = "291b3543-2252-463b-bbda-0e91564f0263";
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  async function copyPixKey() {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <section id="doar" className="mx-auto max-w-6xl px-5 py-24">
      <div className="grid items-center gap-10 rounded-3xl border border-black/5 bg-brand-soft/70 p-8 md:grid-cols-[1fr_auto] md:p-12">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-brand">Apoie o autor</p>
          <h2 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-ink">
            Gratuito para todos. Seu apoio ajuda este projeto a continuar.
          </h2>
          <p className="mt-4 max-w-lg text-ink/60">
            O PDF Change é gratuito. Se ele ajuda você no dia a dia, considere apoiar o autor com uma doação via Pix. Toda ajuda faz a diferença.
          </p>
          <div className="mt-8 max-w-lg rounded-2xl border border-black/5 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Chave Pix (aleatória)</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <code className="select-all break-all text-lg font-semibold text-ink">{pixKey}</code>
              <button type="button" onClick={copyPixKey} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark">
                {copyStatus === "copied" ? "Chave copiada!" : "Copiar chave Pix"}
              </button>
            </div>
            <p className="mt-3 text-xs text-ink/50" role="status" aria-live="polite">
              {copyStatus === "error"
                ? "Não foi possível copiar automaticamente. Selecione e copie a chave acima."
                : copyStatus === "copied"
                  ? "Chave Pix copiada para a área de transferência."
                  : "Use a chave para doar o valor que desejar."}
            </p>
          </div>
        </div>
        <div className="mx-auto w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-ink">Doe pelo Pix</p>
          <img
            src="/qr.png"
            alt="QR Code Pix para doar ao autor"
            width={233}
            height={232}
            className="mx-auto mt-3 h-auto w-full max-w-[233px]"
          />
          <p className="mt-3 text-xs text-ink/60">Escaneie com o aplicativo do seu banco.</p>
          <p className="mt-2 text-xs text-ink/50">Escolha o valor da sua doação no aplicativo do seu banco.</p>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-24">
      <div className="relative overflow-hidden rounded-3xl bg-ink px-8 py-16 text-center">
        <div className="absolute -bottom-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-brand blur-3xl opacity-60" />
        <div className="relative">
          <h2 className="text-4xl font-semibold tracking-tight text-white">Mude seus PDFs hoje.</h2>
          <p className="mx-auto mt-3 max-w-md text-white/60">Use as ferramentas gratuitamente, sem precisar criar uma conta.</p>
          <a href="#conversoes" className="mt-8 inline-block rounded-xl bg-white px-7 py-3.5 font-semibold text-ink transition hover:bg-brand hover:text-white">
            Usar ferramentas grátis
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const recursos = [
    "Converter PDF para Word e JPG",
    "Juntar e dividir arquivos PDF",
    "Comprimir e organizar documentos",
  ];

  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <style>{`
        .pdf-change-footer-logo,
        .pdf-change-footer-logo > * {
          background: transparent !important;
        }
        .pdf-change-footer-logo,
        .pdf-change-footer-logo * {
          color: #fff !important;
        }
      `}</style>
      <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-brand/20 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-5 pt-16 sm:pt-20">
        <div className="grid gap-10 border-b border-white/10 pb-14 sm:grid-cols-2 lg:grid-cols-[1.45fr_0.8fr_1.1fr_1.15fr] lg:gap-12">
          <div>
            <div className="pdf-change-footer-logo inline-block"><Logo /></div>
            <p className="mt-5 max-w-xs text-sm leading-7 text-white/65">
              Ferramentas gratuitas para converter, organizar e transformar seus PDFs direto no navegador.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/75">
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></svg>
              Gratuito e sem cadastro
            </div>
          </div>

          <nav aria-label="Navegação no rodapé">
            <h2 className="text-sm font-semibold text-white">Navegação</h2>
            <ul className="mt-5 space-y-3 text-sm text-white/65">
              <li><a href="#conversoes" className="transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Ferramentas</a></li>
              <li><a href="#como" className="transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Como funciona</a></li>
              <li><a href="#doar" className="transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Doar</a></li>
            </ul>
          </nav>

          <section aria-labelledby="footer-recursos">
            <h2 id="footer-recursos" className="text-sm font-semibold text-white">Recursos populares</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-white/65">
              {recursos.map((recurso) => <li key={recurso}>{recurso}</li>)}
            </ul>
            <a href="#conversoes" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              Ver todas as ferramentas
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
            </a>
          </section>

          <section aria-labelledby="footer-apoio" className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 id="footer-apoio" className="text-sm font-semibold text-white">Apoie o projeto</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">
              O PDF Change é gratuito. Sua contribuição via Pix ajuda a manter o projeto.
            </p>

            <a href="#doar" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-brand hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              Apoiar com Pix
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
            </a>
          </section>
        </div>

        <div className="flex flex-col gap-2 py-7 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p>© {new Date().getFullYear()} PDF Change</p>
          <p>Desenvolvido por <span className="font-medium text-white/80">Leonardo Bueno de Aguiar</span></p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    ensureReadableStreamAsyncIterator();
    // Substitui eventuais favicons antigos, incluindo o padrão do projeto.
    const previousIcons = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'));
    previousIcons.forEach((icon) => icon.remove());

    const icons = [
      { href: "/favicon.ico", type: "image/x-icon" },
      { href: "/favicon.svg", type: "image/svg+xml" },
    ].map(({ href, type }) => {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = href;
      link.type = type;
      document.head.appendChild(link);
      return link;
    });

    return () => {
      icons.forEach((icon) => icon.remove());
      previousIcons.forEach((icon) => document.head.appendChild(icon));
    };
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <Nav />
      <Hero file={selectedFile} onFileChange={setSelectedFile} />
      <Studio selectedFile={selectedFile} onClearSelectedFile={() => setSelectedFile(null)} onBeforeRun={ensureReadableStreamAsyncIterator} />
      <How />
      <Donation />
      <CTA />
      <Footer />
    </div>
  );
}
