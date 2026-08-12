# Cotar frete (nova aba do Simulador)

Renomear a aba "Simulador" para **Cotar frete** e transformá-la num formulário de orçamento completo, com cálculo automático de cubagem a partir dos volumes.

## O que muda

### 1. Nome e navegação
- Sidebar (grupo "Cotação de Fretes"): item passa a ser **Cotar frete**.
- Título da página, descrição e metadados (title/description/og) atualizados.
- A rota continua `/tabelas/simulador` (links existentes seguem funcionando).

### 2. Novo formulário de cotação
Blocos do formulário:

**Tomador do frete**
- Seleção FOB ou CIF (botões de alternância).

**Remetente (fornecedor)**
- CNPJ (com máscara), Nome, Cidade, UF.

**Destinatário**
- CNPJ (com máscara), Nome, Cidade, UF, CEP.

**Carga**
- Valor da NF-e (R$)
- Peso bruto (kg)

**Volumes / cubagem**
- Lista de volumes; cada linha tem: quantidade, comprimento, largura, altura (em cm) e descrição opcional.
- Botões para adicionar e remover volumes.
- Por linha o sistema mostra o m³ daquele item: `(C x L x A) / 1.000.000 x quantidade`.
- Rodapé do bloco mostra: **total de volumes**, **cubagem total da NF-e (m³)** e **peso cubado** (cubagem x fator de cubagem da tabela).

### 3. Comparativo
- O painel de resultados continua igual, comparando as tabelas vigentes, mas agora recebe a cubagem calculada pelos volumes e o total de volumes somado das linhas.
- Cabeçalho do resultado passa a exibir um resumo do embarque: tomador, remetente → destinatário, peso real vs. peso taxado.

## Detalhes técnicos

- `src/lib/tabelas/types.ts`: estender `EntradaSimulacao` com `tomador: "FOB" | "CIF"`, dados de remetente (`remetenteCnpj`, `remetenteNome`, `remetenteCidade`, `origemUf`) e destinatário (`destinatarioCnpj`, `destinatarioNome`, `destinoCidade`, `destinoUf`, `cepDestino`), e um novo tipo `VolumeCotacao { id, quantidade, comprimentoCm, larguraCm, alturaCm, descricao }` com `volumesDetalhados: VolumeCotacao[]`. `ENTRADA_PADRAO` ganha um volume vazio inicial.
- `src/lib/tabelas/calculo.ts`: adicionar helpers puros `cubagemDeVolumes(volumes)` e `totalVolumes(volumes)`; a página deriva `cubagemM3` e `volumes` a partir deles antes de chamar `simularComparativo`. O motor de cálculo em si não muda (continua usando `pesoTaxadoDe` com o fator de cubagem da tabela).
- `src/routes/tabelas.simulador.tsx`: reescrever a coluna esquerda com os novos blocos e a tabela de volumes; extrair um componente `EditorVolumes` em `src/components/tabelas/EditorVolumes.tsx` para manter o arquivo enxuto.
- `src/components/kpi/AppSidebar.tsx`: alterar o rótulo do item.
- Sem backend: tudo continua no navegador, usando o store local existente.
