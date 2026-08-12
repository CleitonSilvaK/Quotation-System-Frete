import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Building2, Boxes, DollarSign, FileText, Percent, Scale, TrendingUp } from "lucide-react";

import { Pagina } from "@/components/kpi/Pagina";
import { KpiCard, PainelSecao } from "@/components/kpi/KpiCard";
import { MatrizCruzada, formatarMetrica } from "@/components/kpi/MatrizCruzada";
import { Tabela } from "@/components/kpi/Tabela";
import { colunasAgregado } from "@/components/kpi/colunasAgregado";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  agruparPor,
  comparativoAnos,
  resumoGeral,
  serieMensal,
  LABEL_METRICA,
  type MetricaSerie,
} from "@/lib/kpi/dashboardCalculations";
import { moeda, moedaCompacta, numero, percentual, peso as fmtPeso, porKg } from "@/lib/kpi/format";
import { detectarOportunidades } from "@/lib/kpi/opportunityEngine";
import { useKpi } from "@/lib/kpi/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão Geral | KPI Fretes de Compras" },
      {
        name: "description",
        content:
          "Dashboard do custo de frete das compras: custo total, R$/kg, frete sobre valor comprado e comparação Camaquã × Pelotas.",
      },
      { property: "og:title", content: "Visão Geral | KPI Fretes de Compras" },
      {
        property: "og:description",
        content: "Quanto gastamos para transportar nossas compras até Camaquã e Pelotas.",
      },
    ],
  }),
  component: VisaoGeral,
});

const CORES = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const eixo = { stroke: "var(--muted-foreground)", fontSize: 11 };

function TooltipBI({ active, payload, label, formato }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((item: any) => (
        <p key={item.dataKey} className="numeric text-muted-foreground">
          <span style={{ color: item.color }}>■</span> {item.name}:{" "}
          <span className="font-medium text-foreground">
            {formato ? formato(item.value) : numero(item.value, 2)}
          </span>
        </p>
      ))}
    </div>
  );
}

function VisaoGeral() {
  const { registros } = useKpi();
  const [metrica, setMetrica] = useState<MetricaSerie>("custoTotal");
  const [metricaMatriz, setMetricaMatriz] = useState<MetricaSerie>("custoTotal");

  const resumo = useMemo(() => resumoGeral(registros), [registros]);
  const serie = useMemo(() => serieMensal(registros, metrica), [registros, metrica]);
  const anual = useMemo(() => comparativoAnos(registros, metrica), [registros, metrica]);
  const porUnidade = useMemo(() => agruparPor(registros, (r) => r.unidadeDestino), [registros]);
  const porRegiao = useMemo(() => agruparPor(registros, (r) => r.regiaoOrigem), [registros]);
  const porUF = useMemo(() => agruparPor(registros, (r) => r.ufOrigem), [registros]);
  const porTransportadora = useMemo(
    () => agruparPor(registros, (r) => r.nomeTransportadora),
    [registros],
  );
  const porRota = useMemo(() => agruparPor(registros, (r) => r.rotaUF), [registros]);
  const oportunidades = useMemo(() => detectarOportunidades(registros), [registros]);

  const formato = (v: number) => formatarMetrica(v, metrica);

  return (
    <Pagina
      titulo="Visão Geral"
      descricao="Quanto estamos gastando para transportar nossas compras até Camaquã e Pelotas."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          titulo="Custo total de frete"
          valor={moeda(resumo.custoTotal, 2)}
          descricao={`${numero(resumo.ctes)} CT-es no período`}
          destaque="primario"
          icone={<DollarSign className="size-4" />}
        />
        <KpiCard
          titulo="Quantidade de CT-es"
          valor={numero(resumo.ctes)}
          descricao="Documentos de transporte de compras"
          icone={<FileText className="size-4" />}
        />
        <KpiCard
          titulo="Custo médio por CT-e"
          valor={moeda(resumo.custoMedio)}
          descricao="Média das prestações de serviço"
          icone={<TrendingUp className="size-4" />}
        />
        <KpiCard
          titulo="Peso transportado"
          valor={fmtPeso(resumo.peso)}
          descricao={`${numero(resumo.ctesSemPeso)} CT-es sem peso informado`}
          icone={<Scale className="size-4" />}
        />
        <KpiCard
          titulo="Custo médio por kg"
          valor={porKg(resumo.custoPorKg)}
          descricao="Custo total ÷ peso total"
          icone={<Boxes className="size-4" />}
        />
        <KpiCard
          titulo="Valor das compras transportadas"
          valor={moeda(resumo.valorCompras, 2)}
          descricao={`${numero(resumo.ctesSemValorCompra)} CT-es sem valor de mercadoria`}
          icone={<Building2 className="size-4" />}
        />
        <KpiCard
          titulo="Frete / valor das compras"
          valor={percentual(resumo.fretePercentual)}
          descricao="Frete ÷ valor da mercadoria × 100"
          destaque="alerta"
          icone={<Percent className="size-4" />}
        />
        <KpiCard
          titulo="Frete por R$ 1.000 em compras"
          valor={moeda(resumo.fretePor1000)}
          descricao="Comparação justa entre rotas e unidades"
          destaque="positivo"
          icone={<Percent className="size-4" />}
        />
      </div>

      <PainelSecao
        titulo="Custo de frete de compras por mês"
        descricao="Evolução do indicador selecionado ao longo do período filtrado."
        className="mt-4"
        acoes={
          <Select value={metrica} onValueChange={(v) => setMetrica(v as MetricaSerie)}>
            <SelectTrigger className="h-9 w-[240px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LABEL_METRICA).map(([chave, rotulo]) => (
                <SelectItem key={chave} value={chave} className="text-xs">
                  {rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serie}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="rotulo" {...eixo} tickLine={false} />
              <YAxis {...eixo} tickLine={false} tickFormatter={(v) => moedaCompacta(v).replace("R$ ", "")} />
              <Tooltip content={<TooltipBI formato={formato} />} cursor={{ fill: "var(--accent)" }} />
              <Bar
                dataKey="valor"
                name={LABEL_METRICA[metrica]}
                fill="var(--chart-1)"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Comparação entre anos — {LABEL_METRICA[metrica]}
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={anual.dados}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="rotulo" {...eixo} tickLine={false} />
                <YAxis {...eixo} tickLine={false} tickFormatter={(v) => moedaCompacta(v).replace("R$ ", "")} />
                <Tooltip content={<TooltipBI formato={formato} />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {anual.anos.map((ano, indice) => (
                  <Line
                    key={ano}
                    type="monotone"
                    dataKey={ano}
                    name={ano}
                    stroke={CORES[indice % CORES.length]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </PainelSecao>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <PainelSecao
          titulo="Custo de frete por unidade"
          descricao="Camaquã × Pelotas — avalie sempre volume, peso e valor comprado, não apenas o custo total."
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porUnidade} layout="vertical">
                <CartesianGrid stroke="var(--border)" horizontal={false} />
                <XAxis type="number" {...eixo} tickFormatter={(v) => moedaCompacta(v).replace("R$ ", "")} />
                <YAxis type="category" dataKey="chave" {...eixo} width={80} tickLine={false} />
                <Tooltip content={<TooltipBI formato={(v: number) => moeda(v, 0)} />} cursor={{ fill: "var(--accent)" }} />
                <Bar dataKey="custoTotal" name="Custo total" radius={[0, 3, 3, 0]}>
                  {porUnidade.map((_, indice) => (
                    <Cell key={indice} fill={CORES[indice % CORES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {porUnidade.map((u) => (
              <div key={u.chave} className="rounded-md border border-border bg-surface p-3">
                <p className="text-sm font-semibold">{u.chave}</p>
                <dl className="mt-2 space-y-1 text-xs">
                  {[
                    ["Custo total", moeda(u.custoTotal, 0)],
                    ["CT-es", numero(u.ctes)],
                    ["Custo médio", moeda(u.custoMedio)],
                    ["Peso", fmtPeso(u.peso)],
                    ["R$/kg", porKg(u.custoPorKg)],
                    ["Valor das compras", moeda(u.valorCompras, 0)],
                    ["Frete / compras", percentual(u.fretePercentual)],
                  ].map(([rotulo, valor]) => (
                    <div key={rotulo} className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">{rotulo}</dt>
                      <dd className="numeric font-medium">{valor}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </PainelSecao>

        <PainelSecao
          titulo="De onde vêm nossas compras?"
          descricao="Participação das regiões de origem no custo de frete."
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={porRegiao}
                  dataKey="custoTotal"
                  nameKey="chave"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {porRegiao.map((_, indice) => (
                    <Cell key={indice} fill={CORES[indice % CORES.length]} stroke="var(--card)" />
                  ))}
                </Pie>
                <Tooltip content={<TooltipBI formato={(v: number) => moeda(v, 0)} />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3">
            <Tabela
              dados={porUF.slice(0, 8)}
              colunas={colunasAgregado("UF de origem", true).filter((c) =>
                ["chave", "ctes", "custoTotal", "custoPorKg", "participacao"].includes(c.chave),
              )}
              ordemInicial="custoTotal"
              maxAltura="max-h-[260px]"
            />
          </div>
        </PainelSecao>
      </div>

      <PainelSecao
        titulo="Origem das compras × unidade de destino"
        descricao="Matriz UF de origem × unidade. Verde = melhor indicador, vermelho = pior."
        className="mt-4"
        acoes={
          <Select value={metricaMatriz} onValueChange={(v) => setMetricaMatriz(v as MetricaSerie)}>
            <SelectTrigger className="h-9 w-[240px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LABEL_METRICA).map(([chave, rotulo]) => (
                <SelectItem key={chave} value={chave} className="text-xs">
                  {rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        <MatrizCruzada
          registros={registros}
          linhaDe={(r) => r.ufOrigem}
          colunaDe={(r) => r.unidadeDestino}
          metrica={metricaMatriz}
          rotuloLinha="UF de origem"
          destacarExtremos={metricaMatriz === "custoPorKg" || metricaMatriz === "custoMedio"}
        />
      </PainelSecao>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <PainelSecao titulo="Rotas com maior custo" descricao="Top 10 rotas UF de origem → unidade.">
          <Tabela
            dados={porRota.slice(0, 10)}
            colunas={colunasAgregado("Rota").filter((c) =>
              ["chave", "ctes", "custoTotal", "custoMedio", "custoPorKg"].includes(c.chave),
            )}
            ordemInicial="custoTotal"
            maxAltura="max-h-[360px]"
          />
        </PainelSecao>
        <PainelSecao
          titulo="Transportadoras com maior custo"
          descricao="Top 10 por custo total de frete."
        >
          <Tabela
            dados={porTransportadora.slice(0, 10)}
            colunas={colunasAgregado("Transportadora", true).filter((c) =>
              ["chave", "ctes", "custoTotal", "custoPorKg", "participacao"].includes(c.chave),
            )}
            ordemInicial="custoTotal"
            maxAltura="max-h-[360px]"
          />
        </PainelSecao>
      </div>

      {oportunidades.length ? (
        <PainelSecao
          titulo="Alertas de oportunidade"
          descricao="Principais desvios detectados nos dados reais importados."
          className="mt-4"
          acoes={
            <Button variant="outline" size="sm" asChild>
              <a href="/oportunidades">Ver todas</a>
            </Button>
          }
        >
          <ul className="space-y-2">
            {oportunidades.slice(0, 5).map((o, indice) => (
              <li
                key={indice}
                className="flex items-start gap-3 rounded-md border border-border bg-surface p-3"
              >
                <AlertTriangle
                  className={
                    o.severidade === "Alta"
                      ? "mt-0.5 size-4 shrink-0 text-destructive"
                      : "mt-0.5 size-4 shrink-0 text-warning"
                  }
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{o.titulo}</p>
                  <p className="text-xs text-muted-foreground">{o.detalhe}</p>
                </div>
              </li>
            ))}
          </ul>
        </PainelSecao>
      ) : null}
    </Pagina>
  );
}
