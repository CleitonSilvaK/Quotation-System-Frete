import { createFileRoute } from "@tanstack/react-router";

import { PaginaRanking } from "@/components/kpi/PaginaRanking";

export const Route = createFileRoute("/fornecedores")({
  head: () => ({
    meta: [
      { title: "Fornecedores | KPI Fretes de Compras" },
      { name: "description", content: "Custo de frete por fornecedor e frete sobre o valor comprado." },
      { property: "og:title", content: "Fornecedores | KPI Fretes de Compras" },
      { property: "og:description", content: "Quais fornecedores geram o maior custo de transporte." },
    ],
  }),
  component: () => (
    <PaginaRanking
      titulo="Fornecedores"
      descricao="Quais fornecedores geram o maior custo de transporte nas compras."
      rotuloChave="Fornecedor"
      chaveDe={(r) => r.nomeFornecedor}
      arquivo="fornecedores"
    />
  ),
});
