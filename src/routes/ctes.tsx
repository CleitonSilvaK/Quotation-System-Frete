import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Pagina } from "@/components/kpi/Pagina";
import { PainelSecao } from "@/components/kpi/KpiCard";
import { Tabela } from "@/components/kpi/Tabela";
import { DetalheCTe } from "@/components/kpi/DetalheCTe";
import { data as fmtData, moeda, peso as fmtPeso, porKg } from "@/lib/kpi/format";
import type { CTeRecord } from "@/lib/kpi/types";
import { useKpi } from "@/lib/kpi/store";

export const Route = createFileRoute("/ctes")({
  head: () => ({
    meta: [
      { title: "CT-es | KPI Fretes de Compras" },
      { name: "description", content: "Lista detalhada dos CT-es de compras com custo, peso e rota." },
      { property: "og:title", content: "CT-es | KPI Fretes de Compras" },
      { property: "og:description", content: "Consulta e exportação dos conhecimentos de transporte." },
    ],
  }),
  component: Ctes,
});

function Ctes() {
  const { registros } = useKpi();
  const [selecionado, setSelecionado] = useState<CTeRecord | null>(null);
  const dados = useMemo(
    () => [...registros].sort((a, b) => (a.dataEmissao < b.dataEmissao ? 1 : -1)),
    [registros],
  );

  return (
    <Pagina titulo="CT-es" descricao="Todos os conhecimentos de transporte de compras do período.">
      <PainelSecao titulo="Documentos" descricao="Clique em uma linha para ver o detalhe completo do CT-e.">
        <Tabela
          dados={dados}
          exportarNome="ctes"
          limite={500}
          aoClicar={setSelecionado}
          colunas={[
            { chave: "numeroCTe", titulo: "CT-e", render: (r) => r.numeroCTe, ordenar: (r) => r.numeroCTe, exportar: (r) => r.numeroCTe },
            { chave: "dataEmissao", titulo: "Emissão", render: (r) => fmtData(r.dataEmissao), ordenar: (r) => r.dataEmissao, exportar: (r) => fmtData(r.dataEmissao) },
            { chave: "nomeTransportadora", titulo: "Transportadora", render: (r) => <span className="block max-w-[220px] truncate">{r.nomeTransportadora}</span>, ordenar: (r) => r.nomeTransportadora, exportar: (r) => r.nomeTransportadora },
            { chave: "nomeFornecedor", titulo: "Fornecedor", render: (r) => <span className="block max-w-[220px] truncate">{r.nomeFornecedor}</span>, ordenar: (r) => r.nomeFornecedor, exportar: (r) => r.nomeFornecedor },
            { chave: "rotaCidade", titulo: "Rota", render: (r) => <span className="block max-w-[240px] truncate">{r.rotaCidade}</span>, ordenar: (r) => r.rotaCidade, exportar: (r) => r.rotaCidade },
            { chave: "unidadeDestino", titulo: "Unidade", render: (r) => r.unidadeDestino, ordenar: (r) => r.unidadeDestino, exportar: (r) => r.unidadeDestino },
            { chave: "valorPrestacao", titulo: "Frete", alinhar: "right", render: (r) => moeda(r.valorPrestacao), ordenar: (r) => r.valorPrestacao, exportar: (r) => r.valorPrestacao?.toFixed(2) ?? "N/D" },
            { chave: "peso", titulo: "Peso", alinhar: "right", render: (r) => fmtPeso(r.peso), ordenar: (r) => r.peso, exportar: (r) => r.peso?.toFixed(2) ?? "N/D" },
            { chave: "custoPorKg", titulo: "R$/kg", alinhar: "right", render: (r) => porKg(r.custoPorKg), ordenar: (r) => r.custoPorKg, exportar: (r) => r.custoPorKg?.toFixed(4) ?? "N/D" },
            { chave: "statusCTe", titulo: "Status", render: (r) => r.statusCTe, ordenar: (r) => r.statusCTe, exportar: (r) => r.statusCTe },
          ]}
        />
      </PainelSecao>
      <DetalheCTe registro={selecionado} aoFechar={() => setSelecionado(null)} />
    </Pagina>
  );
}
