"""Rank papers by strength of evidence, from meta-analyses down to lab studies.

Many headlines about "cancer cures" rest on cell-culture or mouse studies. Sorting
the literature by study design shows how far a finding has actually progressed
toward evidence in people.
"""

from __future__ import annotations

import re
from collections import Counter
from enum import IntEnum
from typing import Iterable

from .pubmed import Article


class EvidenceLevel(IntEnum):
    """Higher value = stronger evidence in humans."""

    UNKNOWN = 0
    IN_VITRO = 1          # cells in a dish
    ANIMAL = 2            # mouse / rat models
    CASE_REPORT = 3       # single patients
    OBSERVATIONAL = 4     # cohort, case-control
    CLINICAL_TRIAL = 5    # early-phase / non-randomized trials
    RCT = 6               # randomized controlled trials
    META_ANALYSIS = 7     # systematic reviews and meta-analyses


_PUB_TYPE_LEVELS = {
    "Meta-Analysis": EvidenceLevel.META_ANALYSIS,
    "Systematic Review": EvidenceLevel.META_ANALYSIS,
    "Randomized Controlled Trial": EvidenceLevel.RCT,
    "Clinical Trial, Phase III": EvidenceLevel.RCT,
    "Clinical Trial, Phase II": EvidenceLevel.CLINICAL_TRIAL,
    "Clinical Trial, Phase I": EvidenceLevel.CLINICAL_TRIAL,
    "Clinical Trial": EvidenceLevel.CLINICAL_TRIAL,
    "Observational Study": EvidenceLevel.OBSERVATIONAL,
    "Case Reports": EvidenceLevel.CASE_REPORT,
}

_TEXT_PATTERNS = [
    (EvidenceLevel.META_ANALYSIS, r"\bmeta-analys[ie]s\b|\bsystematic review\b"),
    (EvidenceLevel.RCT, r"\brandomi[sz]ed\b.*\b(trial|controlled)\b"),
    (EvidenceLevel.CLINICAL_TRIAL, r"\bphase (i|ii|1|2)\b|\bclinical trial\b"),
    (EvidenceLevel.OBSERVATIONAL, r"\bcohort\b|\bcase-control\b|\bprospective study\b"),
    (EvidenceLevel.ANIMAL, r"\b(mice|mouse|murine|rats?|xenograft)\b"),
    (EvidenceLevel.IN_VITRO, r"\bin vitro\b|\bcell lines?\b|\bcultured cells\b"),
]

_ANIMAL_MESH = {"Mice", "Rats", "Disease Models, Animal", "Xenograft Model Antitumor Assays"}


def classify_evidence(article: Article) -> EvidenceLevel:
    """Best guess at study design from PubMed publication types, MeSH terms, then free text."""
    levels = [_PUB_TYPE_LEVELS[p] for p in article.publication_types if p in _PUB_TYPE_LEVELS]
    if levels:
        return max(levels)

    mesh = set(article.mesh_terms)
    if "Humans" not in mesh and mesh & _ANIMAL_MESH:
        return EvidenceLevel.ANIMAL

    text = f"{article.title} {article.abstract}".lower()
    for level, pattern in _TEXT_PATTERNS:
        if re.search(pattern, text):
            return level
    return EvidenceLevel.UNKNOWN


def summarize_evidence(articles: Iterable[Article]) -> dict[str, int]:
    """Count articles at each evidence level, strongest first."""
    counts = Counter(classify_evidence(a) for a in articles)
    return {level.name: counts[level] for level in sorted(EvidenceLevel, reverse=True) if counts[level]}
