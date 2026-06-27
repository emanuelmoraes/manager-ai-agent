# Manager AI Agent

Este projeto é uma plataforma para gerenciar Agentes de Inteligência Artificial, suas integrações (via MCP - Model Context Protocol), base de conhecimento RAG (Retrieval-Augmented Generation) e orquestração.

## Requisitos de Infraestrutura (Firebase)

O projeto foi migrado para utilizar o **Firebase (Firestore)** como banco de dados serverless (ideal para deploys no Google Cloud Run).

Para rodar a aplicação corretamente, você deve criar um arquivo `.env.local` na raiz do projeto contendo as seguintes chaves do Firebase:

```env
# Google AI
GOOGLE_GENAI_API_KEY=sua_api_key_aqui

# Firebase Client SDK (Acesso Público ao Banco de Dados)
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id

# Firebase Admin SDK (Gerenciamento Seguro de Configurações no Backend)
FIREBASE_PROJECT_ID=seu_projeto
FIREBASE_CLIENT_EMAIL=seu_email_de_servico@seu_projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSua_Chave_Privada_Aqui\n-----END PRIVATE KEY-----\n"
```

> **Atenção:** Como o sistema ainda não utiliza autenticação, lembre-se de permitir leitura e escrita nas Regras do Firestore (`allow read, write: if true;`) temporariamente durante o desenvolvimento, ou configure o Auth para maior segurança.

## Rodando Localmente

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicialize o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Acesse `http://localhost:3000/workspace`

## Deploy no Google Cloud Run

O projeto está otimizado (Standalone mode) e possui um `Dockerfile` nativo pronto para o Google Cloud Run. Para subir a aplicação, utilize:

```bash
# Faça o build da imagem
gcloud builds submit --tag gcr.io/SEU_PROJECT_ID/manager-ai-agent

# Realize o deploy repassando as variáveis de ambiente
gcloud run deploy manager-ai-agent \
  --image gcr.io/SEU_PROJECT_ID/manager-ai-agent \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars="FIREBASE_PROJECT_ID=seu_projeto,FIREBASE_CLIENT_EMAIL=..."
```
*(Nota: Configure as chaves de ambiente no painel do Cloud Run por questões de segurança)*
