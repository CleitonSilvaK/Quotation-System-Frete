import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/lib/supabase";
import { useAuth } from "./auth";
import { REGRAS_PADRAO, type EventoAuditoria, type StatusTabela, type TabelaFrete } from "./types";

const CHAVE = "tabelas-frete:tabelas";

function lerLocal(): TabelaFrete[] {
  if (typeof window === "undefined") return [];
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as TabelaFrete[]) : [];
  } catch {
    return [];
  }
}

function salvarLocal(tabelas: TabelaFrete[]) {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(tabelas));
  } catch {
    /* ignora */
  }
}

function evento(usuario: string, acao: string, detalhe: string): EventoAuditoria {
  return {
    id: `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    data: new Date().toISOString(),
    usuario,
    acao,
    detalhe,
  };
}

function comVigencia(tabela: TabelaFrete): TabelaFrete {
  if (tabela.status === "rascunho" || tabela.status === "aguardando" || tabela.status === "substituida") return tabela;
  const hoje = new Date().toISOString().slice(0, 10);
  const vencida = Boolean(tabela.vigenciaFim) && tabela.vigenciaFim < hoje;
  const status: StatusTabela = vencida ? "vencida" : "vigente";
  return status === tabela.status ? tabela : { ...tabela, status };
}

interface StoreContexto {
  tabelas: TabelaFrete[];
  pronto: boolean;
  obter: (id: string) => TabelaFrete | undefined;
  salvarNova: (tabela: Omit<TabelaFrete, "id" | "versao" | "criadoEm" | "criadoPor" | "atualizadoEm" | "auditoria" | "aprovadoPor" | "aprovadoEm">) => TabelaFrete;
  atualizar: (id: string, dados: Partial<TabelaFrete>, descricao: string) => void;
  aprovar: (id: string) => void;
  reprovar: (id: string, motivo: string) => void;
  remover: (id: string) => void;
  novaVersao: (id: string) => TabelaFrete | undefined;
  conflitosDe: (tabela: TabelaFrete) => TabelaFrete[];
}

const Contexto = createContext<StoreContexto | null>(null);

export function TabelasProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const [tabelas, setTabelas] = useState<TabelaFrete[]>([]);
  const [pronto, setPronto] = useState(false);

  // Carregar do Supabase e sincronizar com localStorage
  useEffect(() => {
    async function carregarSupabase() {
      try {
        const { data, error } = await supabase
          .from("tabelas_frete")
          .select("*")
          .order("criado_em", { ascending: false });

        if (!error && data && data.length > 0) {
          const convertidas: TabelaFrete[] = data.map((item: any) => ({
            id: item.id ?? `t-${Math.random().toString(36).slice(2, 9)}`,
            transportadora: item.transportadora ?? "",
            cnpj: item.cnpj || "",
            nome: item.nome ?? "Tabela sem nome",
            modal: item.modal === "aereo" || item.modal === "fracionado" || item.modal === "lotacao" ? item.modal : "rodoviario",
            abrangencia: item.abrangencia ?? "",
            vigenciaInicio: item.vigencia_inicio || "",
            vigenciaFim: item.vigencia_fim || "",
            status: (item.status as StatusTabela) ?? "rascunho",
            versao: Number(item.versao) || 1,
            origemArquivo: item.origem_arquivo || "",
            criadoEm: item.criado_em ?? new Date().toISOString(),
            criadoPor: item.criado_por || "Desconhecido",
            atualizadoEm: item.atualizado_em ?? new Date().toISOString(),
            aprovadoPor: item.aprovado_por ?? null,
            aprovadoEm: item.aprovado_em ?? null,
            substituiId: item.substitui_id || null,
            regras: { ...REGRAS_PADRAO, ...(item.regras && typeof item.regras === "object" ? item.regras : {}) },
            linhas: Array.isArray(item.linhas) ? item.linhas.filter((linha: unknown) => linha && typeof linha === "object") : [],
            auditoria: Array.isArray(item.auditoria) ? item.auditoria : [],
          }));
          const ajustadas = convertidas.map(comVigencia);
          setTabelas(ajustadas);
          salvarLocal(ajustadas);
        } else {
          setTabelas(lerLocal().map(comVigencia));
        }
      } catch {
        setTabelas(lerLocal().map(comVigencia));
      } finally {
        setPronto(true);
      }
    }

    carregarSupabase();
  }, []);

  const persistir = useCallback(async (proximas: TabelaFrete[], tabelaRemovidaId?: string) => {
    setTabelas(proximas);
    salvarLocal(proximas);

    // Sync com Supabase no banco de dados
    if (tabelaRemovidaId) {
      try {
        await supabase.from("tabelas_frete").delete().eq("id", tabelaRemovidaId);
      } catch (err) {
        console.error("Erro ao deletar tabela no Supabase:", err);
      }
    } else {
      // Upsert das tabelas modificadas
      for (const t of proximas) {
        try {
          await supabase.from("tabelas_frete").upsert({
            id: t.id,
            nome: t.nome,
            transportadora: t.transportadora,
            abrangencia: t.abrangencia,
            versao: t.versao,
            status: t.status,
            vigencia_inicio: t.vigenciaInicio || null,
            vigencia_fim: t.vigenciaFim || null,
            origem_arquivo: t.origemArquivo || null,
            linhas: t.linhas,
            auditoria: t.auditoria,
            criado_por: t.criadoPor,
            criado_em: t.criadoEm,
            atualizado_em: t.atualizadoEm,
            aprovado_por: t.aprovadoPor,
            aprovado_em: t.aprovadoEm,
          });
        } catch (err) {
          console.error("Erro ao sincronizar tabela com Supabase:", err);
        }
      }
    }
  }, []);

  const nomeUsuario = usuario?.nome ?? "Desconhecido";

  const conflitosDe = useCallback(
    (tabela: TabelaFrete) =>
      tabelas.filter(
        (t) =>
          t.id !== tabela.id &&
          t.status === "vigente" &&
          t.transportadora.toLowerCase() === tabela.transportadora.toLowerCase() &&
          t.abrangencia.toLowerCase() === tabela.abrangencia.toLowerCase() &&
          t.vigenciaInicio <= tabela.vigenciaFim &&
          tabela.vigenciaInicio <= t.vigenciaFim,
      ),
    [tabelas],
  );

  const salvarNova = useCallback<StoreContexto["salvarNova"]>(
    (dados) => {
      const agora = new Date().toISOString();
      const anteriores = tabelas.filter(
        (t) => t.transportadora.toLowerCase() === dados.transportadora.toLowerCase() && t.abrangencia.toLowerCase() === dados.abrangencia.toLowerCase(),
      );
      const versao = anteriores.reduce((max, t) => Math.max(max, t.versao), 0) + 1;
      const nova: TabelaFrete = {
        ...dados,
        id: `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        versao,
        criadoEm: agora,
        criadoPor: nomeUsuario,
        atualizadoEm: agora,
        aprovadoPor: null,
        aprovadoEm: null,
        auditoria: [
          evento(nomeUsuario, "Importação", `${dados.linhas.length} rotas importadas de ${dados.origemArquivo || "entrada manual"} (versão ${versao}).`),
        ],
      };
      persistir([nova, ...tabelas]);
      return nova;
    },
    [nomeUsuario, persistir, tabelas],
  );

  const atualizar = useCallback<StoreContexto["atualizar"]>(
    (id, dados, descricao) => {
      persistir(
        tabelas.map((t) =>
          t.id === id
            ? comVigencia({
                ...t,
                ...dados,
                atualizadoEm: new Date().toISOString(),
                auditoria: [evento(nomeUsuario, "Edição", descricao), ...t.auditoria],
              })
            : t,
        ),
      );
    },
    [nomeUsuario, persistir, tabelas],
  );

  const aprovar = useCallback(
    (id: string) => {
      const alvo = tabelas.find((t) => t.id === id);
      if (!alvo) return;
      const substituidas = new Set(
        conflitosDe(alvo).map((t) => t.id),
      );
      const agora = new Date().toISOString();
      persistir(
        tabelas.map((t) => {
          if (t.id === id) {
            return comVigencia({
              ...t,
              status: "vigente",
              aprovadoPor: nomeUsuario,
              aprovadoEm: agora,
              atualizadoEm: agora,
              auditoria: [evento(nomeUsuario, "Aprovação", `Tabela aprovada e colocada em vigência (versão ${t.versao}).`), ...t.auditoria],
            });
          }
          if (substituidas.has(t.id)) {
            return {
              ...t,
              status: "substituida" as StatusTabela,
              atualizadoEm: agora,
              auditoria: [evento(nomeUsuario, "Substituição", `Substituída pela versão ${alvo.versao} de ${alvo.nome}.`), ...t.auditoria],
            };
          }
          return t;
        }),
      );
    },
    [conflitosDe, nomeUsuario, persistir, tabelas],
  );

  const reprovar = useCallback(
    (id: string, motivo: string) => {
      persistir(
        tabelas.map((t) =>
          t.id === id
            ? {
                ...t,
                status: "rascunho" as StatusTabela,
                atualizadoEm: new Date().toISOString(),
                auditoria: [evento(nomeUsuario, "Reprovação", motivo || "Sem motivo informado."), ...t.auditoria],
              }
            : t,
        ),
      );
    },
    [nomeUsuario, persistir, tabelas],
  );

  const remover = useCallback(
    (id: string) => persistir(tabelas.filter((t) => t.id !== id), id),
    [persistir, tabelas],
  );

  const novaVersao = useCallback(
    (id: string) => {
      const alvo = tabelas.find((t) => t.id === id);
      if (!alvo) return undefined;
      const agora = new Date().toISOString();
      const copia: TabelaFrete = {
        ...alvo,
        id: `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        versao: alvo.versao + 1,
        status: "rascunho",
        substituiId: alvo.id,
        criadoEm: agora,
        atualizadoEm: agora,
        criadoPor: nomeUsuario,
        aprovadoPor: null,
        aprovadoEm: null,
        auditoria: [evento(nomeUsuario, "Nova versão", `Criada a partir da versão ${alvo.versao}.`)],
      };
      persistir([copia, ...tabelas]);
      return copia;
    },
    [nomeUsuario, persistir, tabelas],
  );

  const valor = useMemo<StoreContexto>(
    () => ({
      tabelas,
      pronto,
      obter: (id) => tabelas.find((t) => t.id === id),
      salvarNova,
      atualizar,
      aprovar,
      reprovar,
      remover,
      novaVersao,
      conflitosDe,
    }),
    [aprovar, atualizar, conflitosDe, novaVersao, pronto, remover, reprovar, salvarNova, tabelas],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useTabelas(): StoreContexto {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useTabelas deve ser usado dentro de TabelasProvider");
  return ctx;
}
