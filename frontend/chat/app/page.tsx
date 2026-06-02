"use client"

import axios from "axios";
import {
  Trash2,
  Plus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Send,
  Sparkles,
  Bot,
  User,
  AlertCircle,
  X,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getToken, useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

interface Chats {
  id: number;
  name: string;
  created_at: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [chats, setChats] = useState<Chats[]>([]);
  const [chatID, setChatID] = useState("");
  const [chatModel, setChatModel] = useState(false);
  const [newChatName, setNewChatName] = useState<string>("");
  const [deleteChatModel, setDeleteChatModel] = useState(false);
  const [chattoDelete, setChattoDelete] = useState<Number>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useUser();

  const getAuthHeaders = async () => {
    const t = await getToken();
    if (!t) throw new Error("No token available");
    return { Authorization: `Bearer ${t}` };
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const NEXT_API_URL = process.env.NEXT_PUBLIC_API_URL;

  const get_chats = async () => {
    try {
      const res = await axios.get(`${NEXT_API_URL}/chats`, {
        headers: await getAuthHeaders(),
      });
      setChats(res.data);
    } catch (error) {
      console.log("error in getting the chats", error);
    }
  };

  useEffect(() => {
    get_chats();
  }, []);

  const get_chat_ID = async () => {
    if (!chatID) return;
    setLoading(true);
    try {
      const res = await axios.get(`${NEXT_API_URL}/chat/${chatID}`, {
        headers: await getAuthHeaders(),
      });
      setMessages(res.data);
    } catch (error) {
      console.log("error fetching chat", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    get_chat_ID();
  }, [chatID]);

  const handleCreateChat = async () => {
    if (!newChatName.trim()) return;
    try {
      const form = new FormData();
      form.append("name", newChatName);
      setChatModel(false);
      setNewChatName("");
      await axios.post(`${NEXT_API_URL}/chat/create_chat`, form, {
        headers: await getAuthHeaders(),
      });
      await get_chats();
    } catch (error) {
      console.log("error creating new chat", error);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [query]);

  const submitRequest = async () => {
    if (!query.trim() || !chatID) return;
    setError("");
    const currentQuery = query;
    setQuery("");
    setLoading(true);

    const userMsg: Message = { role: "user", content: currentQuery };
    setMessages((prev) => [...prev, userMsg]);

    const formdata = new FormData();
    formdata.append("chat_id", chatID);
    formdata.append("question", currentQuery);

    try {
      const response = await fetch(`${NEXT_API_URL}/get-answer`, {
        method: "POST",
        body: formdata,
        headers: await getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to connect to server");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";
      if (!reader) throw new Error("No readable stream available");

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setLoading(false);
        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: accumulatedResponse,
          };
          return updated;
        });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handle_delete_chat = async () => {
    try {
      await axios.delete(`${NEXT_API_URL}/delete/${chattoDelete}`, {
        headers: await getAuthHeaders(),
      });
      setChatID("");
      setMessages([]);
      await get_chats();
    } catch (err) {
      console.log("error deleting chat", err);
    }
  };

  const selectedChat = chats.find((c) => c.id.toString() === chatID);
  const sidebarExpanded = isSidebarOpen;

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>

      {/* ── Mobile backdrop ── */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 animate-fade-in"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ══════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════ */}
      <aside
        style={{
          background: "var(--surface-0)",
          borderRight: "1px solid var(--border-subtle)",
          transition: "width 300ms cubic-bezier(0.4,0,0.2,1), transform 300ms ease",
        }}
        className={[
          "fixed md:relative z-40 md:z-auto top-0 left-0 h-full flex flex-col shrink-0",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          sidebarExpanded ? "w-[260px]" : "w-[100px]",
        ].join(" ")}
      >
        <div className="flex flex-col h-full overflow-hidden">

          {/* ── Top action row: New Chat + Collapse toggle ── */}
          <div
            className="flex items-center gap-2 px-3 py-3 shrink-0"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            {/* New Chat Button */}
            <button
              onClick={() => {
                setMessages([]);
                setChatID("");
                setChatModel(true);
                setIsMobileSidebarOpen(false);
              }}
              className={[
                "flex items-center rounded-xl transition-all duration-200",
                sidebarExpanded ? "flex-1 px-3 py-2.5 gap-3" : "w-10 h-10 justify-center",
              ].join(" ")}
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-default)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-3)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-strong)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-default)";
              }}
              title={!sidebarExpanded ? "New Chat" : undefined}
            >
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all duration-200"
                style={{ background: "var(--accent-muted)", color: "var(--accent)" }}
              >
                <Plus size={14} />
              </div>
              {sidebarExpanded && (
                <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                  New Chat
                </span>
              )}
            </button>

            {/* Desktop collapse toggle — sits right of New Chat */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex w-9 h-9 items-center justify-center rounded-xl shrink-0 transition-all duration-200"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-default)",
                color: "var(--text-tertiary)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-3)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-strong)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-default)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-tertiary)";
              }}
              title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarExpanded ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
            </button>

            {/* Mobile close */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl shrink-0 transition-all"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-default)",
                color: "var(--text-tertiary)",
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Chat List */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            {sidebarExpanded && (
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.08em] px-3 mb-2"
                style={{ color: "var(--text-tertiary)" }}
              >
                Recent
              </p>
            )}

            {chats && chats.length > 0 ? (
              chats.map((chat) => {
                const isActive = chatID === chat.id.toString();
                return (
                  <div key={chat.id} className="group relative flex items-center">
                    <button
                      onClick={() => {
                        setChatID(chat.id.toString());
                        setIsMobileSidebarOpen(false);
                      }}
                      className={[
                        "relative flex items-center gap-3 rounded-lg text-[13px] transition-all duration-200 w-full",
                        sidebarExpanded ? "px-3 py-2.5" : "py-2.5 justify-center",
                      ].join(" ")}
                      style={{
                        background: isActive ? "var(--accent-muted)" : "transparent",
                        color: isActive ? "var(--accent-hover)" : "var(--text-tertiary)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)";
                          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-tertiary)";
                        }
                      }}
                      title={!sidebarExpanded ? (chat.name || "Conversation") : undefined}
                    >
                      {isActive && sidebarExpanded && (
                        <div
                          className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full"
                          style={{ background: "var(--accent)" }}
                        />
                      )}
                      <MessageSquare
                        size={15}
                        className="shrink-0"
                        style={{ color: isActive ? "var(--accent)" : "var(--text-tertiary)" }}
                      />
                      {sidebarExpanded && (
                        <span className={`truncate pr-5 ${isActive ? "font-medium" : ""}`}>
                          {chat.name || "New Conversation"}
                        </span>
                      )}
                    </button>

                    {sidebarExpanded && (
                      <button
                        onClick={() => {
                          setDeleteChatModel(true);
                          setChattoDelete(chat.id);
                        }}
                        className="absolute right-2 w-6 h-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200"
                        style={{ color: "var(--text-tertiary)" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "var(--danger-muted)";
                          (e.currentTarget as HTMLButtonElement).style.color = "var(--danger)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-tertiary)";
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              sidebarExpanded ? (
                <div className="py-10 text-center px-4">
                  <div
                    className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                    style={{ background: "var(--surface-3)", border: "1px solid var(--border-default)" }}
                  >
                    <MessageSquare size={20} style={{ color: "var(--text-tertiary)" }} />
                  </div>
                  <p className="text-[12px] italic" style={{ color: "var(--text-tertiary)" }}>
                    No conversations yet
                  </p>
                </div>
              ) : null
            )}
          </nav>

          {/* Footer / User */}
          <div
            className="shrink-0 p-3"
            style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--surface-0)" }}
          >
            <div className={`flex items-center gap-3 ${sidebarExpanded ? "px-1" : "justify-center"}`}>
              <UserButton
                afterSwitchSessionUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 rounded-full ring-2 ring-[var(--accent)]/30 ring-offset-1 ring-offset-[var(--surface-0)] hover:ring-[var(--accent)]/60 transition-all",
                  },
                }}
              />
              {sidebarExpanded && user && (
                <div className="flex-1 overflow-hidden animate-fade-in">
                  <p className="text-[12px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {user.fullName || user.firstName || "User"}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: "var(--text-tertiary)" }}>
                    {user.primaryEmailAddress?.emailAddress || ""}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ background: "var(--surface-1)" }}>

        {/* ── Top Header ── */}
        <header
          className="shrink-0 flex items-center gap-3 h-14 px-4 md:px-6"
          style={{
            background: "rgba(9,9,11,0.85)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-md transition-all"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
            aria-label="Open sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            {selectedChat ? (
              <div className="animate-fade-in">
                <h2 className="text-[13px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  {selectedChat.name}
                </h2>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
                  {messages.length} message{messages.length !== 1 ? "s" : ""}
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-[13px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                  Intelligence Portal
                </h2>

              </div>
            )}
          </div>


        </header>

        {/* ── Chat Body ── */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {chatID === "" ? (
            /* ── No chat selected ── */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 animate-fade-in">
              <div
                className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                style={{
                  background: "var(--accent-muted)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  boxShadow: "0 0 40px rgba(99,102,241,0.08)",
                }}
              >
                <Sparkles size={32} style={{ color: "var(--accent-hover)" }} />
              </div>
              <h1 className="text-[22px] font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Start a Conversation
              </h1>
              <p className="text-[13px] max-w-xs leading-relaxed mb-8" style={{ color: "var(--text-tertiary)" }}>
                Create a new chat or select an existing one to ask questions about your uploaded files.
              </p>
              <button
                onClick={() => setChatModel(true)}
                className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-medium text-white transition-all duration-200"
                style={{
                  background: "var(--accent)",
                  boxShadow: "0 4px 16px var(--accent-muted)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
              >
                <Plus size={16} />
                New Chat
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6"
              >
                {messages.length === 0 && !loading && (
                  <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in py-20">
                    <div
                      className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center"
                      style={{ background: "var(--surface-3)", border: "1px solid var(--border-default)" }}
                    >
                      <Bot size={24} style={{ color: "var(--text-tertiary)" }} />
                    </div>
                    <h3 className="text-[15px] font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                      Files Insight
                    </h3>
                    <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
                      Ask a question to start the conversation
                    </p>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 animate-slide-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    style={{ animationDelay: `${idx * 20}ms` }}
                  >
                    {/* Avatar — assistant */}
                    {msg.role === "assistant" && (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "var(--accent-muted)", border: "1px solid rgba(99,102,241,0.2)" }}
                      >
                        <Bot size={15} style={{ color: "var(--accent-hover)" }} />
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className="max-w-[80%] rounded-2xl px-4 py-3"
                      style={
                        msg.role === "user"
                          ? {
                            background: "var(--accent)",
                            color: "#fff",
                            borderTopRightRadius: "6px",
                            boxShadow: "0 2px 12px var(--accent-muted)",
                          }
                          : {
                            background: "var(--surface-2)",
                            border: "1px solid var(--border-default)",
                            color: "var(--text-primary)",
                            borderTopLeftRadius: "6px",
                          }
                      }
                    >
                      <p
                        className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 opacity-60"
                      >
                        {msg.role === "user" ? "You" : "AI"}
                      </p>
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                        {/* Blinking cursor for streaming */}
                        {msg.role === "assistant" && loading && idx === messages.length - 1 && msg.content === "" && (
                          <span className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse" style={{ background: "var(--accent)" }} />
                        )}
                      </p>
                    </div>

                    {/* Avatar — user */}
                    {msg.role === "user" && (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "var(--surface-3)", border: "1px solid var(--border-default)" }}
                      >
                        <User size={15} style={{ color: "var(--text-secondary)" }} />
                      </div>
                    )}
                  </div>
                ))}

                {/* AI thinking indicator */}
                {loading && messages[messages.length - 1]?.content === "" && (
                  <div className="flex gap-3 justify-start animate-slide-up">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "var(--accent-muted)", border: "1px solid rgba(99,102,241,0.2)" }}
                    >
                      <Bot size={15} style={{ color: "var(--accent-hover)" }} />
                    </div>
                    <div
                      className="px-4 py-3 rounded-2xl flex items-center gap-2"
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--border-default)",
                        borderTopLeftRadius: "6px",
                      }}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60 mr-1" style={{ color: "var(--text-secondary)" }}>AI</span>
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full animate-pulse-subtle"
                          style={{ background: "var(--accent)", animationDelay: `${i * 200}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Input Area ── */}
              <div
                className="shrink-0 px-4 md:px-8 py-4"
                style={{
                  background: "rgba(9,9,11,0.85)",
                  backdropFilter: "blur(16px)",
                  borderTop: "1px solid var(--border-subtle)",
                }}
              >
                {error && (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3 text-[12px] animate-slide-down"
                    style={{
                      background: "var(--danger-muted)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "var(--danger)",
                    }}
                  >
                    <AlertCircle size={13} />
                    {error}
                  </div>
                )}

                <div
                  className="relative flex items-end gap-2 rounded-xl p-2 transition-all duration-200"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border-default)",
                  }}
                  onFocus={() => { }}
                >
                  <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submitRequest();
                      }
                    }}
                    placeholder="Ask a question about your files..."
                    className="flex-1 bg-transparent border-none outline-none resize-none py-1.5 px-2 text-[13px] leading-relaxed"
                    style={{
                      color: "var(--text-primary)",
                      minHeight: "36px",
                      maxHeight: "120px",
                    }}
                    rows={1}
                  />

                  <button
                    onClick={submitRequest}
                    disabled={loading || !query.trim()}
                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: "var(--accent)" }}
                    onMouseEnter={(e) => {
                      if (!loading && query.trim()) (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
                    }}
                    aria-label="Send message"
                  >
                    <Send size={15} />
                  </button>
                </div>

                <p
                  className="text-[10px] text-center mt-2 uppercase tracking-widest"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Shift + Enter for new line · Enter to send
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ══════════════════════════════════════════
          CREATE CHAT MODAL
      ══════════════════════════════════════════ */}
      {chatModel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="w-full max-w-md p-6 rounded-2xl shadow-2xl animate-scale-in"
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--accent-muted)" }}
                >
                  <Plus size={17} style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
                    Create New Chat
                  </h3>
                  <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                    Give your conversation a title
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setChatModel(false); setNewChatName(""); }}
                className="w-7 h-7 flex items-center justify-center rounded-md transition-all"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-3)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-tertiary)";
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-5">
              <label
                className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-2"
                style={{ color: "var(--text-tertiary)" }}
              >
                Chat Name
              </label>
              <input
                type="text"
                autoFocus
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateChat(); }}
                placeholder="e.g., Biology Research, Project Alpha..."
                className="w-full h-10 px-3 rounded-lg text-[13px] outline-none transition-all duration-200"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--border-strong)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setChatModel(false); setNewChatName(""); }}
                className="flex-1 h-10 rounded-lg text-[13px] font-medium transition-all"
                style={{
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-3)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChat}
                disabled={!newChatName.trim()}
                className="flex-1 h-10 rounded-lg text-white text-[13px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: "var(--accent)", boxShadow: "0 2px 12px var(--accent-muted)" }}
                onMouseEnter={(e) => {
                  if (newChatName.trim()) (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
                }}
              >
                Create Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          DELETE CHAT MODAL
      ══════════════════════════════════════════ */}
      {deleteChatModel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="w-full max-w-sm p-6 rounded-2xl shadow-2xl animate-scale-in"
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--danger-muted)" }}
                >
                  <AlertTriangle size={17} style={{ color: "var(--danger)" }} />
                </div>
                <h3 className="text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  Delete Chat?
                </h3>
              </div>
              <button
                onClick={() => setDeleteChatModel(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md transition-all"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-3)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-tertiary)";
                }}
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-[13px] leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
              This action cannot be undone. All messages in this conversation will be{" "}
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>permanently removed</span>.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteChatModel(false)}
                className="flex-1 h-10 rounded-lg text-[13px] font-medium transition-all"
                style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-3)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handle_delete_chat();
                  setDeleteChatModel(false);
                }}
                className="flex-1 h-10 rounded-lg text-white text-[13px] font-medium transition-all"
                style={{ background: "var(--danger)", boxShadow: "0 2px 12px var(--danger-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.15)")}
                onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}