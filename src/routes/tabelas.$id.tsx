import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Copy, Trash2, X } from "lucide-react";

import { PaginaTabelas } from "@/components/tabelas/PaginaTabelas";
import { PainelSecao } from "@/components/kpi/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { moeda, numero } from "@/lib/kpi/format";
import { simularTabela } from "@/lib/tabelas/calculo";
import { useTabelas } from "@/lib/tabelas/store";
import { ENTRADA_PADRAO, type EntradaSimulacao } from "@/lib/tabelas/types";
import { CORES_STATUS, ROTULOS_STATUS } from "./tabelas.index";

export const Route = createFileRoute("/tabelas/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe da tabela de frete | Cotação de Fretes" },
      { name: "description", content: "Rotas, regras de cálculo, simulação e histórico de auditoria da tabela de frete." },
      { property: "og:title", content: "Detalhe da tabela de frete" },
      { property: "og:description", content: "Consulte rotas, regras, simulações e auditoria da tabela." },
    ],
  }),
  component: DetalheTabela,
});

function DetalheTabela() {
  const { id } = Route.useParams();
  const { obter, aprovar, reprovar, remover, novaVersao, conflitosDe, pronto } = useTabelas();
  const tabela = obter(id);
  const [entrada, setEntrada] = useState<EntradaSimulacao>(ENTRADA_PADRAO);
  const [busca, setBusca] = useState("");

  const resultado = useMemo(() => (tabela ? simularTabela(tabela, entrada) : null), [entrada, tabela]);
  const conflitos = tabela ? conflitosDe(tabela) : [];

  const linhas = useMemo(() => {
    if (!tabela) return [];
    const termo = busca.trim().toLowerCase();
    if (!termo) return tabela.linhas;
    return tabela.linhas.filter((l) =>
      [l.destinoCidade, l.destinoUf, l.origemCidade, l.origemUf, l.destinoCepInicio].some((c) =>
        c.toLowerCase().includes(termo),
      ),
    );
  }, [busca, tabela]);

  if (!pronto) return <div className="panel p-6 text-sm text-muted-foreground">Carregando...</div>;

  if (!tabela) {
    return (
      <PaginaTabelas titulo="Tabela não encontrada" descricao="Ela pode ter sido removida deste navegador.">
        <Button asChild variant="outline">
          <Link to="/tabelas">
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </Button>
      </PaginaTabelas>
    );
  }

  return (
    <PaginaTabelas
      titulo={tabela.nome}
      descricao={`${tabela.transportadora} · ${tabela.abrangencia || "sem abrangência"} · v${tabela.versao}`}
      acoes={
        <>
          <Badge className={`${CORES_STATUS[tabela.status]} border-0 text-[11px]`}>{ROTULOS_STATUS[tabela.status]}</Badge>
          <Button asChild size="sm" variant="ghost">
            <Link to="/tabelas">
              <ArrowLeft className="size-4" /> Voltar
            </Link>
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {conflitos.length && tabela.status !== "vigente" ? (
          <div className="panel border-warning/40 p-3 text-xs text-warning">
            Conflito de vigência com {conflitos.length} tabela(s) vigente(s) da mesma transportadora/abrangência. Ao
            aprovar, elas serão marcadas como substituídas.
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {tabela.status !== "vigente" ? (
            <Button size="sm" onClick={() => { aprovar(tabela.id); toast.success("Tabela aprovada e vigente."); }}>
              <Check className="size-4" /> Aprovar
            </Button>
          ) : null}
          {tabela.status === "aguardando" ? (
            <Button size="sm" variant="outline" onClick={() => { reprovar(tabela.id, "Reprovada na análise comercial."); toast.info("Tabela devolvida para rascunho."); }}>
              <X className="size-4" /> Reprovar
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => { const nova = novaVersao(tabela.id); if (nova) toast.success(`Versão v${nova.versao} criada como rascunho.`); }}>
            <Copy className="size-4" /> Nova versão
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { remover(tabela.id); toast.success("Tabela removida."); }}>
            <Trash2 className="size-4" /> Excluir
          </Button>
        </div>

        <Tabs defaultValue="rotas">
          <TabsList>
            <TabsTrigger value="rotas">Rotas ({numero(tabela.linhas.length)})</TabsTrigger>
            <TabsTrigger value="regras">Regras</TabsTrigger>
            <TabsTrigger value="simular">Simulação</TabsTrigger>
            <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="rotas" className="mt-3">
            <PainelSecao
              titulo="Rotas cadastradas"
              acoes={<Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Filtrar destino..." className="h-8 w-56" />}
            >
              <div className="max-h-[520px] overflow-auto rounded-md border border-border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted text-left uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-2 py-1.5">Origem</th>
                      <th className="px-2 py-1.5">Destino</th>
                      <th className="px-2 py-1.5">CEP</th>
                      <th className="px-2 py-1.5">Faixa peso</th>
                      <th className="px-2 py-1.5 text-right">R$/kg</th>
                      <th className="px-2 py-1.5 text-right">Fixo</th>
                      <th className="px-2 py-1.5 text-right">Mínimo</th>
                      <th className="px-2 py-1.5 text-right">Prazo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((l) => (
                      <tr key={l.id} className="border-t border-border/60">
                        <td className="px-2 py-1">{[l.origemCidade, l.origemUf].filter(Boolean).join("/") || "—"}</td>
                        <td className="px-2 py-1">{[l.destinoCidade, l.destinoUf].filter(Boolean).join("/") || "—"}</td>
                        <td className="px-2 py-1 numeric">{l.destinoCepInicio ? `${l.destinoCepInicio}–${l.destinoCepFim || "…"}` : "—"}</td>
                        <td className="px-2 py-1 numeric">{l.pesoDe !== null || l.pesoAte !== null ? `${l.pesoDe ?? 0}–${l.pesoAte ?? "∞"}` : "—"}</td>
                        <td className="px-2 py-1 numeric text-right">{l.valorPorKg ?? "—"}</td>
                        <td className="px-2 py-1 numeric text-right">{l.valorFixo ?? "—"}</td>
                        <td className="px-2 py-1 numeric text-right">{l.fretePesoMinimo ?? "—"}</td>
                        <td className="px-2 py-1 numeric text-right">{l.prazoDias ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PainelSecao>
          </TabsContent>

          <TabsContent value="regras" className="mt-3">
            <PainelSecao titulo="Regras de cálculo" descricao="Parâmetros aplicados nas simulações desta tabela.">
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                {[
                  ["Modelo", tabela.regras.modelo],
                  ["Frete mínimo", moeda(tabela.regras.freteMinimo)],
                  ["GRIS", `${tabela.regras.gris}%`],
                  ["Ad valorem", `${tabela.regras.advalorem}%`],
                  ["Pedágio/fração", moeda(tabela.regras.pedagioPorFracao)],
                  ["Fração pedágio", `${tabela.regras.fracaoPedagioKg} kg`],
                  ["Taxa de coleta", moeda(tabela.regras.taxaColeta)],
                  ["Taxa de entrega", moeda(tabela.regras.taxaEntrega)],
                  ["Despacho", moeda(tabela.regras.despacho)],
                  ["Fator cubagem", `${tabela.regras.fatorCubagem} kg/m³`],
                  ["ICMS", `${tabela.regras.icms}%`],
                  ["Vigência", `${tabela.vigenciaInicio} → ${tabela.vigenciaFim}`],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</dt>
                    <dd className="numeric">{v}</dd>
                  </div>
                ))}
              </dl>
            </PainelSecao>
          </TabsContent>

          <TabsContent value="simular" className="mt-3">
            <div className="grid gap-4 lg:grid-cols-2">
              <PainelSecao titulo="Cenário" descricao="Sandbox de teste desta tabela.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Num label="UF destino" texto valor={entrada.destinoUf} onTexto={(v) => setEntrada({ ...entrada, destinoUf: v.toUpperCase() })} />
                  <Num label="Cidade destino" texto valor={entrada.destinoCidade} onTexto={(v) => setEntrada({ ...entrada, destinoCidade: v })} />
                  <Num label="CEP destino" texto valor={entrada.cepDestino} onTexto={(v) => setEntrada({ ...entrada, cepDestino: v })} />
                  <Num label="Peso (kg)" valor={entrada.pesoKg} onNumero={(v) => setEntrada({ ...entrada, pesoKg: v })} />
                  <Num label="Volumes" valor={entrada.volumes} onNumero={(v) => setEntrada({ ...entrada, volumes: v })} />
                  <Num label="Cubagem (m³)" valor={entrada.cubagemM3} onNumero={(v) => setEntrada({ ...entrada, cubagemM3: v })} />
                  <Num label="Valor da NF (R$)" valor={entrada.valorNf} onNumero={(v) => setEntrada({ ...entrada, valorNf: v })} />
                </div>
              </PainelSecao>

              <PainelSecao titulo="Resultado" descricao={`Peso taxado: ${numero(resultado?.pesoTaxado ?? 0, 1)} kg`}>
                {!resultado?.encontrada ? (
                  <p className="text-sm text-muted-foreground">{resultado?.motivo ?? "Sem resultado."}</p>
                ) : (
                  <div className="space-y-2">
                    {resultado.componentes.map((c, i) => (
                      <div key={`${c.nome}-${i}`} className="flex justify-between border-b border-border/60 pb-1 text-sm">
                        <span className="text-muted-foreground">{c.nome}</span>
                        <span className="numeric">{moeda(c.valor)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-1 text-base font-semibold">
                      <span>Total</span>
                      <span className="numeric text-primary">{moeda(resultado.total)}</span>
                    </div>
                    {resultado.prazoDias !== null ? (
                      <p className="text-xs text-muted-foreground">Prazo: {resultado.prazoDias} dia(s)</p>
                    ) : null}
                  </div>
                )}
              </PainelSecao>
            </div>
          </TabsContent>

          <TabsContent value="auditoria" className="mt-3">
            <PainelSecao titulo="Histórico" descricao="Todas as ações registradas nesta tabela.">
              <ul className="space-y-2 text-sm">
                {tabela.auditoria.map((e) => (
                  <li key={e.id} className="border-b border-border/60 pb-2 last:border-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[11px]">{e.acao}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(e.data).toLocaleString("pt-BR")} · {e.usuario}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{e.detalhe}</p>
                  </li>
                ))}
              </ul>
            </PainelSecao>
          </TabsContent>
        </Tabs>
      </div>
    </PaginaTabelas>
  );
}

function Num({
  label,
  valor,
  onNumero,
  onTexto,
  texto = false,
}: {
  label: string;
  valor: string | number;
  onNumero?: (v: number) => void;
  onTexto?: (v: string) => void;
  texto?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type={texto ? "text" : "number"}
        value={valor}
        onChange={(e) => (texto ? onTexto?.(e.target.value) : onNumero?.(Number(e.target.value) || 0))}
        className="h-9"
      />
    </div>
  );
}
