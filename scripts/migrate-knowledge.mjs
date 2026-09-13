/**
 * Script de Migração: Múltiplas Bases de Conhecimento
 * 
 * Executa a migração do acervo legado para a nova estrutura de dados:
 * 1. Cria ou valida a base de conhecimento "Vendas" (id: "kb_vendas") na coleção 'knowledge_bases'.
 * 2. Atualiza todos os documentos e fragmentos na coleção 'knowledge' associando-os a "kb_vendas"
 *    e convertendo timestamps legado para Timestamp oficial do Firestore.
 * 3. Atualiza os agentes existentes no Firestore que ainda não possuem 'knowledgeBaseId',
 *    vinculando-os à base "kb_vendas".
 * 
 * Como executar:
 * node scripts/migrate-knowledge.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- Iniciando Migração para Múltiplas Bases de Conhecimento ---');

// 1. Carregar variáveis de ambiente do .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Arquivo .env.local não encontrado no projeto!');
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8').replace(/\0/g, '');
const envVars = {};

envContent.split('\n').forEach((line) => {
  line = line.trim();
  if (!line || line.startsWith('#')) return;
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.substring(1, val.length - 1);
    }
    envVars[key] = val;
  }
});

const projectId = envVars['FIREBASE_PROJECT_ID'] || envVars['NEXT_PUBLIC_FIREBASE_PROJECT_ID'];
const clientEmail = envVars['FIREBASE_CLIENT_EMAIL'];
const privateKey = envVars['FIREBASE_PRIVATE_KEY']
  ? envVars['FIREBASE_PRIVATE_KEY'].replace(/\\n/g, '\n')
  : undefined;

if (!projectId || !clientEmail || !privateKey) {
  console.error('Credenciais do Firebase Admin ausentes no .env.local!');
  console.error('Necessário: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  process.exit(1);
}

// 2. Inicializar Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = getFirestore();

async function runMigration() {
  try {
    const now = Timestamp.now();
    const VENDAS_BASE_ID = 'kb_vendas';

    // 3. Criar ou verificar a base 'Vendas'
    console.log(`\n1. Verificando base de conhecimento "Vendas" (${VENDAS_BASE_ID})...`);
    const baseRef = db.collection('knowledge_bases').doc(VENDAS_BASE_ID);
    const baseSnap = await baseRef.get();

    if (!baseSnap.exists) {
      await baseRef.set({
        id: VENDAS_BASE_ID,
        name: 'Vendas',
        description: 'Base de conhecimento de procedimentos, produtos e vendas migrada do acervo existente.',
        color: '#8b5cf6',
        createdAt: now,
        updatedAt: now,
      });
      console.log('Base "Vendas" criada com sucesso no Firestore!');
    } else {
      console.log('Base "Vendas" já existe no Firestore.');
    }

    // 4. Migrar documentos existentes da coleção 'knowledge'
    console.log('\n2. Migrando documentos e fragmentos da coleção "knowledge"...');
    const knowledgeSnap = await db.collection('knowledge').get();
    console.log(`Total de registros encontrados em "knowledge": ${knowledgeSnap.size}`);

    let docsMigratedCount = 0;
    let batch = db.batch();
    let batchOpCount = 0;

    for (const docSnap of knowledgeSnap.docs) {
      const data = docSnap.data();

      // Migra se não possui knowledgeBaseId ou se createdAt for string
      const needsBaseId = !data.knowledgeBaseId;
      const needsTimestampFix = typeof data.createdAt === 'string';

      if (needsBaseId || needsTimestampFix) {
        let docCreatedAt = data.createdAt;
        if (typeof docCreatedAt === 'string') {
          const parsedDate = new Date(docCreatedAt);
          docCreatedAt = !isNaN(parsedDate.getTime()) ? Timestamp.fromDate(parsedDate) : now;
        } else if (!docCreatedAt) {
          docCreatedAt = now;
        }

        batch.update(docSnap.ref, {
          knowledgeBaseId: data.knowledgeBaseId || VENDAS_BASE_ID,
          createdAt: docCreatedAt,
        });

        docsMigratedCount++;
        batchOpCount++;

        // Limite de operações por batch no Firestore é 500
        if (batchOpCount >= 450) {
          await batch.commit();
          batch = db.batch();
          batchOpCount = 0;
        }
      }
    }

    if (batchOpCount > 0) {
      await batch.commit();
    }
    console.log(`Documentos e fragmentos migrados para a base "Vendas": ${docsMigratedCount}`);

    // 5. Vincular agentes existentes sem base definida à base 'Vendas'
    console.log('\n3. Verificando vinculação dos agentes na coleção "agents"...');
    const agentsSnap = await db.collection('agents').get();
    let agentsUpdatedCount = 0;

    if (!agentsSnap.empty) {
      const agentBatch = db.batch();
      for (const agentDoc of agentsSnap.docs) {
        const agentData = agentDoc.data();
        if (!agentData.knowledgeBaseId) {
          agentBatch.update(agentDoc.ref, {
            knowledgeBaseId: VENDAS_BASE_ID,
          });
          agentsUpdatedCount++;
        }
      }

      if (agentsUpdatedCount > 0) {
        await agentBatch.commit();
      }
    }
    console.log(`Agentes vinculados à base "Vendas": ${agentsUpdatedCount}`);

    console.log('\n--- MIGRAÇÃO CONCLUÍDA COM SUCESSO! ---');
  } catch (error) {
    console.error('\nFalha durante a execução da migração:', error);
    process.exit(1);
  }
}

runMigration();
