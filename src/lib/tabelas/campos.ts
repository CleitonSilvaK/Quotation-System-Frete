import type { LinhaTabela } from "./types";

export type CampoLinha = keyof Omit<LinhaTabela, "id">;

interface DefCampo {
  campo: CampoLinha;
  rotulo: string;
  tipo: "texto" | "numero" | "uf" | "cep";
  aliases: string[];
}

export const CAMPOS: DefCampo[] = [
  { campo: "origemUf", rotulo: "UF origem", tipo: "uf", aliases: ["uf origem", "origem uf", "uforigem", "estado origem"] },
  { campo: "origemCidade", rotulo: "Cidade origem", tipo: "texto", aliases: ["cidade origem", "origem", "municipio origem", "origem cidade"] },
  { campo: "origemCepInicio", rotulo: "CEP origem inicial", tipo: "cep", aliases: ["cep origem inicial", "cep origem de", "cep ini origem"] },
  { campo: "origemCepFim", rotulo: "CEP origem final", tipo: "cep", aliases: ["cep origem final", "cep origem ate", "cep fim origem"] },
  { campo: "destinoUf", rotulo: "UF destino", tipo: "uf", aliases: ["uf destino", "destino uf", "ufdestino", "estado destino", "uf"] },
  { campo: "destinoCidade", rotulo: "Cidade destino", tipo: "texto", aliases: ["cidade destino", "destino", "municipio destino", "destino cidade", "localidade"] },
  { campo: "destinoCepInicio", rotulo: "CEP destino inicial", tipo: "cep", aliases: ["cep inicial", "cep de", "cep destino inicial", "cep ini"] },
  { campo: "destinoCepFim", rotulo: "CEP destino final", tipo: "cep", aliases: ["cep final", "cep ate", "cep destino final", "cep fim"] },
  { campo: "pesoDe", rotulo: "Peso de (kg)", tipo: "numero", aliases: ["peso de", "faixa de", "de kg", "peso inicial", "minimo kg"] },
  { campo: "pesoAte", rotulo: "Peso até (kg)", tipo: "numero", aliases: ["peso ate", "faixa ate", "ate kg", "peso final", "maximo kg"] },
  { campo: "valorFixo", rotulo: "Valor fixo (R$)", tipo: "numero", aliases: ["valor fixo", "frete fixo", "valor", "tarifa", "preco"] },
  { campo: "valorPorKg", rotulo: "Valor por kg (R$)", tipo: "numero", aliases: ["frete peso", "valor kg", "r$/kg", "por kg", "preco kg", "frete por kg"] },
  { campo: "valorPorVolume", rotulo: "Valor por volume (R$)", tipo: "numero", aliases: ["valor volume", "por volume", "frete volume", "r$/volume"] },
  { campo: "valorPorM3", rotulo: "Valor por m³ (R$)", tipo: "numero", aliases: ["valor m3", "por m3", "metro cubico", "r$/m3"] },
  { campo: "percentualNf", rotulo: "% sobre NF", tipo: "numero", aliases: ["percentual nf", "% nf", "ad valorem nf", "percentual"] },
  { campo: "fretePesoMinimo", rotulo: "Frete mínimo (R$)", tipo: "numero", aliases: ["frete minimo", "minimo", "valor minimo", "frete min"] },
  { campo: "prazoDias", rotulo: "Prazo (dias)", tipo: "numero", aliases: ["prazo", "prazo dias", "lead time", "dias"] },
  { campo: "observacao", rotulo: "Observação", tipo: "texto", aliases: ["observacao", "obs", "comentario", "nota"] },
];

export const CAMPOS_POR_NOME = new Map(CAMPOS.map((c) => [c.campo, c]));

function normalizar(texto: string): string {
  return texto
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9%³/ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Sugere um mapeamento coluna -> campo a partir dos cabeçalhos do arquivo. */
export function sugerirMapeamento(cabecalhos: string[]): Record<string, CampoLinha | ""> {
  const mapa: Record<string, CampoLinha | ""> = {};
  const usados = new Set<CampoLinha>();

  for (const cabecalho of cabecalhos) {
    const alvo = normalizar(cabecalho);
    let escolhido: CampoLinha | "" = "";
    let melhor = 0;

    for (const def of CAMPOS) {
      if (usados.has(def.campo)) continue;
      const candidatos = [normalizar(def.rotulo), ...def.aliases.map(normalizar)];
      for (const candidato of candidatos) {
        let pontos = 0;
        if (alvo === candidato) pontos = 100;
        else if (alvo.includes(candidato) || candidato.includes(alvo)) pontos = 60;
        if (pontos > melhor) {
          melhor = pontos;
          escolhido = def.campo;
        }
      }
    }

    if (escolhido && melhor >= 60) usados.add(escolhido);
    mapa[cabecalho] = escolhido;
  }

  return mapa;
}

export function paraNumero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  let texto = String(valor).trim().replace(/r\$/i, "").replace(/%/g, "").trim();
  if (!texto) return null;
  const temVirgula = texto.includes(",");
  const temPonto = texto.includes(".");
  if (temVirgula && temPonto) texto = texto.replace(/\./g, "").replace(",", ".");
  else if (temVirgula) texto = texto.replace(",", ".");
  const n = Number(texto.replace(/\s/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function paraCep(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  return String(valor).replace(/\D/g, "").padStart(0, "0").slice(0, 8);
}

export function paraUf(valor: unknown): string {
  return String(valor ?? "").trim().toUpperCase().slice(0, 2);
}

export function paraTexto(valor: unknown): string {
  return String(valor ?? "").trim();
}

/** Converte uma linha bruta do arquivo em uma LinhaTabela usando o mapeamento escolhido. */
export function montarLinha(
  bruta: Record<string, unknown>,
  mapeamento: Record<string, CampoLinha | "">,
  indice: number,
): LinhaTabela {
  const linha: LinhaTabela = {
    id: `l${indice}-${Math.random().toString(36).slice(2, 8)}`,
    origemUf: "",
    origemCidade: "",
    origemCepInicio: "",
    origemCepFim: "",
    destinoUf: "",
    destinoCidade: "",
    destinoCepInicio: "",
    destinoCepFim: "",
    pesoDe: null,
    pesoAte: null,
    valorFixo: null,
    valorPorKg: null,
    valorPorVolume: null,
    valorPorM3: null,
    percentualNf: null,
    fretePesoMinimo: null,
    prazoDias: null,
    observacao: "",
  };

  for (const [coluna, campo] of Object.entries(mapeamento)) {
    if (!campo) continue;
    const def = CAMPOS_POR_NOME.get(campo);
    const valor = bruta[coluna];
    if (!def) continue;
    if (def.tipo === "numero") (linha[campo] as number | null) = paraNumero(valor);
    else if (def.tipo === "cep") (linha[campo] as string) = paraCep(valor);
    else if (def.tipo === "uf") (linha[campo] as string) = paraUf(valor);
    else (linha[campo] as string) = paraTexto(valor);
  }

  return linha;
}
