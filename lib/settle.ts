export type Member = {
  id: string;
  name: string;
};

export type Share = {
  memberId: string;
  sharePaise: number;
};

export type Expense = {
  id: string;
  paidBy: string;
  amountPaise: number;
  shares: Share[];
};

export type Settlement = {
  id: string;
  from: string;
  to: string;
  amountPaise: number;
};

export type Group = {
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
};

export type DebtTransfer = {
  from: string;
  to: string;
  amountPaise: number;
};

/**
 * Splits totalPaise evenly among memberIds with no paisa lost.
 * Any remainder is distributed one paisa each to the first members.
 * Throws if memberIds is empty or totalPaise is not a positive integer.
 */
export function equalSplit(
  totalPaise: number,
  memberIds: string[]
): { memberId: string; sharePaise: number }[] {
  if (!Number.isInteger(totalPaise) || totalPaise <= 0) {
    throw new Error("totalPaise must be a positive integer");
  }
  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    throw new Error("memberIds must not be empty");
  }

  const n = memberIds.length;
  const base = Math.floor(totalPaise / n);
  const remainder = totalPaise % n;

  return memberIds.map((memberId, index) => ({
    memberId,
    sharePaise: base + (index < remainder ? 1 : 0),
  }));
}

/**
 * Computes net balances for all members in a group.
 * Positive balance means the member is owed money;
 * negative means the member owes money.
 */
export function computeBalances(group: Group): Record<string, number> {
  const balances: Record<string, number> = {};

  for (const member of group.members) {
    balances[member.id] = 0;
  }

  for (const expense of group.expenses) {
    balances[expense.paidBy] = (balances[expense.paidBy] ?? 0) + expense.amountPaise;
    for (const share of expense.shares) {
      balances[share.memberId] = (balances[share.memberId] ?? 0) - share.sharePaise;
    }
  }

  for (const settlement of group.settlements) {
    balances[settlement.from] = (balances[settlement.from] ?? 0) + settlement.amountPaise;
    balances[settlement.to] = (balances[settlement.to] ?? 0) - settlement.amountPaise;
  }

  return balances;
}

/**
 * Simplifies net balances into a minimal list of debt transfers.
 * Repeatedly matches the largest debtor with the largest creditor,
 * transferring the minimum of the two until all balances are zero.
 * Ignores zero balances and breaks ties deterministically by member id.
 */
export function simplifyDebts(
  balances: Record<string, number>
): DebtTransfer[] {
  const workingBalances: Record<string, number> = {};
  for (const [id, bal] of Object.entries(balances)) {
    if (bal !== 0) {
      workingBalances[id] = bal;
    }
  }

  const transfers: DebtTransfer[] = [];

  while (true) {
    const debtors: { id: string; debt: number }[] = [];
    const creditors: { id: string; credit: number }[] = [];

    for (const [id, bal] of Object.entries(workingBalances)) {
      if (bal < 0) {
        debtors.push({ id, debt: -bal });
      } else if (bal > 0) {
        creditors.push({ id, credit: bal });
      }
    }

    if (debtors.length === 0 || creditors.length === 0) {
      break;
    }

    debtors.sort((a, b) => b.debt - a.debt || a.id.localeCompare(b.id));
    creditors.sort((a, b) => b.credit - a.credit || a.id.localeCompare(b.id));

    const largestDebtor = debtors[0];
    const largestCreditor = creditors[0];

    const amount = Math.min(largestDebtor.debt, largestCreditor.credit);

    transfers.push({
      from: largestDebtor.id,
      to: largestCreditor.id,
      amountPaise: amount,
    });

    workingBalances[largestDebtor.id] += amount;
    workingBalances[largestCreditor.id] -= amount;

    if (workingBalances[largestDebtor.id] === 0) {
      delete workingBalances[largestDebtor.id];
    }
    if (workingBalances[largestCreditor.id] === 0) {
      delete workingBalances[largestCreditor.id];
    }
  }

  return transfers;
}

/**
 * Formats a paise amount into Indian Rupees ("₹1,234.50")
 * using exact integer arithmetic (no floating point errors).
 */
export function formatRupees(paise: number): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.trunc(paise));
  const rupees = Math.floor(absPaise / 100);
  const remainderPaise = absPaise % 100;

  const formattedRupees = new Intl.NumberFormat("en-IN").format(rupees);
  const formattedPaise = remainderPaise.toString().padStart(2, "0");

  const formatted = `₹${formattedRupees}.${formattedPaise}`;
  return isNegative ? `-${formatted}` : formatted;
}
