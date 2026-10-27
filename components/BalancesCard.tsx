"use client";

import React, { useMemo } from "react";
import { GroupData } from "@/lib/types";
import { computeBalances, simplifyDebts, formatRupees } from "@/lib/settle";

type BalancesCardProps = {
  group: GroupData;
  onQuickSettle: (from: string, to: string, amountPaise: number) => void;
};

export default function BalancesCard({
  group,
  onQuickSettle,
}: BalancesCardProps) {
  // Compute net balances for group
  const balances = useMemo(() => {
    return computeBalances(group);
  }, [group]);

  // Compute simplified debt transfers
  const transfers = useMemo(() => {
    return simplifyDebts(balances);
  }, [balances]);

  // Total group spending
  const totalSpentPaise = useMemo(() => {
    return group.expenses.reduce((acc, e) => acc + e.amountPaise, 0);
  }, [group.expenses]);

  const memberMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of group.members) {
      map.set(m.id, m.name);
    }
    return map;
  }, [group.members]);

  const allSettled = transfers.length === 0;

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            Total Group Spending
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-white">
            {formatRupees(totalSpentPaise)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500">
            Across {group.expenses.length} recorded expense{group.expenses.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            Settlement Status
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                allSettled ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
              }`}
            />
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {allSettled ? "Fully Settled" : `${transfers.length} Payment${transfers.length === 1 ? "" : "s"} Due`}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500">
            {group.settlements.length} settlement{group.settlements.length === 1 ? "" : "s"} recorded to date
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            Group Members
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {group.members.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500 truncate">
            {group.members.map((m) => m.name).join(", ")}
          </p>
        </div>
      </div>

      {/* Two Column Grid: Balances + Debt Simplification */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Net Balances Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Individual Net Balances
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Sum of paid expenses minus fair share of expenses and settlements
              </p>
            </div>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
              Net Sum: ₹0.00
            </span>
          </div>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-zinc-800">
            {group.members.map((member) => {
              const bal = balances[member.id] ?? 0;
              const isOwed = bal > 0;
              const owes = bal < 0;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${
                        isOwed
                          ? "bg-emerald-600"
                          : owes
                          ? "bg-rose-600"
                          : "bg-slate-400 dark:bg-zinc-600"
                      }`}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {member.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {isOwed
                          ? "Gets back from group"
                          : owes
                          ? "Owes the group"
                          : "Settled up"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-sm font-bold px-2.5 py-1 rounded-lg ${
                        isOwed
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : owes
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                          : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {isOwed ? "+" : ""}
                      {formatRupees(bal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Simplified Debt Suggestions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Smart Settlement Plan</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Minimized
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Optimal transfers to clear all debts in fewest payments
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-500 dark:text-zinc-400">
                {transfers.length} transfer{transfers.length === 1 ? "" : "s"}
              </span>
            </div>

            {allSettled ? (
              <div className="my-8 flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 dark:border-emerald-800/40 dark:bg-emerald-950/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 text-2xl">
                  ✓
                </div>
                <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                  All Debts Settled!
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 max-w-xs">
                  Everyone has paid their exact share. No outstanding transfers are needed.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {transfers.map((transfer, idx) => {
                  const fromName = memberMap.get(transfer.from) || transfer.from;
                  const toName = memberMap.get(transfer.to) || transfer.to;

                  return (
                    <div
                      key={idx}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-slate-50/60 p-3.5 transition hover:border-emerald-300 hover:bg-emerald-50/20 dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:border-emerald-800/60"
                    >
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300">
                        <span className="font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md">
                          {fromName}
                        </span>
                        <span className="text-slate-400">pays</span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                          {toName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                          {formatRupees(transfer.amountPaise)}
                        </span>
                        <button
                          onClick={() =>
                            onQuickSettle(
                              transfer.from,
                              transfer.to,
                              transfer.amountPaise
                            )
                          }
                          className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                        >
                          Settle Up
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="mt-4 text-[11px] text-slate-400 dark:text-zinc-500 text-center">
            Algorithm: Greedy largest debtor-to-creditor with deterministic tie-breaking.
          </p>
        </div>
      </div>
    </div>
  );
}
