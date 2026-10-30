"use strict";

// The cancer journey: nine stages from prevention to advanced care, each linked to Kira's tools.
// Content is general education, written for patients, families and researchers. Not medical advice.

const CANCERS = {
  general: {
    label: "All cancers",
    term: "cancer",
    biomarkers: ["TP53", "KRAS", "EGFR", "BRAF", "PIK3CA"],
  },
  breast: {
    label: "Breast",
    term: "breast cancer",
    risk: "Inherited BRCA1/BRCA2 variants, age, hormonal factors and alcohol.",
    screening: "Mammography. MRI is added for some people at high inherited risk.",
    markers: "Hormone receptors (ER/PR) and HER2 status guide treatment choices.",
    biomarkers: ["ERBB2", "ESR1", "BRCA1", "BRCA2", "PIK3CA"],
  },
  lung: {
    label: "Lung",
    term: "lung cancer",
    risk: "Smoking, radon, air pollution and asbestos.",
    screening: "Low-dose CT for people with a significant smoking history.",
    markers: "Driver mutations (EGFR, ALK, KRAS and others) and PD-L1 level guide treatment choices.",
    biomarkers: ["EGFR", "ALK", "KRAS", "MET", "RET"],
  },
  colorectal: {
    label: "Colorectal",
    term: "colorectal cancer",
    risk: "Lynch syndrome, inflammatory bowel disease, processed meat and physical inactivity.",
    screening: "Colonoscopy, or stool tests such as FIT and stool DNA.",
    markers: "Mismatch-repair (MSI) status flags tumors likely to respond to immunotherapy. RAS status decides anti-EGFR antibody use.",
    biomarkers: ["KRAS", "NRAS", "BRAF", "ERBB2"],
  },
  prostate: {
    label: "Prostate",
    term: "prostate cancer",
    risk: "Age, family history, BRCA2 variants and African ancestry.",
    screening: "PSA blood test, as a shared decision with a doctor.",
    markers: "Grade Group (Gleason) and PSA level set the risk group. BRCA alterations can open PARP-inhibitor options.",
    biomarkers: ["AR", "BRCA2", "ATM", "PTEN"],
  },
  melanoma: {
    label: "Melanoma",
    term: "melanoma",
    risk: "UV exposure, sunburns, many moles and fair skin.",
    screening: "Skin checks for new or changing moles (the ABCDE signs).",
    markers: "BRAF V600 status decides eligibility for BRAF/MEK inhibitors.",
    biomarkers: ["BRAF", "NRAS", "KIT", "MAP2K1"],
  },
  pancreatic: {
    label: "Pancreatic",
    term: "pancreatic cancer",
    risk: "Smoking, diabetes, chronic pancreatitis and inherited BRCA2 or CDKN2A variants.",
    screening: "No routine screening. Surveillance programs exist for people at high inherited risk.",
    markers: "Germline genetic testing is recommended for every patient. BRCA variants can open PARP-inhibitor options.",
    biomarkers: ["KRAS", "BRCA2", "NTRK1"],
  },
  brain: {
    label: "Brain tumors",
    term: "brain tumor",
    risk: "Few known causes: earlier radiation to the head and rare inherited syndromes such as NF1 and Li-Fraumeni.",
    screening: "No screening for the general population. MRI is used when symptoms such as headaches, seizures or vision changes appear.",
    staging: "Graded (WHO grade 1 to 4) instead of staged with TNM, because they rarely spread outside the brain. Many, such as most meningiomas, are benign but can still need treatment because of where they grow.",
    markers: "IDH mutation, 1p/19q codeletion and MGMT methylation classify gliomas and guide treatment.",
    biomarkers: ["IDH1", "IDH2", "EGFR", "BRAF"],
  },
  leukemia: {
    label: "Leukemia",
    term: "leukemia",
    risk: "Earlier chemotherapy or radiation, benzene exposure, smoking and some inherited conditions such as Down syndrome.",
    screening: "No screening. Leukemia is often first found through a routine blood count.",
    staging: "No solid tumor forms, so TNM staging doesn't apply. Instead it is classified by cell type (myeloid or lymphoid, acute or chronic), genetic changes and risk group.",
    markers: "Changes such as FLT3, NPM1 and IDH1/2 mutations and the BCR-ABL fusion guide targeted treatment.",
    biomarkers: ["FLT3", "IDH1", "ABL1", "BTK", "JAK2"],
  },
};

const TUMOR_TYPES = [
  {
    kind: "benign",
    title: "Benign tumors",
    tag: "Not cancer",
    text: "Grow, but don't invade nearby tissue or spread. Usually not life-threatening, though location matters: a benign brain tumor can still press on the brain.",
    examples: ["Lipoma (fatty lump)", "Uterine fibroids", "Most meningiomas", "Ordinary moles"],
    research: [
      { label: "Meningioma outcomes", q: "meningioma treatment outcomes" },
      { label: "Fibroid treatments", q: "uterine fibroids treatment randomized trial" },
    ],
  },
  {
    kind: "pre",
    title: "Precancerous growths",
    tag: "Can become cancer",
    text: "Not cancer yet, but can turn into cancer over years. Finding and removing them is one of the most effective ways to prevent cancer.",
    examples: ["Colon polyps (adenomas)", "Cervical dysplasia (CIN)", "Barrett's esophagus", "DCIS (stage 0 breast)"],
    research: [
      { label: "Polyp to cancer", q: "colorectal adenoma progression to carcinoma" },
      { label: "Cervical precancer", q: "cervical intraepithelial neoplasia HPV progression" },
    ],
  },
  {
    kind: "malignant",
    title: "Malignant tumors",
    tag: "Cancer",
    text: "Invade nearby tissue and can spread through blood or lymph to other organs (metastasis). This is what \"cancer\" means.",
    examples: ["Carcinomas (organ linings, the most common)", "Sarcomas (bone, muscle)", "Gliomas (brain)", "Lymphomas and myeloma"],
    research: [
      { label: "How cancers spread", q: "metastasis mechanisms review" },
      { label: "Sarcoma research", q: "soft tissue sarcoma treatment" },
    ],
  },
];

const PHASES = [
  { name: "Before diagnosis", stages: [0, 1] },
  { name: "Diagnosis", stages: [2, 3, 4] },
  { name: "Treatment", stages: [5, 6] },
  { name: "After treatment", stages: [7, 8] },
];

const STAGES = [
  {
    short: "Prevention",
    title: "Prevention & risk",
    icon: "◌",
    summary: "Most cancers develop over many years. Risk comes from inherited genes, environment and lifestyle, and some of it can be lowered.",
    cancerNote: "risk",
    what: [
      "Not smoking is the largest single way to lower cancer risk.",
      "Vaccines against HPV and hepatitis B prevent cancers caused by those viruses.",
      "Inherited variants (for example BRCA1/2 or Lynch syndrome) raise risk and can be found with genetic testing.",
      "A healthy weight, regular activity and less alcohol lower the risk of several cancers.",
    ],
    questions: [
      "Does my family history suggest inherited risk worth genetic counseling?",
      "Which vaccines or lifestyle changes matter most for me?",
      "When should I start screening?",
    ],
    actions: [
      { type: "papers", label: "Risk factor meta-analyses", q: "{cancer} risk factors meta-analysis" },
      { type: "papers", label: "Prevention trials", q: "{cancer} prevention randomized controlled trial" },
      { type: "remedy", label: "Sulforaphane (broccoli)", key: "sulforaphane" },
      { type: "remedy", label: "Green tea (EGCG)", key: "egcg" },
    ],
  },
  {
    short: "Screening",
    title: "Screening & early detection",
    icon: "◎",
    summary: "Screening looks for cancer before symptoms appear, when it is usually easier to treat.",
    cancerNote: "screening",
    what: [
      "Screening with proven benefit exists for breast, cervical and colorectal cancer, and for lung cancer in people who have smoked heavily.",
      "Screening can also find slow cancers that would never have caused harm (overdiagnosis), so the benefit depends on the test and the person.",
      "Blood tests that detect tumor DNA from many cancers at once are under study. They have not yet been shown to reduce deaths.",
    ],
    questions: [
      "Which screening tests are recommended for my age and risk?",
      "What happens if a result is abnormal?",
      "How likely is a false alarm?",
    ],
    actions: [
      { type: "papers", label: "Screening trials", q: "{cancer} screening mortality randomized trial" },
      { type: "papers", label: "Blood-based early detection", q: "multi-cancer early detection cell-free DNA" },
    ],
  },
  {
    short: "Diagnosis",
    title: "Diagnosis",
    icon: "▦",
    summary: "Cancer is confirmed when a pathologist examines tissue under the microscope.",
    what: [
      "Imaging (CT, MRI, ultrasound, PET) finds and measures suspicious areas.",
      "A biopsy removes a small tissue sample for the pathologist.",
      "The pathology report gives the cancer type and its grade, meaning how abnormal the cells look.",
      "AI models trained on digitized slides are being developed to help detect and grade cancer.",
    ],
    questions: [
      "What type of cancer is it, and what is its grade?",
      "Would a second pathology opinion be worthwhile?",
      "Which other tests do I need?",
    ],
    actions: [
      { type: "tool", label: "Try tissue detection on a sample slide", view: "imaging", sample: "#img-sample" },
      { type: "papers", label: "AI in pathology", q: "deep learning histopathology {cancer} diagnosis" },
    ],
  },
  {
    short: "Staging",
    title: "Staging",
    icon: "◐",
    summary: "Staging describes how large the cancer is and how far it has spread. It is the main guide to treatment and outlook.",
    staging: true,
    cancerNote: "staging",
    what: [
      "T describes the size and extent of the main tumor.",
      "N describes whether cancer has reached nearby lymph nodes.",
      "M describes whether it has spread (metastasized) to distant organs.",
      "Stage (how far it has spread) is different from grade (how abnormal the cells look).",
    ],
    questions: [
      "What is my stage, and how was it determined?",
      "How does the stage change my treatment options?",
    ],
    actions: [
      { type: "papers", label: "Stage and survival studies", q: "{cancer} stage survival prognosis" },
    ],
  },
  {
    short: "Profiling",
    title: "Molecular profiling",
    icon: "≋",
    summary: "Testing the tumor's DNA and proteins shows which changes drive it. Some of those changes have matching targeted drugs.",
    cancerNote: "markers",
    biomarkers: true,
    what: [
      "Tumor sequencing finds driver mutations in genes such as EGFR, KRAS or BRAF.",
      "Biomarkers such as HER2, PD-L1, mismatch-repair status and tumor mutational burden (TMB) predict response to specific treatments.",
      "Germline (inherited) testing can matter for both the patient and their family.",
    ],
    questions: [
      "Has my tumor been tested for biomarkers?",
      "Are any results matched to approved drugs or clinical trials?",
      "Should I have germline genetic testing?",
    ],
    actions: [
      { type: "tool", label: "Analyze a sample tumor VCF", view: "genomics", sample: "#vcf-sample" },
      { type: "papers", label: "Biomarker-guided therapy", q: "{cancer} biomarker targeted therapy" },
    ],
  },
  {
    short: "Treatment",
    title: "Treatment",
    icon: "✚",
    summary: "Treatment is usually a combination, chosen by cancer type, stage and biomarkers.",
    what: [
      "Surgery removes tumors that haven't spread.",
      "Radiotherapy uses targeted radiation to destroy cancer cells in one area.",
      "Chemotherapy kills fast-dividing cells throughout the body.",
      "Targeted therapy blocks specific drivers, such as EGFR or BRAF inhibitors.",
      "Immunotherapy (checkpoint inhibitors) helps the immune system attack cancer.",
      "Hormone therapy treats hormone-driven cancers such as breast and prostate cancer.",
    ],
    questions: [
      "Is the goal of treatment cure, control or comfort?",
      "What are the main side effects, and how are they managed?",
      "Is there a clinical trial I could join?",
    ],
    actions: [
      { type: "papers", label: "Immunotherapy trials", q: "{cancer} immunotherapy randomized controlled trial" },
      { type: "papers", label: "Targeted therapy phase III", q: "{cancer} targeted therapy phase III" },
      { type: "tool", label: "Screen a compound's drug-likeness", view: "drugs" },
      { type: "link", label: "Find clinical trials", url: "https://clinicaltrials.gov/search?cond={cancer}" },
    ],
  },
  {
    short: "Support",
    title: "Supportive & integrative care",
    icon: "✿",
    summary: "Supportive care treats symptoms and side effects. Integrative therapies are used alongside standard treatment, never instead of it.",
    caution: "Some supplements interfere with cancer treatment. St John's wort, high-dose antioxidants and berberine can change how chemotherapy or radiotherapy works. Tell the care team about everything you take.",
    what: [
      "Exercise has strong evidence for reducing cancer-related fatigue.",
      "Ginger and acupuncture have been studied for chemotherapy-related nausea.",
      "Mistletoe and medicinal mushrooms have been studied for quality of life.",
      "Psychological support, nutrition advice and pain management are part of good care.",
    ],
    questions: [
      "Which supplements are safe with my treatment?",
      "Can I get help with nausea, fatigue, pain or mood?",
      "Is there an integrative oncology service here?",
    ],
    actions: [
      { type: "remedy", label: "Ginger", key: "ginger" },
      { type: "remedy", label: "Mistletoe", key: "mistletoe" },
      { type: "remedy", label: "Medicinal mushrooms", key: "medicinal mushrooms" },
      { type: "papers", label: "Exercise for fatigue", q: "exercise cancer-related fatigue meta-analysis" },
      { type: "papers", label: "Acupuncture for nausea", q: "acupuncture chemotherapy-induced nausea randomized" },
    ],
  },
  {
    short: "Survivorship",
    title: "Survivorship & monitoring",
    icon: "☀",
    summary: "After treatment, follow-up watches for the cancer coming back and manages long-term effects.",
    what: [
      "Regular check-ups and scans, on a schedule set by cancer type and stage.",
      "Blood tests for circulating tumor DNA (ctDNA) can detect leftover disease and are being studied to guide further treatment.",
      "Physical activity is linked to lower recurrence for several cancers.",
      "Long-term effects on the heart, nerves, energy and emotional health need ongoing attention.",
    ],
    questions: [
      "What is my follow-up schedule?",
      "Which symptoms should I report right away?",
      "What can I do to lower my risk of recurrence?",
    ],
    actions: [
      { type: "papers", label: "ctDNA after treatment", q: "ctDNA minimal residual disease {cancer}" },
      { type: "papers", label: "Activity and recurrence", q: "physical activity {cancer} survivors recurrence" },
      { type: "remedy", label: "Vitamin D", key: "vitamin d" },
      { type: "remedy", label: "Omega-3", key: "omega-3 fatty acids" },
    ],
  },
  {
    short: "Advanced",
    title: "Advanced cancer & palliative care",
    icon: "❖",
    summary: "When cancer has spread or returned, treatment focuses on control and quality of life. Many people live for years with advanced cancer.",
    what: [
      "Systemic treatment (drugs that reach the whole body) aims to control the cancer's spread.",
      "Clinical trials can give access to new therapies.",
      "Palliative care treats symptoms at any stage. In a randomized trial in metastatic lung cancer, starting it early improved quality of life.",
      "Hospice care focuses fully on comfort when that becomes the priority.",
    ],
    questions: [
      "What are my options, including clinical trials?",
      "Can I see a palliative care team now?",
      "What matters most to me in my care?",
    ],
    actions: [
      { type: "papers", label: "Early palliative care", q: "early palliative care randomized trial" },
      { type: "papers", label: "Metastatic disease outcomes", q: "metastatic {cancer} overall survival" },
      { type: "link", label: "Find clinical trials", url: "https://clinicaltrials.gov/search?cond={cancer}" },
    ],
  },
];

// Per-mode content for each stage, in the same order as STAGES. Adult mode uses the stage's own summary and questions.
const POINT_TITLES = {
  adult: "Questions to ask the care team",
  student: "Think about it",
  practitioner: "Clinical focus",
  researcher: "Open research questions",
  healer: "Working alongside medical care",
};

const STAGE_MODES = [
  {
    student: {
      summary: "Cancer usually takes many years to develop. Some things raise the chance of getting it, like smoking or too much sun, and some things lower it.",
      points: ["Which everyday habits could lower your cancer risk later in life?", "Why does the HPV vaccine, usually given to teenagers, prevent some cancers?", "How can a gene passed down in a family raise cancer risk?"],
    },
    practitioner: ["Take a three-generation family history and refer for genetic counseling when criteria are met.", "Check HPV and hepatitis B vaccination status.", "Offer smoking cessation support, the highest-yield prevention measure."],
    researcher: ["Which risk factors explain the rise of some cancers in adults under 50?", "Can polygenic risk scores improve on family history alone?", "How do diet and the gut microbiome interact with cancer risk?"],
    healer: ["Encourage stopping tobacco and limiting alcohol. These lower risk more than any remedy.", "Support vaccination against HPV and hepatitis B in your community.", "Families with many cancer cases may carry an inherited risk. Refer them for medical advice."],
  },
  {
    student: {
      summary: "Screening means checking healthy people for early signs of cancer before they feel sick. Finding cancer early makes it much easier to treat.",
      points: ["Why is finding cancer early so important?", "What is a false alarm, and why can screening cause them?", "Which screening tests exist, and at what age do they start?"],
    },
    practitioner: ["Apply age- and risk-based screening intervals from current guidelines.", "Discuss overdiagnosis and false positives in shared decision-making.", "Track abnormal results through to diagnostic follow-up."],
    researcher: ["Do multi-cancer blood tests reduce cancer deaths, or only find more cancer?", "How can screening reach people who currently miss it?", "Can AI reading of mammograms or CT scans safely reduce workload?"],
    healer: ["Encourage people to attend recommended screening, such as cervical and breast checks.", "Feeling well does not mean someone is free of cancer. Screening finds it before symptoms.", "Help people overcome fear or stigma about being tested."],
  },
  {
    student: {
      summary: "To be sure it's cancer, doctors take a tiny piece of tissue (a biopsy) and look at the cells under a microscope.",
      points: ["Why can't a scan alone prove that something is cancer?", "What does a pathologist look for under the microscope?", "How could computers help doctors read slides?"],
    },
    practitioner: ["Obtain enough tissue at the first biopsy for histology and molecular testing.", "Seek specialist pathology review for rare or uncertain tumors.", "Coordinate imaging, pathology and multidisciplinary review before treatment."],
    researcher: ["How well do AI pathology models hold up across hospitals and scanners?", "Can foundation models predict mutations directly from H&E slides?", "Which datasets link images to molecular data and outcomes?"],
    healer: ["A lump, unexplained bleeding or weight loss needs a medical examination. Refer quickly.", "Only a biopsy can confirm cancer. Encourage patients not to delay it.", "Biopsies very rarely cause cancer to spread. Fear of this should not delay diagnosis."],
  },
  {
    student: {
      summary: "Staging is like a map of how far the cancer has gone, from stage 0 (tiny and contained) to stage IV (spread to other organs).",
      points: ["Why does the stage change which treatment is chosen?", "What is the difference between stage and grade?"],
    },
    practitioner: ["Use the current AJCC TNM edition for the specific cancer site.", "Complete staging investigations before definitive treatment.", "Record clinical and pathological stage separately."],
    researcher: ["Can ctDNA or imaging biomarkers refine staging beyond TNM?", "Which stage II patients benefit from additional treatment?"],
    healer: ["Earlier stages are far more curable. This is why delay is harmful.", "Ask patients what stage their doctors found, to understand their situation."],
  },
  {
    student: {
      summary: "Cancer starts with mistakes (mutations) in genes. Testing the tumor's genes can show which mistake drives it, and some medicines target exactly that mistake.",
      points: ["What is a gene mutation?", "How can a drug target one specific mutation?", "Why might two people with the same cancer get different medicines?"],
    },
    practitioner: ["Order the guideline-recommended biomarker panel for the tumor type.", "Consider germline testing when results or family history suggest it.", "Use a molecular tumor board for complex results."],
    researcher: ["Which resistance mutations emerge under targeted therapy?", "How do tumor subclones evolve over time and treatment?", "Which common drivers still lack effective drugs?"],
    healer: ["Modern treatment can be matched to a tumor's genes. This is a strong reason to seek specialist care.", "Plant compounds are studied in labs, but none replaces targeted medicines."],
  },
  {
    student: {
      summary: "Treatment can include surgery, radiation, medicines that kill cancer cells, and medicines that help the immune system fight cancer. Usually several are combined.",
      points: ["How does immunotherapy use the body's own defenses?", "Why does chemotherapy often cause hair loss?", "What is a clinical trial, and why do volunteers matter?"],
    },
    practitioner: ["Define treatment intent (curative or palliative) and discuss it clearly.", "Screen for drug interactions, including herbs and supplements.", "Check clinical trial eligibility before first-line therapy."],
    researcher: ["Why do only some patients respond to immunotherapy?", "Which combinations can prevent or delay resistance?", "Which compounds are active against your target? Try Drug discovery."],
    healer: ["Never advise stopping or delaying chemotherapy, radiotherapy or surgery.", "Ask which treatment the patient is on before giving any herb.", "Herbs that affect the liver or blood clotting can be dangerous during treatment."],
  },
  {
    student: {
      summary: "Cancer treatment can cause tiredness, sickness and worry. Supportive care helps people feel better. Some natural therapies are being studied for this.",
      points: ["Why is exercise helpful even during treatment?", "How can friends and family support someone with cancer?", "How do scientists test whether a natural remedy really works?"],
    },
    practitioner: ["Screen routinely for distress, fatigue, pain and nausea.", "Ask every patient about supplements and herbal products.", "Refer to integrative oncology, nutrition and psycho-oncology services."],
    researcher: ["Which integrative therapies hold up in placebo-controlled trials?", "What mechanisms explain the benefits of exercise in cancer?", "Which herb-drug interactions are clinically significant?"],
    healer: ["Comfort, nutrition and emotional support are valuable contributions.", "Share what you give with the patient's medical team.", "Stop any remedy that causes side effects, and report them."],
  },
  {
    student: {
      summary: "After treatment, people have regular check-ups to make sure the cancer hasn't come back, and to stay healthy.",
      points: ["Why do survivors need check-ups for years?", "How can healthy habits help after cancer?"],
    },
    practitioner: ["Provide a written survivorship care plan.", "Monitor for late effects such as cardiotoxicity and neuropathy.", "Set follow-up imaging and labs according to site-specific guidelines."],
    researcher: ["Can ctDNA monitoring catch recurrence early enough to improve survival?", "Which late effects can be predicted and prevented?"],
    healer: ["Support healthy eating, activity and emotional well-being after treatment.", "Encourage patients to keep every follow-up appointment.", "Refer back promptly if symptoms return."],
  },
  {
    student: {
      summary: "Sometimes cancer spreads or comes back. Treatment then aims to control it and keep the person comfortable. Many people live for years this way.",
      points: ["What does palliative care mean, and why isn't it only for the very end of life?", "How can you support someone living with advanced cancer?"],
    },
    practitioner: ["Introduce palliative care early, alongside active treatment.", "Hold goals-of-care conversations and document preferences.", "Reassess performance status before each line of therapy."],
    researcher: ["How do cancers become resistant over successive lines of treatment?", "What drives the spread of cancers to particular organs?"],
    healer: ["Comfort, dignity and spiritual care matter greatly at this stage.", "Work with palliative care teams on pain and symptom relief.", "Respect the patient's wishes and cultural values."],
  },
];

const STAGE_SCALE = [
  ["0", "In situ", "Abnormal cells that have not invaded nearby tissue."],
  ["I", "Early", "Small and confined to the organ where it started."],
  ["II", "Localized", "Larger, or reaching nearby lymph nodes (exact definition varies by cancer)."],
  ["III", "Regional", "Spread more widely into nearby tissue and lymph nodes."],
  ["IV", "Metastatic", "Spread to distant organs."],
];

(() => {
  const K = window.kira;
  const $ = K.$;
  const esc = K.esc;
  const state = { stage: 0, cancer: "general" };
  try {
    const saved = JSON.parse(localStorage.getItem("kira-journey") || "{}");
    if (Number.isInteger(saved.stage) && STAGES[saved.stage]) state.stage = saved.stage;
    if (CANCERS[saved.cancer]) state.cancer = saved.cancer;
  } catch {}

  const save = () => { try { localStorage.setItem("kira-journey", JSON.stringify(state)); } catch {} };
  const term = () => CANCERS[state.cancer].term;
  const fill = (s) => s.replaceAll("{cancer}", term());

  function renderTumorVsCancer() {
    $("#tvc-venn").innerHTML = `
      <svg viewBox="0 0 360 230" role="img" aria-label="Venn diagram: tumors and cancers overlap only in malignant tumors">
        <circle cx="135" cy="112" r="98" class="venn-tumor"/>
        <circle cx="225" cy="112" r="98" class="venn-cancer"/>
        <text x="92" y="44" class="venn-title">Tumors</text>
        <text x="268" y="44" class="venn-title">Cancers</text>
        <text x="84" y="88" class="venn-label">Benign</text>
        <text x="84" y="104" class="venn-note">lipoma, fibroid</text>
        <text x="84" y="134" class="venn-label">Pre-</text>
        <text x="84" y="149" class="venn-label">cancerous</text>
        <text x="84" y="164" class="venn-note">polyps</text>
        <text x="180" y="100" class="venn-label">Malignant</text>
        <text x="180" y="116" class="venn-label">tumors</text>
        <text x="180" y="134" class="venn-note">carcinoma,</text>
        <text x="180" y="147" class="venn-note">sarcoma, glioma</text>
        <text x="276" y="104" class="venn-label">Blood</text>
        <text x="276" y="120" class="venn-label">cancers</text>
        <text x="276" y="138" class="venn-note">leukemia,</text>
        <text x="276" y="151" class="venn-note">no lump</text>
        <text x="180" y="226" class="venn-foot">Cancer = the malignant part, with or without a lump</text>
      </svg>`;

    const rows = [
      ["What it is", "Any abnormal lump of cells. Doctors also say mass, growth or neoplasm.", "A disease in which abnormal cells grow out of control and invade the body."],
      ["Always dangerous?", "No. Most tumors are benign.", "Yes. It needs treatment or close monitoring."],
      ["Invades and spreads?", "Only if it is malignant.", "Yes. It can invade nearby tissue and spread (metastasize)."],
      ["Forms a lump?", "Always, by definition.", "Not always. Leukemia has no lump."],
      ["After removal", "Benign tumors rarely come back.", "Can come back (recurrence), sometimes years later."],
    ];
    $("#tvc-table").innerHTML = `
      <thead><tr><th></th><th><span class="tvc-pill tumor">Tumor</span></th><th><span class="tvc-pill cancer">Cancer</span></th></tr></thead>
      <tbody>${rows.map(([k, a, b]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join("")}</tbody>`;

    // Deterministic "random" so the drawing is identical on every load.
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const benign = [];
    for (let y = 38; y <= 86; y += 15) {
      for (let x = 37; x <= 133; x += 15) {
        if (((x - 85) / 58) ** 2 + ((y - 62) / 36) ** 2 < 0.8) {
          benign.push(`<circle cx="${x}" cy="${y}" r="6.5" class="cell"/><circle cx="${x}" cy="${y}" r="2.2" class="nucleus"/>`);
        }
      }
    }
    const spots = [[22, 40], [42, 30], [60, 48], [80, 34], [100, 52], [118, 38], [138, 50], [30, 62], [52, 70], [74, 64],
      [96, 76], [120, 68], [142, 74], [64, 86], [110, 88], [150, 30], [86, 100], [128, 104]];
    const malignant = spots.map(([x, y]) => {
      const r = 4 + rnd() * 6;
      const sx = x + (rnd() - 0.5) * 4;
      const sy = y + (rnd() - 0.5) * 4;
      return `<ellipse cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r * (0.7 + rnd() * 0.5)).toFixed(1)}" class="cell bad"/>` +
        `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${(r * 0.55).toFixed(1)}" class="nucleus bad"/>`;
    }).join("");

    $("#tvc-cells").innerHTML = `
      <svg viewBox="0 0 360 150" role="img" aria-label="Benign cells are orderly inside a capsule; malignant cells are irregular and invade a blood vessel">
        <rect x="2" y="2" width="168" height="118" rx="10" class="tissue"/>
        <ellipse cx="85" cy="62" rx="62" ry="40" class="capsule"/>
        ${benign.join("")}
        <text x="86" y="138" class="cells-label ok">Benign</text>
        <text x="86" y="149" class="cells-note">orderly, stays in its capsule</text>

        <g transform="translate(188 0)">
          <rect x="2" y="2" width="168" height="118" rx="10" class="tissue"/>
          <path d="M2 94 L170 94" class="membrane"/>
          <rect x="2" y="98" width="168" height="16" class="vessel"/>
          ${malignant}
          <path d="M120 104 L160 106" class="escape" marker-end="url(#tvc-arrow)"/>
          <text x="86" y="138" class="cells-label bad">Malignant</text>
          <text x="86" y="149" class="cells-note">irregular, invades, enters vessels</text>
        </g>
        <defs>
          <marker id="tvc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0 L10 5 L0 10z" class="arrow-head"/>
          </marker>
        </defs>
      </svg>`;
  }

  function renderTumorTypes() {
    $("#tumor-types").innerHTML = TUMOR_TYPES.map((t) => `
      <div class="tumor-type ${t.kind}">
        <div class="tumor-tag">${esc(t.tag)}</div>
        <h3>${esc(t.title)}</h3>
        <p>${esc(t.text)}</p>
        <ul>${t.examples.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <div class="tumor-research">${t.research.map((r) =>
          `<button class="chip" data-q="${esc(r.q)}">${esc(r.label)} →</button>`).join("")}</div>
      </div>`).join("");
  }

  function renderCancers() {
    $("#journey-cancers").innerHTML = Object.entries(CANCERS).map(([key, c]) =>
      `<button class="chip ${key === state.cancer ? "active" : ""}" data-cancer="${key}">${esc(c.label)}</button>`).join("");
  }

  function renderStepper() {
    $("#journey-phases").innerHTML = PHASES.map((p) =>
      `<div class="phase ${p.stages.includes(state.stage) ? "current" : ""}" style="grid-column: span ${p.stages.length}">${esc(p.name)}</div>`).join("");
    $("#journey-steps").innerHTML = STAGES.map((s, i) => `
      <button class="step ${i === state.stage ? "active" : ""} ${i < state.stage ? "done" : ""}" data-stage="${i}" aria-label="Stage ${i + 1}: ${esc(s.title)}">
        <span class="dot">${i + 1}</span>
        <span class="step-label">${esc(s.short)}</span>
      </button>`).join("");
  }

  function actionButton(a, i) {
    const cls = a.type === "papers" ? "act-papers" : a.type === "remedy" ? "act-remedy" : a.type === "link" ? "act-link" : "act-tool";
    const kind = { papers: "Papers", remedy: "Evidence review", tool: "Tool", link: "External" }[a.type];
    return `<button class="action ${cls}" data-action="${i}"><small>${kind}</small>${esc(a.label)}<span class="arrow">${a.type === "link" ? "↗" : "→"}</span></button>`;
  }

  function renderDetail() {
    const s = STAGES[state.stage];
    const c = CANCERS[state.cancer];
    const mode = K.mode || "adult";
    const m = STAGE_MODES[state.stage][mode];
    const summary = m?.summary ?? s.summary;
    const points = Array.isArray(m) ? m : m?.points ?? s.questions;
    const pointClass = mode === "practitioner" || mode === "healer" ? "ticks" : "qs";
    const phase = PHASES.find((p) => p.stages.includes(state.stage)).name;
    const note = s.cancerNote && c[s.cancerNote]
      ? `<div class="cancer-note"><strong>${esc(c.term[0].toUpperCase() + c.term.slice(1))}:</strong> ${esc(c[s.cancerNote])}</div>` : "";
    const staging = s.staging ? `
      <div class="stage-scale">
        ${STAGE_SCALE.map(([n, name, desc], i) => `
          <div class="stage-cell" style="--i:${i}">
            <div class="stage-num">${n}</div><div class="stage-name">${esc(name)}</div><p>${esc(desc)}</p>
          </div>`).join("")}
      </div>` : "";
    const caution = s.caution ? `<div class="caution-box">⚠ ${esc(s.caution)}</div>` : "";
    const genes = s.biomarkers ? `
      <div class="gene-row"><span class="muted">Look up drugs for common ${esc(c.term)} biomarkers:</span>
        ${c.biomarkers.map((g) => `<button class="chip gene" data-gene="${g}">${g}</button>`).join("")}
      </div>` : "";

    $("#journey-detail").innerHTML = `
      <div class="journey-head">
        <span class="journey-icon">${s.icon}</span>
        <div>
          <div class="eyebrow">Stage ${state.stage + 1} of ${STAGES.length} · ${esc(phase)}</div>
          <h2>${esc(s.title)}</h2>
        </div>
      </div>
      <p class="journey-summary">${esc(summary)}</p>
      ${note}${staging}${caution}
      <div class="journey-cols">
        <div>
          <h3>What happens</h3>
          <ul class="ticks">${s.what.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
        </div>
        <div>
          <h3>${esc(POINT_TITLES[mode])}</h3>
          <ul class="${pointClass}">${points.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>
        </div>
      </div>
      <h3>Research this stage in Kira</h3>
      <div class="actions">${s.actions.map(actionButton).join("")}</div>
      ${genes}
      <div class="journey-nav">
        <button class="ghost" data-move="-1" ${state.stage === 0 ? "disabled" : ""}>← ${state.stage > 0 ? esc(STAGES[state.stage - 1].short) : "Previous"}</button>
        <button class="primary" data-move="1" ${state.stage === STAGES.length - 1 ? "disabled" : ""}>${state.stage < STAGES.length - 1 ? esc(STAGES[state.stage + 1].short) : "Next"} →</button>
      </div>`;
  }

  function render() {
    renderCancers();
    renderStepper();
    renderDetail();
    save();
  }

  function goStage(i) {
    state.stage = Math.max(0, Math.min(STAGES.length - 1, i));
    render();
    $(`#journey-steps [data-stage="${state.stage}"]`)?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }

  function leaveFor(view) {
    const s = STAGES[state.stage];
    $("#journey-back-label").textContent = `Stage ${state.stage + 1}: ${s.title}`;
    K.show(view);
    $("#journey-back").classList.remove("hidden");
  }

  function runAction(a) {
    if (a.type === "papers") {
      leaveFor("literature");
      K.searchPapers(fill(a.q));
    } else if (a.type === "remedy") {
      leaveFor("remedies");
      K.openRemedy(a.key);
    } else if (a.type === "tool") {
      leaveFor(a.view);
      if (a.sample) $(a.sample).click();
    } else if (a.type === "link") {
      window.open(fill(a.url).replaceAll(" ", "+"), "_blank", "noopener");
    }
  }

  $("#tumor-types").addEventListener("click", (e) => {
    const b = e.target.closest("[data-q]");
    if (!b) return;
    $("#journey-back-label").textContent = "Are all tumors cancer?";
    K.show("literature");
    $("#journey-back").classList.remove("hidden");
    K.searchPapers(b.dataset.q);
  });
  function setCancer(cancer) {
    if (!CANCERS[cancer]) return;
    state.cancer = cancer;
    render();
    K.anatomy?.show(cancer);
  }
  K.journey = { setCancer };
  K.anatomy?.onPick((organ) => { if (organ.cancer) setCancer(organ.cancer); });

  $("#journey-cancers").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cancer]");
    if (b) setCancer(b.dataset.cancer);
  });
  $("#journey-steps").addEventListener("click", (e) => {
    const b = e.target.closest("[data-stage]");
    if (b) goStage(Number(b.dataset.stage));
  });
  $("#journey-detail").addEventListener("click", (e) => {
    const move = e.target.closest("[data-move]");
    if (move) { goStage(state.stage + Number(move.dataset.move)); return; }
    const act = e.target.closest("[data-action]");
    if (act) { runAction(STAGES[state.stage].actions[Number(act.dataset.action)]); return; }
    const gene = e.target.closest("[data-gene]");
    if (gene) { leaveFor("drugs"); K.findTargets(gene.dataset.gene); }
  });
  $("#journey-back button").addEventListener("click", () => K.show("journey"));
  document.addEventListener("kira:mode", () => renderDetail());
  document.addEventListener("kira:view", (e) => {
    if (e.detail === "journey") $("#journey-back").classList.add("hidden");
  });
  document.addEventListener("keydown", (e) => {
    if (!$("#view-journey").classList.contains("active") || e.target.closest("input, select, textarea")) return;
    if (e.key === "ArrowRight") goStage(state.stage + 1);
    if (e.key === "ArrowLeft") goStage(state.stage - 1);
  });

  renderTumorVsCancer();
  renderTumorTypes();
  render();
  K.anatomy?.show(state.cancer);
})();
