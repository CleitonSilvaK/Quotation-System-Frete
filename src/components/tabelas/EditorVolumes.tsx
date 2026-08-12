import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { numero } from "@/lib/kpi/format";
import { cubagemDeVolumes, totalVolumes } from "@/lib/tabelas/calculo";
import type { VolumeCotacao } from "@/lib/tabelas/types";

function novoVolume(): VolumeCotacao {
  return {
    id: `vol-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    descricao: "",
    quantidade: 1,
    comprimentoCm: 0,
    larguraCm: 0,
    alturaCm: 0,
  };
}

function m3De(v: VolumeCotacao): number {
  return ((v.comprimentoCm * v.larguraCm * v.alturaCm) / 1_000_000) * Math.max(0, v.quantidade || 0);
}

interface Props {
  volumes: VolumeCotacao[];
  onChange: (volumes: VolumeCotacao[]) => void;
  fatorCubagem?: number;
}

export function EditorVolumes({ volumes, onChange, fatorCubagem = 300 }: Props) {
  const cubagem = cubagemDeVolumes(volumes);
  const total = totalVolumes(volumes);

  const atualizar = (id: string, campo: keyof VolumeCotacao, valor: string) => {
    onChange(
      volumes.map((v) =>
        v.id === id
          ? { ...v, [campo]: campo === "descricao" ? valor : Number(valor) || 0 }
          : v,
      ),
    );
  };

  return (
    <div className="space-y-3">
      {volumes.length ? (
        <div className="space-y-2">
          <div className="hidden gap-2 px-1 text-[11px] uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[1fr_64px_72px_72px_72px_88px_32px]">
            <span>Descrição</span>
            <span>Qtd</span>
            <span>Compr. (cm)</span>
            <span>Larg. (cm)</span>
            <span>Alt. (cm)</span>
            <span className="text-right">m³</span>
            <span />
          </div>
          {volumes.map((v) => (
            <div
              key={v.id}
              className="grid gap-2 rounded-md border border-border p-2 sm:grid-cols-[1fr_64px_72px_72px_72px_88px_32px] sm:items-center sm:border-0 sm:p-0"
            >
              <Input
                className="h-9"
                placeholder="Caixa, pallet…"
                value={v.descricao}
                onChange={(e) => atualizar(v.id, "descricao", e.target.value)}
              />
              <Input className="h-9" type="number" min={0} value={String(v.quantidade)} onChange={(e) => atualizar(v.id, "quantidade", e.target.value)} />
              <Input className="h-9" type="number" min={0} value={String(v.comprimentoCm)} onChange={(e) => atualizar(v.id, "comprimentoCm", e.target.value)} />
              <Input className="h-9" type="number" min={0} value={String(v.larguraCm)} onChange={(e) => atualizar(v.id, "larguraCm", e.target.value)} />
              <Input className="h-9" type="number" min={0} value={String(v.alturaCm)} onChange={(e) => atualizar(v.id, "alturaCm", e.target.value)} />
              <span className="numeric text-right text-sm">{numero(m3De(v), 3)}</span>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 justify-self-end text-muted-foreground"
                onClick={() => onChange(volumes.filter((x) => x.id !== v.id))}
                aria-label="Remover volume"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum volume informado. A cubagem será zero.</p>
      )}

      <Button size="sm" variant="outline" onClick={() => onChange([...volumes, novoVolume()])}>
        <Plus className="mr-1 size-4" /> Adicionar volume
      </Button>

      <div className="grid gap-2 rounded-md bg-muted/50 p-3 sm:grid-cols-3">
        <Resumo rotulo="Total de volumes" valor={numero(total)} />
        <Resumo rotulo="Cubagem da NF-e (m³)" valor={numero(cubagem, 3)} />
        <Resumo rotulo={`Peso cubado (x${numero(fatorCubagem)})`} valor={`${numero(cubagem * fatorCubagem, 1)} kg`} />
      </div>
    </div>
  );
}

function Resumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <Label className="text-[11px] text-muted-foreground">{rotulo}</Label>
      <p className="numeric text-sm font-semibold">{valor}</p>
    </div>
  );
}
