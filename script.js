(() => {
  const DATA = window.NJTI_DATA;
  const STORAGE_PREFIX = `njti_${DATA.version || "v1"}_`;
  const $ = (id) => document.getElementById(id);
  const state = {
    lang: localStorage.getItem("njti_lang") || DATA.defaultLang || "zh",
    current: Number(localStorage.getItem(STORAGE_PREFIX + "current") || 0),
    answers: JSON.parse(localStorage.getItem(STORAGE_PREFIX + "answers") || "[]")
  };

  const els = {
    languageSelect: $("languageSelect"),
    languageLabel: $("languageLabel"),
    homeView: $("homeView"),
    quizView: $("quizView"),
    resultView: $("resultView"),
    siteTitle: $("siteTitle"),
    siteKicker: $("siteKicker"),
    siteSubtitle: $("siteSubtitle"),
    authorLine: $("authorLine"),
    startBtn: $("startBtn"),
    continueBtn: $("continueBtn"),
    homeNote: $("homeNote"),
    questionCounter: $("questionCounter"),
    chooseTip: $("chooseTip"),
    progressBar: $("progressBar"),
    questionText: $("questionText"),
    optionsList: $("optionsList"),
    prevBtn: $("prevBtn"),
    nextBtn: $("nextBtn"),
    toast: $("toast"),
    resultTitleLabel: $("resultTitleLabel"),
    resultName: $("resultName"),
    resultTraits: $("resultTraits"),
    resultImage: $("resultImage"),
    personaLabel: $("personaLabel"),
    detailLabel: $("detailLabel"),
    sceneLabel: $("sceneLabel"),
    dimensionProfileLabel: $("dimensionProfileLabel"),
    resultPersona: $("resultPersona"),
    resultDetail: $("resultDetail"),
    resultScene: $("resultScene"),
    dimensionChart: $("dimensionChart"),
    restartBtn: $("restartBtn"),
    copyBtn: $("copyBtn"),
    homeBtn: $("homeBtn")
  };

  function tr(obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return obj[state.lang] || obj.zh || obj.en || "";
  }

  function ui(key, values = {}) {
    let text = (DATA.ui[state.lang] && DATA.ui[state.lang][key]) || DATA.ui.zh[key] || "";
    Object.entries(values).forEach(([k, v]) => text = text.replace(`{${k}}`, v));
    return text;
  }

  function persist() {
    localStorage.setItem("njti_lang", state.lang);
    localStorage.setItem(STORAGE_PREFIX + "current", String(state.current));
    localStorage.setItem(STORAGE_PREFIX + "answers", JSON.stringify(state.answers));
  }

  function populateLanguageSelect() {
    els.languageSelect.innerHTML = "";
    DATA.languages.forEach(lang => {
      const opt = document.createElement("option");
      opt.value = lang.code;
      opt.textContent = lang.label;
      if (lang.code === state.lang) opt.selected = true;
      els.languageSelect.appendChild(opt);
    });
  }

  function applyLanguage() {
    document.documentElement.lang = state.lang === "zh" ? "zh-CN" : state.lang;
    document.documentElement.dir = state.lang === "ar" ? "rtl" : "ltr";
    document.title = ui("siteTitle");

    els.languageLabel.textContent = ui("language");
    els.siteTitle.textContent = ui("siteTitle");
    els.siteKicker.textContent = ui("siteKicker");
    els.siteSubtitle.textContent = ui("subtitle");
    els.authorLine.textContent = ui("author");
    els.startBtn.textContent = ui("start");
    els.continueBtn.textContent = ui("continue");
    els.homeNote.textContent = ui("homeNote");
    els.prevBtn.textContent = ui("prev");
    els.restartBtn.textContent = ui("restart");
    els.copyBtn.textContent = ui("copyLink");
    els.homeBtn.textContent = ui("backHome");
    els.chooseTip.textContent = ui("chooseTip");
    els.resultTitleLabel.textContent = ui("resultTitle");
    els.personaLabel.textContent = ui("persona");
    els.detailLabel.textContent = ui("detail");
    els.sceneLabel.textContent = ui("scene");
    els.dimensionProfileLabel.textContent = ui("dimensionProfile");

    if (!els.quizView.classList.contains("hidden")) renderQuestion();
    if (!els.resultView.classList.contains("hidden")) renderResult();
    updateHomeContinue();
    persist();
  }

  function updateHomeContinue() {
    if (state.answers.some(Boolean) && state.answers.length < DATA.questions.length) {
      els.continueBtn.classList.remove("hidden");
    } else {
      els.continueBtn.classList.add("hidden");
    }
  }

  function showView(viewName) {
    els.homeView.classList.toggle("hidden", viewName !== "home");
    els.quizView.classList.toggle("hidden", viewName !== "quiz");
    els.resultView.classList.toggle("hidden", viewName !== "result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startQuiz(reset = false) {
    if (reset) {
      state.current = 0;
      state.answers = [];
      persist();
    }
    showView("quiz");
    renderQuestion();
  }

  function renderQuestion() {
    const total = DATA.questions.length;
    if (state.current < 0) state.current = 0;
    if (state.current >= total) state.current = total - 1;

    const q = DATA.questions[state.current];
    els.questionCounter.textContent = ui("questionCounter", { current: state.current + 1, total });
    els.progressBar.style.width = `${Math.round(((state.current + 1) / total) * 100)}%`;
    els.questionText.textContent = tr(q.text);
    els.optionsList.innerHTML = "";
    els.toast.classList.add("hidden");

    const letters = ["A", "B", "C", "D"];
    q.options.forEach((option, index) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.type = "button";
      if (state.answers[state.current] === index) btn.classList.add("selected");
      btn.innerHTML = `
        <span class="option-letter">${letters[index]}</span>
        <span class="option-text"></span>
      `;
      btn.querySelector(".option-text").textContent = tr(option.text);
      btn.addEventListener("click", () => {
        state.answers[state.current] = index;
        persist();
        renderQuestion();
      });
      els.optionsList.appendChild(btn);
    });

    els.prevBtn.disabled = state.current === 0;
    els.nextBtn.textContent = state.current === total - 1 ? ui("viewResult") : ui("next");
    persist();
  }

  function nextQuestion() {
    if (state.answers[state.current] === undefined) {
      els.toast.textContent = ui("notAnswered");
      els.toast.classList.remove("hidden");
      return;
    }
    if (state.current < DATA.questions.length - 1) {
      state.current += 1;
      renderQuestion();
    } else {
      renderResult();
      showView("result");
    }
  }

  function prevQuestion() {
    if (state.current > 0) {
      state.current -= 1;
      renderQuestion();
    }
  }

  function calculateScores() {
    const stats = {};
    DATA.dimensions.forEach(dim => {
      stats[dim.id] = { left: 0, right: 0, highLeft: 0, highRight: 0, lastSide: "left" };
    });

    DATA.questions.forEach((q, i) => {
      const idx = state.answers[i];
      if (idx === undefined) return;
      const chosen = q.options[idx];
      const d = stats[q.dim];
      d[chosen.side] += chosen.points;
      if (chosen.points === 2) {
        if (chosen.side === "left") d.highLeft += 1;
        else d.highRight += 1;
      }
      d.lastSide = chosen.side;
    });

    const keyParts = DATA.dimensions.map(dim => {
      const d = stats[dim.id];
      if (d.left > d.right) return "L";
      if (d.right > d.left) return "R";
      if (d.highLeft > d.highRight) return "L";
      if (d.highRight > d.highLeft) return "R";
      return d.lastSide === "left" ? "L" : "R";
    });

    return { stats, key: keyParts.join("") };
  }

  function renderResult() {
    const resultInfo = calculateScores();
    const result = DATA.results[resultInfo.key] || DATA.results.RLLL;
    els.resultName.textContent = tr(result.name);
    els.resultTraits.textContent = tr(result.traits);
    els.resultImage.src = result.image;
    els.resultImage.alt = tr(result.name);
    els.resultPersona.textContent = tr(result.persona);
    els.resultDetail.textContent = tr(result.detail);
    els.resultScene.textContent = tr(result.scene);
    renderDimensionChart(resultInfo.stats);
  }

  function renderDimensionChart(stats) {
    els.dimensionChart.innerHTML = "";
    DATA.dimensions.forEach(dim => {
      const d = stats[dim.id];
      const total = Math.max(1, d.left + d.right);
      const leftPct = Math.round((d.left / total) * 100);
      const rightPct = 100 - leftPct;
      const row = document.createElement("div");
      row.className = "metric-row";
      row.innerHTML = `
        <div class="metric-label left">
          <span>${tr(dim.left)}</span>
          <span class="percent">${leftPct}%</span>
        </div>
        <div class="metric-bar" aria-label="${tr(dim.left)} ${leftPct}%, ${tr(dim.right)} ${rightPct}%">
          <span class="metric-fill-left" style="width:${leftPct}%"></span>
          <span class="metric-fill-right" style="width:${rightPct}%"></span>
          <span class="metric-center"></span>
        </div>
        <div class="metric-label right">
          <span>${tr(dim.right)}</span>
          <span class="percent">${rightPct}%</span>
        </div>
      `;
      els.dimensionChart.appendChild(row);
    });
  }

  function retake() {
    state.current = 0;
    state.answers = [];
    persist();
    startQuiz(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      const original = els.copyBtn.textContent;
      els.copyBtn.textContent = ui("copied");
      setTimeout(() => els.copyBtn.textContent = original, 1200);
    } catch (_) {
      window.prompt(ui("copyLink"), window.location.href);
    }
  }

  function init() {
    populateLanguageSelect();
    applyLanguage();

    els.languageSelect.addEventListener("change", (e) => {
      state.lang = e.target.value;
      applyLanguage();
    });
    els.startBtn.addEventListener("click", () => startQuiz(true));
    els.continueBtn.addEventListener("click", () => startQuiz(false));
    els.prevBtn.addEventListener("click", prevQuestion);
    els.nextBtn.addEventListener("click", nextQuestion);
    els.restartBtn.addEventListener("click", retake);
    els.copyBtn.addEventListener("click", copyLink);
    els.homeBtn.addEventListener("click", () => { showView("home"); updateHomeContinue(); });

    updateHomeContinue();
    showView("home");
  }

  init();
})();
