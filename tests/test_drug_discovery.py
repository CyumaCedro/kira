import pytest

from kira.drug_discovery import Descriptors, is_druglike, lipinski_violations


def test_small_molecule_is_druglike():
    aspirin = Descriptors(mol_weight=180.2, logp=1.3, h_donors=1, h_acceptors=3, tpsa=63.6, rotatable_bonds=2)
    assert lipinski_violations(aspirin) == []
    assert is_druglike(aspirin)


def test_large_greasy_molecule_fails():
    big = Descriptors(mol_weight=850, logp=7.2, h_donors=6, h_acceptors=12, tpsa=200, rotatable_bonds=15)
    assert len(lipinski_violations(big)) == 4
    assert not is_druglike(big)


def test_rdkit_descriptors_for_catalog_smiles():
    pytest.importorskip("rdkit")
    from kira.drug_discovery import descriptors_from_smiles
    from kira.remedies import REMEDIES

    for remedy in REMEDIES.values():
        if remedy.smiles:
            assert descriptors_from_smiles(remedy.smiles).mol_weight > 0
