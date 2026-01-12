// P‑Care v3 (patched) — adds Manual Add on Home while keeping the clean v3 UI.
// Expected files in the SAME folder:
// - index.html
// - app.js
// - fooddb_v3.json
// - tcm_evidence_v1.json
// - aus_guidelines_v1.json

(function(){
  const LS = {
    weight: "pcare_weight",
    settings: "pcare_settings_v3",
    day: (d)=>`pcare_day_${d}`
  };

  const DEFAULTS = {
    lang: "en",
    weightKg: 60,
    calPerKg: 30,
    protPerKg: 1.5,
    auProfile: "female"
  };

  const I18N = {
    en: {
      daily_goals:"Daily Goals", target:"Target", calories:"Calories", protein:"Protein",
      ask_ai:"Ask AI Assistant", search_web:"Search Web",
      quick_tips:"Quick tips", tip1:"Small frequent meals", tip2:"Low‑fat cooking (steam/boil/stew)",
      tip3:"Persistent weight loss/diarrhea/jaundice → clinician review",
      au_ref:"AU daily serves (ref)", reset:"Reset today",
      food_finder:"Food Finder", not_found:"Item not found in database.", ask_ai_safe:"Ask AI if safe",
      manual_add:"Manual Add", manual_hint:"Add any food not in the database.",
      food_name:"Food name", add:"Add", clear:"Clear",
      manual_note:"Tip: If you don't know kcal/protein, leave blank and add 0 — you can still track the meal.",
      analysis:"Analysis", last7:"Last 7 days",
      analysis_hint:"This shows calories and protein trends. We can extend to macro nutrients later.",
      evidence:"Evidence Library",
      settings:"Personalize Targets", settings_hint:"Targets are estimates; adjust with your clinician.",
      weight:"Current Weight (kg)"
    },
    zh: {
      daily_goals:"每日目标", target:"目标", calories:"热量", protein:"蛋白质",
      ask_ai:"问AI助手", search_web:"网页搜索",
      quick_tips:"小提示", tip1:"少量多餐", tip2:"低脂做法（蒸/煮/炖）",
      tip3:"持续体重下降/腹泻/黄疸 → 尽快就医评估",
      au_ref:"澳洲每日份量参考", reset:"重置今天",
      food_finder:"食物查询", not_found:"数据库未找到该食物。", ask_ai_safe:"问AI是否适合",
      manual_add:"手动添加", manual_hint:"记录数据库里没有的食物。",
      food_name:"食物名称", add:"添加", clear:"清空",
      manual_note:"提示：不知道热量/蛋白也可以先填0，依旧能记录。",
      analysis:"分析", last7:"最近7天",
      analysis_hint:"这里展示热量与蛋白趋势；后续可扩展宏量营养等。",
      evidence:"证据库",
      settings:"个性化目标", settings_hint:"目标为估算值；请以医生/营养师建议为准。",
      weight:"当前体重（kg）"
    }
  };

  let foodDB=null, tcmDB=null, auDB=null;

  function isoDate(d=new Date()){
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,"0");
    const dd=String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${dd}`;
  }

  function loadSettings(){
    try{
      const raw = localStorage.getItem(LS.settings);
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
    }catch{ return { ...DEFAULTS }; }
  }
  function saveSettings(s){ localStorage.setItem(LS.settings, JSON.stringify(s)); }

  let settings = loadSettings();

  function loadDay(){
    const d=isoDate();
    try{
      const raw = localStorage.getItem(LS.day(d));
      if(raw) return JSON.parse(raw);
    }catch{}
    return { date:d, cal:0, prot:0, log:[] };
  }
  let day = loadDay();
  function saveDay(){ localStorage.setItem(LS.day(day.date), JSON.stringify(day)); }

  function t(key){ return I18N[settings.lang]?.[key] || key; }
  function applyI18n(){
    document.querySelectorAll("[data-i18n]").forEach(el=>{
      const key = el.getAttribute("data-i18n");
      el.textContent = t(key);
    });
    const ph = settings.lang==="zh" ? "搜索食物…（例如：香蕉 / banana / 鸡胸肉）" : "Search foods… (e.g., 香蕉 / banana / 鸡胸肉)";
    document.getElementById("foodSearch").placeholder = ph;
  }

  function targets(){
    return {
      cal: Math.round(settings.weightKg * settings.calPerKg),
      prot: Math.round(settings.weightKg * settings.protPerKg)
    };
  }

  function setBar(curId,tgtId,barId,cur,tgt){
    document.getElementById(curId).textContent = cur;
    document.getElementById(tgtId).textContent = tgt;
    const pct = tgt ? Math.min((cur/tgt)*100,100) : 0;
    document.getElementById(barId).style.width = pct + "%";
  }

  function updateDashboard(){
    const tg=targets();
    document.getElementById("targetWeightDisplay").textContent = settings.weightKg;
    setBar("calCurrent","calTarget","calBar",day.cal,tg.cal);
    setBar("protCurrent","protTarget","protBar",day.prot,tg.prot);
    renderAU();
    renderWeek();
  }

  function renderAU(){
    const el=document.getElementById("auRefText");
    if(!auDB?.adult){ el.textContent="—"; return; }
    const p = auDB.adult[settings.auProfile];
    el.textContent = settings.lang==="zh"
      ? `蔬菜豆类 ${p.veg_serves} 份/天；水果 ${p.fruit_serves}；谷物 ${p.grains_serves}；瘦肉蛋豆鱼 ${p.protein_serves}；奶及替代 ${p.dairy_serves}；水 ${p.water_ml}ml。`
      : `Veg/legumes ${p.veg_serves} serves/day; fruit ${p.fruit_serves}; grains ${p.grains_serves}; protein foods ${p.protein_serves}; dairy ${p.dairy_serves}; water ${p.water_ml}ml.`;
  }

  function escapeHtml(s){
    return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }

  function renderFoods(list){
    const wrap=document.getElementById("foodList");
    wrap.innerHTML="";
    if(!list || list.length===0){
      document.getElementById("notFound").classList.remove("hidden");
      return;
    }
    document.getElementById("notFound").classList.add("hidden");

    list.forEach(item=>{
      const st=item.status;
      const icon = st==="safe" ? "✅" : (st==="caution" ? "⚠️" : "⛔");
      const name = settings.lang==="zh" ? (item.name_zh || item.name || "") : (item.name_en || item.name || "");
      const note = settings.lang==="zh" ? (item.note_zh || item.note || "") : (item.note_en || item.note || "");
      const kcal = item.cal ?? item.kcal ?? 0;
      const prot = item.protein ?? item.protein_g ?? 0;

      const btn = st!=="avoid"
        ? `<button class="text-sm bg-white border border-gray-200 px-3 py-1 rounded-lg shadow-sm active:bg-gray-100"
            onclick="PCare.addFood('${escapeHtml(name)}',${Number(kcal)||0},${Number(prot)||0})">+ Eat</button>`
        : `<span class="text-xs font-bold text-red-500 uppercase">Avoid</span>`;

      const div=document.createElement("div");
      div.className=`card food-item ${st} p-4 flex justify-between items-center`;
      div.innerHTML = `
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="text-lg">${icon}</span>
            <h4 class="font-bold text-gray-800">${escapeHtml(name)}</h4>
          </div>
          <p class="text-xs text-gray-600 mt-1">${escapeHtml(note)}</p>
          <p class="text-xs text-gray-500 mt-1"><span class="mr-2">🔥 ${kcal} kcal</span><span>🥩 ${prot}g</span></p>
        </div>
        <div class="ml-3">${btn}</div>
      `;
      wrap.appendChild(div);
    });
  }

  function filterFoods(){
    const q=(document.getElementById("foodSearch").value||"").trim().toLowerCase();
    const items = foodDB?.foods || foodDB || [];
    if(!q){ renderFoods(items); return; }
    const filtered = items.filter(f=>{
      const s = `${f.name||""} ${f.name_en||""} ${f.name_zh||""} ${(f.aliases||[]).join(" ")} ${(f.tags||[]).join(" ")}`.toLowerCase();
      return s.includes(q);
    });
    renderFoods(filtered);
  }

  function addFood(name, kcal, prot){
    day.cal += Number(kcal)||0;
    day.prot += Number(prot)||0;
    day.log.push({ ts:new Date().toISOString(), name, kcal:Number(kcal)||0, prot:Number(prot)||0 });
    saveDay();
    updateDashboard();
    alert((settings.lang==="zh"?"已记录：":"Added: ")+name);
  }

  // Manual add: reads inputs, adds to day log (NOT to DB)
  function manualAdd(){
    const name = (document.getElementById("mName").value||"").trim();
    const kcal = Number(document.getElementById("mCal").value||0);
    const prot = Number(document.getElementById("mProt").value||0);
    const fv = Number(document.getElementById("mFv").value||0);     // reserved
    const water = Number(document.getElementById("mWater").value||0); // reserved
    if(!name){
      alert(settings.lang==="zh" ? "请先填写食物名称" : "Please enter a food name");
      return;
    }
    // For v3 dashboard we only track kcal + protein; keep fv/water in log for later extensions
    addFood(name, kcal, prot);
  }
  function manualClear(){
    ["mName","mCal","mProt","mFv","mWater"].forEach(id=>document.getElementById(id).value="");
  }

  function askAI(){
    const q=(document.getElementById("foodSearch").value||"").trim();
    const item = q || (settings.lang==="zh"?"这个食物/补充剂":"this food/supplement");
    const prompt = settings.lang==="zh"
      ? `我是一名胰腺癌患者/胰腺手术后患者。请问「${item}」是否适合？请给出低脂做法、建议份量/频次、何时需要避免；如果是中药/补充剂，请列出需要问医生的相互作用问题（抗凝、肝肾、化疗）。`
      : `I have pancreatic cancer or post-pancreatic surgery. Is "${item}" appropriate? Provide low-fat preparation, portion/frequency, when to avoid. If herb/supplement, list clinician questions about interactions (anticoagulants, liver/kidney, chemo).`;
    if(confirm(prompt)){
      window.open(`https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,"_blank");
    }
  }
  function googleSearch(){
    const q=(document.getElementById("foodSearch").value||"").trim();
    const finalQuery = settings.lang==="zh" ? `胰腺癌 饮食 能不能吃 ${q}`.trim() : `pancreatic cancer diet can I eat ${q}`.trim();
    window.open(`https://www.google.com/search?q=${encodeURIComponent(finalQuery)}`,"_blank");
  }

  function resetToday(){
    if(!confirm(settings.lang==="zh"?"确认重置今天记录？":"Reset today's log?")) return;
    day = { date: isoDate(), cal:0, prot:0, log:[] };
    saveDay();
    updateDashboard();
  }

  // Tabs
  function setActiveTab(tab){
    const tabs=["home","analysis","evidence"];
    tabs.forEach(tn=>{
      document.getElementById("tab-"+tn).classList.toggle("hidden", tn!==tab);
      document.querySelectorAll(".tabBtn").forEach(btn=>{
        if(btn.getAttribute("data-tab")===tn){
          btn.classList.toggle("bg-emerald-50", tn===tab);
          btn.classList.toggle("text-emerald-700", tn===tab);
          btn.classList.toggle("bg-white", tn!==tab);
          btn.classList.toggle("border", tn!==tab);
          btn.classList.toggle("border-gray-100", tn!==tab);
          btn.classList.toggle("text-gray-700", tn!==tab);
        }
      });
    });
  }

  // Analysis week
  function renderWeek(){
    const wrap=document.getElementById("weekWrap");
    if(!wrap) return;
    wrap.innerHTML="";
    const tg=targets();
    for(let i=6;i>=0;i--){
      const d=new Date(); d.setDate(d.getDate()-i);
      const key=LS.day(isoDate(d));
      let cal=0, prot=0;
      const raw=localStorage.getItem(key);
      if(raw){
        try{
          const obj=JSON.parse(raw);
          cal=obj.cal||0; prot=obj.prot||0;
        }catch{}
      }
      const pctC = tg.cal ? Math.min((cal/tg.cal)*100,100) : 0;
      const pctP = tg.prot ? Math.min((prot/tg.prot)*100,100) : 0;

      const row=document.createElement("div");
      row.className="grid grid-cols-12 gap-3 items-center";
      row.innerHTML = `
        <div class="col-span-2 text-xs text-gray-500">${isoDate(d).slice(5)}</div>
        <div class="col-span-5">
          <div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-orange-400 h-2.5 rounded-full" style="width:${pctC}%"></div></div>
          <div class="text-xs text-gray-500 mt-1">🔥 ${cal} / ${tg.cal}</div>
        </div>
        <div class="col-span-5">
          <div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-emerald-500 h-2.5 rounded-full" style="width:${pctP}%"></div></div>
          <div class="text-xs text-gray-500 mt-1">🥩 ${prot} / ${tg.prot}</div>
        </div>
      `;
      wrap.appendChild(row);
    }
  }

  // Evidence rendering (simple cards + modal)
  let evType="all", evLevel="all";
  function renderEvidence(){
    const wrap=document.getElementById("evList");
    if(!wrap) return;
    wrap.innerHTML="";
    const items = tcmDB?.items || tcmDB || [];
    const filtered = items.filter(it=>{
      const okT = evType==="all" || it.type===evType;
      const okE = evLevel==="all" || it.evidence_level===evLevel;
      return okT && okE;
    });
    document.getElementById("evCount").textContent = String(filtered.length);
    document.getElementById("evHint").textContent =
      settings.lang==="zh"
        ? "仅供信息参考；不可替代标准治疗。任何中药/补充剂请先与肿瘤团队沟通。"
        : "Informational only. Do not replace standard care. Discuss any herb/supplement with your oncology team.";

    filtered.forEach(it=>{
      const title = settings.lang==="zh" ? (it.name_zh||it.name?.zh||it.name||it.id) : (it.name_en||it.name?.en||it.name||it.id);
      const sum = settings.lang==="zh" ? (it.summary_zh||it.summary?.zh||it.summary||"") : (it.summary_en||it.summary?.en||it.summary||"");
      const card=document.createElement("div");
      card.className="card p-4 border border-gray-100";
      card.innerHTML = `
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="font-bold text-gray-900">${escapeHtml(title)}</div>
            <div class="text-xs text-gray-500 mt-1">${escapeHtml(it.type||"")} • ${escapeHtml(it.evidence_level||"")}</div>
            <div class="text-sm text-gray-700 mt-2">${escapeHtml(sum)}</div>
          </div>
          <button class="text-emerald-700 font-bold" onclick="PCare.openEv('${escapeHtml(it.id)}')">${settings.lang==="zh"?"查看":"View"}</button>
        </div>
      `;
      wrap.appendChild(card);
    });
  }

  function openEv(id){
    const items = tcmDB?.items || tcmDB || [];
    const it = items.find(x=>String(x.id)===String(id));
    if(!it) return;
    const title = settings.lang==="zh" ? (it.name_zh||it.name?.zh||it.name||it.id) : (it.name_en||it.name?.en||it.name||it.id);
    const sum = settings.lang==="zh" ? (it.summary_zh||it.summary?.zh||it.summary||"") : (it.summary_en||it.summary?.en||it.summary||"");
    const risks = (it.risks||it.safety||[]); // allow either
    const uses = (it.use_cases||it.indications||[]);
    const html = `
      <div class="text-gray-700">${escapeHtml(sum)}</div>
      ${uses.length? `<div class="mt-3"><div class="font-bold">Use cases</div><ul class="list-disc pl-5 text-sm mt-1">${uses.map(u=>`<li>${escapeHtml(u)}</li>`).join("")}</ul></div>`:""}
      ${risks.length? `<div class="mt-3"><div class="font-bold">⚠️ Safety</div><ul class="list-disc pl-5 text-sm mt-1">${risks.map(r=>`<li>${escapeHtml(r)}</li>`).join("")}</ul></div>`:""}
    `;
    document.getElementById("evModalTitle").textContent = title;
    document.getElementById("evModalBody").innerHTML = html;
    const m=document.getElementById("evModal");
    m.classList.remove("hidden");
    m.classList.add("flex");
  }
  function closeEv(){
    const m=document.getElementById("evModal");
    m.classList.add("hidden");
    m.classList.remove("flex");
  }

  async function loadJSON(path){
    const res = await fetch(path, { cache:"no-store" });
    if(!res.ok) throw new Error(`Failed to load ${path}`);
    return await res.json();
  }

  function openSettings(){
    const m=document.getElementById("settingsModal");
    document.getElementById("weightInput").value = settings.weightKg;
    document.getElementById("auProfile").value = settings.auProfile;
    m.classList.remove("hidden"); m.classList.add("flex");
  }
  function closeSettings(){
    const m=document.getElementById("settingsModal");
    m.classList.add("hidden"); m.classList.remove("flex");
  }
  function saveSettingsFromUI(){
    const w = Number(document.getElementById("weightInput").value || settings.weightKg);
    settings.weightKg = isFinite(w) && w>0 ? w : settings.weightKg;
    settings.auProfile = document.getElementById("auProfile").value || settings.auProfile;
    saveSettings(settings);
    closeSettings();
    updateDashboard();
  }

  async function init(){
    // Load DBs (v3 filenames)
    try{
      const [f,t,a] = await Promise.all([
        loadJSON("./fooddb_v3.json"),
        loadJSON("./tcm_evidence_v1.json"),
        loadJSON("./aus_guidelines_v1.json")
      ]);
      foodDB = f;
      tcmDB = t;
      auDB = a;
    }catch(e){
      console.error(e);
      alert(e.message);
    }

    // Bind
    document.getElementById("foodSearch").addEventListener("input", filterFoods);
    document.getElementById("askBtn").addEventListener("click", askAI);
    document.getElementById("googleBtn").addEventListener("click", googleSearch);
    document.getElementById("askBtn2").addEventListener("click", askAI);
    document.getElementById("resetBtn").addEventListener("click", resetToday);

    document.getElementById("mAddBtn").addEventListener("click", manualAdd);
    document.getElementById("mClearBtn").addEventListener("click", manualClear);

    document.getElementById("saveSettingsBtn").addEventListener("click", saveSettingsFromUI);
    document.getElementById("langBtn").addEventListener("click", ()=>{
      settings.lang = settings.lang==="zh" ? "en" : "zh";
      saveSettings(settings);
      applyI18n();
      filterFoods();
      renderEvidence();
      updateDashboard();
    });

    document.querySelectorAll(".tabBtn").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        setActiveTab(btn.getAttribute("data-tab"));
        if(btn.getAttribute("data-tab")==="analysis") renderWeek();
        if(btn.getAttribute("data-tab")==="evidence") renderEvidence();
      });
    });

    document.getElementById("evType").addEventListener("change",(e)=>{ evType=e.target.value; renderEvidence(); });
    document.getElementById("evLevel").addEventListener("change",(e)=>{ evLevel=e.target.value; renderEvidence(); });
    document.getElementById("evCloseBtn").addEventListener("click", closeEv);

    applyI18n();
    filterFoods();
    updateDashboard();
    renderEvidence();
  }

  window.PCare = { addFood, askAI, googleSearch, openSettings, openEv };
  window.addEventListener("DOMContentLoaded", init);
})();
