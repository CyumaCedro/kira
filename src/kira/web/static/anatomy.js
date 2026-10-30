"use strict";

// Body map for the cancer journey: a front-view figure with clickable organs.
// Each organ links to a journey cancer type where one exists, and shows where its cancers commonly spread.

const ORGANS = [
  {
    id: "brain", name: "Brain", cancer: "brain", q: "brain tumor",
    center: [100, 30],
    shape: '<ellipse cx="100" cy="30" rx="17" ry="13"/>',
    role: "Controls thought, movement, the senses and body functions.",
    types: "Gliomas (including glioblastoma) and meningiomas, which are usually benign. Cancers that spread here from elsewhere are more common than tumors that start here.",
    signs: "New persistent headaches, seizures, changes in vision or speech, weakness on one side.",
    spread: [], spreadText: "Rarely spreads outside the brain.",
  },
  {
    id: "thyroid", name: "Thyroid", q: "thyroid cancer",
    center: [100, 70],
    shape: '<ellipse cx="94.5" cy="70" rx="5" ry="4"/><ellipse cx="105.5" cy="70" rx="5" ry="4"/>',
    role: "Makes hormones that control metabolism.",
    types: "Papillary thyroid cancer is the most common type and is usually very treatable.",
    signs: "A lump in the neck, hoarseness, trouble swallowing.",
    spread: ["lungs", "marrow"], spreadText: "Neck lymph nodes, then lungs and bone in advanced cases.",
  },
  {
    id: "lungs", name: "Lungs", cancer: "lung", q: "lung cancer",
    center: [80, 112],
    shape: '<ellipse cx="80" cy="112" rx="16" ry="26"/><ellipse cx="120" cy="112" rx="16" ry="26"/>',
    role: "Bring oxygen into the blood and remove carbon dioxide.",
    types: "Non-small cell lung cancer (about 85% of cases) and small cell lung cancer.",
    signs: "A cough that won't go away, coughing up blood, shortness of breath, chest pain.",
    spread: ["brain", "marrow", "liver"], spreadText: "Brain, bone, liver and adrenal glands.",
  },
  {
    id: "breast", name: "Breast", cancer: "breast", q: "breast cancer",
    center: [128, 142],
    shape: '<circle cx="72" cy="142" r="9"/><circle cx="128" cy="142" r="9"/>',
    role: "Glandular tissue that can produce milk. Men have a small amount too.",
    types: "Ductal and lobular carcinoma. It also occurs in men, though rarely.",
    signs: "A new lump, skin dimpling, nipple changes or discharge.",
    spread: ["marrow", "lungs", "liver", "brain"], spreadText: "Bone, lungs, liver and brain.",
  },
  {
    id: "liver", name: "Liver", q: "hepatocellular carcinoma",
    center: [86, 168],
    shape: '<path d="M62 160 Q90 148 116 157 Q112 177 88 181 Q66 181 62 160Z"/>',
    role: "Filters the blood, stores energy, and makes bile and proteins.",
    types: "Hepatocellular carcinoma, linked to hepatitis B or C, heavy alcohol use and fatty liver disease. The liver is also a common place for other cancers to spread.",
    signs: "Yellow skin or eyes, a swollen belly, pain under the right ribs, weight loss.",
    spread: ["lungs", "marrow"], spreadText: "Lungs and bone.",
  },
  {
    id: "stomach", name: "Stomach", q: "gastric cancer",
    center: [126, 172],
    shape: '<path d="M114 159 Q136 154 135 172 Q133 187 116 185 Q123 174 114 166Z"/>',
    role: "Breaks food down with acid and enzymes.",
    types: "Adenocarcinoma, often linked to long-term H. pylori infection.",
    signs: "Indigestion that won't go away, feeling full early, unexplained weight loss.",
    spread: ["liver", "lungs"], spreadText: "Liver, the lining of the abdomen (peritoneum) and lungs.",
  },
  {
    id: "pancreas", name: "Pancreas", cancer: "pancreatic", q: "pancreatic cancer",
    center: [104, 189],
    shape: '<ellipse cx="104" cy="189" rx="18" ry="4.5" transform="rotate(-8 104 189)"/>',
    role: "Makes digestive enzymes and the hormone insulin.",
    types: "Pancreatic ductal adenocarcinoma (most common), and rarer neuroendocrine tumors that often grow more slowly.",
    signs: "Yellow skin, upper belly or back pain, new diabetes, weight loss.",
    spread: ["liver", "lungs"], spreadText: "Liver, the lining of the abdomen and lungs.",
  },
  {
    id: "kidneys", name: "Kidneys", q: "renal cell carcinoma",
    center: [136, 204],
    shape: '<ellipse cx="64" cy="204" rx="7" ry="11"/><ellipse cx="136" cy="204" rx="7" ry="11"/>',
    role: "Filter waste out of the blood to make urine.",
    types: "Renal cell carcinoma is the most common type.",
    signs: "Blood in the urine, pain in the side, a lump in the side or back.",
    spread: ["lungs", "marrow", "liver", "brain"], spreadText: "Lungs, bone, liver and brain.",
  },
  {
    id: "colon", name: "Colon & rectum", cancer: "colorectal", q: "colorectal cancer",
    center: [100, 199],
    stroke: true,
    shape: '<path d="M79 238 L79 205 Q79 199 85 199 L115 199 Q121 199 121 205 L121 238"/>',
    role: "Absorbs water and forms stool.",
    types: "Adenocarcinoma, which usually grows from polyps over several years. This is why removing polyps prevents it.",
    signs: "Blood in the stool, a lasting change in bowel habits, belly pain, anemia.",
    spread: ["liver", "lungs"], spreadText: "Liver, lungs and the lining of the abdomen.",
  },
  {
    id: "bladder", name: "Bladder", q: "bladder cancer",
    center: [100, 241],
    shape: '<ellipse cx="100" cy="241" rx="10" ry="7"/>',
    role: "Stores urine.",
    types: "Urothelial carcinoma. Smoking is the main risk factor.",
    signs: "Blood in the urine, needing to urinate often, pain when urinating.",
    spread: ["marrow", "lungs", "liver"], spreadText: "Lymph nodes, bone, lungs and liver.",
  },
  {
    id: "prostate", name: "Prostate", cancer: "prostate", q: "prostate cancer",
    center: [100, 254],
    shape: '<circle cx="100" cy="254" r="4.5"/>',
    role: "A gland in men that makes part of the fluid in semen.",
    types: "Adenocarcinoma. Many prostate cancers grow slowly.",
    signs: "Often none early on. Later: trouble urinating, blood in the urine, bone pain.",
    spread: ["marrow"], spreadText: "Bone and lymph nodes.",
  },
  {
    id: "skin", name: "Skin", cancer: "melanoma", q: "melanoma",
    center: [163, 176],
    shape: '<circle cx="163" cy="176" r="5"/>',
    role: "Protects the body. It is the largest organ.",
    types: "Basal cell and squamous cell carcinoma (common, rarely spread) and melanoma (less common, more dangerous).",
    signs: "A mole that changes size, shape or color, or a sore that doesn't heal.",
    spread: ["lungs", "liver", "brain"], spreadText: "Melanoma spreads to lymph nodes, lungs, liver and brain.",
  },
  {
    id: "marrow", name: "Bone marrow & blood", cancer: "leukemia", q: "leukemia",
    center: [84, 300],
    shape: '<rect x="80" y="272" width="8" height="58" rx="4"/><rect x="112" y="272" width="8" height="58" rx="4"/>',
    role: "Spongy tissue inside the bones that makes blood cells.",
    types: "Leukemias and myeloma start here. Lymphomas start in the lymph nodes. Bone is also a common place for other cancers to spread.",
    signs: "Tiredness, frequent infections, easy bruising or bleeding, fevers.",
    spread: [], spreadText: "Travels through the blood and can affect lymph nodes, the spleen and the brain.",
  },
];

const BODY = `
  <g class="silhouette">
    <ellipse cx="100" cy="36" rx="25" ry="29"/>
    <rect x="89" y="60" width="22" height="20" rx="6"/>
    <path d="M60 80 Q100 70 140 80 Q153 84 154 100 L150 200 Q147 236 141 262 L59 262 Q53 236 50 200 L46 100 Q47 84 60 80Z"/>
    <path d="M52 86 Q36 92 34 120 L26 200 L22 246 Q24 257 32 254 L38 204 L48 132Z"/>
    <path d="M148 86 Q164 92 166 120 L174 200 L178 246 Q176 257 168 254 L162 204 L152 132Z"/>
    <path d="M60 256 L99 256 L95 332 L91 410 Q89 422 77 420 L72 412 L70 332Z"/>
    <path d="M140 256 L101 256 L105 332 L109 410 Q111 422 123 420 L128 412 L130 332Z"/>
  </g>`;

(() => {
  const K = window.kira;
  const $ = K.$;
  const esc = K.esc;
  const byId = Object.fromEntries(ORGANS.map((o) => [o.id, o]));
  let selected = null;
  let onPick = () => {};

  function curve([x1, y1], [x2, y2]) {
    const mx = (x1 + x2) / 2 + (y2 - y1) * 0.22;
    const my = (y1 + y2) / 2 - (x2 - x1) * 0.22;
    return `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`;
  }

  function renderSvg() {
    const o = byId[selected];
    const spread = o ? o.spread : [];
    const lines = o ? spread.map((t) =>
      `<path class="spread-line" d="${curve(o.center, byId[t].center)}" marker-end="url(#arrow)"/>`).join("") : "";
    $("#anatomy-svg").innerHTML = `
      <svg viewBox="0 0 200 430" role="group" aria-label="Body map">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10z" class="arrow-head"/>
          </marker>
        </defs>
        <g class="${selected === "skin" ? "skin-active" : ""}">${BODY}</g>
        ${ORGANS.map((g) => `
          <g class="organ ${g.stroke ? "stroked" : ""} ${g.id === selected ? "selected" : ""} ${spread.includes(g.id) ? "spread-target" : ""}"
             data-organ="${g.id}" tabindex="0" role="button" aria-label="${esc(g.name)}" aria-pressed="${g.id === selected}">
            <title>${esc(g.name)}</title>${g.shape}
          </g>`).join("")}
        ${lines}
      </svg>`;
  }

  function renderInfo() {
    const o = byId[selected];
    if (!o) {
      $("#anatomy-info").innerHTML = `
        <h3>Explore the body</h3>
        <p class="muted">Click an organ on the figure, or pick one below, to see what it does, the cancers that start there, warning signs to get checked, and where those cancers tend to spread.</p>`;
      return;
    }
    const journey = o.cancer
      ? `<button class="primary small" data-follow="${o.cancer}">Follow this cancer's journey ↓</button>` : "";
    $("#anatomy-info").innerHTML = `
      <div class="eyebrow">${o.cancer ? "In the cancer journey" : "Research guide"}</div>
      <h3 class="organ-title">${esc(o.name)}</h3>
      <p>${esc(o.role)}</p>
      <dl class="organ-facts">
        <dt>Main cancers</dt><dd>${esc(o.types)}</dd>
        <dt>Signs to get checked</dt><dd>${esc(o.signs)}</dd>
        <dt>Where it can spread</dt><dd>${esc(o.spreadText)}${o.spread.length ? ' <span class="spread-key">Red arrows on the figure</span>' : ""}</dd>
      </dl>
      <div class="row wrap">
        ${journey}
        <button class="ghost small" data-research="${esc(o.q)}">Search research →</button>
      </div>
      <p class="muted small-text">These signs usually have other, harmless causes. See a doctor if one lasts more than a few weeks.</p>`;
  }

  function renderList() {
    $("#anatomy-organs").innerHTML = ORGANS.map((o) =>
      `<button class="chip ${o.id === selected ? "active" : ""}" data-organ="${o.id}">${esc(o.name)}</button>`).join("");
  }

  function select(id, { notify = true } = {}) {
    selected = byId[id] ? id : null;
    renderSvg();
    renderInfo();
    renderList();
    if (notify && selected) onPick(byId[selected]);
  }

  function handle(e) {
    const organ = e.target.closest("[data-organ]");
    if (organ) { select(organ.dataset.organ); return; }
    const follow = e.target.closest("[data-follow]");
    if (follow) { K.journey.setCancer(follow.dataset.follow); $("#journey-steps").scrollIntoView({ block: "center", behavior: "smooth" }); return; }
    const research = e.target.closest("[data-research]");
    if (research) {
      $("#journey-back-label").textContent = `Body map: ${byId[selected].name}`;
      K.show("literature");
      $("#journey-back").classList.remove("hidden");
      K.searchPapers(research.dataset.research);
    }
  }

  $("#anatomy").addEventListener("click", handle);
  $("#anatomy").addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches("g[data-organ]")) {
      e.preventDefault();
      select(e.target.dataset.organ);
    }
  });

  // Called by journey.js: keep the map in step with the cancer type picker.
  K.anatomy = {
    organForCancer: (cancer) => ORGANS.find((o) => o.cancer === cancer)?.id ?? null,
    show(cancer) {
      const id = this.organForCancer(cancer);
      if (id !== selected && (id || byId[selected]?.cancer)) select(id, { notify: false });
    },
    onPick(fn) { onPick = fn; },
  };

  select(null);
})();
