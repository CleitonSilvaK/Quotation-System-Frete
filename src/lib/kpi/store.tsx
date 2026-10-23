import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useEffect } from "react";

import { aplicarFiltros, consolidar, opcoesDeFiltro, type OpcoesFiltro } from "./dataProcessor";
import { FILTROS_PADRAO, type CTeRecord, type Filtros, type ImportSummary, type ParseResult } from "./types";

interface Dataset {
  resumo: ImportSummary;
  registros: CTeRecord[];
}

interface KpiContexto {
  carregando: boolean;
  erro: string | null;
  /** Base completa (inclui cancelados). */
  base: CTeRecord[];
  /** Base após os filtros globais. */
  registros: CTeRecord[];
  filtros: Filtros;
  setFiltros: (f: Partial<Filtros>) => void;
  limparFiltros: () => void;
  opcoes: OpcoesFiltro;
  resumoImportacao: ImportSummary | null;
  origemDados: "Base importada" | "Sem dados";
  importar: (resultados: ParseResult[]) => ImportSummary;
  substituirBase: (resultados: ParseResult[]) => ImportSummary;
}

const Contexto = createContext<KpiContexto | null>(null);
const CHAVE_IMPORTADOS = "kpi-fretes:ctes-importados";

function lerImportados(): CTeRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const bruto = window.localStorage.getItem(CHAVE_IMPORTADOS);
    return bruto ? (JSON.parse(bruto) as CTeRecord[]) : [];
  } catch {
    return [];
  }
}

async function carregarDataset(): Promise<Dataset> {
  const resposta = await fetch("/data/ctes.json");
  if (!resposta.ok) throw new Error("Não foi possível carregar a base de CT-es");
  return (await resposta.json()) as Dataset;
}

export function KpiProvider({ children }: { children: ReactNode }) {
  const consulta = useQuery({
    queryKey: ["dataset-ctes"],
    queryFn: carregarDataset,
    staleTime: Infinity,
    enabled: typeof window !== "undefined",
  });

  const [importados, setImportados] = useState<CTeRecord[]>(lerImportados);
  const [substituida, setSubstituida] = useState(false);
  const [resumoImportacao, setResumoImportacao] = useState<ImportSummary | null>(null);
  const [filtros, setFiltrosState] = useState<Filtros>(FILTROS_PADRAO);

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAVE_IMPORTADOS, JSON.stringify(importados));
    } catch (erro) {
      console.warn("Não foi possível persistir os CT-es importados neste navegador.", erro);
    }
  }, [importados]);

  const base = useMemo(() => {
    const seed = substituida ? [] : (consulta.data?.registros ?? []);
    if (!importados.length) return seed;
    return consolidar(
      importados.map((r) => ({ record: r, erro: null, arquivo: r.arquivo ?? "" })),
      seed,
    ).registros;
  }, [consulta.data, importados, substituida]);

  const registros = useMemo(() => aplicarFiltros(base, filtros), [base, filtros]);
  const opcoes = useMemo(() => opcoesDeFiltro(base), [base]);

  const setFiltros = useCallback((parcial: Partial<Filtros>) => {
    setFiltrosState((anterior) => ({ ...anterior, ...parcial }));
  }, []);

  const importar = useCallback(
    (resultados: ParseResult[]) => {
      const { registros: novos, resumo } = consolidar(
        resultados,
        importados.length ? importados : [],
      );
      setImportados(novos);
      setResumoImportacao(resumo);
      return resumo;
    },
    [importados],
  );

  const substituirBase = useCallback((resultados: ParseResult[]) => {
    const { registros: novos, resumo } = consolidar(resultados, []);
    setSubstituida(true);
    setImportados(novos);
    setResumoImportacao(resumo);
    return resumo;
  }, []);

  const valor: KpiContexto = {
    carregando: consulta.isLoading && !base.length,
    erro: consulta.error ? (consulta.error as Error).message : null,
    base,
    registros,
    filtros,
    setFiltros,
    limparFiltros: () => setFiltrosState(FILTROS_PADRAO),
    opcoes,
    resumoImportacao: resumoImportacao ?? consulta.data?.resumo ?? null,
    origemDados: base.length ? "Base importada" : "Sem dados",
    importar,
    substituirBase,
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useKpi(): KpiContexto {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useKpi deve ser usado dentro de KpiProvider");
  return contexto;
}
