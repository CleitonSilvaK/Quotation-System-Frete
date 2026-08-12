import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { Pagina } from "@/components/kpi/Pagina";
import { KpiCard, PainelSecao } from "@/components/kpi/KpiCard";
import { numero, percentual } from "@/lib/kpi/format";
import { useKpi } from "@/lib/kpi/store";

export const Route = createFileRoute("/qualidade")({
  head: () => ({
    meta: [
      { title: "Qualidade dos Dados | KPI Fretes de Compras" },
      { name: "description", content: "Auditoria da base de CT-es: campos ausentes, cancelados e cobertura de peso." },
      { property: "og:title", content: "Qualidade dos Dados | KPI Fretes de Compras" },
      { property: "og:description", content: "Confiabilidade dos indicadores de frete de compras." },
    ],
  }),
  component: Qualidade,
});

function Qualidade() {
  const { base } = useKpi();
  const m = useMemo(() => {
    const total = base.length || 1;
    const conta = (f: (r: (typeof base)[number]) => boolean) => base.filter(f).length;
    return {
      total: base.length,
      cancelados: conta((r) => r.cancelado),
      semPeso: conta((r) => !r.peso),
      semValorMercadoria: conta((r) => !r.valorMercadoria),
      semPrestacao: conta((r) => !r.valorPrestacao),
      semNFe: conta((r) => r.quantidadeNFe === 0),
      pct: (v: number) => (v / total) * 100,
    };
  }, [base]);

  return (
    <Pagina
      titulo="Qualidade dos Dados"
      descricao="O quanto podemos confiar nos indicadores, considerando campos ausentes nos XMLs."
      comFiltros={false}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard titulo="CT-es na base" valor={numero(m.total)} descricao="Total de documentos importados" destaque="primario" />
        <KpiCard titulo="Cancelados" valor={numero(m.cancelados)} descricao={percentual(m.pct(m.cancelados), 1) + " da base"} destaque="alerta" />
        <KpiCard titulo="Sem peso informado" valor={numero(m.semPeso)} descricao={"Afeta R$/kg — " + percentual(m.pct(m.semPeso), 1)} />
        <KpiCard titulo="Sem valor da mercadoria" valor={numero(m.semValorMercadoria)} descricao={"Afeta Frete % — " + percentual(m.pct(m.semValorMercadoria), 1)} />
        <KpiCard titulo="Sem valor de prestação" valor={numero(m.semPrestacao)} descricao={percentual(m.pct(m.semPrestacao), 1) + " da base"} />
        <KpiCard titulo="Sem NF-e vinculada" valor={numero(m.semNFe)} descricao={percentual(m.pct(m.semNFe), 1) + " da base"} />
      </div>

      <PainelSecao titulo="Como interpretar" descricao="Regras aplicadas no cálculo dos indicadores." className="mt-4">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Indicadores por kg consideram apenas CT-es com peso informado.</li>
          <li>Frete % considera apenas CT-es com valor de mercadoria declarado.</li>
          <li>CT-es cancelados são excluídos das análises financeiras por padrão.</li>
          <li>Nenhum valor é estimado: campos ausentes aparecem como “N/D”.</li>
        </ul>
      </PainelSecao>
    </Pagina>
  );
}
