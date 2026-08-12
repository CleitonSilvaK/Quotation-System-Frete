import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, FileSpreadsheet, Plus, Route as RouteIcon, Search } from "lucide-react";

import { PaginaTabelas } from "@/components/tabelas/PaginaTabelas";
import { KpiCard, PainelSecao } from "@/components/kpi/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { numero } from "@/lib/kpi/format";
import { useTabelas } from "@/lib/tabelas/store";
import type { StatusTabela } from "@/lib/tabelas/types";

export const Route = createFileRoute("/tabelas/")({
  head: () => ({
    meta: [
      { title: "Tabelas de Frete | Cotação de Fretes" },
      {
        name: "description",
        content:
          "Cadastro, versionamento e consulta das tabelas comerciais de frete das transportadoras da Automotiva Agrícola.",
      },
      { property: "og:title", content: "Tabelas de Frete | Cotação de Fretes" },
      { property: "og:description", content: "Importe, valide e simule tabelas comerciais de frete." },
    ],
  }),
  component: TabelasIndex,
});

export const CORES_STATUS: Record<StatusTabela, string> = {
  rascunho: "bg-muted text-muted-foreground",
  aguardando: "bg-warning/15 text-warning",
  vigente: "bg-positive/15 text-positive",
  vencida: "bg-destructive/15 text-destructive",
  substituida: "bg-muted text-muted-foreground",
};

export const ROTULOS_STATUS: Record<StatusTabela, string> = {
  rascunho: "Rascunho",
  aguardando: "Aguardando aprovação",
  vigente: "Vigente",
  vencida: "Vencida",
  substituida: "Substituída",
};

function TabelasIndex() {
  const { tabelas, pronto } = useTabelas();
  const [busca, setBusca] = useState("");

  const hoje = new Date().toISOString().slice(0, 10);
  const em30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const kpis = useMemo(() => {
    const vigentes = tabelas.filter((t) => t.status === "vigente");
    return {
      total: tabelas.length,
      vigentes: vigentes.length,
      vencendo: vigentes.filter((t) => t.vigenciaFim && t.vigenciaFim <= em30 && t.vigenciaFim >= hoje).length,
      pendentes: tabelas.filter((t) => t.status === "aguardando").length,
      rotas: tabelas.reduce((s, t) => s + t.linhas.length, 0),
    };
  }, [em30, hoje, tabelas]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = termo
      ? tabelas.filter((t) =>
          [t.nome, t.transportadora, t.abrangencia, t.cnpj].some((c) => c.toLowerCase().includes(termo)),
        )
      : tabelas;
    return [...lista].sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
  }, [busca, tabelas]);

  return (
    <PaginaTabelas
      titulo="Tabelas de Frete"
      descricao="Tabelas comerciais das transportadoras: importação, versionamento, validação e simulação."
      acoes={
        <>
          <Button asChild size="sm" variant="outline">
            <Link to="/tabelas/simulador">Simulador</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/tabelas/importar">
              <Plus className="size-4" /> Importar tabela
            </Link>
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard titulo="Tabelas vigentes" valor={numero(kpis.vigentes)} descricao={`${numero(kpis.total)} cadastradas`} destaque="positivo" icone={<FileSpreadsheet className="size-4" />} />
          <KpiCard titulo="Vencendo em 30 dias" valor={numero(kpis.vencendo)} descricao="Renegociação necessária" destaque="alerta" icone={<CalendarClock className="size-4" />} />
          <KpiCard titulo="Aguardando aprovação" valor={numero(kpis.pendentes)} descricao="Pendentes de liberação" icone={<AlertTriangle className="size-4" />} />
          <KpiCard titulo="Rotas cadastradas" valor={numero(kpis.rotas)} descricao="Somatório de todas as tabelas" destaque="primario" icone={<RouteIcon className="size-4" />} />
        </div>

        <PainelSecao
          titulo="Tabelas cadastradas"
          descricao="Clique em uma tabela para ver rotas, regras, simulação e histórico."
          acoes={
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Transportadora, tabela, CNPJ..."
                className="h-8 w-64 pl-8"
              />
            </div>
          }
        >
          {!pronto ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : !filtradas.length ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma tabela cadastrada. Use <strong>Importar tabela</strong> para enviar a planilha ou PDF da
              transportadora.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-3">Tabela</th>
                    <th className="py-2 pr-3">Transportadora</th>
                    <th className="py-2 pr-3">Abrangência</th>
                    <th className="py-2 pr-3">Vigência</th>
                    <th className="py-2 pr-3 text-right">Rotas</th>
                    <th className="py-2 pr-3">Versão</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((t) => (
                    <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                      <td className="py-2 pr-3">
                        <Link to="/tabelas/$id" params={{ id: t.id }} className="font-medium underline-offset-2 hover:underline">
                          {t.nome}
                        </Link>
                      </td>
                      <td className="py-2 pr-3">{t.transportadora}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{t.abrangencia || "—"}</td>
                      <td className="py-2 pr-3 numeric text-xs">
                        {t.vigenciaInicio || "—"} → {t.vigenciaFim || "—"}
                      </td>
                      <td className="py-2 pr-3 numeric text-right">{numero(t.linhas.length)}</td>
                      <td className="py-2 pr-3 numeric">v{t.versao}</td>
                      <td className="py-2">
                        <Badge className={`${CORES_STATUS[t.status]} border-0 text-[11px]`}>
                          {ROTULOS_STATUS[t.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PainelSecao>
      </div>
    </PaginaTabelas>
  );
}
