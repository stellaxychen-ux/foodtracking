/* P‑Care v4 — bigger databases + deeper analysis + richer TCM evidence cards
   Files expected in same folder:
   - index.html
   - app.js
   - fooddb.json
   - tcm_evidence.json
   - aus_guidelines.json
*/

const PCare = (() => {
  // ---------------------------
  // i18n strings (minimal; keep stable)
  // ---------------------------
  const STR = {
    en: {
      home: "Home", phases: "Stages", analysis: "Analysis", evidence: "Evidence", notes: "Notes",
      daily_goals: "Daily goals", target_weight: "Target weight",
      calories: "Calories", protein: "Protein", fv: "Fruit & Veg", water: "Fluids",
      ask_ai: "Ask AI", google: "Search Google",
      search_placeholder: "Search foods… (Chinese/English)",
      safe: "Safe", caution: "Caution", avoid: "Avoid",
      not_found: "Not found in database.",
      manual_add: "Manual add", add: "Add",
      reset: "Reset today",
      evidence_title: "Integrative/TCM evidence library",
      evidence_hint: "Informational only. Always discuss herbs/supplements with your oncology team.",
      filter_type: "Type", filter_evidence: "Evidence",
      au_ref: "Australia reference", who_ref: "WHO reference",
      week_view: "Last 7 days",
      interactions: "Interactions/Warnings",
      view_detail: "View details",
      download_db: "Download DB JSON"
    },
    zh: {
      home: "首页", phases: "阶段", analysis: "分析", evidence: "证据库", notes: "说明",
      daily_goals: "每日目标", target_weight: "体重",
      calories: "热量", protein: "蛋白质", fv: "果蔬", water: "饮水",
      ask_ai: "问AI", google: "谷歌搜索",
      search_placeholder: "搜索食物…（中/英）",
      safe: "推荐", caution: "谨慎", avoid: "避免",
      not_found: "数据库未找到该食物。",
      manual_add: "手动记录", add: "添加",
      reset: "重置今天",
      evidence_title: "中西医结合/中医证据库",
      evidence_hint: "仅供信息参考；任何中药/补充剂请先与肿瘤团队沟通。",
      filter_type: "类型", filter_evidence: "证据等级",
      au_ref: "澳洲参考", who_ref: "WHO 参考",
      week_view: "最近7天",
      interactions: "相互作用/风险",
      view_detail: "查看详情",
      download_db: "下载数据库JSON"
    }
  };

  // ---------------------------
  // State
  // ---------------------------
  const LS = {
    settings: "pcare_settings_v4",
    day: (d) => `pcare_day_${d}`,
    cache_food: "pcare_food_cache_v4",
    cache_tcm: "pcare_tcm_cache_v4"
  };

  const DEFAULT_SETTINGS = {
    lang: "zh",
    weightKg: 60,
    calPerKg: 30,
    protPerKg: 1.5,
    fvTargetG: 400,
    waterTargetMl: 2000,
    auProfile: "female" // female|male
  };

  const DEFAULT_DAY = { date: null, stats: { cal: 0, prot: 0, fv: 0, water: 0 }, log: [] };

  let settings = loadSettings();
  let today = loadToday();
  let foodDB = null;
  let tcmDB = null;
  let auDB = null;

  // Evidence filters
  let evType = "all";
  let evLevel = "all";

  // ---------------------------
  // Helpers
  // ---------------------------
  function isoDate(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function pct(cur, tgt) { if (!tgt) return 0; return clamp((cur / tgt) * 100, 0, 999); }
  function t(key){ return STR[settings.lang][key] || key; }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(LS.settings);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    } catch { return { ...DEFAULT_SETTINGS }; }
  }
  function saveSettings(){ localStorage.setItem(LS.settings, JSON.stringify(settings)); }

  function loadToday() {
    const d = isoDate();
    try {
      const raw = localStorage.getItem(LS.day(d));
      if (raw) return JSON.parse(raw);
    } catch {}
    const fresh = JSON.parse(JSON.stringify(DEFAULT_DAY));
    fresh.date = d;
    return fresh;
  }
  function saveToday(){ localStorage.setItem(LS.day(today.date), JSON.stringify(today)); }

  function getTargets(){
    return {
      cal: Math.round(settings.weightKg * settings.calPerKg),
      prot: Math.round(settings.weightKg * settings.protPerKg),
      fv: settings.fvTargetG,
      water: settings.waterTargetMl
    };
  }

  function toast(msg){
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    el.style.opacity = "1";
    clearTimeout(toast._t);
    toast._t = setTimeout(()=>{ el.style.opacity="0"; }, 1800);
  }

  async function loadJSON(path){
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return await res.json();
  }

  // ---------------------------
  // Food rendering
  // ---------------------------
  function foodTitle(it){
    return settings.lang === "zh" ? it.name?.zh : it.name?.en;
  }
  function foodNote(it){
    return settings.lang === "zh" ? it.note?.zh : it.note?.en;
  }

  function renderFoods(list){
    const wrap = document.getElementById("foodList");
    wrap.innerHTML = "";
    if (!list || list.length === 0){
      document.getElementById("notFound").classList.remove("hidden");
      return;
    }
    document.getElementById("notFound").classList.add("hidden");

    list.forEach(it=>{
      const st = it.status;
      const icon = st==="safe" ? "✅" : (st==="caution" ? "⚠️" : "⛔");
      const canEat = st !== "avoid";
      const n = it.nutrition || {};
      const meta = [
        n.cal!=null ? `🔥 ${n.cal}kcal` : "",
        n.protein!=null ? `🥩 ${n.protein}g` : "",
        n.fv ? `🍎 ${n.fv}g` : "",
        n.water ? `💧 ${n.water}ml` : ""
      ].filter(Boolean).join(" • ");

      const card = document.createElement("div");
      card.className = `card p-4 ${st} flex items-start justify-between gap-3`;
      card.innerHTML = `
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-xl">${it.emoji||"🍽️"}</span>
            <span class="font-bold">${icon}</span>
            <div class="font-extrabold truncate">${escapeHtml(foodTitle(it)||"")}</div>
            <div class="tiny muted hidden md:block truncate">(${escapeHtml(settings.lang==="zh" ? (it.name?.en||"") : (it.name?.zh||""))})</div>
          </div>
          <div class="tiny muted mt-1">${escapeHtml(foodNote(it)||"")}</div>
          <div class="tiny text-slate-500 mt-1">${escapeHtml(meta)}</div>
        </div>
        <div class="shrink-0">
          ${canEat ? `<button class="btn" onclick="PCare.addFood('${escapeHtml(foodTitle(it)||it.id)}',${n.cal||0},${n.protein||0},${n.fv||0},${n.water||0})">➕</button>`
                   : `<span class="tiny font-extrabold text-rose-600">⛔</span>`}
        </div>
      `;
      wrap.appendChild(card);
    });
  }

  function escapeHtml(s){
    return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }

  function filterFoods(){
    const q = (document.getElementById("foodSearch").value||"").trim().toLowerCase();
    const items = foodDB?.foods || [];
    if (!q){ renderFoods(items); return; }

    const filtered = items.filter(it=>{
      const en = (it.name?.en||"").toLowerCase();
      const zh = (it.name?.zh||"").toLowerCase();
      const als = (it.aliases||[]).join(" ").toLowerCase();
      const tags = (it.tags||[]).join(" ").toLowerCase();
      return en.includes(q) || zh.includes(q) || als.includes(q) || tags.includes(q);
    });
    renderFoods(filtered);
  }

  // ---------------------------
  // Tracking + analysis
  // ---------------------------
  function addFood(name, cal, prot, fv=0, water=0){
    today.stats.cal += Number(cal||0);
    today.stats.prot += Number(prot||0);
    today.stats.fv += Number(fv||0);
    today.stats.water += Number(water||0);
    today.log.push({ ts:new Date().toISOString(), name, cal:Number(cal||0), prot:Number(prot||0), fv:Number(fv||0), water:Number(water||0) });
    saveToday();
    updateDashboard();
    toast((settings.lang==="zh" ? "已添加：":"Added: ") + name);
  }

  function resetToday(){
    if (!confirm(settings.lang==="zh" ? "确认重置今天？" : "Reset today?")) return;
    today = JSON.parse(JSON.stringify(DEFAULT_DAY));
    today.date = isoDate();
    saveToday();
    updateDashboard();
    toast(settings.lang==="zh" ? "已重置 ✅" : "Reset ✅");
  }

  function updateDashboard(){
    const tgt = getTargets();
    setBar("cal", today.stats.cal, tgt.cal);
    setBar("prot", today.stats.prot, tgt.prot);
    setBar("fv", today.stats.fv, tgt.fv);
    setBar("water", today.stats.water, tgt.water);

    // weekly (last 7)
    const days = [];
    for (let i=6;i>=0;i--){
      const d = new Date();
      d.setDate(d.getDate()-i);
      const key = LS.day(isoDate(d));
      const raw = localStorage.getItem(key);
      let v = { cal:0, prot:0 };
      if (raw){
        try { const obj = JSON.parse(raw); v = obj.stats || v; } catch {}
      }
      days.push({ label: isoDate(d).slice(5), cal:v.cal||0, prot:v.prot||0 });
    }
    renderWeek(days, tgt);

    // AU reference
    renderAU();
  }

  function setBar(prefix, cur, tgt){
    document.getElementById(prefix+"Cur").textContent = cur;
    document.getElementById(prefix+"Tgt").textContent = tgt;
    document.getElementById(prefix+"Bar").style.width = `${clamp(pct(cur,tgt),0,100)}%`;
    document.getElementById(prefix+"Pct").textContent = `${Math.round(pct(cur,tgt))}%`;
  }

  function renderWeek(days, tgt){
    const wrap = document.getElementById("weekWrap");
    wrap.innerHTML = "";
    days.forEach(d=>{
      const row = document.createElement("div");
      row.className = "weekrow";
      row.innerHTML = `
        <div class="tiny muted w-14">${d.label}</div>
        <div class="flex-1">
          <div class="barbg"><div class="barfg" style="width:${clamp(pct(d.cal,tgt.cal),0,100)}%"></div></div>
          <div class="tiny muted mt-1">🔥 ${d.cal} / ${tgt.cal}</div>
        </div>
        <div class="flex-1">
          <div class="barbg"><div class="barfg2" style="width:${clamp(pct(d.prot,tgt.prot),0,100)}%"></div></div>
          <div class="tiny muted mt-1">🥩 ${d.prot} / ${tgt.prot}</div>
        </div>
      `;
      wrap.appendChild(row);
    });
  }

  function renderAU(){
    const box = document.getElementById("auBox");
    if (!auDB?.adult){ box.textContent = ""; return; }
    const p = auDB.adult[settings.auProfile];
    box.innerHTML = settings.lang==="zh"
      ? `澳洲成人参考（${settings.auProfile==="female"?"女":"男"}）：蔬菜豆类 ${p.veg_serves} 份/天；水果 ${p.fruit_serves} 份/天；谷物 ${p.grains_serves} 份/天；瘦肉蛋豆鱼 ${p.protein_serves} 份/天；奶及替代 ${p.dairy_serves} 份/天；水 ${p.water_ml} ml/天。`
      : `AU adult reference (${settings.auProfile}): veg/legumes ${p.veg_serves} serves/day; fruit ${p.fruit_serves}; grains ${p.grains_serves}; protein foods ${p.protein_serves}; dairy ${p.dairy_serves}; water ${p.water_ml} ml/day.`;
  }

  // ---------------------------
  // Evidence library (TCM)
  // ---------------------------
  function renderEvidence(){
    const wrap = document.getElementById("evList");
    wrap.innerHTML = "";
    const items = (tcmDB?.items || []).filter(it=>{
      const okType = (evType==="all" || it.type===evType);
      const okLev = (evLevel==="all" || it.evidence_level===evLevel);
      return okType && okLev;
    });

    items.forEach(it=>{
      const title = settings.lang==="zh" ? it.name?.zh : it.name?.en;
      const sum = settings.lang==="zh" ? it.summary?.zh : it.summary?.en;
      const risks = (it.risks||[]).slice(0,2).map(x=>`• ${x}`).join("<br>");
      const inter = (it.interactions||[]).slice(0,2).map(x=>`• ${x}`).join("<br>");
      const card = document.createElement("div");
      card.className = "card p-4 border border-slate-100";
      card.innerHTML = `
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-xl">${it.emoji||"🌿"}</span>
              <div class="font-extrabold truncate">${escapeHtml(title||it.id)}</div>
              <span class="pill">${escapeHtml(it.type)}</span>
              <span class="pill2">${escapeHtml(it.evidence_level)}</span>
            </div>
            <div class="tiny muted mt-1">${escapeHtml(sum||"")}</div>
            ${risks? `<div class="tiny mt-2"><b>⚠️ ${t("interactions")}</b><br>${risks}${inter? "<br>"+inter:""}</div>`:""}
          </div>
          <button class="btn-ghost" onclick="PCare.openEv('${it.id}')">${t("view_detail")} ➜</button>
        </div>
      `;
      wrap.appendChild(card);
    });

    document.getElementById("evCount").textContent = String(items.length);
  }

  function openEv(id){
    const it = (tcmDB?.items||[]).find(x=>x.id===id);
    if (!it) return;
    const title = settings.lang==="zh" ? it.name?.zh : it.name?.en;
    const sum = settings.lang==="zh" ? it.summary?.zh : it.summary?.en;
    const uses = (it.use_cases||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
    const herbs = (it.components?.herbs||[]).map(x=>`<span class="chip">${escapeHtml(x)}</span>`).join(" ");
    const formula = it.components?.formula ? `<div class="tiny mt-2"><b>方/处方名：</b>${escapeHtml(it.components.formula)}</div>` : "";
    const risks = (it.risks||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
    const inter = (it.interactions||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
    const refs = (it.refs||[]).map(r=>`<li>${escapeHtml(r.title||"")}${r.year?` (${r.year})`:""}${r.note?` — ${escapeHtml(r.note)}`:""}</li>`).join("");
    document.getElementById("evModalTitle").textContent = title || id;
    document.getElementById("evModalBody").innerHTML = `
      <div class="tiny muted">${escapeHtml(sum||"")}</div>
      ${it.use_cases?.length? `<div class="mt-3"><b>适用场景 / Use cases</b><ul class="list-disc pl-5 tiny muted mt-1">${uses}</ul></div>`:""}
      ${formula}
      ${herbs? `<div class="mt-3"><b>常见药材 / Components</b><div class="mt-2 flex flex-wrap gap-2">${herbs}</div></div>`:""}
      ${(it.risks||it.interactions||[]).length? `<div class="mt-3"><b>⚠️ 风险与相互作用</b><div class="grid md:grid-cols-2 gap-3 mt-2">
        <div class="card p-3 border border-slate-100 shadow-none"><div class="font-bold tiny">Risks</div><ul class="list-disc pl-5 tiny muted mt-1">${risks||"<li>—</li>"}</ul></div>
        <div class="card p-3 border border-slate-100 shadow-none"><div class="font-bold tiny">Interactions</div><ul class="list-disc pl-5 tiny muted mt-1">${inter||"<li>—</li>"}</ul></div>
      </div></div>`:""}
      ${refs? `<div class="mt-3"><b>References</b><ul class="list-disc pl-5 tiny muted mt-1">${refs}</ul></div>`:""}
    `;
    document.getElementById("evModal").classList.remove("hidden");
    document.getElementById("evModal").classList.add("flex");
  }

  function closeEv(){
    document.getElementById("evModal").classList.add("hidden");
    document.getElementById("evModal").classList.remove("flex");
  }

  // ---------------------------
  // External actions
  // ---------------------------
  function askAI(){
    const q = (document.getElementById("foodSearch").value||"").trim();
    const item = q || (settings.lang==="zh" ? "这个食物/补充剂" : "this food/supplement");
    const prompt = settings.lang==="zh"
      ? `我是一名胰腺癌患者/胰腺手术后患者。请问「${item}」是否适合？请给出：低脂做法、建议份量/频次、何时需要避免；如果是中药/补充剂，请列出需要问医生的相互作用问题（抗凝、肝肾、化疗）。`
      : `I have pancreatic cancer or post-pancreatic surgery. Is "${item}" appropriate? Give low-fat prep, portion/frequency, when to avoid. If herb/supplement, list clinician questions about interactions (anticoagulants, liver/kidney, chemo).`;
    if (confirm(prompt)) window.open(`https://chatgpt.com/?q=${encodeURIComponent(prompt)}`, "_blank");
  }

  function googleSearch(){
    const q = (document.getElementById("foodSearch").value||"").trim();
    const finalQuery = settings.lang==="zh"
      ? `胰腺癌 饮食 能不能吃 ${q}`.trim()
      : `pancreatic cancer diet can I eat ${q}`.trim();
    window.open(`https://www.google.com/search?q=${encodeURIComponent(finalQuery)}`, "_blank");
  }

  // ---------------------------
  // Tabs + init
  // ---------------------------
  function switchTab(tab){
    ["home","analysis","evidence","notes"].forEach(x=>{
      document.getElementById("tab-"+x).classList.toggle("hidden", x!==tab);
      document.querySelector(`[data-tab='${x}']`)?.classList.toggle("tab-active", x===tab);
    });
    if (tab==="analysis") updateDashboard();
    if (tab==="evidence") renderEvidence();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function applyI18n(){
    document.querySelectorAll("[data-i18n]").forEach(el=>{
      const key = el.getAttribute("data-i18n");
      if (STR[settings.lang][key]!==undefined) el.textContent = STR[settings.lang][key];
    });
    document.getElementById("foodSearch").placeholder = t("search_placeholder");
    document.getElementById("evHint").textContent = t("evidence_hint");
  }

  function setEvidenceFilters(){
    evType = document.getElementById("evType").value;
    evLevel = document.getElementById("evLevel").value;
    renderEvidence();
  }

  async function init(){
    // Bind
    document.getElementById("langBtn").addEventListener("click", ()=>{
      settings.lang = settings.lang==="zh" ? "en" : "zh";
      saveSettings();
      applyI18n();
      filterFoods();
      renderEvidence();
      updateDashboard();
    });
    document.getElementById("foodSearch").addEventListener("input", filterFoods);
    document.getElementById("resetBtn").addEventListener("click", resetToday);
    document.getElementById("askBtn").addEventListener("click", askAI);
    document.getElementById("googleBtn").addEventListener("click", googleSearch);
    document.getElementById("evType").addEventListener("change", setEvidenceFilters);
    document.getElementById("evLevel").addEventListener("change", setEvidenceFilters);
    document.getElementById("evClose").addEventListener("click", closeEv);
    document.getElementById("auProfile").addEventListener("change", (e)=>{
      settings.auProfile = e.target.value;
      saveSettings();
      updateDashboard();
    });

    // Load JSON
    try{
      [foodDB, tcmDB, auDB] = await Promise.all([
        loadJSON("./fooddb.json"),
        loadJSON("./tcm_evidence.json"),
        loadJSON("./aus_guidelines.json")
      ]);
    }catch(e){
      console.error(e);
      toast((settings.lang==="zh" ? "加载数据库失败：" : "Failed to load DB: ") + e.message);
    }

    applyI18n();
    renderFoods(foodDB?.foods || []);
    updateDashboard();
    renderEvidence();

    switchTab("home");
  }

  // Public API
  return {
    init, switchTab,
    filterFoods, addFood, askAI, googleSearch,
    openEv, closeEv
  };
})();

window.PCare = PCare;
window.addEventListener("DOMContentLoaded", () => PCare.init());
