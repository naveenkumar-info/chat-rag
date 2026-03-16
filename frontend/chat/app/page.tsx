"use client"

import axios from "axios";
import { useState, useRef } from "react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<any>();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitRequest = async () => {
    setError("");
    if (!file || !question) {
      setError("Please select a valid file and enter a question.");
      return;
    }
    const formdata = new FormData();
    formdata.append("file", file);
    formdata.append("question", question);
    try {
      setLoading(true);
      const data = await axios.post(
        "http://localhost:8000/ask",
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

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-white to-gray-200 dark:from-black dark:to-gray-900 transition-colors duration-300">
      {/* Dashboard Header */}
      <header className="w-full sticky top-0 z-20 bg-gray-800 text-gray-100 shadow-md py-6 px-10 flex items-center justify-between border-b-2 border-gray-700">
        <h2 className="text-3xl font-extrabold tracking-wide uppercase text-gray-100 drop-shadow">Dashboard</h2>
      </header>
      <div className="flex-1 w-full flex flex-col items-center justify-center">
        <div className="w-full max-w-md p-8 bg-white dark:bg-black rounded-2xl shadow-xl flex flex-col gap-6 border border-gray-200 dark:border-gray-800 mt-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white tracking-tight mb-2">PDF Extractor Chat</h1>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-4">Upload a PDF and ask any question about its content.</p>

        <div className="flex flex-col gap-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your File</label>
          <input
            ref={fileInputRef}
            type="file"
            className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-200 file:text-gray-900 hover:file:bg-gray-300 transition-colors duration-200 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your Question</label>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center font-medium animate-pulse">{error}</div>
        )}

        <button
          onClick={submitRequest}
          disabled={loading}
          className="mt-2 w-full py-2 px-4 rounded-lg bg-gray-900 hover:bg-gray-700 text-white font-semibold shadow transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              Loading...
            </span>
          ) : (
            "Ask Model"
          )}
        </button>

        <div className="mt-6">
          {answer ? (
            <div className="bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-4 text-gray-900 dark:text-gray-100 shadow-sm animate-fade-in">
              <div className="font-semibold mb-1 text-gray-800 dark:text-gray-200">Model Response:</div>
              <div className="whitespace-pre-line break-words">{answer.response}</div>
            </div>
          ) : (
            <div className="text-gray-400 text-center">Ask a question to generate the response.</div>
          )}
        </div>
        </div>
        <footer className="mt-10 text-xs text-gray-400 dark:text-gray-600 text-center">&copy; {new Date().getFullYear()} PDF Extractor Chat. All rights reserved.</footer>
      </div>
    </div>
  );
}
