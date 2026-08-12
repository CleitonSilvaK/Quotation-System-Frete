import { useMemo } from "react";

import {
  matriz,
  valorMetrica,
  type MetricaSerie,
  type Agregado,
} from "@/lib/kpi/dashboardCalculations";
import { moeda, numero, peso as fmtPeso, percentual, porKg } from "@/lib/kpi/format";
import type { CTeRecord } from "@/lib/kpi/types";
import { cn } from "@/lib/utils";

export function formatarMetrica(valor: number | null, metrica: MetricaSerie): string {
  switch (metrica) {
    case "custoTotal":
    case "valorCompras":
      return moeda(valor, 0);
    case "custoMedio":
      return moeda(valor);
    case "custoPorKg":
      return porKg(valor);
    case "fretePercentual":
      return percentual(valor);
    case "peso":
      return fmtPeso(valor);
    case "ctes":
      return numero(valor);
  }
}

interface MatrizProps {
  registros: CTeRecord[];
  linhaDe: (r: CTeRecord) => string | null;
  colunaDe: (r: CTeRecord) => string | null;
  metrica: MetricaSerie;
  rotuloLinha: string;
  /** Menor valor é melhor (custos) — usado para destacar melhor/pior. */
  menorEhMelhor?: boolean;
  destacarExtremos?: boolean;
}

export function MatrizCruzada({
  registros,
  linhaDe,
  colunaDe,
  metrica,
  rotuloLinha,
  menorEhMelhor = true,
  destacarExtremos = false,
}: MatrizProps) {
  const dados = useMemo(() => matriz(registros, linhaDe, colunaDe), [registros, linhaDe, colunaDe]);

  const valores = dados.linhas.flatMap((linha) =>
    dados.colunas
      .map((coluna) => {
        const celula = dados.celulas[linha]?.[coluna] as Agregado | undefined;
        return celula ? valorMetrica(celula, metrica) : null;
      })
      .filter((v): v is number => v !== null && Number.isFinite(v)),
  );
  const minimo = valores.length ? Math.min(...valores) : null;
  const maximo = valores.length ? Math.max(...valores) : null;

  return (
    <div className="overflow-auto rounded-md border border-border">
      <table className="w-full text-xs">
        <thead className="bg-surface-strong">
          <tr>
            <th className="sticky left-0 z-10 bg-surface-strong px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {rotuloLinha}
            </th>
            {dados.colunas.map((coluna) => (
              <th
                key={coluna}
                className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {coluna}
              </th>
            ))}
            <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {dados.linhas.map((linha) => {
            const celulas = dados.colunas.map(
              (coluna) => dados.celulas[linha]?.[coluna] as Agregado | undefined,
            );
            const totalLinha = celulas.reduce(
              (acc, c) => {
                if (!c) return acc;
                return {
                  custoTotal: acc.custoTotal + c.custoTotal,
                  ctes: acc.ctes + c.ctes,
                  peso: acc.peso + c.peso,
                  valorCompras: acc.valorCompras + c.valorCompras,
                };
              },
              { custoTotal: 0, ctes: 0, peso: 0, valorCompras: 0 },
            );
            const totalAgregado: Agregado = {
              chave: linha,
              ctes: totalLinha.ctes,
              custoTotal: totalLinha.custoTotal,
              custoMedio: totalLinha.ctes ? totalLinha.custoTotal / totalLinha.ctes : null,
              peso: totalLinha.peso,
              custoPorKg: totalLinha.peso > 0 ? totalLinha.custoTotal / totalLinha.peso : null,
              valorCompras: totalLinha.valorCompras,
              fretePercentual:
                totalLinha.valorCompras > 0
                  ? (totalLinha.custoTotal / totalLinha.valorCompras) * 100
                  : null,
              fretePor1000: null,
              participacao: null,
              volumes: 0,
            };

            return (
              <tr key={linha} className="border-b border-border/60 last:border-0 hover:bg-accent/30">
                <td className="sticky left-0 z-10 max-w-[240px] truncate bg-card px-3 py-2 font-medium">
                  {linha}
                </td>
                {celulas.map((celula, indice) => {
                  const valor = celula ? valorMetrica(celula, metrica) : null;
                  const melhor =
                    destacarExtremos && valor !== null && valor === (menorEhMelhor ? minimo : maximo);
                  const pior =
                    destacarExtremos && valor !== null && valor === (menorEhMelhor ? maximo : minimo);
                  return (
                    <td
                      key={dados.colunas[indice]}
                      className={cn(
                        "numeric px-3 py-2 text-right",
                        melhor && "font-semibold text-positive",
                        pior && "font-semibold text-destructive",
                      )}
                      title={
                        celula
                          ? `${celula.ctes} CT-es · ${moeda(celula.custoTotal, 0)} · ${porKg(celula.custoPorKg)}`
                          : undefined
                      }
                    >
                      {valor === null ? <span className="text-muted-foreground">N/D</span> : formatarMetrica(valor, metrica)}
                    </td>
                  );
                })}
                <td className="numeric px-3 py-2 text-right font-semibold">
                  {formatarMetrica(valorMetrica(totalAgregado, metrica), metrica)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
