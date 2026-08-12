import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Usuario } from "./types";

interface AuthContexto {
  usuario: Usuario | null;
  pronto: boolean;
  entrar: (email: string, senha: string) => Promise<{ ok: boolean; erro?: string }>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<{ ok: boolean; erro?: string }>;
  sair: () => Promise<void>;
}

const Contexto = createContext<AuthContexto | null>(null);

function formatarUsuario(sbUser: SupabaseUser): Usuario {
  const meta = sbUser.user_metadata || {};
  return {
    id: sbUser.id,
    nome: meta.nome || meta.name || sbUser.email?.split("@")[0] || "Usuário",
    email: sbUser.email || "",
    senha: "",
    papel: (meta.papel as "admin" | "analista" | "consulta") || "analista",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUsuario(formatarUsuario(session.user));
      } else {
        setUsuario(null);
      }
      setPronto(true);
    });

    // 2. Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUsuario(formatarUsuario(session.user));
      } else {
        setUsuario(null);
      }
      setPronto(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const entrar = useCallback<AuthContexto["entrar"]>(async (email, senha) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        return { ok: false, erro: error.message || "E-mail ou senha inválidos." };
      }

      if (data.user) {
        setUsuario(formatarUsuario(data.user));
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, erro: err.message || "Erro inesperado ao realizar login." };
    }
  }, []);

  const cadastrar = useCallback<AuthContexto["cadastrar"]>(
    async (nome, email, senha) => {
      if (nome.trim().length < 3) return { ok: false, erro: "Informe o nome completo." };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, erro: "E-mail inválido." };
      if (senha.length < 6) return { ok: false, erro: "A senha precisa ter ao menos 6 caracteres." };

      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: {
            data: {
              nome: nome.trim(),
              name: nome.trim(),
              papel: "analista",
            },
          },
        });

        if (error) {
          return { ok: false, erro: error.message || "Não foi possível criar o cadastro." };
        }

        if (data.user) {
          setUsuario(formatarUsuario(data.user));
        }
        return { ok: true };
      } catch (err: any) {
        return { ok: false, erro: err.message || "Erro ao realizar cadastro." };
      }
    },
    [],
  );

  const sair = useCallback(async () => {
    await supabase.auth.signOut();
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, pronto, entrar, cadastrar, sair }),
    [usuario, pronto, entrar, cadastrar, sair],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth(): AuthContexto {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
