export type StatusTabela = "rascunho" | "aguardando" | "vigente" | "vencida" | "substituida";

export type ModeloCobranca =
  | "fixo_rota"
  | "por_kg"
  | "por_volume"
  | "por_m3"
  | "faixa_peso"
  | "percentual_nf";

export interface LinhaTabela {
  id: string;
  origemUf: string;
  origemCidade: string;
  origemCepInicio: string;
  origemCepFim: string;
  destinoUf: string;
  destinoCidade: string;
  destinoCepInicio: string;
  destinoCepFim: string;
  pesoDe: number | null;
  pesoAte: number | null;
  valorFixo: number | null;
  valorPorKg: number | null;
  valorPorVolume: number | null;
  valorPorM3: number | null;
  percentualNf: number | null;
  fretePesoMinimo: number | null;
  prazoDias: number | null;
  observacao: string;
}

export interface RegrasCalculo {
  modelo: ModeloCobranca;
  freteMinimo: number;
  gris: number;
  advalorem: number;
  pedagioPorFracao: number;
  fracaoPedagioKg: number;
  taxaColeta: number;
  taxaEntrega: number;
  despacho: number;
  fatorCubagem: number;
  icms: number;
  generalidades: { nome: string; valor: number; tipo: "fixo" | "percentual" }[];
}

export const REGRAS_PADRAO: RegrasCalculo = {
  modelo: "faixa_peso",
  freteMinimo: 0,
  gris: 0,
  advalorem: 0,
  pedagioPorFracao: 0,
  fracaoPedagioKg: 100,
  taxaColeta: 0,
  taxaEntrega: 0,
  despacho: 0,
  fatorCubagem: 300,
  icms: 0,
  generalidades: [],
};

export interface EventoAuditoria {
  id: string;
  data: string;
  usuario: string;
  acao: string;
  detalhe: string;
}

export interface TabelaFrete {
  id: string;
  transportadora: string;
  cnpj: string;
  nome: string;
  modal: "rodoviario" | "aereo" | "fracionado" | "lotacao";
  abrangencia: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  status: StatusTabela;
  versao: number;
  origemArquivo: string;
  criadoEm: string;
  criadoPor: string;
  atualizadoEm: string;
  aprovadoPor: string | null;
  aprovadoEm: string | null;
  substituiId: string | null;
  regras: RegrasCalculo;
  linhas: LinhaTabela[];
  auditoria: EventoAuditoria[];
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
  papel: "admin" | "analista" | "consulta";
}

export type TomadorFrete = "FOB" | "CIF";

export interface VolumeCotacao {
  id: string;
  descricao: string;
  quantidade: number;
  comprimentoCm: number;
  larguraCm: number;
  alturaCm: number;
}

export interface EntradaSimulacao {
  tomador?: TomadorFrete;
  remetenteCnpj?: string;
  remetenteNome?: string;
  destinatarioCnpj?: string;
  destinatarioNome?: string;
  volumesDetalhados?: VolumeCotacao[];
  origemUf: string;
  origemCidade: string;
  destinoUf: string;
  destinoCidade: string;
  cepDestino: string;
  pesoKg: number;
  volumes: number;
  cubagemM3: number;
  valorNf: number;
}


export interface ComponenteCusto {
  nome: string;
  valor: number;
}

export interface ResultadoSimulacao {
  tabelaId: string;
  tabelaNome: string;
  transportadora: string;
  encontrada: boolean;
  motivo?: string;
  pesoTaxado: number;
  componentes: ComponenteCusto[];
  total: number;
  prazoDias: number | null;
}

export const ENTRADA_PADRAO: EntradaSimulacao = {
  tomador: "CIF",
  remetenteCnpj: "",
  remetenteNome: "",
  destinatarioCnpj: "",
  destinatarioNome: "",
  volumesDetalhados: [],
  origemUf: "RS",
  origemCidade: "",
  destinoUf: "RS",
  destinoCidade: "",
  cepDestino: "",
  pesoKg: 1000,
  volumes: 1,
  cubagemM3: 0,
  valorNf: 10000,
};
