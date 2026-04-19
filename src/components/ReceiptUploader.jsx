import { useState, useRef } from "react";
import {
  ACCEPTED_TYPES,
  fileToDataURL,
  parseReceiptText,
  validateFile,
} from "../lib/receipts";
import {
  EXPENSE_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  suggestCategory,
} from "../lib/categories";
import { todayISO } from "../lib/budgetMath";
import {
  Card,
  SectionLabel,
  Pill,
  PrimaryButton,
  GhostButton,
  ConfirmButton,
  Toast,
  EmptyState,
  IconButton,
} from "./ui";
import { inputStyle, fmt, fmtDec } from "./ui-helpers";

/**
 * Props:
 * - receipts: array
 * - onAddReceipt: (draft) => { receipt, expense }
 * - onUpdateReceipt: (id, patch) => void
 * - onDeleteReceipt: (id) => void
 */
export function ReceiptUploader({
  receipts,
  onAddReceipt,
  onUpdateReceipt,
  onDeleteReceipt,
}) {
  const fileInput = useRef(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [zoomedId, setZoomedId] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const openPicker = () => fileInput.current && fileInput.current.click();

  const handleFile = async (file) => {
    setError("");
    const v = validateFile(file);
    if (!v.ok) {
      setError(v.error);
      return;
    }
    let dataURL = "";
    try {
      dataURL = await fileToDataURL(file);
    } catch {
      setError("Could not read that file");
      return;
    }
    const parsed = parseReceiptText("", file.name);
    setDraft({
      dataURL,
      fileName: file.name,
      fileType: file.type,
      merchant: parsed.merchant || "",
      total: parsed.total != null ? String(parsed.total) : "",
      category: parsed.category || "Miscellaneous",
      notes: "",
      date: todayISO(),
      pastedText: "",
    });
  };

  const onFilePicked = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleFile(file);
    // reset input so same file can be picked again later
    e.target.value = "";
  };

  const handlePasteParse = () => {
    if (!draft || !draft.pastedText.trim()) return;
    const parsed = parseReceiptText(draft.pastedText, draft.fileName);
    setDraft((d) => ({
      ...d,
      merchant: parsed.merchant || d.merchant,
      total: parsed.total != null ? String(parsed.total) : d.total,
      category: parsed.category || d.category,
    }));
    showToast("Parsed receipt text");
  };

  const handleMerchantBlur = () => {
    if (!draft || !draft.merchant) return;
    const guess = suggestCategory(draft.merchant);
    setDraft((d) => ({ ...d, category: guess || d.category }));
  };

  const handleSave = () => {
    if (!draft) return;
    const total = parseFloat(draft.total);
    if (!draft.merchant.trim()) {
      setError("Add a merchant name");
      return;
    }
    if (isNaN(total) || total <= 0) {
      setError("Enter the receipt total");
      return;
    }
    setError("");
    const { expense } = onAddReceipt({
      dataURL: draft.dataURL,
      fileName: draft.fileName,
      fileType: draft.fileType,
      merchant: draft.merchant.trim(),
      total,
      category: draft.category,
      notes: draft.notes.trim(),
      date: draft.date,
    });
    setDraft(null);
    showToast(
      expense
        ? `Logged ${fmtDec(total)} to ${draft.category}`
        : `Saved receipt`
    );
  };

  const changeReceiptCategory = (r, nextCat) => {
    onUpdateReceipt(r.id, { category: nextCat });
    showToast(`Moved to ${nextCat}`);
  };

  const totalReceipts = receipts.reduce((s, r) => s + (Number(r.total) || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Toast msg={toast} color="#60a5fa" />

      {/* Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        <div style={kpi("#60a5fa")}>
          <div style={kpiLabel}>Receipts Logged</div>
          <div style={kpiValue("#60a5fa")}>{receipts.length}</div>
        </div>
        <div style={kpi("#f87171")}>
          <div style={kpiLabel}>Receipt Total</div>
          <div style={kpiValue("#f87171")}>{fmt(totalReceipts)}</div>
        </div>
      </div>

      {/* Upload entrypoint */}
      {!draft && (
        <Card style={{ borderStyle: "dashed", border: "1px dashed #2a2b3d" }}>
          <SectionLabel color="#60a5fa">📸 Upload Receipt</SectionLabel>
          <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, marginBottom: 12 }}>
            Snap a photo or pick a file. We'll guess the category — you can tweak before saving.
          </p>
          <PrimaryButton color="#60a5fa" onClick={openPicker} style={{ color: "#0a0b12" }}>
            + Upload Receipt (JPG / PNG / WEBP / PDF)
          </PrimaryButton>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            capture="environment"
            onChange={onFilePicked}
            style={{ display: "none" }}
          />
          {error && (
            <p style={{ color: "#ff4d6d", fontSize: 11, marginTop: 8 }}>{error}</p>
          )}
        </Card>
      )}

      {/* Draft review */}
      {draft && (
        <Card style={{ border: "1px solid #60a5fa35" }}>
          <SectionLabel color="#60a5fa">Review Receipt</SectionLabel>

          <ReceiptPreview dataURL={draft.dataURL} fileType={draft.fileType} fileName={draft.fileName} />

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            <div>
              <label style={labelStyle}>Merchant *</label>
              <input
                type="text"
                value={draft.merchant}
                onChange={(e) => setDraft((d) => ({ ...d, merchant: e.target.value }))}
                onBlur={handleMerchantBlur}
                placeholder="e.g. Chevron #1234"
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Total *</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={draft.total}
                  onChange={(e) => setDraft((d) => ({ ...d, total: e.target.value }))}
                  placeholder="0.00"
                  style={{ ...inputStyle, fontFamily: "monospace", fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={labelStyle}>Date</label>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                  style={{ ...inputStyle, colorScheme: "dark" }}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                Category{" "}
                <span style={{ color: "#60a5fa", fontWeight: 600 }}>
                  (suggested: {draft.category})
                </span>
              </label>
              <select
                value={draft.category}
                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                Paste receipt text (optional — helps parsing)
              </label>
              <textarea
                value={draft.pastedText}
                onChange={(e) => setDraft((d) => ({ ...d, pastedText: e.target.value }))}
                placeholder={"Chevron\n1234 Main St\nUnleaded 12.5gal\nTotal $42.31"}
                rows={4}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
              />
              <button
                onClick={handlePasteParse}
                type="button"
                style={{
                  marginTop: 6,
                  background: "#60a5fa15",
                  border: "1px solid #60a5fa30",
                  borderRadius: 7,
                  padding: "6px 10px",
                  color: "#60a5fa",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Parse pasted text
              </button>
            </div>

            <div>
              <label style={labelStyle}>Notes</label>
              <input
                type="text"
                value={draft.notes}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                placeholder="optional"
                style={inputStyle}
              />
            </div>

            {error && (
              <p style={{ color: "#ff4d6d", fontSize: 11 }}>{error}</p>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <PrimaryButton color="#60a5fa" onClick={handleSave} style={{ color: "#0a0b12" }}>
                Save Receipt
              </PrimaryButton>
              <GhostButton
                onClick={() => {
                  setDraft(null);
                  setError("");
                }}
                style={{ flex: "0 0 auto", width: "auto", padding: "12px 16px" }}
              >
                Cancel
              </GhostButton>
            </div>
          </div>
        </Card>
      )}

      {/* Receipt list */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SectionLabel color="#60a5fa">Receipt History</SectionLabel>
          <span style={{ fontSize: 10, color: "#64748b" }}>
            Tap image to enlarge · Categories persist
          </span>
        </div>

        {receipts.length === 0 ? (
          <EmptyState
            icon="🧾"
            title="No receipts yet"
            body="Uploaded receipts get auto-categorized and added to your monthly totals."
          />
        ) : (
          receipts.map((r) => (
            <ReceiptRow
              key={r.id}
              receipt={r}
              isZoomed={zoomedId === r.id}
              onZoomToggle={() => setZoomedId((p) => (p === r.id ? null : r.id))}
              onChangeCategory={(c) => changeReceiptCategory(r, c)}
              onDelete={() => {
                onDeleteReceipt(r.id);
                showToast(`Removed receipt · totals updated`);
              }}
            />
          ))
        )}
      </Card>
    </div>
  );
}

function ReceiptPreview({ dataURL, fileType, fileName }) {
  if (!dataURL) return null;
  if (fileType === "application/pdf") {
    return (
      <div
        style={{
          background: "#1a1b26",
          border: "1px solid #2a2b3d",
          borderRadius: 10,
          padding: 14,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 32 }}>📄</div>
        <div style={{ fontSize: 12, color: "#e2e8f0", marginTop: 6, wordBreak: "break-all" }}>
          {fileName}
        </div>
        <a
          href={dataURL}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-block",
            marginTop: 8,
            color: "#60a5fa",
            fontSize: 11,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Open PDF →
        </a>
      </div>
    );
  }
  return (
    <div
      style={{
        background: "#0a0b12",
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid #2a2b3d",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <img
        src={dataURL}
        alt={fileName || "receipt"}
        style={{ maxWidth: "100%", maxHeight: 280, objectFit: "contain" }}
      />
    </div>
  );
}

function ReceiptRow({ receipt, isZoomed, onZoomToggle, onChangeCategory, onDelete }) {
  const color = CATEGORY_COLORS[receipt.category] || "#94a3b8";
  const icon = CATEGORY_ICONS[receipt.category] || "🧾";
  const isImage = receipt.fileType && receipt.fileType.startsWith("image/");

  return (
    <div
      style={{
        padding: "12px 0",
        borderBottom: "1px solid #1e1f2e",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={onZoomToggle}
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: `${color}18`,
            border: "none",
            padding: 0,
            overflow: "hidden",
            cursor: isImage ? "pointer" : "default",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          {isImage && receipt.dataURL ? (
            <img
              src={receipt.dataURL}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            icon
          )}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 13,
                color: "#e2e8f0",
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {receipt.merchant || receipt.fileName}
            </span>
            <Pill label={receipt.category} color={color} />
          </div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
            {receipt.date}
            {receipt.notes ? ` · ${receipt.notes}` : ""}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 800, color: "#f87171" }}>
            −{fmtDec(receipt.total)}
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 5, justifyContent: "flex-end" }}>
            <IconButton title="Change category" onClick={onZoomToggle}>
              ⚙
            </IconButton>
            <ConfirmButton onConfirm={onDelete} />
          </div>
        </div>
      </div>

      {isZoomed && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1e1f2e" }}>
          {receipt.dataURL && (
            <ReceiptPreview
              dataURL={receipt.dataURL}
              fileType={receipt.fileType}
              fileName={receipt.fileName}
            />
          )}
          <div style={{ marginTop: 10 }}>
            <label style={labelStyle}>Recategorize</label>
            <select
              value={receipt.category}
              onChange={(e) => onChangeCategory(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <p style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
              Choosing a new category teaches the app: future uploads from{" "}
              <b style={{ color: "#e2e8f0" }}>{receipt.merchant}</b> will land there automatically.
            </p>
          </div>
        </div>
      )}
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

const kpi = (color) => ({
  background: "#12131a",
  border: `1px solid ${color}25`,
  borderRadius: 10,
  padding: "10px 12px",
});
const kpiLabel = {
  fontSize: 9,
  color: "#64748b",
  fontWeight: 700,
  textTransform: "uppercase",
  marginBottom: 4,
  letterSpacing: 0.5,
};
const kpiValue = (color) => ({
  fontFamily: "monospace",
  fontSize: 16,
  fontWeight: 800,
  color,
});
