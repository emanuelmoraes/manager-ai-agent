const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Nome do serviço no Cloud Run
const SERVICE_NAME = 'manager-ai-agent-dev';
// Região do deploy
const REGION = 'southamerica-east1';

console.log('🚀 Iniciando script de deploy para o Google Cloud Run...\n');

// 1. Ler o arquivo .env.local
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Arquivo .env.local não encontrado! Certifique-se de criá-lo com as variáveis do Firebase.');
  process.exit(1);
}

console.log('📦 Lendo variáveis do .env.local...');
let envFile = fs.readFileSync(envPath, 'utf8');

// Correção para arquivos criados no PowerShell (UTF-16 LE lido como UTF-8 tem null bytes)
envFile = envFile.replace(/\0/g, '');

const envVars = {};

envFile.split('\n').forEach(line => {
  // Limpa espaços e quebras de linha
  line = line.trim();
  if (!line || line.startsWith('#')) return;

  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    // Remove aspas duplas e simples caso existam
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1);
    }
    envVars[key] = value;
  }
});

const projectId = envVars['NEXT_PUBLIC_FIREBASE_PROJECT_ID'] || envVars['FIREBASE_PROJECT_ID'];

if (!projectId) {
  console.log('Chaves encontradas no arquivo:', Object.keys(envVars));
  console.error('❌ ID do projeto (NEXT_PUBLIC_FIREBASE_PROJECT_ID) não encontrado no .env.local.');
  process.exit(1);
}

// 2. Montar o comando de Build
console.log(`\n🛠️  Passo 1: Construindo a imagem no Cloud Build (Projeto: ${projectId})...`);

// Vamos criar um .env.production temporário para o Next.js injetar as variáveis públicas no Build!
const envProductionPath = path.join(__dirname, '.env.production');
const gcloudIgnorePath = path.join(__dirname, '.gcloudignore');

const publicEnvContent = Object.entries(envVars)
  .filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

fs.writeFileSync(envProductionPath, publicEnvContent, 'utf8');

// Precisamos de um .gcloudignore temporário para forçar o upload do .env.production
const gcloudIgnoreContent = `.git
.gitignore
node_modules/
.next/
out/
.env*
!.env.production
`;
fs.writeFileSync(gcloudIgnorePath, gcloudIgnoreContent, 'utf8');

console.log('Arquivos temporários (.env.production e .gcloudignore) criados para o build.\nIsso pode levar alguns minutos.\n');

const imageTag = `gcr.io/${projectId}/${SERVICE_NAME}`;
const buildCommand = `gcloud builds submit --tag ${imageTag}`;

try {
  // stdio: 'inherit' faz com que os logs do gcloud apareçam em tempo real no terminal do node
  execSync(buildCommand, { stdio: 'inherit' });
  console.log('\n✅ Build concluído com sucesso!');
} catch (error) {
  console.error('\n❌ Erro durante o build da imagem.');
  process.exit(1);
} finally {
  // Limpeza: remove os arquivos temporários não importa o que aconteça
  if (fs.existsSync(envProductionPath)) fs.unlinkSync(envProductionPath);
  if (fs.existsSync(gcloudIgnorePath)) fs.unlinkSync(gcloudIgnorePath);
  console.log('Arquivos temporários removidos.');
}

// 3. Montar o comando de Deploy
console.log(`\n🚀 Passo 2: Publicando o serviço ${SERVICE_NAME} no Cloud Run...`);

const deployCommand = `gcloud run deploy ${SERVICE_NAME} --image ${imageTag} --platform managed --region ${REGION} --allow-unauthenticated --port 8080`;

try {
  execSync(deployCommand, { stdio: 'inherit' });
  console.log('\n🎉 Deploy finalizado com sucesso!');
} catch (error) {
  console.error('\n❌ Erro durante o deploy no Cloud Run.');
  process.exit(1);
}
