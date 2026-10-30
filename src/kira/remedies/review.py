"""Evidence review: what does the published literature actually show for a remedy?"""

from __future__ import annotations

from dataclasses import dataclass

from ..literature.evidence import EvidenceLevel, classify_evidence
from ..literature.pubmed import Article, PubMedClient
from .catalog import GENERAL_CAUTIONS, Remedy, get_remedy


@dataclass
class EvidenceReview:
    remedy: Remedy
    query: str
    articles: list[tuple[Article, EvidenceLevel]]

    @property
    def counts(self) -> dict[str, int]:
        out: dict[str, int] = {}
        for level in sorted(EvidenceLevel, reverse=True):
            n = sum(1 for _, lv in self.articles if lv == level)
            if n:
                out[level.name] = n
        return out

    @property
    def human_evidence(self) -> list[tuple[Article, EvidenceLevel]]:
        return [(a, lv) for a, lv in self.articles if lv >= EvidenceLevel.OBSERVATIONAL]

    @property
    def verdict(self) -> str:
        levels = [lv for _, lv in self.articles]
        if not levels:
            return "No studies found."
        best = max(levels)
        if best >= EvidenceLevel.RCT:
            return "Randomized trials or meta-analyses exist. Read them for effect sizes and outcomes."
        if best >= EvidenceLevel.CLINICAL_TRIAL:
            return "Early-phase human trials only. Effectiveness is not established."
        if best >= EvidenceLevel.OBSERVATIONAL:
            return "Observational human data only. Association, not proof of benefit."
        return "Lab and animal studies only. No evidence of benefit in patients yet."

    def to_markdown(self, top_n: int = 10) -> str:
        lines = [
            f"# Evidence review: {self.remedy.name}",
            f"Source: {self.remedy.source}",
            f"Query: `{self.query}`",
            "",
            f"**Verdict:** {self.verdict}",
            "",
            "## Studies by evidence level",
        ]
        lines += [f"- {name}: {n}" for name, n in self.counts.items()]
        lines += ["", "## Strongest studies"]
        ranked = sorted(self.articles, key=lambda pair: (-pair[1], -(pair[0].year or 0)))
        for article, level in ranked[:top_n]:
            lines.append(f"- [{level.name}] {article.title} ({article.journal}, {article.year}) {article.url}")
        lines += ["", "## Cautions"]
        lines += [f"- {c}" for c in self.remedy.cautions + GENERAL_CAUTIONS]
        lines += ["", "_Research summary only, not medical advice._"]
        return "\n".join(lines)


def review_remedy(
    name: str,
    cancer: str | None = None,
    max_results: int = 100,
    client: PubMedClient | None = None,
) -> EvidenceReview:
    remedy = get_remedy(name)
    query = remedy.pubmed_query(cancer)
    client = client or PubMedClient()
    articles = client.search_and_fetch(query, max_results=max_results)
    return EvidenceReview(remedy, query, [(a, classify_evidence(a)) for a in articles])
