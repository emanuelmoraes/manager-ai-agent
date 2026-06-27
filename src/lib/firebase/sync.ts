import { collection, doc, setDoc, deleteDoc, getDocs, getDoc } from "firebase/firestore";
import { db } from "./client";

// Helpers para sincronizar estado local com o Firestore (Backend-as-a-Service)

export async function syncAgentsToFirebase(agents: any[]) {
  // Num sistema real, usaríamos batch ou atualizaríamos apenas o que mudou
  // Para simplicidade, vamos iterar e fazer setDoc
  for (const agent of agents) {
    try {
      await setDoc(doc(db, "agents", agent.id), agent, { merge: true });
    } catch (e) {
      console.error("Erro sync agent:", e);
    }
  }
}

export async function deleteAgentFromFirebase(agentId: string) {
  try {
    await deleteDoc(doc(db, "agents", agentId));
  } catch (e) {
    console.error("Erro delete agent:", e);
  }
}

export async function getAgentsFromFirebase() {
  const snapshot = await getDocs(collection(db, "agents"));
  return snapshot.docs.map(d => d.data());
}

// Chat Sessions
export async function syncSessionToFirebase(session: any) {
  try {
    await setDoc(doc(db, "chat_sessions", session.id), session, { merge: true });
  } catch (e) {
    console.error("Erro sync session:", e);
  }
}

export async function deleteSessionFromFirebase(sessionId: string) {
  try {
    await deleteDoc(doc(db, "chat_sessions", sessionId));
  } catch (e) {
    console.error("Erro delete session:", e);
  }
}

export async function getSessionsFromFirebase() {
  const snapshot = await getDocs(collection(db, "chat_sessions"));
  return snapshot.docs.map(d => d.data());
}

// Chat Messages
export async function syncMessagesToFirebase(sessionId: string, messages: any[]) {
  try {
    await setDoc(doc(db, "chat_messages", sessionId), { messages }, { merge: true });
  } catch (e) {
    console.error("Erro sync messages:", e);
  }
}

export async function deleteMessagesFromFirebase(sessionId: string) {
  try {
    await deleteDoc(doc(db, "chat_messages", sessionId));
  } catch (e) {
    console.error("Erro delete messages:", e);
  }
}

export async function getMessagesFromFirebase() {
  const snapshot = await getDocs(collection(db, "chat_messages"));
  const data: Record<string, any[]> = {};
  snapshot.docs.forEach(d => {
    data[d.id] = d.data().messages || [];
  });
  return data;
}

// Pipeline
export async function syncPipelineToFirebase(pipeline: any[]) {
  try {
    await setDoc(doc(db, "config", "pipeline"), { active: pipeline }, { merge: true });
  } catch (e) {
    console.error("Erro sync pipeline:", e);
  }
}

export async function getPipelineFromFirebase() {
  try {
    const d = await getDoc(doc(db, "config", "pipeline"));
    if (d.exists()) {
      return d.data().active || [];
    }
  } catch (e) {
    console.error("Erro get pipeline:", e);
  }
  return [];
}
