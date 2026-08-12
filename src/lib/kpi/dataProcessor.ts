import type { CTeRecord, Filtros, ImportSummary, ParseResult } from "./types";
import { normalizar } from "./geography";

/** Deduplica por chave do CT-e e monta o resumo da importação. */
export function consolidar(
  resultados: ParseResult[],
  existentes: CTeRecord[] = [],
): { registros: CTeRecord[]; resumo: ImportSummary } {
  const mapa = new Map<string, CTeRecord>(existentes.map((r) => [r.chaveCTe, r]));
  const resumo: ImportSummary = {
    encontrados: resultados.length,
    processados: resultados.length,
    validos: 0,
    duplicados: 0,
    invalidos: 0,
    cancelados: 0,
    erros: [],
  };

  for (const resultado of resultados) {
    if (!resultado.record) {
      resumo.invalidos += 1;
      resumo.erros.push({ arquivo: resultado.arquivo, erro: resultado.erro ?? "Inválido" });
      continue;
    }
    if (mapa.has(resultado.record.chaveCTe)) {
      resumo.duplicados += 1;
      continue;
    }
    mapa.set(resultado.record.chaveCTe, resultado.record);
    resumo.validos += 1;
    if (resultado.record.cancelado) resumo.cancelados += 1;
  }

  const registros = [...mapa.values()].sort(
    (a, b) => new Date(a.dataEmissao).getTime() - new Date(b.dataEmissao).getTime(),
  );
  return { registros, resumo };
}

export function aplicarFiltros(registros: CTeRecord[], filtros: Filtros): CTeRecord[] {
  const inicio = filtros.dataInicio ? new Date(`${filtros.dataInicio}T00:00:00`).getTime() : -Infinity;
  const fim = filtros.dataFim ? new Date(`${filtros.dataFim}T23:59:59`).getTime() : Infinity;

  return registros.filter((r) => {
    const t = new Date(r.dataEmissao).getTime();
    if (t < inicio || t > fim) return false;
    if (filtros.status === "Ativos (não cancelados)" && r.cancelado) return false;
    if (filtros.status === "Apenas cancelados" && !r.cancelado) return false;
    if (filtros.unidade !== "Todas" && r.unidadeDestino !== filtros.unidade) return false;
    if (filtros.transportadora !== "Todas" && r.nomeTransportadora !== filtros.transportadora)
      return false;
    if (filtros.fornecedor !== "Todos" && r.nomeFornecedor !== filtros.fornecedor) return false;
    if (filtros.ufOrigem !== "Todos" && r.ufOrigem !== filtros.ufOrigem) return false;
    if (filtros.regiaoOrigem !== "Todas" && r.regiaoOrigem !== filtros.regiaoOrigem) return false;
    if (filtros.cidadeOrigem !== "Todas" && r.cidadeOrigem !== filtros.cidadeOrigem) return false;
    if (filtros.rota !== "Todas" && r.rotaUF !== filtros.rota) return false;
    return true;
  });
}

export function buscarTexto(registros: CTeRecord[], termo: string): CTeRecord[] {
  const alvo = normalizar(termo);
  if (!alvo) return registros;
  return registros.filter((r) =>
    [
      r.numeroCTe,
      r.chaveCTe,
      r.nomeTransportadora,
      r.nomeFornecedor,
      r.cidadeOrigem,
      r.ufOrigem,
      r.unidadeDestino,
      r.produtoPredominante,
    ]
      .filter(Boolean)
      .some((campo) => normalizar(String(campo)).includes(alvo)),
  );
}

export interface OpcoesFiltro {
  unidades: string[];
  transportadoras: string[];
  fornecedores: string[];
  ufs: string[];
  regioes: string[];
  cidades: string[];
  rotas: string[];
}

export function opcoesDeFiltro(registros: CTeRecord[]): OpcoesFiltro {
  const unico = (valores: (string | null)[]) =>
    [...new Set(valores.filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b, "pt-BR"));

  return {
    unidades: unico(registros.map((r) => r.unidadeDestino)),
    transportadoras: unico(registros.map((r) => r.nomeTransportadora)),
    fornecedores: unico(registros.map((r) => r.nomeFornecedor)),
    ufs: unico(registros.map((r) => r.ufOrigem)),
    regioes: unico(registros.map((r) => r.regiaoOrigem)),
    cidades: unico(registros.map((r) => r.cidadeOrigem)),
    rotas: unico(registros.map((r) => r.rotaUF)),
  };
}

export interface QualidadeBase {
  total: number;
  validos: number;
  cancelados: number;
  duplicados: number;
  semPeso: number;
  semFornecedor: number;
  semNFe: number;
  semValorMercadoria: number;
  semValorFrete: number;
  unidadeIndefinida: number;
  primeiroCTe: string | null;
  ultimoCTe: string | null;
  transportadoras: number;
  fornecedores: number;
  estados: number;
  rotas: number;
}

export function qualidadeDaBase(registros: CTeRecord[], duplicados = 0): QualidadeBase {
  const datas = registros
    .map((r) => new Date(r.dataEmissao).getTime())
    .filter((t) => Number.isFinite(t));

  return {
    total: registros.length,
    validos: registros.filter((r) => !r.cancelado).length,
    cancelados: registros.filter((r) => r.cancelado).length,
    duplicados,
    semPeso: registros.filter((r) => !r.peso).length,
    semFornecedor: registros.filter((r) => r.nomeFornecedor === "Não identificado").length,
    semNFe: registros.filter((r) => r.quantidadeNFe === 0).length,
    semValorMercadoria: registros.filter((r) => !r.valorMercadoria).length,
    semValorFrete: registros.filter((r) => r.valorTotalCTe === null).length,
    unidadeIndefinida: registros.filter((r) => r.unidadeDestino === "Outra").length,
    primeiroCTe: datas.length ? new Date(Math.min(...datas)).toISOString() : null,
    ultimoCTe: datas.length ? new Date(Math.max(...datas)).toISOString() : null,
    transportadoras: new Set(registros.map((r) => r.nomeTransportadora)).size,
    fornecedores: new Set(registros.map((r) => r.nomeFornecedor)).size,
    estados: new Set(registros.map((r) => r.ufOrigem).filter(Boolean)).size,
    rotas: new Set(registros.map((r) => r.rotaUF)).size,
  };
}
