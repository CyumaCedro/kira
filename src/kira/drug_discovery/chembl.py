"""ChEMBL REST API client: targets, molecules and measured bioactivities."""

from __future__ import annotations

import requests

BASE_URL = "https://www.ebi.ac.uk/chembl/api/data"


class ChEMBLClient:
    def __init__(self, session: requests.Session | None = None, timeout: float = 30.0):
        self.session = session or requests.Session()
        self.timeout = timeout

    def _get(self, path: str, **params) -> dict:
        params.setdefault("format", "json")
        resp = self.session.get(f"{BASE_URL}/{path}", params=params, timeout=self.timeout)
        resp.raise_for_status()
        return resp.json()

    def search_targets(self, gene_symbol: str, organism: str = "Homo sapiens") -> list[dict]:
        data = self._get(
            "target/search",
            q=gene_symbol,
            target_organism=organism,
        )
        return [
            {
                "chembl_id": t["target_chembl_id"],
                "name": t["pref_name"],
                "type": t["target_type"],
            }
            for t in data.get("targets", [])
        ]

    def bioactivities(self, target_chembl_id: str, activity_type: str = "IC50", limit: int = 100) -> list[dict]:
        """Measured potencies against a target. pChEMBL = -log10(molar potency); above 6 means sub-micromolar."""
        data = self._get(
            "activity",
            target_chembl_id=target_chembl_id,
            standard_type=activity_type,
            pchembl_value__isnull="false",
            limit=limit,
        )
        return [
            {
                "molecule": a["molecule_chembl_id"],
                "smiles": a.get("canonical_smiles"),
                "value": a.get("standard_value"),
                "units": a.get("standard_units"),
                "pchembl": float(a["pchembl_value"]) if a.get("pchembl_value") else None,
            }
            for a in data.get("activities", [])
        ]

    def molecule(self, chembl_id: str) -> dict:
        return self._get(f"molecule/{chembl_id}")
