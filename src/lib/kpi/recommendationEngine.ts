import type { CTeRecord } from "./types";
import { normalizar } from "./geography";
import { soma } from "./dashboardCalculations";

export interface EntradaRecomendacao {
  remetente: string;
  destinatario: string;
  pesoKg: number;
  valorNf: number;
}

export type NivelCorrespondencia =
  | "Exata (Fornecedor + Destinatário)"
  | "Regional (Cidade de Origem → Destinatário)"
  | "Estadual (UF de Origem → Destinatário)"
  | "Geral da Rota";

export interface RecomendacaoTransportadora {
  posicao: number;
  nomeTransportadora: string;
  cnpjTransportadora: string | null;
  ctesHistoricos: number;
  freteEstimado: number;
  custoPorKgEstimado: number | null;
  percentualNfEstimado: number | null;
  variacaoVsRecomendada: number;
  variacaoPorcentagemVsRecomendada: number;
  menorFreteHistorico: number | null;
  maiorFreteHistorico: number | null;
  ultimaOperacao: string | null;
  scoreConfiabilidade: "Alta" | "Média" | "Baixa";
  destaque: string;
}

export interface ResultadoRecomendacao {
  parametros: EntradaRecomendacao;
  nivelCorrespondencia: NivelCorrespondencia;
  totalCtesAnalisados: number;
  recomendada: RecomendacaoTransportadora | null;
  ranking: RecomendacaoTransportadora[];
  economiaEstimadaVsMedia: number;
  economiaPorcentagemVsMedia: number;
  economiaEstimadaVsMaisCara: number;
  mediaCustoOutras: number;
  insights: string[];
}

export const ENTRADA_RECOMENDACAO_PADRAO: EntradaRecomendacao = {
  remetente: "",
  destinatario: "Todas",
  pesoKg: 1000,
  valorNf: 35000,
};

/**
  Analisa o histórico de CT-es e recomenda a melhor transportadora para o embarque.
 */
export function recomendarTransportadora(
  registros: CTeRecord[],
  entrada: EntradaRecomendacao,
): ResultadoRecomendacao {
  const validos = registros.filter(
    (r) => !r.cancelado && r.valorTotalCTe !== null && r.valorTotalCTe > 0,
  );

  const remetenteNorm = normalizar(entrada.remetente);
  const destNorm = normalizar(entrada.destinatario);

  // 1. Filtragem Hierárquica de Histórico (Match Level)
  let ctesCorrespondentes: CTeRecord[] = [];
  let nivel: NivelCorrespondencia = "Exata (Fornecedor + Destinatário)";

  // Nível 1: Match Exato (Fornecedor + Destinatário/Unidade)
  if (remetenteNorm) {
    ctesCorrespondentes = validos.filter((r) => {
      const matchFornecedor = normalizar(r.nomeFornecedor).includes(remetenteNorm);
      const matchDestino =
        !destNorm ||
        destNorm === "todas" ||
        normalizar(r.unidadeDestino).includes(destNorm) ||
        normalizar(r.cidadeDestino ?? "").includes(destNorm) ||
        normalizar(r.ufDestino ?? "").includes(destNorm);
      return matchFornecedor && matchDestino;
    });
  }

  // Nível 2: Match por Cidade de Origem -> Destinatário
  if (ctesCorrespondentes.length < 3 && remetenteNorm) {
    // Tenta encontrar cidade de origem correspondente ao remetente
    const amostraFornecedor = validos.find((r) =>
      normalizar(r.nomeFornecedor).includes(remetenteNorm),
    );
    const cidadeOrigem = amostraFornecedor?.cidadeOrigem;

    if (cidadeOrigem) {
      const porCidade = validos.filter((r) => {
        const matchCidade = normalizar(r.cidadeOrigem ?? "") === normalizar(cidadeOrigem);
        const matchDestino =
          !destNorm ||
          destNorm === "todas" ||
          normalizar(r.unidadeDestino).includes(destNorm) ||
          normalizar(r.cidadeDestino ?? "").includes(destNorm);
        return matchCidade && matchDestino;
      });

      if (porCidade.length >= 3) {
        ctesCorrespondentes = porCidade;
        nivel = "Regional (Cidade de Origem → Destinatário)";
      }
    }
  }

  // Nível 3: Match por UF de Origem -> Destinatário
  if (ctesCorrespondentes.length < 3 && remetenteNorm) {
    const amostraFornecedor = validos.find(
      (r) =>
        normalizar(r.nomeFornecedor).includes(remetenteNorm) ||
        normalizar(r.cidadeOrigem ?? "").includes(remetenteNorm) ||
        normalizar(r.ufOrigem ?? "").includes(remetenteNorm),
    );
    const ufOrigem = amostraFornecedor?.ufOrigem ?? (entrada.remetente.length === 2 ? entrada.remetente.toUpperCase() : null);

    if (ufOrigem) {
      const porUf = validos.filter((r) => {
        const matchUf = (r.ufOrigem ?? "").toUpperCase() === ufOrigem.toUpperCase();
        const matchDestino =
          !destNorm ||
          destNorm === "todas" ||
          normalizar(r.unidadeDestino).includes(destNorm);
        return matchUf && matchDestino;
      });

      if (porUf.length >= 2) {
        ctesCorrespondentes = porUf;
        nivel = "Estadual (UF de Origem → Destinatário)";
      }
    }
  }

  // Nível 4: Match por Destinatário / Rota Geral (Fallback)
  if (ctesCorrespondentes.length === 0) {
    if (destNorm && destNorm !== "todas") {
      ctesCorrespondentes = validos.filter(
        (r) =>
          normalizar(r.unidadeDestino).includes(destNorm) ||
          normalizar(r.cidadeDestino ?? "").includes(destNorm) ||
          normalizar(r.ufDestino ?? "").includes(destNorm),
      );
    } else {
      ctesCorrespondentes = validos;
    }
    nivel = "Geral da Rota";
  }

  // 2. Agrupamento por Transportadora
  const porTransp = new Map<string, CTeRecord[]>();
  for (const r of ctesCorrespondentes) {
    const transp = r.nomeTransportadora || "Desconhecida";
    const lista = porTransp.get(transp);
    if (lista) lista.push(r);
    else porTransp.set(transp, [r]);
  }

  const pesoCarga = Math.max(0, entrada.pesoKg || 0);
  const valorNf = Math.max(0, entrada.valorNf || 0);

  const candidatas: Omit<
    RecomendacaoTransportadora,
    "posicao" | "variacaoVsRecomendada" | "variacaoPorcentagemVsRecomendada" | "destaque"
  >[] = [];

  for (const [transp, itens] of porTransp.entries()) {
    const ctes = itens.length;
    const custoTotalHist = soma(itens, (r) => r.valorTotalCTe);
    const pesoTotalHist = soma(itens, (r) => r.peso);
    const valorMercHist = soma(itens, (r) => r.valorMercadoria);

    const custoPorKgMedio = pesoTotalHist > 0 ? custoTotalHist / pesoTotalHist : null;
    const percentualNfMedio = valorMercHist > 0 ? (custoTotalHist / valorMercHist) * 100 : null;

    // Cálculo do Frete Estimado
    let freteEstimado = 0;

    if (pesoCarga > 0 && custoPorKgMedio !== null && valorNf > 0 && percentualNfMedio !== null) {
      // Ponderação entre custo por kg e % do valor da NF
      const estKg = pesoCarga * custoPorKgMedio;
      const estNf = (valorNf * percentualNfMedio) / 100;
      freteEstimado = estKg * 0.65 + estNf * 0.35;
    } else if (pesoCarga > 0 && custoPorKgMedio !== null) {
      freteEstimado = pesoCarga * custoPorKgMedio;
    } else if (valorNf > 0 && percentualNfMedio !== null) {
      freteEstimado = (valorNf * percentualNfMedio) / 100;
    } else {
      // Média simples do valor total de CT-e no histórico
      freteEstimado = custoTotalHist / ctes;
    }

    const valoresFrete = itens
      .map((r) => r.valorTotalCTe)
      .filter((v): v is number => v !== null && v > 0);

    const menorFrete = valoresFrete.length ? Math.min(...valoresFrete) : null;
    const maiorFrete = valoresFrete.length ? Math.max(...valoresFrete) : null;

    const datas = itens.map((r) => r.dataEmissao).sort();
    const ultimaOperacao = datas.length ? datas[datas.length - 1] : null;
    const cnpj = itens.find((r) => r.cnpjTransportadora)?.cnpjTransportadora ?? null;

    // Confiabilidade
    let scoreConfiabilidade: "Alta" | "Média" | "Baixa" = "Baixa";
    if (nivel.startsWith("Exata") && ctes >= 4) {
      scoreConfiabilidade = "Alta";
    } else if ((nivel.startsWith("Exata") || nivel.startsWith("Regional")) && ctes >= 2) {
      scoreConfiabilidade = "Média";
    } else if (ctes >= 5) {
      scoreConfiabilidade = "Média";
    }

    candidatas.push({
      nomeTransportadora: transp,
      cnpjTransportadora: cnpj,
      ctesHistoricos: ctes,
      freteEstimado,
      custoPorKgEstimado: custoPorKgMedio,
      percentualNfEstimado: percentualNfMedio,
      menorFreteHistorico: menorFrete,
      maiorFreteHistorico: maiorFrete,
      ultimaOperacao: ultimaOperacao ?? null,
      scoreConfiabilidade,
    });
  }

  // Ordenação: Menor frete estimado -> Maior número de CT-es histórico
  candidatas.sort(
    (a, b) => a.freteEstimado - b.freteEstimado || b.ctesHistoricos - a.ctesHistoricos,
  );

  const recomendadaItem = candidatas[0] ?? null;
  const freteRecomendado = recomendadaItem?.freteEstimado ?? 0;

  const ranking: RecomendacaoTransportadora[] = candidatas.map((c, idx) => {
    const diff = c.freteEstimado - freteRecomendado;
    const diffPct = freteRecomendado > 0 ? (diff / freteRecomendado) * 100 : 0;

    let destaque = "";
    if (idx === 0) {
      destaque = "🏆 Melhor Custo Recomendado";
    } else if (c.ctesHistoricos === Math.max(...candidatas.map((x) => x.ctesHistoricos))) {
      destaque = "📦 Mais Frequente no Histórico";
    } else if (c.custoPorKgEstimado && c.custoPorKgEstimado === Math.min(...candidatas.map((x) => x.custoPorKgEstimado ?? Infinity))) {
      destaque = "⚡ Menor Custo/KG Histórico";
    } else {
      destaque = `+${diffPct.toFixed(1)}% vs. Recomendada`;
    }

    return {
      ...c,
      posicao: idx + 1,
      variacaoVsRecomendada: diff,
      variacaoPorcentagemVsRecomendada: diffPct,
      destaque,
    };
  });

  // Economia Comparativa
  const outras = ranking.slice(1);
  const mediaCustoOutras =
    outras.length > 0
      ? outras.reduce((acc, o) => acc + o.freteEstimado, 0) / outras.length
      : freteRecomendado;

  const economiaVsMedia = Math.max(0, mediaCustoOutras - freteRecomendado);
  const economiaPctVsMedia =
    mediaCustoOutras > 0 ? (economiaVsMedia / mediaCustoOutras) * 100 : 0;

  const maisCara = ranking.length ? (ranking[ranking.length - 1]?.freteEstimado ?? freteRecomendado) : freteRecomendado;
  const economiaVsMaisCara = Math.max(0, maisCara - freteRecomendado);

  // Geração de Insights Inteligentes
  const insights: string[] = [];

  if (recomendadaItem) {
    insights.push(
      `A transportadora ${recomendadaItem.nomeTransportadora} apresentou o menor custo estimado (R$ ${freteRecomendado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) para esta simulação.`,
    );
  }

  if (nivel.startsWith("Exata")) {
    insights.push(
      `Análise baseada no histórico exato de envios deste remetente (${ctesCorrespondentes.length} CT-es analisados).`,
    );
  } else if (nivel.startsWith("Regional")) {
    insights.push(
      `Amostragem expandida para envios da mesma cidade de origem (${ctesCorrespondentes.length} CT-es na região).`,
    );
  } else {
    insights.push(
      `Amostragem abrangente da rota. Recomenda-se cotar confirmação com a transportadora.`,
    );
  }

  if (outras.length > 0 && economiaVsMedia > 0) {
    insights.push(
      `A escolha da opção recomendada gera uma economia estimada de R$ ${economiaVsMedia.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${economiaPctVsMedia.toFixed(1)}%) em comparação à média das demais transportadoras do histórico.`,
    );
  }

  return {
    parametros: entrada,
    nivelCorrespondencia: nivel,
    totalCtesAnalisados: ctesCorrespondentes.length,
    recomendada: ranking[0] ?? null,
    ranking,
    economiaEstimadaVsMedia: economiaVsMedia,
    economiaPorcentagemVsMedia: economiaPctVsMedia,
    economiaEstimadaVsMaisCara: economiaVsMaisCara,
    mediaCustoOutras,
    insights,
  };
}
