import React, { useRef, useState } from "react";

interface ChatInputProps {
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendChatMessage: () => void;
  chatLoading: boolean;
  agentName: string;
}

export function ChatInput({
  chatInput,
  setChatInput,
  handleSendChatMessage,
  chatLoading,
  agentName,
}: ChatInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock emojis
  const EMOJIS = ["👍", "🚀", "💡", "✅", "🔥", "🤔", "👀", "🙌"];

  const handleEmojiClick = (emoji: string) => {
    setChatInput(chatInput + emoji);
    setShowEmojiPicker(false);
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Mock functionality - just append file name to input for now
      const fileName = e.target.files[0].name;
      setChatInput(chatInput + ` [Anexo: ${fileName}] `);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "8px",
        backdropFilter: "blur(12px)",
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <textarea
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendChatMessage();
          }
        }}
        disabled={chatLoading}
        placeholder={`Type a message to ${agentName}...`}
        style={{
          width: "100%",
          minHeight: "44px",
          maxHeight: "150px",
          background: "transparent",
          border: "none",
          padding: "12px 12px",
          color: "#f8fafc",
          fontSize: "0.9rem",
          outline: "none",
          resize: "none",
          fontFamily: "inherit",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px" }}>
        <div style={{ display: "flex", gap: 8, position: "relative" }}>
          <button
            onClick={handleAttachmentClick}
            disabled={chatLoading}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: chatLoading ? "not-allowed" : "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => !chatLoading && (e.currentTarget.style.color = "#f8fafc")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </button>

          <button
            onClick={() => !chatLoading && setShowEmojiPicker(!showEmojiPicker)}
            disabled={chatLoading}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: chatLoading ? "not-allowed" : "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => !chatLoading && (e.currentTarget.style.color = "#f8fafc")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
          </button>

          {showEmojiPicker && (
            <div
              style={{
                position: "absolute",
                bottom: "40px",
                left: 0,
                background: "rgba(17, 12, 32, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: "8px",
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 4,
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                backdropFilter: "blur(10px)",
                zIndex: 100,
              }}
            >
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    padding: "4px",
                    borderRadius: "4px",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSendChatMessage}
          disabled={chatLoading || !chatInput.trim()}
          style={{
            padding: "8px 16px",
            background: chatLoading || !chatInput.trim() ? "rgba(124,58,237,0.2)" : "linear-gradient(135deg, #a78bfa, #8b5cf6)",
            border: "none",
            borderRadius: 8,
            color: chatLoading || !chatInput.trim() ? "#64748b" : "white",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            boxShadow: chatLoading || !chatInput.trim() ? "none" : "0 4px 14px rgba(139, 92, 246, 0.3)",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
