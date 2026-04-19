import { useMemo } from "react";
import {
  currentMonthKey,
  previousMonthKey,
  formatMonthLabel,
  compareMonths,
  categoryTotalsForMonth,
} from "../lib/budgetMath";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "../lib/categories";
import { Card, SectionLabel, Pill } from "./ui";
import { fmt, fmtSigned } from "./ui-helpers";

/**
 * Monthly progress summary card.
 * Props:
 * - expenses, income
 * - compact: (optional) for rendering inline on Overview
 */
export function MonthlySummary({ expenses, income, compact = false }) {
  const cm = currentMonthKey();
  const pm = previousMonthKey();

  const expenseCmp = useMemo(() => compareMonths(expenses, cm, pm), [expenses, cm, pm]);
  const incomeCmp = useMemo(() => compareMonths(income, cm, pm), [income, cm, pm]);

  const leakDelta = expenseCmp.totalDelta; // +ve = spending more
  const savingsCapacityDelta = -leakDelta + incomeCmp.totalDelta;

  // If there's literally no prior month data we show an onboarding state
  const hasHistory =
    expenseCmp.totalPrevious > 0 || incomeCmp.totalPrevious > 0 ||
    expenseCmp.byCategory.some((c) => c.previous > 0);

  const headerNode = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 8,
      }}
    >
      <div>
        <SectionLabel color="#c084fc">📅 Monthly Progress</SectionLabel>
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: -4 }}>
          {formatMonthLabel(cm)} vs {formatMonthLabel(pm)}
        </p>
      </div>
      <Pill
        label={
          leakDelta <= 0 ? "Improving" : "Watch"
        }
        color={leakDelta <= 0 ? "#00e5a0" : "#ff8c42"}
      />
    </div>
  );

  const heroGrid = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 8,
        marginTop: 12,
      }}
    >
      <HeroStat
        label="Spent This Month"
        value={fmt(expenseCmp.totalCurrent)}
        delta={expenseCmp.totalDelta}
        positiveIsGood={false}
      />
      <HeroStat
        label="Income This Month"
        value={fmt(incomeCmp.totalCurrent)}
        delta={incomeCmp.totalDelta}
        positiveIsGood={true}
      />
      <HeroStat
        label="Savings Capacity"
        value={fmtSigned(savingsCapacityDelta)}
        delta={savingsCapacityDelta}
        positiveIsGood={true}
        deltaLabel={savingsCapacityDelta >= 0 ? "vs last month ↑" : "vs last month ↓"}
      />
    </div>
  );

  if (!hasHistory) {
    return (
      <Card style={{ border: "1px solid #c084fc30" }}>
        {headerNode}
        <div
          style={{
            marginTop: 12,
            background: "#1a0f2a",
            borderLeft: "3px solid #c084fc",
            padding: "12px 14px",
            borderRadius: 8,
          }}
        >
          <p style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.6 }}>
            <b>Tracking your first month.</b> Once you log receipts or roll into
            next month, you'll see side-by-side comparisons here — which
            categories went up, which went down, and how much leak you
            eliminated.
          </p>
        </div>
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
            Current month snapshot
          </p>
          <CategorySnapshot totals={categoryTotalsForMonth(expenses, cm)} />
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ border: "1px solid #c084fc30" }}>
      {headerNode}
      {heroGrid}

      {/* Top improvements */}
      {expenseCmp.topImproved.length > 0 && (
        <SummarySection title="✅ Where You Improved" color="#00e5a0">
          {expenseCmp.topImproved.map((c) => (
            <DeltaRow
              key={c.category}
              entry={c}
              goodDirection="down"
            />
          ))}
        </SummarySection>
      )}

      {/* Regressions */}
      {expenseCmp.topWorsened.length > 0 && (
        <SummarySection title="⚠️ Where You Spent More" color="#ff8c42">
          {expenseCmp.topWorsened.map((c) => (
            <DeltaRow
              key={c.category}
              entry={c}
              goodDirection="down"
            />
          ))}
        </SummarySection>
      )}

      {/* Full table */}
      {!compact && expenseCmp.byCategory.length > 0 && (
        <SummarySection title="All categories" color="#94a3b8">
          {expenseCmp.byCategory.map((c) => (
            <DeltaRow key={c.category} entry={c} goodDirection="down" dense />
          ))}
        </SummarySection>
      )}

      {/* Footer summary */}
      <div
        style={{
          marginTop: 14,
          padding: "12px 14px",
          background: leakDelta <= 0 ? "#0d2b1f" : "#2b1a0d",
          borderRadius: 10,
          borderLeft: `3px solid ${leakDelta <= 0 ? "#00e5a0" : "#ff8c42"}`,
        }}
      >
        <p style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.6 }}>
          {leakDelta < 0 ? (
            <>
              <b style={{ color: "#00e5a0" }}>
                Monthly leak reduced by {fmt(Math.abs(leakDelta))}.
              </b>{" "}
              That's {fmt(Math.abs(leakDelta) * 12)} back over a year if this
              keeps up.
            </>
          ) : leakDelta > 0 ? (
            <>
              <b style={{ color: "#ff8c42" }}>
                Spending up {fmt(leakDelta)} vs last month.
              </b>{" "}
              Review the regressions above to find the fix.
            </>
          ) : (
            <>Spending held steady vs last month.</>
          )}
        </p>
      </div>
    </Card>
  );
}

function HeroStat({ label, value, delta, positiveIsGood, deltaLabel }) {
  const up = (delta || 0) > 0;
  const down = (delta || 0) < 0;
  const isGood = positiveIsGood ? up : down;
  const color = (delta || 0) === 0 ? "#94a3b8" : isGood ? "#00e5a0" : "#ff4d6d";
  const arrow = (delta || 0) === 0 ? "→" : up ? "↑" : "↓";

  return (
    <div
      style={{
        background: "#1a1b26",
        borderRadius: 10,
        padding: "10px 10px",
        border: "1px solid #1e1f2e",
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: "#64748b",
          fontWeight: 700,
          textTransform: "uppercase",
          marginBottom: 4,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 13,
          fontWeight: 800,
          color: "#e2e8f0",
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          color,
          fontWeight: 700,
          marginTop: 4,
        }}
      >
        {arrow} {deltaLabel || fmtSigned(delta)}
      </div>
    </div>
  );
}

function DeltaRow({ entry, goodDirection, dense = false }) {
  const icon = CATEGORY_ICONS[entry.category] || "📦";
  const decreased = entry.delta < 0;
  const isGood = goodDirection === "down" ? decreased : !decreased;
  const deltaColor = entry.delta === 0 ? "#94a3b8" : isGood ? "#00e5a0" : "#ff4d6d";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: dense ? "6px 0" : "8px 0",
        borderBottom: "1px solid #1e1f2e",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>
            {entry.category}
          </div>
          <div style={{ fontSize: 10, color: "#64748b" }}>
            {fmt(entry.current)} · was {fmt(entry.previous)}
          </div>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 12,
            fontWeight: 800,
            color: deltaColor,
          }}
        >
          {entry.delta === 0
            ? "—"
            : `${entry.delta < 0 ? "−" : "+"}${fmt(Math.abs(entry.delta))}`}
        </div>
        {!dense && entry.previous > 0 && (
          <div style={{ fontSize: 9, color: "#64748b", fontFamily: "monospace" }}>
            {entry.pct > 0 ? "+" : ""}
            {entry.pct.toFixed(0)}%
          </div>
        )}
      </div>
    </div>
  );
}

function SummarySection({ title, color, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <p
        style={{
          fontSize: 10,
          color,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 6,
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function CategorySnapshot({ totals }) {
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  if (!rows.length) {
    return (
      <p style={{ fontSize: 11, color: "#64748b" }}>
        No spending tracked this month yet.
      </p>
    );
  }
  const grandTotal = rows.reduce((s, [, v]) => s + v, 0);
  return (
    <div>
      {rows.map(([cat, amt]) => {
        const color = CATEGORY_COLORS[cat] || "#94a3b8";
        const pct = grandTotal > 0 ? (amt / grandTotal) * 100 : 0;
        return (
          <div key={cat} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 12, color: "#e2e8f0" }}>
                {CATEGORY_ICONS[cat] || "📦"} {cat}
              </span>
              <span style={{ fontFamily: "monospace", fontSize: 11, color, fontWeight: 700 }}>
                {fmt(amt)}
              </span>
            </div>
            <div style={{ background: "#1e1f2e", borderRadius: 99, height: 4, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width 0.3s" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
