import type {
  ComponenteCusto,
  EntradaSimulacao,
  LinhaTabela,
  ResultadoSimulacao,
  TabelaFrete,
  VolumeCotacao,
} from "./types";
import { REGRAS_PADRAO } from "./types";

function numeroOuPadrao(valor: number | string | null | undefined, padrao = 0): number {
  const parsed = Number(valor);
  return Number.isFinite(parsed) ? parsed : padrao;
}

export function cubagemDeVolumes(volumes: VolumeCotacao[]): number {
  if (!Array.isArray(volumes)) return 0;

  return volumes.reduce((soma, v) => {
    if (!v || typeof v !== "object") return soma;
    const comprimento = numeroOuPadrao(v.comprimentoCm, 0);
    const largura = numeroOuPadrao(v.larguraCm, 0);
    const altura = numeroOuPadrao(v.alturaCm, 0);
    const quantidade = Math.max(0, numeroOuPadrao(v.quantidade, 0));
    const m3 = (comprimento * largura * altura) / 1_000_000;
    return soma + m3 * quantidade;
  }, 0);
}

export function totalVolumes(volumes: VolumeCotacao[]): number {
  if (!Array.isArray(volumes)) return 0;

  return volumes.reduce((soma, v) => {
    if (!v || typeof v !== "object") return soma;
    return soma + Math.max(0, numeroOuPadrao(v.quantidade, 0));
  }, 0);
}


function normaliza(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function combinaLocal(linha: LinhaTabela, entrada: EntradaSimulacao): boolean {
  if (!linha || typeof linha !== "object") return false;
  if (linha.destinoUf && entrada.destinoUf && linha.destinoUf !== String(entrada.destinoUf).toUpperCase()) return false;

  const cep = String(entrada?.cepDestino ?? "").replace(/\D/g, "");
  if (linha.destinoCepInicio && linha.destinoCepFim && cep.length === 8) {
    const inicio = String(linha.destinoCepInicio || "").padStart(8, "0");
    const fim = String(linha.destinoCepFim || "").padStart(8, "0");
    if (cep < inicio || cep > fim) return false;
    return true;
  }

  if (linha.destinoCidade && entrada.destinoCidade) {
    return normaliza(linha.destinoCidade).includes(normaliza(entrada.destinoCidade)) ||
      normaliza(entrada.destinoCidade).includes(normaliza(linha.destinoCidade));
  }

  return Boolean(linha.destinoUf) || Boolean(linha.destinoCepInicio === "" && linha.destinoCidade === "");
}

function combinaPeso(linha: LinhaTabela, pesoTaxado: number): boolean {
  const de = numeroOuPadrao(linha.pesoDe, 0);
  const ate = linha.pesoAte !== null && linha.pesoAte !== undefined ? numeroOuPadrao(linha.pesoAte, Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;
  return pesoTaxado >= de && pesoTaxado <= ate;
}

export function pesoTaxadoDe(entrada: EntradaSimulacao, fatorCubagem: number): number {
  const cubado = Number(entrada?.cubagemM3 ?? 0) > 0 ? Number(entrada?.cubagemM3 ?? 0) * (numeroOuPadrao(fatorCubagem, 300) || 0) : 0;
  return Math.max(numeroOuPadrao(entrada?.pesoKg, 0), cubado);
}

export function simularTabela(tabela: TabelaFrete | null | undefined, entrada: EntradaSimulacao): ResultadoSimulacao {
  if (!tabela || typeof tabela !== "object") {
    return {
      tabelaId: "",
      tabelaNome: "Tabela inválida",
      transportadora: "",
      encontrada: false,
      pesoTaxado: 0,
      componentes: [],
      total: 0,
      prazoDias: null,
      motivo: "Tabela inválida ou ausente.",
    };
  }

  const regras = tabela.regras && typeof tabela.regras === "object" ? { ...REGRAS_PADRAO, ...tabela.regras } : REGRAS_PADRAO;
  const linhas = Array.isArray(tabela.linhas) ? tabela.linhas.filter((linha): linha is LinhaTabela => Boolean(linha && typeof linha === "object")) : [];
  const fatorCubagem = numeroOuPadrao(regras.fatorCubagem, 300) || 300;
  const pesoTaxado = pesoTaxadoDe(entrada, fatorCubagem);
  const base: ResultadoSimulacao = {
    tabelaId: String(tabela.id ?? ""),
    tabelaNome: String(tabela.nome ?? "Tabela sem nome"),
    transportadora: String(tabela.transportadora ?? ""),
    encontrada: false,
    pesoTaxado,
    componentes: [],
    total: 0,
    prazoDias: null,
  };

  const candidatas = linhas.filter((l) => combinaLocal(l, entrada));
  if (!candidatas.length) return { ...base, motivo: "Destino não coberto por esta tabela." };

  const comPeso = candidatas.filter((l) => combinaPeso(l, pesoTaxado));
  const linha = comPeso[0] ?? (regras.modelo === "faixa_peso" ? undefined : candidatas[0]);
  if (!linha) return { ...base, motivo: "Peso fora das faixas cadastradas para o destino." };

  const componentes: ComponenteCusto[] = [];
  let frete = 0;

  switch (regras.modelo) {
    case "fixo_rota":
      frete = numeroOuPadrao(linha.valorFixo, 0);
      break;
    case "por_kg":
    case "faixa_peso":
      frete = numeroOuPadrao(linha.valorPorKg, 0) * pesoTaxado + numeroOuPadrao(linha.valorFixo, 0);
      break;
    case "por_volume":
      frete = numeroOuPadrao(linha.valorPorVolume, 0) * Math.max(1, numeroOuPadrao(entrada.volumes, 1));
      break;
    case "por_m3":
      frete = numeroOuPadrao(linha.valorPorM3, 0) * Math.max(0, numeroOuPadrao(entrada.cubagemM3, 0));
      break;
    case "percentual_nf":
      frete = (numeroOuPadrao(linha.percentualNf, 0) / 100) * numeroOuPadrao(entrada.valorNf, 0);
      break;
    default:
      frete = numeroOuPadrao(linha.valorFixo, 0);
      break;
  }

  const minimo = Math.max(numeroOuPadrao(linha.fretePesoMinimo, 0), numeroOuPadrao(regras.freteMinimo, 0));
  if (minimo > frete) {
    componentes.push({ nome: "Frete peso (mínimo aplicado)", valor: minimo });
  } else {
    componentes.push({ nome: "Frete peso", valor: frete });
  }

  const valorGris = numeroOuPadrao(regras.gris, 0);
  const valorAdvalorem = numeroOuPadrao(regras.advalorem, 0);
  const valorPedagio = numeroOuPadrao(regras.pedagioPorFracao, 0);
  const fracaoPedagioKg = Math.max(1, numeroOuPadrao(regras.fracaoPedagioKg, 1));
  const taxaColeta = numeroOuPadrao(regras.taxaColeta, 0);
  const taxaEntrega = numeroOuPadrao(regras.taxaEntrega, 0);
  const despacho = numeroOuPadrao(regras.despacho, 0);

  if (valorGris > 0) componentes.push({ nome: `GRIS (${valorGris}%)`, valor: (valorGris / 100) * numeroOuPadrao(entrada.valorNf, 0) });
  if (valorAdvalorem > 0)
    componentes.push({ nome: `Ad valorem (${valorAdvalorem}%)`, valor: (valorAdvalorem / 100) * numeroOuPadrao(entrada.valorNf, 0) });
  if (valorPedagio > 0) {
    const fracoes = Math.ceil(pesoTaxado / fracaoPedagioKg);
    componentes.push({ nome: `Pedágio (${fracoes} frações)`, valor: fracoes * valorPedagio });
  }
  if (taxaColeta > 0) componentes.push({ nome: "Taxa de coleta", valor: taxaColeta });
  if (taxaEntrega > 0) componentes.push({ nome: "Taxa de entrega", valor: taxaEntrega });
  if (despacho > 0) componentes.push({ nome: "Despacho", valor: despacho });

  for (const g of Array.isArray(regras.generalidades) ? regras.generalidades : []) {
    if (!g || typeof g !== "object") continue;
    const valor = g.tipo === "percentual" ? (numeroOuPadrao(g.valor, 0) / 100) * numeroOuPadrao(entrada.valorNf, 0) : numeroOuPadrao(g.valor, 0);
    if (valor) componentes.push({ nome: g.nome || "Generalidade", valor });
  }

  let total = componentes.reduce((s, c) => s + Number(c.valor ?? 0), 0);

  const icms = numeroOuPadrao(regras.icms, 0);
  if (icms > 0 && icms < 100) {
    const comIcms = total / (1 - icms / 100);
    componentes.push({ nome: `ICMS (${icms}% por dentro)`, valor: comIcms - total });
    total = comIcms;
  }

  return {
    ...base,
    encontrada: true,
    componentes,
    total,
    prazoDias: linha.prazoDias ?? null,
    pesoTaxado,
  };
}

export function simularComparativo(tabelas: TabelaFrete[] | null | undefined, entrada: EntradaSimulacao): ResultadoSimulacao[] {
  const validas = Array.isArray(tabelas) ? tabelas.filter((t): t is TabelaFrete => Boolean(t && typeof t === "object")) : [];

  return validas
    .map((t) => simularTabela(t, entrada))
    .sort((a, b) => {
      if (a.encontrada !== b.encontrada) return a.encontrada ? -1 : 1;
      return Number(a.total ?? 0) - Number(b.total ?? 0);
    });
}
