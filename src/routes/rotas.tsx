import { createFileRoute } from "@tanstack/react-router";

import { PaginaRanking } from "@/components/kpi/PaginaRanking";

export const Route = createFileRoute("/rotas")({
  head: () => ({
    meta: [
      { title: "Rotas | KPI Fretes de Compras" },
      { name: "description", content: "Custo por rota origem → unidade nos fretes de compras." },
      { property: "og:title", content: "Rotas | KPI Fretes de Compras" },
      { property: "og:description", content: "Ranking de rotas por custo de frete de compras." },
    ],
  }),
  component: () => (
    <PaginaRanking
      titulo="Rotas"
      descricao="Custo por rota: cidade/UF de origem até a unidade de destino."
      rotuloChave="Rota"
      chaveDe={(r) => r.rotaCidade}
      arquivo="rotas"
    />
  ),
});
