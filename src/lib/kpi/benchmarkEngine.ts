import type { CTeRecord } from "./types";

/** Estatísticas históricas por rota, calculadas SOMENTE com dados reais importados. */
export interface BenchmarkRota {
  rota: string;
  ufOrigem: string;
  unidade: string;
  operacoes: number;
  media: number | null;
  mediana: number | null;
  minimo: number | null;
  maximo: number | null;
  desvioPadrao: number | null;
  custoPorKgMedio: number | null;
  custoTotal: number;
  peso: number;
}

const MINIMO_OPERACOES = 5;

function estatisticas(valores: number[]) {
  if (!valores.length) {
    return { media: null, mediana: null, minimo: null, maximo: null, desvio: null };
  }
  const ordenados = [...valores].sort((a, b) => a - b);
  const media = valores.reduce((s, v) => s + v, 0) / valores.length;
  const meio = Math.floor(ordenados.length / 2);
  const mediana =
    ordenados.length % 2 === 0
      ? ((ordenados[meio - 1] ?? 0) + (ordenados[meio] ?? 0)) / 2
      : (ordenados[meio] ?? 0);
  const variancia =
    valores.length > 1
      ? valores.reduce((s, v) => s + (v - media) ** 2, 0) / (valores.length - 1)
      : 0;
  return {
    media,
    mediana,
    minimo: ordenados[0] ?? null,
    maximo: ordenados[ordenados.length - 1] ?? null,
    desvio: Math.sqrt(variancia),
  };
}

export function benchmarkPorRota(registros: CTeRecord[]): BenchmarkRota[] {
  const grupos = new Map<string, CTeRecord[]>();
  for (const r of registros) {
    if (r.valorTotalCTe === null) continue;
    const lista = grupos.get(r.rotaUF);
    if (lista) lista.push(r);
    else grupos.set(r.rotaUF, [r]);
  }

  return [...grupos.entries()]
    .map(([rota, itens]) => {
      const valores = itens.map((r) => r.valorTotalCTe as number);
      const stats = estatisticas(valores);
      const peso = itens.reduce((s, r) => s + (r.peso ?? 0), 0);
      const custoTotal = valores.reduce((s, v) => s + v, 0);
      const [ufOrigem = "N/D", unidade = "N/D"] = rota.split(" → ");
      return {
        rota,
        ufOrigem,
        unidade,
        operacoes: itens.length,
        media: stats.media,
        mediana: stats.mediana,
        minimo: stats.minimo,
        maximo: stats.maximo,
        desvioPadrao: stats.desvio,
        custoPorKgMedio: peso > 0 ? custoTotal / peso : null,
        custoTotal,
        peso,
      };
    })
    .sort((a, b) => b.custoTotal - a.custoTotal);
}

export interface AlertaCTe {
  registro: CTeRecord;
  benchmark: BenchmarkRota;
  desvioPercentual: number;
}

/** CT-es com custo muito acima da média histórica da própria rota. */
export function alertasAcimaDoPadrao(
  registros: CTeRecord[],
  limitePercentual = 30,
): AlertaCTe[] {
  const benchmarks = new Map(benchmarkPorRota(registros).map((b) => [b.rota, b]));

  const alertas: AlertaCTe[] = [];
  for (const r of registros) {
    const b = benchmarks.get(r.rotaUF);
    if (!b || b.operacoes < MINIMO_OPERACOES || !b.media || r.valorTotalCTe === null) continue;
    const desvio = ((r.valorTotalCTe - b.media) / b.media) * 100;
    if (desvio >= limitePercentual) alertas.push({ registro: r, benchmark: b, desvioPercentual: desvio });
  }
  return alertas.sort((a, b) => b.desvioPercentual - a.desvioPercentual);
}

export const BENCHMARK_MINIMO_OPERACOES = MINIMO_OPERACOES;
