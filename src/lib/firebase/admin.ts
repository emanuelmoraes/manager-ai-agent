import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    if (process.env.FIREBASE_PRIVATE_KEY) {
      // Ambiente local com chaves explícitas
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else if (process.env.K_SERVICE || process.env.NODE_ENV === 'production') {
      // No Google Cloud Run (identificado por K_SERVICE) não precisamos de chaves!
      // Ele usa automaticamente a Service Account nativa da máquina.
      console.log("Inicializando Firebase via Application Default Credentials (GCP)...");
      initializeApp();
    } else {
      console.warn("Variáveis de ambiente do Firebase Admin não encontradas. Inicializando com dummy project ID para permitir o build.");
      initializeApp({ projectId: "demo-project-build" });
    }
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

let adminDb: any;
try {
  adminDb = getFirestore();
} catch (e) {
  console.error("Falha ao carregar Firestore. O app pode não ter sido inicializado.", e);
}

export { adminDb };
