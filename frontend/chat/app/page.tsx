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
      setAnswer(data.data);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderUploadSection = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 max-h-[calc(100vh-120px)] overflow-auto">
      <div className="w-full max-w-2xl">
        {/* Empty State / Upload Card */}
        {!answer && (
          <div className="text-center mb-12">
            <div className="inline-block w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-4xl">📄</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              What would you like to know?
            </h1>
            
          </div>
        )}

        {/* Chat Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
           
          

          {/* Question Input */}
          <div className="p-8 border-b border-gray-200 dark:border-gray-800">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
              ❓ Your Question
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about your Files..."
              className="w-full px-5 py-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
              rows={4}
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-8 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
              <p className="text-red-700 dark:text-red-400 font-medium">⚠️ {error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="p-8">
            <button
              onClick={submitRequest}
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>✨ Get Answer</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Response */}
        {answer && (
          <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>💡</span> Answer
            </h3>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                {answer.response}
              </p>
            </div>
            <button
              onClick={() => {
                setAnswer(null);
                setQuery("");
                
              }}
              className="mt-6 px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-medium"
            >
              ↻ Ask Another Question
            </button>
          </div>
        )}
      </div>
    </div>
  );

  

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        {/* Logo Section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">📄</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-white">Files Insight</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI Analysis</p>
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
                  ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <span className="text-lg">💬</span>
              <span>Chat with Files</span>
            </button>
            
          </div>
        </nav>

        
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeTab === "ask" ? "💬 Chat with files" : "📊 Analytics Dashboard"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {activeTab === "ask" ? "Upload and analyze your documents with AI" : "View insights and performance metrics"}
            </p>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {activeTab === "ask" && renderUploadSection()}
         
        </div>
      </div>
    </div>
  );
}
