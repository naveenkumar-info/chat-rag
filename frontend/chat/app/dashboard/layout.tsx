'use client';

import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { FileText, BarChart3 } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    
    const isFilesActive = pathname.includes('/files');
    const isStatsActive = pathname.includes('/stats');

    return (
        <div className="flex min-h-screen bg-black">
            {/* Sidebar */}
            <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-xl font-bold text-white">Dashboard</h1>
                </div>

                <nav className="flex-1 p-4 flex flex-col gap-2">
                    <button
                        onClick={() => router.push('/dashboard/files')}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${
                            isFilesActive
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                        }`}
                    >
                        <FileText size={20} />
                        <span className="font-medium">Files</span>
                    </button>

                    <button
                        onClick={() => router.push('/dashboard/stats')}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${
                            isStatsActive
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                        }`}
                    >
                        <BarChart3 size={20} />
                        <span className="font-medium">Stats</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <p className="text-xs text-gray-500">Dashboard v1.0</p>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 h-full bg-gray-900 overflow-auto">
                {children}
            </div>
        </div>
    );
}
