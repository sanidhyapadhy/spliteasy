import { describe, it, expect } from "vitest";
import {
  equalSplit,
  computeBalances,
  simplifyDebts,
  formatRupees,
  Group,
} from "./settle";

describe("settle logic", () => {
  describe("equalSplit", () => {
    it("100 paise split among 3 gives 34/33/33", () => {
      const shares = equalSplit(100, ["m1", "m2", "m3"]);
      expect(shares).toEqual([
        { memberId: "m1", sharePaise: 34 },
        { memberId: "m2", sharePaise: 33 },
        { memberId: "m3", sharePaise: 33 },
      ]);
    });

    it("shares always sum to the total", () => {
      const testCases = [
        { total: 100, members: ["a", "b", "c"] },
        { total: 100, members: ["a", "b", "c", "d", "e", "f", "g"] },
        { total: 1, members: ["a", "b", "c"] },
        { total: 10, members: ["a"] },
        { total: 999999, members: ["m1", "m2", "m3", "m4", "m5"] },
      ];

      for (const { total, members } of testCases) {
        const shares = equalSplit(total, members);
        const sum = shares.reduce((acc, s) => acc + s.sharePaise, 0);
        expect(sum).toBe(total);
      }
    });

    it("equalSplit throws on an empty list", () => {
      expect(() => equalSplit(100, [])).toThrow("memberIds must not be empty");
    });

    it("equalSplit throws on non-positive or non-integer totalPaise", () => {
      expect(() => equalSplit(0, ["m1"])).toThrow("positive integer");
      expect(() => equalSplit(-50, ["m1"])).toThrow("positive integer");
      expect(() => equalSplit(10.5, ["m1"])).toThrow("positive integer");
      expect(() => equalSplit(NaN, ["m1"])).toThrow("positive integer");
    });
  });

  describe("computeBalances and simplifyDebts", () => {
    it("balances sum to 0", () => {
      const group: Group = {
        members: [
          { id: "alice", name: "Alice" },
          { id: "bob", name: "Bob" },
          { id: "charlie", name: "Charlie" },
        ],
        expenses: [
          {
            id: "e1",
            paidBy: "alice",
            amountPaise: 300,
            shares: [
              { memberId: "alice", sharePaise: 100 },
              { memberId: "bob", sharePaise: 100 },
              { memberId: "charlie", sharePaise: 100 },
            ],
          },
          {
            id: "e2",
            paidBy: "bob",
            amountPaise: 150,
            shares: [
              { memberId: "bob", sharePaise: 75 },
              { memberId: "charlie", sharePaise: 75 },
            ],
          },
        ],
        settlements: [
          {
            id: "s1",
            from: "charlie",
            to: "alice",
            amountPaise: 50,
          },
        ],
      };

      const balances = computeBalances(group);
      const sum = Object.values(balances).reduce((acc, val) => acc + val, 0);
      expect(sum).toBe(0);
    });

    it("a 4-person scenario with two payers", () => {
      const group: Group = {
        members: [
          { id: "a", name: "Alice" },
          { id: "b", name: "Bob" },
          { id: "c", name: "Charlie" },
          { id: "d", name: "David" },
        ],
        expenses: [
          // Alice pays 1200 split equally among A, B, C, D (300 each)
          {
            id: "exp1",
            paidBy: "a",
            amountPaise: 1200,
            shares: equalSplit(1200, ["a", "b", "c", "d"]),
          },
          // Bob pays 800 split equally among A, B, C, D (200 each)
          {
            id: "exp2",
            paidBy: "b",
            amountPaise: 800,
            shares: equalSplit(800, ["a", "b", "c", "d"]),
          },
        ],
        settlements: [],
      };

      const balances = computeBalances(group);
      // Alice: +1200 - 300 - 200 = +700
      // Bob: -300 + 800 - 200 = +300
      // Charlie: -300 - 200 = -500
      // David: -300 - 200 = -500
      expect(balances).toEqual({
        a: 700,
        b: 300,
        c: -500,
        d: -500,
      });

      const transfers = simplifyDebts(balances);
      // Charlie and David both owe 500, tie broken by member id: 'c' < 'd' -> c matched first with largest creditor 'a' (700)
      // 1. from c to a: 500 (c becomes 0, a is left with 200)
      // 2. Next largest debtor is d (500), largest creditor is b (300) -> from d to b: 300 (b becomes 0, d owes 200)
      // 3. d owes 200, a is owed 200 -> from d to a: 200
      expect(transfers).toEqual([
        { from: "c", to: "a", amountPaise: 500 },
        { from: "d", to: "b", amountPaise: 300 },
        { from: "d", to: "a", amountPaise: 200 },
      ]);
    });

    it("a fully settled group returns []", () => {
      const group: Group = {
        members: [
          { id: "u1", name: "User 1" },
          { id: "u2", name: "User 2" },
        ],
        expenses: [
          {
            id: "e1",
            paidBy: "u1",
            amountPaise: 200,
            shares: [
              { memberId: "u1", sharePaise: 100 },
              { memberId: "u2", sharePaise: 100 },
            ],
          },
        ],
        settlements: [
          {
            id: "s1",
            from: "u2",
            to: "u1",
            amountPaise: 100,
          },
        ],
      };

      const balances = computeBalances(group);
      expect(balances).toEqual({ u1: 0, u2: 0 });

      const transfers = simplifyDebts(balances);
      expect(transfers).toEqual([]);
    });

    it("a recorded settlement reduces the suggested transfers", () => {
      const groupBeforeSettlement: Group = {
        members: [
          { id: "m1", name: "Member 1" },
          { id: "m2", name: "Member 2" },
        ],
        expenses: [
          {
            id: "exp1",
            paidBy: "m1",
            amountPaise: 1000,
            shares: [
              { memberId: "m1", sharePaise: 0 },
              { memberId: "m2", sharePaise: 1000 },
            ],
          },
        ],
        settlements: [],
      };

      const balancesBefore = computeBalances(groupBeforeSettlement);
      const transfersBefore = simplifyDebts(balancesBefore);
      expect(transfersBefore).toEqual([
        { from: "m2", to: "m1", amountPaise: 1000 },
      ]);

      // Record a partial settlement of 400 from m2 to m1
      const groupAfterSettlement: Group = {
        ...groupBeforeSettlement,
        settlements: [
          {
            id: "set1",
            from: "m2",
            to: "m1",
            amountPaise: 400,
          },
        ],
      };

      const balancesAfter = computeBalances(groupAfterSettlement);
      const transfersAfter = simplifyDebts(balancesAfter);
      expect(transfersAfter).toEqual([
        { from: "m2", to: "m1", amountPaise: 600 },
      ]);

      const totalTransferredBefore = transfersBefore.reduce((acc, t) => acc + t.amountPaise, 0);
      const totalTransferredAfter = transfersAfter.reduce((acc, t) => acc + t.amountPaise, 0);
      expect(totalTransferredAfter).toBeLessThan(totalTransferredBefore);
      expect(totalTransferredAfter).toBe(600);
    });

    it("simplifyDebts breaks ties deterministically by member id", () => {
      // Two creditors with equal credit (50), two debtors with equal debt (50)
      const balances = {
        creditor_b: 50,
        creditor_a: 50,
        debtor_y: -50,
        debtor_x: -50,
      };

      // Debtors sorted by debt (equal) -> id: debtor_x < debtor_y
      // Creditors sorted by credit (equal) -> id: creditor_a < creditor_b
      const transfers = simplifyDebts(balances);
      expect(transfers).toEqual([
        { from: "debtor_x", to: "creditor_a", amountPaise: 50 },
        { from: "debtor_y", to: "creditor_b", amountPaise: 50 },
      ]);
    });
  });

  describe("formatRupees", () => {
    it('formatRupees(5) is "₹0.05" and formatRupees(123450) is "₹1,234.50"', () => {
      expect(formatRupees(5)).toBe("₹0.05");
      expect(formatRupees(123450)).toBe("₹1,234.50");
    });

    it("formats zero and exact rupees without float errors", () => {
      expect(formatRupees(0)).toBe("₹0.00");
      expect(formatRupees(100)).toBe("₹1.00");
      expect(formatRupees(99)).toBe("₹0.99");
      expect(formatRupees(100000)).toBe("₹1,000.00");
    });

    it("formats negative amounts", () => {
      expect(formatRupees(-5)).toBe("-₹0.05");
      expect(formatRupees(-123450)).toBe("-₹1,234.50");
    });
  });
});
