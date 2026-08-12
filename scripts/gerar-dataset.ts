/**
 * Gera o dataset real a partir dos XMLs de CT-e usando o MESMO parser da aplicação.
 * Uso: bun run scripts/gerar-dataset.ts <pasta-com-xmls> <arquivo-saida.json>
 */
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

import { parseCTeXml } from "../src/lib/kpi/xmlParser";
import { consolidar } from "../src/lib/kpi/dataProcessor";

const pasta = process.argv[2] ?? ".";
const saida = process.argv[3] ?? "public/data/ctes.json";

function listar(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return listar(caminho);
    return caminho.toLowerCase().endsWith(".xml") ? [caminho] : [];
  });
}

const arquivos = listar(pasta);
const resultados = arquivos.map((caminho) =>
  parseCTeXml(readFileSync(caminho, "utf8"), caminho.split("/").pop() ?? caminho),
);
const { registros, resumo } = consolidar(resultados);

mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, JSON.stringify({ resumo, registros }));
console.log(JSON.stringify(resumo, null, 2));
console.log("registros:", registros.length);
