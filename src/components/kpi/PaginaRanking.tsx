import { useMemo } from "react";

import { Pagina } from "@/components/kpi/Pagina";
import { PainelSecao } from "@/components/kpi/KpiCard";
import { Tabela } from "@/components/kpi/Tabela";
import { colunasAgregado } from "@/components/kpi/colunasAgregado";
import { agruparPor } from "@/lib/kpi/dashboardCalculations";
import type { CTeRecord } from "@/lib/kpi/types";
import { useKpi } from "@/lib/kpi/store";

/** Página de ranking reutilizável: agrupa a base filtrada por uma dimensão. */
export function PaginaRanking({
  titulo,
  descricao,
  rotuloChave,
  chaveDe,
  arquivo,
}: {
  titulo: string;
  descricao: string;
  rotuloChave: string;
  chaveDe: (r: CTeRecord) => string | null;
  arquivo: string;
}) {
  const { registros } = useKpi();
  const dados = useMemo(() => agruparPor(registros, chaveDe), [registros, chaveDe]);

  return (
    <Pagina titulo={titulo} descricao={descricao}>
      <PainelSecao
        titulo={`Ranking por ${rotuloChave.toLowerCase()}`}
        descricao="Ordene por qualquer coluna e exporte para CSV ou Excel."
      >
        <Tabela
          dados={dados}
          colunas={colunasAgregado(rotuloChave, true)}
          ordemInicial="custoTotal"
          exportarNome={arquivo}
        />
      </PainelSecao>
    </Pagina>
  );
}
