import { useState, useMemo } from "react";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "../lib/categories";
import { FREQUENCIES, toPeriod, getFrequency } from "../lib/budgetMath";
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

export function IncomeList({
  income,
  onAdd,
  onUpdate,
  onDelete,
  period = "monthly",
  onChangePeriod,
}) {
  const [mode, setMode] = useState(null); // null | "add" | {type:"edit", id}
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const totalMonthly = useMemo(
    () =>
      income
        .filter((r) => r.active !== false)
        .reduce((s, r) => s + toPeriod(r.amount, r.frequency, "monthly"), 0),
    [income]
  );

  const handleAdd = (draft) => {
    const item = onAdd(draft);
    setMode(null);
    showToast(`Added ${fmtDec(item.amount)} from ${item.label}`);
  };

  const handleUpdate = (draft) => {
    onUpdate(draft.id, draft);
    setMode(null);
    showToast(`Updated ${draft.label}`);
  };

  const handleDelete = (row) => {
    onDelete(row.id);
    showToast(`Removed ${row.label}`);
  };

  const editing =
    mode && typeof mode === "object" && mode.type === "edit"
      ? income.find((r) => r.id === mode.id)
      : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Toast msg={toast} color="#00e5a0" />

      <PeriodToggle value={period} onChange={onChangePeriod} />

      {mode === "add" && (
        <BudgetItemForm
          kind="income"
          initial={null}
          onSave={handleAdd}
          onCancel={() => setMode(null)}
        />
      )}

      {editing && (
        <BudgetItemForm
          kind="income"
          initial={editing}
          onSave={handleUpdate}
          onCancel={() => setMode(null)}
        />
      )}

      {!mode && (
        <PrimaryButton onClick={() => setMode("add")} color="#00e5a0">
          + Add Income
        </PrimaryButton>
      )}

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SectionLabel color="#00e5a0">
            Income Streams ({income.length})
          </SectionLabel>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 13,
              fontWeight: 800,
              color: "#00e5a0",
            }}
          >
            {fmt(totalMonthly)}
            <span style={{ color: "#64748b", fontSize: 10, fontWeight: 600 }}> /mo</span>
          </span>
        </div>

        {income.length === 0 ? (
          <EmptyState
            icon="💸"
            title="No income yet"
            body="Tap 'Add Income' to record your paycheck, side gigs, or investments."
          />
        ) : (
          income.map((row) => {
            const freq = getFrequency(row.frequency);
            const periodAmt = toPeriod(row.amount, row.frequency, period);
            const color = CATEGORY_COLORS[row.category] || "#00e5a0";
            const icon = CATEGORY_ICONS[row.category] || "💼";
            return (
              <div
                key={row.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid #1e1f2e",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
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
                      <Pill label={freq.label} color={color} />
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#64748b",
                        marginTop: 2,
                      }}
                    >
                      {row.category}
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
                      color: "#00e5a0",
                    }}
                  >
                    {fmt(periodAmt)}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      marginTop: 5,
                      justifyContent: "flex-end",
                    }}
                  >
                    <IconButton
                      title="Edit"
                      onClick={() => setMode({ type: "edit", id: row.id })}
                    >
                      ✎
                    </IconButton>
                    <ConfirmButton onConfirm={() => handleDelete(row)} />
                  </div>
                </div>
              </div>
            );
          })
        )}

        <TotalsFooter monthly={totalMonthly} color="#00e5a0" />
      </Card>
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
            background: value === p.key ? "#00e5a0" : "transparent",
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
