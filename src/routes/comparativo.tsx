import { createFileRoute } from "@tanstack/react-router";
import { useDeferredValue, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowUp, CalendarRange, FileText, Route as RouteIcon, Scale, Truck } from "lucide-react";

import { KpiCard, PainelSecao } from "@/components/kpi/KpiCard";
import { Pagina } from "@/components/kpi/Pagina";
import { Tabela } from "@/components/kpi/Tabela";
import { Input } from "@/components/ui/input";
import { moeda, numero, percentual, peso as formatarPeso, porKg } from "@/lib/kpi/format";
import type { CTeRecord } from "@/lib/kpi/types";
import { useKpi } from "@/lib/kpi/store";

export const Route = createFileRoute("/comparativo")({
  head: () => ({
    meta: [
      { title: "Comparativo de Períodos | KPI Fretes de Compras" },
      {
        name: "description",
        content: "Compare custo, volume e eficiência do frete entre dois períodos.",
      },
    ],
  }),
  component: Comparativo,
});

type Periodo = { inicio: string; fim: string };

const PERIODO_A_PADRAO: Periodo = { inicio: "2025-01-01", fim: "2025-12-31" };
const PERIODO_B_PADRAO: Periodo = { inicio: "2026-01-01", fim: "2026-12-31" };

function dentroDoPeriodo(registro: CTeRecord, periodo: Periodo) {
  const data = registro.dataEmissao.slice(0, 10);
  return data >= periodo.inicio && data <= periodo.fim;
}

function resumo(registros: CTeRecord[]) {
  const custo = registros.reduce((total, registro) => total + (registro.valorPrestacao ?? 0), 0);
  const peso = registros.reduce((total, registro) => total + (registro.peso ?? 0), 0);
  const transportadoras = new Set(registros.map((registro) => registro.nomeTransportadora)).size;
  const rotas = new Set(registros.map((registro) => registro.rotaCidade)).size;
  return {
    ctes: registros.length,
    custo,
    peso,
    medio: registros.length ? custo / registros.length : null,
    porKg: peso > 0 ? custo / peso : null,
    transportadoras,
    rotas,
  };
}

function variacao(atual: number | null, anterior: number | null) {
  if (atual === null || anterior === null || anterior === 0) return null;
  return ((atual - anterior) / Math.abs(anterior)) * 100;
}

function Variacao({ valor, invertida = false }: { valor: number | null; invertida?: boolean }) {
  if (valor === null) return <span className="text-muted-foreground">sem comparação</span>;
  const positiva = invertida ? valor < 0 : valor > 0;
  const Icone = valor >= 0 ? ArrowUp : ArrowDown;
  return (
    <span className={positiva ? "text-positive" : "text-destructive"}>
      <Icone className="mr-1 inline size-3" />
      {percentual(Math.abs(valor), 1)}
    </span>
  );
}

type LinhaComparativa = {
  chave: string;
  custoA: number;
  custoB: number;
  ctesA: number;
  ctesB: number;
};

function TabelaComparativa({
  dados,
  nome,
  limite,
}: {
  dados: LinhaComparativa[];
  nome: string;
  limite?: number;
}) {
  return (
    <Tabela
      dados={dados}
      {...(limite === undefined ? {} : { limite })}
      maxAltura="max-h-[360px]"
      colunas={[
        { chave: "chave", titulo: nome, render: (linha) => linha.chave, ordenar: (linha) => linha.chave },
        { chave: "ctesA", titulo: "CT-es A", alinhar: "right", render: (linha) => numero(linha.ctesA), ordenar: (linha) => linha.ctesA },
        { chave: "ctesB", titulo: "CT-es B", alinhar: "right", render: (linha) => numero(linha.ctesB), ordenar: (linha) => linha.ctesB },
        { chave: "custoA", titulo: "Custo A", alinhar: "right", render: (linha) => moeda(linha.custoA, 0), ordenar: (linha) => linha.custoA },
        { chave: "custoB", titulo: "Custo B", alinhar: "right", render: (linha) => moeda(linha.custoB, 0), ordenar: (linha) => linha.custoB },
        {
          chave: "variacao",
          titulo: "Variação",
          alinhar: "right",
          render: (linha) => <Variacao valor={variacao(linha.custoB, linha.custoA)} invertida />,
          ordenar: (linha) => variacao(linha.custoB, linha.custoA),
        },
      ]}
    />
  );
}

function Comparativo() {
  const { registros } = useKpi();
  const [periodoA, setPeriodoA] = useState(PERIODO_A_PADRAO);
  const [periodoB, setPeriodoB] = useState(PERIODO_B_PADRAO);
  const periodoADeferred = useDeferredValue(periodoA);
  const periodoBDeferred = useDeferredValue(periodoB);

  const dados = useMemo(() => {
    const registrosA: CTeRecord[] = [];
    const registrosB: CTeRecord[] = [];
    for (const registro of registros) {
      if (dentroDoPeriodo(registro, periodoADeferred)) registrosA.push(registro);
      if (dentroDoPeriodo(registro, periodoBDeferred)) registrosB.push(registro);
    }
    return { registrosA, registrosB, resumoA: resumo(registrosA), resumoB: resumo(registrosB) };
  }, [periodoADeferred, periodoBDeferred, registros]);

  const agrupamentos = useMemo(() => {
    const parear = (chaveDe: (registro: CTeRecord) => string) => {
      const mapaA = new Map<string, CTeRecord[]>();
      const mapaB = new Map<string, CTeRecord[]>();
      for (const registro of dados.registrosA) {
        const chave = chaveDe(registro);
        const grupo = mapaA.get(chave);
        if (grupo) grupo.push(registro);
        else mapaA.set(chave, [registro]);
      }
      for (const registro of dados.registrosB) {
        const chave = chaveDe(registro);
        const grupo = mapaB.get(chave);
        if (grupo) grupo.push(registro);
        else mapaB.set(chave, [registro]);
      }
      return [...new Set([...mapaA.keys(), ...mapaB.keys()])]
        .map((chave) => {
          const a = resumo(mapaA.get(chave) ?? []);
          const b = resumo(mapaB.get(chave) ?? []);
          return { chave, custoA: a.custo, custoB: b.custo, ctesA: a.ctes, ctesB: b.ctes };
        })
        .sort((a, b) => b.custoB + b.custoA - (a.custoB + a.custoA));
    };
    return {
      unidades: parear((registro) => registro.unidadeDestino),
      transportadoras: parear((registro) => registro.nomeTransportadora),
      rotas: parear((registro) => registro.rotaCidade),
    };
  }, [dados.registrosA, dados.registrosB]);

  const grafico = [
    { indicador: "Custo total", periodoA: dados.resumoA.custo, periodoB: dados.resumoB.custo },
    { indicador: "Custo médio", periodoA: dados.resumoA.medio ?? 0, periodoB: dados.resumoB.medio ?? 0 },
    { indicador: "Peso (kg)", periodoA: dados.resumoA.peso, periodoB: dados.resumoB.peso },
  ];

  const atualizarPeriodo = (
    setter: (periodo: Periodo) => void,
    periodo: Periodo,
    campo: keyof Periodo,
    valor: string,
  ) => setter({ ...periodo, [campo]: valor });

  return (
    <Pagina
      titulo="Comparativo de períodos"
      descricao="Compare os principais indicadores de frete entre dois intervalos de tempo."
    >
      <PainelSecao
        titulo="Períodos de análise"
        descricao="A comparação considera os filtros globais aplicados na página."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { titulo: "Período A", periodo: periodoA, setPeriodo: setPeriodoA },
            { titulo: "Período B", periodo: periodoB, setPeriodo: setPeriodoB },
          ].map(({ titulo, periodo, setPeriodo }) => (
            <div key={titulo} className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <CalendarRange className="size-4 text-primary" />
                {titulo}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-xs text-muted-foreground">
                  Início
                  <Input
                    type="date"
                    value={periodo.inicio}
                    onChange={(event) => atualizarPeriodo(setPeriodo, periodo, "inicio", event.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-xs text-muted-foreground">
                  Fim
                  <Input
                    type="date"
                    value={periodo.fim}
                    onChange={(event) => atualizarPeriodo(setPeriodo, periodo, "fim", event.target.value)}
                  />
                </label>
              </div>
              {periodo.inicio > periodo.fim ? (
                <p className="mt-2 text-xs text-destructive">A data inicial deve ser anterior à data final.</p>
              ) : null}
            </div>
          ))}
        </div>
      </PainelSecao>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          titulo="Custo total"
          valor={`${moeda(dados.resumoA.custo, 0)} × ${moeda(dados.resumoB.custo, 0)}`}
          descricao={<Variacao valor={variacao(dados.resumoB.custo, dados.resumoA.custo)} invertida />}
          destaque="primario"
          icone={<Scale className="size-4" />}
        />
        <KpiCard
          titulo="Quantidade de CT-es"
          valor={`${numero(dados.resumoA.ctes)} × ${numero(dados.resumoB.ctes)}`}
          descricao={<Variacao valor={variacao(dados.resumoB.ctes, dados.resumoA.ctes)} />}
          icone={<FileText className="size-4" />}
        />
        <KpiCard
          titulo="Custo médio por CT-e"
          valor={`${moeda(dados.resumoA.medio)} × ${moeda(dados.resumoB.medio)}`}
          descricao={<Variacao valor={variacao(dados.resumoB.medio, dados.resumoA.medio)} invertida />}
          icone={<Truck className="size-4" />}
        />
        <KpiCard
          titulo="Custo por kg"
          valor={`${porKg(dados.resumoA.porKg)} × ${porKg(dados.resumoB.porKg)}`}
          descricao={<Variacao valor={variacao(dados.resumoB.porKg, dados.resumoA.porKg)} invertida />}
          destaque="positivo"
          icone={<Scale className="size-4" />}
        />
        <KpiCard
          titulo="Transportadoras"
          valor={`${numero(dados.resumoA.transportadoras)} × ${numero(dados.resumoB.transportadoras)}`}
          descricao={<Variacao valor={variacao(dados.resumoB.transportadoras, dados.resumoA.transportadoras)} />}
          icone={<Truck className="size-4" />}
        />
        <KpiCard
          titulo="Rotas utilizadas"
          valor={`${numero(dados.resumoA.rotas)} × ${numero(dados.resumoB.rotas)}`}
          descricao={<Variacao valor={variacao(dados.resumoB.rotas, dados.resumoA.rotas)} />}
          icone={<RouteIcon className="size-4" />}
        />
      </div>

      <PainelSecao titulo="Indicadores lado a lado" descricao="Valores absolutos dos dois períodos selecionados.">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={grafico} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="indicador" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(valor: number) => numero(valor, 2)} />
              <Bar dataKey="periodoA" name="Período A" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="periodoB" name="Período B" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </PainelSecao>

      <PainelSecao titulo="Comparativo por unidade" descricao="Distribuição do custo e volume entre as unidades de destino.">
        <TabelaComparativa dados={agrupamentos.unidades} nome="unidade" />
        <p className="mt-3 text-xs text-muted-foreground">
          Peso transportado: {formatarPeso(dados.resumoA.peso)} no período A e {formatarPeso(dados.resumoB.peso)} no período B.
        </p>
      </PainelSecao>

      <div className="grid gap-4 xl:grid-cols-2">
        <PainelSecao titulo="Comparativo por transportadora" descricao="Transportadoras com maior custo somado nos dois períodos.">
          <TabelaComparativa dados={agrupamentos.transportadoras} nome="transportadora" limite={10} />
        </PainelSecao>
        <PainelSecao titulo="Comparativo por rota" descricao="Rotas com maior custo somado nos dois períodos.">
          <TabelaComparativa dados={agrupamentos.rotas} nome="rota" limite={10} />
        </PainelSecao>
      </div>
    </Pagina>
  );
}
