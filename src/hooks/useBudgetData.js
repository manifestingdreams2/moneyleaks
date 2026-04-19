import { useEffect, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import {
  STORAGE_KEYS,
  DEFAULT_INCOME,
  DEFAULT_EXPENSES,
  migrateIncomeList,
  migrateExpenseList,
  migrateIncomeItem,
  migrateExpenseItem,
  genId,
} from "../lib/storage";
import {
  sumRecurringMonthly,
  sumOneTimeInMonth,
  sumItemsForMonth,
  currentMonthKey,
  previousMonthKey,
  compareMonths,
  todayISO,
} from "../lib/budgetMath";
import { saveCategoryOverride } from "../lib/categories";

/**
 * Central budget data hook: income + expenses + receipts, all persisted to
 * localStorage. Returns rich derived totals so consumers don't re-do the math.
 */
export function useBudgetData() {
  const [income, setIncome] = useLocalStorage(STORAGE_KEYS.income, DEFAULT_INCOME);
  const [expenses, setExpenses] = useLocalStorage(STORAGE_KEYS.expenses, DEFAULT_EXPENSES);
  const [receipts, setReceipts] = useLocalStorage(STORAGE_KEYS.receipts, []);

  // ─── One-time migration: normalize seeded records to the new schema ──────
  useEffect(() => {
    const migratedIncome = migrateIncomeList(income);
    if (JSON.stringify(migratedIncome) !== JSON.stringify(income)) {
      setIncome(migratedIncome);
    }
    const migratedExpenses = migrateExpenseList(expenses);
    if (JSON.stringify(migratedExpenses) !== JSON.stringify(expenses)) {
      setExpenses(migratedExpenses);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── INCOME CRUD ─────────────────────────────────────────────────────────
  const addIncome = (draft) => {
    const item = migrateIncomeItem({
      ...draft,
      id: draft.id || genId("i"),
      createdAt: draft.createdAt || todayISO(),
    });
    setIncome((prev) => [...prev, item]);
    return item;
  };

  const updateIncome = (id, patch) => {
    setIncome((prev) =>
      prev.map((r) => (r.id === id ? migrateIncomeItem({ ...r, ...patch }) : r))
    );
  };

  const deleteIncome = (id) => {
    setIncome((prev) => prev.filter((r) => r.id !== id));
  };

  // Legacy helper used by the existing <EditableAmount/> inline editor
  const setIncomeAmount = (id, amount) => updateIncome(id, { amount: Number(amount) || 0 });

  // ─── EXPENSE CRUD ────────────────────────────────────────────────────────
  const addExpense = (draft) => {
    const item = migrateExpenseItem({
      ...draft,
      id: draft.id || genId("e"),
      date: draft.date || todayISO(),
      createdAt: draft.createdAt || todayISO(),
    });
    setExpenses((prev) => [...prev, item]);
    return item;
  };

  const updateExpense = (id, patch) => {
    setExpenses((prev) =>
      prev.map((r) => (r.id === id ? migrateExpenseItem({ ...r, ...patch }) : r))
    );
    // If the user edited the category for a receipt-backed expense, remember it
    if (patch && patch.category && patch.label) {
      saveCategoryOverride(patch.label, patch.category);
    }
  };

  const deleteExpense = (id) => {
    const target = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((r) => r.id !== id));
    // Clean up orphan receipt references
    if (target && target.receiptId) {
      setReceipts((prev) =>
        prev.map((r) => (r.id === target.receiptId ? { ...r, expenseId: null } : r))
      );
    }
  };

  const setExpenseAmount = (id, amount) => updateExpense(id, { amount: Number(amount) || 0 });

  const toggleExpenseFlag = (id) => {
    setExpenses((prev) => prev.map((r) => (r.id === id ? { ...r, flag: !r.flag } : r)));
  };

  // ─── RECEIPTS ────────────────────────────────────────────────────────────
  /**
   * Adds a receipt record AND (when totals > 0) a corresponding one-time
   * expense tied to it. Returns { receipt, expense }.
   */
  const addReceipt = (draft) => {
    const id = genId("r");
    const receipt = {
      id,
      dataURL: draft.dataURL || "",
      fileName: draft.fileName || "",
      fileType: draft.fileType || "",
      merchant: draft.merchant || "",
      total: Number(draft.total) || 0,
      category: draft.category || "Miscellaneous",
      date: draft.date || todayISO(),
      notes: draft.notes || "",
      expenseId: null,
      createdAt: new Date().toISOString(),
    };

    let expense = null;
    if (receipt.total > 0) {
      expense = addExpense({
        label: receipt.merchant || receipt.fileName || "Receipt",
        amount: receipt.total,
        category: receipt.category,
        frequency: "one-time",
        notes: receipt.notes,
        active: true,
        flag: false,
        date: receipt.date,
        source: "receipt",
        receiptId: receipt.id,
      });
      receipt.expenseId = expense.id;
    }

    // Remember this merchant→category mapping for future receipts
    if (receipt.merchant && receipt.category) {
      saveCategoryOverride(receipt.merchant, receipt.category);
    }

    setReceipts((prev) => [receipt, ...prev]);
    return { receipt, expense };
  };

  const updateReceipt = (id, patch) => {
    setReceipts((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    // If category changed, sync the linked expense
    if (patch && (patch.category || patch.total || patch.merchant)) {
      const r = receipts.find((x) => x.id === id);
      if (r && r.expenseId) {
        const nextCat = patch.category || r.category;
        const nextTotal = patch.total !== undefined ? Number(patch.total) || 0 : r.total;
        const nextMerchant = patch.merchant || r.merchant;
        updateExpense(r.expenseId, {
          category: nextCat,
          amount: nextTotal,
          label: nextMerchant || "Receipt",
        });
      }
    }
  };

  const deleteReceipt = (id) => {
    const target = receipts.find((r) => r.id === id);
    setReceipts((prev) => prev.filter((r) => r.id !== id));
    if (target && target.expenseId) {
      deleteExpense(target.expenseId);
    }
  };

  // ─── DERIVED TOTALS ──────────────────────────────────────────────────────
  const cMonth = currentMonthKey();
  const pMonth = previousMonthKey();

  const totalIncomeMonthly = useMemo(
    () => sumRecurringMonthly(income) + sumOneTimeInMonth(income, cMonth),
    [income, cMonth]
  );
  const totalExpensesMonthly = useMemo(
    () => sumRecurringMonthly(expenses) + sumOneTimeInMonth(expenses, cMonth),
    [expenses, cMonth]
  );
  const totalExpensesPrevMonth = useMemo(
    () => sumItemsForMonth(expenses, pMonth),
    [expenses, pMonth]
  );
  const totalIncomePrevMonth = useMemo(
    () => sumItemsForMonth(income, pMonth),
    [income, pMonth]
  );
  const flaggedMonthly = useMemo(
    () => sumRecurringMonthly(expenses.filter((e) => e.flag)),
    [expenses]
  );

  const monthlyComparison = useMemo(
    () => compareMonths(expenses, cMonth, pMonth),
    [expenses, cMonth, pMonth]
  );

  const incomeComparison = useMemo(
    () => compareMonths(income, cMonth, pMonth),
    [income, cMonth, pMonth]
  );

  return {
    // data
    income,
    expenses,
    receipts,

    // income ops
    addIncome,
    updateIncome,
    deleteIncome,
    setIncomeAmount,

    // expense ops
    addExpense,
    updateExpense,
    deleteExpense,
    setExpenseAmount,
    toggleExpenseFlag,

    // receipt ops
    addReceipt,
    updateReceipt,
    deleteReceipt,

    // totals
    totalIncomeMonthly,
    totalExpensesMonthly,
    totalIncomePrevMonth,
    totalExpensesPrevMonth,
    flaggedMonthly,

    // month comparison
    monthlyComparison,
    incomeComparison,
    currentMonth: cMonth,
    previousMonth: pMonth,
  };
}
