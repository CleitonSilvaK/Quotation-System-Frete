import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";

import { PaginaTabelas } from "@/components/tabelas/PaginaTabelas";
import { EditorVolumes } from "@/components/tabelas/EditorVolumes";
import { PainelSecao } from "@/components/kpi/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { moeda, numero } from "@/lib/kpi/format";
import { cubagemDeVolumes, simularComparativo, totalVolumes } from "@/lib/tabelas/calculo";
import { useTabelas } from "@/lib/tabelas/store";
import { ENTRADA_PADRAO, type EntradaSimulacao, type TomadorFrete, type VolumeCotacao } from "@/lib/tabelas/types";

export const Route = createFileRoute("/tabelas/simulador")({
  head: () => ({
    meta: [
      { title: "Cotar frete | Cotação de Fretes" },
      { name: "description", content: "Monte o orçamento de frete com remetente, destinatário, valor da NF-e, peso e cubagem por volume, e compare as tabelas vigentes." },
      { property: "og:title", content: "Cotar frete" },
      { property: "og:description", content: "Orçamento de frete com cubagem calculada por volume e comparativo entre transportadoras." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CotarFrete,
});

function CotarFrete() {
  const { tabelas } = useTabelas();
  const [entrada, setEntrada] = useState<EntradaSimulacao>(ENTRADA_PADRAO);
  const [volumesDetalhados, setVolumesDetalhados] = useState<VolumeCotacao[]>([]);

  const vigentes = useMemo(() => tabelas.filter((t) => t.status === "vigente"), [tabelas]);
  const fatorCubagem = vigentes[0]?.regras.fatorCubagem ?? 300;

  const entradaFinal = useMemo<EntradaSimulacao>(() => {
    const cubagem = cubagemDeVolumes(volumesDetalhados);
    const qtd = totalVolumes(volumesDetalhados);
    return {
      ...entrada,
      volumesDetalhados,
      cubagemM3: cubagem,
      volumes: qtd || entrada.volumes,
    };
  }, [entrada, volumesDetalhados]);

  const resultados = useMemo(() => simularComparativo(vigentes, entradaFinal), [entradaFinal, vigentes]);
  const melhor = resultados.find((r) => r.encontrada);

  const set = (parcial: Partial<EntradaSimulacao>) => setEntrada((a) => ({ ...a, ...parcial }));

  return (
    <PaginaTabelas
      titulo="Cotar frete"
      descricao="Monte o orçamento do embarque e compare o custo entre todas as tabelas vigentes."
      acoes={
        <Button asChild size="sm" variant="outline">
          <Link to="/tabelas">Tabelas</Link>
        </Button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <PainelSecao titulo="Tomador do frete" descricao="Quem é o responsável pelo pagamento do frete.">
            <div className="flex gap-2">
              {(["FOB", "CIF"] as TomadorFrete[]).map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={entrada.tomador === t ? "default" : "outline"}
                  onClick={() => set({ tomador: t })}
                >
                  {t}
                </Button>
              ))}
              <p className="self-center text-xs text-muted-foreground">
                {entrada.tomador === "FOB" ? "Frete por conta do destinatário." : "Frete por conta do remetente."}
              </p>
            </div>
          </PainelSecao>

          <div className="grid gap-4 lg:grid-cols-2">
            <PainelSecao titulo="Remetente" descricao="Fornecedor / origem da carga.">
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo label="CNPJ" valor={entrada.remetenteCnpj ?? ""} onChange={(v) => set({ remetenteCnpj: mascaraCnpj(v) })} />
                <Campo label="Nome do fornecedor" valor={entrada.remetenteNome ?? ""} onChange={(v) => set({ remetenteNome: v })} />
                <Campo label="Cidade" valor={entrada.origemCidade} onChange={(v) => set({ origemCidade: v })} />
                <Campo label="UF" valor={entrada.origemUf} onChange={(v) => set({ origemUf: v.toUpperCase().slice(0, 2) })} />
              </div>
            </PainelSecao>

            <PainelSecao titulo="Destinatário" descricao="Unidade / cliente de entrega.">
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo label="CNPJ" valor={entrada.destinatarioCnpj ?? ""} onChange={(v) => set({ destinatarioCnpj: mascaraCnpj(v) })} />
                <Campo label="Nome" valor={entrada.destinatarioNome ?? ""} onChange={(v) => set({ destinatarioNome: v })} />
                <Campo label="Cidade" valor={entrada.destinoCidade} onChange={(v) => set({ destinoCidade: v })} />
                <Campo label="UF" valor={entrada.destinoUf} onChange={(v) => set({ destinoUf: v.toUpperCase().slice(0, 2) })} />
                <Campo label="CEP" valor={entrada.cepDestino} onChange={(v) => set({ cepDestino: v })} />
              </div>
            </PainelSecao>
          </div>

          <PainelSecao titulo="Carga" descricao="Dados da nota fiscal e peso bruto.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="Valor da NF-e (R$)" tipo="number" valor={String(entrada.valorNf)} onChange={(v) => set({ valorNf: Number(v) || 0 })} />
              <Campo label="Peso bruto (kg)" tipo="number" valor={String(entrada.pesoKg)} onChange={(v) => set({ pesoKg: Number(v) || 0 })} />
            </div>
          </PainelSecao>

          <PainelSecao titulo="Volumes e cubagem" descricao="Informe as medidas de cada volume; a cubagem da NF-e é calculada automaticamente.">
            <EditorVolumes volumes={volumesDetalhados} onChange={setVolumesDetalhados} fatorCubagem={fatorCubagem} />
          </PainelSecao>
        </div>

        <PainelSecao titulo="Comparativo" descricao="Ordenado da opção mais barata para a mais cara.">
          <div className="mb-3 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">{entrada.tomador ?? "CIF"}</span> ·{" "}
              {entrada.remetenteNome || entrada.origemCidade || "Remetente"} → {entrada.destinatarioNome || entrada.destinoCidade || "Destinatário"}
            </p>
            <p>
              Peso real {numero(entrada.pesoKg)} kg · Cubagem {numero(entradaFinal.cubagemM3, 3)} m³ ·{" "}
              {numero(entradaFinal.volumes)} volume(s)
            </p>
          </div>

          {!vigentes.length ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma tabela vigente. Importe e aprove uma tabela para cotar.
            </p>
          ) : (
            <div className="space-y-2">
              {resultados.map((r) => (
                <div key={r.tabelaId} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {r.transportadora}
                        {melhor && r.tabelaId === melhor.tabelaId ? (
                          <Badge className="ml-2 border-0 bg-positive/15 text-positive text-[11px]">
                            <Trophy className="mr-1 size-3" /> Melhor custo
                          </Badge>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.tabelaNome}
                        {r.prazoDias !== null ? ` · ${r.prazoDias} dia(s)` : ""}
                        {r.encontrada ? ` · peso taxado ${numero(r.pesoTaxado, 1)} kg` : ""}
                      </p>
                    </div>
                    <p className="numeric text-lg font-semibold">
                      {r.encontrada ? moeda(r.total) : <span className="text-xs font-normal text-muted-foreground">{r.motivo}</span>}
                    </p>
                  </div>
                  {r.encontrada ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {r.componentes.map((c) => `${c.nome}: ${moeda(c.valor)}`).join(" · ")}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </PainelSecao>
      </div>
    </PaginaTabelas>
  );
}

function mascaraCnpj(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function Campo({ label, valor, onChange, tipo = "text" }: { label: string; valor: string; onChange: (v: string) => void; tipo?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type={tipo} value={valor} onChange={(e) => onChange(e.target.value)} className="h-9" />
    </div>
  );
}
