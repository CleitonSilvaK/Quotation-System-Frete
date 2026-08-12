import type { CTeRecord } from "./types";

/** Agregado genérico usado por todos os rankings e matrizes. */
export interface Agregado {
  chave: string;
  ctes: number;
  custoTotal: number;
  custoMedio: number | null;
  peso: number;
  custoPorKg: number | null;
  valorCompras: number;
  fretePercentual: number | null;
  fretePor1000: number | null;
  participacao: number | null;
  volumes: number;
}

export function soma(registros: CTeRecord[], campo: (r: CTeRecord) => number | null): number {
  return registros.reduce((total, r) => total + (campo(r) ?? 0), 0);
}

export function agregar(
  registros: CTeRecord[],
  chave: string,
  custoTotalGlobal?: number,
): Agregado {
  const custoTotal = soma(registros, (r) => r.valorTotalCTe);
  const peso = soma(registros, (r) => r.peso);
  const volumes = soma(registros, (r) => r.quantidadeVolumes);
  const valorCompras = soma(registros, (r) => r.valorMercadoria);
  const comFrete = registros.filter((r) => r.valorTotalCTe !== null);

  return {
    chave,
    ctes: registros.length,
    custoTotal,
    custoMedio: comFrete.length ? custoTotal / comFrete.length : null,
    peso,
    custoPorKg: peso > 0 ? custoTotal / peso : null,
    valorCompras,
    fretePercentual: valorCompras > 0 ? (custoTotal / valorCompras) * 100 : null,
    fretePor1000: valorCompras > 0 ? (custoTotal / valorCompras) * 1000 : null,
    participacao:
      custoTotalGlobal && custoTotalGlobal > 0 ? (custoTotal / custoTotalGlobal) * 100 : null,
    volumes,
  };
}

export function agruparPor(
  registros: CTeRecord[],
  chaveDe: (r: CTeRecord) => string | null,
): Agregado[] {
  const grupos = new Map<string, CTeRecord[]>();
  for (const r of registros) {
    const chave = chaveDe(r) ?? "N/D";
    const lista = grupos.get(chave);
    if (lista) lista.push(r);
    else grupos.set(chave, [r]);
  }
  const custoTotalGlobal = soma(registros, (r) => r.valorTotalCTe);
  return [...grupos.entries()]
    .map(([chave, itens]) => agregar(itens, chave, custoTotalGlobal))
    .sort((a, b) => b.custoTotal - a.custoTotal);
}

export interface ResumoKPI extends Agregado {
  custoMedioPorKgPonderado: number | null;
  ctesSemPeso: number;
  ctesSemValorCompra: number;
}

export function resumoGeral(registros: CTeRecord[]): ResumoKPI {
  const base = agregar(registros, "Total");
  return {
    ...base,
    custoMedioPorKgPonderado: base.custoPorKg,
    ctesSemPeso: registros.filter((r) => !r.peso).length,
    ctesSemValorCompra: registros.filter((r) => !r.valorMercadoria).length,
  };
}

export type MetricaSerie =
  | "custoTotal"
  | "ctes"
  | "custoMedio"
  | "custoPorKg"
  | "fretePercentual"
  | "peso"
  | "valorCompras";

export const LABEL_METRICA: Record<MetricaSerie, string> = {
  custoTotal: "Custo total (R$)",
  ctes: "Quantidade de CT-es",
  custoMedio: "Custo médio por CT-e (R$)",
  custoPorKg: "Custo por kg (R$/kg)",
  fretePercentual: "Frete / valor das compras (%)",
  peso: "Peso transportado (kg)",
  valorCompras: "Valor das compras (R$)",
};

export function valorMetrica(a: Agregado | undefined | null, metrica: MetricaSerie): number | null {
  if (!a) return null;
  switch (metrica) {
    case "custoTotal":
      return a.custoTotal;
    case "ctes":
      return a.ctes;
    case "custoMedio":
      return a.custoMedio;
    case "custoPorKg":
      return a.custoPorKg;
    case "fretePercentual":
      return a.fretePercentual;
    case "peso":
      return a.peso;
    case "valorCompras":
      return a.valorCompras;
  }
}

export interface PontoSerie {
  mes: string;
  rotulo: string;
  valor: number | null;
  custoTotal: number;
  ctes: number;
}

const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function rotuloMes(mes: string): string {
  const ano = mes.slice(0, 4);
  const m = Number(mes.slice(5, 7));
  return `${MESES_CURTOS[m - 1] ?? "?"}/${ano.slice(2)}`;
}

export function serieMensal(registros: CTeRecord[], metrica: MetricaSerie): PontoSerie[] {
  return agruparPor(registros, (r) => r.mes)
    .sort((a, b) => a.chave.localeCompare(b.chave))
    .map((a) => ({
      mes: a.chave,
      rotulo: rotuloMes(a.chave),
      valor: valorMetrica(a, metrica),
      custoTotal: a.custoTotal,
      ctes: a.ctes,
    }));
}

export interface ComparativoAnual {
  rotulo: string;
  mesNumero: number;
  [ano: string]: number | string | null;
}

export function comparativoAnos(
  registros: CTeRecord[],
  metrica: MetricaSerie,
): { dados: ComparativoAnual[]; anos: string[] } {
  const anos = [...new Set(registros.map((r) => String(r.ano)))].sort();
  const dados: ComparativoAnual[] = MESES_CURTOS.map((nome, indice) => {
    const linha: ComparativoAnual = { rotulo: nome, mesNumero: indice + 1 };
    for (const ano of anos) {
      const itens = registros.filter(
        (r) => String(r.ano) === ano && new Date(r.dataEmissao).getMonth() === indice,
      );
      linha[ano] = itens.length ? valorMetrica(agregar(itens, ano), metrica) : null;
    }
    return linha;
  });
  return { dados, anos };
}

/** Matriz cruzando duas dimensões (ex.: UF de origem × unidade). */
export interface Matriz {
  linhas: string[];
  colunas: string[];
  celulas: Record<string, Record<string, Agregado | undefined>>;
}

export function matriz(
  registros: CTeRecord[],
  linhaDe: (r: CTeRecord) => string | null,
  colunaDe: (r: CTeRecord) => string | null,
): Matriz {
  const celulas: Record<string, Record<string, CTeRecord[]>> = {};
  const linhasSet = new Set<string>();
  const colunasSet = new Set<string>();

  for (const r of registros) {
    const linha = linhaDe(r) ?? "N/D";
    const coluna = colunaDe(r) ?? "N/D";
    linhasSet.add(linha);
    colunasSet.add(coluna);
    celulas[linha] ??= {};
    celulas[linha][coluna] ??= [];
    celulas[linha][coluna].push(r);
  }

  const agregadas: Matriz["celulas"] = {};
  for (const [linha, cols] of Object.entries(celulas)) {
    agregadas[linha] = {};
    for (const [coluna, itens] of Object.entries(cols)) {
      agregadas[linha][coluna] = agregar(itens, `${linha}|${coluna}`);
    }
  }

  const ordenarLinhas = [...linhasSet].sort((a, b) => {
    const ta = Object.values(agregadas[a] ?? {}).reduce((s, c) => s + (c?.custoTotal ?? 0), 0);
    const tb = Object.values(agregadas[b] ?? {}).reduce((s, c) => s + (c?.custoTotal ?? 0), 0);
    return tb - ta;
  });

  return {
    linhas: ordenarLinhas,
    colunas: [...colunasSet].sort((a, b) => a.localeCompare(b, "pt-BR")),
    celulas: agregadas,
  };
}
