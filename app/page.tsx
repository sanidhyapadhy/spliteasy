"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import GroupCard from "@/components/GroupCard";
import CreateGroupModal from "@/components/CreateGroupModal";
import AddExpenseModal from "@/components/AddExpenseModal";
import RecordSettlementModal from "@/components/RecordSettlementModal";
import AddMemberModal from "@/components/AddMemberModal";
import BalancesCard from "@/components/BalancesCard";
import ExpenseList from "@/components/ExpenseList";
import SettlementList from "@/components/SettlementList";
import { GroupData } from "@/lib/types";
import { equalSplit } from "@/lib/settle";

export default function Home() {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [activeGroup, setActiveGroup] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  // Modals state
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isRecordSettlementOpen, setIsRecordSettlementOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // Quick settle prefill state
  const [settlementPrefill, setSettlementPrefill] = useState<{
    from?: string;
    to?: string;
    amountPaise?: number;
  }>({});

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<"balances" | "expenses" | "settlements">("balances");

  // Toast notifications
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  // Fetch groups from API
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      if (res.ok && data.success) {
        setGroups(data.groups || []);
        setDbConnected(true);
        setDbError(null);

        // Keep active group updated if selected
        if (activeGroup) {
          const updatedActive = (data.groups || []).find((g: GroupData) => g.id === activeGroup.id);
          if (updatedActive) {
            setActiveGroup(updatedActive);
          }
        }
      } else {
        setDbConnected(false);
        setDbError(data.error || "Database unavailable");
      }
    } catch (err: unknown) {
      setDbConnected(false);
      setDbError(err instanceof Error ? err.message : "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  }, [activeGroup]);

  useEffect(() => {
    let isSubscribed = true;
    async function loadInitial() {
      try {
        const res = await fetch("/api/groups");
        const data = await res.json();
        if (!isSubscribed) return;
        if (res.ok && data.success) {
          setGroups(data.groups || []);
          setDbConnected(true);
          setDbError(null);
        } else {
          setDbConnected(false);
          setDbError(data.error || "Database unavailable");
        }
      } catch (err: unknown) {
        if (!isSubscribed) return;
        setDbConnected(false);
        setDbError(err instanceof Error ? err.message : "Failed to connect to backend");
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }
    loadInitial();
    return () => {
      isSubscribed = false;
    };
  }, []);

  // Create Group handler
  const handleCreateGroup = async (name: string, memberNames: string[]) => {
    if (dbConnected) {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, members: memberNames }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create group in database");
      }
      setGroups([data.group, ...groups]);
      setActiveGroup(data.group);
      showToast(`Group "${name}" created and saved to MongoDB!`);
    } else {
      // Local session mode fallback
      const memberObjects = memberNames.map((mName, idx) => ({
        id: `m_${Date.now().toString(36)}_${idx}`,
        name: mName,
      }));
      const newGroup: GroupData = {
        id: `local_${Date.now()}`,
        name,
        members: memberObjects,
        expenses: [],
        settlements: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setGroups([newGroup, ...groups]);
      setActiveGroup(newGroup);
      showToast(`Group "${name}" created in local session (DB offline).`, "info");
    }
  };

  // Add Expense handler
  const handleAddExpense = async (expenseData: {
    description: string;
    paidBy: string;
    amountPaise: number;
    splitMemberIds: string[];
  }) => {
    if (!activeGroup) return;

    if (dbConnected && !activeGroup.id.startsWith("local_")) {
      const res = await fetch(`/api/groups/${activeGroup.id}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record expense");
      }
      setActiveGroup(data.group);
      setGroups(groups.map((g) => (g.id === data.group.id ? data.group : g)));
      showToast(`Expense "${expenseData.description}" added successfully!`);
    } else {
      // In-memory fallback
      const shares = equalSplit(expenseData.amountPaise, expenseData.splitMemberIds);
      const newExp = {
        id: `exp_${Date.now()}`,
        description: expenseData.description,
        paidBy: expenseData.paidBy,
        amountPaise: expenseData.amountPaise,
        shares,
        createdAt: new Date().toISOString(),
      };
      const updated: GroupData = {
        ...activeGroup,
        expenses: [newExp, ...activeGroup.expenses],
        updatedAt: new Date().toISOString(),
      };
      setActiveGroup(updated);
      setGroups(groups.map((g) => (g.id === updated.id ? updated : g)));
      showToast(`Expense recorded in local session!`, "info");
    }
  };

  // Record Settlement handler
  const handleRecordSettlement = async (settlementData: {
    from: string;
    to: string;
    amountPaise: number;
  }) => {
    if (!activeGroup) return;

    if (dbConnected && !activeGroup.id.startsWith("local_")) {
      const res = await fetch(`/api/groups/${activeGroup.id}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settlementData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record settlement");
      }
      setActiveGroup(data.group);
      setGroups(groups.map((g) => (g.id === data.group.id ? data.group : g)));
      showToast("Payment recorded and balances updated!");
    } else {
      const newSet = {
        id: `set_${Date.now()}`,
        from: settlementData.from,
        to: settlementData.to,
        amountPaise: settlementData.amountPaise,
        createdAt: new Date().toISOString(),
      };
      const updated: GroupData = {
        ...activeGroup,
        settlements: [newSet, ...activeGroup.settlements],
        updatedAt: new Date().toISOString(),
      };
      setActiveGroup(updated);
      setGroups(groups.map((g) => (g.id === updated.id ? updated : g)));
      showToast("Payment recorded in local session!", "info");
    }
  };

  // Add Member handler
  const handleAddMember = async (name: string) => {
    if (!activeGroup) return;

    if (dbConnected && !activeGroup.id.startsWith("local_")) {
      const res = await fetch(`/api/groups/${activeGroup.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add member");
      }
      setActiveGroup(data.group);
      setGroups(groups.map((g) => (g.id === data.group.id ? data.group : g)));
      showToast(`Member "${name}" joined the group!`);
    } else {
      const newMember = {
        id: `m_${Date.now()}`,
        name,
      };
      const updated: GroupData = {
        ...activeGroup,
        members: [...activeGroup.members, newMember],
        updatedAt: new Date().toISOString(),
      };
      setActiveGroup(updated);
      setGroups(groups.map((g) => (g.id === updated.id ? updated : g)));
      showToast(`Member "${name}" added to local session!`, "info");
    }
  };

  // Delete Group handler
  const handleDeleteGroup = async (id: string, groupName: string) => {
    if (!confirm(`Are you sure you want to delete the group "${groupName}"?`)) {
      return;
    }

    if (dbConnected && !id.startsWith("local_")) {
      try {
        const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to delete group");
        }
        setGroups(groups.filter((g) => g.id !== id));
        if (activeGroup?.id === id) {
          setActiveGroup(null);
        }
        showToast(`Group "${groupName}" deleted.`);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : "Error deleting group", "error");
      }
    } else {
      setGroups(groups.filter((g) => g.id !== id));
      if (activeGroup?.id === id) {
        setActiveGroup(null);
      }
      showToast(`Group "${groupName}" deleted from session.`);
    }
  };

  // Quick Settle from suggestion card
  const handleQuickSettle = (from: string, to: string, amountPaise: number) => {
    setSettlementPrefill({ from, to, amountPaise });
    setIsRecordSettlementOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col">
      <Navbar
        dbConnected={dbConnected}
        dbError={dbError}
        onRetryDb={fetchGroups}
        onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
        activeGroupName={activeGroup?.name}
        onBackToDashboard={() => setActiveGroup(null)}
      />

      {/* Database Offline Notice Banner */}
      {dbConnected === false && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-600 dark:text-amber-400">⚠️ Database Notice:</span>
              <span>
                MongoDB is offline ({dbError || "connection error"}). Operating in local session mode.
                Data will NOT persist to the database until MONGODB_URI is reachable.
              </span>
            </div>
            <button
              onClick={fetchGroups}
              className="rounded bg-amber-200/80 px-2 py-0.5 font-semibold text-amber-900 hover:bg-amber-300 dark:bg-amber-800 dark:text-amber-100"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold shadow-lg backdrop-blur-md transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : toast.type === "error"
              ? "bg-rose-600 text-white"
              : "bg-slate-800 text-white dark:bg-zinc-800"
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      <main className="flex-1 mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        {loading && groups.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-slate-500 dark:text-zinc-400">
              Loading SplitEasy workspaces...
            </p>
          </div>
        ) : activeGroup ? (
          /* ACTIVE GROUP WORKSPACE */
          <div className="space-y-6 animate-fade-in">
            {/* Workspace Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveGroup(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800"
                    title="Back to all groups"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {activeGroup.name}
                  </h1>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                    Members ({activeGroup.members.length}):
                  </span>
                  {activeGroup.members.map((m) => (
                    <span
                      key={m.id}
                      className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {m.name}
                    </span>
                  ))}
                  <button
                    onClick={() => setIsAddMemberOpen(true)}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    + Add Member
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddExpenseOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow hover:bg-emerald-700 active:scale-95 transition"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Expense</span>
                </button>

                <button
                  onClick={() => {
                    setSettlementPrefill({});
                    setIsRecordSettlementOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition"
                >
                  <span>Record Payment</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-zinc-800">
              <button
                onClick={() => setActiveTab("balances")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-semibold transition ${
                  activeTab === "balances"
                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <span>Balances & Settlement</span>
              </button>

              <button
                onClick={() => setActiveTab("expenses")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-semibold transition ${
                  activeTab === "expenses"
                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <span>Expenses ({activeGroup.expenses.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("settlements")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-semibold transition ${
                  activeTab === "settlements"
                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <span>Payments ({activeGroup.settlements.length})</span>
              </button>
            </div>

            {/* Active Tab Views */}
            {activeTab === "balances" && (
              <BalancesCard group={activeGroup} onQuickSettle={handleQuickSettle} />
            )}

            {activeTab === "expenses" && (
              <ExpenseList
                expenses={activeGroup.expenses}
                members={activeGroup.members}
                groupId={activeGroup.id}
                onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                onGroupUpdated={(updatedGroup) => {
                  if (updatedGroup.name === "" && updatedGroup.members.length === 0) {
                    // local-only patch: just update expenses
                    const patched: GroupData = {
                      ...activeGroup,
                      expenses: updatedGroup.expenses,
                      updatedAt: updatedGroup.updatedAt,
                    };
                    setActiveGroup(patched);
                    setGroups(groups.map((g) => (g.id === patched.id ? patched : g)));
                  } else {
                    setActiveGroup(updatedGroup);
                    setGroups(groups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
                  }
                  showToast("Expense deleted and balances updated.");
                }}
              />
            )}

            {activeTab === "settlements" && (
              <SettlementList
                settlements={activeGroup.settlements}
                members={activeGroup.members}
                onOpenRecordSettlement={() => {
                  setSettlementPrefill({});
                  setIsRecordSettlementOpen(true);
                }}
              />
            )}
          </div>
        ) : (
          /* GROUPS DASHBOARD */
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Expense Groups
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                  Select a group to track shared expenses, view balances, and settle debts
                </p>
              </div>

              <button
                onClick={() => setIsCreateGroupOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow hover:bg-emerald-700 active:scale-95 transition self-start sm:self-auto"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create New Group</span>
              </button>
            </div>

            {groups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-3xl font-black">
                  ₹
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                  No expense groups yet
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-zinc-400">
                  Create your first shared group for friends, roommates, family, or travel companions.
                </p>
                <button
                  onClick={() => setIsCreateGroupOpen(true)}
                  className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700"
                >
                  <span>+ Create First Group</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onSelect={(g) => setActiveGroup(g)}
                    onDelete={handleDeleteGroup}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onSubmit={handleCreateGroup}
      />

      {activeGroup && (
        <>
          <AddExpenseModal
            isOpen={isAddExpenseOpen}
            members={activeGroup.members}
            onClose={() => setIsAddExpenseOpen(false)}
            onSubmit={handleAddExpense}
          />

          <RecordSettlementModal
            key={`${settlementPrefill.from || ""}-${settlementPrefill.to || ""}-${settlementPrefill.amountPaise || 0}`}
            isOpen={isRecordSettlementOpen}
            members={activeGroup.members}
            initialFrom={settlementPrefill.from}
            initialTo={settlementPrefill.to}
            initialAmountPaise={settlementPrefill.amountPaise}
            onClose={() => {
              setIsRecordSettlementOpen(false);
              setSettlementPrefill({});
            }}
            onSubmit={handleRecordSettlement}
          />

          <AddMemberModal
            isOpen={isAddMemberOpen}
            existingMembers={activeGroup.members}
            onClose={() => setIsAddMemberOpen(false)}
            onSubmit={handleAddMember}
          />
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SplitEasy • Deterministic debt settlement with zero paisa lost</span>
          <span>Next.js App Router + TypeScript + Tailwind CSS + MongoDB</span>
        </div>
      </footer>
    </div>
  );
}
