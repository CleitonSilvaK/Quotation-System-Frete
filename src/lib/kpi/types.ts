// Tipos centrais do KPI FRETES DE COMPRAS.
// Cada registro representa um CT-e de frete de COMPRA (fornecedor -> unidade).

export type Unidade = "Camaquã" | "Pelotas" | "Outra";

export type StatusCTe = "Autorizado" | "Cancelado" | "Não informado";

export interface ComponenteFrete {
  nome: string;
  valor: number;
}

export interface CTeRecord {
  // Identificação
  chaveCTe: string;
  numeroCTe: string;
  serie: string;
  modelo: string;
  dataEmissao: string; // ISO
  tipoCTe: string;
  tipoServico: string;
  natOp: string | null;

  // Transportadora (emitente)
  cnpjTransportadora: string | null;
  nomeTransportadora: string;

  // Origem
  cidadeOrigem: string | null;
  ufOrigem: string | null;
  regiaoOrigem: string | null;

  // Destino
  cidadeDestino: string | null;
  ufDestino: string | null;
  regiaoDestino: string | null;

  // Fornecedor (remetente)
  nomeFornecedor: string;
  cnpjFornecedor: string | null;
  cidadeFornecedor: string | null;
  ufFornecedor: string | null;

  // Unidade da empresa (destinatário)
  unidadeDestino: Unidade;
  nomeDestinatario: string | null;

  // Financeiro
  valorTotalCTe: number | null;
  valorPrestacao: number | null;
  valorReceber: number | null;
  valorICMS: number | null;
  valorPedagio: number | null;
  outrosValores: number | null;
  componentesFrete: ComponenteFrete[];

  // Carga
  peso: number | null;
  quantidadeVolumes: number | null;
  valorMercadoria: number | null;
  produtoPredominante: string | null;

  // Documentos
  chavesNFe: string[];
  quantidadeNFe: number;

  // Status
  autorizado: boolean;
  cancelado: boolean;
  statusCTe: StatusCTe;

  // Calculados
  rotaUF: string;
  rotaCidade: string;
  rotaFornecedorUnidade: string;
  ano: number;
  mes: string; // YYYY-MM
  trimestre: string; // YYYY-Tn
  custoPorKg: number | null;
  custoPorVolume: number | null;
  percentualFreteCompra: number | null;
  fretePor1000Reais: number | null;

  // Rastreabilidade
  arquivo: string | null;
  xmlOriginal?: string;
}

export interface ParseResult {
  record: CTeRecord | null;
  erro: string | null;
  arquivo: string;
}

export interface ImportSummary {
  encontrados: number;
  processados: number;
  validos: number;
  duplicados: number;
  invalidos: number;
  cancelados: number;
  erros: { arquivo: string; erro: string }[];
}

export interface Filtros {
  dataInicio: string;
  dataFim: string;
  unidade: string;
  transportadora: string;
  fornecedor: string;
  ufOrigem: string;
  regiaoOrigem: string;
  cidadeOrigem: string;
  rota: string;
  status: string;
}

export const FILTROS_PADRAO: Filtros = {
  dataInicio: "2025-01-01",
  dataFim: "2026-08-04",
  unidade: "Todas",
  transportadora: "Todas",
  fornecedor: "Todos",
  ufOrigem: "Todos",
  regiaoOrigem: "Todas",
  cidadeOrigem: "Todas",
  rota: "Todas",
  status: "Ativos (não cancelados)",
};
