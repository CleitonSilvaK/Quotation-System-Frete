import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Upload } from "lucide-react";

import { PaginaTabelas } from "@/components/tabelas/PaginaTabelas";
import { PainelSecao } from "@/components/kpi/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { numero } from "@/lib/kpi/format";
import { CAMPOS, montarLinha, sugerirMapeamento, type CampoLinha } from "@/lib/tabelas/campos";
import { lerArquivo, type ArquivoLido } from "@/lib/tabelas/leitor";
import { resumoProblemas, validarLinhas } from "@/lib/tabelas/validacao";
import { useTabelas } from "@/lib/tabelas/store";
import { REGRAS_PADRAO, type ModeloCobranca, type RegrasCalculo } from "@/lib/tabelas/types";

export const Route = createFileRoute("/tabelas/importar")({
  head: () => ({
    meta: [
      { title: "Importar tabela de frete | Cotação de Fretes" },
      {
        name: "description",
        content: "Assistente de importação de tabelas comerciais de frete em XLSX, CSV ou PDF com validação automática.",
      },
      { property: "og:title", content: "Importar tabela de frete" },
      { property: "og:description", content: "Mapeie colunas, valide rotas e publique a tabela da transportadora." },
    ],
  }),
  component: ImportarTabela,
});

const MODELOS: { valor: ModeloCobranca; rotulo: string }[] = [
  { valor: "faixa_peso", rotulo: "Faixa de peso" },
  { valor: "por_kg", rotulo: "Valor por kg" },
  { valor: "fixo_rota", rotulo: "Valor fixo por rota" },
  { valor: "por_volume", rotulo: "Valor por volume" },
  { valor: "por_m3", rotulo: "Valor por m³" },
  { valor: "percentual_nf", rotulo: "% sobre a nota fiscal" },
];

const NENHUM = "__nenhum__";

function ImportarTabela() {
  const navigate = useNavigate();
  const { salvarNova } = useTabelas();
  const input = useRef<HTMLInputElement>(null);

  const [etapa, setEtapa] = useState(1);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [lido, setLido] = useState<ArquivoLido | null>(null);
  const [mapeamento, setMapeamento] = useState<Record<string, CampoLinha | "">>({});
  const [carregando, setCarregando] = useState(false);

  const [meta, setMeta] = useState({
    transportadora: "",
    cnpj: "",
    nome: "",
    modal: "fracionado" as "rodoviario" | "aereo" | "fracionado" | "lotacao",
    abrangencia: "",
    vigenciaInicio: new Date().toISOString().slice(0, 10),
    vigenciaFim: "",
    observacao: "",
  });
  const [regras, setRegras] = useState<RegrasCalculo>(REGRAS_PADRAO);

  const linhas = useMemo(() => {
    if (!lido) return [];
    return lido.linhas.map((bruta, i) => montarLinha(bruta, mapeamento, i));
  }, [lido, mapeamento]);

  const problemas = useMemo(() => validarLinhas(linhas, regras.modelo), [linhas, regras.modelo]);
  const resumo = resumoProblemas(problemas);
  const problemasPorLinha = useMemo(() => {
    const mapa = new Map<number, string[]>();
    for (const p of problemas) {
      const lista = mapa.get(p.linha) ?? [];
      lista.push(`${p.severidade === "erro" ? "Erro" : "Alerta"}: ${p.mensagem}`);
      mapa.set(p.linha, lista);
    }
    return mapa;
  }, [problemas]);

  async function selecionar(arquivos: FileList | null) {
    const alvo = arquivos?.[0];
    if (!alvo) return;
    setCarregando(true);
    try {
      const resultado = await lerArquivo(alvo);
      if (!resultado.linhas.length) {
        toast.error("Não foi possível identificar linhas de dados no arquivo.");
        return;
      }
      setArquivo(alvo);
      setLido(resultado);
      setMapeamento(sugerirMapeamento(resultado.cabecalhos));
      setMeta((m) => ({ ...m, nome: m.nome || alvo.name.replace(/\.[^.]+$/, "") }));
      if (resultado.aviso) toast.warning(resultado.aviso);
      toast.success(`${numero(resultado.linhas.length)} linhas lidas de ${alvo.name}`);
      setEtapa(2);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao ler o arquivo.");
    } finally {
      setCarregando(false);
      if (input.current) input.current.value = "";
    }
  }

  function salvar(status: "rascunho" | "aguardando") {
    if (!meta.transportadora.trim() || !meta.nome.trim()) {
      toast.error("Informe a transportadora e o nome da tabela.");
      return;
    }
    if (!meta.vigenciaFim) {
      toast.error("Informe a data de fim da vigência.");
      return;
    }
    const validas = linhas.filter((_, i) => !problemasPorLinha.get(i + 1)?.some((m) => m.startsWith("Erro")));
    if (!validas.length) {
      toast.error("Nenhuma linha válida para salvar.");
      return;
    }
    const nova = salvarNova({
      transportadora: meta.transportadora.trim(),
      cnpj: meta.cnpj.trim(),
      nome: meta.nome.trim(),
      modal: meta.modal,
      abrangencia: meta.abrangencia.trim(),
      vigenciaInicio: meta.vigenciaInicio,
      vigenciaFim: meta.vigenciaFim,
      status,
      origemArquivo: arquivo?.name ?? "",
      substituiId: null,
      regras,
      linhas: validas,
    });
    toast.success(`Tabela salva com ${numero(validas.length)} rotas.`);
    void navigate({ to: "/tabelas/$id", params: { id: nova.id } });
  }

  return (
    <PaginaTabelas
      titulo="Importar tabela de frete"
      descricao="XLSX, CSV ou PDF da transportadora — mapeie as colunas, valide e publique."
    >
      <div className="space-y-4">
        <ol className="flex flex-wrap gap-2 text-xs">
          {["Arquivo", "Mapeamento", "Validação", "Cadastro"].map((rotulo, i) => (
            <li
              key={rotulo}
              className={`rounded-md border px-3 py-1.5 ${
                etapa === i + 1
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {i + 1}. {rotulo}
            </li>
          ))}
        </ol>

        {etapa === 1 ? (
          <PainelSecao titulo="1. Selecione o arquivo" descricao="Formatos aceitos: XLSX, XLS, CSV e PDF (texto).">
            <input
              ref={input}
              type="file"
              accept=".xlsx,.xls,.xlsm,.csv,.txt,.pdf"
              className="hidden"
              onChange={(e) => void selecionar(e.target.files)}
            />
            <Button onClick={() => input.current?.click()} disabled={carregando}>
              <Upload className="size-4" /> {carregando ? "Lendo arquivo..." : "Selecionar arquivo"}
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              O processamento é local, no seu navegador. Nada é enviado para servidores.
            </p>
          </PainelSecao>
        ) : null}

        {etapa === 2 && lido ? (
          <PainelSecao
            titulo="2. Mapeamento de colunas"
            descricao={`${numero(lido.linhas.length)} linhas · ${lido.cabecalhos.length} colunas detectadas em ${arquivo?.name}`}
            acoes={
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEtapa(1)}>
                  <ArrowLeft className="size-4" /> Voltar
                </Button>
                <Button size="sm" onClick={() => setEtapa(3)}>
                  Validar <ArrowRight className="size-4" />
                </Button>
              </div>
            }
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {lido.cabecalhos.map((cabecalho) => (
                <div key={cabecalho} className="space-y-1.5">
                  <Label className="text-xs">
                    {cabecalho}
                    <span className="ml-1 text-muted-foreground">
                      (ex.: {String(lido.linhas[0]?.[cabecalho] ?? "—").slice(0, 18)})
                    </span>
                  </Label>
                  <Select
                    value={mapeamento[cabecalho] || NENHUM}
                    onValueChange={(v) =>
                      setMapeamento((m) => ({ ...m, [cabecalho]: v === NENHUM ? "" : (v as CampoLinha) }))
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Ignorar coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NENHUM}>Ignorar coluna</SelectItem>
                      {CAMPOS.map((c) => (
                        <SelectItem key={c.campo} value={c.campo}>
                          {c.rotulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </PainelSecao>
        ) : null}

        {etapa === 3 && lido ? (
          <PainelSecao
            titulo="3. Validação"
            descricao="Linhas com erro não serão salvas. Alertas são apenas informativos."
            acoes={
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEtapa(2)}>
                  <ArrowLeft className="size-4" /> Mapeamento
                </Button>
                <Button size="sm" onClick={() => setEtapa(4)}>
                  Cadastro <ArrowRight className="size-4" />
                </Button>
              </div>
            }
          >
            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">{numero(linhas.length)} linhas</Badge>
              <Badge className="border-0 bg-destructive/15 text-destructive">{numero(resumo.erros)} erros</Badge>
              <Badge className="border-0 bg-warning/15 text-warning">{numero(resumo.alertas)} alertas</Badge>
              <Badge className="border-0 bg-positive/15 text-positive">
                {numero(linhas.length - resumo.linhasComErro)} linhas válidas
              </Badge>
              <Select value={regras.modelo} onValueChange={(v) => setRegras((r) => ({ ...r, modelo: v as ModeloCobranca }))}>
                <SelectTrigger className="h-7 w-56 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELOS.map((m) => (
                    <SelectItem key={m.valor} value={m.valor}>
                      Modelo: {m.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="max-h-[420px] overflow-auto rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted">
                  <tr className="text-left uppercase tracking-wider text-muted-foreground">
                    <th className="px-2 py-1.5">#</th>
                    <th className="px-2 py-1.5">Origem</th>
                    <th className="px-2 py-1.5">Destino</th>
                    <th className="px-2 py-1.5">CEP</th>
                    <th className="px-2 py-1.5">Faixa peso</th>
                    <th className="px-2 py-1.5 text-right">R$/kg</th>
                    <th className="px-2 py-1.5 text-right">Fixo</th>
                    <th className="px-2 py-1.5 text-right">Mínimo</th>
                    <th className="px-2 py-1.5">Ocorrências</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.slice(0, 300).map((l, i) => {
                    const ocorrencias = problemasPorLinha.get(i + 1) ?? [];
                    const temErro = ocorrencias.some((o) => o.startsWith("Erro"));
                    return (
                      <tr
                        key={l.id}
                        className={`border-t border-border/60 ${temErro ? "bg-destructive/5" : ocorrencias.length ? "bg-warning/5" : ""}`}
                      >
                        <td className="px-2 py-1 numeric text-muted-foreground">{i + 1}</td>
                        <td className="px-2 py-1">{[l.origemCidade, l.origemUf].filter(Boolean).join("/") || "—"}</td>
                        <td className="px-2 py-1">{[l.destinoCidade, l.destinoUf].filter(Boolean).join("/") || "—"}</td>
                        <td className="px-2 py-1 numeric">
                          {l.destinoCepInicio ? `${l.destinoCepInicio}–${l.destinoCepFim || "…"}` : "—"}
                        </td>
                        <td className="px-2 py-1 numeric">
                          {l.pesoDe !== null || l.pesoAte !== null ? `${l.pesoDe ?? 0}–${l.pesoAte ?? "∞"}` : "—"}
                        </td>
                        <td className="px-2 py-1 numeric text-right">{l.valorPorKg ?? "—"}</td>
                        <td className="px-2 py-1 numeric text-right">{l.valorFixo ?? "—"}</td>
                        <td className="px-2 py-1 numeric text-right">{l.fretePesoMinimo ?? "—"}</td>
                        <td className="px-2 py-1 text-[11px] text-muted-foreground">
                          {ocorrencias.length ? ocorrencias.join(" · ") : "OK"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {linhas.length > 300 ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Exibindo as 300 primeiras linhas de {numero(linhas.length)}.
              </p>
            ) : null}
          </PainelSecao>
        ) : null}

        {etapa === 4 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <PainelSecao titulo="4. Dados da tabela" descricao="Identificação e vigência.">
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo label="Transportadora" valor={meta.transportadora} onChange={(v) => setMeta({ ...meta, transportadora: v })} />
                <Campo label="CNPJ" valor={meta.cnpj} onChange={(v) => setMeta({ ...meta, cnpj: v })} />
                <Campo label="Nome da tabela" valor={meta.nome} onChange={(v) => setMeta({ ...meta, nome: v })} />
                <Campo label="Abrangência (ex.: RS/SC)" valor={meta.abrangencia} onChange={(v) => setMeta({ ...meta, abrangencia: v })} />
                <div className="space-y-1.5">
                  <Label className="text-xs">Modal</Label>
                  <Select value={meta.modal} onValueChange={(v) => setMeta({ ...meta, modal: v as typeof meta.modal })}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fracionado">Fracionado</SelectItem>
                      <SelectItem value="lotacao">Lotação</SelectItem>
                      <SelectItem value="rodoviario">Rodoviário</SelectItem>
                      <SelectItem value="aereo">Aéreo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Modelo de cobrança</Label>
                  <Select value={regras.modelo} onValueChange={(v) => setRegras({ ...regras, modelo: v as ModeloCobranca })}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODELOS.map((m) => (
                        <SelectItem key={m.valor} value={m.valor}>
                          {m.rotulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Campo label="Início da vigência" tipo="date" valor={meta.vigenciaInicio} onChange={(v) => setMeta({ ...meta, vigenciaInicio: v })} />
                <Campo label="Fim da vigência" tipo="date" valor={meta.vigenciaFim} onChange={(v) => setMeta({ ...meta, vigenciaFim: v })} />
              </div>
              <div className="mt-3 space-y-1.5">
                <Label className="text-xs">Observações</Label>
                <Textarea value={meta.observacao} onChange={(e) => setMeta({ ...meta, observacao: e.target.value })} rows={2} />
              </div>
            </PainelSecao>

            <PainelSecao titulo="Regras de cálculo" descricao="Taxas e generalidades aplicadas na simulação.">
              <div className="grid gap-3 sm:grid-cols-2">
                <CampoNum label="Frete mínimo (R$)" valor={regras.freteMinimo} onChange={(v) => setRegras({ ...regras, freteMinimo: v })} />
                <CampoNum label="GRIS (%)" valor={regras.gris} onChange={(v) => setRegras({ ...regras, gris: v })} />
                <CampoNum label="Ad valorem (%)" valor={regras.advalorem} onChange={(v) => setRegras({ ...regras, advalorem: v })} />
                <CampoNum label="Pedágio por fração (R$)" valor={regras.pedagioPorFracao} onChange={(v) => setRegras({ ...regras, pedagioPorFracao: v })} />
                <CampoNum label="Fração de pedágio (kg)" valor={regras.fracaoPedagioKg} onChange={(v) => setRegras({ ...regras, fracaoPedagioKg: v })} />
                <CampoNum label="Taxa de coleta (R$)" valor={regras.taxaColeta} onChange={(v) => setRegras({ ...regras, taxaColeta: v })} />
                <CampoNum label="Taxa de entrega (R$)" valor={regras.taxaEntrega} onChange={(v) => setRegras({ ...regras, taxaEntrega: v })} />
                <CampoNum label="Despacho (R$)" valor={regras.despacho} onChange={(v) => setRegras({ ...regras, despacho: v })} />
                <CampoNum label="Fator de cubagem (kg/m³)" valor={regras.fatorCubagem} onChange={(v) => setRegras({ ...regras, fatorCubagem: v })} />
                <CampoNum label="ICMS por dentro (%)" valor={regras.icms} onChange={(v) => setRegras({ ...regras, icms: v })} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setEtapa(3)}>
                  <ArrowLeft className="size-4" /> Validação
                </Button>
                <Button variant="secondary" onClick={() => salvar("rascunho")}>
                  Salvar rascunho
                </Button>
                <Button onClick={() => salvar("aguardando")}>
                  <Check className="size-4" /> Enviar para aprovação
                </Button>
              </div>
            </PainelSecao>
          </div>
        ) : null}
      </div>
    </PaginaTabelas>
  );
}

function Campo({
  label,
  valor,
  onChange,
  tipo = "text",
}: {
  label: string;
  valor: string;
  onChange: (v: string) => void;
  tipo?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type={tipo} value={valor} onChange={(e) => onChange(e.target.value)} className="h-9" />
    </div>
  );
}

function CampoNum({ label, valor, onChange }: { label: string; valor: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        step="0.01"
        value={Number.isFinite(valor) ? valor : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-9"
      />
    </div>
  );
}
