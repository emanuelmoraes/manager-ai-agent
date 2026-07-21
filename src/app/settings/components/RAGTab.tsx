import React, { useRef, useState, useEffect } from "react";
import mammoth from "mammoth";

interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface RAGTabProps {
  docs: KnowledgeDoc[];
  newDoc: { title: string; content: string };
  setNewDoc: React.Dispatch<React.SetStateAction<{ title: string; content: string }>>;
  loadingDocs: boolean;
  indexing: boolean;
  ragLimit: number;
  setRagLimit: (val: number) => void;
  savingRagLimit: boolean;
  handleSaveRagLimit: () => void;
  handleAddDoc: (e: React.FormEvent) => void;
  handleDeleteDoc: (id: string) => void;
}

export function RAGTab({
  docs,
  newDoc,
  setNewDoc,
  loadingDocs,
  indexing,
  ragLimit,
  setRagLimit,
  savingRagLimit,
  handleSaveRagLimit,
  handleAddDoc,
  handleDeleteDoc,
}: RAGTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const processFile = async (file: File) => {
    setExtracting(true);
    const titleWithoutExt = file.name.replace(/\.[^/.]+$/, "");

    try {
      let extractedText = "";

      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        const numPages = pdf.numPages;
        const pagesText = [];
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          pagesText.push(strings.join(" "));
        }
        extractedText = pagesText.join("\n");
      } else if (
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".docx")
      ) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        extractedText = await file.text();
      } else {
        alert("Formato não suportado. Use PDF, DOCX, TXT ou MD.");
        setExtracting(false);
        return;
      }

      setNewDoc({ title: titleWithoutExt, content: extractedText });
    } catch (error) {
      console.error("Erro ao extrair texto do arquivo:", error);
      alert("Erro ao ler o arquivo. Verifique se ele não está corrompido ou protegido por senha.");
    } finally {
      setExtracting(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div style={{ display: "flex", gap: 40, width: "100%", padding: "40px 0", maxWidth: 1200, margin: "0 auto" }}>
      {/* LEFT COLUMN: Indexed Docs & Settings */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 32 }}>

        {/* Top-K Setting */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                Limite de Busca (Top-K)
              </h2>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
                Define o número máximo de fragmentos de texto retornados ao agente para compor o contexto.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="21" x2="4" y2="14"></line>
                  <line x1="4" y1="10" x2="4" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12" y2="3"></line>
                  <line x1="20" y1="21" x2="20" y2="16"></line>
                  <line x1="20" y1="12" x2="20" y2="3"></line>
                  <line x1="1" y1="14" x2="7" y2="14"></line>
                  <line x1="9" y1="8" x2="15" y2="8"></line>
                  <line x1="17" y1="16" x2="23" y2="16"></line>
                </svg>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={ragLimit}
                  onChange={(e) => setRagLimit(Number(e.target.value))}
                  style={{
                    width: 40,
                    background: "transparent",
                    border: "none",
                    color: "#f8fafc",
                    fontSize: "1rem",
                    fontWeight: 600,
                    outline: "none",
                    textAlign: "center",
                  }}
                />
              </div>
              <button
                onClick={handleSaveRagLimit}
                disabled={savingRagLimit}
                style={{
                  padding: "10px 16px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "#f8fafc",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: savingRagLimit ? "not-allowed" : "pointer",
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>

        {/* Indexed Documents */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
              Documentos Indexados
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {loadingDocs ? (
              <p style={{ color: "#94a3b8" }}>Carregando documentos...</p>
            ) : docs.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>Nenhum documento indexado.</p>
            ) : (
              docs.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          background: "rgba(139, 92, 246, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#a78bfa",
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: "1rem", fontWeight: 700, color: "#f8fafc" }}>{doc.title}</span>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>TEXTO EXTRAÍDO</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#cbd5e1",
                      margin: 0,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      lineHeight: 1.5,
                    }}
                  >
                    {doc.content.substring(0, 150)}...
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                      <span style={{ fontSize: "0.75rem", color: "#22c55e" }}>Indexado</span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {new Date(doc.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Index New Content */}
      <div style={{ width: 440, flexShrink: 0 }}>
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
              Indexar Novo Conteúdo
            </h2>
          </div>

          <form onSubmit={handleAddDoc} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `1.5px dashed ${isDragging ? "#a78bfa" : "rgba(255,255,255,0.15)"}`,
                borderRadius: 16,
                padding: "32px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                cursor: "pointer",
                background: isDragging ? "rgba(167, 139, 250, 0.05)" : "transparent",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2c-.7-3-3.2-5.2-6.2-5.6-3-.3-5.9 1.3-7.3 4-1.2 2.5-1 6.5.5 8.8m8.7-1.6V21"></path>
                  <path d="M16 16l-4-4-4 4"></path>
                </svg>
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#e2e8f0", display: "block" }}>
                  {extracting ? "Extraindo texto..." : "Arraste e solte arquivos aqui"}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4, display: "block" }}>
                  PDF, DOCX, TXT, MD (Máx 50MB)
                </span>
              </div>
              <button
                type="button"
                style={{
                  padding: "8px 16px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#f8fafc",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  marginTop: 8,
                }}
              >
                Procurar Arquivo
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept=".pdf,.txt,.docx,.md"
                onChange={onFileChange}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.1em" }}>OU TEXTO MANUAL</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#e2e8f0" }}>Título do Documento *</label>
              <input
                type="text"
                placeholder="Ex: Procedimentos de Vendas 2024"
                value={newDoc.title}
                onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                required
                style={{
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "#f8fafc",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#e2e8f0" }}>Conteúdo *</label>
              <textarea
                placeholder="Cole o texto que deseja indexar..."
                value={newDoc.content}
                onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                required
                style={{
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "#f8fafc",
                  fontSize: "0.9rem",
                  outline: "none",
                  minHeight: 180,
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={indexing}
              style={{
                width: "100%",
                padding: "16px",
                background: indexing ? "rgba(124, 58, 237, 0.4)" : "linear-gradient(135deg, #a78bfa, #8b5cf6)",
                border: "none",
                borderRadius: 12,
                color: "white",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: indexing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 8,
                boxShadow: indexing ? "none" : "0 8px 25px rgba(124, 58, 237, 0.25)",
                transition: "all 0.2s",
              }}
            >
              {indexing ? (
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 1s linear infinite" }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                </svg>
              )}
              Indexar na Base Vetorial
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
