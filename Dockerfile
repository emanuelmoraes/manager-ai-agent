# Usa imagem Node.js mais leve baseada no Alpine
FROM node:20-alpine AS base

# Dependências apenas quando necessário
FROM base AS deps
# Adicionar suporte a compatibilidade de libc para ferramentas gyp
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instalar dependências preferindo package-lock.json se existir
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild do código-fonte (Builder)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis de ambiente públicas que precisam ser injetadas durante o build
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID

ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID

# Fazer a build da aplicação (o Next.js usará a config standalone)
RUN npm run build

# Imagem final, copiando apenas os arquivos estritamente necessários
FROM base AS runner
WORKDIR /app

# Usuário menos privilegiado para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Configura o diretório de dados públicos e pastas .next (cache de imagens, etc)
COPY --from=builder /app/public ./public

# Configura as permissões para o Next criar o cache de build no Cloud Run
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copia automaticamente o servidor Node minificado (criado via next.config.ts -> standalone)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Expõe a porta que o Cloud Run vai pedir através do $PORT (padrão é 8080 ou 3000)
# Vamos expor a 8080 explicitamente no contêiner
EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Executa o servidor Node (no modo standalone, usamos server.js invés de next start)
CMD ["node", "server.js"]
