import { XMLParser } from "fast-xml-parser";

import { regiaoDeUF, normalizar, tituloCidade } from "./geography";
import type { CTeRecord, ComponenteFrete, ParseResult, StatusCTe, Unidade } from "./types";

/**
 * Parser de CT-e independente da interface.
 * Tolerante a versões (2.00/3.00/4.00), a namespaces com/sem prefixo,
 * a cteProc / CTe / cteOSProc e a campos ausentes.
 * NUNCA inventa valores: campo ausente = null.
 */

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
});

type Any = Record<string, unknown>;

function isObj(v: unknown): v is Any {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Busca em profundidade a primeira ocorrência de uma tag. */
function find(node: unknown, tag: string): unknown {
  if (!isObj(node)) return undefined;
  if (tag in node) return node[tag];
  for (const value of Object.values(node)) {
    const list = Array.isArray(value) ? value : [value];
    for (const item of list) {
      const found = find(item, tag);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/** Coleta todas as ocorrências de uma tag em profundidade. */
function findAll(node: unknown, tag: string, acc: unknown[] = []): unknown[] {
  if (!isObj(node)) return acc;
  for (const [key, value] of Object.entries(node)) {
    const list = Array.isArray(value) ? value : [value];
    if (key === tag) acc.push(...list);
    for (const item of list) findAll(item, tag, acc);
  }
  return acc;
}

function text(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return String(value);
  if (isObj(value) && "#text" in value) return text(value["#text"]);
  return null;
}

function str(node: unknown, tag: string): string | null {
  return text(find(node, tag));
}

function num(node: unknown, tag: string): number | null {
  const raw = str(node, tag);
  if (raw === null) return null;
  const parsed = Number(raw.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function unidadeDe(municipio: string | null, uf: string | null): Unidade {
  const m = normalizar(municipio);
  if (!m) return "Outra";
  if (m.includes("CAMAQUA")) return "Camaquã";
  if (m.includes("PELOTAS")) return "Pelotas";
  if (uf) return "Outra";
  return "Outra";
}

function trimestreDe(mes: number): number {
  return Math.floor((mes - 1) / 3) + 1;
}

export function parseCTeXml(xml: string, arquivo = "(memória)", guardarXml = false): ParseResult {
  try {
    const doc = parser.parse(xml) as Any;
    const infCte = find(doc, "infCte") ?? find(doc, "infCteOS");
    if (!isObj(infCte)) {
      return { record: null, erro: "XML sem bloco infCte (não é um CT-e)", arquivo };
    }

    const id = text((infCte as Any)["@_Id"]) ?? "";
    const chaveCTe =
      (id.replace(/\D/g, "") || str(doc, "chCTe") || "").slice(0, 44) || "";
    if (chaveCTe.length !== 44) {
      return { record: null, erro: "Chave do CT-e não identificada", arquivo };
    }

    const ide = find(infCte, "ide");
    const emit = find(infCte, "emit");
    const rem = find(infCte, "rem");
    const dest = find(infCte, "dest") ?? find(infCte, "toma");
    const vPrest = find(infCte, "vPrest");
    const infCarga = find(infCte, "infCarga");

    const dhEmi = str(ide, "dhEmi") ?? str(ide, "dEmi");
    if (!dhEmi) return { record: null, erro: "CT-e sem data de emissão", arquivo };
    const data = new Date(dhEmi);
    if (Number.isNaN(data.getTime())) {
      return { record: null, erro: "Data de emissão inválida", arquivo };
    }

    // ----- Status (autorização / cancelamento) -----
    const cStat = str(doc, "cStat");
    const eventos = findAll(doc, "tpEvento").map((e) => text(e));
    const canceladoEvento = eventos.includes("110111") || find(doc, "evCancCTe") !== undefined;
    const cancelado = canceladoEvento || cStat === "101" || cStat === "135";
    const autorizado = cStat === "100" || (cStat === null && !cancelado);
    const statusCTe: StatusCTe = cancelado
      ? "Cancelado"
      : autorizado
        ? "Autorizado"
        : "Não informado";

    // ----- Origem / Destino -----
    const cidadeOrigem =
      tituloCidade(str(ide, "xMunIni")) ?? tituloCidade(str(rem, "xMun")) ?? null;
    const ufOrigem = (str(ide, "UFIni") ?? str(rem, "UF") ?? null)?.toUpperCase() ?? null;
    const cidadeDestino =
      tituloCidade(str(ide, "xMunFim")) ?? tituloCidade(str(dest, "xMun")) ?? null;
    const ufDestino = (str(ide, "UFFim") ?? str(dest, "UF") ?? null)?.toUpperCase() ?? null;

    // ----- Unidade da empresa (destinatário) -----
    const municipioDest = str(dest, "xMun") ?? str(ide, "xMunFim");
    let unidadeDestino = unidadeDe(municipioDest, ufDestino);
    if (unidadeDestino === "Outra") {
      unidadeDestino = unidadeDe(str(ide, "xMunFim"), ufDestino);
    }

    // ----- Fornecedor (remetente) -----
    const nomeFornecedorRaw = str(rem, "xNome");
    const nomeFornecedor = nomeFornecedorRaw ?? "Não identificado";
    const cnpjFornecedor = str(rem, "CNPJ") ?? str(rem, "CPF") ?? null;

    // ----- Transportadora (emitente) -----
    const nomeTransportadora = str(emit, "xNome") ?? "Não identificada";
    const cnpjTransportadora = str(emit, "CNPJ") ?? str(emit, "CPF") ?? null;

    // ----- Financeiro -----
    const valorPrestacao = num(vPrest, "vTPrest");
    const valorReceber = num(vPrest, "vRec");
    const componentes: ComponenteFrete[] = findAll(vPrest, "Comp")
      .map((c) => ({ nome: str(c, "xNome") ?? "—", valor: num(c, "vComp") ?? 0 }))
      .filter((c) => c.nome !== "—" || c.valor !== 0);
    const valorPedagio =
      componentes.find((c) => normalizar(c.nome).includes("PEDAGIO"))?.valor ?? null;
    const outrosValores = componentes
      .filter((c) => {
        const n = normalizar(c.nome);
        return !n.includes("FRETE") && !n.includes("PEDAGIO");
      })
      .reduce((soma, c) => soma + c.valor, 0);
    const valorICMS = num(find(infCte, "imp"), "vICMS");
    const valorTotalCTe = valorPrestacao ?? valorReceber ?? null;

    // ----- Carga -----
    const quantidades = findAll(infCarga, "infQ").map((q) => ({
      medida: normalizar(str(q, "tpMed")),
      quantidade: num(q, "qCarga"),
    }));
    const pesoPreferido =
      quantidades.find((q) => q.medida.includes("PESO BRUTO")) ??
      quantidades.find((q) => q.medida.includes("PESO REAL")) ??
      quantidades.find((q) => q.medida.includes("PESO"));
    const peso = pesoPreferido?.quantidade ?? null;
    const volumes =
      quantidades.find((q) => q.medida.includes("VOLUME") || q.medida.includes("UNIDADE"))
        ?.quantidade ?? null;
    const valorMercadoria = num(infCarga, "vCarga") ?? num(infCarga, "vCargaAverb") ?? null;

    // ----- Documentos -----
    const chavesNFe = findAll(find(infCte, "infDoc") ?? infCte, "chave")
      .map((c) => text(c))
      .filter((c): c is string => !!c && c.length === 44);

    // ----- Calculados -----
    const ano = data.getFullYear();
    const mesNumero = data.getMonth() + 1;
    const rotaUF = `${ufOrigem ?? "N/D"} → ${unidadeDestino}`;
    const custoPorKg = valorTotalCTe !== null && peso && peso > 0 ? valorTotalCTe / peso : null;
    const custoPorVolume =
      valorTotalCTe !== null && volumes && volumes > 0 ? valorTotalCTe / volumes : null;
    const percentualFreteCompra =
      valorTotalCTe !== null && valorMercadoria && valorMercadoria > 0
        ? (valorTotalCTe / valorMercadoria) * 100
        : null;

    const record: CTeRecord = {
      chaveCTe,
      numeroCTe: str(ide, "nCT") ?? "—",
      serie: str(ide, "serie") ?? "—",
      modelo: str(ide, "mod") ?? "57",
      dataEmissao: data.toISOString(),
      tipoCTe: str(ide, "tpCTe") ?? "0",
      tipoServico: str(ide, "tpServ") ?? "0",
      natOp: str(ide, "natOp"),
      cnpjTransportadora,
      nomeTransportadora,
      cidadeOrigem,
      ufOrigem,
      regiaoOrigem: regiaoDeUF(ufOrigem),
      cidadeDestino,
      ufDestino,
      regiaoDestino: regiaoDeUF(ufDestino),
      nomeFornecedor,
      cnpjFornecedor,
      cidadeFornecedor: tituloCidade(str(rem, "xMun")),
      ufFornecedor: (str(rem, "UF") ?? null)?.toUpperCase() ?? null,
      unidadeDestino,
      nomeDestinatario: str(dest, "xNome"),
      valorTotalCTe,
      valorPrestacao,
      valorReceber,
      valorICMS,
      valorPedagio,
      outrosValores: outrosValores || null,
      componentesFrete: componentes,
      peso,
      quantidadeVolumes: volumes,
      valorMercadoria,
      produtoPredominante: str(infCarga, "proPred"),
      chavesNFe,
      quantidadeNFe: chavesNFe.length,
      autorizado,
      cancelado,
      statusCTe,
      rotaUF,
      rotaCidade: `${cidadeOrigem ?? "N/D"} → ${cidadeDestino ?? "N/D"}`,
      rotaFornecedorUnidade: `${nomeFornecedor} → ${unidadeDestino}`,
      ano,
      mes: `${ano}-${String(mesNumero).padStart(2, "0")}`,
      trimestre: `${ano}-T${trimestreDe(mesNumero)}`,
      custoPorKg,
      custoPorVolume,
      percentualFreteCompra,
      fretePor1000Reais: percentualFreteCompra !== null ? percentualFreteCompra * 10 : null,
      arquivo,
      ...(guardarXml ? { xmlOriginal: xml } : {}),
    };

    return { record, erro: null, arquivo };
  } catch (error) {
    return {
      record: null,
      erro: error instanceof Error ? error.message : "Falha desconhecida ao ler o XML",
      arquivo,
    };
  }
}
