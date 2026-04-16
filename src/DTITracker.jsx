import React from "react";

export default function DTITracker() {
  const totalAssets = 0;
  const totalLiabilities = 0;
  const netWorth = totalAssets - totalLiabilities;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        
        {/* HEADER */}
        <div style={{ marginBottom: 20 }}>
          <p style={styles.tag}>MONEY LEAKS</p>
          <h1 style={styles.title}>Financial Dashboard</h1>
          <p style={styles.subtitle}>
            Track assets, liabilities, and your net worth.
          </p>
        </div>

        {/* NET WORTH CARD */}
        <div style={styles.cardGlow}>
          <p style={styles.label}>NET WORTH</p>
          <h2 style={styles.bigMoney}>${netWorth}</h2>

          <div style={styles.row}>
            <div>
              <p style={styles.smallLabel}>Assets</p>
              <p style={{ ...styles.money, color: "#22c55e" }}>
                ${totalAssets}
              </p>
            </div>

            <div>
              <p style={styles.smallLabel}>Liabilities</p>
              <p style={{ ...styles.money, color: "#ef4444" }}>
                ${totalLiabilities}
              </p>
            </div>
          </div>
        </div>

        {/* ADD ASSET */}
        <div style={styles.card}>
          <p style={styles.label}>ADD ASSET</p>

          <input style={styles.input} placeholder="Asset name" />

          <div style={styles.inputWrap}>
            <span style={styles.dollar}>$</span>
            <input style={styles.inputMoney} placeholder="0.00" />
          </div>

          <select style={styles.input}>
            <option>Vehicle</option>
            <option>Cash</option>
            <option>Investment</option>
          </select>

          <div style={styles.btnRow}>
            <button style={styles.primaryBtn}>Save</button>
            <button style={styles.secondaryBtn}>Cancel</button>
          </div>
        </div>

        {/* ASSETS */}
        <div style={styles.card}>
          <div style={styles.sectionHeader}>
            <p style={styles.label}>ASSETS</p>
            <p style={{ color: "#22c55e", fontWeight: "bold" }}>$0.00</p>
          </div>

          <div style={styles.emptyBox}>
            <p>No assets yet</p>
          </div>
        </div>

        {/* LIABILITIES */}
        <div style={styles.card}>
          <div style={styles.sectionHeader}>
            <p style={styles.label}>LIABILITIES</p>
            <p style={{ color: "#ef4444", fontWeight: "bold" }}>$0.00</p>
          </div>

          <div style={styles.emptyBox}>
            <p>No liabilities yet</p>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "#060B16",
    minHeight: "100vh",
    color: "white",
    padding: 20,
  },

  container: {
    maxWidth: 420,
    margin: "0 auto",
  },

  tag: {
    fontSize: 12,
    color: "#22c55e",
    letterSpacing: 2,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 14,
    color: "#888",
  },

  cardGlow: {
    background: "linear-gradient(180deg, rgba(34,197,94,0.15), rgba(255,255,255,0.02))",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },

  card: {
    background: "#0B1020",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    border: "1px solid rgba(255,255,255,0.05)",
  },

  label: {
    fontSize: 12,
    opacity: 0.6,
    letterSpacing: 1,
  },

  smallLabel: {
    fontSize: 10,
    opacity: 0.5,
  },

  bigMoney: {
    fontSize: 32,
    fontWeight: "bold",
  },

  money: {
    fontSize: 18,
    fontWeight: "bold",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 15,
  },

  input: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    background: "#111827",
    border: "1px solid #333",
    color: "white",
  },

  inputWrap: {
    position: "relative",
  },

  dollar: {
    position: "absolute",
    left: 10,
    top: 16,
    color: "#888",
  },

  inputMoney: {
    width: "100%",
    padding: "12px 12px 12px 25px",
    borderRadius: 12,
    marginTop: 10,
    background: "#111827",
    border: "1px solid #333",
    color: "white",
  },

  btnRow: {
    display: "flex",
    gap: 10,
    marginTop: 15,
  },

  primaryBtn: {
    flex: 1,
    background: "#22c55e",
    color: "black",
    padding: 12,
    borderRadius: 12,
    fontWeight: "bold",
  },

  secondaryBtn: {
    flex: 1,
    background: "#1f2937",
    color: "white",
    padding: 12,
    borderRadius: 12,
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
  },

  emptyBox: {
    marginTop: 15,
    padding: 20,
    borderRadius: 12,
    border: "1px dashed #333",
    textAlign: "center",
    opacity: 0.6,
  },
};