import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { Pagina } from "@/components/kpi/Pagina";
import { PainelSecao } from "@/components/kpi/KpiCard";
import { Tabela } from "@/components/kpi/Tabela";
import { benchmarkPorRota } from "@/lib/kpi/benchmarkEngine";
import { moeda, numero, porKg } from "@/lib/kpi/format";
import { useKpi } from "@/lib/kpi/store";

export const Route = createFileRoute("/benchmark")({
  head: () => ({
    meta: [
      { title: "Benchmark de Rotas | KPI Fretes de Compras" },
      { name: "description", content: "Média, desvio e faixa de custo por rota para negociar fretes de compras." },
      { property: "og:title", content: "Benchmark de Rotas | KPI Fretes de Compras" },
      { property: "og:description", content: "Referências estatísticas de custo por rota." },
    ],
  }),
  component: Benchmark,
});

function Benchmark() {
  const { registros } = useKpi();
  const dados = useMemo(() => benchmarkPorRota(registros), [registros]);

  return (
    <Pagina
      titulo="Benchmark de Rotas"
      descricao="Referência estatística de custo por rota para apoiar negociações."
    >
      <PainelSecao titulo="Estatísticas por rota" descricao="Rotas com histórico suficiente de operações.">
        <Tabela
          dados={dados}
          exportarNome="benchmark-rotas"
          ordemInicial="custoTotal"
          colunas={[
            { chave: "rota", titulo: "Rota", render: (b) => b.rota, ordenar: (b) => b.rota, exportar: (b) => b.rota },
            { chave: "operacoes", titulo: "Operações", alinhar: "right", render: (b) => numero(b.operacoes), ordenar: (b) => b.operacoes, exportar: (b) => b.operacoes },
            { chave: "custoTotal", titulo: "Custo total", alinhar: "right", render: (b) => moeda(b.custoTotal, 0), ordenar: (b) => b.custoTotal, exportar: (b) => b.custoTotal.toFixed(2) },
            { chave: "media", titulo: "Custo médio", alinhar: "right", render: (b) => moeda(b.media), ordenar: (b) => b.media, exportar: (b) => b.media?.toFixed(2) ?? "N/D" },
            { chave: "mediana", titulo: "Mediana", alinhar: "right", render: (b) => moeda(b.mediana), ordenar: (b) => b.mediana, exportar: (b) => b.mediana?.toFixed(2) ?? "N/D" },
            { chave: "custoPorKgMedio", titulo: "R$/kg médio", alinhar: "right", render: (b) => porKg(b.custoPorKgMedio), ordenar: (b) => b.custoPorKgMedio, exportar: (b) => b.custoPorKgMedio?.toFixed(4) ?? "N/D" },

          ]}
        />
      </PainelSecao>
    </Pagina>
  );
}
