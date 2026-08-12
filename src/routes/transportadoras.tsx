import { createFileRoute } from "@tanstack/react-router";

import { PaginaRanking } from "@/components/kpi/PaginaRanking";

export const Route = createFileRoute("/transportadoras")({
  head: () => ({
    meta: [
      { title: "Transportadoras | KPI Fretes de Compras" },
      { name: "description", content: "Custo, R$/kg e participação de cada transportadora nos fretes de compras." },
      { property: "og:title", content: "Transportadoras | KPI Fretes de Compras" },
      { property: "og:description", content: "Ranking de transportadoras por custo de frete de compras." },
    ],
  }),
  component: () => (
    <PaginaRanking
      titulo="Transportadoras"
      descricao="Quem transporta nossas compras e a que custo."
      rotuloChave="Transportadora"
      chaveDe={(r) => r.nomeTransportadora}
      arquivo="transportadoras"
    />
  ),
});
