"use client"

import axios from "axios";
import { Trash } from "lucide-react";
import { useEffect, useState, useRef } from "react";

type Section = 'ask' | 'statistics';

interface Message {
  id?: number;
  role: 'user' | 'assistant';
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
  const [activeTab, setActiveTab] = useState<Section>("ask");
  const [chats, setChats] = useState<Chats[]>([]);
  const [chatID, setChatID] = useState("");
  const [chatModel, setChatModel] = useState(false);
  const [newChatName, setNewChatName] = useState<string>("");
  const [deleteChatModel, setDeleteChatModel] = useState(false);
  const [chattoDelete, setChattoDelete] = useState<Number>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const get_chats = async () => {
    try {
      const res = await axios.get("http://localhost:8000/chats");
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
      const res = await axios.get(`http://localhost:8000/chat/${chatID}`);
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
    try {
      const form = new FormData();
      form.append("name", newChatName);
      setChatModel(false);
      await axios.post("http://localhost:8000/chat/create_chat", form);
      window.location.reload();
    } catch (error) {
      console.log("error creating new chat", error);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const submitRequest = async () => {
    if (!query.trim() || !chatID) return;
    setError("");
    const currentQuery = query;
    setQuery("");
    setLoading(true);

    const userMsg: Message = { role: 'user', content: currentQuery };
    setMessages(prev => [...prev, userMsg]);

    const formdata = new FormData();
    formdata.append("chat_id", chatID);
    formdata.append("question", currentQuery);

    try {
      const response = await fetch("http://localhost:8000/get-answer", {
        method: "POST",
        body: formdata,
      });
      if (!response.ok) throw new Error("Failed to connect to server");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";
      if (!reader) throw new Error("No readable stream available");

      setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setLoading(false);
        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: accumulatedResponse };
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
    await axios.delete(`http://localhost:8000/delete/${chattoDelete}`);
    setChatID("");
  };

  // Derived: is the sidebar "expanded" (showing labels)?
  const sidebarExpanded = isSidebarOpen || isMobileSidebarOpen;

  const renderChatSection = () => (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-2 sm:px-4 md:px-0">
      {chatID === "" ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-50">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Start a Chat</h1>
          <p className="text-sm sm:text-base max-w-xs sm:max-w-sm">
            Create a chat or open an existing one to start/resume your chats
          </p>
        </div>
      ) : (
        <div className="flex flex-col h-full w-full">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 scroll-smooth"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-4">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Files Insight</h1>
                <p className="text-sm sm:text-base">Ask a question to start the conversation</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`w-full sm:max-w-[85%] md:max-w-[80%] p-3 sm:p-4 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                }`}>
                  <p className="text-[10px] sm:text-xs font-bold mb-1 opacity-50 uppercase tracking-tighter">
                    {msg.role}
                  </p>
                  <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed break-words">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}

            {loading && messages[messages.length - 1]?.content === "" && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl animate-pulse text-slate-400 text-sm">
                  AI is thinking...
                </div>
              </div>
            )}
          </div>

          <div className="p-3 sm:p-4 md:p-6 bg-slate-950 border-t border-slate-800">
            {error && <p className="text-red-400 text-xs sm:text-sm mb-2 sm:mb-3">{error}</p>}
            <div className="relative flex items-end gap-2 bg-slate-900 rounded-xl border border-slate-700 p-1.5 sm:p-2 focus-within:ring-2 focus-within:ring-blue-600">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitRequest();
                  }
                }}
                placeholder="Ask a question..."
                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 resize-none py-1.5 sm:py-2 px-2 sm:px-3 max-h-28 sm:max-h-32 text-sm sm:text-base"
                rows={1}
              />
              <button
                onClick={submitRequest}
                disabled={loading || !query.trim()}
                className="shrink-0 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-1.5 sm:p-2 rounded-lg transition-colors"
                aria-label="Send message"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <p className="text-[9px] sm:text-[10px] text-center text-slate-500 mt-2 sm:mt-3 uppercase tracking-widest">
              Powered by Files Insight AI
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">

      {/* Mobile backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={[
          "fixed md:relative z-40 md:z-auto",
          "flex-shrink-0 bg-gray-950 border-r border-gray-800 flex flex-col h-full",
          "transition-all duration-300 ease-in-out",
          // Mobile: fixed width, slide in/out via translate
          "w-72",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: override translate, collapse via width
          isSidebarOpen ? "md:translate-x-0 md:w-72" : "md:translate-x-0 md:w-16",
        ].join(" ")}
      >
        <div className="flex flex-col h-full overflow-hidden">

          {/* Sidebar Header */}
          <div className={`flex items-center border-b border-gray-800 h-14 px-3 ${sidebarExpanded ? "justify-between" : "justify-center"}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                FI
              </div>
              {sidebarExpanded && (
                <h1 className="text-sm font-semibold tracking-tight text-slate-100 whitespace-nowrap">
                  Files Insight
                </h1>
              )}
            </div>

            {/* Desktop collapse toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex p-2 rounded-lg text-gray-500 hover:bg-gray-800 hover:text-gray-200 transition-all flex-shrink-0"
            >
              {isSidebarOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              )}
            </button>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-800 hover:text-gray-200 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* New Chat Button */}
          <div className={`px-3 py-3 border-b border-gray-800 ${!sidebarExpanded ? "flex justify-center" : ""}`}>
            <button
              onClick={() => {
                setMessages([]);
                setChatID("");
                setChatModel(true);
                setIsMobileSidebarOpen(false);
              }}
              className={`flex items-center gap-3 rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-800 hover:border-gray-700 transition-all group ${
                sidebarExpanded ? "w-full px-4 py-2.5" : "w-10 h-10 justify-center p-0"
              }`}
              title={!sidebarExpanded ? "New Chat" : undefined}
            >
              <div className={`rounded-md bg-blue-600/10 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all flex-shrink-0 ${sidebarExpanded ? "p-1" : "p-2"}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              {sidebarExpanded && (
                <span className="text-sm font-medium text-gray-200 whitespace-nowrap">New Chat</span>
              )}
            </button>
          </div>

          {/* Chat List */}
          <nav className="flex-1 overflow-y-auto py-3 px-2">
            {sidebarExpanded && (
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.1em] px-3 mb-2">
                Recent activity
              </p>
            )}
            <div className="space-y-0.5">
              {chats && chats.length > 0 ? (
                chats.map((chat) => (
                  <div key={chat.id} className="group relative flex items-center">
                    <button
                      onClick={() => {
                        setChatID(chat.id.toString());
                        setIsMobileSidebarOpen(false);
                      }}
                      className={[
                        "flex items-center gap-3 rounded-lg text-sm transition-all relative w-full",
                        sidebarExpanded ? "px-3 py-2.5" : "py-2.5 justify-center",
                        chatID === chat.id.toString()
                          ? "bg-blue-600/10 text-blue-400 font-medium"
                          : "text-gray-400 hover:bg-gray-900 hover:text-gray-200",
                      ].join(" ")}
                      title={!sidebarExpanded ? (chat.name || "New Conversation") : undefined}
                    >
                      {sidebarExpanded && chatID === chat.id.toString() && (
                        <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-blue-500 rounded-full" />
                      )}
                      <svg
                        className={`w-4 h-4 flex-shrink-0 ${chatID === chat.id.toString() ? "text-blue-400" : "text-gray-600"}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      {sidebarExpanded && (
                        <span className="truncate pr-6">{chat.name || "New Conversation"}</span>
                      )}
                    </button>

                    {sidebarExpanded && (
                      <button
                        onClick={() => { setDeleteChatModel(true); setChattoDelete(chat.id); }}
                        className="absolute right-2 p-1.5 rounded-md text-gray-600 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash size={14} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                sidebarExpanded ? (
                  <div className="py-10 text-center">
                    <p className="text-xs text-gray-600 italic">No conversations yet</p>
                  </div>
                ) : null
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className={`border-t border-gray-800 bg-[#080808] p-3 ${!sidebarExpanded ? "flex justify-center" : ""}`}>
            <div className={`flex items-center gap-3 ${sidebarExpanded ? "px-2" : ""}`}>
              <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex-shrink-0" />
              {sidebarExpanded && (
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-medium text-gray-200 truncate">Pro User</p>
                  <p className="text-[10px] text-gray-500 truncate">Settings & Profile</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a] min-w-0">

        <header className="bg-black/40 backdrop-blur-xl border-b border-gray-800/50 py-3 md:py-4 px-4 md:px-8 flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-800 hover:text-gray-200 transition-all flex-shrink-0"
            aria-label="Open sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-300 uppercase tracking-widest truncate">
              {activeTab === "ask" ? "Intelligence Portal" : "Analytics Engine"}
            </h2>
            <p className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">Model: Llama 3.2 (Local)</p>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          {activeTab === "ask" ? renderChatSection() : <div>Analytics Content</div>}
        </main>
      </div>

      {/* ── CREATE CHAT MODAL ── */}
      {chatModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-5 sm:p-6 rounded-2xl shadow-2xl">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 sm:mb-2">Create New Chat</h3>
            <p className="text-slate-400 text-xs sm:text-sm mb-5 sm:mb-6">
              Give your conversation a title to stay organized.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Chat Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  placeholder="e.g., Biology Research, Project Alpha..."
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateChat(); }}
                />
              </div>
              <div className="flex gap-3 mt-6 sm:mt-8">
                <button
                  onClick={() => { setChatModel(false); setNewChatName(""); }}
                  className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm sm:text-base font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChat}
                  disabled={!newChatName.trim()}
                  className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm sm:text-base font-bold transition-all shadow-lg shadow-blue-900/20"
                >
                  Create Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CHAT MODAL ── */}
      {deleteChatModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm p-5 sm:p-6 rounded-2xl shadow-[0_0_50px_-12px_rgba(220,38,38,0.2)]">
            <div className="flex flex-col items-center text-center mb-5 sm:mb-6">
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <Trash size={22} className="text-red-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Delete Chat?</h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-2">
                This action cannot be undone. All messages in this conversation will be permanently removed.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setDeleteChatModel(false)}
                className="flex-1 order-2 sm:order-1 py-2.5 sm:py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm sm:text-base font-medium transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handle_delete_chat();
                  setDeleteChatModel(false);
                  window.location.reload();
                }}
                className="flex-1 order-1 sm:order-2 py-2.5 sm:py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm sm:text-base font-bold transition-all active:scale-95 shadow-lg shadow-red-900/20"
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