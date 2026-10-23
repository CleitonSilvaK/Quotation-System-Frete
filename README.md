# Remix of Freight Insights

Você é um desenvolvedor Front-End sênior especializado em Business Intelligence, Supply Chain, Compras, Logística e análise de custos de transporte.

Crie uma aplicação web profissional chamada:

"KPI FRETES DE COMPRAS"

SUBTÍTULO:

"Gestão e análise do custo de transporte das compras"

==================================================

1. CONTEXTO DA EMPRESA

==================================================

IMPORTANTE: compreenda o contexto antes de desenvolver.

A empresa possui APENAS DUAS UNIDADES:

1. Camaquã/RS

2. Pelotas/RS

Os arquivos XML que serão importados são CT-es referentes EXCLUSIVAMENTE A CUSTOS DE FRETE DE COMPRAS REALIZADAS PELA EMPRESA.

Portanto, NÃO estamos analisando:

- frete de vendas;

- entregas realizadas para clientes;

- distribuição de produtos vendidos;

- transporte de mercadorias para terceiros.

O objetivo é analisar:

FORNECEDOR

      ↓

COMPRA

      ↓

TRANSPORTE

      ↓

CUSTO DO FRETE

      ↓

UNIDADE DE DESTINO

A pergunta principal do sistema é:

"Quanto estamos gastando para transportar nossas compras até Camaquã e Pelotas, de onde essas compras estão vindo, quais transportadoras utilizamos e onde existem oportunidades de redução de custo?"

==================================================

2. PERÍODO DA ANÁLISE

==================================================

Os XMLs correspondem ao período:

01/01/2025 até 04/08/2026.

O sistema deve permitir alterar o período através de filtros.

O período inicial do dashboard deve ser:

01/01/2025 → 04/08/2026.

==================================================

3. OBJETIVOS DO DASHBOARD

==================================================

O dashboard deve permitir responder:

- Quanto gastamos com frete de compras?

- Quanto gastamos com frete para Camaquã?

- Quanto gastamos com frete para Pelotas?

- Qual unidade possui maior custo logístico?

- De quais estados/regiões vêm nossas compras?

- Quanto custa trazer mercadorias de SP para Camaquã?

- Quanto custa trazer mercadorias de SP para Pelotas?

- Quanto custa trazer mercadorias de PR para Camaquã?

- Quanto custa trazer mercadorias de PR para Pelotas?

- Qual transportadora possui menor custo?

- Qual transportadora é mais utilizada?

- Qual transportadora apresenta melhor custo por kg?

- Qual transportadora apresenta melhor custo para determinada rota?

- Quais rotas possuem maior custo?

- Quais fornecedores geram maior custo de frete?

- Qual é o custo de frete em relação ao valor das compras?

- Quanto pagamos de frete por R$ 1.000 em mercadorias compradas?

- Como o custo de frete evoluiu em 2025 e 2026?

- Existem rotas cujo custo está acima do histórico?

- Existem transportadoras cobrando acima do padrão?

- Onde existem oportunidades de negociação?

==================================================

4. CONCEITO PRINCIPAL DO SISTEMA

==================================================

O sistema deve tratar cada CT-e como uma operação relacionada à compra.

A estrutura lógica deve ser:

FORNECEDOR

    ↓

LOCALIZAÇÃO DO FORNECEDOR

    ↓

ORIGEM DA CARGA

    ↓

TRANSPORTADORA

    ↓

CT-e

    ↓

UNIDADE DE DESTINO

    ↓

CAMAQUÃ OU PELOTAS

Criar duas unidades fixas:

CAMAQUÃ/RS

PELOTAS/RS

Não criar outras filiais como opção de filtro.

==================================================

5. DIMENSÕES PRINCIPAIS

==================================================

O dashboard deve trabalhar com as seguintes dimensões:

UNIDADE DESTINO:

- Camaquã

- Pelotas

ORIGEM:

- Estado

- Região

- Cidade

TRANSPORTADORA:

- Nome

- CNPJ

FORNECEDOR:

- Nome

- CNPJ

- Cidade

- UF

PERÍODO:

- Ano

- Mês

- Trimestre

CT-e:

- número

- chave

- data

- valor

==================================================

6. DADOS DOS XMLs

==================================================

Os dados serão obtidos a partir dos XMLs reais dos CT-es.

Não inventar informações.

Extrair o máximo de informações possível dos XMLs.

Campos desejados:

IDENTIFICAÇÃO:

- chaveCTe

- numeroCTe

- serie

- modelo

- dataEmissao

- tipoCTe

- tipoServico

TRANSPORTADORA:

- cnpjTransportadora

- nomeTransportadora

ORIGEM:

- cidadeOrigem

- ufOrigem

- regiaoOrigem

DESTINO:

- cidadeDestino

- ufDestino

- regiaoDestino

FORNECEDOR:

- nomeFornecedor

- cnpjFornecedor

- cidadeFornecedor

- ufFornecedor

UNIDADE:

- unidadeDestino

FINANCEIRO:

- valorTotalCTe

- valorPrestacao

- valorReceber

- valorICMS

- valorPedagio

- outrosValores

- componentesFrete

CARGA:

- peso

- quantidadeVolumes

- valorMercadoria

DOCUMENTOS:

- chavesNFe

- quantidadeNFe

STATUS:

- autorizado

- cancelado

- statusCTe

CAMPOS CALCULADOS:

- rotaUF

- rotaCidade

- rotaFornecedorUnidade

- mes

- ano

- trimestre

- custoPorKg

- custoPorVolume

- percentualFreteCompra

- fretePor1000Reais

==================================================

7. IMPORTANTE SOBRE FORNECEDORES

==================================================

O fornecedor é uma dimensão extremamente importante.

O sistema deve tentar identificar o fornecedor/remetente a partir do XML.

Criar análise:

"Frete por fornecedor"

Exemplo:

Fornecedor A

São Paulo/SP

Destino: Camaquã

Frete: R$ XXX

Fornecedor B

Curitiba/PR

Destino: Pelotas

Frete: R$ XXX

Se o XML não permitir identificar corretamente o fornecedor, mostrar:

"Fornecedor não identificado"

Nunca inventar.

==================================================

8. DASHBOARD PRINCIPAL

==================================================

Criar página:

"Visão Geral"

Filtros no topo:

Período

Unidade de destino:

- Todas

- Camaquã

- Pelotas

Transportadora

Fornecedor

UF de origem

Região de origem

Cidade de origem

Rota

Status do CT-e

Todos os gráficos e KPIs devem responder aos filtros.

==================================================

9. CARDS PRINCIPAIS

==================================================

Criar cards:

CUSTO TOTAL DE FRETE

Quantidade de CT-es

CUSTO MÉDIO POR CT-e

PESO TRANSPORTADO

CUSTO MÉDIO / KG

VALOR DAS COMPRAS TRANSPORTADAS

FRETE / VALOR DAS COMPRAS

FRETE POR R$ 1.000 EM COMPRAS

==================================================

10. COMPARAÇÃO CAMAQUÃ × PELOTAS

==================================================

Criar uma seção extremamente importante:

"Custo de Frete por Unidade"

Comparar:

Camaquã

Pelotas

Indicadores:

- custo total;

- quantidade de CT-es;

- custo médio;

- peso;

- R$/kg;

- valor das compras;

- frete/valor das compras.

Criar gráfico comparativo.

IMPORTANTE:

Não concluir que uma unidade é mais eficiente apenas porque possui menor custo total.

Considerar também volume, peso e valor das compras.

==================================================

11. EVOLUÇÃO MENSAL

==================================================

Criar gráfico:

"Custo de Frete de Compras por Mês"

Período:

Jan/2025 até Ago/2026.

Permitir alternar:

- Custo total

- CT-es

- Custo médio

- R$/kg

- Frete/valor das compras

Criar comparação:

2025 × 2026.

==================================================

12. CUSTO POR REGIÃO DE ORIGEM

==================================================

Criar seção:

"De onde vêm nossas compras?"

Agrupar por:

- Região

- Estado

- Cidade

Exemplo:

SUDESTE

SP

MG

RJ

SUL

PR

SC

RS

CENTRO-OESTE

GO

MT

MS

Mostrar:

Quantidade de CT-es

Custo total

Custo médio

Peso

R$/kg

Valor das compras

Frete %

==================================================

13. ESTADO DE ORIGEM × UNIDADE DE DESTINO

==================================================

Criar uma matriz extremamente importante:

"Origem das Compras × Unidade"

Exemplo:

                 Camaquã    Pelotas

SP                 XXX        XXX

PR                 XXX        XXX

SC                 XXX        XXX

RS                 XXX        XXX

MG                 XXX        XXX

Permitir alternar entre:

Custo total

Custo médio

R$/kg

Quantidade CT-e

Peso

==================================================

14. ROTAS

==================================================

Criar análise:

"Rotas de Compras"

Exemplos:

SP → Camaquã

SP → Pelotas

PR → Camaquã

PR → Pelotas

SC → Camaquã

SC → Pelotas

RS → Camaquã

RS → Pelotas

Criar tabela:

Origem

Destino

Unidade

CT-es

Custo total

Custo médio

Peso

R$/kg

Valor das compras

Frete %

==================================================

15. TRANSPORTADORAS

==================================================

Criar página:

"Transportadoras"

Indicadores:

- CT-es;

- custo total;

- custo médio;

- peso;

- R$/kg;

- participação no custo;

- valor das compras transportadas;

- frete %.

Criar ranking.

Também permitir comparar transportadoras para a mesma rota.

==================================================

16. TRANSPORTADORA × ROTA

==================================================

Criar matriz:

Transportadora × Rota

Exemplo:

                    SP→Camaquã   SP→Pelotas

Transportadora A       XXX          XXX

Transportadora B       XXX          XXX

Transportadora C       XXX          XXX

Mostrar:

- custo médio;

- R$/kg;

- quantidade;

- peso médio.

Destacar automaticamente:

MENOR CUSTO

MELHOR R$/KG

MAIOR CUSTO

==================================================

17. FORNECEDORES

==================================================

Criar página:

"Fornecedores"

Ranking:

Fornecedor

UF

Cidade

Unidade destino

CT-es

Custo total de frete

Valor das compras

Frete %

R$/kg

Mostrar:

"Top fornecedores por custo de frete"

e

"Top fornecedores por valor de compras"

==================================================

18. FRETE COMO PERCENTUAL DA COMPRA

==================================================

Este é um KPI estratégico.

Calcular:

Custo de frete ÷ valor da mercadoria × 100

Exemplo:

Compra:

R$ 10.000

Frete:

R$ 300

Frete:

3%

Também calcular:

"Frete por R$ 1.000 em compras"

Isso permitirá comparar fornecedores, regiões e unidades de maneira justa.

==================================================

19. BENCHMARK DE ROTAS

==================================================

Criar:

"Benchmark Histórico"

Para cada rota:

SP → Camaquã

SP → Pelotas

PR → Camaquã

PR → Pelotas

calcular:

- média;

- mediana;

- mínimo;

- máximo;

- R$/kg médio;

- desvio padrão;

- quantidade de operações.

Quando houver uma operação muito acima do histórico:

mostrar:

ATENÇÃO

"Custo acima do padrão histórico"

Exemplo visual:

SP → Camaquã

Média:

R$ 400

CT-e atual:

R$ 520

Desvio:

+30%

IMPORTANTE:

O benchmark deve ser calculado com os dados reais importados.

Não utilizar valores fixos inventados.

==================================================

20. OPORTUNIDADES DE ECONOMIA

==================================================

Criar página:

"Oportunidades"

O sistema deve identificar:

- rotas caras;

- transportadoras caras;

- aumento de custo;

- aumento de R$/kg;

- concentração de gastos;

- fornecedores com frete elevado;

- diferenças entre transportadoras;

- rotas com grande volume e custo acima do benchmark.

Exemplo:

OPORTUNIDADE

SP → Camaquã

Custo médio:

R$ 420

Benchmark:

R$ 350

Desvio:

+20%

Quantidade:

320 CT-es

Potencial de economia estimado:

calcular somente se houver dados suficientes.

==================================================

21. IMPORTAÇÃO

==================================================

Criar página:

"Importar CT-es"

Permitir:

- múltiplos XMLs;

- drag and drop;

- seleção de pasta;

- processamento em lote;

- milhares de arquivos.

Mostrar:

Arquivos encontrados

Processados

Válidos

Duplicados

Inválidos

Cancelados

Mostrar período:

Primeiro CT-e

Último CT-e

Mostrar quantidade de:

Transportadoras

Fornecedores

Estados

Rotas

==================================================

22. QUALIDADE DOS DADOS

==================================================

Criar uma seção:

"Qualidade da Base"

Mostrar:

CT-es válidos

CT-es duplicados

CT-es cancelados

XMLs sem peso

XMLs sem fornecedor

XMLs sem NF-e identificável

XMLs sem valor de mercadoria

Isso é importante para que os indicadores tenham rastreabilidade.

==================================================

23. DETALHAMENTO DO CT-e

==================================================

Ao clicar em um CT-e:

mostrar:

Número

Chave

Data

Transportadora

Fornecedor

Origem

Destino

Unidade

Valor do frete

Peso

Volumes

NF-es

Valor das compras

Frete %

R$/kg

Status

Criar aba:

"XML Original"

==================================================

24. TABELA GERAL

==================================================

Criar página:

"CT-es"

Filtros avançados.

Colunas:

Data

CT-e

Transportadora

Fornecedor

Origem

Destino

Unidade

Valor frete

Peso

R$/kg

Valor compra

Frete %

Status

Permitir:

ordenar

pesquisar

filtrar

exportar CSV

exportar Excel

==================================================

25. DESIGN

==================================================

Design:

Corporativo

Moderno

Profissional

Dark mode

Minimalista

Inspirado em Power BI / Tableau / sistemas corporativos de BI.

Não utilizar excesso de cores.

Priorizar:

clareza

hierarquia

legibilidade

visualização rápida de KPI.

Criar gráficos com boa estética.

==================================================

26. MENU

==================================================

Sidebar:

Dashboard

CT-es

Transportadoras

Fornecedores

Rotas

Regiões

Unidades

Benchmark

Oportunidades

Importação

Qualidade da Base

==================================================

27. ESTRUTURA TÉCNICA

==================================================

Separar:

xmlParser.ts

dataProcessor.ts

dashboardCalculations.ts

benchmarkEngine.ts

opportunityEngine.ts

geography.ts

types.ts

components/

pages/

services/

utils/

O parser deve ser independente da interface.

==================================================

28. REGRAS DE CÁLCULO

==================================================

Nunca inventar dados.

Se não houver peso:

R$/kg = N/D

Se não houver valor da mercadoria:

Frete % = N/D

Se não houver fornecedor:

Fornecedor = "Não identificado"

CT-es cancelados devem ser identificados e, por padrão, excluídos dos indicadores financeiros.

Duplicidades devem ser identificadas pela chave do CT-e.

==================================================

29. ARQUITETURA FUTURA

==================================================

Embora inicialmente seja Front-End, preparar a aplicação para futura integração com:

ERP Solution

API REST

Banco SQL

Power BI

Sistema interno de Compras.

A aplicação deverá futuramente permitir atualização automática dos CT-es.

==================================================

30. PRIORIDADE DO PROJETO

==================================================

Prioridade:

1. CORREÇÃO DOS DADOS

2. CORREÇÃO DOS CÁLCULOS

3. ANÁLISE DE CUSTO

4. ANÁLISE POR ROTA

5. ANÁLISE POR UNIDADE

6. ANÁLISE POR TRANSPORTADORA

7. ANÁLISE POR FORNECEDOR

8. BENCHMARK

9. OPORTUNIDADES

10. DESIGN

==================================================

31. DADOS MOCKADOS

==================================================

Enquanto os XMLs reais não forem carregados, utilizar dados demonstrativos.

Criar exemplos coerentes de:

SP → Camaquã

SP → Pelotas

PR → Camaquã

PR → Pelotas

SC → Camaquã

SC → Pelotas

E deixar claramente visível:

"DADOS DEMONSTRATIVOS"

Quando os XMLs reais forem carregados, substituir completamente os mocks.

==================================================

32. RESULTADO ESPERADO

==================================================

Quero uma aplicação funcional, navegável e preparada para receber milhares de XMLs reais.

O sistema deve funcionar como uma ferramenta de análise para o setor de COMPRAS.

O objetivo final é permitir que o comprador consiga identificar:

ONDE ESTAMOS GASTANDO MAIS?

POR QUE ESTAMOS GASTANDO MAIS?

QUAL TRANSPORTADORA É MAIS COMPETITIVA?

QUAL ROTA É MAIS CARA?

QUAL UNIDADE POSSUI MAIOR CUSTO?

QUAIS FORNECEDORES GERAM MAIOR CUSTO DE FRETE?

QUAL O CUSTO DE TRAZER UMA COMPRA DE DETERMINADA REGIÃO?

ONDE EXISTE OPORTUNIDADE DE NEGOCIAÇÃO?

O dashboard deve transformar os XMLs de CT-e em informações úteis para TOMADA DE DECISÃO, NEGOCIAÇÃO COM TRANSPORTADORAS E REDUÇÃO DE CUSTOS DE COMPRAS.

ANTES DE IMPLEMENTAR:

Analise a estrutura real e padrão dos XMLs de CT-e.

Não presuma que todos os campos existirão.

Crie o parser de forma tolerante a diferentes versões e estruturas de CT-e.

Priorize:

DADOS CORRETOS > CÁLCULOS CORRETOS > ANÁLISE > USABILIDADE > ESTÉTICA.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b8ab3358-3859-4835-ba87-64637e6d2562).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
# Configuração do Supabase

As credenciais do Supabase não fazem parte do repositório. Para executar o
projeto localmente, copie `.env.example` para `.env` e preencha:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

No provedor de hospedagem, configure essas mesmas variáveis como variáveis de
ambiente antes do build. Nunca coloque uma chave `service_role` no frontend,
no `.env.example` ou no repositório.
