"""Somatic variant handling: a dependency-free VCF reader plus basic tumor metrics."""

from __future__ import annotations

import gzip
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, Iterator

# A small starter set of well-known cancer driver genes (oncogenes and tumor suppressors).
# Replace with the full COSMIC Cancer Gene Census for real work.
CANCER_GENES = {
    "TP53", "KRAS", "NRAS", "HRAS", "BRAF", "PIK3CA", "PTEN", "EGFR", "ERBB2",
    "APC", "BRCA1", "BRCA2", "ATM", "CDKN2A", "RB1", "MYC", "IDH1", "IDH2",
    "ALK", "RET", "MET", "KIT", "PDGFRA", "VHL", "NF1", "SMAD4", "CTNNB1",
    "ARID1A", "FBXW7", "NOTCH1", "JAK2", "FLT3", "NPM1", "DNMT3A", "TERT",
}

# Variant consequences that change the protein sequence, used for TMB.
NONSYNONYMOUS = {
    "missense_variant", "stop_gained", "stop_lost", "start_lost",
    "frameshift_variant", "inframe_insertion", "inframe_deletion",
    "splice_acceptor_variant", "splice_donor_variant", "protein_altering_variant",
}


@dataclass
class Variant:
    chrom: str
    pos: int
    ref: str
    alt: str
    qual: float | None = None
    filter: str = "."
    info: dict[str, str] = field(default_factory=dict)

    @property
    def gene(self) -> str | None:
        """Gene symbol from common annotation keys (GENE=, or the VEP/SnpEff CSQ/ANN fields)."""
        if "GENE" in self.info:
            return self.info["GENE"]
        for key, gene_idx in (("ANN", 3), ("CSQ", 3)):
            if key in self.info:
                parts = self.info[key].split(",")[0].split("|")
                if len(parts) > gene_idx and parts[gene_idx]:
                    return parts[gene_idx]
        return None

    @property
    def consequence(self) -> str | None:
        if "CONSEQUENCE" in self.info:
            return self.info["CONSEQUENCE"]
        for key in ("ANN", "CSQ"):
            if key in self.info:
                parts = self.info[key].split(",")[0].split("|")
                if len(parts) > 1:
                    return parts[1]
        return None

    @property
    def passed(self) -> bool:
        return self.filter in ("PASS", ".")


def _parse_info(raw: str) -> dict[str, str]:
    if raw == ".":
        return {}
    info = {}
    for item in raw.split(";"):
        key, _, value = item.partition("=")
        info[key] = value or "true"
    return info


def read_vcf(path: str | Path) -> Iterator[Variant]:
    """Yield variants from a .vcf or .vcf.gz file. Multi-allelic sites are split per ALT."""
    path = Path(path)
    opener = gzip.open if path.suffix == ".gz" else open
    with opener(path, "rt") as fh:
        yield from parse_vcf_lines(fh)


def parse_vcf_lines(lines: Iterable[str]) -> Iterator[Variant]:
    for line in lines:
        if not line.strip() or line.startswith("#"):
            continue
        cols = line.rstrip("\n").split("\t")
        chrom, pos, _id, ref, alts, qual, filt, info = cols[:8]
        parsed_info = _parse_info(info)
        for alt in alts.split(","):
            yield Variant(
                chrom=chrom,
                pos=int(pos),
                ref=ref,
                alt=alt,
                qual=None if qual == "." else float(qual),
                filter=filt,
                info=parsed_info,
            )


def tumor_mutational_burden(variants: Iterable[Variant], exome_size_mb: float = 38.0) -> float:
    """Nonsynonymous PASS mutations per megabase.

    Variants without a consequence annotation are counted, so TMB is overestimated
    on unannotated VCFs. The default 38 Mb is a typical whole-exome capture size.
    """
    count = 0
    for v in variants:
        if not v.passed:
            continue
        if v.consequence is None or any(c in NONSYNONYMOUS for c in v.consequence.split("&")):
            count += 1
    return count / exome_size_mb


def cancer_gene_hits(variants: Iterable[Variant], genes: set[str] = CANCER_GENES) -> dict[str, int]:
    """Count PASS variants per known cancer gene."""
    hits: dict[str, int] = {}
    for v in variants:
        if v.passed and v.gene in genes:
            hits[v.gene] = hits.get(v.gene, 0) + 1
    return dict(sorted(hits.items(), key=lambda kv: -kv[1]))
