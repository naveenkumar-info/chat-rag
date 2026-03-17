"use client"

import axios from "axios";
import { useState, useRef } from "react";
import { file_data, history_data } from "../data/sampleStats";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';


type Section = 'ask' | 'statistics';

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<any>();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Section>("ask");
  const [showStats, setShowStats] = useState("fileStats");
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
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Upload a PDF and ask any question about its content
            </p>
          </div>
        )}

        {/* Chat Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* File Selection */}
          <div className="p-8 border-b border-gray-200 dark:border-gray-800">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
              📤 Select PDF File
            </label>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-6 py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-200 text-gray-700 dark:text-gray-300 font-medium"
            >
              {file ? `✓ ${file.name}` : "Click to upload or drag and drop"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          {/* Question Input */}
          <div className="p-8 border-b border-gray-200 dark:border-gray-800">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
              ❓ Your Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about your PDF..."
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
                setQuestion("");
                setFile(null);
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

  const renderStatisticsSection = () => (
    <div className="flex-1 overflow-auto p-8 max-h-[calc(100vh-120px)]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Track your PDF interactions and performance metrics</p>
        </div>

        {/* Toggle Buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setShowStats("fileStats")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
              showStats === "fileStats"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <span>📊</span> Tabular View
          </button>
          <button
            onClick={() => setShowStats("graphStats")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
              showStats === "graphStats"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <span>📈</span> Visual View
          </button>
        </div>

        {/* Tabular View */}
        {showStats === "fileStats" && (
          <div className="space-y-6">
            {/* File Statistics Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">File Statistics</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">File Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">PDF File</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Times Asked</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Avg Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    {file_data.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.pdf_file}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.date}</td>
                        <td className="px-6 py-4 text-sm">
                         
                        </td>
                        
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Response History Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Response History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">PDF Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Response Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Time Taken</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history_data.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.response_date}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.avg_res_time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Visual View */}
        {showStats === "graphStats" && (
          <div className="space-y-8">
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bar Chart */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Times Asked Per PDF</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={file_data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                      formatter={(value) => [value, 'Times Asked']}
                    />
                    <Legend />
                    <Bar dataKey="times_asked" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Times Asked" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 flex flex-col justify-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">PDF Usage Distribution</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={file_data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ value, name }) => `${name} (${value})`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="times_asked"
                    >
                      {file_data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b'][index % 3]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(value) => `${value} times`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">PDF Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {file_data.map((item, index) => (
                  <div key={index} className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{item.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.pdf_file}</p>
                      </div>
                      <span className="text-2xl">📊</span>
                    </div>
                    <div className="space-y-3">
                      
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
              <h1 className="text-sm font-bold text-gray-900 dark:text-white">PDF Insight</h1>
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
              <span>Chat with PDF</span>
            </button>
            <button
              onClick={() => setActiveTab("statistics")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === "statistics"
                  ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <span className="text-lg">📊</span>
              <span>Analytics</span>
            </button>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">✨ Pro Tip</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">Upload multiple PDFs to compare insights</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeTab === "ask" ? "💬 Chat with PDF" : "📊 Analytics Dashboard"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {activeTab === "ask" ? "Upload and analyze your documents with AI" : "View insights and performance metrics"}
            </p>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {activeTab === "ask" && renderUploadSection()}
          {activeTab === "statistics" && renderStatisticsSection()}
        </div>
      </div>
    </div>
  );
}
