"use client";

import React from "react";
import { GroupData } from "@/lib/types";
import { computeBalances, simplifyDebts, formatRupees } from "@/lib/settle";

type GroupCardProps = {
  group: GroupData;
  onSelect: (group: GroupData) => void;
  onDelete: (id: string, name: string) => void;
};

export default function GroupCard({
  group,
  onSelect,
  onDelete,
}: GroupCardProps) {
  const totalSpent = group.expenses.reduce((acc, e) => acc + e.amountPaise, 0);
  const balances = computeBalances(group);
  const transfers = simplifyDebts(balances);
  const allSettled = transfers.length === 0;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-emerald-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-800/80">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
              {group.name}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
              {group.members.length} members • {group.expenses.length} expenses
            </p>
          </div>

          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              allSettled
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
            }`}
          >
            {allSettled ? "Settled" : `${transfers.length} due`}
          </span>
        </div>

        {/* Members preview pills */}
        <div className="mt-3 flex flex-wrap gap-1">
          {group.members.map((m) => (
            <span
              key={m.id}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {m.name}
            </span>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <p className="text-[11px] text-slate-400 dark:text-zinc-500">
            Total Group Spending
          </p>
          <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">
            {formatRupees(totalSpent)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
        <button
          onClick={() => onDelete(group.id, group.name)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
          title="Delete group"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        <button
          onClick={() => onSelect(group)}
          className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition text-center"
        >
          Open Workspace →
        </button>
      </div>
    </div>
  );
}

