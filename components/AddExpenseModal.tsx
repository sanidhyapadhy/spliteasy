"use client";

import React, { useState, useMemo } from "react";
import { Member } from "@/lib/types";
import { equalSplit, formatRupees } from "@/lib/settle";

type AddExpenseModalProps = {
  isOpen: boolean;
  members: Member[];
  onClose: () => void;
  onSubmit: (data: {
    description: string;
    paidBy: string;
    amountPaise: number;
    splitMemberIds: string[];
  }) => Promise<void>;
};

export default function AddExpenseModal({
  isOpen,
  members,
  onClose,
  onSubmit,
}: AddExpenseModalProps) {
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [paidBy, setPaidBy] = useState(members[0]?.id || "");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    members.map((m) => m.id)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectivePaidBy = members.some((m) => m.id === paidBy) ? paidBy : members[0]?.id || "";

  // Convert input rupees to paise safely without float precision issues
  const amountPaise = useMemo(() => {
    const parsed = parseFloat(amountStr);
    if (isNaN(parsed) || parsed <= 0) return 0;
    return Math.round(parsed * 100);
  }, [amountStr]);

  // Compute live preview of shares using equalSplit
  const previewShares = useMemo(() => {
    if (amountPaise <= 0 || selectedMembers.length === 0) return [];
    try {
      return equalSplit(amountPaise, selectedMembers);
    } catch {
      return [];
    }
  }, [amountPaise, selectedMembers]);

  if (!isOpen) return null;

  const toggleMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      if (selectedMembers.length === 1) {
        setError("At least one member must be selected for the split");
        return;
      }
      setSelectedMembers(selectedMembers.filter((id) => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedMembers.length === members.length) {
      // Keep only current payer
      setSelectedMembers([paidBy]);
    } else {
      setSelectedMembers(members.map((m) => m.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      setError("Please provide an expense description");
      return;
    }

    if (amountPaise <= 0) {
      setError("Please enter a valid amount greater than ₹0.00");
      return;
    }

    if (!effectivePaidBy) {
      setError("Please select who paid for this expense");
      return;
    }

    if (selectedMembers.length === 0) {
      setError("Please select at least one member to split this expense");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        description: trimmedDesc,
        paidBy: effectivePaidBy,
        amountPaise,
        splitMemberIds: selectedMembers,
      });
      setDescription("");
      setAmountStr("");
      setSelectedMembers(members.map((m) => m.id));
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Add New Expense
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Enter total amount and split among group members
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Description
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Dinner at BBQ Nation, Groceries, Cab"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Amount (in ₹)
              </label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-bold text-slate-500">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Paid By
              </label>
              <select
                value={effectivePaidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Split Among ({selectedMembers.length} selected)
              </label>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                {selectedMembers.length === members.length ? "Deselect Others" : "Select All"}
              </button>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {members.map((m) => {
                const isSelected = selectedMembers.includes(m.id);
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-xs font-medium cursor-pointer transition ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-300"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMember(m.id)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="truncate">{m.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Live Split Calculation Preview */}
          {previewShares.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-800/40">
              <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                <span>Equal Split Preview</span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                  Total: {formatRupees(amountPaise)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600 dark:text-zinc-400">
                {previewShares.map((s) => {
                  const memberName = members.find((m) => m.id === s.memberId)?.name || s.memberId;
                  return (
                    <div key={s.memberId} className="flex justify-between items-center py-0.5 border-b border-slate-200/50 dark:border-zinc-800">
                      <span className="truncate">{memberName}:</span>
                      <span className="font-mono font-medium text-slate-900 dark:text-white">
                        {formatRupees(s.sharePaise)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || amountPaise <= 0}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Recording..." : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
