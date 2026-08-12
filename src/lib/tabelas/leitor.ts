export interface ArquivoLido {
  cabecalhos: string[];
  linhas: Record<string, unknown>[];
  aviso?: string | undefined;
}

function parseCsv(texto: string): string[][] {
  const separador = (texto.split("\n")[0]?.match(/;/g)?.length ?? 0) >= (texto.split("\n")[0]?.match(/,/g)?.length ?? 0) ? ";" : ",";
  const linhas: string[][] = [];
  let campo = "";
  let atual: string[] = [];
  let aspas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') aspas = false;
      else campo += c;
      continue;
    }
    if (c === '"') aspas = true;
    else if (c === separador) {
      atual.push(campo);
      campo = "";
    } else if (c === "\n") {
      atual.push(campo);
      linhas.push(atual);
      atual = [];
      campo = "";
    } else if (c !== "\r") campo += c;
  }
  if (campo || atual.length) {
    atual.push(campo);
    linhas.push(atual);
  }
  return linhas.filter((l) => l.some((v) => v.trim() !== ""));
}

function deMatriz(matriz: unknown[][]): ArquivoLido {
  const indiceCabecalho = matriz.findIndex(
    (linha) => linha.filter((c) => String(c ?? "").trim() !== "").length >= 2,
  );
  if (indiceCabecalho < 0) return { cabecalhos: [], linhas: [] };

  const cabecalhos = (matriz[indiceCabecalho] ?? []).map((c, i) => {
    const nome = String(c ?? "").trim();
    return nome || `Coluna ${i + 1}`;
  });

  const linhas = matriz.slice(indiceCabecalho + 1).flatMap((linha) => {
    if (!linha.some((c) => String(c ?? "").trim() !== "")) return [];
    const objeto: Record<string, unknown> = {};
    cabecalhos.forEach((cabecalho, i) => {
      objeto[cabecalho] = linha[i] ?? "";
    });
    return [objeto];
  });

  return { cabecalhos, linhas };
}

async function lerXlsx(arquivo: File): Promise<ArquivoLido> {
  const XLSX = await import("xlsx");
  const buffer = await arquivo.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });
  const nome = wb.SheetNames[0];
  if (!nome) return { cabecalhos: [], linhas: [], aviso: "Planilha sem abas." };
  const matriz = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[nome]!, {
    header: 1,
    blankrows: false,
    defval: "",
  });
  const resultado = deMatriz(matriz);
  return {
    ...resultado,
    aviso: wb.SheetNames.length > 1 ? `Arquivo com ${wb.SheetNames.length} abas — foi lida a aba "${nome}".` : undefined,
  };
}

async function lerCsv(arquivo: File): Promise<ArquivoLido> {
  const texto = await arquivo.text();
  return deMatriz(parseCsv(texto));
}

async function lerPdf(arquivo: File): Promise<ArquivoLido> {
  const pdfjs = await import("pdfjs-dist");
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const doc = await pdfjs.getDocument({ data: await arquivo.arrayBuffer() }).promise;
  const linhasTexto: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const pagina = await doc.getPage(p);
    const conteudo = await pagina.getTextContent();
    const porLinha = new Map<number, { x: number; texto: string }[]>();

    for (const item of conteudo.items as { str: string; transform: number[] }[]) {
      if (!item.str.trim()) continue;
      const y = Math.round(item.transform[5]!);
      const chave = Math.round(y / 4) * 4;
      const lista = porLinha.get(chave) ?? [];
      lista.push({ x: item.transform[4]!, texto: item.str });
      porLinha.set(chave, lista);
    }

    for (const chave of [...porLinha.keys()].sort((a, b) => b - a)) {
      const partes = porLinha.get(chave)!.sort((a, b) => a.x - b.x);
      let texto = "";
      let anterior: number | null = null;
      for (const parte of partes) {
        if (anterior !== null && parte.x - anterior > 12) texto += "\t";
        texto += parte.texto;
        anterior = parte.x + parte.texto.length * 4.5;
      }
      if (texto.trim()) linhasTexto.push(texto.trim());
    }
  }

  const matriz = linhasTexto
    .map((linha) => linha.split(/\t+|\s{3,}/).map((c) => c.trim()))
    .filter((colunas) => colunas.length >= 2);

  const resultado = deMatriz(matriz);
  return {
    ...resultado,
    aviso:
      "PDF é um formato não estruturado: confira o mapeamento e os valores antes de salvar. Prefira XLSX/CSV quando disponível.",
  };
}

export async function lerArquivo(arquivo: File): Promise<ArquivoLido> {
  const nome = arquivo.name.toLowerCase();
  if (nome.endsWith(".pdf")) return lerPdf(arquivo);
  if (nome.endsWith(".csv") || nome.endsWith(".txt")) return lerCsv(arquivo);
  if (nome.endsWith(".xlsx") || nome.endsWith(".xls") || nome.endsWith(".xlsm")) return lerXlsx(arquivo);
  throw new Error("Formato não suportado. Use XLSX, XLS, CSV ou PDF.");
}
