import { useState, useEffect, useRef } from "react";

export function Card({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#12131a",
        border: "1px solid #1e1f2e",
        borderRadius: 14,
        padding: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children, color = "#64748b" }) {
  return (
    <p
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1,
        color,
        textTransform: "uppercase",
        marginBottom: 12,
      }}
    >
      {children}
    </p>
  );
}

export function Pill({ label, color = "#94a3b8", bg }) {
  return (
    <span
      style={{
        fontSize: 9,
        color,
        background: bg || color + "18",
        padding: "2px 8px",
        borderRadius: 99,
        fontWeight: 700,
        letterSpacing: 0.5,
      }}
    >
      {String(label).toUpperCase()}
    </span>
  );
}

export function PrimaryButton({
  children,
  color = "#00e5a0",
  onClick,
  style = {},
  type = "button",
  disabled = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: color,
        border: "none",
        borderRadius: 10,
        padding: "12px",
        color: "#0a0b12",
        fontSize: 13,
        fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        width: "100%",
        letterSpacing: 0.3,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, style = {}, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        background: "#1e1f2e",
        border: "1px solid #2a2b3d",
        borderRadius: 10,
        padding: "12px",
        color: "#94a3b8",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        width: "100%",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  onClick,
  title,
  color = "#64748b",
  bg = "#1e1f2e",
  style = {},
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        background: bg,
        border: "none",
        borderRadius: 6,
        color,
        fontSize: 12,
        padding: "4px 8px",
        cursor: "pointer",
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function EmptyState({ icon = "📭", title, body }) {
  return (
    <div style={{ textAlign: "center", padding: "24px 0" }}>
      <p style={{ fontSize: 24, marginBottom: 8 }}>{icon}</p>
      {title && (
        <p style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
          {title}
        </p>
      )}
      {body && <p style={{ color: "#64748b", fontSize: 12, lineHeight: 1.5 }}>{body}</p>}
    </div>
  );
}

export function Toast({ msg, color = "#00e5a0" }) {
  if (!msg) return null;
  return (
    <div
      style={{
        background: `${color}15`,
        border: `1px solid ${color}30`,
        borderRadius: 10,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
        animation: "fadeIn 0.3s ease",
      }}
    >
      <span style={{ fontSize: 14 }}>💡</span>
      <span style={{ fontSize: 12, color, fontWeight: 600, lineHeight: 1.4 }}>{msg}</span>
    </div>
  );
}

export function ConfirmButton({ onConfirm, label = "Delete", confirmLabel = "Tap again" }) {
  const [armed, setArmed] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const arm = () => {
    setArmed(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setArmed(false), 3000);
  };

  const handle = (e) => {
    e.stopPropagation();
    if (armed) {
      clearTimeout(timer.current);
      setArmed(false);
      onConfirm();
    } else {
      arm();
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      style={{
        background: armed ? "#ff4d6d" : "#1e1f2e",
        border: armed ? "1px solid #ff4d6d" : "1px solid #2a2b3d",
        borderRadius: 7,
        padding: "5px 10px",
        color: armed ? "white" : "#94a3b8",
        fontSize: 10,
        fontWeight: 700,
        cursor: "pointer",
        letterSpacing: 0.3,
        transition: "all 0.15s",
      }}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}
