"use client";

import React from "react";
import { GroupSettlement, Member } from "@/lib/types";
import { formatRupees } from "@/lib/settle";

type SettlementListProps = {
  settlements: GroupSettlement[];
  members: Member[];
  onOpenRecordSettlement: () => void;
};

export default function SettlementList({
  settlements,
  members,
  onOpenRecordSettlement,
}: SettlementListProps) {
  const memberMap = new Map(members.map((m) => [m.id, m.name]));

  const sortedSettlements = [...settlements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Recorded Payments & Settlements ({settlements.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Direct transfers made between members to settle debt
          </p>
        </div>

        <button
          onClick={onOpenRecordSettlement}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
        >
          <span>+ Record Payment</span>
        </button>
      </div>

      {settlements.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
            No payments recorded yet
          </h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 max-w-xs">
            When someone pays their share back, record the transaction here to reduce group debts.
          </p>
          <button
            onClick={onOpenRecordSettlement}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700"
          >
            Record First Payment
          </button>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-100 dark:divide-zinc-800">
          {sortedSettlements.map((settlement) => {
            const fromName = memberMap.get(settlement.from) || settlement.from;
            const toName = memberMap.get(settlement.to) || settlement.to;
            const dateStr = new Date(settlement.createdAt).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={settlement.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                    ✓
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300">
                      <span className="font-semibold text-rose-700 dark:text-rose-400">
                        {fromName}
                      </span>
                      <span className="text-slate-400">paid</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {toName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                      {dateStr}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {formatRupees(settlement.amountPaise)}
                  </span>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-500 uppercase tracking-wider font-semibold">
                    Settled
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

