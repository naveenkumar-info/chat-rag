"use client"

import axios from "axios";
import { useEffect, useState } from "react";

type Section = 'ask' | 'statistics';

export default function Home() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Section>("ask");

  useEffect(()=>{
    console.log(answer)
  },[answer])

  const submitRequest = async () => {
    setError("");
    const formdata = new FormData();
    formdata.append("query", query);
    console.log(query)
    try {
      setLoading(true);
      const data = await axios.post(
        "http://localhost:8000/ask-question",
        formdata,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setAnswer(data.data.answer);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderUploadSection = () => (
  // Main Background: Black
  <div className="flex-1 flex flex-col items-center justify-center p-8 max-h-[calc(100vh-120px)] overflow-auto bg-black text-white">
    <div className="w-full max-w-2xl">
      
      {/* Empty State / Upload Card */}
      {!answer && (
        <div className="text-center mb-12">
          
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            What would you like to know?
          </h1>
        </div>
      )}

      {/* Chat Card: Navy Blue background */}
      <div className="bg-slate-950 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
        
        {/* Question Input Section */}
        <div className="p-8 border-b border-slate-800">
          <label className="block text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
            Your Question
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your Files..."
            // Textarea: Slightly lighter navy for contrast
            className="w-full px-5 py-4 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none transition-all"
            rows={4}
            disabled={loading}
          />
        </div>

        {/* Error Message: Muted red so it doesn't clash with the dark theme */}
        {error && (
          <div className="p-8 bg-red-950/30 border-b border-red-900/50">
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Submit Button: Solid Deep Blue to Cyan Gradient */}
        <div className="p-8">
          <button
            onClick={submitRequest}
            disabled={loading}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-800 disabled:to-slate-900 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-900/20 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              <span>Get Answer</span>
            )}
          </button>
        </div>
      </div>

      {/* Response Card: Matching Navy Blue */}
      {answer && (
        <div className="mt-8 bg-slate-950 rounded-2xl shadow-2xl border border-slate-800 p-8 animate-fade-in">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
             Answer
          </h3>
          <div className="prose prose-invert max-w-none">
            <p className={`leading-relaxed whitespace-pre-wrap break-words ${answer.response ? "text-slate-300" : "text-slate-500 italic"}`}>
              {answer.response 
                ? answer.response 
                : "I'm sorry, there is no relevant information regarding your query within the provided files."
              }
            </p>
          </div>
          <button
            onClick={() => {
              setAnswer(null);
              setQuery("");
            }}
            className="mt-6 px-6 py-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 border border-slate-700 transition-all font-medium"
          >
            ↻ Ask Another Question
          </button>
        </div>
      )}
    </div>
  </div>
);
  

  return (
  // Main Wrapper: Pure Black for maximum contrast
  <div className="flex h-screen bg-black text-white">
    
    {/* Sidebar: Deep Navy */}
    <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shadow-2xl">
      
      {/* Logo Section */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3 px-2 py-3">
         
          
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">Files Insight</h1>
            <p className="text-xs text-slate-500">AI Analysis</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          <button
            onClick={() => setActiveTab("ask")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === "ask"
                ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            
            <span>Chat with Files</span>
          </button>
        </div>
      </nav>
    </div>

    {/* Main Content Area */}
    <div className="flex-1 flex flex-col overflow-hidden bg-black">
      
      {/* Header: Deep Navy matching Sidebar */}
      <header className="bg-slate-950 border-b border-slate-800 px-8 py-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {activeTab === "ask" ? " Chat with files" : " Analytics Dashboard"}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {activeTab === "ask" ? "Upload and analyze your documents with AI" : "View insights and performance metrics"}
          </p>
        </div>
      </header>

      {/* Content Area: Pure Black backdrop for the cards to pop */}
      <div className="flex-1 overflow-auto bg-black">
        {activeTab === "ask" && renderUploadSection()}
      </div>
    </div>
  </div>
);
}
