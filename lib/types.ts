import { Member, Share, Expense, Settlement, DebtTransfer } from "./settle";

export type { Member, Share, DebtTransfer };

export type GroupExpense = Expense & {
  description: string;
  createdAt: string;
};

export type GroupSettlement = Settlement & {
  createdAt: string;
};

export type GroupData = {
  id: string;
  name: string;
  members: Member[];
  expenses: GroupExpense[];
  settlements: GroupSettlement[];
  createdAt: string;
  updatedAt: string;
};

