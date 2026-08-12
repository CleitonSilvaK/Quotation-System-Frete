import type { LinhaTabela, ModeloCobranca } from "./types";

export type Severidade = "erro" | "alerta";

export interface Problema {
  linha: number;
  campo: string;
  severidade: Severidade;
  mensagem: string;
}

const UFS = new Set([
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
]);

function chaveRota(l: LinhaTabela): string {
  return [l.origemUf, l.origemCidade, l.destinoUf, l.destinoCidade, l.destinoCepInicio, l.destinoCepFim]
    .map((v) => v.toLowerCase())
    .join("|");
}

function temValor(l: LinhaTabela, modelo: ModeloCobranca): boolean {
  switch (modelo) {
    case "fixo_rota":
      return l.valorFixo !== null;
    case "por_kg":
    case "faixa_peso":
      return l.valorPorKg !== null || l.valorFixo !== null;
    case "por_volume":
      return l.valorPorVolume !== null;
    case "por_m3":
      return l.valorPorM3 !== null;
    case "percentual_nf":
      return l.percentualNf !== null;
  }
}

export function validarLinhas(linhas: LinhaTabela[], modelo: ModeloCobranca): Problema[] {
  const problemas: Problema[] = [];
  const vistas = new Map<string, number>();
  const faixasPorRota = new Map<string, { de: number; ate: number; linha: number }[]>();

  linhas.forEach((linha, i) => {
    const n = i + 1;

    if (!linha.destinoUf && !linha.destinoCidade && !linha.destinoCepInicio) {
      problemas.push({ linha: n, campo: "destino", severidade: "erro", mensagem: "Destino não identificado (UF, cidade ou CEP)." });
    }
    if (linha.destinoUf && !UFS.has(linha.destinoUf)) {
      problemas.push({ linha: n, campo: "destinoUf", severidade: "erro", mensagem: `UF de destino inválida: "${linha.destinoUf}".` });
    }
    if (linha.origemUf && !UFS.has(linha.origemUf)) {
      problemas.push({ linha: n, campo: "origemUf", severidade: "alerta", mensagem: `UF de origem inválida: "${linha.origemUf}".` });
    }

    for (const [campo, cep] of [
      ["destinoCepInicio", linha.destinoCepInicio],
      ["destinoCepFim", linha.destinoCepFim],
      ["origemCepInicio", linha.origemCepInicio],
      ["origemCepFim", linha.origemCepFim],
    ] as const) {
      if (cep && cep.length !== 8) {
        problemas.push({ linha: n, campo, severidade: "alerta", mensagem: `CEP com ${cep.length} dígitos (esperado 8).` });
      }
    }
    if (linha.destinoCepInicio && linha.destinoCepFim && linha.destinoCepInicio > linha.destinoCepFim) {
      problemas.push({ linha: n, campo: "destinoCepFim", severidade: "erro", mensagem: "CEP final menor que o CEP inicial." });
    }

    if (linha.pesoDe !== null && linha.pesoAte !== null && linha.pesoDe > linha.pesoAte) {
      problemas.push({ linha: n, campo: "pesoAte", severidade: "erro", mensagem: "Faixa de peso invertida (de > até)." });
    }
    for (const [campo, valor] of [
      ["valorFixo", linha.valorFixo],
      ["valorPorKg", linha.valorPorKg],
      ["valorPorVolume", linha.valorPorVolume],
      ["valorPorM3", linha.valorPorM3],
      ["fretePesoMinimo", linha.fretePesoMinimo],
    ] as const) {
      if (valor !== null && valor < 0) {
        problemas.push({ linha: n, campo, severidade: "erro", mensagem: "Valor negativo." });
      }
    }
    if (linha.percentualNf !== null && (linha.percentualNf < 0 || linha.percentualNf > 100)) {
      problemas.push({ linha: n, campo: "percentualNf", severidade: "erro", mensagem: "Percentual fora do intervalo 0–100." });
    }

    if (!temValor(linha, modelo)) {
      problemas.push({ linha: n, campo: "valor", severidade: "erro", mensagem: "Nenhum valor compatível com o modelo de cobrança escolhido." });
    }

    const chave = chaveRota(linha) + `|${linha.pesoDe ?? ""}|${linha.pesoAte ?? ""}`;
    const anterior = vistas.get(chave);
    if (anterior) {
      problemas.push({ linha: n, campo: "rota", severidade: "erro", mensagem: `Rota duplicada (igual à linha ${anterior}).` });
    } else vistas.set(chave, n);

    if (linha.pesoDe !== null || linha.pesoAte !== null) {
      const rota = chaveRota(linha);
      const faixas = faixasPorRota.get(rota) ?? [];
      const de = linha.pesoDe ?? 0;
      const ate = linha.pesoAte ?? Number.POSITIVE_INFINITY;
      const conflito = faixas.find((f) => de < f.ate && f.de < ate);
      if (conflito) {
        problemas.push({ linha: n, campo: "peso", severidade: "erro", mensagem: `Faixa de peso sobreposta com a linha ${conflito.linha}.` });
      }
      faixas.push({ de, ate, linha: n });
      faixasPorRota.set(rota, faixas);
    }
  });

  return problemas;
}

export function resumoProblemas(problemas: Problema[]) {
  return {
    erros: problemas.filter((p) => p.severidade === "erro").length,
    alertas: problemas.filter((p) => p.severidade === "alerta").length,
    linhasComErro: new Set(problemas.filter((p) => p.severidade === "erro").map((p) => p.linha)).size,
  };
}
