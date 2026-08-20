// ============================================================
// CONFIG
// ============================================================
// This is the Supabase "publishable" public key (formerly "anon" key).
// It is safe to ship in client-side code as long as Row Level Security
// (RLS) policies are enabled on the `facts` table (select/insert/update rules).
// Do not add the `secret` key here — that one must stay secret.
const SUPABASE_URL = "https://tdqsaynejdfjimekncmr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_t4s9Wic6P5UnEkjoxJd4AA_n5Ksh8lH";

const CATEGORIES = [
  { name: "technology", color: "#3b82f6" },
  { name: "science", color: "#16a34a" },
  { name: "finance", color: "#ef4444" },
  { name: "society", color: "#eab308" },
  { name: "entertainment", color: "#db2777" },
  { name: "health", color: "#14b8a6" },
  { name: "history", color: "#f97316" },
  { name: "news", color: "#8b5cf6" },
];

// ============================================================
// STATE
// ============================================================
let facts = [];
let currentCategory = "all";

// ============================================================
// DOM
// ============================================================
const btnOpen = document.querySelector(".btn-open");
const form = document.querySelector(".fact-form");
const factsList = document.querySelector(".facts-list");
const factsCount = document.querySelector(".facts-count");
const categoriesList = document.querySelector(".categories-list");
const messageEl = document.querySelector(".message");

const inputText = document.querySelector(".input-text");
const inputSource = document.querySelector(".input-source");
const inputCategory = document.querySelector(".input-category");
const charCount = document.querySelector(".char-count");
const btnSubmit = document.querySelector(".btn-submit");

// ============================================================
// INIT
// ============================================================
init();

function init() {
  renderCategoryOptions();
  renderCategorySidebar();
  loadFacts();

  btnOpen.addEventListener("click", toggleForm);
  form.addEventListener("submit", handleSubmit);
  inputText.addEventListener("input", updateCharCount);
  factsList.addEventListener("click", handleListClick);
  categoriesList.addEventListener("click", handleCategoryClick);
}

// ============================================================
// FETCHING
// ============================================================
async function loadFacts() {
  showMessage("Loading facts…");

  try {
    const url = new URL(`${SUPABASE_URL}/rest/v1/facts`);
    url.searchParams.set("select", "*");
    url.searchParams.set("order", "id.desc");
    if (currentCategory !== "all") {
      url.searchParams.set("category", `eq.${currentCategory}`);
    }

    const res = await fetch(url, { headers: supabaseHeaders() });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);

    facts = await res.json();
    renderFacts();
  } catch (err) {
    showMessage(
      "Couldn't load facts right now. Check your connection and try again.",
    );
    console.error(err);
  }
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra,
  };
}

// ============================================================
// RENDERING
// ============================================================
function renderCategoryOptions() {
  const options = CATEGORIES.map(
    (cat) => `<option value="${cat.name}">${capitalize(cat.name)}</option>`,
  ).join("");
  inputCategory.insertAdjacentHTML("beforeend", options);
}

function renderCategorySidebar() {
  const items = CATEGORIES.map(
    (cat) => `
    <li class="category">
      <button
        class="btn btn-category"
        data-category="${cat.name}"
        style="background-color: ${cat.color}"
      >
        ${capitalize(cat.name)}
      </button>
    </li>`,
  ).join("");
  categoriesList.insertAdjacentHTML("beforeend", items);
}

function renderFacts() {
  if (!facts.length) {
    factsList.innerHTML = "";
    factsCount.textContent = "";
    showMessage("No facts here yet. Be the first to share one!");
    return;
  }

  hideMessage();

  const html = facts
    .map((fact) => {
      const catColor =
        CATEGORIES.find((c) => c.name === fact.category)?.color ?? "#78716c";

      return `
      <li class="fact" data-fact-id="${fact.id}">
        <p>
          ${escapeHTML(fact.text)}
          <a class="source" href="${fact.source}" target="_blank" rel="noopener">(Source)</a>
        </p>
        <span class="tag" style="background-color: ${catColor}">${fact.category}</span>
        <div class="vote-buttons">
          <button data-vote="votesInteresting">👍 <strong>${fact.votesInteresting ?? 0}</strong></button>
          <button data-vote="votesMindblowing">🤯 <strong>${fact.votesMindblowing ?? 0}</strong></button>
          <button data-vote="votesFalse">⛔️ <strong>${fact.votesFalse ?? 0}</strong></button>
        </div>
      </li>`;
    })
    .join("");

  factsList.innerHTML = html;
  factsCount.textContent = `${facts.length} fact${facts.length === 1 ? "" : "s"}`;
}

function showMessage(text) {
  messageEl.textContent = text;
  messageEl.classList.remove("hidden");
  factsList.innerHTML = "";
  factsCount.textContent = "";
}

function hideMessage() {
  messageEl.classList.add("hidden");
}

// ============================================================
// FORM: SHARE A FACT
// ============================================================
function toggleForm() {
  form.classList.toggle("hidden");
  btnOpen.textContent = form.classList.contains("hidden")
    ? "Share a fact"
    : "Close";
  if (!form.classList.contains("hidden")) inputText.focus();
}

function updateCharCount() {
  charCount.textContent = 200 - inputText.value.length;
}

async function handleSubmit(e) {
  e.preventDefault();

  const text = inputText.value.trim();
  const source = inputSource.value.trim();
  const category = inputCategory.value;

  if (!isValidFact(text, source, category)) return;

  btnSubmit.disabled = true;
  btnSubmit.textContent = "Posting…";

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/facts`, {
      method: "POST",
      headers: supabaseHeaders({
        "Content-Type": "application/json",
        Prefer: "return=representation",
      }),
      body: JSON.stringify({
        text,
        source,
        category,
        votesInteresting: 0,
        votesMindblowing: 0,
        votesFalse: 0,
      }),
    });

    if (!res.ok) throw new Error(`Insert failed (${res.status})`);

    const [newFact] = await res.json();
    if (currentCategory === "all" || currentCategory === category) {
      facts.unshift(newFact);
      renderFacts();
    }

    form.reset();
    charCount.textContent = "200";
    toggleForm();
  } catch (err) {
    alert("Couldn't post your fact — please try again in a moment.");
    console.error(err);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = "Post";
  }
}

function isValidFact(text, source, category) {
  if (!text) {
    alert("Please share a fact before posting.");
    return false;
  }
  if (text.length > 200) {
    alert("Facts can be at most 200 characters.");
    return false;
  }
  if (!isValidUrl(source)) {
    alert("Please provide a valid source URL (e.g. https://example.com).");
    return false;
  }
  if (!category) {
    alert("Please choose a category.");
    return false;
  }
  return true;
}

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// CATEGORY FILTERING
// ============================================================
function handleCategoryClick(e) {
  const btn = e.target.closest("button");
  if (!btn) return;

  const category = btn.dataset.category ?? "all";
  currentCategory = category;

  categoriesList
    .querySelectorAll("button")
    .forEach((b) => b.classList.remove("btn-active"));
  btn.classList.add("btn-active");

  loadFacts();
}

// ============================================================
// VOTING
// ============================================================
async function handleListClick(e) {
  const btn = e.target.closest("button[data-vote]");
  if (!btn) return;

  const li = btn.closest(".fact");
  const factId = Number(li.dataset.factId);
  const fact = facts.find((f) => f.id === factId);
  if (!fact) return;

  const field = btn.dataset.vote;
  const previousValue = fact[field] ?? 0;
  const newValue = previousValue + 1;

  // Optimistic UI update
  fact[field] = newValue;
  btn.querySelector("strong").textContent = newValue;
  btn.disabled = true;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/facts?id=eq.${factId}`, {
      method: "PATCH",
      headers: supabaseHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ [field]: newValue }),
    });
    if (!res.ok) throw new Error(`Vote failed (${res.status})`);
  } catch (err) {
    // Roll back on failure
    fact[field] = previousValue;
    btn.querySelector("strong").textContent = previousValue;
    console.error(err);
  } finally {
    btn.disabled = false;
  }
}

// ============================================================
// HELPERS
// ============================================================
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
