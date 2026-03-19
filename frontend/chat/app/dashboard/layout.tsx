"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, FileText } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);       // desktop collapse
  const [isMobileOpen, setIsMobileOpen] = useState(false); // mobile drawer
  const router = useRouter();

  const isFilesActive = true; 

  return (
    <div className="flex min-h-screen bg-black">

   
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

   
      <div
        className={`
        fixed lg:static z-50 top-0 left-0 h-full bg-gray-950 border-r border-gray-800 flex flex-col
        transition-all duration-300 ease-in-out

        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0

        ${isOpen ? "lg:w-56" : "lg:w-20"}
        w-56
        `}
      >

        <div className="p-2 border-b flex items-center border-gray-800">

  
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 lg:hidden"
          >
            <X className="text-white" size={20} />
          </button>

    
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-4 hidden lg:flex items-center justify-center shrink-0"
          >
            <Menu className="text-white" size={20} />
          </button>

          
          <div
            className={`overflow-hidden transition-all duration-300
            ${isOpen ? "w-40 opacity-100 ml-2" : "w-0 opacity-0 ml-0"}
            hidden lg:block`}
          >
            <span className="text-white font-bold text-lg whitespace-nowrap">
              Dashboard
            </span>
          </div>
        </div>

        
        <nav className="flex-1 p-4 flex flex-col gap-2">

          <button
            onClick={() => {
              router.push("/dashboard/files");
              setIsMobileOpen(false);
            }}
            className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
              isFilesActive
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:bg-gray-900 hover:text-white"
            }`}
          >
    
            <div className="flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>

        
            <div
              className={`overflow-hidden transition-all duration-300
              ${isOpen ? "lg:w-24 lg:opacity-100 lg:ml-3" : "lg:w-0 lg:opacity-0 lg:ml-0"}
              w-auto opacity-100 ml-3`}
            >
              <span className="font-medium whitespace-nowrap">Files</span>
            </div>
          </button>

        </nav>

       
      </div>

     
      <div className="flex-1 flex flex-col">

        <div className="lg:hidden flex items-center p-4 border-b border-gray-800 bg-gray-950">
          <button onClick={() => setIsMobileOpen(true)}>
            <Menu className="text-white" size={22} />
          </button>
          <h1 className="ml-4 text-white font-bold">Dashboard</h1>
        </div>

       
        <div className="flex-1 bg-gray-900 overflow-y-auto">
          {children}
        </div>

      </div>
    </div>
  );
}