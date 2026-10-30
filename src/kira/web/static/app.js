"use strict";

// ---------- helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const LEVELS = [
  { name: "META_ANALYSIS", label: "Meta-analysis", rank: 7, desc: "Systematic reviews pooling many studies" },
  { name: "RCT", label: "RCT", rank: 6, desc: "Randomized controlled trials in patients" },
  { name: "CLINICAL_TRIAL", label: "Clinical trial", rank: 5, desc: "Early-phase or non-randomized trials" },
  { name: "OBSERVATIONAL", label: "Observational", rank: 4, desc: "Cohort and case-control studies" },
  { name: "CASE_REPORT", label: "Case report", rank: 3, desc: "Individual patients" },
  { name: "ANIMAL", label: "Animal", rank: 2, desc: "Mouse and rat models" },
  { name: "IN_VITRO", label: "In vitro", rank: 1, desc: "Cells grown in a dish" },
  { name: "UNKNOWN", label: "Unclassified", rank: 0, desc: "Reviews, editorials, or design not stated" },
];
const LEVEL = Object.fromEntries(LEVELS.map((l) => [l.name, l]));
const evColor = (name) => `var(--ev-${LEVEL[name]?.rank ?? 0})`;
const badge = (name) => `<span class="badge" style="background:${evColor(name)}">${esc(LEVEL[name]?.label ?? name)}</span>`;

async function api(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    let detail = res.statusText;
    try { detail = (await res.json()).detail ?? detail; } catch {}
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return res.json();
}

function status(el, kind, msg) {
  if (!kind) { el.innerHTML = ""; return; }
  const spin = kind === "loading" ? '<span class="spinner"></span>' : "";
  el.innerHTML = `<div class="status ${kind}">${spin}<span>${esc(msg)}</span></div>`;
}

function bars(el, entries, colorFn) {
  const max = Math.max(1, ...entries.map(([, n]) => n));
  el.innerHTML = entries.map(([label, n, key]) => `
    <div class="bar">
      <span>${esc(label)}</span>
      <div class="track"><div class="fill" style="width:${(n / max) * 100}%;background:${colorFn(key ?? label)}"></div></div>
      <span class="num">${n}</span>
    </div>`).join("") || '<p class="muted">None found.</p>';
}

function paperCard(p) {
  const authors = p.authors?.length ? esc(p.authors.join(", ")) + " · " : "";
  const abs = p.abstract ? `<p class="abstract clamp">${esc(p.abstract)}</p><button class="more">Show abstract</button>` : "";
  return `
    <article class="paper" style="--ev-color:${evColor(p.level)}">
      <div class="meta">${badge(p.level)}<span>${esc(p.year ?? "n.d.")}</span><span>${esc(p.journal)}</span></div>
      <h4><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)}</a></h4>
      <div class="meta">${authors}PMID ${esc(p.pmid)}</div>
      ${abs}
    </article>`;
}

document.addEventListener("click", (e) => {
  const more = e.target.closest(".paper .more");
  if (!more) return;
  const abs = more.previousElementSibling;
  abs.classList.toggle("clamp");
  more.textContent = abs.classList.contains("clamp") ? "Show abstract" : "Hide abstract";
});

// ---------- navigation & theme ----------
function show(view) {
  $$("nav button").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  $$(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${view}`));
  history.replaceState(null, "", `#${view}`);
  window.scrollTo(0, 0);
  document.dispatchEvent(new CustomEvent("kira:view", { detail: view }));
}
$$("nav button").forEach((b) => b.addEventListener("click", () => show(b.dataset.view)));
$$("[data-go]").forEach((a) => a.addEventListener("click", () => show(a.dataset.go)));

const THEME_KEY = "kira-theme";
try { const t = localStorage.getItem(THEME_KEY); if (t) document.documentElement.dataset.theme = t; } catch {}
$("#theme-toggle").addEventListener("click", () => {
  const current = document.documentElement.dataset.theme
    || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(THEME_KEY, next); } catch {}
});

$("#legend").innerHTML = LEVELS.map((l) => `<div>${badge(l.name)}<small>${esc(l.desc)}</small></div>`).join("");

// ---------- literature ----------
const lit = { results: [], filter: null };
const LIT_EXAMPLES = [
  "immunotherapy melanoma meta-analysis",
  "KRAS G12C inhibitor non-small cell lung cancer",
  "liquid biopsy ctDNA colorectal cancer",
  "deep learning histopathology",
  "exercise cancer survival",
];
$("#lit-examples").innerHTML = LIT_EXAMPLES.map((q) => `<button class="chip" data-q="${esc(q)}">${esc(q)}</button>`).join("");
$("#lit-examples").addEventListener("click", (e) => {
  const q = e.target.closest("[data-q]")?.dataset.q;
  if (q) { $("#lit-form [name=q]").value = q; searchPapers(q); }
});

$("#home-search").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = e.target.q.value.trim();
  if (!q) return;
  $("#lit-form [name=q]").value = q;
  show("literature");
  searchPapers(q);
});

$("#lit-form").addEventListener("submit", (e) => {
  e.preventDefault();
  searchPapers(e.target.q.value.trim());
});

async function searchPapers(q) {
  const max = $("#lit-form [name=max]").value;
  status($("#lit-status"), "loading", `Searching PubMed for "${q}"…`);
  $("#lit-results").innerHTML = "";
  $("#lit-toolbar").classList.add("hidden");
  try {
    const data = await api(`/api/papers?q=${encodeURIComponent(q)}&max=${max}`);
    lit.results = data.results.map((r, i) => ({ ...r, order: i }));
    lit.filter = null;
    if (!lit.results.length) { status($("#lit-status"), "empty", "No papers found. Try broader terms."); return; }
    status($("#lit-status"));
    $("#lit-toolbar").classList.remove("hidden");
    renderPapers();
  } catch (err) {
    status($("#lit-status"), "error", err.message);
  }
}

function renderPapers() {
  const counts = {};
  lit.results.forEach((r) => (counts[r.level] = (counts[r.level] || 0) + 1));
  $("#lit-filters").innerHTML =
    `<button class="chip ${lit.filter ? "" : "active"}" data-level="">All<span class="n">${lit.results.length}</span></button>` +
    LEVELS.filter((l) => counts[l.name]).map((l) =>
      `<button class="chip ${lit.filter === l.name ? "active" : ""}" data-level="${l.name}">${esc(l.label)}<span class="n">${counts[l.name]}</span></button>`).join("");

  const sort = $("#lit-sort").value;
  const rows = lit.results
    .filter((r) => !lit.filter || r.level === lit.filter)
    .sort((a, b) =>
      sort === "evidence" ? b.rank - a.rank || (b.year ?? 0) - (a.year ?? 0)
      : sort === "year" ? (b.year ?? 0) - (a.year ?? 0)
      : a.order - b.order);
  $("#lit-results").innerHTML = rows.map(paperCard).join("");
}
$("#lit-filters").addEventListener("click", (e) => {
  const chip = e.target.closest("[data-level]");
  if (chip) { lit.filter = chip.dataset.level || null; renderPapers(); }
});
$("#lit-sort").addEventListener("change", renderPapers);

// ---------- remedies ----------
let currentRemedy = null;
let currentRemedySmiles = null;
let remedyList = [];

async function loadRemedies() {
  try {
    const list = (remedyList = await api("/api/remedies"));
    $("#remedy-grid").innerHTML = list.map((r) =>
      `<button class="remedy-card" data-key="${esc(r.key)}"><strong>${esc(r.name)}</strong><span>${esc(r.source)}</span></button>`).join("");
  } catch (err) {
    $("#remedy-grid").innerHTML = `<div class="status error">${esc(err.message)}</div>`;
  }
}
$("#remedy-grid").addEventListener("click", (e) => {
  const card = e.target.closest("[data-key]");
  if (card) openRemedy(card.dataset.key);
});

async function openRemedy(key, cancer = "") {
  if (!remedyList.length) await loadRemedies();
  const r = remedyList.find((x) => x.key === key);
  if (!r) return;
  currentRemedy = key;
  $("#remedy-name").textContent = r.name;
  $("#remedy-source").textContent = r.source;
  $("#remedy-form [name=cancer]").value = cancer;
  $("#remedy-grid").classList.add("hidden");
  $("#remedy-detail").classList.remove("hidden");
  runReview();
}
$("#remedy-back").addEventListener("click", () => {
  $("#remedy-detail").classList.add("hidden");
  $("#remedy-grid").classList.remove("hidden");
});
$("#remedy-form").addEventListener("submit", (e) => { e.preventDefault(); runReview(); });

async function runReview() {
  const cancer = $("#remedy-form [name=cancer]").value.trim();
  status($("#remedy-status"), "loading", "Searching PubMed and classifying studies… this takes a few seconds.");
  $("#remedy-body").classList.add("hidden");
  $("#remedy-papers").innerHTML = "";
  try {
    const q = cancer ? `?cancer=${encodeURIComponent(cancer)}` : "";
    const d = await api(`/api/remedies/${encodeURIComponent(currentRemedy)}${q}`);
    status($("#remedy-status"));
    $("#remedy-body").classList.remove("hidden");

    const best = Math.max(0, ...d.articles.map((a) => a.rank));
    const v = $("#remedy-verdict");
    v.textContent = d.verdict;
    v.className = "verdict " + (best >= 6 ? "strong" : best >= 4 ? "mid" : "weak");

    bars($("#remedy-bars"), LEVELS.filter((l) => d.counts[l.name]).map((l) => [l.label, d.counts[l.name], l.name]), evColor);
    $("#remedy-query").textContent = d.query;
    $("#remedy-cautions").innerHTML =
      d.cautions.map((c) => `<li class="specific">${esc(c)}</li>`).join("") +
      d.general_cautions.map((c) => `<li>${esc(c)}</li>`).join("");

    currentRemedySmiles = d.smiles;
    $("#remedy-screen").classList.toggle("hidden", !d.smiles);
    $("#remedy-papers").innerHTML = d.articles.length
      ? `<h3 style="margin-top:8px">Papers, strongest evidence first (${d.articles.length})</h3>` + d.articles.map(paperCard).join("")
      : "";
  } catch (err) {
    status($("#remedy-status"), "error", err.message);
  }
}
$("#remedy-screen").addEventListener("click", () => {
  if (!currentRemedySmiles) return;
  show("drugs");
  $("#smiles-form [name=smiles]").value = currentRemedySmiles;
  analyzeSmiles(currentRemedySmiles);
});

// ---------- genomics ----------
let vcfData = null;

async function runVcf(fetcher) {
  status($("#vcf-status"), "loading", "Parsing variants…");
  $("#vcf-body").classList.add("hidden");
  try {
    vcfData = await fetcher();
    status($("#vcf-status"));
    renderVcf();
  } catch (err) {
    status($("#vcf-status"), "error", err.message);
  }
}
$("#vcf-file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const form = new FormData();
  form.append("file", file);
  runVcf(() => api(`/api/vcf?exome_mb=${$("#vcf-mb").value}`, { method: "POST", body: form }));
  e.target.value = "";
});
$("#vcf-sample").addEventListener("click", () => runVcf(() => api(`/api/vcf/sample?exome_mb=${$("#vcf-mb").value}`)));
$("#vcf-drivers").addEventListener("change", renderVcfTable);

function renderVcf() {
  const d = vcfData;
  $("#vcf-body").classList.remove("hidden");
  const high = d.tmb >= 10;
  $("#vcf-stats").innerHTML = `
    <div class="stat"><div class="label">Variants</div><div class="value">${d.total}</div></div>
    <div class="stat"><div class="label">Passed filters</div><div class="value">${d.passed}</div></div>
    <div class="stat"><div class="label">TMB (mut/Mb, ${d.exome_mb} Mb)</div><div class="value">${d.tmb}</div>
      <div class="note ${high ? "high" : "low"}">${high ? "TMB-high (≥10)" : "Below TMB-high threshold"}</div></div>
    <div class="stat"><div class="label">Driver genes hit</div><div class="value">${Object.keys(d.gene_hits).length}</div></div>`;
  bars($("#vcf-genes"), Object.entries(d.gene_hits), () => "var(--accent)");
  renderVcfTable();
}

function renderVcfTable() {
  if (!vcfData) return;
  const onlyDrivers = $("#vcf-drivers").checked;
  const rows = vcfData.variants.filter((v) => !onlyDrivers || v.driver);
  $("#vcf-table").innerHTML =
    "<thead><tr><th>Chrom</th><th>Position</th><th>Ref</th><th>Alt</th><th>Gene</th><th>Consequence</th><th>Filter</th></tr></thead><tbody>" +
    rows.map((v) => `<tr class="${v.driver ? "driver" : ""}">
      <td>${esc(v.chrom)}</td><td class="mono">${v.pos.toLocaleString()}</td>
      <td class="mono">${esc(v.ref)}</td><td class="mono">${esc(v.alt)}</td>
      <td>${v.gene ? (v.driver ? `<strong>${esc(v.gene)}</strong>` : esc(v.gene)) : "—"}</td>
      <td>${esc((v.consequence ?? "—").replaceAll("_", " "))}</td>
      <td><span class="pill ${v.filter === "PASS" ? "pass" : "fail"}">${esc(v.filter)}</span></td></tr>`).join("") +
    "</tbody>";
}

// ---------- imaging ----------
let imgBlob = null;
let imgBitmap = null;

$("#img-min").addEventListener("input", (e) => { $("#img-min-val").textContent = `${Math.round(e.target.value * 100)}%`; });
$("#img-min").addEventListener("change", () => imgBlob && runTiles());
$("#img-size").addEventListener("change", () => imgBlob && runTiles());
$("#img-file").addEventListener("change", (e) => {
  if (e.target.files[0]) { imgBlob = e.target.files[0]; runTiles(); }
  e.target.value = "";
});
$("#img-sample").addEventListener("click", async () => {
  status($("#img-status"), "loading", "Generating sample slide…");
  imgBlob = await (await fetch("/api/sample/slide.png")).blob();
  runTiles();
});

async function runTiles() {
  status($("#img-status"), "loading", "Detecting tissue and tiling…");
  try {
    const form = new FormData();
    form.append("file", imgBlob, imgBlob.name || "image.png");
    const size = $("#img-size").value;
    const min = $("#img-min").value;
    const [d, bmp] = await Promise.all([
      api(`/api/tiles?size=${size}&min_tissue=${min}`, { method: "POST", body: form }),
      createImageBitmap(imgBlob),
    ]);
    imgBitmap = bmp;
    status($("#img-status"));
    $("#img-body").classList.remove("hidden");
    $("#img-stats").innerHTML = `
      <div class="stat"><div class="label">Image size</div><div class="value">${d.width}×${d.height}</div></div>
      <div class="stat"><div class="label">Tissue coverage</div><div class="value">${Math.round(d.tissue_fraction * 100)}%</div></div>
      <div class="stat"><div class="label">Tissue tiles (${d.size}px)</div><div class="value">${d.tiles.length}</div></div>`;
    drawTiles(d);
  } catch (err) {
    status($("#img-status"), "error", err.message);
  }
}

function drawTiles(d) {
  const canvas = $("#img-canvas");
  canvas.width = d.width;
  canvas.height = d.height;
  const ctx = canvas.getContext("2d");
  // The server may have downscaled a large image; draw at the server's size so tile coordinates line up.
  ctx.drawImage(imgBitmap, 0, 0, d.width, d.height);
  ctx.fillStyle = "rgba(255,255,255,.45)";
  ctx.fillRect(0, 0, d.width, d.height);
  const lw = Math.max(1, d.width / 600);
  for (const t of d.tiles) {
    ctx.drawImage(imgBitmap, t.x * imgBitmap.width / d.width, t.y * imgBitmap.height / d.height,
      d.size * imgBitmap.width / d.width, d.size * imgBitmap.height / d.height, t.x, t.y, d.size, d.size);
    ctx.strokeStyle = `rgba(15,118,110,${0.4 + 0.6 * t.tissue})`;
    ctx.lineWidth = lw;
    ctx.strokeRect(t.x + lw / 2, t.y + lw / 2, d.size - lw, d.size - lw);
  }
}

// ---------- drug discovery ----------
const SMILES_EXAMPLES = [
  ["Sulforaphane", "CS(=O)CCCCN=C=S"],
  ["Resveratrol", "C1=CC(=CC=C1/C=C/C2=CC(=CC(=C2)O)O)O"],
  ["Curcumin", "COC1=C(C=CC(=C1)/C=C/C(=O)CC(=O)/C=C/C2=CC(=C(C=C2)O)OC)O"],
  ["Imatinib", "CC1=C(C=C(C=C1)NC(=O)C2=CC=C(C=C2)CN3CCN(CC3)C)NC4=NC=CC(=N4)C5=CN=CC=C5"],
  ["Paclitaxel", "CC1=C2C(C(=O)C3(C(CC4C(C3C(C(C2(C)C)(CC1OC(=O)C(C(C5=CC=CC=C5)NC(=O)C6=CC=CC=C6)O)O)OC(=O)C7=CC=CC=C7)(CO4)OC(=O)C)O)C)OC(=O)C"],
];
$("#smiles-examples").innerHTML = SMILES_EXAMPLES.map(([n, s]) => `<button class="chip" data-smiles="${esc(s)}">${esc(n)}</button>`).join("");
$("#smiles-examples").addEventListener("click", (e) => {
  const s = e.target.closest("[data-smiles]")?.dataset.smiles;
  if (s) { $("#smiles-form [name=smiles]").value = s; analyzeSmiles(s); }
});
$("#smiles-form").addEventListener("submit", (e) => { e.preventDefault(); analyzeSmiles(e.target.smiles.value.trim()); });

const DESC_RULES = [
  ["mol_weight", "Molecular weight", 500, "Da"],
  ["logp", "logP (lipophilicity)", 5, ""],
  ["h_donors", "H-bond donors", 5, ""],
  ["h_acceptors", "H-bond acceptors", 10, ""],
  ["tpsa", "Polar surface area", 140, "Å²"],
  ["rotatable_bonds", "Rotatable bonds", 10, ""],
];

async function analyzeSmiles(smiles) {
  status($("#smiles-status"), "loading", "Computing descriptors…");
  $("#smiles-body").classList.add("hidden");
  try {
    const d = await api(`/api/druglike?smiles=${encodeURIComponent(smiles)}`);
    status($("#smiles-status"));
    $("#smiles-body").classList.remove("hidden");
    $("#smiles-svg").innerHTML = d.svg;
    const v = $("#smiles-verdict");
    v.className = "verdict " + (d.druglike ? "strong" : "weak");
    const broken = [...d.lipinski, ...d.veber];
    v.textContent = d.druglike
      ? `Drug-like${broken.length ? ` (1 Lipinski rule broken: ${broken.join(", ")})` : ": passes Lipinski and Veber rules"}`
      : `Not drug-like: ${broken.join(", ")}`;
    $("#smiles-table").innerHTML = "<thead><tr><th>Property</th><th>Limit</th><th>Value</th></tr></thead><tbody>" +
      DESC_RULES.map(([k, label, limit, unit]) => {
        const val = d.descriptors[k];
        const ok = val <= limit;
        return `<tr><td>${label}</td><td class="muted">≤ ${limit} ${unit}</td><td><span class="pill ${ok ? "pass" : "fail"}">${val}</span></td></tr>`;
      }).join("") + "</tbody>";
  } catch (err) {
    status($("#smiles-status"), "error", err.message);
  }
}

$("#target-form").addEventListener("submit", (e) => {
  e.preventDefault();
  findTargets(e.target.gene.value.trim());
});

async function findTargets(gene) {
  $("#target-form [name=gene]").value = gene;
  $("#target-form").scrollIntoView({ block: "center", behavior: "smooth" });
  status($("#target-status"), "loading", `Searching ChEMBL for ${gene}…`);
  $("#target-list").innerHTML = "";
  $("#activity-table").innerHTML = "";
  status($("#activity-status"));
  try {
    const targets = await api(`/api/chembl/targets?gene=${encodeURIComponent(gene)}`);
    if (!targets.length) { status($("#target-status"), "empty", "No human targets found."); return; }
    status($("#target-status"), "empty", "Pick a target to load its most potent compounds:");
    $("#target-list").innerHTML = targets.slice(0, 12).map((t) =>
      `<button class="chip" data-target="${esc(t.chembl_id)}" title="${esc(t.type)}">${esc(t.name)} <span class="n">${esc(t.chembl_id)}</span></button>`).join("");
  } catch (err) {
    status($("#target-status"), "error", err.message);
  }
}

$("#target-list").addEventListener("click", async (e) => {
  const chip = e.target.closest("[data-target]");
  if (!chip) return;
  $$("#target-list .chip").forEach((c) => c.classList.toggle("active", c === chip));
  status($("#activity-status"), "loading", "Loading IC50 measurements…");
  $("#activity-table").innerHTML = "";
  try {
    const acts = await api(`/api/chembl/activities?target=${encodeURIComponent(chip.dataset.target)}`);
    if (!acts.length) { status($("#activity-status"), "empty", "No IC50 data with pChEMBL values for this target."); return; }
    status($("#activity-status"), "empty", "pChEMBL = −log₁₀(molar IC50). Above 6 means sub-micromolar; above 8 is very potent. Click a row to check drug-likeness.");
    $("#activity-table").innerHTML = "<thead><tr><th>Molecule</th><th>pChEMBL</th><th>IC50</th><th>SMILES</th></tr></thead><tbody>" +
      acts.map((a) => `<tr class="clickable" data-smiles="${esc(a.smiles ?? "")}">
        <td><a href="https://www.ebi.ac.uk/chembl/compound_report_card/${esc(a.molecule)}/" target="_blank" rel="noopener">${esc(a.molecule)}</a></td>
        <td><strong>${a.pchembl ?? "—"}</strong></td><td>${esc(a.value ?? "")} ${esc(a.units ?? "")}</td>
        <td class="mono">${esc((a.smiles ?? "").slice(0, 60))}${(a.smiles ?? "").length > 60 ? "…" : ""}</td></tr>`).join("") + "</tbody>";
  } catch (err) {
    status($("#activity-status"), "error", err.message);
  }
});
$("#activity-table").addEventListener("click", (e) => {
  if (e.target.closest("a")) return;
  const s = e.target.closest("tr[data-smiles]")?.dataset.smiles;
  if (s) { $("#smiles-form [name=smiles]").value = s; analyzeSmiles(s); window.scrollTo({ top: 0, behavior: "smooth" }); }
});

// ---------- init ----------
// Hooks used by journey.js to drive the tools.
window.kira = { $, esc, show, searchPapers, openRemedy, findTargets };

loadRemedies();
function showFromHash() {
  const view = location.hash.slice(1);
  show(view && $(`#view-${view}`) ? view : "journey");
}
window.addEventListener("hashchange", showFromHash);
showFromHash();
