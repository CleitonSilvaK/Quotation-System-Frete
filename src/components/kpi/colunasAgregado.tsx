import type { Coluna } from "@/components/kpi/Tabela";
import type { Agregado } from "@/lib/kpi/dashboardCalculations";
import { moeda, numero, peso as fmtPeso, percentual, porKg } from "@/lib/kpi/format";

/** Colunas padrão de análise de custo usadas nos rankings (rotas, transportadoras, etc.). */
export function colunasAgregado(rotuloChave: string, comParticipacao = false): Coluna<Agregado>[] {
  const colunas: Coluna<Agregado>[] = [
    {
      chave: "chave",
      titulo: rotuloChave,
      render: (a) => <span className="block max-w-[280px] truncate font-medium">{a.chave}</span>,
      ordenar: (a) => a.chave,
      exportar: (a) => a.chave,
    },
    {
      chave: "ctes",
      titulo: "CT-es",
      alinhar: "right",
      render: (a) => numero(a.ctes),
      ordenar: (a) => a.ctes,
      exportar: (a) => a.ctes,
    },
    {
      chave: "custoTotal",
      titulo: "Custo total",
      alinhar: "right",
      render: (a) => moeda(a.custoTotal, 0),
      ordenar: (a) => a.custoTotal,
      exportar: (a) => a.custoTotal.toFixed(2),
    },
    {
      chave: "custoMedio",
      titulo: "Custo médio",
      alinhar: "right",
      render: (a) => moeda(a.custoMedio),
      ordenar: (a) => a.custoMedio,
      exportar: (a) => a.custoMedio?.toFixed(2) ?? "N/D",
    },
    {
      chave: "peso",
      titulo: "Peso",
      alinhar: "right",
      render: (a) => fmtPeso(a.peso),
      ordenar: (a) => a.peso,
      exportar: (a) => a.peso.toFixed(2),
    },
    {
      chave: "custoPorKg",
      titulo: "R$/kg",
      alinhar: "right",
      render: (a) => porKg(a.custoPorKg),
      ordenar: (a) => a.custoPorKg,
      exportar: (a) => a.custoPorKg?.toFixed(4) ?? "N/D",
    },
    {
      chave: "valorCompras",
      titulo: "Valor das compras",
      alinhar: "right",
      render: (a) => moeda(a.valorCompras, 0),
      ordenar: (a) => a.valorCompras,
      exportar: (a) => a.valorCompras.toFixed(2),
    },
    {
      chave: "fretePercentual",
      titulo: "Frete %",
      alinhar: "right",
      render: (a) => percentual(a.fretePercentual),
      ordenar: (a) => a.fretePercentual,
      exportar: (a) => a.fretePercentual?.toFixed(2) ?? "N/D",
    },
    {
      chave: "fretePor1000",
      titulo: "Frete / R$ 1.000",
      alinhar: "right",
      render: (a) => moeda(a.fretePor1000),
      ordenar: (a) => a.fretePor1000,
      exportar: (a) => a.fretePor1000?.toFixed(2) ?? "N/D",
    },
  ];

  if (comParticipacao) {
    colunas.push({
      chave: "participacao",
      titulo: "Participação",
      alinhar: "right",
      render: (a) => percentual(a.participacao, 1),
      ordenar: (a) => a.participacao,
      exportar: (a) => a.participacao?.toFixed(2) ?? "N/D",
    });
  }

  return colunas;
}
