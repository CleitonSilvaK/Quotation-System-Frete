import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Trophy,
  Truck,
  Sparkles,
  TrendingDown,
  Building2,
  Factory,
  Scale,
  DollarSign,
  Search,
  CheckCircle2,
  AlertCircle,
  Info,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import { Pagina } from "@/components/kpi/Pagina";
import { KpiCard, PainelSecao } from "@/components/kpi/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { moeda, numero, percentual, porKg } from "@/lib/kpi/format";
import {
  recomendarTransportadora,
  detectarOportunidades,
  type EntradaRecomendacao,
} from "@/lib/kpi/opportunityEngine";
import { useKpi } from "@/lib/kpi/store";

export const Route = createFileRoute("/oportunidades")({
  head: () => ({
    meta: [
      { title: "Recomendador de Transportadora | KPI Fretes de Compras" },
      {
        name: "description",
        content:
          "Recomendador preditivo de transportadoras baseado no histórico de CT-es por Remetente, Destinatário, Peso (KG) e Valor da NF.",
      },
      { property: "og:title", content: "Recomendador de Transportadora" },
      {
        property: "og:description",
        content:
          "Descubra a melhor transportadora para seu embarque analisando o histórico real de fretes.",
      },
    ],
  }),
  component: RecomendadorOportunidades,
});

function RecomendadorOportunidades() {
  const { registros, opcoes } = useKpi();

  // Top fornecedores mais frequentes para sugestão rápida
  const topFornecedores = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const r of registros) {
      if (r.nomeFornecedor && !r.cancelado) {
        contagem.set(r.nomeFornecedor, (contagem.get(r.nomeFornecedor) ?? 0) + 1);
      }
    }
    return [...contagem.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([nome]) => nome)
      .slice(0, 6);
  }, [registros]);

  // Estado dos parâmetros do embarque
  const [remetente, setRemetente] = useState<string>(topFornecedores[0] ?? "");
  const [destinatario, setDestinatario] = useState<string>("Todas");
  const [pesoKg, setPesoKg] = useState<number>(1200);
  const [valorNf, setValorNf] = useState<number>(45000);

  // Execução do motor de recomendação preditiva
  const entrada = useMemo<EntradaRecomendacao>(
    () => ({
      remetente,
      destinatario,
      pesoKg: Number(pesoKg) || 0,
      valorNf: Number(valorNf) || 0,
    }),
    [remetente, destinatario, pesoKg, valorNf],
  );

  const resultado = useMemo(
    () => recomendarTransportadora(registros, entrada),
    [registros, entrada],
  );

  // Oportunidades gerais de desvio de benchmark da base
  const oportunidadesGerais = useMemo(() => detectarOportunidades(registros), [registros]);

  // Dados para o gráfico de comparativo
  const dadosGrafico = useMemo(() => {
    return resultado.ranking.slice(0, 8).map((t) => ({
      nome: t.nomeTransportadora.length > 18 ? t.nomeTransportadora.slice(0, 16) + "…" : t.nomeTransportadora,
      nomeCompleto: t.nomeTransportadora,
      frete: t.freteEstimado,
      posicao: t.posicao,
      isRecomendada: t.posicao === 1,
    }));
  }, [resultado.ranking]);

  const recomendada = resultado.recomendada;

  const aplicarPreset = (f: string, d: string, p: number, v: number) => {
    setRemetente(f);
    setDestinatario(d);
    setPesoKg(p);
    setValorNf(v);
  };

  return (
    <Pagina
      titulo="Recomendador de Transportadoras"
      descricao="Análise preditiva baseada no histórico de CT-es para selecionar a transportadora mais vantajosa para seu embarque."
    >
      <div className="space-y-6">
        {/* PARÂMETROS DE ENTRADA DA CARGA */}
        <PainelSecao
          titulo="Dados do Embarque"
          descricao="Informe o remetente, destinatário, peso e valor da nota fiscal para cotar com o histórico."
        >
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* REMETENTE */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-semibold">
                  <Factory className="size-3.5 text-primary" /> Remetente / Fornecedor
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Digite ou selecione o fornecedor..."
                    value={remetente}
                    onChange={(e) => setRemetente(e.target.value)}
                    list="lista-fornecedores"
                    className="h-9 pr-8 text-sm"
                  />
                  <Search className="absolute right-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                </div>
                <datalist id="lista-fornecedores">
                  {opcoes.fornecedores.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>

              {/* DESTINATÁRIO */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-semibold">
                  <Building2 className="size-3.5 text-primary" /> Destinatário / Unidade
                </Label>
                <Select value={destinatario} onValueChange={setDestinatario}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas">Todas as Unidades</SelectItem>
                    <SelectItem value="Camaquã">Camaquã</SelectItem>
                    <SelectItem value="Pelotas">Pelotas</SelectItem>
                    <SelectItem value="Outra">Outra Unidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* PESO KG */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-semibold">
                  <Scale className="size-3.5 text-primary" /> Peso Bruto (KG)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={50}
                  value={pesoKg || ""}
                  onChange={(e) => setPesoKg(Number(e.target.value))}
                  placeholder="Ex: 1200"
                  className="h-9 text-sm numeric"
                />
              </div>

              {/* VALOR DA NF */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-semibold">
                  <DollarSign className="size-3.5 text-primary" /> Valor da NF-e (R$)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={500}
                  value={valorNf || ""}
                  onChange={(e) => setValorNf(Number(e.target.value))}
                  placeholder="Ex: 45000"
                  className="h-9 text-sm numeric"
                />
              </div>
            </div>

            {/* CHIPS DE SUGESTÃO RÁPIDA DE FORNECEDORES */}
            {topFornecedores.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs text-muted-foreground mr-1">Fornecedores frequentes:</span>
                {topFornecedores.map((f) => (
                  <button
                    key={f}
                    onClick={() => setRemetente(f)}
                    className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                      remetente === f
                        ? "border-primary bg-primary/10 font-medium text-primary"
                        : "border-border bg-background hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {f.length > 25 ? f.slice(0, 23) + "…" : f}
                  </button>
                ))}
              </div>
            )}

            {/* PRESETS DE SIMULAÇÃO */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Exemplos rápidos:</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() =>
                    aplicarPreset(topFornecedores[0] ?? "JOSAPAR", "Camaquã", 1500, 35000)
                  }
                >
                  Carga Média Camaquã (1.500 kg)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() =>
                    aplicarPreset(topFornecedores[1] ?? "CAMIL", "Pelotas", 4000, 90000)
                  }
                >
                  Carga Pesada Pelotas (4.000 kg)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() =>
                    aplicarPreset(topFornecedores[2] ?? "SÃO PAULO", "Todas", 500, 150000)
                  }
                >
                  Alto Valor / Leve (500 kg | R$ 150k)
                </Button>
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => {
                  setRemetente("");
                  setDestinatario("Todas");
                  setPesoKg(1000);
                  setValorNf(30000);
                }}
              >
                <RotateCcw className="mr-1 size-3" /> Limpar campos
              </Button>
            </div>
          </div>
        </PainelSecao>

        {/* HERO CARD DE RECOMENDAÇÃO PRINCIPAL */}
        {recomendada ? (
          <div className="relative overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 via-background to-surface p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* LADO ESQUERDO: TRANSPORTADORA & DETALHES */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-0 bg-primary text-primary-foreground font-semibold px-3 py-1">
                    <Trophy className="mr-1.5 size-3.5" /> Transportadora Recomendada #1
                  </Badge>
                  <Badge variant="outline" className="border-primary/30 text-xs">
                    {resultado.nivelCorrespondencia}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      recomendada.scoreConfiabilidade === "Alta"
                        ? "bg-positive/15 text-positive"
                        : recomendada.scoreConfiabilidade === "Média"
                        ? "bg-warning/15 text-warning-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    Confiança: {recomendada.scoreConfiabilidade} ({resultado.totalCtesAnalisados} CT-es)
                  </Badge>
                </div>

                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {recomendada.nomeTransportadora}
                  </h2>
                  {recomendada.cnpjTransportadora && (
                    <p className="text-xs text-muted-foreground font-mono">
                      CNPJ: {recomendada.cnpjTransportadora}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span>
                    R$/KG Estimado:{" "}
                    <strong className="text-foreground">{porKg(recomendada.custoPorKgEstimado)}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Frete sobre NF:{" "}
                    <strong className="text-foreground">
                      {percentual(recomendada.percentualNfEstimado)}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    CT-es no histórico:{" "}
                    <strong className="text-foreground">{recomendada.ctesHistoricos} envios</strong>
                  </span>
                </div>
              </div>

              {/* LADO DIREITO: VALOR ESTIMADO DO FRETE & ECONOMIA */}
              <div className="flex flex-col items-start lg:items-end justify-center rounded-lg bg-background/80 p-4 border border-border/80 min-w-[280px]">
                <span className="text-xs font-medium text-muted-foreground">
                  Frete Total Estimado
                </span>
                <p className="numeric text-3xl font-extrabold text-primary">
                  {moeda(recomendada.freteEstimado)}
                </p>

                {resultado.economiaEstimadaVsMedia > 0 ? (
                  <div className="mt-2 flex items-center gap-1.5 rounded-md bg-positive/10 px-2.5 py-1 text-xs font-semibold text-positive">
                    <TrendingDown className="size-4" />
                    <span>
                      Economia de {moeda(resultado.economiaEstimadaVsMedia)} (
                      {resultado.economiaPorcentagemVsMedia.toFixed(1)}%) vs. média
                    </span>
                  </div>
                ) : (
                  <span className="mt-1 text-xs text-muted-foreground">
                    Melhor taxa observada no trecho
                  </span>
                )}
              </div>
            </div>

            {/* INSIGHTS DESTAQUE */}
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border/40 pt-3 text-xs text-muted-foreground">
              {resultado.insights.map((insight, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary shrink-0" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
            <AlertCircle className="mx-auto size-8 text-muted-foreground/60 mb-2" />
            <p className="text-sm font-medium">Nenhuma recomendação disponível para os parâmetros informados.</p>
            <p className="text-xs mt-1">Tente ajustar o remetente ou selecionar "Todas as Unidades".</p>
          </div>
        )}

        {/* COMPARATIVO E GRÁFICO */}
        {resultado.ranking.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            {/* TABELA DE RANKING DAS TRANSPORTADORAS */}
            <PainelSecao
              titulo="Ranking Comparativo das Transportadoras"
              descricao={`Ordenado do menor valor para o maior. Amostragem: ${resultado.totalCtesAnalisados} CT-es.`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Transportadora</th>
                      <th className="py-2.5 px-3 text-right">Frete Estimado</th>
                      <th className="py-2.5 px-3 text-right">Diferença vs #1</th>
                      <th className="py-2.5 px-3 text-right">R$/KG Hist.</th>
                      <th className="py-2.5 px-3 text-right">% NF Hist.</th>
                      <th className="py-2.5 px-3 text-center">CT-es</th>
                      <th className="py-2.5 px-3">Status / Destaque</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {resultado.ranking.map((t) => (
                      <tr
                        key={t.nomeTransportadora}
                        className={`transition-colors ${
                          t.posicao === 1
                            ? "bg-primary/5 font-medium hover:bg-primary/10"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <td className="py-2.5 px-3 font-semibold text-foreground">
                          {t.posicao === 1 ? "🏆 #1" : `#${t.posicao}`}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-foreground">
                          <div>
                            <p>{t.nomeTransportadora}</p>
                            {t.cnpjTransportadora && (
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {t.cnpjTransportadora}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right numeric font-bold text-foreground">
                          {moeda(t.freteEstimado)}
                        </td>
                        <td className="py-2.5 px-3 text-right numeric">
                          {t.posicao === 1 ? (
                            <span className="text-positive font-semibold">Recomendada</span>
                          ) : (
                            <span className="text-destructive font-medium">
                              +{moeda(t.variacaoVsRecomendada)} (+{t.variacaoPorcentagemVsRecomendada.toFixed(1)}%)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right numeric">
                          {porKg(t.custoPorKgEstimado)}
                        </td>
                        <td className="py-2.5 px-3 text-right numeric">
                          {percentual(t.percentualNfEstimado)}
                        </td>
                        <td className="py-2.5 px-3 text-center numeric">
                          {t.ctesHistoricos}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant={t.posicao === 1 ? "default" : "outline"}
                            className="text-[10px] font-normal"
                          >
                            {t.destaque}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PainelSecao>

            {/* GRÁFICO COMPARATIVO */}
            <PainelSecao
              titulo="Comparativo Visual"
              descricao="Frete total estimado por transportadora"
            >
              <div className="h-[280px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="nome"
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      tickFormatter={(v) => `R$${v}`}
                      tick={{ fontSize: 10 }}
                    />
                    <RechartsTooltip
                      formatter={(val: number) => [moeda(val), "Frete Estimado"]}
                      labelFormatter={(lbl, payload) => payload[0]?.payload?.nomeCompleto ?? lbl}
                    />
                    <Bar dataKey="frete" radius={[4, 4, 0, 0]}>
                      {dadosGrafico.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isRecomendada ? "hsl(var(--primary))" : "hsl(var(--muted-foreground)/0.4)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PainelSecao>
          </div>
        )}

        {/* OPORTUNIDADES GERAIS E DESVIOS DE BENCHMARK */}
        <PainelSecao
          titulo="Oportunidades Globais de Renegociação"
          descricao="Desvios de frete e benchmarks detectados na base geral de CT-es."
        >
          {oportunidadesGerais.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {oportunidadesGerais.map((o, i) => (
                <div key={i} className="rounded-lg border border-border bg-surface p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground">{o.titulo}</p>
                    <Badge
                      variant={
                        o.severidade === "Alta"
                          ? "destructive"
                          : o.severidade === "Média"
                          ? "outline"
                          : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {o.severidade}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{o.detalhe}</p>
                  {o.economiaEstimada && o.economiaEstimada > 0 ? (
                    <p className="text-xs font-semibold text-positive pt-1">
                      Economia potencial: {moeda(o.economiaEstimada)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhum desvio crítico registrado na base geral.
            </p>
          )}
        </PainelSecao>
      </div>
    </Pagina>
  );
}
