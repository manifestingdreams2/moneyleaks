// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES — shared registry for income, expenses, and receipts
// ─────────────────────────────────────────────────────────────────────────────

export const EXPENSE_CATEGORIES = [
  "Housing",
  "Insurance",
  "Telecom",
  "Food",
  "Transportation",
  "Gas",
  "Subscriptions",
  "Utilities",
  "Health",
  "Shopping",
  "Entertainment",
  "Personal",
  "Business",
  "Investing",
  "Debt",
  "Legal",
  "Miscellaneous",
];

export const INCOME_CATEGORIES = [
  "Employment",
  "Business",
  "Gig",
  "Investing",
  "Rental",
  "Refund",
  "Other",
];

export const CATEGORY_COLORS = {
  // expense
  Housing: "#60a5fa",
  Insurance: "#a78bfa",
  Telecom: "#f87171",
  Food: "#fbbf24",
  Transportation: "#34d399",
  Gas: "#34d399",
  Subscriptions: "#fb923c",
  Utilities: "#a78bfa",
  Health: "#4ade80",
  Shopping: "#f472b6",
  Entertainment: "#38bdf8",
  Personal: "#94a3b8",
  Business: "#38bdf8",
  Investing: "#facc15",
  Debt: "#f87171",
  Legal: "#e879f9",
  Miscellaneous: "#94a3b8",
  // income
  Employment: "#00e5a0",
  Gig: "#f472b6",
  Rental: "#60a5fa",
  Refund: "#4ade80",
  Other: "#94a3b8",
};

export const CATEGORY_ICONS = {
  Housing: "🏠",
  Insurance: "🛡️",
  Telecom: "📱",
  Food: "🍔",
  Transportation: "🚗",
  Gas: "⛽",
  Subscriptions: "🔁",
  Utilities: "💡",
  Health: "🏥",
  Shopping: "🛍️",
  Entertainment: "🎮",
  Personal: "✂️",
  Business: "💼",
  Investing: "📈",
  Debt: "💳",
  Legal: "⚖️",
  Miscellaneous: "📦",
  Employment: "💼",
  Gig: "🚚",
  Rental: "🏘️",
  Refund: "↩️",
  Other: "🔹",
};

// ─────────────────────────────────────────────────────────────────────────────
// MERCHANT-KEYWORD RULES for auto-categorization
// Order matters — first match wins. Keep keywords lowercase.
// ─────────────────────────────────────────────────────────────────────────────
export const MERCHANT_RULES = [
  // Gas stations / fuel
  { category: "Gas", keywords: ["chevron", "shell", "arco", "valero", "76 ", "exxon", "mobil", "bp ", "costco gas", "texaco", "phillips 66", "circle k", "fuel", "gas station"] },

  // Transportation (rideshare, transit, parking)
  { category: "Transportation", keywords: ["uber", "lyft", "bart", "amtrak", "caltrain", "parking", "metro", "taxi", "flixbus", "greyhound", "toll"] },

  // Telecom
  { category: "Telecom", keywords: ["t-mobile", "tmobile", "verizon", "at&t", "att ", "mint mobile", "xfinity mobile", "cricket", "boost", "spectrum mobile", "google fi"] },

  // Subscriptions / digital
  { category: "Subscriptions", keywords: ["netflix", "hulu", "spotify", "apple.com", "apple services", "itunes", "disney+", "disney plus", "hbo", "max.com", "youtube premium", "paramount", "peacock", "patreon", "onlyfans", "github", "openai", "chatgpt", "anthropic", "claude", "notion", "figma", "adobe", "dropbox", "icloud", "microsoft 365", "office 365", "prime video", "audible"] },

  // Utilities
  { category: "Utilities", keywords: ["pg&e", "pge ", "smud", "sdge", "socalgas", "edison", "water dept", "waste management", "recology", "xfinity internet", "comcast", "spectrum", "at&t internet", "utility"] },

  // Food (groceries + restaurants + delivery)
  { category: "Food", keywords: ["safeway", "raley", "costco", "whole foods", "trader joe", "walmart grocery", "kroger", "albertsons", "grocery", "doordash", "grubhub", "ubereats", "uber eats", "postmates", "chipotle", "mcdonald", "burger king", "chick-fil-a", "starbucks", "dunkin", "taco bell", "wendy", "subway", "panera", "popeyes", "kfc", "in-n-out", "in n out", "pizza", "restaurant", "cafe", "deli", "bakery", "oxtail"] },

  // Health
  { category: "Health", keywords: ["cvs", "walgreens", "rite aid", "pharmacy", "kaiser", "blue shield", "sutter", "quest diagnostic", "dental", "clinic", "hospital", "gym", "planet fitness", "24 hour fitness", "ymca", "gnc", "vitamin"] },

  // Insurance
  { category: "Insurance", keywords: ["geico", "progressive", "state farm", "allstate", "farmers", "usaa", "mercury insurance", "liberty mutual", "health insurance", "auto insurance"] },

  // Housing
  { category: "Housing", keywords: ["rent", "mortgage", "hoa", "property mgmt", "airbnb long"] },

  // Shopping
  { category: "Shopping", keywords: ["amazon", "amzn", "target", "walmart", "best buy", "home depot", "lowe", "ikea", "ebay", "etsy", "nike", "adidas", "nordstrom", "macy", "tj maxx", "marshalls", "ross stores"] },

  // Entertainment
  { category: "Entertainment", keywords: ["amc theat", "regal", "cinemark", "ticketmaster", "stubhub", "steam", "playstation", "xbox", "nintendo", "concert", "movie"] },

  // Personal
  { category: "Personal", keywords: ["haircut", "barber", "salon", "sephora", "ulta", "sally beauty", "car wash"] },

  // Debt / finance
  { category: "Debt", keywords: ["credit card payment", "loan payment", "auto loan", "student loan"] },

  // Legal
  { category: "Legal", keywords: ["lawyer", "attorney", "law firm", "legal fees", "court"] },
];

/**
 * Categorize a merchant / description string using keyword rules.
 * Returns null if no confident match.
 */
export function categorizeText(text) {
  if (!text || typeof text !== "string") return null;
  const t = text.toLowerCase();
  for (const rule of MERCHANT_RULES) {
    for (const kw of rule.keywords) {
      if (t.includes(kw)) return rule.category;
    }
  }
  return null;
}

/**
 * Save a user-confirmed merchant->category mapping so future matches are sticky.
 * Uses localStorage under "ml_category_overrides".
 */
const OVERRIDE_KEY = "ml_category_overrides";

export function getCategoryOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCategoryOverride(merchant, category) {
  if (!merchant || !category) return;
  const key = merchant.toLowerCase().trim();
  if (!key) return;
  const map = getCategoryOverrides();
  map[key] = category;
  try {
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn("failed to persist category override", e);
  }
}

/**
 * Best-guess category: first consult user overrides, then keyword rules.
 */
export function suggestCategory(merchant) {
  if (!merchant) return "Miscellaneous";
  const overrides = getCategoryOverrides();
  const key = merchant.toLowerCase().trim();
  if (overrides[key]) return overrides[key];
  // Check if any override key is contained in merchant name
  for (const ovKey of Object.keys(overrides)) {
    if (key.includes(ovKey)) return overrides[ovKey];
  }
  return categorizeText(merchant) || "Miscellaneous";
}
