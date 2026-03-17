'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { history_data } from '../data/sampleStats';

export default function StatsSection() {
    const [conversationModalOpen, setConversationModalOpen] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState<any>(null);

    const stats = [
        { label: 'Total Queries', value: history_data.length, change: '+5%' },
    ];

    const handleViewConversation = (conversation: any) => {
        setSelectedConversation(conversation);
        setConversationModalOpen(true);
    };

    const handleCloseModal = () => {
        setConversationModalOpen(false);
        setSelectedConversation(null);
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Statistics</h2>
                <p className="text-gray-400">View your dashboard metrics and analytics</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 mb-12">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-gray-950 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
                    >
                        <p className="text-gray-400 text-sm font-medium mb-2">{stat.label}</p>
                        <div className="flex items-baseline justify-between">
                            <p className="text-3xl font-bold text-white">{stat.value}</p>
                            <p className="text-green-500 text-sm font-medium">{stat.change}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Conversation History */}
            <div className="flex-1 flex flex-col">
                <h3 className="text-xl font-semibold text-white mb-4">Conversation History</h3>
                
                <div className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden flex-1 flex flex-col">
                    {/* Table Header */}
                    <div className="grid grid-cols-3 gap-4 p-4 border-b border-gray-800 bg-gray-900 font-medium text-gray-300 text-sm">
                        <div>Generation Time</div>
                        <div>Response Time</div>
                        <div className="text-right">Action</div>
                    </div>

                    {/* Table Body */}
                    <div className="flex-1 overflow-y-auto">
                        {history_data.length > 0 ? (
                            history_data.map((conversation, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-3 gap-4 p-4 border-b border-gray-800 hover:bg-gray-900/50 transition-colors items-center"
                                >
                                    <div className="text-gray-300">{conversation.response_date}</div>
                                    <div className="text-gray-300">{conversation.avg_res_time}</div>
                                    <div className="text-right">
                                        <button
                                            onClick={() => handleViewConversation(conversation)}
                                            className="px-4 py-2 bg-white text-black rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
                                        >
                                            View Conversation
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-32 text-gray-400">
                                No conversation history available
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Conversation Modal */}
            {conversationModalOpen && selectedConversation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-950 border border-gray-800 rounded-lg w-4/5 h-4/5 flex flex-col max-w-5xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-800">
                            <div>
                                <h3 className="text-2xl font-semibold text-white">Conversation</h3>
                                <p className="text-sm text-gray-400 mt-1">Date: {selectedConversation.response_date}</p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={28} />
                            </button>
                        </div>

                        {/* Modal Body - Conversation */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {selectedConversation.conversation && selectedConversation.conversation.length > 0 ? (
                                selectedConversation.conversation.map((item: any, index: number) => (
                                    <div key={index} className="space-y-4">
                                        {/* Question - Right (Upper) */}
                                        <div className="flex justify-end">
                                            <div className="max-w-xs bg-gray-800 rounded-lg rounded-br-none p-4 border border-gray-700">
                                                <p className="text-gray-300">{item.question}</p>
                                            </div>
                                        </div>

                                        {/* Answer - Left (Lower) */}
                                        <div className="flex justify-start">
                                            <div className="max-w-xs bg-white rounded-lg rounded-bl-none p-4">
                                                <p className="text-black">{item.answer}</p>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        {index !== selectedConversation.conversation.length - 1 && (
                                            <div className="flex items-center gap-4 my-4">
                                                <div className="flex-1 h-px bg-gray-700/50"></div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 text-center">No conversation data available</p>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-gray-800 p-6">
                            <p className="text-sm text-gray-400">
                                Response Time: <span className="text-white font-medium">{selectedConversation.avg_res_time}</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}