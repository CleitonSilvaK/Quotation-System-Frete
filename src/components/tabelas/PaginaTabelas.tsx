import type { ReactNode } from "react";
import { LogOut } from "lucide-react";

import { LoginGate } from "@/components/tabelas/LoginGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/tabelas/auth";

export function PaginaTabelas({
  titulo,
  descricao,
  acoes,
  children,
}: {
  titulo: string;
  descricao: string;
  acoes?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{titulo}</h2>
          <p className="text-sm text-muted-foreground">{descricao}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {acoes}
          <SessaoBadge />
        </div>
      </div>
      <LoginGate>{children}</LoginGate>
    </div>
  );
}

function SessaoBadge() {
  const { usuario, sair } = useAuth();
  if (!usuario) return null;
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="outline" className="text-[11px]">
        {usuario.nome}
      </Badge>
      <Button variant="ghost" size="sm" onClick={sair} title="Sair">
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}
