"use client";

import React, { useState } from "react";
import { Member } from "@/lib/types";
import { formatRupees } from "@/lib/settle";

type RecordSettlementModalProps = {
  isOpen: boolean;
  members: Member[];
  initialFrom?: string;
  initialTo?: string;
  initialAmountPaise?: number;
  onClose: () => void;
  onSubmit: (data: { from: string; to: string; amountPaise: number }) => Promise<void>;
};

export default function RecordSettlementModal({
  isOpen,
  members,
  initialFrom,
  initialTo,
  initialAmountPaise,
  onClose,
  onSubmit,
}: RecordSettlementModalProps) {
  const [from, setFrom] = useState(initialFrom || members[0]?.id || "");
  const [to, setTo] = useState(initialTo || members[1]?.id || "");
  const [amountStr, setAmountStr] = useState(
    initialAmountPaise ? (initialAmountPaise / 100).toFixed(2) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!from || !to) {
      setError("Please select both payer and recipient");
      return;
    }

    if (from === to) {
      setError("Payer and recipient must be different members");
      return;
    }

    const parsedRupees = parseFloat(amountStr);
    if (isNaN(parsedRupees) || parsedRupees <= 0) {
      setError("Please enter a valid settlement amount greater than ₹0.00");
      return;
    }

    const amountPaise = Math.round(parsedRupees * 100);

    setLoading(true);
    try {
      await onSubmit({ from, to, amountPaise });
      setAmountStr("");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record settlement");
    } finally {
      setLoading(false);
    }
  };

  const fromMemberName = members.find((m) => m.id === from)?.name || "Payer";
  const toMemberName = members.find((m) => m.id === to)?.name || "Recipient";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Record a Settlement
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Record direct payments between members to clear debts
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Payer (Who Paid)
              </label>
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id} disabled={m.id === to}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Recipient (Who Received)
              </label>
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id} disabled={m.id === from}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Amount Paid (in ₹)
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

          {/* Visual transfer preview */}
          {from && to && from !== to && amountStr && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-950 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-300">
              <span className="font-semibold">{fromMemberName}</span>
              <span className="text-slate-400">pays</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {formatRupees(Math.round(parseFloat(amountStr || "0") * 100))}
              </span>
              <span className="text-slate-400">to</span>
              <span className="font-semibold">{toMemberName}</span>
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
              disabled={loading || !amountStr || parseFloat(amountStr) <= 0}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
