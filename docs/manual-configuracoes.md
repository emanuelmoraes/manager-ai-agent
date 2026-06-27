# Manual do Sistema - Sessão de Configurações

Este documento explica de forma detalhada o funcionamento da área de **Configurações** do ManagerAI, descrevendo como gerenciar os Provedores de IA e a Base de Conhecimento Local baseada em RAG (Retrieval-Augmented Generation).

---

## 1. Provedores de IA

A aba **Provedores de IA** permite configurar as credenciais dos principais provedores de modelos de linguagem (LLM) do mercado.

### Provedores Suportados
* **Google Gemini**: Suporta os modelos `gemini-1.5-pro` e `gemini-1.5-flash`.
* **OpenAI**: Suporta os modelos `gpt-4o` e `gpt-4o-mini`.
* **Anthropic**: Suporta os modelos `claude-3-5-sonnet-20241022` e `claude-3-5-haiku-20241022`.

### Armazenamento das Chaves de API
* As chaves de API digitadas pelo usuário são transmitidas de forma segura ao servidor e gravadas localmente no arquivo do projeto em `src/lib/config/keys.json`.
* **Segurança Local**: O arquivo `keys.json` está incluído no `.gitignore` para garantir que credenciais sensíveis nunca sejam enviadas para repositórios públicos de controle de versão (como o GitHub).

### Lógica de Fallback (Simulação)
* Se um agente estiver configurado para usar um provedor cuja chave de API correspondente **não** foi fornecida na página de configurações:
  * **No Chat Individual (1-on-1)**: O chat responderá em modo de simulação com uma mensagem pré-formatada alertando que a chave correspondente está ausente.
  * **No Pipeline de Tarefas**: O orquestrador detectará a falta da chave e executará aquela etapa específica do agente em modo simulado (com um atraso visual e uma resposta estática informando o ocorrido).

---

## 2. Base de Conhecimento (RAG)

A aba **Base de Conhecimento (RAG)** permite treinar semanticamente seus agentes por meio do upload de diretrizes de negócio, manuais, FAQs ou qualquer documentação em texto.

### O que é RAG?
**RAG (Retrieval-Augmented Generation)** é uma técnica que estende o conhecimento de um modelo de IA com fontes externas de dados. Em vez de re-treinar ou fazer fine-tuning de um modelo (o que é custoso), nós buscamos trechos relevantes de documentos locais e os fornecemos ao modelo de IA no momento da requisição para enriquecer seu contexto.

### Fluxo de Funcionamento Técnico

#### A. Indexação de Documentos
1. **Importação via Arquivo ou Manual**: Você pode carregar um arquivo de texto local do tipo `.txt` usando a opção de importação de arquivo, ou preencher manualmente o título e o conteúdo nos campos correspondentes. Ao carregar um arquivo `.txt`, o sistema preenche automaticamente o campo de conteúdo e define o título com o nome do arquivo (sem a extensão `.txt`).
2. Ao clicar em **"Indexar na Base Vetorial"**, o sistema realiza uma requisição para a API do Google Gemini utilizando o modelo de vetorização **`googleai/gemini-embedding-001`**.
3. Esse modelo transforma o texto em um vetor matemático de alta dimensionalidade (embedding) que representa o "significado" do texto.
4. O documento (ID, Título, Conteúdo, Data de Criação) junto com o seu respectivo vetor é salvo no arquivo local `src/lib/config/knowledge.json`.

#### B. Busca Semântica em Tempo de Execução
1. Quando uma pesquisa é feita na base de dados (ou quando um agente realiza uma busca):
2. O termo de busca é convertido em um vetor usando o mesmo modelo de embedding.
3. O sistema calcula a **Similaridade de Cosseno** entre o vetor da pesquisa e os vetores de todos os documentos cadastrados em `knowledge.json`.
4. Os resultados com proximidade semântica satisfatória (similaridade maior ou igual a `0.45` / `45%`) são ordenados do maior para o menor.
5. Os trechos de conhecimento são anexados à consulta do agente.

#### C. Como os Agentes Usam a Base
Os agentes configurados com o provedor Google Gemini possuem acesso a uma ferramenta Genkit chamada **`consultarBaseConhecimento`**.
* O agente decide autonomamente, com base no objetivo da tarefa, se precisa ou não invocar a ferramenta para buscar dados locais.
* Se invocar, o sistema executa a busca vetorial descrita acima e insere os documentos no fluxo, permitindo que a IA responda baseando-se em fatos reais de seus manuais indexados.

---

## 3. Servidores MCP (Model Context Protocol)

A aba **Servidores MCP** permite cadastrar e gerenciar fontes externas de ferramentas e dados que estendem a capacidade do sistema. O Model Context Protocol é um padrão aberto que possibilita expor utilitários locais ou remotos de forma simplificada para agentes de IA.

### Tipos de Conexão Suportados
1. **SSE (Server-Sent Events) / HTTP**: Conecta a um servidor MCP que está rodando remotamente ou em uma porta específica do localhost. É configurado fornecendo a **URL** do endpoint SSE do servidor (ex: `http://localhost:3001/sse`).
2. **Stdio (Comando CLI Local)**: Executa um processo de linha de comando no servidor local para hospedar as ferramentas. É configurado por meio do **Comando** (ex: `npx`, `node`), seus **Argumentos** correspondentes e opcionalmente variáveis de ambiente em formato JSON.

### Como Vincular Servidores aos Agentes
Após cadastrar os servidores MCP nas Configurações do sistema:
1. Vá até o **Workspace** e clique no botão de edição de qualquer Agente (ícone de lápis) ou crie um novo agente.
2. Na parte inferior do modal, na seção **"Acesso a Servidores MCP"**, marque as checkboxes correspondentes aos servidores que você quer autorizar este Agente a usar.
3. Ao executar a tarefa no Pipeline, a orquestração do Genkit carregará dinamicamente e de forma restrita as ferramentas apenas dos servidores que o respectivo Agente está autorizado a acessar, garantindo segurança e melhor controle contextual.

---

## 4. Gestão e Manutenção das Configurações

* **Visualização das Chaves**: A página de configurações indica quais chaves estão ativas/configuradas com um sinalizador visual (verde para configurada, vermelho para ausente) sem exibir o valor da chave em texto plano para segurança.
* **Exclusão de Documentos**: Você pode gerenciar os documentos indexados diretamente na lista visual clicando no botão de exclusão (ícone de lixeira) ao lado de cada documento, o que limpa o vetor correspondente e o remove do arquivo `knowledge.json`.
* **Exclusão de Servidores MCP**: Os servidores cadastrados podem ser excluídos a qualquer momento clicando no botão de lixeira no card lateral de cada servidor. Isso fechará a respectiva conexão ativa no backend de forma imediata.
