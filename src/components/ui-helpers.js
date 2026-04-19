// Pure helpers + constants used by the new components.
// Kept separate from ui.jsx so react-refresh stays happy.

export const fmt = (n) =>
  Number(n || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export const fmtDec = (n) =>
  Number(n || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const fmtSigned = (n) => {
  const v = Number(n) || 0;
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}${fmt(Math.abs(v))}`;
};

export const inputStyle = {
  width: "100%",
  background: "#1e1f2e",
  border: "1px solid #2a2b3d",
  borderRadius: 8,
  color: "white",
  fontSize: 14,
  padding: "10px 12px",
  outline: "none",
  fontFamily: "inherit",
  appearance: "none",
};
