# Configuração e execução do projeto

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- [npm](https://www.npmjs.com/) v9 ou superior
- Conta no [Google AI Studio](https://aistudio.google.com/) para obter a API Key do Gemini

---

## 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd manager-ai-agent
```

---

## 2. Instalar dependências

```bash
npm install
```

---

## 3. Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env.local
```

Abra `.env.local` e substitua o valor da variável:

```env
GOOGLE_GENAI_API_KEY=sua_api_key_aqui
```

> Para obter a API Key, acesse [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey), crie ou selecione um projeto e gere uma nova chave.

---

## 4. Rodar em desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

---

## 5. Verificar tipagem TypeScript

```bash
npx tsc --noEmit
```

---

## 6. Executar o linter

```bash
npm run lint
```

---

## 7. Gerar build de produção

```bash
npm run build
```

---

## 8. Iniciar em produção

Após o build, inicie o servidor:

```bash
npm run start
```

---

## Testando os agentes

Os agentes são expostos como API Routes em `/api/agents/<nome-do-agente>`.

### Exemplo — agente `example`

**Endpoint:** `POST /api/agents/example`

**Body (JSON):**
```json
{
  "message": "Olá, como você pode me ajudar?"
}
```

**Resposta esperada:**
```json
{
  "response": "..."
}
```

Usando `curl`:
```bash
curl -X POST http://localhost:3000/api/agents/example \
  -H "Content-Type: application/json" \
  -d '{"message": "Olá, como você pode me ajudar?"}'
```

---

## Estrutura relevante do projeto

```
src/
├── agents/          # Lógica dos agentes (flows Genkit)
│   └── example/
├── app/
│   └── api/
│       └── agents/  # Endpoints HTTP dos agentes
└── lib/
    └── genkit/      # Configuração e instância global do Genkit
docs/                # Documentação do projeto
```
