"use client";

import React from "react";

type NavbarProps = {
  dbConnected: boolean | null;
  dbError: string | null;
  onRetryDb: () => void;
  onOpenCreateGroup: () => void;
  activeGroupName?: string;
  onBackToDashboard?: () => void;
};

export default function Navbar({
  dbConnected,
  dbError,
  onRetryDb,
  onOpenCreateGroup,
  activeGroupName,
  onBackToDashboard,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-2.5 text-left transition hover:opacity-80 focus:outline-none"
            title="SplitEasy Home"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-sm shadow-emerald-500/20">
              <span className="text-xl font-black tracking-tight">₹</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  SplitEasy
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Fair expense splitting, zero paisa loss
              </p>
            </div>
          </button>

          {activeGroupName && (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-slate-300 dark:text-zinc-700">/</span>
              <button
                onClick={onBackToDashboard}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Groups
              </button>
              <span className="text-slate-300 dark:text-zinc-700">/</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                {activeGroupName}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Database connection badge */}
          {dbConnected === true && (
            <div
              className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300"
              title="MongoDB database is connected and active"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">MongoDB Connected</span>
              <span className="sm:hidden">DB Active</span>
            </div>
          )}

          {dbConnected === false && (
            <button
              onClick={onRetryDb}
              className="flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-800 transition hover:bg-rose-100 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-300"
              title={`MongoDB offline: ${dbError || "Click to retry"}`}
            >
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>DB Offline (Retry)</span>
            </button>
          )}

          {dbConnected === null && (
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-ping" />
              <span>Checking DB...</span>
            </div>
          )}

          {/* New Group Button */}
          <button
            onClick={onOpenCreateGroup}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>New Group</span>
          </button>
        </div>
      </div>
    </header>
  );
}

