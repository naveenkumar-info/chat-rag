"use client"

import axios from "axios";
import { useEffect, useState, useRef } from "react";

type Section = 'ask' | 'statistics';

interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface Chats{
  
    id: number,
    name: string,
    created_at: string
  
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Section>("ask");
  const [chats,setChats] = useState<Chats[]>([]);
  const [chatID,setChatID] = useState("");
  const [chatModel,setChatModel] = useState(false);
  const [newChatName, setNewChatName] = useState<string>("");

  
  const scrollRef = useRef<HTMLDivElement>(null);

  //get all the chatsIDs

  const get_chats = async ()=>{

     try {
      
      const res = await axios.get("http://localhost:8000/chats")

      setChats(res.data)


     } catch (error) {
      console.log("error in getting the chats",error)
     }



  };

  useEffect(()=>{

    get_chats()

  },[])

  //get all the chats with chatID
  const get_chat_ID = async()=>{

    setLoading(true)

    if (!chatID) {
    console.log("No chat selected, skipping fetch.");
    return; 
  }

    const chat_id = chatID

    const res = await axios.get(`http://localhost:8000/chat/${chat_id}`)
    setMessages(res.data)
    console.log(res.data);
    setLoading(false)

  }

   useEffect(()=>{

    get_chat_ID()

  },[chatID])

  const handleCreateChat = async () =>{

    try {
      console.log(newChatName)
      const form = new FormData()
      form.append("name",newChatName)
      setChatModel(false);
      const res = await axios.post("http://localhost:8000/chat/create_chat",form)

      console.log(res)

      

    } catch (error) {
      console.log("error creating new chat",error)
      
    }

  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const submitRequest = async () => {
    if (!query.trim()) return;
    setError("");
    
    // 1. Add User message to UI immediately
    const userMsg: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    const currentQuery = query;
    setQuery(""); // Clear input

    const formdata = new FormData();
    formdata.append("chat_id",chatID)
    formdata.append("question", currentQuery);

    console.log(currentQuery)

    try {
      setLoading(true);
      const {data}  = await axios.post("http://localhost:8000/get-answer", formdata, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log(data)

      // 2. Add AI response to the array
      const aiMsg: Message = { 
        role: 'assistant', 
        content: data.answer || "No relevant information found." 
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderChatSection = () => (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <h1 className="text-3xl font-bold mb-2">Files Insight</h1>
            <p>Ask a question to start the conversation</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
            }`}>
              <p className="text-sm font-bold mb-1 opacity-50 uppercase tracking-tighter">
                {msg.role}
              </p>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl animate-pulse text-slate-400">
              AI is thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input Area (Fixed at bottom) */}
      <div className="p-6 bg-slate-950 border-t border-slate-800">
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <div className="relative flex items-end gap-2 bg-slate-900 rounded-xl border border-slate-700 p-2 focus-within:ring-2 focus-within:ring-blue-600">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submitRequest();
                }
            }}
            placeholder="Ask a question..."
            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 resize-none py-2 px-3 max-h-32"
            rows={1}
          />
          <button
            onClick={submitRequest}
            disabled={loading || !query.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-500 mt-3 uppercase tracking-widest">
          Powered by Files Insight AI
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-lg font-bold tracking-tight">Files Insight</h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
  <div className="space-y-2">
    {/* + New Chat Button */}
    <button
      onClick={() => {
        setMessages([]);
        setChatID(""); // Clear current selection for a fresh chat
        setChatModel(true)
      }}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 mb-6 rounded-lg bg-blue-600 hover:bg-blue-500 transition-all text-sm font-bold shadow-lg shadow-blue-900/20"
    >
      <span>+ New Chat</span>
    </button>

    {/* Section Label */}
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">
      Recent Chats
    </p>

    {/* Map through the chats list */}
    <div className="space-y-1">
      {chats && chats.length > 0 ? (
        chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => {
              setChatID(chat.id.toString());
              setActiveTab("ask");
              // Logic to load this specific chat's messages would go here
            }}
            className={`w-full flex flex-col items-start gap-1 px-4 py-3 rounded-lg transition-all duration-200 border ${
              chatID === chat.id.toString()
                ? "bg-blue-600/10 border-blue-500/50 text-blue-400"
                : "border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <span className="text-sm font-medium truncate w-full text-left">
              {chat.name || `Chat #${chat.id}`}
            </span>
            <span className="text-[10px] opacity-50">
              {new Date(chat.created_at).toLocaleDateString()}
            </span>
          </button>
        ))
      ) : (
        <p className="text-xs text-slate-600 px-2 italic">No chats found</p>
      )}
    </div>
  </div>
</nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-slate-950/50 backdrop-blur-md border-b border-slate-800 px-8 py-4">
          <h2 className="text-xl font-semibold">
            {activeTab === "ask" ? "Chat with Files" : "Analytics"}
          </h2>
        </header>

        <main className="flex-1 overflow-hidden">
          {activeTab === "ask" ? renderChatSection() : <div>Analytics Content</div>}
        </main>
      </div>


            {/* Create New Chat Modal */}
      {chatModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-2">Create New Chat</h3>
            <p className="text-slate-400 text-sm mb-6">Give your conversation a title to stay organized.</p>
            
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
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateChat();
                  }}
                />
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    setChatModel(false);
                    setNewChatName("");
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChat}
                  disabled={!newChatName.trim()}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold transition-all shadow-lg shadow-blue-900/20"
                >
                  Create Chat
                </button>
              </div>
            </div>
          </div>
        </div>
)}
    </div>
  );
}