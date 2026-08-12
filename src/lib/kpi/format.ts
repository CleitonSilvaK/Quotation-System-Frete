export const NAO_DISPONIVEL = "N/D";

export function moeda(valor: number | null | undefined, decimais = 2): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return NAO_DISPONIVEL;
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  });
}

export function moedaCompacta(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return NAO_DISPONIVEL;
  if (Math.abs(valor) >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(2)} mi`;
  if (Math.abs(valor) >= 1_000) return `R$ ${(valor / 1_000).toFixed(1)} mil`;
  return moeda(valor);
}

export function numero(valor: number | null | undefined, decimais = 0): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return NAO_DISPONIVEL;
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  });
}

export function peso(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return NAO_DISPONIVEL;
  if (Math.abs(valor) >= 1000) return `${numero(valor / 1000, 1)} t`;
  return `${numero(valor, 1)} kg`;
}

export function percentual(valor: number | null | undefined, decimais = 2): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return NAO_DISPONIVEL;
  return `${numero(valor, decimais)}%`;
}

export function porKg(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return NAO_DISPONIVEL;
  return `${moeda(valor)}/kg`;
}

export function data(iso: string | null | undefined): string {
  if (!iso) return NAO_DISPONIVEL;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return NAO_DISPONIVEL;
  return d.toLocaleDateString("pt-BR");
}

export function dataHora(iso: string | null | undefined): string {
  if (!iso) return NAO_DISPONIVEL;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return NAO_DISPONIVEL;
  return d.toLocaleString("pt-BR");
}

export function cnpj(valor: string | null | undefined): string {
  if (!valor) return NAO_DISPONIVEL;
  const d = valor.replace(/\D/g, "");
  if (d.length !== 14) return valor;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function csvEscape(valor: unknown): string {
  const texto = valor === null || valor === undefined ? "" : String(valor);
  return `"${texto.replace(/"/g, '""')}"`;
}

export function baixarCSV(nome: string, colunas: string[], linhas: unknown[][]) {
  const conteudo = [colunas, ...linhas].map((l) => l.map(csvEscape).join(";")).join("\r\n");
  const blob = new Blob([`\uFEFF${conteudo}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}

/** Exporta um arquivo .xls (SpreadsheetML) que o Excel abre nativamente. */
export function baixarExcel(nome: string, colunas: string[], linhas: unknown[][]) {
  const escape = (v: unknown) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table><thead><tr>${colunas
    .map((c) => `<th>${escape(c)}</th>`)
    .join("")}</tr></thead><tbody>${linhas
    .map((l) => `<tr>${l.map((c) => `<td>${escape(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}
