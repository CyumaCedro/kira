import pytest

from kira.literature import Article, EvidenceLevel, PubMedClient, classify_evidence, parse_articles
from kira.remedies import get_remedy
from kira.remedies.review import EvidenceReview

XML = """<?xml version="1.0"?>
<PubmedArticleSet>
  <PubmedArticle>
    <MedlineCitation>
      <PMID>12345</PMID>
      <Article>
        <Journal><Title>J Onc</Title><JournalIssue><PubDate><Year>2024</Year></PubDate></JournalIssue></Journal>
        <ArticleTitle>Curcumin in colorectal cancer: a <i>randomized</i> trial</ArticleTitle>
        <Abstract><AbstractText Label="BACKGROUND">Background text.</AbstractText><AbstractText>Results.</AbstractText></Abstract>
        <AuthorList><Author><LastName>Smith</LastName><Initials>J</Initials></Author></AuthorList>
        <PublicationTypeList><PublicationType>Randomized Controlled Trial</PublicationType></PublicationTypeList>
      </Article>
      <MeshHeadingList><MeshHeading><DescriptorName>Humans</DescriptorName></MeshHeading></MeshHeadingList>
    </MedlineCitation>
  </PubmedArticle>
</PubmedArticleSet>"""


def make(title="", abstract="", pub_types=(), mesh=()):
    return Article("1", title, abstract, "J", 2020, publication_types=list(pub_types), mesh_terms=list(mesh))


def test_parse_articles():
    [a] = parse_articles(XML)
    assert a.pmid == "12345"
    assert a.title == "Curcumin in colorectal cancer: a randomized trial"
    assert a.year == 2024
    assert a.authors == ["Smith J"]
    assert a.abstract == "Background text. Results."
    assert classify_evidence(a) == EvidenceLevel.RCT


@pytest.mark.parametrize(
    "article, expected",
    [
        (make(pub_types=["Meta-Analysis", "Review"]), EvidenceLevel.META_ANALYSIS),
        (make(mesh=["Mice", "Neoplasms"]), EvidenceLevel.ANIMAL),
        (make(abstract="We treated MCF-7 cell lines with resveratrol."), EvidenceLevel.IN_VITRO),
        (make(abstract="A prospective cohort of 10,000 women."), EvidenceLevel.OBSERVATIONAL),
        (make(title="Something unrelated"), EvidenceLevel.UNKNOWN),
    ],
)
def test_classify_evidence(article, expected):
    assert classify_evidence(article) == expected


def test_remedy_query_and_verdict():
    remedy = get_remedy("curcumin")
    assert '"curcumin"[tiab]' in remedy.pubmed_query("breast cancer")
    lab_only = EvidenceReview(remedy, "q", [(make(), EvidenceLevel.IN_VITRO), (make(), EvidenceLevel.ANIMAL)])
    assert "Lab and animal studies only" in lab_only.verdict
    assert "not medical advice" in lab_only.to_markdown()


@pytest.mark.network
def test_pubmed_live_search():
    articles = PubMedClient().search_and_fetch("curcumin colorectal cancer", max_results=3)
    assert articles and all(a.pmid for a in articles)
