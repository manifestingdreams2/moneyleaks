import { useState, useEffect } from "react";
import { FREQUENCIES } from "../lib/budgetMath";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, suggestCategory } from "../lib/categories";
import { SectionLabel, PrimaryButton, GhostButton } from "./ui";
import { inputStyle } from "./ui-helpers";

/**
 * Reusable add/edit form for income OR expense items.
 *
 * Props:
 * - kind: "income" | "expense"
 * - initial: existing item (for edit) or null (for add)
 * - onSave: (draft) => void
 * - onCancel: () => void
 */
export function BudgetItemForm({ kind, initial = null, onSave, onCancel }) {
  const isExpense = kind === "expense";
  const categoryList = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const accent = isExpense ? "#ff4d6d" : "#00e5a0";

  const [label, setLabel] = useState(initial?.label ?? "");
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : "");
  const [category, setCategory] = useState(initial?.category ?? (isExpense ? "Food" : "Employment"));
  const [frequency, setFrequency] = useState(initial?.frequency ?? "monthly");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [flag, setFlag] = useState(!!initial?.flag);
  const [error, setError] = useState("");

  // When label changes, auto-suggest category (only when adding a new expense)
  useEffect(() => {
    if (!initial && isExpense && label.trim().length >= 3) {
      const guess = suggestCategory(label);
      if (guess && guess !== "Miscellaneous") setCategory(guess);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (!label.trim()) {
      setError("Give this item a name");
      return;
    }
    if (isNaN(amt) || amt < 0) {
      setError("Enter a valid amount (0 or more)");
      return;
    }
    setError("");
    const draft = {
      ...(initial || {}),
      label: label.trim(),
      amount: amt,
      category,
      frequency,
      notes: notes.trim(),
    };
    if (isExpense) draft.flag = flag;
    onSave(draft);
  };

  return (
    <div
      style={{
        background: "#12131a",
        border: `1px solid ${accent}35`,
        borderRadius: 14,
        padding: 14,
      }}
    >
      <SectionLabel color={accent}>
        {initial ? `Edit ${isExpense ? "Expense" : "Income"}` : `New ${isExpense ? "Expense" : "Income"}`}
      </SectionLabel>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={labelStyle}>Name *</label>
          <input
            type="text"
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={isExpense ? "e.g. T-Mobile, Costco groceries" : "e.g. Security Guard, Side gig"}
            style={inputStyle}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={labelStyle}>Amount *</label>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              style={{ ...inputStyle, fontFamily: "monospace", fontWeight: 700 }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div>
            <label style={labelStyle}>How often</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {FREQUENCIES.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            {categoryList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. switch carriers in March"
            style={inputStyle}
          />
        </div>

        {isExpense && (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#1a1b26",
              padding: "10px 12px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={flag}
              onChange={(e) => setFlag(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#ff4d6d", cursor: "pointer" }}
            />
            <span style={{ fontSize: 12, color: "#e2e8f0" }}>
              Flag as a <span style={{ color: "#ff4d6d", fontWeight: 700 }}>leak</span> to track in Savings
            </span>
          </label>
        )}

        {error && (
          <p style={{ color: "#ff4d6d", fontSize: 11, marginTop: -4 }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <PrimaryButton onClick={handleSave} color={accent} style={{ color: isExpense ? "white" : "#0a0b12" }}>
            {initial ? "Save changes" : `Add ${isExpense ? "expense" : "income"}`}
          </PrimaryButton>
          <GhostButton onClick={onCancel} style={{ flex: "0 0 auto", width: "auto", padding: "12px 16px" }}>
            Cancel
          </GhostButton>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: 10,
  color: "#64748b",
  fontWeight: 700,
  textTransform: "uppercase",
  display: "block",
  marginBottom: 4,
  letterSpacing: 0.5,
};
