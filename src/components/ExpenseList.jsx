import { useState, useMemo } from "react";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "../lib/categories";
import { toPeriod, getFrequency, monthKey, currentMonthKey } from "../lib/budgetMath";
import {
  Card,
  SectionLabel,
  Pill,
  IconButton,
  ConfirmButton,
  PrimaryButton,
  Toast,
  EmptyState,
} from "./ui";
import { fmt, fmtDec } from "./ui-helpers";
import { BudgetItemForm } from "./BudgetItemForm";

export function ExpenseList({
  expenses,
  onAdd,
  onUpdate,
  onDelete,
  onToggleFlag,
  period = "monthly",
  onChangePeriod,
}) {
  const [mode, setMode] = useState(null); // null | "add" | {type:"edit", id}
  const [filter, setFilter] = useState("all"); // all | flagged | receipts
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const totalMonthly = useMemo(
    () =>
      expenses
        .filter((r) => r.active !== false && r.frequency !== "one-time")
        .reduce((s, r) => s + toPeriod(r.amount, r.frequency, "monthly"), 0) +
      expenses
        .filter(
          (r) =>
            r.active !== false &&
            r.frequency === "one-time" &&
            monthKey(r.date) === currentMonthKey()
        )
        .reduce((s, r) => s + (Number(r.amount) || 0), 0),
    [expenses]
  );

  const filtered = useMemo(() => {
    let list = [...expenses];
    if (filter === "flagged") list = list.filter((e) => e.flag);
    if (filter === "receipts") list = list.filter((e) => e.source === "receipt");
    if (categoryFilter !== "all") list = list.filter((e) => e.category === categoryFilter);
    // newest first by createdAt; recurring first when dates tied
    list.sort((a, b) => {
      if (a.frequency === "one-time" && b.frequency !== "one-time") return 1;
      if (a.frequency !== "one-time" && b.frequency === "one-time") return -1;
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });
    return list;
  }, [expenses, filter, categoryFilter]);

  const handleAdd = (draft) => {
    const item = onAdd(draft);
    setMode(null);
    showToast(`Added ${item.label} · ${fmtDec(item.amount)}`);
  };

  const handleUpdate = (draft) => {
    onUpdate(draft.id, draft);
    setMode(null);
    showToast(`Updated ${draft.label}`);
  };

  const handleDelete = (row) => {
    onDelete(row.id);
    showToast(`Deleted ${row.label} — totals updated`);
  };

  const editing =
    mode && typeof mode === "object" && mode.type === "edit"
      ? expenses.find((r) => r.id === mode.id)
      : null;

  const presentCategories = useMemo(() => {
    const set = new Set(expenses.map((e) => e.category || "Miscellaneous"));
    return ["all", ...Array.from(set)];
  }, [expenses]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Toast msg={toast} color="#f87171" />

      <PeriodToggle value={period} onChange={onChangePeriod} />

      {mode === "add" && (
        <BudgetItemForm
          kind="expense"
          initial={null}
          onSave={handleAdd}
          onCancel={() => setMode(null)}
        />
      )}

      {editing && (
        <BudgetItemForm
          kind="expense"
          initial={editing}
          onSave={handleUpdate}
          onCancel={() => setMode(null)}
        />
      )}

      {!mode && (
        <PrimaryButton
          onClick={() => setMode("add")}
          color="#ff4d6d"
          style={{ color: "white" }}
        >
          + Add Expense
        </PrimaryButton>
      )}

      {/* Filter row */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "#12131a",
          padding: 3,
          borderRadius: 8,
          border: "1px solid #1e1f2e",
        }}
      >
        {[
          ["all", `All (${expenses.length})`],
          ["flagged", `Leaks (${expenses.filter((e) => e.flag).length})`],
          ["receipts", `Receipts (${expenses.filter((e) => e.source === "receipt").length})`],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            style={{
              flex: 1,
              padding: "6px 0",
              border: "none",
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              background: filter === k ? "#f87171" : "transparent",
              color: filter === k ? "#0a0b12" : "#64748b",
              transition: "all 0.2s",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {presentCategories.length > 2 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {presentCategories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              style={{
                background: categoryFilter === c ? "#e2e8f015" : "#12131a",
                border: `1px solid ${categoryFilter === c ? "#e2e8f030" : "#1e1f2e"}`,
                borderRadius: 99,
                padding: "4px 10px",
                color: categoryFilter === c ? "#e2e8f0" : "#64748b",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {c === "all" ? "All categories" : c}
            </button>
          ))}
        </div>
      )}

      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <SectionLabel color="#f87171">
            Expenses ({filtered.length})
          </SectionLabel>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 13,
              fontWeight: 800,
              color: "#f87171",
            }}
          >
            {fmt(totalMonthly)}
            <span style={{ color: "#64748b", fontSize: 10, fontWeight: 600 }}> /mo</span>
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="🧾"
            title="Nothing here"
            body={
              filter === "flagged"
                ? "You haven't flagged any expenses as leaks yet."
                : filter === "receipts"
                ? "Upload a receipt in the Receipts tab to see it here."
                : "Hit 'Add Expense' to start tracking."
            }
          />
        ) : (
          filtered.map((row) => (
            <ExpenseRow
              key={row.id}
              row={row}
              period={period}
              onEdit={() => setMode({ type: "edit", id: row.id })}
              onDelete={() => handleDelete(row)}
              onToggleFlag={() => onToggleFlag(row.id)}
            />
          ))
        )}

        <TotalsFooter monthly={totalMonthly} color="#f87171" />
      </Card>
    </div>
  );
}

function ExpenseRow({ row, period, onEdit, onDelete, onToggleFlag }) {
  const freq = getFrequency(row.frequency);
  const isOneTime = row.frequency === "one-time";
  const periodAmt = isOneTime
    ? Number(row.amount) || 0
    : toPeriod(row.amount, row.frequency, period);
  const color = CATEGORY_COLORS[row.category] || "#94a3b8";
  const icon = CATEGORY_ICONS[row.category] || "📦";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid #1e1f2e",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minWidth: 0,
          flex: 1,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 16,
          }}
        >
          {icon}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: "#e2e8f0",
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {row.label}
            </span>
            {row.flag && <Pill label="Leak" color="#ff4d6d" />}
            {row.source === "receipt" && <Pill label="Receipt" color="#60a5fa" />}
            {isOneTime && <Pill label="One-time" color="#94a3b8" />}
          </div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
            {row.category} · {isOneTime ? row.date : freq.label}
            {row.notes ? ` · ${row.notes}` : ""}
          </div>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 13,
            fontWeight: 800,
            color: "#f87171",
          }}
        >
          −{fmt(periodAmt)}
        </div>
        <div
          style={{
            display: "flex",
            gap: 4,
            marginTop: 5,
            justifyContent: "flex-end",
          }}
        >
          {!isOneTime && (
            <IconButton
              title={row.flag ? "Unflag leak" : "Flag as leak"}
              onClick={onToggleFlag}
              color={row.flag ? "#ff4d6d" : "#64748b"}
              bg={row.flag ? "#ff4d6d20" : "#1e1f2e"}
            >
              {row.flag ? "★" : "☆"}
            </IconButton>
          )}
          <IconButton title="Edit" onClick={onEdit}>
            ✎
          </IconButton>
          <ConfirmButton onConfirm={onDelete} />
        </div>
      </div>
    </div>
  );
}

function PeriodToggle({ value, onChange }) {
  const periods = [
    { key: "monthly", label: "Monthly" },
    { key: "quarterly", label: "Quarterly" },
    { key: "yearly", label: "Yearly" },
  ];
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        background: "#1e1f2e",
        padding: 3,
        borderRadius: 8,
      }}
    >
      {periods.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          style={{
            flex: 1,
            padding: "6px 0",
            border: "none",
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 700,
            cursor: "pointer",
            background: value === p.key ? "#f87171" : "transparent",
            color: value === p.key ? "#0a0b12" : "#64748b",
            transition: "all 0.2s",
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function TotalsFooter({ monthly, color }) {
  return (
    <div
      style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: "1px solid #2a2b3d",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {[
        ["Monthly", 1],
        ["Quarterly", 3],
        ["Yearly", 12],
      ].map(([label, mult]) => (
        <div
          key={label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
            {label}
          </span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 14,
              fontWeight: 800,
              color,
            }}
          >
            {fmt(monthly * mult)}
          </span>
        </div>
      ))}
    </div>
  );
}
