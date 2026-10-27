"use client";

import React, { useState } from "react";
import { GroupExpense, Member } from "@/lib/types";
import { formatRupees } from "@/lib/settle";

type ExpenseListProps = {
  expenses: GroupExpense[];
  members: Member[];
  groupId: string;
  onOpenAddExpense: () => void;
  onGroupUpdated: (groupData: import("@/lib/types").GroupData) => void;
};

export default function ExpenseList({
  expenses,
  members,
  groupId,
  onOpenAddExpense,
  onGroupUpdated,
}: ExpenseListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const memberMap = new Map(members.map((m) => [m.id, m.name]));

  const filteredExpenses = expenses
    .filter((e) => {
      const payerName = memberMap.get(e.paidBy)?.toLowerCase() || "";
      const desc = e.description.toLowerCase();
      const q = search.toLowerCase();
      return desc.includes(q) || payerName.includes(q);
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleDeleteExpense = async (expenseId: string, description: string) => {
    if (!confirm(`Delete expense "${description}"? This will recalculate all balances.`)) {
      return;
    }

    setDeletingId(expenseId);
    setDeleteError(null);

    try {
      if (!groupId.startsWith("local_")) {
        const res = await fetch(`/api/groups/${groupId}/expenses/${expenseId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to delete expense");
        }
        onGroupUpdated(data.group);
      } else {
        // local-only — just signal parent to remove
        onGroupUpdated({
          id: groupId,
          name: "",
          members: [],
          expenses: expenses.filter((e) => e.id !== expenseId),
          settlements: [],
          createdAt: "",
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete expense");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Expenses History ({expenses.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            All expenses logged and split in this group
          </p>
        </div>

        <div className="flex items-center gap-2">
          {expenses.length > 3 && (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          )}

          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
          >
            <span>+ Add Expense</span>
          </button>
        </div>
      </div>

      {deleteError && (
        <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
          {deleteError}
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
            </svg>
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
            No expenses recorded yet
          </h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 max-w-xs">
            Add groceries, restaurant bills, travel costs, or rent to see the automatic split in action.
          </p>
          <button
            onClick={onOpenAddExpense}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700"
          >
            Add First Expense
          </button>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No expenses match &quot;{search}&quot;.
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-100 dark:divide-zinc-800">
          {filteredExpenses.map((expense) => {
            const isExpanded = expandedId === expense.id;
            const isDeleting = deletingId === expense.id;
            const payerName = memberMap.get(expense.paidBy) || "Unknown member";
            const dateStr = new Date(expense.createdAt).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div key={expense.id} className={`py-3 first:pt-0 last:pb-0 ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}>
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setExpandedId(isExpanded ? null : expense.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs">
                      {expense.description.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {expense.description}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Paid by <span className="font-medium text-slate-700 dark:text-zinc-300">{payerName}</span> • {dateStr}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                        {formatRupees(expense.amountPaise)}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                        Split with {expense.shares.length} member{expense.shares.length === 1 ? "" : "s"}
                      </p>
                    </div>

                    {/* Delete expense button */}
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        handleDeleteExpense(expense.id, expense.description);
                      }}
                      disabled={isDeleting}
                      className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                      title="Delete this expense"
                    >
                      {isDeleting ? (
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setExpandedId(isExpanded ? null : expense.id);
                      }}
                      className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                      title={isExpanded ? "Collapse breakdown" : "View breakdown"}
                    >
                      <svg
                        className={`h-4 w-4 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Collapsible share breakdown */}
                {isExpanded && (
                  <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs dark:border-zinc-800/80 dark:bg-zinc-800/50">
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                      Fair Share Distribution (Equal Split)
                    </p>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {expense.shares.map((share) => {
                        const mName = memberMap.get(share.memberId) || share.memberId;
                        const isPayer = share.memberId === expense.paidBy;

                        return (
                          <div
                            key={share.memberId}
                            className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 border border-slate-200/60 dark:bg-zinc-900 dark:border-zinc-800"
                          >
                            <span className="text-slate-700 dark:text-zinc-300">
                              {mName} {isPayer && <span className="text-[10px] text-emerald-600 font-bold">(Payer)</span>}
                            </span>
                            <span className="font-mono font-semibold text-slate-900 dark:text-white">
                              {formatRupees(share.sharePaise)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

