import React, { useRef, useState } from "react";
import mammoth from "mammoth";
import {
  FiFolder,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUploadCloud,
  FiFileText,
  FiCheckCircle,
  FiSliders,
  FiDatabase,
} from "react-icons/fi";
import type { KnowledgeBase } from "@/types/knowledge";

export interface KnowledgeDocItem {
  id: string;
  knowledgeBaseId: string;
  title: string;
  content: string;
  createdAt: any;
}

interface RAGTabProps {
  bases: KnowledgeBase[];
  selectedBaseId: string | null;
  onSelectBase: (id: string) => void;
  onOpenCreateBase: () => void;
  onOpenUpdateBase: (base: KnowledgeBase) => void;
  onOpenDeleteBase: (base: KnowledgeBase) => void;
  docs: KnowledgeDocItem[];
  newDoc: { title: string; content: string };
  setNewDoc: React.Dispatch<React.SetStateAction<{ title: string; content: string }>>;
  loadingBases: boolean;
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
  bases,
  selectedBaseId,
  onSelectBase,
  onOpenCreateBase,
  onOpenUpdateBase,
  onOpenDeleteBase,
  docs,
  newDoc,
  setNewDoc,
  loadingBases,
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

  const selectedBase = bases.find((b) => b.id === selectedBaseId) || null;

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

  const formatDocDate = (dateVal: any) => {
    if (!dateVal) return "";
    try {
      if (typeof dateVal?.toDate === "function") {
        return dateVal.toDate().toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return new Date(dateVal).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full py-4 md:py-6 px-4 md:px-0 max-w-6xl mx-auto">
      {/* 1. SELETOR E GERENCIAMENTO DE BASES DE CONHECIMENTO */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center">
              <FiDatabase size={20} />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-100 m-0">
                Bases de Conhecimento
              </h2>
              <p className="text-xs text-slate-400 m-0">
                Organize seus documentos por categoria (ex: Vendas, Administração, Turismo)
              </p>
            </div>
          </div>
          <button
            onClick={onOpenCreateBase}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs md:text-sm font-semibold border-none cursor-pointer flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <FiPlus size={16} /> Nova Base
          </button>
        </div>

        {/* LISTA DE ABAS / BASES */}
        {loadingBases ? (
          <p className="text-slate-400 text-xs py-2">Carregando bases de conhecimento...</p>
        ) : bases.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            Nenhuma base de conhecimento cadastrada. Clique em &quot;Nova Base&quot; para começar.
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {bases.map((base) => {
              const isSelected = base.id === selectedBaseId;
              return (
                <button
                  key={base.id}
                  onClick={() => onSelectBase(base.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2.5 cursor-pointer whitespace-nowrap transition-all border ${
                    isSelected
                      ? "bg-violet-600/20 border-violet-500/50 text-violet-200 shadow-sm"
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                  }`}
                >
                  <FiFolder size={16} className={isSelected ? "text-violet-400" : "text-slate-500"} />
                  <span>{base.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* DETALHES DA BASE SELECIONADA & AÇÕES (EDIT / DELETE) */}
        {selectedBase && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3.5 mt-1">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-slate-200">{selectedBase.name}</span>
              <span className="text-[11px] text-slate-400">
                {selectedBase.description || "Sem descrição definida."}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onOpenUpdateBase(selectedBase)}
                title="Editar Base"
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <FiEdit2 size={13} /> Editar
              </button>
              <button
                onClick={() => onOpenDeleteBase(selectedBase)}
                title="Excluir Base"
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <FiTrash2 size={13} /> Excluir
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. ÁREA DE DOCUMENTOS & INDEXAÇÃO DENTRO DA BASE SELECIONADA */}
      {selectedBase ? (
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 w-full">
          {/* COLUNA ESQUERDA: Documentos Indexados e Configuração Top-K */}
          <div className="flex-1 flex flex-col gap-8 w-full">
            {/* Top-K Setting */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base md:text-lg font-bold text-slate-100 m-0 flex items-center gap-2">
                    <FiSliders size={18} className="text-slate-400" />
                    Limite de Busca (Top-K)
                  </h2>
                  <p className="text-slate-400 text-xs m-0 mt-1">
                    Número máximo de fragmentos relevantes retornados ao agente para compor o contexto.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={ragLimit}
                      onChange={(e) => setRagLimit(Number(e.target.value))}
                      className="w-10 bg-transparent border-none text-slate-100 text-sm font-semibold outline-none text-center"
                    />
                  </div>
                  <button
                    onClick={handleSaveRagLimit}
                    disabled={savingRagLimit}
                    className="px-3.5 py-1.5 bg-transparent border border-white/10 rounded-xl text-slate-200 text-xs font-semibold cursor-pointer hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>

            {/* Documentos Indexados */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base md:text-lg font-bold text-slate-100 m-0 flex items-center gap-2">
                  <FiFileText size={18} className="text-slate-400" />
                  Documentos em &quot;{selectedBase.name}&quot; ({docs.length})
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                {loadingDocs ? (
                  <p className="text-slate-400 text-xs">Carregando documentos...</p>
                ) : docs.length === 0 ? (
                  <div className="text-slate-400 text-xs p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                    Nenhum documento indexado nesta base de conhecimento ainda.
                  </div>
                ) : (
                  docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400 shrink-0">
                            <FiFileText size={20} />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-slate-100">{doc.title}</span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                              TEXTO INDEXADO
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="bg-transparent border-none text-slate-400 cursor-pointer p-1 hover:text-red-400 transition-colors"
                          title="Excluir Documento"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 m-0 line-clamp-2 leading-relaxed">
                        {doc.content.substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1.5">
                          <FiCheckCircle size={13} className="text-green-500" />
                          <span className="text-[10px] text-green-500">Indexado</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{formatDocDate(doc.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: Formulário de Upload e Indexação Manual */}
          <div className="w-full lg:w-[420px] shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 flex flex-col gap-5">
              <div className="flex items-center gap-2.5">
                <FiUploadCloud size={22} className="text-violet-400" />
                <h2 className="text-base md:text-lg font-bold text-slate-100 m-0">
                  Indexar em &quot;{selectedBase.name}&quot;
                </h2>
              </div>

              <form onSubmit={handleAddDoc} className="flex flex-col gap-4">
                {/* Drag and Drop */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-[1.5px] border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                    isDragging ? "border-violet-400 bg-violet-400/5" : "border-white/15 bg-transparent hover:bg-white/5"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                    <FiUploadCloud size={20} />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-semibold text-slate-200 block">
                      {extracting ? "Extraindo texto..." : "Arraste e solte arquivos aqui"}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      PDF, DOCX, TXT, MD
                    </span>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-transparent border border-white/10 rounded-lg text-slate-100 text-xs font-semibold mt-1 hover:bg-white/5"
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

                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] font-bold text-slate-500 tracking-wider">OU DIGITE</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Título do Documento *</label>
                  <input
                    type="text"
                    placeholder="Ex: Manual de Vendas e FAQ"
                    value={newDoc.title}
                    onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                    required
                    className="px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-100 text-sm outline-none focus:border-violet-400"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Conteúdo *</label>
                  <textarea
                    placeholder="Cole ou insira o texto que deseja indexar..."
                    value={newDoc.content}
                    onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                    required
                    rows={6}
                    className="px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-100 text-sm outline-none resize-y font-inherit focus:border-violet-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={indexing || extracting}
                  className={`w-full py-3 border-none rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 mt-2 transition-all ${
                    indexing || extracting
                      ? "bg-violet-600/40 cursor-not-allowed"
                      : "bg-violet-600 hover:bg-violet-500 cursor-pointer shadow-lg shadow-violet-600/20"
                  }`}
                >
                  {indexing ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <FiDatabase size={16} />
                  )}
                  <span>Indexar nesta Base</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl text-slate-400 text-sm">
          Selecione uma base de conhecimento acima para visualizar e gerenciar os documentos indexados.
        </div>
      )}
    </div>
  );
}
