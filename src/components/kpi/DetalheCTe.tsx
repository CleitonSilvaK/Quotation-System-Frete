import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cnpj, data, moeda, numero, percentual, peso as fmtPeso, porKg } from "@/lib/kpi/format";
import type { CTeRecord } from "@/lib/kpi/types";

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{rotulo}</span>
      <span className="numeric max-w-[60%] break-words text-right text-xs font-medium">{valor}</span>
    </div>
  );
}

export function DetalheCTe({
  registro,
  aoFechar,
}: {
  registro: CTeRecord | null;
  aoFechar: () => void;
}) {
  return (
    <Dialog open={!!registro} onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="max-w-2xl">
        {registro ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2 text-base">
                CT-e {registro.numeroCTe} · série {registro.serie}
                <Badge variant={registro.cancelado ? "destructive" : "secondary"}>
                  {registro.statusCTe}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="dados">
              <TabsList>
                <TabsTrigger value="dados">Dados do CT-e</TabsTrigger>
                <TabsTrigger value="componentes">Componentes e NF-es</TabsTrigger>
                <TabsTrigger value="xml">XML original</TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="max-h-[60vh] overflow-auto pr-1">
                <Linha rotulo="Chave" valor={<span className="font-mono text-[10px]">{registro.chaveCTe}</span>} />
                <Linha rotulo="Data de emissão" valor={data(registro.dataEmissao)} />
                <Linha
                  rotulo="Transportadora"
                  valor={`${registro.nomeTransportadora} — ${cnpj(registro.cnpjTransportadora)}`}
                />
                <Linha
                  rotulo="Fornecedor (remetente)"
                  valor={`${registro.nomeFornecedor} — ${cnpj(registro.cnpjFornecedor)}`}
                />
                <Linha
                  rotulo="Origem"
                  valor={`${registro.cidadeOrigem ?? "N/D"} / ${registro.ufOrigem ?? "N/D"} (${registro.regiaoOrigem ?? "N/D"})`}
                />
                <Linha
                  rotulo="Destino"
                  valor={`${registro.cidadeDestino ?? "N/D"} / ${registro.ufDestino ?? "N/D"}`}
                />
                <Linha rotulo="Unidade" valor={registro.unidadeDestino} />
                <Linha rotulo="Destinatário" valor={registro.nomeDestinatario ?? "N/D"} />
                <Linha rotulo="Valor do frete" valor={moeda(registro.valorTotalCTe)} />
                <Linha rotulo="Peso" valor={fmtPeso(registro.peso)} />
                <Linha rotulo="Volumes" valor={numero(registro.quantidadeVolumes)} />
                <Linha rotulo="Valor das compras (NF-e)" valor={moeda(registro.valorMercadoria)} />
                <Linha rotulo="Frete / valor da compra" valor={percentual(registro.percentualFreteCompra)} />
                <Linha rotulo="Frete por R$ 1.000" valor={moeda(registro.fretePor1000Reais)} />
                <Linha rotulo="Custo por kg" valor={porKg(registro.custoPorKg)} />
                <Linha rotulo="Produto predominante" valor={registro.produtoPredominante ?? "N/D"} />
                <Linha rotulo="Natureza da operação" valor={registro.natOp ?? "N/D"} />
                <Linha rotulo="Arquivo" valor={registro.arquivo ?? "N/D"} />
              </TabsContent>

              <TabsContent value="componentes" className="max-h-[60vh] overflow-auto pr-1">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Componentes do frete
                </p>
                {registro.componentesFrete.length ? (
                  registro.componentesFrete.map((componente, indice) => (
                    <Linha key={indice} rotulo={componente.nome} valor={moeda(componente.valor)} />
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Não informados no XML.</p>
                )}
                <Linha rotulo="ICMS" valor={moeda(registro.valorICMS)} />
                <Linha rotulo="Pedágio" valor={moeda(registro.valorPedagio)} />

                <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  NF-es vinculadas ({registro.quantidadeNFe})
                </p>
                {registro.chavesNFe.length ? (
                  <ul className="space-y-1">
                    {registro.chavesNFe.map((chave) => (
                      <li key={chave} className="font-mono text-[10px] text-muted-foreground">
                        {chave}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">Nenhuma NF-e identificável no XML.</p>
                )}
              </TabsContent>

              <TabsContent value="xml">
                <pre className="max-h-[55vh] overflow-auto rounded-md border border-border bg-surface p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
                  {registro.xmlOriginal ??
                    "O XML original é mantido apenas para os arquivos importados nesta sessão. Reimporte o arquivo para visualizar o conteúdo bruto."}
                </pre>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
