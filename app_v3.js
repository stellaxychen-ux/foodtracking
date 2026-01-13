
/* P‑Care v3 — single-file SPA (Home / Analysis / Evidence)
   Data files:
   - ./fooddb_v3.json
   - ./tcm_evidence_v1.json
   - ./aus_guidelines_v1.json
*/

const PCare = (() => {
  const LS = {
    settings: "pcare_settings_v3",
    logs: "pcare_logs_v3"   // { "YYYY-MM-DD": [{id, name, kcal, protein_g, ts}] }
  };

  const state = {
    evidenceFilter: { type: "all", evidence: "all" },
    lang: "en",
    foodDB: null,
    tcmDB: null,
    aus: null,
    settings: {
      weightKg: 60,
      profile: "adult_female",
      phase: "recovery",
      // helper targets (can be tuned later)
      calPerKg: 30,
      proteinPerKg: 1.5
    },
    todayKey: new Date().toISOString().slice(0,10),
    route: "home"
  };

  const i18n = {
    en: {
      subtitle: "Pancreatic nutrition + evidence library",
      navHome: "Home",
      navAnalysis: "Analysis",
      navEvidence: "Evidence",
      settingsTitle: "Personalize targets",
      settingsSub: "Set weight, phase, and guideline profile.",
      lblWeight: "Current weight (kg)",
      lblProfile: "Guideline profile",
      lblPhase: "Care phase",
      phaseHint: "Used for food recommendations (not a medical diagnosis).",
      settingsTip: "Targets here are estimation helpers. Clinical needs vary (symptoms, surgery type, enzymes, diabetes, etc.).",
      btnAskAI: "Ask AI Assistant",
      btnGoogle: "Search Web",
      searchPlaceholder: "Can I eat… (e.g., congee, banana, tofu)",
      dailyGoals: "Daily goals",
      target: "Target",
      calories: "Calories",
      protein: "Protein",
      addEat: "＋ Eat",
      avoid: "Avoid",
      notFound: "Not found in database.",
      notFoundHint: "Ask AI or search web for context (always verify with clinician).",
      recTitle: "Recommended foods & habits (by phase) ✨",
      recDisclaimer: "These are educational suggestions. Use symptoms & tolerance to guide choices.",
      analysisTitle: "Today’s intake snapshot 📊",
      weekTitle: "This week trend 📅",
      ausTitle: "Australian serving guide (quick reference) 🇦🇺",
      ausNote: "Serves are from a Chinese Healthy Eating Guide aligned with Australian Dietary Guidelines; choose profile in Settings.",
      evidenceTitle: "🌿 Evidence library (Integrative / TCM)",
      evidenceNote: "Educational only. Do not replace oncology care. Discuss any herbs/supplements with your team.",
      btnMore: "View details",
      btnTCM: "Integrative cautions",
      btnPhase: "Why this phase?",
      bannerTitle: "Safety note",
      bannerText: "This app is for education & tracking. It can’t diagnose or replace professional care. ✅ Sleep Well • ✅ Eat Well"
    },
    zh: {
      subtitle: "胰腺营养 + 证据库（中西结合）",
      navHome: "主页",
      navAnalysis: "分析",
      navEvidence: "证据库",
      settingsTitle: "个性化目标",
      settingsSub: "设置体重、阶段、推荐份量档案。",
      lblWeight: "当前体重（kg）",
      lblProfile: "推荐份量档案",
      lblPhase: "护理阶段",
      phaseHint: "用于生成饮食推荐（不是医学诊断）。",
      settingsTip: "这里的目标是估算工具。真实需求会随症状、手术类型、胰酶、糖代谢等变化。",
      btnAskAI: "🤖 问 AI",
      btnGoogle: "🔎 搜索",
      searchPlaceholder: "我可以吃…（例如：白粥、豆腐、山药）",
      dailyGoals: "每日目标",
      target: "目标",
      calories: "热量",
      protein: "蛋白质",
      addEat: "＋ 记录",
      avoid: "避免",
      notFound: "题库里没有找到。",
      notFoundHint: "可以用 AI 或 Google 查询作为参考（仍需与医生/营养师确认）。",
      recTitle: "不同阶段的推荐食物与习惯 ✨",
      recDisclaimer: "以下为健康教育建议；请结合症状与耐受度调整。",
      analysisTitle: "今日摄入概览 📊",
      weekTitle: "本周趋势 📅",
      ausTitle: "澳洲每日推荐份量（速查）🇦🇺",
      ausNote: "份量来自与澳洲膳食指南一致的中文健康饮食手册；可在设置中切换档案。",
      evidenceTitle: "🌿 证据库（中西医/中医）",
      evidenceNote: "仅供健康教育。任何中药/补充剂请与肿瘤科/药师确认相互作用。",
      btnMore: "查看详情",
      btnTCM: "中西医注意事项",
      btnPhase: "为什么是这个阶段？",
      bannerTitle: "安全提示",
      bannerText: "本工具用于健康教育与记录，不可替代医生/营养师的诊疗。✅ 少量多餐 • ✅ 低脂更友好 • ✅ 每口慢一点"
    }
  };

  const $ = (id) => document.getElementById(id);

  function t(key){ return (i18n[state.lang] && i18n[state.lang][key]) || key; }

  function setLang(lang){
    state.lang = lang;
    $("langBtnLabel").textContent = (lang === "en") ? "中文" : "EN";
    $("subtitle").textContent = t("subtitle");
    $("navHome").textContent = t("navHome");
    $("navAnalysis").textContent = t("navAnalysis");
    $("navEvidence").textContent = t("navEvidence");
    $("settingsTitle").textContent = t("settingsTitle");
    $("settingsSub").textContent = t("settingsSub");
    $("lblWeight").textContent = t("lblWeight");
    $("lblProfile").textContent = t("lblProfile");
    $("lblPhase").textContent = t("lblPhase");
    $("phaseHint").textContent = t("phaseHint");
    $("settingsTip").textContent = t("settingsTip");
    $("bannerTitle").textContent = t("bannerTitle");
    $("bannerText").textContent = t("bannerText");
    // rerender current route
    render();
  }

  function showBanner(){
    $("banner").classList.remove("hidden");
  }
  function hideBanner(){
    $("banner").classList.add("hidden");
  }

  function openSettings(){ $("settingsModal").classList.remove("hidden"); $("settingsModal").classList.add("flex"); }
  function closeSettings(){ $("settingsModal").classList.add("hidden"); $("settingsModal").classList.remove("flex"); }

  function loadSettings(){
    try{
      const raw = localStorage.getItem(LS.settings);
      if(raw){
        const s = JSON.parse(raw);
        state.settings = {...state.settings, ...s};
      }
    }catch(e){}
    $("weightInput").value = state.settings.weightKg;
    $("profileSelect").value = state.settings.profile;
    $("phaseSelect").value = state.settings.phase;
  }

  function saveSettings(){
    const w = parseFloat($("weightInput").value || "0");
    if(w>0) state.settings.weightKg = w;
    state.settings.profile = $("profileSelect").value;
    state.settings.phase = $("phaseSelect").value;
    localStorage.setItem(LS.settings, JSON.stringify(state.settings));
    closeSettings();
    render();
  }

  function getLogs(){
    try { return JSON.parse(localStorage.getItem(LS.logs) || "{}"); }
    catch(e){ return {}; }
  }
  function setLogs(obj){
    localStorage.setItem(LS.logs, JSON.stringify(obj));
  }
  function getTodayEntries(){
    const logs = getLogs();
    return logs[state.todayKey] || [];
  }
  function addLog(entry){
    const logs = getLogs();
    logs[state.todayKey] = logs[state.todayKey] || [];
    logs[state.todayKey].push(entry);
    setLogs(logs);
  }
  function clearToday(){
    const logs = getLogs();
    delete logs[state.todayKey];
    setLogs(logs);
    render();
  }

  function sumToday(){
    const items = getTodayEntries();
    return items.reduce((acc,it)=>({
      kcal: acc.kcal + (it.kcal||0),
      protein: acc.protein + (it.protein_g||0)
    }), {kcal:0, protein:0});
  }

  function targets(){
    const calTarget = Math.round(state.settings.weightKg * state.settings.calPerKg);
    const protTarget = Math.round(state.settings.weightKg * state.settings.proteinPerKg);
    return { calTarget, protTarget };
  }

  function pct(n, d){
    if(!d) return 0;
    return Math.min(100, Math.max(0, Math.round((n/d)*100)));
  }

  function statusIcon(status){
    if(status==="safe") return '<i class="fa-solid fa-circle-check text-brand-600"></i>';
    if(status==="caution") return '<i class="fa-solid fa-circle-exclamation text-amber-500"></i>';
    if(status==="avoid") return '<i class="fa-solid fa-circle-xmark text-red-500"></i>';
    return '<i class="fa-solid fa-circle-info text-blue-500"></i>';
  }

  function foodName(food){
    return state.lang==="zh" ? (food.name?.zh || food.name?.en) : (food.name?.en || food.name?.zh);
  }

  function foodNote(food){
    return state.lang==="zh" ? (food.note?.zh || food.note?.en || "") : (food.note?.en || food.note?.zh || "");
  }

  function matchesQuery(food, q){
    if(!q) return true;
    const s = q.toLowerCase();
    const names = [
      food.name?.en, food.name?.zh,
      ...(food.aliases||[])
    ].filter(Boolean).join(" ").toLowerCase();
    return names.includes(s);
  }

  function filterFoods(q){
    const list = state.foodDB?.foods || [];
    return list.filter(f => matchesQuery(f, q));
  }

  function askAI(query){
    const q = (query || "").trim();
    const userPhase = state.settings.phase;
    const promptZh = `我是胰腺癌患者/术后患者，当前阶段：${userPhase}。我想了解“${q || "这个食物/食材"}”是否适合我。请参考循证营养原则（少量多餐、优先高蛋白、根据脂肪耐受调整、必要时胰酶/ONS等），并给出风险点与替代方案。`;
    const promptEn = `I am a pancreatic cancer patient / post-op patient. My current phase is: ${userPhase}. Is "${q || "this food"}" suitable? Please use evidence-based nutrition principles (small frequent meals, prioritize protein, adjust fat to tolerance, consider enzymes/ONS as appropriate) and provide risks + alternatives.`;
    const prompt = (state.lang==="zh") ? promptZh : promptEn;
    window.open(`https://chatgpt.com/?q=${encodeURIComponent(prompt)}`, "_blank");
  }

  function googleSearch(query){
    const q = (query || "").trim();
    const prefix = (state.lang==="zh") ? "胰腺癌 饮食 是否可以吃 " : "pancreatic cancer diet can I eat ";
    window.open(`https://www.google.com/search?q=${encodeURIComponent(prefix + (q||""))}`, "_blank");
  }

  function openModal(title, html){
    $("modalTitle").textContent = title;
    $("modalBody").innerHTML = html;
    $("modal").classList.remove("hidden");
    $("modal").classList.add("flex");
  }
  function closeModal(){
    $("modal").classList.add("hidden");
    $("modal").classList.remove("flex");
  }

  function phaseCopy(phase){
    const zh = {
      postop: {
        title:"术后早期（数周内）",
        bullets:[
          "目标：少量多餐、补充蛋白与热量，选择易消化、低纤维、低脂的食物。",
          "优先：白粥/米饭/白面、嫩肉/鱼/禽、鸡蛋、豆腐、熟软蔬菜。",
          "避免：油炸、高脂、全谷高纤维、可能胀气的蔬菜（先少量尝试）。"
        ]
      },
      chemo: {
        title:"放化疗期间",
        bullets:[
          "目标：把“能吃进去”放在第一位，优先蛋白质与能量密度；对恶心/口腔溃疡做食物调整。",
          "优先：温热软食、清淡高蛋白（蒸蛋、鱼、豆腐、肉粥），必要时使用ONS。",
          "注意：腹泻时暂时降低乳糖/脂肪/纤维；反酸/口腔溃疡时减少辛辣酸味。"
        ]
      },
      recovery: {
        title:"恢复/稳定期",
        bullets:[
          "目标：逐步回到均衡饮食结构；在耐受前提下增加蔬果与全谷。",
          "优先：优质蛋白 + 多色熟蔬菜 + 适量全谷；规律补水。",
          "注意：脂肪耐受不佳/脂肪泻时仍需控制油脂并与医生讨论胰酶。"
        ]
      },
      diarrhea: {
        title:"腹泻/脂肪泻重点",
        bullets:[
          "目标：先把症状控制住：低脂、低纤维、少量多餐，观察触发食物。",
          "优先：白粥、清汤面、土豆/南瓜（煮软）、蒸蛋、鱼、豆腐。",
          "避免：油炸、肥肉、奶油甜点、碳酸、辛辣；必要时与医生讨论胰酶/补液。"
        ]
      }
    };

    const en = {
      postop: {
        title:"Post-op early (first weeks)",
        bullets:[
          "Goal: small frequent meals; re-build protein/energy with easy-to-digest, lower fiber, lower fat foods.",
          "Prioritize: rice/congee, refined grains, tender poultry/fish, eggs, tofu, soft cooked veg.",
          "Limit: fried/high-fat, high-fiber whole grains, and gas-producing veg (trial small portions)."
        ]
      },
      chemo: {
        title:"During chemo/radiation",
        bullets:[
          "Goal: intake first—then quality. Prioritize protein + energy density; adjust for nausea/mouth sores.",
          "Prioritize: warm soft foods, gentle protein (steamed egg, fish, tofu, congee), consider ONS if needed.",
          "Watch: diarrhea → reduce lactose/fat/fiber temporarily; reflux/mucositis → avoid spicy/acidic."
        ]
      },
      recovery: {
        title:"Recovery / stable",
        bullets:[
          "Goal: gradually return to balanced pattern; increase fruit/veg/whole grains as tolerated.",
          "Prioritize: quality protein + colorful cooked veg + moderate whole grains; hydrate consistently.",
          "Watch: fat intolerance/steatorrhea → limit added oils and discuss enzymes with clinician."
        ]
      },
      diarrhea: {
        title:"Diarrhea / steatorrhea focus",
        bullets:[
          "Goal: symptom control first: low fat, lower fiber, small frequent meals, identify triggers.",
          "Prioritize: congee, plain noodles, potato/pumpkin (very soft), steamed egg, fish, tofu.",
          "Avoid: fried, fatty meats, creamy desserts, carbonated drinks, spicy; discuss enzymes/fluids if severe."
        ]
      }
    };

    return (state.lang==="zh" ? zh : en)[phase] || (state.lang==="zh" ? zh.recovery : en.recovery);
  }

  function renderHome(){
    const view = $("view-home");
    const { calTarget, protTarget } = targets();
    const totals = sumToday();
    const calPct = pct(totals.kcal, calTarget);
    const protPct = pct(totals.protein, protTarget);

    const phase = state.settings.phase;
    const phaseInfo = phaseCopy(phase);

    view.innerHTML = `
      <div class="grid lg:grid-cols-3 gap-4">
        <!-- Daily goals -->
        <div class="card p-5 lg:col-span-2">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-extrabold text-slate-900">${t("dailyGoals")} 🎯</h2>
              <p class="text-xs text-slate-500 mt-1">${t("target")}: <span class="font-bold text-brand-700">${state.settings.weightKg}</span> kg · <span class="font-bold">${phaseInfo.title}</span></p>
            </div>
            <button class="btn-ghost px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50" onclick="PCare.go('#analysis')">📊</button>
          </div>

          <div class="mt-4 space-y-4">
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-slate-600"><i class="fa-solid fa-fire text-orange-400 mr-2"></i>${t("calories")}</span>
                <span class="font-extrabold text-slate-900">${totals.kcal} / ${calTarget} kcal</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div class="bg-orange-400 h-3 rounded-full" style="width:${calPct}%"></div>
              </div>
              <p class="text-xs text-slate-500 mt-2">🍚 ${calPct}%</p>
            </div>

            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-slate-600"><i class="fa-solid fa-drumstick-bite text-brand-600 mr-2"></i>${t("protein")}</span>
                <span class="font-extrabold text-slate-900">${Math.round(totals.protein)} / ${protTarget} g</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div class="bg-brand-600 h-3 rounded-full" style="width:${protPct}%"></div>
              </div>
              <p class="text-xs text-slate-500 mt-2">🥚 ${protPct}%</p>
            </div>

            <div class="flex gap-2">
              <button class="btn-ghost px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50" onclick="PCare.clearToday()">
                🧹 ${state.lang==="zh"?"清空今天":"Clear today"}
              </button>
              <button class="btn-ghost px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50" onclick="PCare.showSafety()">
                🛡️ ${state.lang==="zh"?"安全提示":"Safety"}
              </button>
            </div>
          </div>
        </div>

        <!-- Phase card -->
        <div class="card p-5">
          <div class="flex items-start justify-between gap-3">
            <h3 class="text-base font-extrabold text-slate-900">${t("recTitle")}</h3>
            <button class="btn-ghost px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50" onclick="PCare.openPhaseExplain()">${t("btnPhase")}</button>
          </div>
          <p class="text-xs text-slate-500 mt-2">${t("recDisclaimer")}</p>
          <ul class="mt-3 space-y-2 text-sm text-slate-700">
            ${phaseInfo.bullets.map(b=>`<li class="flex gap-2"><span class="mt-[2px]">✅</span><span>${b}</span></li>`).join("")}
          </ul>
        </div>
      </div>

      <!-- Actions -->
      <div class="grid sm:grid-cols-2 gap-3">
        <button onclick="PCare.askAI(document.getElementById('foodSearch').value)" class="btn-brand py-3 rounded-2xl shadow-md font-extrabold flex items-center justify-center gap-2">
          ${t("btnAskAI")}
        </button>
        <button onclick="PCare.googleSearch(document.getElementById('foodSearch').value)" class="btn-ghost py-3 rounded-2xl shadow-md font-extrabold text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50">
          ${t("btnGoogle")}
        </button>
      </div>

      <!-- Search -->
      <div class="card p-5">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-base font-extrabold text-slate-900">${state.lang==="zh"?"食物安全查询 🧾":"Food safety lookup 🧾"}</h3>
          <span class="pill bg-brand-50 text-brand-700 border border-brand-100">${(state.foodDB?.foods?.length||0)} ${state.lang==="zh"?"条":"items"}</span>
        </div>

        <div class="relative mt-4">
          <input type="text" id="foodSearch" placeholder="${t("searchPlaceholder")}"
                 class="w-full p-4 rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-brand-200 outline-none"
                 oninput="PCare.onSearch(this.value)" />
          <div class="absolute right-3 top-3 flex gap-2">
            <span class="kbd">/</span>
            <button class="btn-ghost px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50" onclick="PCare.onSearch(document.getElementById('foodSearch').value)">🔍</button>
          </div>
        </div>

        <div id="foodList" class="mt-4 space-y-3"></div>

        <div id="notFound" class="hidden text-center p-8 text-slate-500">
          <p class="mb-2 font-bold">${t("notFound")}</p>
          <p class="text-sm mb-4">${t("notFoundHint")}</p>
          <div class="flex gap-2 justify-center">
            <button onclick="PCare.askAI(document.getElementById('foodSearch').value)" class="btn-brand px-4 py-2 rounded-2xl font-extrabold">🤖 AI</button>
            <button onclick="PCare.googleSearch(document.getElementById('foodSearch').value)" class="btn-ghost px-4 py-2 rounded-2xl font-extrabold text-slate-700 hover:bg-slate-50">🔎 Google</button>
          </div>
        </div>
      </div>
    `;

    
    // Manual Add (HOME only)
    view.insertAdjacentHTML("beforeend", manualAddHTML());
    bindManualAdd();
// default render list
    renderFoodList(filterFoods(""));
  }

  function renderFoodList(list){
    const container = $("foodList");
    container.innerHTML = "";

    if(!list || list.length===0){
      $("notFound").classList.remove("hidden");
      return;
    }
    $("notFound").classList.add("hidden");

    list.slice(0, 60).forEach(food => {
      const status = food.status || "info";
      const kcal = food.nutr?.kcal ?? 0;
      const prot = food.nutr?.protein_g ?? 0;

      const canAdd = (status !== "avoid");
      const addBtn = canAdd
        ? `<button class="btn-ghost px-3 py-2 rounded-xl text-sm font-extrabold text-slate-700 hover:bg-slate-50"
                   onclick="PCare.addFood('${food.id}')">${t("addEat")}</button>`
        : `<span class="pill bg-red-50 text-red-700 border border-red-100 font-extrabold">${t("avoid")} 🚫</span>`;

      const phaseMatch = (food.phases||[]).includes(state.settings.phase) || (food.phases||[]).includes("all");
      const badge = phaseMatch
        ? `<span class="pill bg-brand-50 text-brand-700 border border-brand-100 font-extrabold">${state.lang==="zh"?"当前阶段推荐":"Phase-friendly"} ✨</span>`
        : "";

      const tags = (food.tags||[]).slice(0,3).map(x=>`<span class="pill bg-slate-50 text-slate-600 border border-slate-200">${x}</span>`).join("");

      const html = document.createElement("div");
      html.className = `card food-item ${status} p-4 flex gap-3 items-start`;
      html.innerHTML = `
        <div class="mt-1 text-lg">${statusIcon(status)}</div>
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h4 class="font-extrabold text-slate-900 truncate">${foodName(food)}</h4>
            ${badge}
          </div>
          <p class="text-xs text-slate-600 mt-1">${foodNote(food)}</p>
          <div class="mt-2 flex flex-wrap gap-2 items-center">
            <span class="pill bg-white/60 border border-slate-200">🔥 ${kcal} kcal</span>
            <span class="pill bg-white/60 border border-slate-200">🥩 ${prot} g</span>
            ${tags}
          </div>
        </div>
        <div class="shrink-0">${addBtn}</div>
      `;
      container.appendChild(html);
    });
  }

  function addFood(foodId){
    const f = (state.foodDB?.foods || []).find(x => x.id === foodId);
    if(!f) return;
    addLog({
      id: f.id,
      name: f.name,
      kcal: f.nutr?.kcal ?? 0,
      protein_g: f.nutr?.protein_g ?? 0,
      ts: Date.now()
    });
    // small toast via banner
    const nm = foodName(f);
    $("bannerTitle").textContent = state.lang==="zh" ? "已记录 ✅" : "Added ✅";
    $("bannerText").textContent = state.lang==="zh"
      ? `已将「${nm}」加入今日记录。`
      : `Added "${nm}" to today.`;
    showBanner();
    render();
  }

  function onSearch(q){
    renderFoodList(filterFoods(q));
  }

  function renderAnalysis(){
    const view = $("view-analysis");
    const { calTarget, protTarget } = targets();
    const totals = sumToday();

    const entries = getTodayEntries().slice().reverse();
    const dayRows = entries.slice(0,12).map(it => {
      const nm = (state.lang==="zh") ? (it.name?.zh || it.name?.en) : (it.name?.en || it.name?.zh);
      return `<div class="flex items-center justify-between py-2 border-b border-slate-100">
        <div class="min-w-0">
          <div class="font-bold text-slate-900 truncate">${nm}</div>
          <div class="text-xs text-slate-500">${new Date(it.ts).toLocaleTimeString()}</div>
        </div>
        <div class="text-right text-sm font-extrabold text-slate-900">
          <div>🔥 ${it.kcal}</div>
          <div class="text-brand-700">🥩 ${Math.round(it.protein_g||0)}</div>
        </div>
      </div>`;
    }).join("");

    // week aggregate
    const logs = getLogs();
    const keys = Object.keys(logs).sort().slice(-7);
    const week = keys.map(k => {
      const sum = (logs[k]||[]).reduce((a,it)=>({kcal:a.kcal+(it.kcal||0), protein:a.protein+(it.protein_g||0)}), {kcal:0, protein:0});
      return {date:k, ...sum};
    });

    const weekBars = week.map(d => {
      const c = pct(d.kcal, calTarget);
      const p = pct(d.protein, protTarget);
      return `<div class="flex items-center gap-3 py-2">
        <div class="w-24 text-xs text-slate-500">${d.date.slice(5)}</div>
        <div class="flex-1">
          <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div class="bg-orange-400 h-2 rounded-full" style="width:${c}%"></div>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1">
            <div class="bg-brand-600 h-2 rounded-full" style="width:${p}%"></div>
          </div>
        </div>
        <div class="w-14 text-xs text-slate-500 text-right">${c}%/${p}%</div>
      </div>`;
    }).join("");

    // AU serves
    const profile = state.settings.profile;
    const au = state.aus?.servings?.[profile];
    const defs = state.aus?.serve_definitions || {};
    const auHtml = au ? `
      <div class="grid sm:grid-cols-2 gap-3 mt-3">
        <div class="p-4 rounded-2xl bg-brand-50 border border-brand-100">
          <div class="font-extrabold text-slate-900">${state.lang==="zh"?"蔬菜豆类":"Vegetables & legumes"}</div>
          <div class="text-2xl font-extrabold text-brand-700 mt-1">${au.vegetables_legumes_serves_per_day} <span class="text-sm text-slate-500">${state.lang==="zh"?"份/天":"serves/day"}</span></div>
          <div class="text-xs text-slate-600 mt-2">${defs.vegetables_legumes || ""}</div>
        </div>
        <div class="p-4 rounded-2xl bg-brand-50 border border-brand-100">
          <div class="font-extrabold text-slate-900">${state.lang==="zh"?"水果":"Fruit"}</div>
          <div class="text-2xl font-extrabold text-brand-700 mt-1">${au.fruit_serves_per_day} <span class="text-sm text-slate-500">${state.lang==="zh"?"份/天":"serves/day"}</span></div>
          <div class="text-xs text-slate-600 mt-2">${defs.fruit || ""}</div>
        </div>
        <div class="p-4 rounded-2xl bg-brand-50 border border-brand-100">
          <div class="font-extrabold text-slate-900">${state.lang==="zh"?"谷物主食":"Grains"}</div>
          <div class="text-2xl font-extrabold text-brand-700 mt-1">${au.grains_serves_per_day} <span class="text-sm text-slate-500">${state.lang==="zh"?"份/天":"serves/day"}</span></div>
          <div class="text-xs text-slate-600 mt-2">${defs.grains || ""}</div>
        </div>
        <div class="p-4 rounded-2xl bg-brand-50 border border-brand-100">
          <div class="font-extrabold text-slate-900">${state.lang==="zh"?"瘦肉/蛋/豆/鱼":"Lean protein foods"}</div>
          <div class="text-2xl font-extrabold text-brand-700 mt-1">${au.lean_meat_alt_serves_per_day} <span class="text-sm text-slate-500">${state.lang==="zh"?"份/天":"serves/day"}</span></div>
          <div class="text-xs text-slate-600 mt-2">${defs.lean_meat_alt || ""}</div>
        </div>
        <div class="p-4 rounded-2xl bg-brand-50 border border-brand-100">
          <div class="font-extrabold text-slate-900">${state.lang==="zh"?"奶制品/替代品":"Dairy/alternatives"}</div>
          <div class="text-2xl font-extrabold text-brand-700 mt-1">${au.dairy_alt_serves_per_day} <span class="text-sm text-slate-500">${state.lang==="zh"?"份/天":"serves/day"}</span></div>
          <div class="text-xs text-slate-600 mt-2">${defs.dairy_alt || ""}</div>
        </div>
        <div class="p-4 rounded-2xl bg-brand-50 border border-brand-100">
          <div class="font-extrabold text-slate-900">${state.lang==="zh"?"饮水":"Water"}</div>
          <div class="text-2xl font-extrabold text-brand-700 mt-1">${au.water_l_per_day} <span class="text-sm text-slate-500">L/${state.lang==="zh"?"天":"day"}</span></div>
          <div class="text-xs text-slate-600 mt-2">${state.lang==="zh"?"（按手册列示）":"(as listed in guide)"}</div>
        </div>
      </div>
    ` : `<p class="text-sm text-slate-600 mt-2">${state.lang==="zh"?"未加载到澳洲份量数据。":"AU serving data not loaded."}</p>`;

    view.innerHTML = `
      <div class="card p-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-extrabold text-slate-900">${t("analysisTitle")}</h2>
            <p class="text-xs text-slate-500 mt-1">${state.todayKey} · ${state.lang==="zh"?"目标按体重估算":"Targets estimated by weight"} (${state.settings.weightKg}kg)</p>
          </div>
          <button class="btn-ghost px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50" onclick="PCare.go('#home')">🍽️</button>
        </div>

        <div class="grid sm:grid-cols-2 gap-4 mt-4">
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div class="font-extrabold text-slate-900">🔥 ${t("calories")}</div>
            <div class="text-3xl font-extrabold text-slate-900 mt-1">${totals.kcal}</div>
            <div class="text-sm text-slate-500">${state.lang==="zh"?"目标":"Target"} ${calTarget} kcal · ${pct(totals.kcal, calTarget)}%</div>
          </div>
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div class="font-extrabold text-slate-900">🥩 ${t("protein")}</div>
            <div class="text-3xl font-extrabold text-brand-700 mt-1">${Math.round(totals.protein)}</div>
            <div class="text-sm text-slate-500">${state.lang==="zh"?"目标":"Target"} ${protTarget} g · ${pct(totals.protein, protTarget)}%</div>
          </div>
        </div>

        <div class="mt-5">
          <div class="flex items-center justify-between">
            <div class="font-extrabold text-slate-900">${state.lang==="zh"?"今日记录":"Today log"}</div>
            <button class="btn-ghost px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50" onclick="PCare.clearToday()">🧹 ${state.lang==="zh"?"清空":"Clear"}</button>
          </div>
          <div class="mt-2">${dayRows || `<div class="text-sm text-slate-500 py-6 text-center">${state.lang==="zh"?"今天还没有记录～":"No entries yet 🙂"}</div>`}</div>
          ${entries.length>12 ? `<div class="text-xs text-slate-400 mt-2">${state.lang==="zh"?"仅显示最近12条":"Showing latest 12 items"}</div>`:""}
        </div>
      </div>

      <div class="card p-5">
        <h3 class="text-base font-extrabold text-slate-900">${t("weekTitle")}</h3>
        <p class="text-xs text-slate-500 mt-1">${state.lang==="zh"?"橙色=热量，绿色=蛋白":"Orange=Calories, Green=Protein"} · ${state.lang==="zh"?"按同一目标百分比":"Percent vs same targets"}</p>
        <div class="mt-3">${weekBars || `<div class="text-sm text-slate-500 py-6 text-center">${state.lang==="zh"?"暂无数据":"No data yet"}</div>`}</div>
      </div>

      <div class="card p-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-extrabold text-slate-900">${t("ausTitle")}</h3>
            <p class="text-xs text-slate-500 mt-1">${t("ausNote")}</p>
          </div>
          <button class="btn-ghost px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50" onclick="PCare.openSettings()">⚙️</button>
        </div>
        ${auHtml}
      </div>
    `;
  }

  function renderEvidence(){
    const view = $("view-evidence");
    let entries = state.tcmDB?.entries || [];
    const types = Array.from(new Set(entries.map(e=>e.type))).sort();
    const evs = Array.from(new Set(entries.map(e=>e.evidence_level||""))).filter(Boolean).sort();
    const fType = state.evidenceFilter.type;
    const fEv = state.evidenceFilter.evidence;
    entries = entries.filter(e => (fType==="all"||e.type===fType) && (fEv==="all"|| (e.evidence_level||"")===fEv));
    view.innerHTML = `
      <div class="card p-5">
        <h2 class="text-lg font-extrabold text-slate-900">${t("evidenceTitle")}</h2>
        <p class="text-sm text-slate-600 mt-2">${t("evidenceNote")}</p>
        <div class="mt-4 flex flex-wrap gap-2">
          <button class="btn-brand px-4 py-2 rounded-2xl font-extrabold" onclick="PCare.openIntegrativeCautions()">${t("btnTCM")} ⚠️</button>
          <button class="btn-ghost px-4 py-2 rounded-2xl font-extrabold text-slate-700 hover:bg-slate-50" onclick="PCare.askAI('中药 与 化疗 相互作用 需要注意什么')">🤖 ${state.lang==="zh"?"问AI":"Ask AI"}</button>
        </div>
        <div class="mt-4 grid sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">${state.lang==="zh"?"分类":"Type"}</label>
            <select id="evTypeSelect" class="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-200 outline-none">
              <option value="all">${state.lang==="zh"?"全部":"All"}</option>
              $${types.map(t=>`<option value="${t}" ${state.evidenceFilter.type===t?"selected":""}>${t}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">${state.lang==="zh"?"证据等级":"Evidence"}</label>
            <select id="evLevelSelect" class="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-200 outline-none">
              <option value="all">${state.lang==="zh"?"全部":"All"}</option>
              $${evs.map(v=>`<option value="${v}" ${state.evidenceFilter.evidence===v?"selected":""}>${v}</option>`).join("")}
            </select>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-4">
        ${entries.map(e => `
          <div class="card p-5">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-base font-extrabold text-slate-900">${state.lang==="zh" ? (e.title?.zh || e.title?.en) : (e.title?.en || e.title?.zh)}</h3>
                <div class="mt-2 flex flex-wrap gap-2">
                  <span class="pill bg-slate-50 text-slate-600 border border-slate-200">${e.type}</span>
                  <span class="pill bg-brand-50 text-brand-700 border border-brand-100">${e.evidence_level || "evidence"}</span>
                </div>
              </div>
              <button class="btn-ghost px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50" onclick="PCare.openEvidence('${e.id}')">${t("btnMore")} ➜</button>
            </div>
            <p class="text-sm text-slate-700 mt-3">${state.lang==="zh" ? (e.summary?.zh || e.summary?.en || "") : (e.summary?.en || e.summary?.zh || "")}</p>
          </div>
        `).join("")}
      </div>

      <div class="card p-5">
        <h3 class="text-base font-extrabold text-slate-900">${state.lang==="zh"?"如何扩充证据库？":"How to expand the library?"}</h3>
        <p class="text-sm text-slate-600 mt-2">
          ${state.lang==="zh"
            ? "把新的文献要点整理成 JSON 条目（证据等级、适用场景、风险提示、关键结论），追加到 <span class='font-mono'>tcm_evidence_v1.json</span> 即可。"
            : "Add structured entries (evidence level, scenario, risks, key conclusions) into <span class='font-mono'>tcm_evidence_v1.json</span>."
          }
        </p>
      </div>
    `;
  
    // bind evidence filter controls
    setTimeout(bindEvidenceFilters, 0);
}

  function openEvidence(id){
    const e = (state.tcmDB?.entries || []).find(x => x.id === id);
    if(!e) return;

    const title = state.lang==="zh" ? (e.title?.zh || e.title?.en) : (e.title?.en || e.title?.zh);

    const blocks = [];
    if(e.summary) blocks.push(`<p class="mb-3"><span class="font-extrabold">${state.lang==="zh"?"概述":"Summary"}:</span> ${state.lang==="zh" ? (e.summary.zh || e.summary.en) : (e.summary.en || e.summary.zh)}</p>`);
    if(e.key_points?.length){
      blocks.push(`<div class="mb-3"><div class="font-extrabold mb-2">${state.lang==="zh"?"要点":"Key points"}:</div><ul class="space-y-2">${e.key_points.map(k=>`<li class="flex gap-2"><span>•</span><span>${state.lang==="zh" ? (k.zh||k.en) : (k.en||k.zh)}</span></li>`).join("")}</ul></div>`);
    }
    if(e.items?.length){
      blocks.push(`<div class="mb-3"><div class="font-extrabold mb-2">${state.lang==="zh"?"条目":"Items"}:</div>${e.items.map(it=>`
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-2">
          <div class="font-extrabold text-slate-900">${state.lang==="zh"?(it.pattern?.zh||it.pattern?.en):(it.pattern?.en||it.pattern?.zh)}</div>
          <div class="text-sm text-slate-700 mt-1">${state.lang==="zh"?"治法":"Principle"}: ${state.lang==="zh"?(it.principle?.zh||it.principle?.en):(it.principle?.en||it.principle?.zh)}</div>
          <div class="text-sm text-slate-700 mt-1">${state.lang==="zh"?"方药":"Formula"}: ${state.lang==="zh"?(it.formula?.zh||it.formula?.en):(it.formula?.en||it.formula?.zh)}</div>
          ${it.notes?`<div class="text-xs text-slate-500 mt-2">${state.lang==="zh"?(it.notes.zh||it.notes.en):(it.notes.en||it.notes.zh)}</div>`:""}
        </div>
      `).join("")}</div>`);
    }
    if(e.examples?.length){
      blocks.push(`<div class="mb-3"><div class="font-extrabold mb-2">${state.lang==="zh"?"研究示例":"Examples"}:</div><ul class="space-y-2">${e.examples.map(x=>`<li class="flex gap-2"><span>🧪</span><span>${state.lang==="zh" ? (x.zh||x.en) : (x.en||x.zh)}</span></li>`).join("")}</ul></div>`);
    }
    if(e.safety?.length){
      blocks.push(`<div class="p-4 rounded-2xl bg-amber-50 border border-amber-100">
        <div class="font-extrabold text-amber-900 mb-2">⚠️ ${state.lang==="zh"?"风险提示":"Safety"}</div>
        <ul class="space-y-2">${e.safety.map(s=>`<li class="flex gap-2"><span>•</span><span>${state.lang==="zh" ? (s.zh||s.en) : (s.en||s.zh)}</span></li>`).join("")}</ul>
      </div>`);
    }

    const refs = (e.source_refs||[]).map(r=>`<span class="pill bg-white border border-slate-200 text-slate-600">${r.label}</span>`).join(" ");

    blocks.push(`<div class="mt-4 text-xs text-slate-500">${state.lang==="zh"?"证据等级":"Evidence"}: <span class="font-bold">${e.evidence_level||""}</span></div>`);
    if(refs) blocks.push(`<div class="mt-2 text-xs text-slate-500">${state.lang==="zh"?"来源":"Sources"}: ${refs}</div>`);

    openModal(title, blocks.join(""));
  }

  function openIntegrativeCautions(){
    const title = state.lang==="zh" ? "中西医结合：关键注意事项 ⚠️" : "Integrative care: key cautions ⚠️";
    const html = `
      <div class="space-y-3">
        <div class="p-4 rounded-2xl bg-amber-50 border border-amber-100">
          <div class="font-extrabold text-amber-900 mb-2">${state.lang==="zh"?"1) 相互作用":"1) Interactions"}</div>
          <p>${state.lang==="zh"
            ? "化疗/靶向/免疫治疗期间，任何中药、保健品都可能与药物代谢/凝血/肝肾功能产生相互作用。请把“所有在吃的东西”列清单给肿瘤科医生或药师核对。"
            : "During chemo/targeted/immunotherapy, herbs/supplements may interact with drug metabolism, coagulation, or liver/kidney function. List everything for oncology/pharmacy review."
          }</p>
        </div>

        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div class="font-extrabold text-slate-900 mb-2">${state.lang==="zh"?"2) 不延误标准治疗":"2) Don’t delay standard care"}</div>
          <p>${state.lang==="zh"
            ? "证据库里会同时标注证据等级。即使有“改善KPS/有效率”的研究摘要，也需要逐条核对原研究设计与质量，不能替代标准方案。"
            : "Entries include evidence level. Even when summaries report improved KPS/response, verify original study quality and don’t substitute standard therapy."
          }</p>
        </div>

        <div class="p-4 rounded-2xl bg-brand-50 border border-brand-100">
          <div class="font-extrabold text-slate-900 mb-2">${state.lang==="zh"?"3) 期间策略":"3) Timing strategy"}</div>
          <p>${state.lang==="zh"
            ? "一些资料建议：化疗前可在中医师指导下“扶正调理”，化疗期间优先针灸等非药物方式减轻不适以减少冲突，化疗后再中药调理。"
            : "Some sources suggest: pre-chemo conditioning under TCM supervision; during chemo prefer non-herbal approaches like acupuncture to reduce conflict; resume herbs post-chemo."
          }</p>
        </div>
      </div>
    `;
    openModal(title, html);
  }

  function openPhaseExplain(){
    const phase = phaseCopy(state.settings.phase);
    const title = state.lang==="zh" ? `阶段说明：${phase.title}` : `Phase notes: ${phase.title}`;
    const html = `
      <div class="space-y-3">
        <p>${state.lang==="zh"
          ? "这是一个“饮食策略模板”，用来帮助你快速找到更可能耐受的食物组合；并不是医学分期。"
          : "This is a dietary strategy template to help you find more tolerable choices; it’s not a medical staging."
        }</p>
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div class="font-extrabold mb-2">${state.lang==="zh"?"建议要点":"Key tips"}</div>
          <ul class="space-y-2">${phase.bullets.map(b=>`<li class="flex gap-2"><span>•</span><span>${b}</span></li>`).join("")}</ul>
        </div>
      </div>
    `;
    openModal(title, html);
  }

  function showSafety(){
    $("bannerTitle").textContent = t("bannerTitle");
    $("bannerText").textContent = t("bannerText");
    showBanner();
  }

  function setActiveTab(){
    const tabs = ["home","analysis","evidence"];
    tabs.forEach(x => {
      const el = document.getElementById(`tab-${x}`);
      if(!el) return;
      if(state.route === x) el.classList.add("nav-active");
      else el.classList.remove("nav-active");
    });
  }

  function showView(route){
    ["home","analysis","evidence"].forEach(r => {
      const v = document.getElementById(`view-${r}`);
      if(!v) return;
      v.classList.toggle("hidden", r !== route);
    });
  }

  function render(){
    setActiveTab();
    showView(state.route);
    if(state.route === "home") renderHome();
    if(state.route === "analysis") renderAnalysis();
    if(state.route === "evidence") renderEvidence();
  }

  function go(hash){
    window.location.hash = hash;
  }

  function onRoute(){
    const h = (window.location.hash || "#home").replace("#","");
    state.route = ["home","analysis","evidence"].includes(h) ? h : "home";
    render();
  }

  async function loadJSON(path){
    const res = await fetch(path, {cache:"no-store"});
    if(!res.ok) throw new Error(`Failed to load ${path}`);
    return await res.json();
  }

  async function init(){
    // lang toggle
    document.getElementById("langBtn").addEventListener("click", () => {
      setLang(state.lang === "en" ? "zh" : "en");
    });

    // keyboard quick focus
    window.addEventListener("keydown", (e) => {
      if(e.key === "/"){
        e.preventDefault();
        const input = document.getElementById("foodSearch");
        if(input){ input.focus(); }
      }
    });

    // Load settings
    loadSettings();

    // Load data
    try{
      [state.foodDB, state.tcmDB, state.aus] = await Promise.all([
        loadJSON("./fooddb_v3.json"),
        loadJSON("./tcm_evidence_v1.json").catch(()=>loadJSON("./tcm_evidence_v1.json")),
        loadJSON("./aus_guidelines_v1.json")
      ]);
      state.tcmDB = normalizeTCM(state.tcmDB);

    }catch(e){
      console.error(e);
      showBanner();
      $("bannerTitle").textContent = state.lang==="zh" ? "数据加载失败" : "Data load failed";
      $("bannerText").textContent = (state.lang==="zh"
        ? "请确认 JSON 文件与 app_v3.js 在同一目录，并使用本地服务器方式打开（例如 VSCode Live Server）。"
        : "Ensure JSON files are in the same folder and open via a local server (e.g., VSCode Live Server)."
      );
    }

    // default safety banner once
    showSafety();

    // initial language based on browser
    const prefersZh = (navigator.language || "").toLowerCase().startsWith("zh");
    setLang(prefersZh ? "zh" : "en");

    // route
    window.addEventListener("hashchange", onRoute);
    onRoute();
  }

  
  // ===== TCM schema normalizer (supports v1/v2/v7) =====
  function normalizeTCM(raw){
    if(!raw) return { entries: [] };

    // If already in expected format
    if(Array.isArray(raw.entries)) return raw;

    const items = raw.items || raw.entries || raw.data || [];
    const entries = (items || []).map((it, idx) => {
      const id = String(it.id || it.key || it.slug || idx);
      const type = it.type || "herb";
      const ev = it.evidence_level || it.evidence || "low";
      const titleZh = it.title?.zh || it.name_zh || it.name?.zh || it.name || it.title_zh || id;
      const titleEn = it.title?.en || it.name_en || it.name?.en || it.title_en || "";
      const sumZh = it.summary?.zh || it.summary_zh || it.desc_zh || it.description_zh || it.summary || "";
      const sumEn = it.summary?.en || it.summary_en || it.desc_en || it.description_en || "";
      const bullets = it.items || it.key_points || it.points || it.use_cases || [];
      const safety = it.safety || it.risks || it.warnings || [];
      const refs = it.source_refs || it.refs || [];

      // Convert refs to objects that UI can show
      const source_refs = (refs || []).map(r => {
        if(typeof r === "string"){
          return { label: r, url: r };
        }
        // already object
        const url = r.url || r.link || r.doi || r.pubmed || "";
        const label = r.label || r.title || r.citation || url;
        return { label, url };
      }).filter(x => x.url || x.label);

      return {
        id,
        type,
        evidence_level: ev,
        title: { zh: titleZh, en: titleEn },
        summary: { zh: sumZh, en: sumEn },
        items: Array.isArray(bullets) ? bullets : [String(bullets)],
        safety: Array.isArray(safety) ? safety : [String(safety)],
        source_refs
      };
    });

    return { entries };
  }

  // ===== Manual Add (HOME only) =====
  function manualAddHTML(){
    return `
      <div class="card p-5 mt-5" id="manualAddCard">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-base font-extrabold text-slate-900">✍️ ${state.lang==="zh"?"手动添加":"Manual Add"}</h3>
          <p class="text-xs text-slate-500">${state.lang==="zh"?"添加数据库里没有的食物":"Add foods not in the database"}</p>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">${state.lang==="zh"?"食物名称":"Food name"}</label>
            <input type="text" id="manualName" class="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-200 outline-none"
              placeholder="e.g., 云吞面 / wonton noodles" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">kcal</label>
              <input type="number" id="manualCal" class="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-200 outline-none"
                placeholder="e.g., 300" />
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">${state.lang==="zh"?"蛋白 (g)":"protein (g)"}</label>
              <input type="number" id="manualProt" class="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-200 outline-none"
                placeholder="e.g., 15" />
            </div>
          </div>

          <div class="md:col-span-2 flex gap-3">
            <button id="manualAddBtn" class="btn-brand flex-1 py-3 rounded-2xl font-extrabold shadow-md">➕ ${state.lang==="zh"?"添加":"Add"}</button>
            <button id="manualClearBtn" class="btn-ghost flex-1 py-3 rounded-2xl font-extrabold text-slate-700">🧹 ${state.lang==="zh"?"清空":"Clear"}</button>
          </div>

          <p class="md:col-span-2 text-xs text-slate-500">
            ${state.lang==="zh"
              ? "提示：不知道热量/蛋白可以留空（按 0 记录），也能先把食物记下来。"
              : "Tip: If you don’t know kcal/protein, leave blank (0) — you can still log it."}
          </p>
        </div>
      </div>
    `;
  }

  function bindManualAdd(){
    const addBtn = document.getElementById("manualAddBtn");
    const clearBtn = document.getElementById("manualClearBtn");
    if(!addBtn || !clearBtn) return;

    addBtn.onclick = () => {
      const name = ($("manualName")?.value || "").trim();
      const kcal = Number($("manualCal")?.value || 0);
      const prot = Number($("manualProt")?.value || 0);
      if(!name){
        showBanner(state.lang==="zh"?"请填写食物名称":"Please enter a food name", state.lang==="zh"?"手动添加需要食物名称。":"Food name is required for manual add.");
        return;
      }
      addFood(name, kcal, prot);
      // clear
      $("manualName").value = "";
      $("manualCal").value = "";
      $("manualProt").value = "";
    };

    clearBtn.onclick = () => {
      if($("manualName")) $("manualName").value = "";
      if($("manualCal")) $("manualCal").value = "";
      if($("manualProt")) $("manualProt").value = "";
    };
  }

  function bindEvidenceFilters(){
    const tSel = $("evTypeSelect");
    const eSel = $("evLevelSelect");
    if(tSel){
      tSel.onchange = (ev) => { state.evidenceFilter.type = ev.target.value; render(); };
    }
    if(eSel){
      eSel.onchange = (ev) => { state.evidenceFilter.evidence = ev.target.value; render(); };
    }
  }
return {
    init,
    openSettings,
    closeSettings,
    saveSettings,
    addFood,
    onSearch,
    askAI,
    googleSearch,
    openEvidence,
    openIntegrativeCautions,
    openPhaseExplain,
    showSafety,
    hideBanner,
    clearToday,
    go,
    closeModal
  };
})();

window.PCare = PCare;
window.addEventListener("DOMContentLoaded", () => PCare.init());
