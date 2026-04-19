// ─────────────────────────────────────────────────────────────────────────────
// STORAGE KEYS + SEED + MIGRATION
// ─────────────────────────────────────────────────────────────────────────────
import { todayISO } from "./budgetMath";

export const STORAGE_KEYS = {
  income: "dti_income",
  expenses: "dti_expenses",
  credit: "dti_credit",
  receipts: "ml_receipts",
  assets: "dti_assets",
  liabilities: "dti_liabilities",
  spending: "dti_spending",
};

// ─── DEFAULT SEED DATA ──────────────────────────────────────────────────────
export const DEFAULT_INCOME = [
  { id: "i1", label: "Security Guard (43 hrs/wk @ $35)", amount: 6522, category: "Employment", frequency: "monthly", notes: "", active: true, createdAt: todayISO() },
  { id: "i2", label: "GuardMaps MRR",                    amount: 0,    category: "Business",   frequency: "monthly", notes: "", active: true, createdAt: todayISO() },
  { id: "i3", label: "Van / Delivery Work",              amount: 0,    category: "Gig",        frequency: "monthly", notes: "", active: true, createdAt: todayISO() },
  { id: "i4", label: "Options Trading",                  amount: 0,    category: "Investing",  frequency: "monthly", notes: "", active: true, createdAt: todayISO() },
  { id: "i5", label: "Stocks / Dividends",               amount: 0,    category: "Investing",  frequency: "monthly", notes: "", active: true, createdAt: todayISO() },
];

export const DEFAULT_EXPENSES = [
  { id: "e1",  label: "Rent",                    amount: 500, category: "Housing",       flag: false, frequency: "monthly", notes: "", active: true, date: todayISO(), createdAt: todayISO() },
  { id: "e2",  label: "Health Insurance",         amount: 235, category: "Insurance",     flag: false, frequency: "monthly", notes: "", active: true, date: todayISO(), createdAt: todayISO() },
  { id: "e3",  label: "Car Insurance (3 cars)",   amount: 167, category: "Insurance",     flag: false, frequency: "monthly", notes: "", active: true, date: todayISO(), createdAt: todayISO() },
  { id: "e4",  label: "T-Mobile",                 amount: 300, category: "Telecom",       flag: true,  frequency: "monthly", notes: "", active: true, date: todayISO(), createdAt: todayISO() },
  { id: "e5",  label: "Subscriptions",            amount: 232, category: "Subscriptions", flag: true,  frequency: "monthly", notes: "", active: true, date: todayISO(), createdAt: todayISO() },
  { id: "e6",  label: "Breakfast (weekdays)",     amount: 290, category: "Food",          flag: true,  frequency: "monthly", notes: "", active: true, date: todayISO(), createdAt: todayISO() },
  { id: "e7",  label: "Lunch – Raley's (4x/wk)", amount: 346, category: "Food",          flag: true,  frequency: "monthly", notes: "", active: true, date: todayISO(), createdAt: todayISO() },
  { id: "e8",  label: "Sunday Oxtail 🍖",         amount: 195, category: "Food",          flag: true,  frequency: "monthly", notes: "", active: true, date: todayISO(), createdAt: todayISO() },
  { id: "e9",  label: "Gas",                      amount: 375, category: "Gas",           flag: false, frequency: "monthly", notes: "", active: true, date: todayISO(), createdAt: todayISO() },
  { id: "e10", label: "Haircuts",                 amount: 120, category: "Personal",      flag: false, frequency: "monthly", notes: "", active: true, date: todayISO(), createdAt: todayISO() },
  { id: "e11", label: "Car Wash",                 amount: 20,  category: "Personal",      flag: false, frequency: "monthly", notes: "", active: true, date: todayISO(), createdAt: todayISO() },
  { id: "e12", label: "Lawyer ($3k total)",       amount: 500, category: "Legal",         flag: false, frequency: "monthly", notes: "", active: true, date: todayISO(), createdAt: todayISO() },
];

export const DEFAULT_CREDIT = [
  { id: "c1", label: "Credit Card 1", balance: 0, limit: 0, minPayment: 0, apr: 24.99, category: "Credit Card" },
  { id: "c2", label: "Credit Card 2", balance: 0, limit: 0, minPayment: 0, apr: 21.99, category: "Credit Card" },
  { id: "c3", label: "Auto Loan",     balance: 0, limit: 0, minPayment: 0, apr: 0,     category: "Auto Loan"   },
];

// ─── ID GENERATION ──────────────────────────────────────────────────────────
export function genId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── MIGRATIONS ─────────────────────────────────────────────────────────────
// Older versions of the app stored income/expenses without frequency/active/etc.
// Migrate in place so existing users don't lose data.

export function migrateIncomeItem(item) {
  if (!item || typeof item !== "object") return null;
  return {
    id: item.id || genId("i"),
    label: item.label || "Untitled",
    amount: Number(item.amount) || 0,
    category: item.category || "Employment",
    frequency: item.frequency || "monthly",
    notes: item.notes || "",
    active: item.active !== false,
    createdAt: item.createdAt || todayISO(),
  };
}

export function migrateExpenseItem(item) {
  if (!item || typeof item !== "object") return null;
  // Legacy "Transport" category → normalize to "Transportation"
  let category = item.category || "Miscellaneous";
  if (category === "Transport") category = "Transportation";
  return {
    id: item.id || genId("e"),
    label: item.label || "Untitled",
    amount: Number(item.amount) || 0,
    category,
    frequency: item.frequency || "monthly",
    notes: item.notes || "",
    active: item.active !== false,
    flag: !!item.flag,
    date: item.date || todayISO(),
    createdAt: item.createdAt || todayISO(),
    source: item.source || "manual",
    receiptId: item.receiptId || null,
  };
}

export function migrateIncomeList(list) {
  const src = Array.isArray(list) && list.length ? list : DEFAULT_INCOME;
  return src.map(migrateIncomeItem).filter(Boolean);
}

export function migrateExpenseList(list) {
  const src = Array.isArray(list) && list.length ? list : DEFAULT_EXPENSES;
  return src.map(migrateExpenseItem).filter(Boolean);
}
