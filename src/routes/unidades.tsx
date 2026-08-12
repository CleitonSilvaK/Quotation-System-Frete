import { createFileRoute } from "@tanstack/react-router";

import { PaginaRanking } from "@/components/kpi/PaginaRanking";

export const Route = createFileRoute("/unidades")({
  head: () => ({
    meta: [
      { title: "Unidades | KPI Fretes de Compras" },
      { name: "description", content: "Comparação do custo de frete entre Camaquã/RS e Pelotas/RS." },
      { property: "og:title", content: "Unidades | KPI Fretes de Compras" },
      { property: "og:description", content: "Camaquã × Pelotas: custo, R$/kg e frete sobre compras." },
    ],
  }),
  component: () => (
    <PaginaRanking
      titulo="Unidades"
      descricao="Camaquã × Pelotas: custo total, R$/kg e frete sobre o valor comprado."
      rotuloChave="Unidade"
      chaveDe={(r) => r.unidadeDestino}
      arquivo="unidades"
    />
  ),
});
