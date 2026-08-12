import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Download, FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { baixarCSV, baixarExcel } from "@/lib/kpi/format";
import { cn } from "@/lib/utils";

export interface Coluna<T> {
  chave: string;
  titulo: string;
  render: (item: T) => ReactNode;
  ordenar?: (item: T) => number | string | null;
  exportar?: (item: T) => string | number | null;
  alinhar?: "left" | "right";
  className?: string;
}

interface TabelaProps<T> {
  dados: T[];
  colunas: Coluna<T>[];
  ordemInicial?: string;
  direcaoInicial?: "asc" | "desc";
  aoClicar?: (item: T) => void;
  vazio?: string;
  exportarNome?: string;
  limite?: number;
  maxAltura?: string;
}

export function Tabela<T>({
  dados,
  colunas,
  ordemInicial,
  direcaoInicial = "desc",
  aoClicar,
  vazio = "Nenhum registro para os filtros selecionados.",
  exportarNome,
  limite,
  maxAltura = "max-h-[560px]",
}: TabelaProps<T>) {
  const [ordem, setOrdem] = useState<string | undefined>(ordemInicial);
  const [direcao, setDirecao] = useState<"asc" | "desc">(direcaoInicial);
  const [mostrarTudo, setMostrarTudo] = useState(false);

  const ordenados = useMemo(() => {
    const coluna = colunas.find((c) => c.chave === ordem);
    if (!coluna?.ordenar) return dados;
    const copia = [...dados];
    copia.sort((a, b) => {
      const va = coluna.ordenar?.(a);
      const vb = coluna.ordenar?.(b);
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      if (typeof va === "number" && typeof vb === "number") {
        return direcao === "asc" ? va - vb : vb - va;
      }
      const comp = String(va).localeCompare(String(vb), "pt-BR");
      return direcao === "asc" ? comp : -comp;
    });
    return copia;
  }, [dados, colunas, ordem, direcao]);

  const visiveis = limite && !mostrarTudo ? ordenados.slice(0, limite) : ordenados;

  const exportar = (formato: "csv" | "excel") => {
    const cabecalho = colunas.map((c) => c.titulo);
    const linhas = ordenados.map((item) =>
      colunas.map((c) => (c.exportar ? c.exportar(item) : "")),
    );
    const nome = `${exportarNome ?? "dados"}-${new Date().toISOString().slice(0, 10)}`;
    if (formato === "csv") baixarCSV(`${nome}.csv`, cabecalho, linhas);
    else baixarExcel(`${nome}.xls`, cabecalho, linhas);
  };

  return (
    <div className="space-y-3">
      {exportarNome ? (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => exportar("csv")}>
            <Download className="size-3.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportar("excel")}>
            <FileSpreadsheet className="size-3.5" /> Excel
          </Button>
        </div>
      ) : null}

      <div className={cn("overflow-auto rounded-md border border-border", maxAltura)}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-surface-strong">
            <tr>
              {colunas.map((coluna) => (
                <th
                  key={coluna.chave}
                  onClick={() => {
                    if (!coluna.ordenar) return;
                    if (ordem === coluna.chave) setDirecao(direcao === "asc" ? "desc" : "asc");
                    else {
                      setOrdem(coluna.chave);
                      setDirecao("desc");
                    }
                  }}
                  className={cn(
                    "whitespace-nowrap border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                    coluna.alinhar === "right" ? "text-right" : "text-left",
                    coluna.ordenar && "cursor-pointer select-none hover:text-foreground",
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {coluna.titulo}
                    {ordem === coluna.chave ? (
                      direcao === "asc" ? (
                        <ArrowUp className="size-3" />
                      ) : (
                        <ArrowDown className="size-3" />
                      )
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visiveis.length === 0 ? (
              <tr>
                <td colSpan={colunas.length} className="px-3 py-8 text-center text-muted-foreground">
                  {vazio}
                </td>
              </tr>
            ) : (
              visiveis.map((item, indice) => (
                <tr
                  key={indice}
                  onClick={() => aoClicar?.(item)}
                  className={cn(
                    "border-b border-border/60 last:border-0",
                    aoClicar && "cursor-pointer",
                    "hover:bg-accent/40",
                  )}
                >
                  {colunas.map((coluna) => (
                    <td
                      key={coluna.chave}
                      className={cn(
                        "whitespace-nowrap px-3 py-2",
                        coluna.alinhar === "right" ? "numeric text-right" : "text-left",
                        coluna.className,
                      )}
                    >
                      {coluna.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {limite && ordenados.length > limite ? (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Exibindo {visiveis.length} de {ordenados.length.toLocaleString("pt-BR")} linhas
          </span>
          <Button variant="ghost" size="sm" onClick={() => setMostrarTudo(!mostrarTudo)}>
            {mostrarTudo ? "Mostrar menos" : "Mostrar todas"}
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {ordenados.length.toLocaleString("pt-BR")} linhas
        </p>
      )}
    </div>
  );
}
