import type { ReactNode } from "react";
import { Database, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { BarraFiltros } from "@/components/kpi/BarraFiltros";
import { Badge } from "@/components/ui/badge";
import { useKpi } from "@/lib/kpi/store";
import { data as fmtData } from "@/lib/kpi/format";

export function Pagina({
  titulo,
  descricao,
  comFiltros = true,
  children,
}: {
  titulo: string;
  descricao: string;
  comFiltros?: boolean;
  children: ReactNode;
}) {
  const { carregando, erro, base, registros } = useKpi();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const datas = registros
    .map((r) => new Date(r.dataEmissao).getTime())
    .filter((t) => Number.isFinite(t));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{titulo}</h2>
          <p className="text-sm text-muted-foreground">{descricao}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 text-[11px]">
            <Database className="size-3" />
            {base.length.toLocaleString("pt-BR")} CT-es reais importados
          </Badge>
          {datas.length ? (
            <Badge variant="secondary" className="text-[11px]">
              {fmtData(new Date(Math.min(...datas)).toISOString())} —{" "}
              {fmtData(new Date(Math.max(...datas)).toISOString())}
            </Badge>
          ) : null}
        </div>
      </div>

      {comFiltros ? <BarraFiltros /> : null}

      {carregando && mounted ? (
        <div className="panel flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando base de CT-es...
        </div>
      ) : erro ? (
        <div className="panel p-6 text-sm text-destructive">{erro}</div>
      ) : !base.length ? (
        <div className="panel p-6 text-sm text-muted-foreground">
          Nenhum CT-e na base. Importe os XMLs na página <strong>Importação</strong>.
        </div>
      ) : (
        children
      )}
    </div>
  );
}

