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
    "Assinar documentos",
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

function Hero() {
  const [file, setFile] = useState<string | null>(null);
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
          <div className="mt-8 flex items-center gap-6 text-sm text-ink/50">
            <span>🔒 Arquivos apagados em 1h</span>
            <span>⚡ Média de 3s por arquivo</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 translate-x-6 translate-y-6 rounded-3xl bg-brand" />
          <div className="animate-floaty rounded-3xl border border-black/5 bg-white p-6 shadow-2xl shadow-ink/10">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">Converter arquivo</p>
              <span className="rounded-md bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Beta</span>
            </div>
            <label className="mt-4 flex h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand/40 bg-brand-soft/60 text-center transition hover:border-brand">
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)} />
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-white">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
              </div>
              <p className="text-sm font-medium text-ink">{file ?? "Arraste seu PDF aqui"}</p>
              <p className="text-xs text-ink/50">PDF, DOCX, JPG · até 100 MB</p>
            </label>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["PDF → Word", "PDF → JPG", "Comprimir"].map((x) => (
                <a key={x} href="#conversoes" className="rounded-lg border border-black/10 py-2 text-center text-xs font-medium text-ink/70 transition hover:border-brand hover:bg-brand-soft hover:text-brand-dark">{x}</a>
              ))}
            </div>
            <a href="#conversoes" className="mt-3 block w-full rounded-xl bg-ink py-3 text-center text-sm font-semibold text-white transition hover:bg-brand">Converter agora</a>
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
  const pixKey = "+5551998661062";
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
            Gratuito para todos. Feito com carinho.
          </h2>
          <p className="mt-4 max-w-lg text-ink/60">
            O PDF Change é gratuito. Se ele ajuda você no dia a dia, considere apoiar o autor com uma doação via Pix. Toda ajuda faz a diferença.
          </p>
          <div className="mt-8 max-w-lg rounded-2xl border border-black/5 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Chave Pix (telefone)</p>
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
  return (
    <footer className="border-t border-black/5">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <div className="flex flex-wrap gap-6 text-sm text-ink/55">
          <a href="#conversoes" className="hover:text-brand">Ferramentas</a>
          <a href="#doar" className="hover:text-brand">Doar</a>
        </div>
        <div className="text-sm sm:text-right">
          <p className="text-ink/40">© 2026 PDF Change</p>
          <p className="mt-1 text-ink/60">Desenvolvido por Leonardo Bueno de Aguiar</p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  useEffect(() => {
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
      <Hero />
      <Studio />
      <How />
      <Donation />
      <CTA />
      <Footer />
    </div>
  );
}
