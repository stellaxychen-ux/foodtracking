/* P‑Care v2
 * - Chinese/English alias search
 * - Import/export food database (JSON)
 * - Analysis modal with macro chart
 *
 * Notes for Stella:
 * 1) Put this folder on GitHub Pages and it will run as a static site.
 * 2) Extend the database by exporting, editing JSON, then importing.
 */

const STORAGE = {
  WEIGHT: "pcare_weight",
  CAL_PER_KG: "pcare_cal_per_kg",
  PROT_PER_KG: "pcare_prot_per_kg",
  MODE: "pcare_mode",
  FOOD_DB: "pcare_food_db_v2",
  DAY: "pcare_day_log_v2",
  DAY_DATE: "pcare_day_date_v2",
};

// ---------- Defaults (based on your uploaded docs) ----------
const DEFAULTS = {
  weight: 60,
  // 胰腺癌共识推荐：能量 25–30 kcal/(kg·d)，蛋白 1.2–2.0 g/(kg·d)
  calPerKg: 30,
  protPerKg: 1.5,
  mode: "postop",
};

// Food database schema:
// {
//   id: "rice_congee",
//   name: "小米粥 / 粥类",
//   emoji: "🥣",
//   status: "safe" | "caution" | "avoid",
//   cal: 120, prot: 4, carb: 22, fat: 2,    // per serving estimate
//   note: "温和易消化，少量多餐更合适。",
//   aliases: ["小米粥","粥","congee","millet porridge","xiaomi zhou"]
// }
const BUILTIN_FOOD_DB = [
  // --- "Safe" (gentle, high-protein lean) ---
  {
    id: "chicken_breast",
    name: "鸡胸肉（清蒸/水煮/烤）",
    emoji: "🍗",
    status: "safe",
    cal: 165, prot: 31, carb: 0, fat: 4,
    note: "优质瘦肉蛋白；避免油炸。",
    aliases: ["鸡胸肉","鸡肉","清蒸鸡","水煮鸡","烤鸡","chicken breast","chicken"]
  },
  {
    id: "white_fish",
    name: "白肉鱼（清蒸）",
    emoji: "🐟",
    status: "safe",
    cal: 120, prot: 24, carb: 0, fat: 2,
    note: "高蛋白低脂，术后/消化不良时更友好。",
    aliases: ["鱼","清蒸鱼","鳕鱼","鲈鱼","white fish","steamed fish"]
  },
  {
    id: "tofu_soft",
    name: "豆腐（嫩豆腐/豆花）",
    emoji: "🍲",
    status: "safe",
    cal: 90, prot: 9, carb: 3, fat: 5,
    note: "植物蛋白，口感软；避免麻辣重油。",
    aliases: ["豆腐","嫩豆腐","豆花","tofu","soft tofu"]
  },
  {
    id: "egg",
    name: "鸡蛋（水煮/蒸蛋）",
    emoji: "🥚",
    status: "safe",
    cal: 70, prot: 6, carb: 0.6, fat: 5,
    note: "蛋白质优；油多会更难消化。",
    aliases: ["鸡蛋","水煮蛋","蒸蛋","蛋羹","egg","boiled egg"]
  },
  {
    id: "congee",
    name: "粥类（小米粥/白粥）",
    emoji: "🥣",
    status: "safe",
    cal: 120, prot: 3, carb: 26, fat: 1,
    note: "温和易消化；可以加入鸡蛋/豆腐提升蛋白。",
    aliases: ["粥","白粥","小米粥","稀饭","congee","porridge","rice porridge","millet porridge"]
  },
  {
    id: "white_rice_toast",
    name: "白米饭/吐司（少量）",
    emoji: "🍚",
    status: "safe",
    cal: 130, prot: 3, carb: 28, fat: 0.5,
    note: "纤维较低，初期更易耐受。",
    aliases: ["白米饭","米饭","吐司","面包","white rice","toast","bread"]
  },
  {
    id: "banana_ripe",
    name: "香蕉（熟）",
    emoji: "🍌",
    status: "safe",
    cal: 105, prot: 1.3, carb: 27, fat: 0.4,
    note: "软水果；若腹胀明显可减量。",
    aliases: ["香蕉","熟香蕉","banana"]
  },

  // --- "Caution" (may cause gas, lactose, rough fiber, higher fat) ---
  {
    id: "yogurt_lowfat",
    name: "酸奶（低脂/无乳糖更佳）",
    emoji: "🥛",
    status: "caution",
    cal: 100, prot: 9, carb: 12, fat: 2,
    note: "若乳糖不耐/腹泻，优先无乳糖或暂停。",
    aliases: ["酸奶","低脂酸奶","无乳糖酸奶","yogurt","low fat yogurt","lactose free yogurt"]
  },
  {
    id: "nuts_whole",
    name: "坚果（整粒）",
    emoji: "🥜",
    status: "caution",
    cal: 170, prot: 6, carb: 6, fat: 14,
    note: "较难消化；更推荐少量坚果酱。",
    aliases: ["坚果","花生","核桃","杏仁","nuts","peanut","walnut","almond"]
  },
  {
    id: "broccoli_cabbage",
    name: "花椰菜/卷心菜（易产气）",
    emoji: "🥦",
    status: "caution",
    cal: 50, prot: 4, carb: 10, fat: 0.5,
    note: "术后/腹胀时可能不适；可少量、煮软再试。",
    aliases: ["花菜","花椰菜","西兰花","卷心菜","包菜","broccoli","cabbage","cauliflower"]
  },
  {
    id: "beans_legumes",
    name: "豆类/豆荚类（扁豆/豌豆等）",
    emoji: "🫘",
    status: "caution",
    cal: 150, prot: 9, carb: 27, fat: 1,
    note: "可能产气；少量、充分煮软更好。",
    aliases: ["豆类","扁豆","豌豆","黄豆","beans","lentils","peas","legumes"]
  },

  // --- "Avoid" (high-fat, spicy, carbonated, raw veg) ---
  {
    id: "fried_food",
    name: "油炸/高脂（炸鸡/薯条/肥肉）",
    emoji: "🍟",
    status: "avoid",
    cal: 320, prot: 10, carb: 30, fat: 18,
    note: "高脂难消化，容易腹泻/胀气。",
    aliases: ["油炸","炸鸡","薯条","炸鱼薯条","肥肉","fried","fries","fried chicken"]
  },
  {
    id: "carbonated",
    name: "碳酸饮料（汽水/气泡水）",
    emoji: "🥤",
    status: "avoid",
    cal: 140, prot: 0, carb: 35, fat: 0,
    note: "容易胀气、早饱；术后尤其不友好。",
    aliases: ["碳酸","汽水","气泡水","碳酸饮料","soda","carbonated","sparkling water"]
  },
  {
    id: "raw_salad",
    name: "生冷沙拉/生蔬菜",
    emoji: "🥗",
    status: "avoid",
    cal: 40, prot: 2, carb: 8, fat: 0.3,
    note: "纤维粗、可能刺激；改成煮软的熟蔬菜更好。",
    aliases: ["生菜","沙拉","生蔬菜","raw salad","salad","raw vegetables"]
  },
  {
    id: "spicy_greasy",
    name: "辛辣/麻辣重油（辣豆腐/鸡翅等）",
    emoji: "🌶️",
    status: "avoid",
    cal: 280, prot: 12, carb: 10, fat: 20,
    note: "油+辣会加重胃肠负担。",
    aliases: ["辛辣","麻辣","辣","辣豆腐","鸡翅","spicy","hot wings"]
  },
  {
    id: "sugary_dessert",
    name: "高糖甜点（蛋糕/奶茶）",
    emoji: "🍰",
    status: "avoid",
    cal: 260, prot: 4, carb: 40, fat: 10,
    note: "血糖波动风险；若有糖代谢问题需更谨慎。",
    aliases: ["甜点","蛋糕","奶茶","dessert","cake","milk tea","boba"]
  },
];

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function loadFoodDB() {
  const raw = localStorage.getItem(STORAGE.FOOD_DB);
  if (!raw) return structuredClone(BUILTIN_FOOD_DB);
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {}
  return structuredClone(BUILTIN_FOOD_DB);
}

function saveFoodDB(db) {
  localStorage.setItem(STORAGE.FOOD_DB, JSON.stringify(db));
}

function getDayLog() {
  const k = todayKey();
  const last = localStorage.getItem(STORAGE.DAY_DATE);
  if (last !== k) {
    // new day -> reset
    localStorage.setItem(STORAGE.DAY_DATE, k);
    localStorage.setItem(STORAGE.DAY, JSON.stringify([]));
  }
  const raw = localStorage.getItem(STORAGE.DAY);
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}

function setDayLog(log) {
  localStorage.setItem(STORAGE.DAY, JSON.stringify(log));
}

function normalize(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[·•・]/g,"");
}

function pct(n, d) {
  if (!d) return 0;
  return Math.round(Math.min((n/d)*100, 999));
}

// ---------- App State ----------
let state = {
  weight: DEFAULTS.weight,
  calPerKg: DEFAULTS.calPerKg,
  protPerKg: DEFAULTS.protPerKg,
  mode: DEFAULTS.mode,
  filter: "all",
  db: [],
  log: [],
  chart: null,
};

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);

const els = {
  targetWeightDisplay: $("targetWeightDisplay"),
  calCurrent: $("calCurrent"),
  calTarget: $("calTarget"),
  calBar: $("calBar"),
  calPct: $("calPct"),
  protCurrent: $("protCurrent"),
  protTarget: $("protTarget"),
  protBar: $("protBar"),
  protPct: $("protPct"),
  foodSearch: $("foodSearch"),
  foodList: $("foodList"),
  notFound: $("notFound"),
  dietModeBadge: $("dietModeBadge"),

  // Settings
  settingsModal: $("settingsModal"),
  btnSettings: $("btnSettings"),
  weightInput: $("weightInput"),
  dietMode: $("dietMode"),
  calPerKg: $("calPerKg"),
  protPerKg: $("protPerKg"),
  saveSettings: $("saveSettings"),

  // Analysis
  analysisModal: $("analysisModal"),
  btnAnalysis: $("btnAnalysis"),
  aCalPct: $("aCalPct"),
  aProtPct: $("aProtPct"),
  aCalBar: $("aCalBar"),
  aProtBar: $("aProtBar"),
  aCalNow: $("aCalNow"),
  aProtNow: $("aProtNow"),
  macroChart: $("macroChart"),
  carbNow: $("carbNow"),
  protNow: $("protNow"),
  fatNow: $("fatNow"),
  logList: $("logList"),
  exportDay: $("exportDay"),

  // Actions
  btnAddCustom: $("btnAddCustom"),
  btnImport: $("btnImport"),
  importFile: $("importFile"),
  btnResetDay: $("btnResetDay"),
};

// ---------- Targets / modes ----------
function applyModeDefaults(mode) {
  // Keep it simple: change suggestion badge + optionally tweak defaults a bit.
  // You can refine later if you want multiple clinical profiles.
  if (mode === "postop") {
    els.dietModeBadge.className = "tag tag-safe";
    els.dietModeBadge.textContent = "默认：术后/消化友好";
  } else if (mode === "chemo") {
    els.dietModeBadge.className = "tag tag-caution";
    els.dietModeBadge.textContent = "放化疗中：更重视蛋白";
  } else {
    els.dietModeBadge.className = "tag tag-safe";
    els.dietModeBadge.textContent = "一般随访：均衡模式";
  }
}

function getTargets() {
  const calTarget = Math.round(state.weight * state.calPerKg);
  const protTarget = Math.round(state.weight * state.protPerKg);
  return { calTarget, protTarget };
}

function getTotalsFromLog(log) {
  return log.reduce((acc, x) => {
    acc.cal += Number(x.cal || 0);
    acc.prot += Number(x.prot || 0);
    acc.carb += Number(x.carb || 0);
    acc.fat += Number(x.fat || 0);
    return acc;
  }, { cal: 0, prot: 0, carb: 0, fat: 0 });
}

// ---------- Rendering ----------
function statusBadge(status) {
  if (status === "safe") return { cls: "tag tag-safe", text: "✅ 适合" };
  if (status === "caution") return { cls: "tag tag-caution", text: "⚠️ 谨慎" };
  return { cls: "tag tag-avoid", text: "⛔ 避免" };
}

function foodCard(item) {
  const b = statusBadge(item.status);
  const cls =
    item.status === "safe" ? "food-safe" :
    item.status === "caution" ? "food-caution" : "food-avoid";

  const canAdd = item.status !== "avoid";
  const btn = canAdd
    ? `<button data-add="${item.id}" class="px-3 py-2 rounded-xl bg-white border border-slate-200 font-semibold hover:bg-slate-50 shadow-sm">
         + 记录
       </button>`
    : `<div class="text-xs font-extrabold text-red-600">避免</div>`;

  return `
    <div class="card ${cls} shadow-soft p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <div class="text-xl">${item.emoji || "🍽️"}</div>
            <div class="font-extrabold text-slate-900">${escapeHtml(item.name)}</div>
            <span class="${b.cls}">${b.text}</span>
          </div>
          <div class="text-sm text-slate-600 mt-2">${escapeHtml(item.note || "")}</div>
          <div class="text-xs text-slate-500 mt-2 flex flex-wrap gap-3">
            <span>🔥 ${fmt(item.cal)} kcal</span>
            <span>🥩 ${fmt(item.prot)} g</span>
            <span>🍚 ${fmt(item.carb)} g</span>
            <span>🥑 ${fmt(item.fat)} g</span>
          </div>
        </div>
        <div class="shrink-0">${btn}</div>
      </div>
    </div>
  `;
}

function renderFoods() {
  const q = normalize(els.foodSearch.value);
  const filter = state.filter;

  const list = state.db.filter((x) => {
    if (filter !== "all" && x.status !== filter) return false;
    if (!q) return true;
    const nameHit = normalize(x.name).includes(q);
    const aliasHit = (x.aliases || []).some(a => normalize(a).includes(q) || q.includes(normalize(a)));
    return nameHit || aliasHit;
  });

  els.foodList.innerHTML = "";
  els.notFound.classList.toggle("hidden", list.length > 0 || !q);

  list.forEach(item => {
    els.foodList.insertAdjacentHTML("beforeend", foodCard(item));
  });

  // bind add buttons
  document.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-add");
      const item = state.db.find(x => x.id === id);
      if (item) addFood(item);
    });
  });
}

function updateDashboard() {
  const { calTarget, protTarget } = getTargets();
  const totals = getTotalsFromLog(state.log);

  els.targetWeightDisplay.textContent = state.weight;

  els.calTarget.textContent = calTarget;
  els.calCurrent.textContent = Math.round(totals.cal);
  const calP = pct(totals.cal, calTarget);
  els.calBar.style.width = Math.min(calP, 100) + "%";
  els.calPct.textContent = calP + "%";

  els.protTarget.textContent = protTarget;
  els.protCurrent.textContent = Math.round(totals.prot);
  const protP = pct(totals.prot, protTarget);
  els.protBar.style.width = Math.min(protP, 100) + "%";
  els.protPct.textContent = protP + "%";
}

function renderAnalysis() {
  const { calTarget, protTarget } = getTargets();
  const totals = getTotalsFromLog(state.log);

  const calP = pct(totals.cal, calTarget);
  const protP = pct(totals.prot, protTarget);

  els.aCalPct.textContent = calP;
  els.aProtPct.textContent = protP;
  els.aCalBar.style.width = Math.min(calP, 100) + "%";
  els.aProtBar.style.width = Math.min(protP, 100) + "%";

  els.aCalNow.textContent = Math.round(totals.cal);
  els.aProtNow.textContent = Math.round(totals.prot);

  els.carbNow.textContent = `${Math.round(totals.carb)} g`;
  els.protNow.textContent = `${Math.round(totals.prot)} g`;
  els.fatNow.textContent = `${Math.round(totals.fat)} g`;

  // log list
  els.logList.innerHTML = "";
  if (!state.log.length) {
    els.logList.innerHTML = `<div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 text-sm">今天还没有记录～ 去主页点“+ 记录”吧 😊</div>`;
  } else {
    state.log.slice().reverse().forEach((x, idxFromEnd) => {
      const when = new Date(x.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      els.logList.insertAdjacentHTML("beforeend", `
        <div class="p-3 rounded-2xl bg-white border border-slate-100 flex items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="font-bold truncate">${escapeHtml(x.emoji || "🍽️")} ${escapeHtml(x.name || "")} <span class="text-xs text-slate-400 ml-2">${when}</span></div>
            <div class="text-xs text-slate-500 mt-1">🔥 ${fmt(x.cal)} kcal · 🥩 ${fmt(x.prot)} g · 🍚 ${fmt(x.carb)} g · 🥑 ${fmt(x.fat)} g</div>
          </div>
          <button data-del="${state.log.length - 1 - idxFromEnd}" class="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 font-semibold">删除</button>
        </div>
      `);
    });
    document.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-del"));
        if (Number.isFinite(idx)) {
          state.log.splice(idx, 1);
          setDayLog(state.log);
          updateDashboard();
          renderAnalysis();
        }
      });
    });
  }

  // Macro chart (grams -> kcal: carb 4, prot 4, fat 9)
  const carbKcal = totals.carb * 4;
  const protKcal = totals.prot * 4;
  const fatKcal = totals.fat * 9;
  const sum = Math.max(carbKcal + protKcal + fatKcal, 1);

  const data = [carbKcal, protKcal, fatKcal].map(x => Math.round((x / sum) * 100));
  // ensure sums to 100 (fix rounding drift)
  const drift = 100 - (data[0] + data[1] + data[2]);
  data[0] += drift;

  if (state.chart) state.chart.destroy();
  state.chart = new Chart(els.macroChart, {
    type: "doughnut",
    data: {
      labels: ["碳水", "蛋白", "脂肪"],
      datasets: [{ data }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw}%` }
        }
      },
      cutout: "62%"
    }
  });
}

// ---------- Actions ----------
function addFood(item) {
  const entry = {
    ts: Date.now(),
    id: item.id,
    name: item.name,
    emoji: item.emoji || "🍽️",
    cal: Number(item.cal || 0),
    prot: Number(item.prot || 0),
    carb: Number(item.carb || 0),
    fat: Number(item.fat || 0),
  };
  state.log.push(entry);
  setDayLog(state.log);
  updateDashboard();
}

function addCustomFood() {
  const name = prompt("输入食物名称（支持中文）", "蒸南瓜");
  if (!name) return;

  const cal = Number(prompt("热量 kcal（可留空=0）", "80") || 0);
  const prot = Number(prompt("蛋白质 g（可留空=0）", "2") || 0);
  const carb = Number(prompt("碳水 g（可留空=0）", "18") || 0);
  const fat = Number(prompt("脂肪 g（可留空=0）", "0.5") || 0);

  const entry = {
    ts: Date.now(),
    id: "custom",
    name,
    emoji: "🧡",
    cal, prot, carb, fat,
  };
  state.log.push(entry);
  setDayLog(state.log);
  updateDashboard();
}

function resetDay() {
  if (!confirm("确认清空今天的所有记录吗？")) return;
  state.log = [];
  setDayLog(state.log);
  updateDashboard();
}

function exportToday() {
  const payload = {
    date: todayKey(),
    weight: state.weight,
    targets: getTargets(),
    entries: state.log,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `pcare_day_${todayKey()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importDB() {
  els.importFile.value = "";
  els.importFile.click();
}

function onImportFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || ""));
      if (!Array.isArray(parsed)) throw new Error("JSON should be an array.");
      // Basic validation & merge by id
      const byId = new Map(state.db.map(x => [x.id, x]));
      for (const x of parsed) {
        if (!x || typeof x !== "object") continue;
        if (!x.id || !x.name || !x.status) continue;
        byId.set(String(x.id), {
          ...byId.get(String(x.id)),
          ...x,
          // normalize fields
          cal: Number(x.cal || 0),
          prot: Number(x.prot || 0),
          carb: Number(x.carb || 0),
          fat: Number(x.fat || 0),
          aliases: Array.isArray(x.aliases) ? x.aliases : [],
        });
      }
      state.db = Array.from(byId.values());
      saveFoodDB(state.db);
      renderFoods();
      alert(`✅ 导入完成：当前数据库共 ${state.db.length} 条食物。`);
    } catch (e) {
      alert("导入失败：请确认 JSON 格式正确（数组，每项包含 id/name/status）。\n" + e.message);
    }
  };
  reader.readAsText(file);
}

// ---------- Modals ----------
function openSettings() {
  els.settingsModal.classList.remove("hidden");
  els.settingsModal.classList.add("flex");
}
function closeSettings() {
  els.settingsModal.classList.add("hidden");
  els.settingsModal.classList.remove("flex");
}
function openAnalysis() {
  renderAnalysis();
  els.analysisModal.classList.remove("hidden");
  els.analysisModal.classList.add("flex");
}
function closeAnalysis() {
  els.analysisModal.classList.add("hidden");
  els.analysisModal.classList.remove("flex");
}

// ---------- Utils ----------
function fmt(x) {
  const n = Number(x || 0);
  if (!Number.isFinite(n)) return "0";
  return (Math.round(n * 10) / 10).toString();
}
function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------- Init ----------
function init() {
  // load settings
  const w = Number(localStorage.getItem(STORAGE.WEIGHT) || DEFAULTS.weight);
  const cpk = Number(localStorage.getItem(STORAGE.CAL_PER_KG) || DEFAULTS.calPerKg);
  const ppk = Number(localStorage.getItem(STORAGE.PROT_PER_KG) || DEFAULTS.protPerKg);
  const mode = localStorage.getItem(STORAGE.MODE) || DEFAULTS.mode;

  state.weight = Number.isFinite(w) ? w : DEFAULTS.weight;
  state.calPerKg = Number.isFinite(cpk) ? cpk : DEFAULTS.calPerKg;
  state.protPerKg = Number.isFinite(ppk) ? ppk : DEFAULTS.protPerKg;
  state.mode = mode;

  state.db = loadFoodDB();
  state.log = getDayLog();

  // bind settings inputs
  els.weightInput.value = state.weight;
  els.calPerKg.value = state.calPerKg;
  els.protPerKg.value = state.protPerKg;
  els.dietMode.value = state.mode;
  applyModeDefaults(state.mode);

  // render
  updateDashboard();
  renderFoods();

  // search
  els.foodSearch.addEventListener("input", renderFoods);

  // filter buttons
  document.querySelectorAll(".filterBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filterBtn").forEach(b => b.className = "filterBtn px-3 py-2 rounded-xl bg-white border border-slate-100 font-semibold");
      btn.className = "filterBtn px-3 py-2 rounded-xl bg-brand-50 text-brand-700 border border-brand-100 font-semibold";
      state.filter = btn.getAttribute("data-filter") || "all";
      renderFoods();
    });
  });

  // actions
  els.btnAddCustom.addEventListener("click", addCustomFood);
  els.btnResetDay.addEventListener("click", resetDay);
  els.btnImport.addEventListener("click", importDB);
  els.importFile.addEventListener("change", () => {
    const f = els.importFile.files && els.importFile.files[0];
    if (f) onImportFile(f);
  });

  // modals
  els.btnSettings.addEventListener("click", openSettings);
  els.saveSettings.addEventListener("click", () => {
    const nw = Number(els.weightInput.value || state.weight);
    const ncpk = Number(els.calPerKg.value || state.calPerKg);
    const nppk = Number(els.protPerKg.value || state.protPerKg);
    const nmode = els.dietMode.value || state.mode;

    if (!Number.isFinite(nw) || nw <= 0) return alert("体重不合法");
    if (!Number.isFinite(ncpk) || ncpk <= 0) return alert("热量系数不合法");
    if (!Number.isFinite(nppk) || nppk <= 0) return alert("蛋白系数不合法");

    state.weight = nw;
    state.calPerKg = ncpk;
    state.protPerKg = nppk;
    state.mode = nmode;

    localStorage.setItem(STORAGE.WEIGHT, String(state.weight));
    localStorage.setItem(STORAGE.CAL_PER_KG, String(state.calPerKg));
    localStorage.setItem(STORAGE.PROT_PER_KG, String(state.protPerKg));
    localStorage.setItem(STORAGE.MODE, String(state.mode));

    applyModeDefaults(state.mode);
    updateDashboard();
    closeSettings();
  });

  document.querySelectorAll(".closeModal").forEach(x => x.addEventListener("click", closeSettings));
  els.settingsModal.addEventListener("click", (e) => {
    if (e.target === els.settingsModal) closeSettings();
  });

  els.btnAnalysis.addEventListener("click", openAnalysis);
  document.querySelectorAll(".closeAnalysis").forEach(x => x.addEventListener("click", closeAnalysis));
  els.analysisModal.addEventListener("click", (e) => {
    if (e.target === els.analysisModal) closeAnalysis();
  });

  els.exportDay.addEventListener("click", exportToday);
}

init();
