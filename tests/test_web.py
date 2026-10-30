import pytest

pytest.importorskip("fastapi")
from fastapi.testclient import TestClient

from kira.web.app import app

client = TestClient(app)


def test_index_and_static():
    assert "Kira" in client.get("/").text
    assert client.get("/static/app.js").status_code == 200
    assert client.get("/static/journey.js").status_code == 200


def test_remedies_list():
    names = {r["name"] for r in client.get("/api/remedies").json()}
    assert {"Curcumin", "Mistletoe"} <= names


def test_unknown_remedy_404():
    assert client.get("/api/remedies/unicorn-dust").status_code == 404


def test_vcf_sample():
    d = client.get("/api/vcf/sample").json()
    assert d["total"] > 100
    assert {"KRAS", "TP53", "APC"} <= set(d["gene_hits"])


def test_vcf_upload():
    vcf = "#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\nchr17\t1\t.\tC\tT\t50\tPASS\tGENE=TP53;CONSEQUENCE=missense_variant\n"
    d = client.post("/api/vcf?exome_mb=1", files={"file": ("t.vcf", vcf)}).json()
    assert d["tmb"] == 1.0 and d["gene_hits"] == {"TP53": 1}


def test_sample_slide_tiles():
    png = client.get("/api/sample/slide.png").content
    d = client.post("/api/tiles?size=128", files={"file": ("s.png", png, "image/png")}).json()
    assert d["width"] == 1536 and 0.2 < d["tissue_fraction"] < 0.8
    assert len(d["tiles"]) > 10


def test_druglike():
    pytest.importorskip("rdkit")
    d = client.get("/api/druglike", params={"smiles": "CS(=O)CCCCN=C=S"}).json()
    assert d["druglike"] and d["svg"].startswith("<?xml")
    assert client.get("/api/druglike", params={"smiles": "not-a-molecule"}).status_code == 400
