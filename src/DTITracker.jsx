import { useState, useMemo, useCallback } from "react";

// ─────────────────────────────────────────────────────────
// LOCAL STORAGE HOOK (PERSISTENCE)
// ─────────────────────────────────────────────────────────
function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (newValue) => {
      setValue((prev) => {
        const valueToStore =
          typeof newValue === "function" ? newValue(prev) : newValue;

        try {
          localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch {}

        return valueToStore;
      });
    },
    [key]
  );

  return [value, set];
}

// ─────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────
export default function DTITracker() {
  const [assets, setAssets] = useLocalStorage("assets", []);
  const [liabilities, setLiabilities] = useLocalStorage("liabilities", []);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const totalAssets = useMemo(
    () => assets.reduce((sum, a) => sum + a.amount, 0),
    [assets]
  );

  const totalLiabilities = useMemo(
    () => liabilities.reduce((sum, l) => sum + l.amount, 0),
    [liabilities]
  );

  const netWorth = totalAssets - totalLiabilities;

  const addAsset = () => {
    if (!name || !amount) return;

    const newItem = {
      id: Date.now(),
      name,
      amount: Number(amount),
    };

    setAssets((prev) => [...prev, newItem]);
    setName("");
    setAmount("");
  };

  const addLiability = () => {
    if (!name || !amount) return;

    const newItem = {
      id: Date.now(),
      name,
      amount: Number(amount),
    };

    setLiabilities((prev) => [...prev, newItem]);
    setName("");
    setAmount("");
  };

  const deleteAsset = (id) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const deleteLiability = (id) => {
    setLiabilities((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>MoneyLeaks</h1>

      {/* NET WORTH */}
      <div style={styles.card}>
        <p>Net Worth</p>
        <h2>${netWorth}</h2>
        <p style={{ color: "green" }}>Assets: ${totalAssets}</p>
        <p style={{ color: "red" }}>Liabilities: ${totalLiabilities}</p>
      </div>

      {/* INPUT */}
      <div style={styles.card}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={styles.input}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={addAsset} style={styles.btnGreen}>
            Add Asset
          </button>
          <button onClick={addLiability} style={styles.btnRed}>
            Add Liability
          </button>
        </div>
      </div>

      {/* ASSETS */}
      <div style={styles.card}>
        <h3>Assets</h3>
        {assets.map((a) => (
          <div key={a.id} style={styles.row}>
            <span>{a.name}</span>
            <span>${a.amount}</span>
            <button onClick={() => deleteAsset(a.id)}>❌</button>
          </div>
        ))}
      </div>

      {/* LIABILITIES */}
      <div style={styles.card}>
        <h3>Liabilities</h3>
        {liabilities.map((l) => (
          <div key={l.id} style={styles.row}>
            <span>{l.name}</span>
            <span>${l.amount}</span>
            <button onClick={() => deleteLiability(l.id)}>❌</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────
const styles = {
  page: {
    background: "#0a0b12",
    minHeight: "100vh",
    color: "white",
    padding: 20,
    fontFamily: "sans-serif",
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
  },
  card: {
    background: "#12131a",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
    border: "1px solid #333",
    background: "#1e1f2e",
    color: "white",
  },
  btnGreen: {
    flex: 1,
    background: "green",
    color: "white",
    padding: 10,
    border: "none",
    borderRadius: 6,
  },
  btnRed: {
    flex: 1,
    background: "red",
    color: "white",
    padding: 10,
    border: "none",
    borderRadius: 6,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 10,
  },
};