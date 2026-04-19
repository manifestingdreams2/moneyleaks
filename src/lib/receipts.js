// ─────────────────────────────────────────────────────────────────────────────
// RECEIPTS — file handling + text parsing + category suggestion
// ─────────────────────────────────────────────────────────────────────────────
import { suggestCategory } from "./categories";

export const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
export const MAX_FILE_BYTES = 3 * 1024 * 1024; // 3MB soft cap to keep localStorage happy

export function validateFile(file) {
  if (!file) return { ok: false, error: "No file selected" };
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { ok: false, error: "Use JPG, PNG, WEBP, or PDF" };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      error: `File is ${(file.size / 1024 / 1024).toFixed(1)}MB — keep it under 3MB`,
    };
  }
  return { ok: true };
}

export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Read failed"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT PARSING
// If the user pastes the receipt text (or a future OCR step fills it in),
// try to pull out merchant (first non-empty line) and total (last dollar amount).
// ─────────────────────────────────────────────────────────────────────────────

const TOTAL_KEYWORDS = ["grand total", "total amount", "amount due", "balance due", "total"];

export function extractMerchant(text) {
  if (!text || typeof text !== "string") return "";
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return "";
  // Heuristic: merchant is usually the first line of meaningful length
  for (const line of lines) {
    if (line.length >= 3 && !/^\d/.test(line)) return line;
  }
  return lines[0];
}

export function extractTotal(text) {
  if (!text || typeof text !== "string") return null;
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Prefer lines that contain a total-ish keyword
  const priceRegex = /\$?\s?(\d{1,5}(?:[,\d]{0,6})(?:\.\d{2}))/;
  let best = null;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (TOTAL_KEYWORDS.some((k) => lower.includes(k))) {
      const m = line.match(priceRegex);
      if (m) {
        const n = parseFloat(m[1].replace(/,/g, ""));
        if (!isNaN(n)) return n;
      }
    }
  }

  // Fallback: last dollar amount in the whole text
  const allMatches = [...text.matchAll(/\$?\s?(\d{1,5}(?:[,\d]{0,6})(?:\.\d{2}))/g)];
  if (allMatches.length) {
    const last = allMatches[allMatches.length - 1][1];
    const n = parseFloat(last.replace(/,/g, ""));
    if (!isNaN(n)) best = n;
  }
  return best;
}

/**
 * Produce a ReceiptDraft from a filename + optional text.
 * { merchant, total, category, notes }
 */
export function parseReceiptText(text, filename = "") {
  const merchant = extractMerchant(text) || stripExtension(filename);
  const total = extractTotal(text);
  const category = suggestCategory(merchant);
  return {
    merchant,
    total,
    category,
    notes: "",
  };
}

function stripExtension(name) {
  if (!name) return "";
  return name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}
