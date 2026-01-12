/* P‑Care v2 — bilingual, Chinese-compatible food database, analysis page, stages + TCM notes
   No build step. Works on GitHub Pages.

   Files:
   - index.html
   - app.js
   - fooddb.json
*/

const PCare = (() => {
  // ---------------------------
  // i18n
  // ---------------------------
  const STR = {
    en: {
      tab_home: "Home",
      tab_phases: "Stages",
      tab_analysis: "Analysis",
      tab_info: "Notes",
      daily_goals: "Daily goals",
      target_weight: "Target weight",
      calories: "Calories",
      protein: "Protein",
      fruit_veg: "Fruit & Veg",
      water: "Fluids",
      who_hint: "WHO suggests ≥400g/day of fruit & vegetables.",
      water_hint: "If you have restrictions, follow your clinician’s advice.",
      reset_today: "Reset today",
      ask_ai: "Ask AI Assistant",
      search_web: "Search Web",
      tcm_btn: "Alt/TCM Research Notes",
      food_guide: "Food safety guide",
      food_guide_hint: "Search in Chinese or English (e.g., “鸡胸肉”, “banana”).",
      safe: "Safe",
      caution: "Caution",
      avoid: "Avoid",
      filter_safe: "Safe first",
      filter_caution: "Caution",
      filter_avoid: "Avoid",
      filter_all: "All",
      not_found: "Item not found in database.",
      ask_ai_check: "Ask AI if it’s safe",
      manual_add: "Manual add",
      manual_add_hint: "If you ate something not in the list, add an estimate.",
      manual_add_tip: "Tip: fruit+veg grams & water are optional.",
      add: "Add",
      phases_title: "Food recommendations by stage",
      phases_hint: "Pick a stage to see practical food ideas. Always follow your surgical/oncology team’s instructions.",
      stage_postop_early: "Post‑op (early)",
      stage_postop_late: "Post‑op (later)",
      stage_chemo: "During chemo",
      stage_diabetes: "With diabetes",
      analysis_title: "Daily analysis",
      analysis_hint: "See today’s progress against targets. You can also view AU/WHO reference targets below.",
      export_day: "Export today (JSON)",
      au_ref: "Australia reference (general population)",
      au_serves: "Recommended serves/day (adults)",
      au_protein: "Protein RDI (adults)",
      who_ref: "WHO reference",
      notes_title: "Clinical notes",
      db_title: "Database",
      db_hint: "Food items are stored in <span class='kbd'>fooddb.json</span>. You can update that file and re‑deploy on GitHub Pages.",
      download_db: "Download food database (JSON)",
      import_db: "Import/merge database (admin)",
      settings: "Settings",
      settings_hint: "Patient targets are weight‑based (commonly 25–30 kcal/kg/day and 1.2–2.0 g protein/kg/day in oncology nutrition practice).",
      current_weight: "Current weight (kg)",
      cal_perkg: "Calories (kcal/kg)",
      prot_perkg: "Protein (g/kg)",
      fv_target: "Fruit & veg target (g)",
      water_target: "Fluids target (ml)",
      save_recalc: "Save & recalculate",
      admin_tip: "Admin import (hidden): open with",
      tcm_title: "Alternative / Chinese medicine (research notes)",
      got_it: "Got it",
      import_title: "Import / merge database",
      import_hint: "Select a JSON file with the same schema as <span class='kbd'>fooddb.json</span>. It will merge by <span class='kbd'>id</span>.",
      import_merge: "Import & merge",
      import_note: "Note: this only updates your local browser cache. To update GitHub Pages, also replace the repository’s <span class='kbd'>fooddb.json</span> file."
    },
    zh: {
      tab_home: "首页",
      tab_phases: "阶段建议",
      tab_analysis: "分析",
      tab_info: "说明",
      daily_goals: "每日目标",
      target_weight: "体重",
      calories: "热量",
      protein: "蛋白质",
      fruit_veg: "果蔬",
      water: "饮水",
      who_hint: "WHO 建议：果蔬≥400g/天。",
      water_hint: "如有医嘱限水，请以医生建议为准。",
      reset_today: "重置今天",
      ask_ai: "问 AI 助手",
      search_web: "谷歌搜索",
      tcm_btn: "中医/替代疗法研究提示",
      food_guide: "食物安全查询",
      food_guide_hint: "支持中英文搜索（例如“鸡胸肉”“banana”）。",
      safe: "推荐",
      caution: "谨慎",
      avoid: "避免",
      filter_safe: "优先推荐",
      filter_caution: "谨慎项",
      filter_avoid: "避免项",
      filter_all: "全部",
      not_found: "数据库未找到该食物。",
      ask_ai_check: "问 AI 是否适合",
      manual_add: "手动记录",
      manual_add_hint: "如果吃了列表里没有的食物，可以估算添加。",
      manual_add_tip: "提示：果蔬克数与饮水量可选填。",
      add: "添加",
      phases_title: "不同阶段的饮食建议",
      phases_hint: "选择阶段查看实用食物建议；请始终遵循手术/肿瘤团队的个体化医嘱。",
      stage_postop_early: "术后早期",
      stage_postop_late: "术后恢复期",
      stage_chemo: "放化疗期间",
      stage_diabetes: "合并糖尿病",
      analysis_title: "每日分析",
      analysis_hint: "查看今天摄入与目标的百分比；下方也提供澳洲/WHO 的参考值。",
      export_day: "导出今天（JSON）",
      au_ref: "澳洲参考（一般人群）",
      au_serves: "成人每日建议份数",
      au_protein: "蛋白质 RDI（成人）",
      who_ref: "WHO 参考",
      notes_title: "临床提示",
      db_title: "数据库",
      db_hint: "食物条目保存在 <span class='kbd'>fooddb.json</span>。你可以修改该文件后重新部署到 GitHub Pages。",
      download_db: "下载食物数据库（JSON）",
      import_db: "导入/合并数据库（管理员）",
      settings: "设置",
      settings_hint: "患者目标可按体重计算（肿瘤营养实践中常用：热量 25–30 kcal/kg/天；蛋白质 1.2–2.0 g/kg/天）。",
      current_weight: "当前体重（kg）",
      cal_perkg: "热量（kcal/kg）",
      prot_perkg: "蛋白质（g/kg）",
      fv_target: "果蔬目标（g）",
      water_target: "饮水目标（ml）",
      save_recalc: "保存并重算",
      admin_tip: "管理员导入（隐藏）：打开链接加上",
      tcm_title: "中医/替代疗法（研究提示）",
      got_it: "明白了",
      import_title: "导入/合并数据库",
      import_hint: "选择与 <span class='kbd'>fooddb.json</span> 相同结构的 JSON 文件，将按 <span class='kbd'>id</span> 合并。",
      import_merge: "导入并合并",
      import_note: "注意：这只会更新你浏览器的本地缓存；若要更新 GitHub Pages，请同时替换仓库里的 <span class='kbd'>fooddb.json</span> 文件。"
    }
  };

  // ---------------------------
  // State
  // ---------------------------
  const LS_KEYS = {
    settings: "pcare_settings_v2",
    day: (d) => `pcare_day_${d}`,
    dbCache: "pcare_fooddb_cache_v2"
  };

  const DEFAULT_SETTINGS = {
    lang: "en",
    weightKg: 60,
    calPerKg: 30,
    protPerKg: 1.5,
    fvTargetG: 400,
    waterTargetMl: 2000
  };

  const DEFAULT_DAY = {
    date: null,
    stats: { cal: 0, prot: 0, fv: 0, water: 0 },
    log: [] // {ts,name,cal,prot,fv,water}
  };

  let settings = loadSettings();
  let today = loadToday();
  let foodDB = null;
  let quickStatusFilter = "all";

  // ---------------------------
  // Utilities
  // ---------------------------
  function isoDate(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function pct(current, target) {
    if (!target || target <= 0) return 0;
    return clamp((current / target) * 100, 0, 999);
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(LS_KEYS.settings);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettingsToLS() {
    localStorage.setItem(LS_KEYS.settings, JSON.stringify(settings));
  }

  function loadToday() {
    const d = isoDate();
    try {
      const raw = localStorage.getItem(LS_KEYS.day(d));
      if (raw) return JSON.parse(raw);
    } catch {}
    const fresh = JSON.parse(JSON.stringify(DEFAULT_DAY));
    fresh.date = d;
    return fresh;
  }

  function saveToday() {
    localStorage.setItem(LS_KEYS.day(today.date), JSON.stringify(today));
  }

  function getTargets() {
    const calTarget = Math.round(settings.weightKg * settings.calPerKg);
    const protTarget = Math.round(settings.weightKg * settings.protPerKg);
    return {
      calTarget,
      protTarget,
      fvTargetG: settings.fvTargetG,
      waterTargetMl: settings.waterTargetMl
    };
  }

  function isAdmin() {
    const u = new URL(window.location.href);
    return u.searchParams.get("admin") === "1";
  }

  // ---------------------------
  // Rendering
  // ---------------------------
  function applyI18n() {
    const lang = settings.lang;
    document.getElementById("langPill").textContent = lang.toUpperCase();
    document.getElementById("langToggleText").textContent = lang === "en" ? "中文" : "EN";
    document.getElementById("subtitle").textContent =
      lang === "en" ? "Pancreatic nutrition helper (patient-facing)" : "胰腺相关营养小助手（面向患者）";

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (STR[lang] && STR[lang][key] !== undefined) el.innerHTML = STR[lang][key];
    });

    // Goal hint text
    const hint = document.getElementById("goalHint");
    hint.textContent =
      lang === "en"
        ? "Targets are weight-based; small frequent meals + high-protein focus ✅"
        : "目标按体重计算；少量多餐 + 优先高蛋白 ✅";

    // Notes
    const notesBody = document.getElementById("notesBody");
    notesBody.innerHTML =
      lang === "en"
        ? `
          <div><b>General tips</b>: small frequent meals, choose high-protein foods, sit upright after eating, avoid lying down right away, and keep activity if possible. 😊</div>
          <div><b>Tracking</b>: tap “+ Eat” on a food item or use “Manual add”.</div>
          <div><b>Safety</b>: This is informational and not medical advice. For symptoms (pain, vomiting, fever, severe diarrhea), contact your care team.</div>
        `
        : `
          <div><b>通用建议</b>：少量多餐、优先高蛋白；进食时坐直、饭后避免立刻躺下；条件允许尽量保持活动。😊</div>
          <div><b>记录</b>：点食物条目的“+ 吃了”或用“手动记录”。</div>
          <div><b>安全提示</b>：本页面仅供参考，不替代医疗建议。若出现明显不适（剧痛、呕吐、发热、严重腹泻等），请联系医生。</div>
        `;

    // TCM modal content (lightweight, cautious)
    const tcmBody = document.getElementById("tcmBody");
    tcmBody.innerHTML =
      lang === "en"
        ? `
          <div>Many patients consider herbal products or Traditional Chinese Medicine (TCM). Current evidence can be mixed, and quality varies.</div>
          <ul class="list-disc pl-5 space-y-1">
            <li><b>Tell your oncology team</b> before starting any herbs/supplements.</li>
            <li>Some products may affect <b>bleeding risk</b>, <b>liver enzymes</b>, or interact with <b>chemotherapy</b> and other medications.</li>
            <li>Prefer products with clear ingredients, reputable sourcing, and avoid “miracle cure” claims.</li>
          </ul>
          <div class="mt-2">If you want, paste a formula/herb name into the search box and use 🤖 Ask AI to generate questions for your clinician.</div>
        `
        : `
          <div>很多患者会考虑中药/保健品等替代疗法。现有研究证据不一，且产品质量差异较大。</div>
          <ul class="list-disc pl-5 space-y-1">
            <li><b>务必告知肿瘤团队</b>：开始任何中药/补充剂前先咨询医生。</li>
            <li>部分产品可能影响<b>凝血</b>、<b>肝肾代谢</b>，或与<b>化疗/靶向/抗凝药</b>等发生相互作用。</li>
            <li>优先成分透明、来源可靠的产品，避免“包治/神药”等夸大宣传。</li>
          </ul>
          <div class="mt-2">你也可以把方剂/药材名称输入搜索框，然后用 🤖 生成“该问医生的问题清单”。</div>
        `;

    // AU/WHO reference sections (concise)
    document.getElementById("auRefText").innerHTML =
      lang === "en"
        ? `For general adults, Australian Dietary Guidelines provide daily food-group serves; NRVs provide protein RDIs (varies by age/sex).`
        : `澳洲一般人群可参考 Australian Dietary Guidelines 的食物组份数，以及 NRVs 的蛋白质 RDI（随年龄/性别变化）。`;

    document.getElementById("auServes").innerHTML =
      lang === "en"
        ? `Typical adult targets: <b>Vegetables</b> 5–6 serves/day, <b>Fruit</b> 2 serves/day, <b>Grains</b> ~4–6 serves/day, <b>Dairy</b> ~2–3 serves/day, <b>Lean meats/alternatives</b> ~2–3 serves/day.`
        : `成人常见建议：<b>蔬菜</b>约 5–6 份/天，<b>水果</b>2 份/天，<b>谷物</b>约 4–6 份/天，<b>奶及替代</b>约 2–3 份/天，<b>瘦肉/蛋/鱼/豆类</b>约 2–3 份/天。`;

    document.getElementById("auProtein").innerHTML =
      lang === "en"
        ? `Adult protein RDI is commonly shown as ~<b>0.75 g/kg (women)</b> and <b>0.84 g/kg (men)</b>; older adults may be higher.`
        : `成人蛋白质 RDI 常见为：女性约 <b>0.75 g/kg</b>，男性约 <b>0.84 g/kg</b>；高龄人群可能更高。`;

    document.getElementById("whoRef").innerHTML =
      lang === "en"
        ? `<ul class="list-disc pl-5 space-y-1">
             <li>Fruit & vegetables: <b>≥400 g/day</b> (about 5 portions).</li>
             <li>Free sugars: <b>&lt;10%</b> of total energy (ideally &lt;5%).</li>
             <li>Salt: aim <b>&lt;5 g/day</b> (sodium &lt;2 g/day).</li>
           </ul>`
        : `<ul class="list-disc pl-5 space-y-1">
             <li>果蔬：<b>≥400 g/天</b>（约 5 份）。</li>
             <li>游离糖：总能量的 <b>&lt;10%</b>（理想 &lt;5%）。</li>
             <li>盐：<b>&lt;5 g/天</b>（钠 &lt;2 g/天）。</li>
           </ul>`;
  }

  function renderFoods(list) {
    const container = document.getElementById("foodList");
    container.innerHTML = "";

    if (!list || list.length === 0) {
      document.getElementById("notFound").classList.remove("hidden");
      return;
    }
    document.getElementById("notFound").classList.add("hidden");

    const lang = settings.lang;

    list.forEach((item) => {
      const statusIcon =
        item.status === "safe" ? "circle-check text-emerald-600" :
        item.status === "caution" ? "triangle-exclamation text-amber-600" :
        "circle-xmark text-rose-600";

      const title = lang === "en" ? item.name_en : item.name_zh;
      const note = lang === "en" ? item.note_en : item.note_zh;

      const canEat = item.status !== "avoid";
      const btn = canEat
        ? `<button class="btn-ghost px-3 py-1.5 rounded-xl text-sm font-extrabold hover:bg-slate-50"
                   onclick="PCare.addFood('${escapeHtml(title)}', ${item.cal||0}, ${item.protein||0}, ${item.fv||0}, ${item.water||0})">➕ ${lang==="en"?"Eat":"吃了"}</button>`
        : `<span class="text-xs font-extrabold text-rose-600 uppercase">⛔ ${lang==="en"?"Avoid":"避免"}</span>`;

      const meta = [];
      if (item.cal != null) meta.push(`🔥 ${item.cal} kcal`);
      if (item.protein != null) meta.push(`🥩 ${item.protein} g`);
      if (item.fv) meta.push(`🍎 ${item.fv} g`);
      if (item.water) meta.push(`💧 ${item.water} ml`);

      const div = document.createElement("div");
      div.className = `card p-4 ${item.status} flex items-start justify-between gap-3`;
      div.innerHTML = `
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-xl">${item.emoji || "🍽️"}</span>
            <i class="fa-solid fa-${statusIcon} text-lg"></i>
            <h4 class="font-extrabold text-slate-900 truncate">${escapeHtml(title)}</h4>
            <span class="hidden md:inline tiny muted truncate">(${escapeHtml(lang==="en"? item.name_zh : item.name_en)})</span>
          </div>
          <p class="tiny muted mt-1">${escapeHtml(note)}</p>
          <p class="tiny text-slate-500 mt-1">${meta.join(" • ")}</p>
        </div>
        <div class="shrink-0">${btn}</div>
      `;
      container.appendChild(div);
    });
  }

  function updateDashboard() {
    const { calTarget, protTarget, fvTargetG, waterTargetMl } = getTargets();

    document.getElementById("targetWeightDisplay").textContent = settings.weightKg;

    document.getElementById("calTarget").textContent = calTarget;
    document.getElementById("calCurrent").textContent = today.stats.cal;
    document.getElementById("calBar").style.width = `${clamp(pct(today.stats.cal, calTarget), 0, 100)}%`;

    document.getElementById("protTarget").textContent = protTarget;
    document.getElementById("protCurrent").textContent = today.stats.prot;
    document.getElementById("protBar").style.width = `${clamp(pct(today.stats.prot, protTarget), 0, 100)}%`;

    document.getElementById("fvTarget").textContent = fvTargetG;
    document.getElementById("fvCurrent").textContent = today.stats.fv;
    document.getElementById("fvBar").style.width = `${clamp(pct(today.stats.fv, fvTargetG), 0, 100)}%`;

    document.getElementById("waterTarget").textContent = waterTargetMl;
    document.getElementById("waterCurrent").textContent = today.stats.water;
    document.getElementById("waterBar").style.width = `${clamp(pct(today.stats.water, waterTargetMl), 0, 100)}%`;

    // Analysis page mirrors
    document.getElementById("aCalPct").textContent = `${Math.round(pct(today.stats.cal, calTarget))}%`;
    document.getElementById("aCalBar").style.width = `${clamp(pct(today.stats.cal, calTarget), 0, 100)}%`;
    document.getElementById("aCalText").textContent = `${today.stats.cal} / ${calTarget} kcal`;

    document.getElementById("aProtPct").textContent = `${Math.round(pct(today.stats.prot, protTarget))}%`;
    document.getElementById("aProtBar").style.width = `${clamp(pct(today.stats.prot, protTarget), 0, 100)}%`;
    document.getElementById("aProtText").textContent = `${today.stats.prot} / ${protTarget} g`;

    document.getElementById("aFVPct").textContent = `${Math.round(pct(today.stats.fv, fvTargetG))}%`;
    document.getElementById("aFVBar").style.width = `${clamp(pct(today.stats.fv, fvTargetG), 0, 100)}%`;
    document.getElementById("aFVText").textContent = `${today.stats.fv} / ${fvTargetG} g`;

    document.getElementById("aWaterPct").textContent = `${Math.round(pct(today.stats.water, waterTargetMl))}%`;
    document.getElementById("aWaterBar").style.width = `${clamp(pct(today.stats.water, waterTargetMl), 0, 100)}%`;
    document.getElementById("aWaterText").textContent = `${today.stats.water} / ${waterTargetMl} ml`;
  }

  // ---------------------------
  // Search / filters
  // ---------------------------
  function filterFoods() {
    const q = (document.getElementById("foodSearch").value || "").trim().toLowerCase();
    let items = getDBItems();

    // status quick filter
    if (quickStatusFilter !== "all") {
      items = items.filter(x => x.status === quickStatusFilter);
    }

    if (!q) {
      renderFoods(items);
      return;
    }
    const filtered = items.filter((f) => {
      const en = (f.name_en || "").toLowerCase();
      const zh = (f.name_zh || "").toLowerCase();
      const tags = (f.tags || []).join(" ").toLowerCase();
      return en.includes(q) || zh.includes(q) || tags.includes(q);
    });
    renderFoods(filtered);
  }

  function quickFilter(status) {
    quickStatusFilter = status;
    filterFoods();
  }

  function getDBItems() {
    const cached = loadDBCache();
    if (cached?.items?.length) return cached.items;
    return foodDB?.items || [];
  }

  function loadDBCache() {
    try {
      const raw = localStorage.getItem(LS_KEYS.dbCache);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setDBCache(db) {
    localStorage.setItem(LS_KEYS.dbCache, JSON.stringify(db));
  }

  // ---------------------------
  // Add food / log
  // ---------------------------
  function addFood(name, cal, prot, fv = 0, water = 0) {
    today.stats.cal += Number(cal || 0);
    today.stats.prot += Number(prot || 0);
    today.stats.fv += Number(fv || 0);
    today.stats.water += Number(water || 0);

    today.log.push({
      ts: new Date().toISOString(),
      name,
      cal: Number(cal || 0),
      prot: Number(prot || 0),
      fv: Number(fv || 0),
      water: Number(water || 0)
    });

    saveToday();
    updateDashboard();

    const lang = settings.lang;
    toast(lang === "en" ? `Added: ${name} ✅` : `已添加：${name} ✅`);
  }

  function manualAdd() {
    const name = document.getElementById("mName").value.trim() || (settings.lang==="en"?"Manual entry":"手动记录");
    const cal = Number(document.getElementById("mCal").value || 0);
    const prot = Number(document.getElementById("mProt").value || 0);
    const fv = Number(document.getElementById("mFVG").value || 0);
    const water = Number(document.getElementById("mWater").value || 0);

    addFood(name, cal, prot, fv, water);

    // clear
    ["mName","mCal","mProt","mFVG","mWater"].forEach(id => (document.getElementById(id).value = ""));
  }

  function resetToday() {
    if (!confirm(settings.lang==="en" ? "Reset today’s totals?" : "确认重置今天的记录？")) return;
    today = JSON.parse(JSON.stringify(DEFAULT_DAY));
    today.date = isoDate();
    saveToday();
    updateDashboard();
    toast(settings.lang==="en" ? "Reset ✅" : "已重置 ✅");
  }

  // ---------------------------
  // External actions
  // ---------------------------
  function askAI() {
    const q = (document.getElementById("foodSearch").value || "").trim();
    const item = q || (settings.lang==="en" ? "this item" : "这个食物");
    const prompt =
      settings.lang==="en"
        ? `I am a pancreatic cancer patient (or post-pancreatic surgery). Is it safe for me to eat ${item}? Please answer with practical dietary advice, low-fat options, and when to avoid.`
        : `我是一名胰腺癌患者/胰腺手术后患者。请问我能不能吃「${item}」？请给出实用建议：低脂做法、适合的份量/频次、以及何时需要避免。`;

    if (confirm((settings.lang==="en" ? "Open AI Assistant with this prompt?\n\n" : "用以下提示打开 AI？\n\n") + prompt)) {
      window.open(`https://chatgpt.com/?q=${encodeURIComponent(prompt)}`, "_blank");
    }
  }

  function googleSearch() {
    const q = (document.getElementById("foodSearch").value || "").trim();
    const finalQuery =
      settings.lang==="en"
        ? `pancreatic cancer diet can I eat ${q || ""}`.trim()
        : `胰腺癌 饮食 能不能吃 ${q || ""}`.trim();

    window.open(`https://www.google.com/search?q=${encodeURIComponent(finalQuery)}`, "_blank");
  }

  // ---------------------------
  // Tabs
  // ---------------------------
  function switchTab(tab) {
    ["home","phases","analysis","info"].forEach((t) => {
      document.getElementById(`tab-${t}`).classList.toggle("hidden", t !== tab);
      document.querySelector(`[data-tab='${t}']`)?.classList.toggle("tab-active", t === tab);
    });
    // Keep analysis updated
    if (tab === "analysis") updateDashboard();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------------------------
  // Stages panel
  // ---------------------------
  const STAGES = {
    postop_early: {
      en: [
        { title:"🍵 Start gentle", items:["Clear liquids, soups, congee", "Small frequent meals", "Avoid fried/high-fat foods"] },
        { title:"🍗 Protein focus", items:["Soft eggs, tofu, fish", "Add protein gradually", "Consider oral nutrition supplements if advised"] }
      ],
      zh: [
        { title:"🍵 温和起步", items:["清汤/米粥/软面", "少量多餐", "避免油炸与高脂"] },
        { title:"🍗 优先蛋白", items:["蒸蛋/豆腐/清蒸鱼", "循序增加蛋白", "如医生建议可用口服营养补充"] }
      ]
    },
    postop_late: {
      en: [
        { title:"🥗 Rebuild variety", items:["Introduce cooked vegetables", "Try new foods slowly", "Watch for bloating/diarrhea"] },
        { title:"🧈 Fat tolerance", items:["Prefer low-fat cooking", "If fat malabsorption, ask about pancreatic enzymes", "Avoid very greasy meals"] }
      ],
      zh: [
        { title:"🥗 逐步多样", items:["逐步加入熟蔬菜", "新食物慢慢试", "观察胀气/腹泻"] },
        { title:"🧈 脂肪耐受", items:["以低脂烹饪为主", "如脂肪泻可咨询胰酶制剂", "避免特别油腻的一餐"] }
      ]
    },
    chemo: {
      en: [
        { title:"😵 Nausea days", items:["Small frequent snacks", "Cool/soft foods may help", "Ginger tea only if approved"] },
        { title:"🛡️ Food safety", items:["Cook meats/eggs thoroughly", "Avoid raw seafood", "Hydrate and monitor weight"] }
      ],
      zh: [
        { title:"😵 恶心期", items:["少量多餐、备小零食", "偏冷/软食可能更好", "姜茶等先问医生"] },
        { title:"🛡️ 食物安全", items:["肉蛋彻底熟", "避免生食海鲜", "注意补水与体重变化"] }
      ]
    },
    diabetes: {
      en: [
        { title:"🩸 Blood sugar", items:["Choose low added sugar", "Pair carbs with protein", "Prefer whole grains only if tolerated"] },
        { title:"⏱️ Timing", items:["Regular meal timing", "Avoid sugary drinks", "Track glucose as instructed"] }
      ],
      zh: [
        { title:"🩸 血糖管理", items:["减少添加糖", "碳水搭配蛋白", "全谷需看耐受情况"] },
        { title:"⏱️ 进食节律", items:["规律进食时间", "避免含糖饮料", "按医嘱监测血糖"] }
      ]
    }
  };

  function setStage(stageKey) {
    const lang = settings.lang;
    const blocks = STAGES[stageKey]?.[lang] || [];
    const wrap = document.getElementById("stagePanel");
    wrap.innerHTML = blocks.map(b => `
      <div class="card p-4 border border-slate-100 shadow-none">
        <div class="font-extrabold">${escapeHtml(b.title)}</div>
        <ul class="list-disc pl-5 mt-2 space-y-1 tiny muted">
          ${b.items.map(x => `<li>${escapeHtml(x)}</li>`).join("")}
        </ul>
      </div>
    `).join("");
  }

  // ---------------------------
  // Settings modal
  // ---------------------------
  function openSettings() {
    // fill form
    document.getElementById("weightInput").value = settings.weightKg;
    document.getElementById("calPerKgInput").value = settings.calPerKg;
    document.getElementById("protPerKgInput").value = settings.protPerKg;
    document.getElementById("fvTargetInput").value = settings.fvTargetG;
    document.getElementById("waterTargetInput").value = settings.waterTargetMl;

    const modal = document.getElementById("settingsModal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  function closeSettings() {
    const modal = document.getElementById("settingsModal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }

  function saveSettings() {
    const w = Number(document.getElementById("weightInput").value || settings.weightKg);
    const cpk = Number(document.getElementById("calPerKgInput").value || settings.calPerKg);
    const ppk = Number(document.getElementById("protPerKgInput").value || settings.protPerKg);
    const fv = Number(document.getElementById("fvTargetInput").value || settings.fvTargetG);
    const water = Number(document.getElementById("waterTargetInput").value || settings.waterTargetMl);

    settings.weightKg = clamp(w, 20, 250);
    settings.calPerKg = clamp(cpk, 10, 60);
    settings.protPerKg = clamp(ppk, 0.5, 3.0);
    settings.fvTargetG = clamp(fv, 0, 2000);
    settings.waterTargetMl = clamp(water, 0, 6000);

    saveSettingsToLS();
    updateDashboard();
    closeSettings();
    toast(settings.lang==="en" ? "Saved ✅" : "已保存 ✅");
  }

  // ---------------------------
  // TCM modal
  // ---------------------------
  function openTCM() {
    const modal = document.getElementById("tcmModal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
  function closeTCM() {
    const modal = document.getElementById("tcmModal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }

  // ---------------------------
  // DB download / import (admin)
  // ---------------------------
  function downloadDB() {
    const db = loadDBCache() || foodDB;
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
    downloadBlob(blob, "fooddb.json");
  }

  function openImport() {
    const modal = document.getElementById("importModal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
  function closeImport() {
    const modal = document.getElementById("importModal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.getElementById("importFile").value = "";
  }

  async function importDB() {
    const input = document.getElementById("importFile");
    if (!input.files || !input.files[0]) {
      toast(settings.lang==="en" ? "Please select a JSON file." : "请先选择 JSON 文件。");
      return;
    }
    try {
      const text = await input.files[0].text();
      const incoming = JSON.parse(text);

      const base = loadDBCache() || foodDB;
      const map = new Map((base.items || []).map(x => [x.id, x]));
      for (const it of (incoming.items || [])) {
        if (!it.id) continue;
        map.set(it.id, { ...map.get(it.id), ...it });
      }
      const merged = { ...base, ...incoming, items: Array.from(map.values()) };
      setDBCache(merged);
      closeImport();
      toast(settings.lang==="en" ? "Imported ✅ (local cache updated)" : "已导入 ✅（仅更新本地缓存）");
      filterFoods();
    } catch (e) {
      console.error(e);
      toast(settings.lang==="en" ? "Import failed. Check JSON format." : "导入失败，请检查 JSON 格式。");
    }
  }

  // ---------------------------
  // Export day
  // ---------------------------
  function exportDay() {
    const payload = {
      date: today.date,
      settings: settings,
      targets: getTargets(),
      totals: today.stats,
      log: today.log
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    downloadBlob(blob, `pcare_${today.date}.json`);
  }

  function downloadBlob(blob, filename) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
  }

  // ---------------------------
  // Toast
  // ---------------------------
  let toastTimer = null;
  function toast(msg) {
    let el = document.getElementById("pcareToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "pcareToast";
      el.className = "fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-lg text-sm font-extrabold z-50";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.style.opacity = "0"; }, 1800);
  }

  // ---------------------------
  // Init
  // ---------------------------
  async function init() {
    // admin import button
    if (isAdmin()) document.getElementById("adminImportBtn").classList.remove("hidden");

    // language button
    document.getElementById("langToggleBtn").addEventListener("click", () => {
      settings.lang = settings.lang === "en" ? "zh" : "en";
      saveSettingsToLS();
      applyI18n();
      filterFoods();
      // re-render stages
      setStage("postop_early");
    });

    // Load DB
    await loadFoodDB();
    applyI18n();
    renderFoods(getDBItems());
    updateDashboard();
    setStage("postop_early");

    // default tab
    switchTab("home");
  }

  async function loadFoodDB() {
    // Prefer cache if user imported
    const cached = loadDBCache();
    if (cached?.items?.length) {
      foodDB = cached;
      return;
    }
    try {
      const res = await fetch("./fooddb.json", { cache: "no-store" });
      foodDB = await res.json();
    } catch (e) {
      console.error(e);
      foodDB = { items: [] };
    }
  }

  // Expose API
  return {
    init,
    switchTab,
    filterFoods,
    quickFilter,
    addFood,
    manualAdd,
    resetToday,
    askAI,
    googleSearch,
    openSettings,
    closeSettings,
    saveSettings,
    openTCM,
    closeTCM,
    downloadDB,
    openImport,
    closeImport,
    importDB,
    exportDay,
    setStage
  };
})();

window.PCare = PCare;
window.addEventListener("DOMContentLoaded", () => PCare.init());
