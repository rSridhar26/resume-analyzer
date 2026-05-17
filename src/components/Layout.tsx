import React, { useState } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Linkedin,
  Github,
  MessageSquare,
  TrendingUp,
  ListTodo,
  Users,
  Menu,
  X,
  FileEdit,
  Brain,
  Calculator,
  Rocket,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "../context/AuthContext";

const navSections = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", path: "/", icon: LayoutDashboard, color: "text-blue-600", bg: "bg-blue-100" },
    ]
  },
  {
    title: "Resume Tools",
    items: [
      { name: "Analyzer", path: "/resume-analyzer", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-100" },
      { name: "Cover Letter", path: "/cover-letter", icon: FileEdit, color: "text-emerald-600", bg: "bg-emerald-100" },
      { name: "Quantifier", path: "/quantifier", icon: Calculator, color: "text-emerald-600", bg: "bg-emerald-100" },
    ]
  },
  {
    title: "Growth",
    items: [
      { name: "Skill Gap", path: "/skills", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-100" },
      { name: "Role Readiness", path: "/job-matcher", icon: Briefcase, color: "text-blue-600", bg: "bg-blue-100" },
      { name: "LinkedIn", path: "/linkedin", icon: Linkedin, color: "text-blue-600", bg: "bg-blue-100" },
      { name: "GitHub", path: "/github", icon: Github, color: "text-blue-600", bg: "bg-blue-100" },
    ]
  },
  {
    title: "Prep",
    items: [
      { name: "Interview Prep", path: "/interview", icon: MessageSquare, color: "text-orange-600", bg: "bg-orange-100" },
    ]
  }
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={twMerge(
          "fixed inset-y-0 left-0 z-30 bg-white border-r border-slate-200 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Toggle Button (Desktop only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 shadow-sm z-40 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 shrink-0">
          <Link to="/" className={`flex items-center gap-3 group ${isCollapsed ? 'mx-auto' : ''}`} onClick={() => setSidebarOpen(false)}>
            <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-extrabold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent whitespace-nowrap">
                HireMe AI
              </span>
            )}
          </Link>
          {!isCollapsed && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-500"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx}>
              {!isCollapsed && (
                <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    title={isCollapsed ? item.name : undefined}
                    className={({ isActive }) =>
                      clsx(
                        "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group",
                        isActive
                          ? "bg-white shadow-sm border border-slate-200 text-slate-900"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent",
                        isCollapsed ? "justify-center px-0" : ""
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={clsx(
                          "flex items-center justify-center rounded-lg transition-colors",
                          isCollapsed ? "w-10 h-10" : "w-8 h-8 mr-3",
                          isActive ? item.bg : "bg-slate-100 group-hover:bg-slate-200"
                        )}>
                          <item.icon
                            className={clsx(
                              "flex-shrink-0 transition-colors",
                              isCollapsed ? "w-5 h-5" : "w-4 h-4",
                              isActive ? item.color : "text-slate-500 group-hover:text-slate-700"
                            )}
                          />
                        </div>
                        {!isCollapsed && (
                          <span className="truncate">{item.name}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-4 sm:px-6 lg:px-8 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-500 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link to="/" className="ml-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              HireMe AI
            </span>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex items-center justify-end gap-3">
            {user ? (
              <button
                type="button"
                onClick={logout}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/login"
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Sign in
              </Link>
            )}
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
