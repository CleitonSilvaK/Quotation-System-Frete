import { Filter, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKpi } from "@/lib/kpi/store";

function CampoSelect({
  rotulo,
  valor,
  opcoes,
  todos,
  aoMudar,
}: {
  rotulo: string;
  valor: string;
  opcoes: string[];
  todos: string;
  aoMudar: (v: string) => void;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{rotulo}</Label>
      <Select value={valor} onValueChange={aoMudar}>
        <SelectTrigger className="h-9 w-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value={todos}>{todos}</SelectItem>
          {opcoes.map((opcao) => (
            <SelectItem key={opcao} value={opcao} className="text-xs">
              {opcao}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function BarraFiltros() {
  const { filtros, setFiltros, limparFiltros, opcoes, registros, base } = useKpi();

  return (
    <div className="panel p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Filter className="size-4 text-primary" />
          Filtros
          <span className="text-xs font-normal text-muted-foreground">
            {registros.length.toLocaleString("pt-BR")} de {base.length.toLocaleString("pt-BR")} CT-es
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={limparFiltros}>
          <RotateCcw className="size-3.5" /> Restaurar período padrão
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <div className="space-y-1">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Data inicial
          </Label>
          <Input
            type="date"
            className="h-9 text-xs"
            value={filtros.dataInicio}
            onChange={(e) => setFiltros({ dataInicio: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Data final
          </Label>
          <Input
            type="date"
            className="h-9 text-xs"
            value={filtros.dataFim}
            onChange={(e) => setFiltros({ dataFim: e.target.value })}
          />
        </div>
        <CampoSelect
          rotulo="Unidade de destino"
          valor={filtros.unidade}
          opcoes={opcoes.unidades}
          todos="Todas"
          aoMudar={(v) => setFiltros({ unidade: v })}
        />
        <CampoSelect
          rotulo="Status do CT-e"
          valor={filtros.status}
          opcoes={["Todos", "Apenas cancelados"]}
          todos="Ativos (não cancelados)"
          aoMudar={(v) => setFiltros({ status: v })}
        />
        <CampoSelect
          rotulo="Rota (UF → unidade)"
          valor={filtros.rota}
          opcoes={opcoes.rotas}
          todos="Todas"
          aoMudar={(v) => setFiltros({ rota: v })}
        />
        <CampoSelect
          rotulo="Transportadora"
          valor={filtros.transportadora}
          opcoes={opcoes.transportadoras}
          todos="Todas"
          aoMudar={(v) => setFiltros({ transportadora: v })}
        />
        <CampoSelect
          rotulo="Fornecedor"
          valor={filtros.fornecedor}
          opcoes={opcoes.fornecedores}
          todos="Todos"
          aoMudar={(v) => setFiltros({ fornecedor: v })}
        />
        <CampoSelect
          rotulo="UF de origem"
          valor={filtros.ufOrigem}
          opcoes={opcoes.ufs}
          todos="Todos"
          aoMudar={(v) => setFiltros({ ufOrigem: v })}
        />
        <CampoSelect
          rotulo="Região de origem"
          valor={filtros.regiaoOrigem}
          opcoes={opcoes.regioes}
          todos="Todas"
          aoMudar={(v) => setFiltros({ regiaoOrigem: v })}
        />
        <CampoSelect
          rotulo="Cidade de origem"
          valor={filtros.cidadeOrigem}
          opcoes={opcoes.cidades}
          todos="Todas"
          aoMudar={(v) => setFiltros({ cidadeOrigem: v })}
        />
      </div>
    </div>
  );
}
