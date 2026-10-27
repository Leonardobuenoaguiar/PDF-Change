export type Cat = "pdf" | "conv" | "img" | "ocr" | "ia" | "tools";

export type Tool = {
  id: string;
  label: string;
  desc: string;
  cat: Cat;
  group?: string;
  accept: string;
  target?: string;
  kind:
    | "convert"
    | "merge"
    | "split"
    | "rotate"
    | "compress"
    | "info"
    | "image"
    | "img2pdf"
    | "ocr-text"
    | "ocr-pdf"
    | "analyze"
    | "detect"
    | "rename"
    | "zip";
  multi?: boolean;
};

const c = (
  id: string,
  label: string,
  accept: string,
  target: string,
  group: string,
  desc: string,
  cat: Cat = "conv"
): Tool => ({ id, label, desc, cat, group, accept, target, kind: "convert", multi: true });

export const CATEGORIES: { id: Cat; icon: string; name: string; desc: string }[] = [
  { id: "pdf", icon: "📄", name: "PDF", desc: "Juntar, dividir, girar, comprimir e inspecionar." },
  { id: "conv", icon: "🔄", name: "Conversões", desc: "48 conversões entre PDF, Office, imagens e dados." },
  { id: "img", icon: "🖼️", name: "Imagens", desc: "Formatos, redimensionar, qualidade e lote." },
  { id: "ocr", icon: "📑", name: "OCR", desc: "Reconhecimento de texto em PT-BR e inglês." },
  { id: "ia", icon: "🤖", name: "IA", desc: "Resumo, palavras-chave e detecção automática." },
  { id: "tools", icon: "⚙️", name: "Ferramentas", desc: "ZIP, histórico, fila e utilidades." },
];

export const TOOLS: Tool[] = [
  /* ---------- PDF ---------- */
  { id: "merge", label: "Juntar PDF", desc: "Una vários PDFs em um único arquivo, na ordem escolhida.", cat: "pdf", accept: ".pdf", kind: "merge", multi: true },
  { id: "split", label: "Dividir / Extrair", desc: "Extraia intervalos, remova páginas ou separe uma a uma.", cat: "pdf", accept: ".pdf", kind: "split" },
  { id: "rotate", label: "Girar páginas", desc: "Rotacione todas as páginas em 90°, 180° ou 270°.", cat: "pdf", accept: ".pdf", kind: "rotate", multi: true },
  { id: "compress", label: "Comprimir PDF", desc: "Rasteriza em JPEG com qualidade ajustável e reduz o tamanho.", cat: "pdf", accept: ".pdf", kind: "compress", multi: true },
  { id: "pdfinfo", label: "Inspecionar PDF", desc: "Páginas, autor, produtor, data e tamanho do arquivo.", cat: "pdf", accept: ".pdf", kind: "info" },
  { id: "pdf-pdfa", label: "PDF → PDF/A", desc: "Normaliza metadados e salva sem object streams.", cat: "pdf", accept: ".pdf", target: "pdfa", kind: "convert", multi: true },

  /* ---------- Conversões: PDF PARA ---------- */
  c("pdf-docx", "PDF → Word", ".pdf", "docx", "PDF para", "Texto extraído em .docx totalmente editável."),
  c("pdf-xlsx", "PDF → Excel", ".pdf", "xlsx", "PDF para", "Linhas e colunas detectadas em .xlsx."),
  c("pdf-pptx", "PDF → PowerPoint", ".pdf", "pptx", "PDF para", "Um slide por página do documento."),
  c("pdf-jpg", "PDF → JPG", ".pdf", "jpg", "PDF para", "Renderização de alta resolução, uma imagem por página."),
  c("pdf-png", "PDF → PNG", ".pdf", "png", "PDF para", "PNG sem perdas de cada página."),
  c("pdf-html", "PDF → HTML", ".pdf", "html", "PDF para", "Página web com o conteúdo de cada folha."),
  c("pdf-txt", "PDF → TXT", ".pdf", "txt", "PDF para", "Texto puro com quebras de linha preservadas."),
  c("pdf-csv", "PDF → CSV", ".pdf", "csv", "PDF para", "Detecção de colunas por espaçamento."),
  c("pdf-json", "PDF → JSON", ".pdf", "json", "PDF para", "Estrutura { page, text } por página."),
  c("pdf-pdfa2", "PDF → PDF/A", ".pdf", "pdfa", "PDF para", "Metadados normalizados para arquivamento."),

  /* ---------- Conversões: PARA PDF ---------- */
  c("docx-pdf", "Word → PDF", ".docx", "pdf", "Para PDF", "Converte .docx preservando o texto em A4."),
  c("xlsx-pdf", "Excel → PDF", ".xlsx,.xls", "pdf", "Para PDF", "Tabela paginada em paisagem, aba por aba."),
  c("pptx-pdf", "PowerPoint → PDF", ".pptx", "pdf", "Para PDF", "Um slide por página, com o texto completo."),
  c("jpg-pdf", "JPG → PDF", ".jpg,.jpeg", "pdf", "Para PDF", "Imagem encaixada na página em tamanho real."),
  c("png-pdf", "PNG → PDF", ".png", "pdf", "Para PDF", "PNG embutido sem perda de qualidade."),
  c("bmp-pdf", "BMP → PDF", ".bmp", "pdf", "Para PDF", "Decodificação nativa do bitmap."),
  c("webp-pdf", "WEBP → PDF", ".webp", "pdf", "Para PDF", "Converte WEBP moderno para PDF."),
  c("tiff-pdf", "TIFF → PDF", ".tif,.tiff", "pdf", "Para PDF", "Decodificador TIFF embutido (UTIF)."),
  c("html-pdf", "HTML → PDF", ".html,.htm", "pdf", "Para PDF", "Extrai o conteúdo textual e pagina em A4."),
  c("txt-pdf", "TXT → PDF", ".txt", "pdf", "Para PDF", "Quebra automática de linha e paginação."),
  c("csv-pdf", "CSV → PDF", ".csv", "pdf", "Para PDF", "Grade tabular com cabeçalho em negrito."),
  c("xml-pdf", "XML → PDF", ".xml", "pdf", "Para PDF", "Conteúdo do XML impresso em PDF."),
  c("json-pdf", "JSON → PDF", ".json", "pdf", "Para PDF", "JSON formatado e paginado."),

  /* ---------- Conversões entre imagens ---------- */
  c("jpg-png", "JPG → PNG", ".jpg,.jpeg", "png", "Imagens", "Converte para PNG sem perdas.", "conv"),
  c("png-jpg", "PNG → JPG", ".png", "jpg", "Imagens", "Fundo branco aplicado na transparência.", "conv"),
  c("jpg-webp", "JPG → WEBP", ".jpg,.jpeg", "webp", "Imagens", "Até 30% menor que o JPG original.", "conv"),
  c("webp-jpg", "WEBP → JPG", ".webp", "jpg", "Imagens", "Compatibilidade universal.", "conv"),
  c("png-webp", "PNG → WEBP", ".png", "webp", "Imagens", "Reduz drasticamente o peso de PNGs.", "conv"),
  c("webp-png", "WEBP → PNG", ".webp", "png", "Imagens", "Volta ao formato sem perdas.", "conv"),
  c("bmp-png", "BMP → PNG", ".bmp", "png", "Imagens", "Moderniza bitmaps antigos.", "conv"),
  c("tiff-jpg", "TIFF → JPG", ".tif,.tiff", "jpg", "Imagens", "Decodifica TIFF e exporta em JPG.", "conv"),

  /* ---------- Conversões de documentos ---------- */
  c("docx-txt", "DOCX → TXT", ".docx", "txt", "Documentos", "Texto cru extraído com Mammoth."),
  c("docx-html", "DOCX → HTML", ".docx", "html", "Documentos", "HTML semântico com títulos e listas."),
  c("xlsx-csv", "XLSX → CSV", ".xlsx,.xls", "csv", "Documentos", "Primeira aba exportada em CSV."),
  c("xlsx-json", "XLSX → JSON", ".xlsx,.xls", "json", "Documentos", "Array de objetos usando a 1ª linha como chave."),
  c("csv-xlsx", "CSV → XLSX", ".csv", "xlsx", "Documentos", "Planilha Excel pronta para edição."),
  c("csv-pdf2", "CSV → PDF", ".csv", "pdf", "Documentos", "Tabela formatada em PDF."),
  c("txt-docx", "TXT → DOCX", ".txt", "docx", "Documentos", "Documento Word com parágrafos."),
  c("txt-pdf2", "TXT → PDF", ".txt", "pdf", "Documentos", "PDF paginado a partir de texto."),
  c("html-docx", "HTML → DOCX", ".html,.htm", "docx", "Documentos", "Conteúdo da página em Word."),
  c("html-pdf2", "HTML → PDF", ".html,.htm", "pdf", "Documentos", "Página web impressa em PDF."),

  /* ---------- Imagens (categoria própria) ---------- */
  { id: "img-studio", label: "Converter imagem", desc: "Escolha formato, qualidade, largura máxima e tons de cinza.", cat: "img", accept: "image/*,.tif,.tiff", kind: "image", multi: true },
  { id: "img-batch", label: "Conversão em lote", desc: "Converta dezenas de imagens de uma vez e baixe em ZIP.", cat: "img", accept: "image/*,.tif,.tiff", kind: "image", multi: true },
  { id: "img-pdf-one", label: "Imagens → 1 PDF", desc: "Junte várias imagens em um único PDF, na ordem da lista.", cat: "img", accept: "image/*,.tif,.tiff", kind: "img2pdf", multi: true },
  { id: "img-detect", label: "Detectar formato", desc: "Identifica tipo, MIME, dimensões e peso do arquivo.", cat: "img", accept: "*", kind: "detect", multi: true },

  /* ---------- OCR ---------- */
  { id: "ocr-img", label: "Imagem → Texto", desc: "OCR em PT-BR + inglês direto da imagem.", cat: "ocr", accept: "image/*,.tif,.tiff", kind: "ocr-text", multi: true },
  { id: "ocr-scan", label: "PDF escaneado → Texto", desc: "Rasteriza e reconhece o texto de cada página.", cat: "ocr", accept: ".pdf", kind: "ocr-text", multi: true },
  { id: "ocr-searchable", label: "Imagem/PDF → PDF pesquisável", desc: "Adiciona camada de texto invisível sobre o original.", cat: "ocr", accept: ".pdf,image/*", kind: "ocr-pdf", multi: true },
  { id: "ocr-editable", label: "PDF → Texto editável", desc: "Usa a camada de texto e cai no OCR se não existir.", cat: "ocr", accept: ".pdf", target: "txt", kind: "convert", multi: true },
  { id: "ocr-word", label: "PDF → Word editável", desc: "Gera .docx a partir do texto reconhecido.", cat: "ocr", accept: ".pdf", target: "docx", kind: "convert", multi: true },

  /* ---------- IA ---------- */
  { id: "ia-summary", label: "Resumo automático", desc: "Sumarização extrativa por relevância de termos.", cat: "ia", accept: ".pdf,.docx,.txt,.html,.csv,.xlsx,image/*", kind: "analyze" },
  { id: "ia-keywords", label: "Palavras-chave", desc: "Ranking de termos mais relevantes do documento.", cat: "ia", accept: ".pdf,.docx,.txt,.html,.csv,.xlsx,image/*", kind: "analyze" },
  { id: "ia-rename", label: "Renomear com IA", desc: "Sugere um nome descritivo com data e termos-chave.", cat: "ia", accept: ".pdf,.docx,.txt,.html", kind: "rename", multi: true },
  { id: "ia-detect", label: "Detecção automática", desc: "Reconhece o tipo do arquivo e sugere conversões.", cat: "ia", accept: "*", kind: "detect", multi: true },

  /* ---------- Ferramentas ---------- */
  { id: "tool-zip", label: "Compactar em ZIP", desc: "Junte qualquer quantidade de arquivos em um .zip.", cat: "tools", accept: "*", kind: "zip", multi: true },
  { id: "tool-detect", label: "Inspetor de arquivos", desc: "Tipo, MIME, extensão e tamanho de cada arquivo.", cat: "tools", accept: "*", kind: "detect", multi: true },
  { id: "tool-img2pdf", label: "Pasta de imagens → PDF", desc: "Selecione uma pasta inteira e gere um PDF único.", cat: "tools", accept: "image/*", kind: "img2pdf", multi: true },
  { id: "tool-compress", label: "Compressor em lote", desc: "Comprima vários PDFs na fila de processamento.", cat: "tools", accept: ".pdf", kind: "compress", multi: true },
];

export const byCat = (cat: Cat) => TOOLS.filter((t) => t.cat === cat);
