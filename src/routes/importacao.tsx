import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";

import { Pagina } from "@/components/kpi/Pagina";
import { PainelSecao } from "@/components/kpi/KpiCard";
import { Button } from "@/components/ui/button";
import { parseCTeXml } from "@/lib/kpi/xmlParser";
import { numero } from "@/lib/kpi/format";
import { useKpi } from "@/lib/kpi/store";

export const Route = createFileRoute("/importacao")({
  head: () => ({
    meta: [
      { title: "Importação de XMLs | KPI Fretes de Compras" },
      { name: "description", content: "Importe XMLs de CT-e (2.00/3.00/4.00) em lote para atualizar o dashboard." },
      { property: "og:title", content: "Importação de XMLs | KPI Fretes de Compras" },
      { property: "og:description", content: "Importação em lote de CT-es de compras." },
    ],
  }),
  component: Importacao,
});

function Importacao() {
  const { importar, substituirBase, resumoImportacao } = useKpi();
  const input = useRef<HTMLInputElement>(null);
  const [processando, setProcessando] = useState(false);

  async function processar(arquivos: FileList | null, substituir: boolean) {
    if (!arquivos?.length) return;
    setProcessando(true);
    try {
      const resultados = [];
      for (const arquivo of Array.from(arquivos)) {
        const texto = await arquivo.text();
        resultados.push(parseCTeXml(texto, arquivo.name, true));
      }
      const resumo = substituir ? substituirBase(resultados) : importar(resultados);
      toast.success(`${numero(resumo.validos)} CT-es importados`, {
        description: `${numero(resumo.invalidos)} arquivos ignorados, ${numero(resumo.duplicados)} duplicados.`,
      });
    } finally {
      setProcessando(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <Pagina
      titulo="Importação de XMLs"
      descricao="Adicione novos CT-es de compras em lote. O processamento é local, no seu navegador."
      comFiltros={false}
    >
      <PainelSecao titulo="Enviar arquivos" descricao="Aceita XMLs de CT-e nas versões 2.00, 3.00 e 4.00.">
        <input
          ref={input}
          type="file"
          multiple
          accept=".xml,text/xml"
          className="hidden"
          onChange={(e) => void processar(e.target.files, false)}
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => input.current?.click()} disabled={processando}>
            <Upload className="size-4" /> {processando ? "Processando..." : "Selecionar XMLs"}
          </Button>
        </div>
        {resumoImportacao ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Última importação: {numero(resumoImportacao.validos)} válidos ·{" "}
            {numero(resumoImportacao.invalidos)} inválidos · {numero(resumoImportacao.duplicados)}{" "}
            duplicados.
          </p>
        ) : null}
      </PainelSecao>
    </Pagina>
  );
}
