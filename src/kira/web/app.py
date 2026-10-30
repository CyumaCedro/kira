"""FastAPI app: a JSON API over the kira modules plus the single-page frontend."""

from __future__ import annotations

import io
from pathlib import Path

import numpy as np
import requests
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles

from ..drug_discovery import ChEMBLClient, descriptors_from_smiles, is_druglike, lipinski_violations
from ..drug_discovery.druglikeness import veber_violations
from ..genomics import cancer_gene_hits, tumor_mutational_burden
from ..genomics.variants import CANCER_GENES, parse_vcf_lines
from ..imaging import tile_image, tissue_mask
from ..literature import Article, EvidenceLevel, PubMedClient, classify_evidence
from ..remedies import REMEDIES, get_remedy, review_remedy
from ..remedies.catalog import GENERAL_CAUTIONS

HERE = Path(__file__).parent
STATIC = HERE / "static"
SAMPLES = HERE / "samples"

app = FastAPI(title="Kira", version="0.1.0")
app.mount("/static", StaticFiles(directory=STATIC), name="static")

pubmed = PubMedClient()
chembl = ChEMBLClient()


def _article_json(article: Article, level: EvidenceLevel) -> dict:
    return {
        "pmid": article.pmid,
        "title": article.title,
        "journal": article.journal,
        "year": article.year,
        "authors": article.authors[:3] + (["et al."] if len(article.authors) > 3 else []),
        "abstract": article.abstract,
        "url": article.url,
        "level": level.name,
        "rank": int(level),
    }


def _upstream(fn, *args, **kwargs):
    """Turn network failures from PubMed or ChEMBL into a readable 502."""
    try:
        return fn(*args, **kwargs)
    except requests.RequestException as exc:
        raise HTTPException(502, f"External service error: {exc}") from exc


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")


# Literature -----------------------------------------------------------------

@app.get("/api/papers")
def papers(q: str = Query(..., min_length=2), max: int = Query(25, ge=1, le=200)):
    articles = _upstream(pubmed.search_and_fetch, q, max_results=max)
    results = [_article_json(a, classify_evidence(a)) for a in articles]
    return {"query": q, "count": len(results), "results": results}


# Remedies -------------------------------------------------------------------

@app.get("/api/remedies")
def remedies():
    return [
        {"key": key, "name": r.name, "source": r.source, "has_structure": bool(r.smiles)}
        for key, r in REMEDIES.items()
    ]


@app.get("/api/remedies/{name}")
def remedy_review(name: str, cancer: str | None = None, max: int = Query(60, ge=1, le=200)):
    try:
        get_remedy(name)
    except KeyError as exc:
        raise HTTPException(404, str(exc)) from exc
    review = _upstream(review_remedy, name, cancer=cancer or None, max_results=max, client=pubmed)
    ranked = sorted(review.articles, key=lambda pair: (-pair[1], -(pair[0].year or 0)))
    return {
        "name": review.remedy.name,
        "source": review.remedy.source,
        "smiles": review.remedy.smiles,
        "query": review.query,
        "verdict": review.verdict,
        "counts": review.counts,
        "cautions": list(review.remedy.cautions),
        "general_cautions": list(GENERAL_CAUTIONS),
        "articles": [_article_json(a, lv) for a, lv in ranked],
    }


# Genomics -------------------------------------------------------------------

def _vcf_summary(text: str, exome_mb: float) -> dict:
    variants = list(parse_vcf_lines(text.splitlines()))
    passed = [v for v in variants if v.passed]
    return {
        "total": len(variants),
        "passed": len(passed),
        "tmb": round(tumor_mutational_burden(variants, exome_mb), 2),
        "exome_mb": exome_mb,
        "gene_hits": cancer_gene_hits(variants),
        "variants": [
            {
                "chrom": v.chrom, "pos": v.pos, "ref": v.ref, "alt": v.alt,
                "gene": v.gene, "consequence": v.consequence, "filter": v.filter,
                "driver": v.gene in CANCER_GENES,
            }
            for v in variants[:2000]
        ],
    }


@app.post("/api/vcf")
async def vcf(file: UploadFile = File(...), exome_mb: float = 38.0):
    raw = await file.read()
    if file.filename and file.filename.endswith(".gz"):
        import gzip

        raw = gzip.decompress(raw)
    return _vcf_summary(raw.decode("utf-8", errors="replace"), exome_mb)


@app.get("/api/vcf/sample")
def vcf_sample(exome_mb: float = 38.0):
    return _vcf_summary((SAMPLES / "sample.vcf").read_text(), exome_mb)


# Imaging --------------------------------------------------------------------

@app.post("/api/tiles")
async def tiles(file: UploadFile = File(...), size: int = 256, min_tissue: float = 0.5):
    from PIL import Image

    img = Image.open(io.BytesIO(await file.read())).convert("RGB")
    # Keep requests fast; whole slides should be tiled offline with OpenSlide.
    img.thumbnail((4096, 4096))
    rgb = np.asarray(img)
    found = tile_image(rgb, size=size, min_tissue=min_tissue)
    return {
        "width": rgb.shape[1],
        "height": rgb.shape[0],
        "tissue_fraction": round(float(tissue_mask(rgb).mean()), 3),
        "size": size,
        "tiles": [{"x": t.x, "y": t.y, "tissue": round(t.tissue_fraction, 3)} for t in found],
    }


@app.get("/api/sample/slide.png")
def sample_slide():
    """Synthetic H&E-like image: pink tissue islands with purple nuclei on bright glass."""
    from PIL import Image

    rng = np.random.default_rng(7)
    h, w = 1024, 1536
    yy, xx = np.mgrid[0:h, 0:w]
    tissue = np.zeros((h, w), bool)
    for cy, cx, r in [(380, 420, 300), (620, 1050, 340), (850, 380, 160)]:
        wobble = 1 + 0.15 * np.sin(np.arctan2(yy - cy, xx - cx) * 5)
        tissue |= (yy - cy) ** 2 + (xx - cx) ** 2 < (r * wobble) ** 2
    img = np.full((h, w, 3), (244, 242, 246), float)
    img[tissue] = (222, 150, 190)
    nuclei = tissue & (rng.random((h, w)) < 0.012)
    for dy in range(-3, 4):
        for dx in range(-3, 4):
            if dy * dy + dx * dx <= 9:
                img[np.roll(np.roll(nuclei, dy, 0), dx, 1)] = (110, 60, 150)
    img += rng.normal(0, 6, img.shape)
    buf = io.BytesIO()
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(buf, "PNG")
    return Response(buf.getvalue(), media_type="image/png")


# Drug discovery -------------------------------------------------------------

@app.get("/api/druglike")
def druglike(smiles: str = Query(..., min_length=1)):
    try:
        d = descriptors_from_smiles(smiles)
    except ImportError as exc:
        raise HTTPException(501, "RDKit is not installed. Run: pip install kira[chem]") from exc
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc

    from rdkit import Chem
    from rdkit.Chem.Draw import rdMolDraw2D

    drawer = rdMolDraw2D.MolDraw2DSVG(360, 260)
    opts = drawer.drawOptions()
    opts.clearBackground = False
    drawer.DrawMolecule(Chem.MolFromSmiles(smiles))
    drawer.FinishDrawing()

    return {
        "smiles": smiles,
        "descriptors": {k: round(v, 2) if isinstance(v, float) else v for k, v in vars(d).items()},
        "lipinski": lipinski_violations(d),
        "veber": veber_violations(d),
        "druglike": is_druglike(d),
        "svg": drawer.GetDrawingText(),
    }


@app.get("/api/chembl/targets")
def chembl_targets(gene: str = Query(..., min_length=1)):
    return _upstream(chembl.search_targets, gene)


@app.get("/api/chembl/activities")
def chembl_activities(target: str, type: str = "IC50", limit: int = Query(50, ge=1, le=500)):
    acts = _upstream(chembl.bioactivities, target, activity_type=type, limit=limit)
    return sorted(acts, key=lambda a: -(a["pchembl"] or 0))
