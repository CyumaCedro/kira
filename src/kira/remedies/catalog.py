"""Integrative and holistic compounds commonly studied in cancer.

Each entry gives the search terms for its literature review, a SMILES string where
there is a single main compound (so it can go through drug-discovery screening),
and known safety concerns. Being on this list means "studied", not "effective".
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Remedy:
    name: str
    source: str
    search_terms: tuple[str, ...]
    smiles: str | None = None
    cautions: tuple[str, ...] = field(default_factory=tuple)

    def pubmed_query(self, cancer: str | None = None) -> str:
        terms = " OR ".join(f'"{t}"[tiab]' for t in self.search_terms)
        disease = f'"{cancer}"[tiab]' if cancer else '"Neoplasms"[MeSH] OR cancer[tiab] OR tumor[tiab]'
        return f"({terms}) AND ({disease})"


REMEDIES: dict[str, Remedy] = {
    r.name.lower(): r
    for r in [
        Remedy(
            "Curcumin",
            "Turmeric (Curcuma longa)",
            ("curcumin", "turmeric"),
            smiles="COC1=C(C=CC(=C1)/C=C/C(=O)CC(=O)/C=C/C2=CC(=C(C=C2)O)OC)O",
            cautions=("Very low oral bioavailability", "May interact with antiplatelet drugs and some chemotherapies"),
        ),
        Remedy(
            "EGCG",
            "Green tea (Camellia sinensis)",
            ("epigallocatechin gallate", "EGCG", "green tea"),
            cautions=("High-dose extracts linked to liver injury", "Can block bortezomib activity"),
        ),
        Remedy(
            "Resveratrol",
            "Grapes, berries, Japanese knotweed",
            ("resveratrol",),
            smiles="C1=CC(=CC=C1/C=C/C2=CC(=CC(=C2)O)O)O",
            cautions=("Low bioavailability", "Possible CYP enzyme interactions"),
        ),
        Remedy(
            "Sulforaphane",
            "Broccoli sprouts and cruciferous vegetables",
            ("sulforaphane", "broccoli sprout"),
            smiles="CS(=O)CCCCN=C=S",
        ),
        Remedy(
            "Medicinal mushrooms",
            "Turkey tail (PSK), reishi, shiitake (lentinan)",
            ("polysaccharide-K", "PSK", "Trametes versicolor", "lentinan", "Ganoderma lucidum"),
            cautions=("Mixed products; composition varies widely between brands",),
        ),
        Remedy(
            "Mistletoe",
            "European mistletoe (Viscum album)",
            ("Viscum album", "mistletoe extract"),
            cautions=("Injected preparations; allergic reactions reported",),
        ),
        Remedy(
            "Vitamin D",
            "Sunlight, supplements",
            ("vitamin D", "cholecalciferol", "calcitriol"),
            cautions=("Toxic at very high doses (hypercalcemia)",),
        ),
        Remedy(
            "Omega-3 fatty acids",
            "Fish oil, algae",
            ("omega-3", "fish oil", "eicosapentaenoic", "docosahexaenoic"),
            cautions=("May increase bleeding risk around surgery",),
        ),
        Remedy(
            "Ginger",
            "Zingiber officinale",
            ("ginger", "Zingiber officinale", "gingerol"),
            cautions=("Mostly studied for chemotherapy-related nausea rather than tumor control",),
        ),
        Remedy(
            "Melatonin",
            "Supplement / pineal hormone",
            ("melatonin",),
            smiles="CC(=O)NCCC1=CNC2=C1C=C(C=C2)OC",
        ),
        Remedy(
            "Berberine",
            "Goldenseal, barberry, Coptis",
            ("berberine",),
            cautions=("Strong CYP3A4/CYP2D6 inhibitor; can alter levels of many cancer drugs",),
        ),
        Remedy(
            "Artemisinin",
            "Sweet wormwood (Artemisia annua)",
            ("artemisinin", "artesunate", "dihydroartemisinin"),
            cautions=("Neurotoxicity reported at high doses in animal studies",),
        ),
    ]
}

# General interaction warnings that apply across remedies.
GENERAL_CAUTIONS = (
    "St John's wort lowers blood levels of many chemotherapy and targeted drugs (CYP3A4 induction).",
    "High-dose antioxidants during radiotherapy or chemotherapy may reduce treatment effect.",
    "Grapefruit and some herbal products inhibit CYP3A4 and can raise drug toxicity.",
    "Patients should tell their oncology team about every supplement they take.",
)


def get_remedy(name: str) -> Remedy:
    try:
        return REMEDIES[name.lower()]
    except KeyError:
        raise KeyError(f"Unknown remedy '{name}'. Available: {', '.join(r.name for r in REMEDIES.values())}") from None
