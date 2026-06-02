"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, FileText, ChevronLeft, ChevronRight } from "lucide-react";

const navItems = [
  { label: "Files", href: "/dashboard/files", icon: FileText },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const sidebarExpanded = isOpen || isMobileOpen;

  return (
    <div className="flex min-h-screen bg-[var(--background)]">

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={[
          "fixed lg:static z-50 top-0 left-0 h-full flex flex-col",
          "bg-[var(--surface-0)] border-r border-[var(--border-subtle)]",
          "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "w-60",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          isOpen ? "lg:w-60" : "lg:w-[68px]",
        ].join(" ")}
      >
        <div className="flex flex-col h-full">

          {/* Sidebar header */}
          <div className={`flex items-center h-14 px-4 border-b border-[var(--border-subtle)] ${sidebarExpanded ? "justify-between" : "justify-center"}`}>
            <div className="flex items-center gap-3 overflow-hidden">

              {sidebarExpanded && (
                <span className="text-[13px] font-semibold text-[var(--text-primary)] tracking-tight whitespace-nowrap">
                  Admin Panel
                </span>
              )}
            </div>

            {/* Desktop collapse */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="hidden lg:flex w-7 h-7 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-all"
            >
              {isOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
            </button>

            {/* Mobile close */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-all"
            >
              <X size={15} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 flex flex-col gap-1">
            {sidebarExpanded && (
              <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.08em] px-3 mb-2">
                Navigation
              </p>
            )}

            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href || pathname?.startsWith(href + "/");
              return (
                <button
                  key={href}
                  onClick={() => {
                    router.push(href);
                    setIsMobileOpen(false);
                  }}
                  className={[
                    "relative flex items-center rounded-lg transition-all duration-200 group",
                    sidebarExpanded ? "px-3 py-2.5 gap-3" : "justify-center py-2.5",
                    isActive
                      ? "bg-[var(--accent-muted)] text-[var(--accent-hover)]"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]",
                  ].join(" ")}
                  title={!sidebarExpanded ? label : undefined}
                >
                  {isActive && sidebarExpanded && (
                    <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-[var(--accent)]" />
                  )}
                  <Icon size={18} className={`shrink-0 ${isActive ? "text-[var(--accent)]" : ""}`} />
                  {sidebarExpanded && (
                    <span className={`text-[13px] whitespace-nowrap ${isActive ? "font-medium" : "font-normal"}`}>
                      {label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center h-14 px-4 border-b border-[var(--border-subtle)] bg-[var(--surface-0)]">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-all"
          >
            <Menu size={18} />
          </button>
          <span className="ml-3 text-[13px] font-semibold text-[var(--text-primary)]">Dashboard</span>
        </div>

        {/* Content area */}
        <div className="flex-1 bg-[var(--surface-1)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}