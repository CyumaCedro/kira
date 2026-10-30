# Kira

A Python toolkit for cancer research, covering four areas plus an evidence review of holistic and integrative remedies.

| Module | What it does |
|---|---|
| `kira.genomics` | Reads VCF files, computes tumor mutational burden (TMB), finds hits in known driver genes, and runs a tumor-vs-normal differential expression test |
| `kira.imaging` | Pathology preprocessing: Otsu tissue detection and patch tiling for H&E slides |
| `kira.drug_discovery` | Lipinski and Veber drug-likeness rules (RDKit) and a ChEMBL bioactivity client |
| `kira.literature` | PubMed search through NCBI E-utilities, ranking each paper by evidence level (from in-vitro up to meta-analysis) |
| `kira.remedies` | A catalog of studied integrative compounds (curcumin, EGCG, mistletoe, medicinal mushrooms, …) with safety cautions and literature-based evidence reviews |

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[all]"
```

Optional: set `NCBI_API_KEY` and `NCBI_EMAIL` to raise PubMed's limit from 3 to 10 requests per second.

## Web app

```bash
kira web
```

Then open http://127.0.0.1:8000. It has a panel for each area: literature search with evidence filters, remedy evidence reviews, VCF analysis, slide tiling preview, and drug-likeness with ChEMBL lookup. The Genomics and Imaging panels have sample data buttons, so you can try them without your own files.

## Command line

```bash
kira remedy list
kira remedy curcumin --cancer "colorectal cancer"
kira papers "immunotherapy melanoma meta-analysis" --max 10
kira vcf data/raw/tumor.vcf
kira druglike "CS(=O)CCCCN=C=S"
kira tiles data/raw/slide_region.png --size 256
```

```python
from kira.remedies import review_remedy
review = review_remedy("mistletoe", cancer="pancreatic cancer")
print(review.verdict)
print(review.to_markdown())
```

## Tests

```bash
pytest -m "not network"
```

## How remedies are treated

Holistic remedies get the same scrutiny as any other candidate compound. Each one is scored by the best study design behind it, because lab and mouse results often don't hold up in patients. Reviews always include the remedy's known drug interactions, such as St John's wort lowering levels of many chemotherapy drugs.

## Roadmap ideas

- Genomics: TCGA/GDC data loader, cBioPortal client, COSMIC Cancer Gene Census
- Imaging: OpenSlide whole-slide reader, stain normalization, pretrained pathology foundation-model embeddings
- Drug discovery: target–compound activity models, docking, DepMap dependency data
- Literature: full-text mining from PubMed Central, entity extraction (genes, drugs, cancer types), ClinicalTrials.gov client

## Disclaimer

Kira is a research tool. It does not give medical advice, and nothing it outputs should guide treatment decisions. Talk to an oncologist.
