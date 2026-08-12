import { createFileRoute } from "@tanstack/react-router";

import { PaginaRanking } from "@/components/kpi/PaginaRanking";

export const Route = createFileRoute("/regioes")({
  head: () => ({
    meta: [
      { title: "Regiões e Estados | KPI Fretes de Compras" },
      { name: "description", content: "Custo de frete de compras por estado e região de origem." },
      { property: "og:title", content: "Regiões e Estados | KPI Fretes de Compras" },
      { property: "og:description", content: "De onde vêm as compras e quanto custa trazê-las." },
    ],
  }),
  component: () => (
    <PaginaRanking
      titulo="Regiões e Estados"
      descricao="De onde vêm as compras e quanto custa trazê-las até as unidades."
      rotuloChave="UF de origem"
      chaveDe={(r) => r.ufOrigem}
      arquivo="ufs-origem"
    />
  ),
});
