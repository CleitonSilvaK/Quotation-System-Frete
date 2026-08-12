import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface KpiCardProps {
  titulo: string;
  valor: string;
  descricao?: string;
  detalhe?: ReactNode;
  destaque?: "neutro" | "primario" | "alerta" | "positivo";
  icone?: ReactNode;
}

const cores: Record<NonNullable<KpiCardProps["destaque"]>, string> = {
  neutro: "text-foreground",
  primario: "text-primary",
  alerta: "text-warning",
  positivo: "text-positive",
};

export function KpiCard({
  titulo,
  valor,
  descricao,
  detalhe,
  destaque = "neutro",
  icone,
}: KpiCardProps) {
  return (
    <div className="panel flex flex-col gap-1 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {titulo}
        </p>
        {icone ? <span className="text-muted-foreground">{icone}</span> : null}
      </div>
      <p className={cn("numeric text-2xl font-semibold leading-tight", cores[destaque])}>{valor}</p>
      {descricao ? <p className="text-xs text-muted-foreground">{descricao}</p> : null}
      {detalhe}
    </div>
  );
}

export function PainelSecao({
  titulo,
  descricao,
  acoes,
  children,
  className,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel", className)}>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">{titulo}</h2>
          {descricao ? <p className="text-xs text-muted-foreground">{descricao}</p> : null}
        </div>
        {acoes}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
