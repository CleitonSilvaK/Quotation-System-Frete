import { benchmarkPorRota, BENCHMARK_MINIMO_OPERACOES } from "./benchmarkEngine";
import { agruparPor, soma } from "./dashboardCalculations";
import type { CTeRecord } from "./types";

export * from "./recommendationEngine";



export type TipoOportunidade =
  | "Rota acima do benchmark"
  | "Transportadora acima do padrão da rota"
  | "Aumento de custo por kg"
  | "Concentração de gastos"
  | "Fornecedor com frete elevado";

export interface Oportunidade {
  tipo: TipoOportunidade;
  titulo: string;
  detalhe: string;
  custoMedio: number | null;
  benchmark: number | null;
  desvioPercentual: number | null;
  ctes: number;
  economiaEstimada: number | null;
  severidade: "Alta" | "Média" | "Baixa";
}

function severidade(desvio: number | null, ctes: number): Oportunidade["severidade"] {
  if (desvio === null) return "Baixa";
  if (desvio >= 25 && ctes >= 30) return "Alta";
  if (desvio >= 12) return "Média";
  return "Baixa";
}

/**
 * Identifica oportunidades de negociação usando apenas os dados importados.
 * Economia estimada = (custo médio observado − referência) × nº de operações,
 * calculada somente quando há amostra suficiente.
 */
export function detectarOportunidades(registros: CTeRecord[]): Oportunidade[] {
  const validos = registros.filter((r) => !r.cancelado && r.valorTotalCTe !== null);
  if (!validos.length) return [];

  const oportunidades: Oportunidade[] = [];
  const benchmarks = benchmarkPorRota(validos);

  // 1) Rotas cujo custo médio supera a mediana histórica da rota
  for (const b of benchmarks) {
    if (b.operacoes < BENCHMARK_MINIMO_OPERACOES || !b.media || !b.mediana) continue;
    const desvio = ((b.media - b.mediana) / b.mediana) * 100;
    if (desvio < 10) continue;
    oportunidades.push({
      tipo: "Rota acima do benchmark",
      titulo: b.rota,
      detalhe: `Custo médio ${desvio.toFixed(1)}% acima da mediana histórica da rota (${b.operacoes} operações).`,
      custoMedio: b.media,
      benchmark: b.mediana,
      desvioPercentual: desvio,
      ctes: b.operacoes,
      economiaEstimada: (b.media - b.mediana) * b.operacoes,
      severidade: severidade(desvio, b.operacoes),
    });
  }

  // 2) Transportadoras acima do custo/kg mediano da mesma rota
  for (const b of benchmarks) {
    if (b.operacoes < BENCHMARK_MINIMO_OPERACOES) continue;
    const daRota = validos.filter((r) => r.rotaUF === b.rota);
    const porTransportadora = agruparPor(daRota, (r) => r.nomeTransportadora).filter(
      (t) => t.ctes >= 3 && t.custoPorKg !== null,
    );
    if (porTransportadora.length < 2) continue;
    const melhor = porTransportadora.reduce((a, t) =>
      (t.custoPorKg ?? Infinity) < (a.custoPorKg ?? Infinity) ? t : a,
    );
    for (const t of porTransportadora) {
      if (t.chave === melhor.chave || !t.custoPorKg || !melhor.custoPorKg) continue;
      const desvio = ((t.custoPorKg - melhor.custoPorKg) / melhor.custoPorKg) * 100;
      if (desvio < 20) continue;
      oportunidades.push({
        tipo: "Transportadora acima do padrão da rota",
        titulo: `${t.chave} — ${b.rota}`,
        detalhe: `R$ ${t.custoPorKg.toFixed(2)}/kg contra R$ ${melhor.custoPorKg.toFixed(2)}/kg da melhor transportadora da rota (${melhor.chave}).`,
        custoMedio: t.custoPorKg,
        benchmark: melhor.custoPorKg,
        desvioPercentual: desvio,
        ctes: t.ctes,
        economiaEstimada: (t.custoPorKg - melhor.custoPorKg) * t.peso,
        severidade: severidade(desvio, t.ctes),
      });
    }
  }

  // 3) Aumento de R$/kg no período mais recente vs. histórico anterior
  const meses = [...new Set(validos.map((r) => r.mes))].sort();
  if (meses.length >= 6) {
    const recentes = meses.slice(-3);
    for (const b of benchmarks) {
      if (b.operacoes < BENCHMARK_MINIMO_OPERACOES) continue;
      const daRota = validos.filter((r) => r.rotaUF === b.rota && r.peso);
      const rec = daRota.filter((r) => recentes.includes(r.mes));
      const ant = daRota.filter((r) => !recentes.includes(r.mes));
      if (rec.length < 3 || ant.length < 5) continue;
      const kgRec = soma(rec, (r) => r.valorTotalCTe) / soma(rec, (r) => r.peso);
      const kgAnt = soma(ant, (r) => r.valorTotalCTe) / soma(ant, (r) => r.peso);
      if (!Number.isFinite(kgRec) || !Number.isFinite(kgAnt) || kgAnt <= 0) continue;
      const desvio = ((kgRec - kgAnt) / kgAnt) * 100;
      if (desvio < 15) continue;
      oportunidades.push({
        tipo: "Aumento de custo por kg",
        titulo: b.rota,
        detalhe: `R$/kg dos últimos 3 meses (R$ ${kgRec.toFixed(2)}) está ${desvio.toFixed(1)}% acima do histórico anterior (R$ ${kgAnt.toFixed(2)}).`,
        custoMedio: kgRec,
        benchmark: kgAnt,
        desvioPercentual: desvio,
        ctes: rec.length,
        economiaEstimada: (kgRec - kgAnt) * soma(rec, (r) => r.peso),
        severidade: severidade(desvio, rec.length),
      });
    }
  }

  // 4) Concentração de gastos por transportadora
  const custoTotal = soma(validos, (r) => r.valorTotalCTe);
  for (const t of agruparPor(validos, (r) => r.nomeTransportadora).slice(0, 3)) {
    if (!t.participacao || t.participacao < 30) continue;
    oportunidades.push({
      tipo: "Concentração de gastos",
      titulo: t.chave,
      detalhe: `Concentra ${t.participacao.toFixed(1)}% do custo de frete de compras (R$ ${t.custoTotal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} de R$ ${custoTotal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}). Alto poder de negociação e também risco de dependência.`,
      custoMedio: t.custoMedio,
      benchmark: null,
      desvioPercentual: null,
      ctes: t.ctes,
      economiaEstimada: null,
      severidade: "Média",
    });
  }

  // 5) Fornecedores com frete elevado sobre o valor da compra
  const comCompra = validos.filter((r) => r.valorMercadoria && r.valorMercadoria > 0);
  if (comCompra.length >= 20) {
    const geral = (soma(comCompra, (r) => r.valorTotalCTe) / soma(comCompra, (r) => r.valorMercadoria)) * 100;
    for (const f of agruparPor(comCompra, (r) => r.nomeFornecedor)) {
      if (f.ctes < 5 || f.fretePercentual === null) continue;
      const desvio = ((f.fretePercentual - geral) / geral) * 100;
      if (f.fretePercentual < geral * 2 || f.custoTotal < custoTotal * 0.005) continue;
      oportunidades.push({
        tipo: "Fornecedor com frete elevado",
        titulo: f.chave,
        detalhe: `Frete representa ${f.fretePercentual.toFixed(2)}% do valor comprado, contra ${geral.toFixed(2)}% da média geral (${f.ctes} CT-es).`,
        custoMedio: f.fretePercentual,
        benchmark: geral,
        desvioPercentual: desvio,
        ctes: f.ctes,
        economiaEstimada: f.custoTotal - (f.valorCompras * geral) / 100,
        severidade: severidade(desvio, f.ctes),
      });
    }
  }

  const ordem = { Alta: 0, Média: 1, Baixa: 2 } as const;
  return oportunidades.sort(
    (a, b) =>
      ordem[a.severidade] - ordem[b.severidade] ||
      (b.economiaEstimada ?? 0) - (a.economiaEstimada ?? 0),
  );
}
