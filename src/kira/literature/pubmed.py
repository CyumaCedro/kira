"""PubMed search through NCBI E-utilities.

NCBI allows 3 requests/second without an API key and 10 with one. Set the
NCBI_API_KEY and NCBI_EMAIL environment variables to identify yourself.
"""

from __future__ import annotations

import os
import time
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field

import requests

EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"


@dataclass
class Article:
    pmid: str
    title: str
    abstract: str
    journal: str
    year: int | None
    authors: list[str] = field(default_factory=list)
    publication_types: list[str] = field(default_factory=list)
    mesh_terms: list[str] = field(default_factory=list)

    @property
    def url(self) -> str:
        return f"https://pubmed.ncbi.nlm.nih.gov/{self.pmid}/"


def _text(el: ET.Element | None) -> str:
    return "".join(el.itertext()).strip() if el is not None else ""


def parse_articles(xml: str) -> list[Article]:
    """Parse an efetch PubmedArticleSet XML document."""
    root = ET.fromstring(xml)
    articles = []
    for node in root.iter("PubmedArticle"):
        citation = node.find("MedlineCitation")
        art = citation.find("Article")
        year_el = art.find("Journal/JournalIssue/PubDate/Year")
        if year_el is None:
            year_el = art.find("Journal/JournalIssue/PubDate/MedlineDate")
        year_text = _text(year_el)[:4]
        authors = [
            f"{_text(a.find('LastName'))} {_text(a.find('Initials'))}".strip()
            for a in art.iter("Author")
            if a.find("LastName") is not None
        ]
        abstract = " ".join(_text(p) for p in art.iter("AbstractText"))
        articles.append(
            Article(
                pmid=_text(citation.find("PMID")),
                title=_text(art.find("ArticleTitle")),
                abstract=abstract,
                journal=_text(art.find("Journal/Title")),
                year=int(year_text) if year_text.isdigit() else None,
                authors=authors,
                publication_types=[_text(p) for p in art.iter("PublicationType")],
                mesh_terms=[_text(m.find("DescriptorName")) for m in citation.iter("MeshHeading")],
            )
        )
    return articles


class PubMedClient:
    def __init__(self, api_key: str | None = None, email: str | None = None, timeout: float = 30.0):
        self.api_key = api_key or os.environ.get("NCBI_API_KEY")
        self.email = email or os.environ.get("NCBI_EMAIL")
        self.timeout = timeout
        self.session = requests.Session()
        self._min_interval = 0.1 if self.api_key else 0.34
        self._last_call = 0.0

    def _get(self, endpoint: str, **params) -> requests.Response:
        wait = self._min_interval - (time.monotonic() - self._last_call)
        if wait > 0:
            time.sleep(wait)
        params["tool"] = "kira"
        if self.api_key:
            params["api_key"] = self.api_key
        if self.email:
            params["email"] = self.email
        resp = self.session.get(f"{EUTILS}/{endpoint}", params=params, timeout=self.timeout)
        self._last_call = time.monotonic()
        resp.raise_for_status()
        return resp

    def search(self, query: str, max_results: int = 50, sort: str = "relevance") -> list[str]:
        """Return PMIDs matching a PubMed query (full PubMed syntax, e.g. MeSH tags)."""
        data = self._get("esearch.fcgi", db="pubmed", term=query, retmax=max_results, sort=sort, retmode="json").json()
        return data["esearchresult"]["idlist"]

    def fetch(self, pmids: list[str]) -> list[Article]:
        if not pmids:
            return []
        articles = []
        for i in range(0, len(pmids), 200):
            batch = pmids[i : i + 200]
            xml = self._get("efetch.fcgi", db="pubmed", id=",".join(batch), retmode="xml").text
            articles.extend(parse_articles(xml))
        return articles

    def search_and_fetch(self, query: str, max_results: int = 50) -> list[Article]:
        return self.fetch(self.search(query, max_results))
