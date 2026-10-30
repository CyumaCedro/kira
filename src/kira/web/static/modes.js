"use strict";

// Viewing modes: who is using Kira changes the language, the tools shown and the landing page.

const MODES = {
  student: {
    label: "Student",
    sub: "Ages 13 to 18",
    icon: "✎",
    desc: "Clear explanations, a word list, and questions to think about.",
    banner: "Learning mode: simpler explanations, key words, and questions to think about. If you're worried about your own health, talk to a trusted adult or a doctor.",
    landing: "journey",
    nav: ["journey", "home", "literature", "remedies", "imaging", "drugs"],
    litExamples: ["how does cancer start review", "how immunotherapy works review", "HPV vaccine cervical cancer prevention", "smoking and lung cancer", "sunburn melanoma risk young people"],
  },
  adult: {
    label: "Adult",
    sub: "Patients, families and the public",
    icon: "♥",
    desc: "A plain-language guide to each stage, with questions for your care team.",
    banner: "Plain-language guide. Each stage ends with questions you can take to your care team.",
    landing: "journey",
    nav: ["journey", "home", "literature", "remedies"],
    litExamples: ["exercise during cancer treatment", "cancer screening benefits and harms", "early palliative care randomized trial", "cancer-related fatigue treatment", "integrative oncology guideline"],
  },
  practitioner: {
    label: "Practitioner / scientist",
    sub: "Clinicians, lab and health scientists",
    icon: "✚",
    desc: "Clinical focus points, biomarkers, interactions and evidence levels.",
    banner: "Clinical view: each stage lists clinical focus points. Always confirm against current site-specific guidelines.",
    landing: "journey",
    nav: ["journey", "home", "literature", "remedies", "genomics", "imaging", "drugs"],
    litExamples: ["KRAS G12C inhibitor non-small cell lung cancer", "ctDNA guided adjuvant therapy", "herb drug interactions chemotherapy", "immune checkpoint inhibitor toxicity management", "early palliative care randomized trial"],
  },
  researcher: {
    label: "Researcher",
    sub: "Academic and data researchers",
    icon: "⚗",
    desc: "Literature mining, analysis tools, open questions and public data sets.",
    banner: "Research view: open questions for each stage, plus public data sets to work with.",
    landing: "literature",
    nav: ["literature", "genomics", "imaging", "drugs", "remedies", "journey", "home"],
    litExamples: ["tumor microenvironment single-cell sequencing", "deep learning histopathology mutation prediction", "KRAS inhibitor resistance mechanisms", "ctDNA minimal residual disease", "cancer drug repurposing"],
  },
  healer: {
    label: "Traditional healer",
    sub: "Herbalists and community healers",
    icon: "❦",
    desc: "Evidence on plant remedies, safety, interactions, and when to refer.",
    banner: "Healer view: how traditional care can work safely alongside medical treatment, and when to refer someone to a clinic.",
    landing: "remedies",
    nav: ["remedies", "journey", "literature", "home"],
    litExamples: ["herb drug interactions cancer", "ginger chemotherapy nausea randomized", "traditional medicine delayed cancer diagnosis", "medicinal plants anticancer clinical trial", "integrative oncology guideline"],
  },
};

const GLOSSARY = [
  ["Cell", "The tiny building block of every living thing. Your body has trillions of them."],
  ["Gene", "An instruction in your DNA that tells a cell what to do."],
  ["Mutation", "A change or mistake in a gene. Some mutations make cells grow out of control."],
  ["Tumor", "A lump of extra cells. It can be harmless (benign) or cancer (malignant)."],
  ["Cancer", "A disease in which cells grow out of control and can invade other parts of the body."],
  ["Metastasis", "When cancer spreads from where it started to another part of the body."],
  ["Biopsy", "Taking a tiny sample of tissue to look at under a microscope."],
  ["Chemotherapy", "Medicines that kill fast-growing cells, including cancer cells."],
  ["Immunotherapy", "Treatment that helps the body's immune system find and fight cancer."],
  ["Clinical trial", "A careful study that tests whether a new treatment is safe and works."],
];

const DATA_SOURCES = [
  ["GDC Data Portal", "Genomic and clinical data from TCGA and other NCI programs", "https://portal.gdc.cancer.gov/"],
  ["cBioPortal", "Mutations, copy number and survival across many studies", "https://www.cbioportal.org/"],
  ["DepMap", "Cancer cell line dependencies and drug sensitivity", "https://depmap.org/portal/"],
  ["COSMIC", "Catalogue of somatic mutations in cancer", "https://cancer.sanger.ac.uk/cosmic"],
  ["GEO", "Gene expression data sets", "https://www.ncbi.nlm.nih.gov/geo/"],
  ["Cancer Imaging Archive", "Radiology and pathology image collections", "https://www.cancerimagingarchive.net/"],
  ["ClinicalTrials.gov", "Registered trials and posted results", "https://clinicaltrials.gov/"],
];

const HEALER_GUIDE = [
  ["Refer to a clinic promptly if you see", "danger", [
    "A new lump or swelling anywhere in the body",
    "Weight loss or loss of appetite without a clear reason",
    "Unusual bleeding: in urine, stool or cough, or between periods",
    "A sore that doesn't heal, or a mole that changes",
    "A cough, pain or hoarseness lasting more than three weeks",
  ]],
  ["Work alongside medical care", "ok", [
    "Remedies should support surgery, chemotherapy or radiotherapy, never replace them.",
    "Delaying medical treatment lets cancer grow and can make it incurable.",
    "Ask permission to speak with the patient's doctor, and share what you give.",
  ]],
  ["Watch for interactions", "warn", [
    "Ask which medicines the patient takes before giving anything.",
    "St John's wort, grapefruit and plants containing berberine change drug levels.",
    "High-dose antioxidants may weaken radiotherapy and some chemotherapy.",
    "Stop any remedy that causes yellow eyes or skin, rash, bleeding or vomiting.",
  ]],
  ["Use the evidence", "accent", [
    "Each remedy in Kira shows how strong its research is. Most plant studies are still in cells or animals.",
    "Some remedies have human evidence for symptoms, such as ginger for nausea.",
    "No herb has been shown to cure cancer on its own.",
  ]],
];

(() => {
  const K = window.kira;
  const { $, esc } = K;
  let current = null;
  try { current = localStorage.getItem("kira-mode"); } catch {}
  if (!MODES[current]) current = null;

  // Static panels -----------------------------------------------------------
  $("#glossary-list").innerHTML = GLOSSARY.map(([w, d]) => `<div><dt>${esc(w)}</dt><dd>${esc(d)}</dd></div>`).join("");

  document.querySelectorAll(".data-sources-slot").forEach((slot) => {
    slot.innerHTML = `
      <h3>Public data for cancer research</h3>
      <div class="data-grid">${DATA_SOURCES.map(([name, desc, url]) => `
        <a class="data-link" href="${url}" target="_blank" rel="noopener"><strong>${esc(name)} ↗</strong><span>${esc(desc)}</span></a>`).join("")}
      </div>`;
  });

  $("#healer-guide").innerHTML = `
    <h3>Guidance for traditional healers</h3>
    <p class="muted">Traditional healers are often the first person someone with cancer talks to. These points help keep patients safe and get them to treatment in time.</p>
    <div class="healer-grid">${HEALER_GUIDE.map(([title, tone, items]) => `
      <div class="healer-block ${tone}"><h4>${esc(title)}</h4><ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("")}
    </div>`;

  // Picker ------------------------------------------------------------------
  const overlay = $("#mode-overlay");

  function openPicker() {
    $("#mode-cards").innerHTML = Object.entries(MODES).map(([key, m]) => `
      <button class="mode-card ${key === current ? "active" : ""}" data-mode="${key}">
        <span class="mode-icon">${m.icon}</span>
        <strong>${esc(m.label)}</strong>
        <small>${esc(m.sub)}</small>
        <span class="mode-desc">${esc(m.desc)}</span>
      </button>`).join("");
    overlay.hidden = false;
    $("#mode-cards .mode-card")?.focus();
  }

  function closePicker() {
    overlay.hidden = true;
    if (!current) apply("adult", { save: true, navigate: false });
  }

  overlay.addEventListener("click", (e) => {
    const card = e.target.closest("[data-mode]");
    if (card) { overlay.hidden = true; apply(card.dataset.mode, { save: true, navigate: true }); return; }
    if (e.target === overlay) closePicker();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !overlay.hidden) closePicker(); });
  $("#mode-switch").addEventListener("click", openPicker);
  document.addEventListener("click", (e) => { if (e.target.closest("[data-open-modes]")) openPicker(); });

  // Apply -------------------------------------------------------------------
  function apply(mode, { save, navigate }) {
    const cfg = MODES[mode];
    if (save) {
      current = mode;
      try { localStorage.setItem("kira-mode", mode); } catch {}
    }
    K.mode = mode;
    document.body.dataset.mode = mode;

    const nav = $("nav");
    const buttons = Object.fromEntries([...nav.querySelectorAll("button[data-view]")].map((b) => [b.dataset.view, b]));
    Object.values(buttons).forEach((b) => (b.hidden = true));
    cfg.nav.forEach((v) => { buttons[v].hidden = false; nav.appendChild(buttons[v]); });

    document.querySelectorAll("[data-modes]").forEach((el) => {
      el.hidden = !el.dataset.modes.split(" ").includes(mode);
    });

    $("#mode-current").textContent = cfg.label;
    $("#mode-switch .mode-icon").textContent = cfg.icon;
    $("#mode-banner").innerHTML = `
      <span class="mode-icon">${cfg.icon}</span>
      <p><strong>${esc(cfg.label)}.</strong> ${esc(cfg.banner)}</p>
      <button class="ghost small" data-open-modes>Change</button>`;
    K.setLitExamples(cfg.litExamples);
    document.dispatchEvent(new CustomEvent("kira:mode", { detail: mode }));
    if (navigate) K.show(cfg.landing);
  }

  K.modes = { open: openPicker };
  apply(current || "adult", { save: false, navigate: Boolean(current) && !K.initialView });
  if (!current) openPicker();
})();
