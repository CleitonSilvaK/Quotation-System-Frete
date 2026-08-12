import type {
  ComponenteCusto,
  EntradaSimulacao,
  LinhaTabela,
  ResultadoSimulacao,
  TabelaFrete,
  VolumeCotacao,
} from "./types";

export function cubagemDeVolumes(volumes: VolumeCotacao[]): number {
  return volumes.reduce((soma, v) => {
    const m3 = (v.comprimentoCm * v.larguraCm * v.alturaCm) / 1_000_000;
    return soma + m3 * Math.max(0, v.quantidade || 0);
  }, 0);
}

export function totalVolumes(volumes: VolumeCotacao[]): number {
  return volumes.reduce((soma, v) => soma + Math.max(0, v.quantidade || 0), 0);
}


function normaliza(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function combinaLocal(linha: LinhaTabela, entrada: EntradaSimulacao): boolean {
  if (linha.destinoUf && entrada.destinoUf && linha.destinoUf !== entrada.destinoUf.toUpperCase()) return false;

  const cep = entrada.cepDestino.replace(/\D/g, "");
  if (linha.destinoCepInicio && linha.destinoCepFim && cep.length === 8) {
    if (cep < linha.destinoCepInicio.padStart(8, "0") || cep > linha.destinoCepFim.padStart(8, "0")) return false;
    return true;
  }

  if (linha.destinoCidade && entrada.destinoCidade) {
    return normaliza(linha.destinoCidade).includes(normaliza(entrada.destinoCidade)) ||
      normaliza(entrada.destinoCidade).includes(normaliza(linha.destinoCidade));
  }

  return Boolean(linha.destinoUf) || Boolean(linha.destinoCepInicio === "" && linha.destinoCidade === "");
}

function combinaPeso(linha: LinhaTabela, pesoTaxado: number): boolean {
  const de = linha.pesoDe ?? 0;
  const ate = linha.pesoAte ?? Number.POSITIVE_INFINITY;
  return pesoTaxado >= de && pesoTaxado <= ate;
}

export function pesoTaxadoDe(entrada: EntradaSimulacao, fatorCubagem: number): number {
  const cubado = entrada.cubagemM3 > 0 ? entrada.cubagemM3 * (fatorCubagem || 0) : 0;
  return Math.max(entrada.pesoKg, cubado);
}

export function simularTabela(tabela: TabelaFrete, entrada: EntradaSimulacao): ResultadoSimulacao {
  const regras = tabela.regras;
  const pesoTaxado = pesoTaxadoDe(entrada, regras.fatorCubagem);
  const base: ResultadoSimulacao = {
    tabelaId: tabela.id,
    tabelaNome: tabela.nome,
    transportadora: tabela.transportadora,
    encontrada: false,
    pesoTaxado,
    componentes: [],
    total: 0,
    prazoDias: null,
  };

  const candidatas = tabela.linhas.filter((l) => combinaLocal(l, entrada));
  if (!candidatas.length) return { ...base, motivo: "Destino não coberto por esta tabela." };

  const comPeso = candidatas.filter((l) => combinaPeso(l, pesoTaxado));
  const linha = comPeso[0] ?? (regras.modelo === "faixa_peso" ? undefined : candidatas[0]);
  if (!linha) return { ...base, motivo: "Peso fora das faixas cadastradas para o destino." };

  const componentes: ComponenteCusto[] = [];
  let frete = 0;

  switch (regras.modelo) {
    case "fixo_rota":
      frete = linha.valorFixo ?? 0;
      break;
    case "por_kg":
    case "faixa_peso":
      frete = (linha.valorPorKg ?? 0) * pesoTaxado + (linha.valorFixo ?? 0);
      break;
    case "por_volume":
      frete = (linha.valorPorVolume ?? 0) * Math.max(1, entrada.volumes);
      break;
    case "por_m3":
      frete = (linha.valorPorM3 ?? 0) * Math.max(0, entrada.cubagemM3);
      break;
    case "percentual_nf":
      frete = ((linha.percentualNf ?? 0) / 100) * entrada.valorNf;
      break;
  }

  const minimo = Math.max(linha.fretePesoMinimo ?? 0, regras.freteMinimo ?? 0);
  if (minimo > frete) {
    componentes.push({ nome: "Frete peso (mínimo aplicado)", valor: minimo });
  } else {
    componentes.push({ nome: "Frete peso", valor: frete });
  }
  const fretePeso = Math.max(frete, minimo);

  if (regras.gris > 0) componentes.push({ nome: `GRIS (${regras.gris}%)`, valor: (regras.gris / 100) * entrada.valorNf });
  if (regras.advalorem > 0)
    componentes.push({ nome: `Ad valorem (${regras.advalorem}%)`, valor: (regras.advalorem / 100) * entrada.valorNf });
  if (regras.pedagioPorFracao > 0) {
    const fracoes = Math.ceil(pesoTaxado / Math.max(1, regras.fracaoPedagioKg));
    componentes.push({ nome: `Pedágio (${fracoes} frações)`, valor: fracoes * regras.pedagioPorFracao });
  }
  if (regras.taxaColeta > 0) componentes.push({ nome: "Taxa de coleta", valor: regras.taxaColeta });
  if (regras.taxaEntrega > 0) componentes.push({ nome: "Taxa de entrega", valor: regras.taxaEntrega });
  if (regras.despacho > 0) componentes.push({ nome: "Despacho", valor: regras.despacho });

  for (const g of regras.generalidades) {
    const valor = g.tipo === "percentual" ? (g.valor / 100) * entrada.valorNf : g.valor;
    if (valor) componentes.push({ nome: g.nome || "Generalidade", valor });
  }

  let total = componentes.reduce((s, c) => s + c.valor, 0);

  if (regras.icms > 0 && regras.icms < 100) {
    const comIcms = total / (1 - regras.icms / 100);
    componentes.push({ nome: `ICMS (${regras.icms}% por dentro)`, valor: comIcms - total });
    total = comIcms;
  }

  return {
    ...base,
    encontrada: true,
    componentes,
    total,
    prazoDias: linha.prazoDias,
    pesoTaxado,
  };
}

export function simularComparativo(tabelas: TabelaFrete[], entrada: EntradaSimulacao): ResultadoSimulacao[] {
  return tabelas
    .map((t) => simularTabela(t, entrada))
    .sort((a, b) => {
      if (a.encontrada !== b.encontrada) return a.encontrada ? -1 : 1;
      return a.total - b.total;
    });
}
