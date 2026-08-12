// Geografia: UF -> região, e normalização de nomes de cidade.

export const UF_REGIAO: Record<string, string> = {
  AC: "Norte",
  AP: "Norte",
  AM: "Norte",
  PA: "Norte",
  RO: "Norte",
  RR: "Norte",
  TO: "Norte",
  AL: "Nordeste",
  BA: "Nordeste",
  CE: "Nordeste",
  MA: "Nordeste",
  PB: "Nordeste",
  PE: "Nordeste",
  PI: "Nordeste",
  RN: "Nordeste",
  SE: "Nordeste",
  DF: "Centro-Oeste",
  GO: "Centro-Oeste",
  MT: "Centro-Oeste",
  MS: "Centro-Oeste",
  ES: "Sudeste",
  MG: "Sudeste",
  RJ: "Sudeste",
  SP: "Sudeste",
  PR: "Sul",
  RS: "Sul",
  SC: "Sul",
};

export function regiaoDeUF(uf: string | null | undefined): string | null {
  if (!uf) return null;
  return UF_REGIAO[uf.toUpperCase().trim()] ?? null;
}

/** Remove acentos e coloca em caixa alta, para comparações tolerantes. */
export function normalizar(texto: string | null | undefined): string {
  if (!texto) return "";
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

/** Nome de cidade em Title Case legível ("CRUZ ALTA" -> "Cruz Alta"). */
export function tituloCidade(texto: string | null | undefined): string | null {
  if (!texto) return null;
  const limpo = texto.replace(/^\d+\s*-\s*[A-Z]{2,4}\s*-\s*/i, "").trim();
  return limpo
    .toLowerCase()
    .split(/\s+/)
    .map((p) => (p.length <= 2 && /^(de|da|do|e)$/.test(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}
