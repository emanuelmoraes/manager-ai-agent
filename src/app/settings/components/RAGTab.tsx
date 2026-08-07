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
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 w-full py-6 md:py-10 px-4 md:px-0 max-w-6xl mx-auto">
      {/* LEFT COLUMN: Indexed Docs & Settings */}
      <div className="flex-1 flex flex-col gap-8 w-full">

        {/* Top-K Setting */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-50 m-0">
                Limite de Busca (Top-K)
              </h2>
              <p className="text-slate-400 text-xs md:text-sm m-0 mt-1">
                Define o número máximo de fragmentos de texto retornados ao agente para compor o contexto.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl"
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
                  className="w-10 bg-transparent border-none text-slate-50 text-base font-semibold outline-none text-center"
                />
              </div>
              <button
                onClick={handleSaveRagLimit}
                disabled={savingRagLimit}
                className="px-4 py-2 bg-transparent border border-white/10 rounded-xl text-slate-50 text-sm font-semibold cursor-pointer hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>

        {/* Indexed Documents */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <h2 className="text-lg md:text-xl font-bold text-slate-50 m-0">
              Documentos Indexados
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {loadingDocs ? (
              <p className="text-slate-400">Carregando documentos...</p>
            ) : docs.length === 0 ? (
              <p className="text-slate-400">Nenhum documento indexado.</p>
            ) : (
              docs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div
                        className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400 shrink-0"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm md:text-base font-bold text-slate-50">{doc.title}</span>
                        <span className="text-[10px] md:text-xs text-slate-500">TEXTO EXTRAÍDO</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="bg-transparent border-none text-slate-400 cursor-pointer p-1 hover:text-red-400 transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                  <p
                    className="text-xs md:text-sm text-slate-300 m-0 line-clamp-2 leading-relaxed"
                  >
                    {doc.content.substring(0, 150)}...
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] md:text-xs text-green-500">Indexado</span>
                    </div>
                    <span className="text-[10px] md:text-xs text-slate-500">
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
      <div className="w-full lg:w-[440px] shrink-0">
        <div
          className="bg-white/5 border border-white/10 rounded-[24px] p-5 md:p-8 flex flex-col gap-6"
        >
          <div className="flex items-center gap-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <h2 className="text-lg md:text-xl font-bold text-slate-50 m-0">
              Indexar Novo Conteúdo
            </h2>
          </div>

          <form onSubmit={handleAddDoc} className="flex flex-col gap-5">
            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-[1.5px] border-dashed rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${isDragging ? 'border-violet-400 bg-violet-400/5' : 'border-white/15 bg-transparent hover:bg-white/5'}`}
            >
              <div
                className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2c-.7-3-3.2-5.2-6.2-5.6-3-.3-5.9 1.3-7.3 4-1.2 2.5-1 6.5.5 8.8m8.7-1.6V21"></path>
                  <path d="M16 16l-4-4-4 4"></path>
                </svg>
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-slate-200 block">
                  {extracting ? "Extraindo texto..." : "Arraste e solte arquivos aqui"}
                </span>
                <span className="text-xs text-slate-500 mt-1 block">
                  PDF, DOCX, TXT, MD (Máx 50MB)
                </span>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-transparent border border-white/10 rounded-lg text-slate-50 text-xs font-semibold mt-2 hover:bg-white/5 transition-colors"
              >
                Procurar Arquivo
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.txt,.docx,.md"
                onChange={onFileChange}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">OU TEXTO MANUAL</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-200">Título do Documento *</label>
              <input
                type="text"
                placeholder="Ex: Procedimentos de Vendas 2024"
                value={newDoc.title}
                onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                required
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 text-sm outline-none focus:border-violet-400 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-200">Conteúdo *</label>
              <textarea
                placeholder="Cole o texto que deseja indexar..."
                value={newDoc.content}
                onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                required
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 text-sm outline-none min-h-[180px] resize-y font-inherit focus:border-violet-400 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={indexing}
              className={`w-full p-4 border-none rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 mt-2 transition-all ${indexing ? 'bg-violet-600/40 cursor-not-allowed shadow-none' : 'bg-gradient-to-br from-violet-400 to-violet-600 cursor-pointer shadow-[0_8px_25px_rgba(124,58,237,0.25)] hover:scale-[1.02]'}`}
            >
              {indexing ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
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
