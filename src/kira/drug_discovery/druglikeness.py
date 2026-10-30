"""Drug-likeness filters for screening candidate compounds."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Descriptors:
    mol_weight: float
    logp: float
    h_donors: int
    h_acceptors: int
    tpsa: float
    rotatable_bonds: int


def descriptors_from_smiles(smiles: str) -> Descriptors:
    """Compute descriptors with RDKit (`pip install kira[chem]`)."""
    from rdkit import Chem
    from rdkit.Chem import Crippen, Descriptors as D, Lipinski, rdMolDescriptors

    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        raise ValueError(f"Invalid SMILES: {smiles}")
    return Descriptors(
        mol_weight=D.MolWt(mol),
        logp=Crippen.MolLogP(mol),
        h_donors=Lipinski.NumHDonors(mol),
        h_acceptors=Lipinski.NumHAcceptors(mol),
        tpsa=rdMolDescriptors.CalcTPSA(mol),
        rotatable_bonds=Lipinski.NumRotatableBonds(mol),
    )


def lipinski_violations(d: Descriptors) -> list[str]:
    """Lipinski's rule of five: likely poor oral absorption when more than one rule is broken."""
    rules = [
        (d.mol_weight > 500, "molecular weight > 500"),
        (d.logp > 5, "logP > 5"),
        (d.h_donors > 5, "H-bond donors > 5"),
        (d.h_acceptors > 10, "H-bond acceptors > 10"),
    ]
    return [msg for broken, msg in rules if broken]


def veber_violations(d: Descriptors) -> list[str]:
    """Veber's rules for oral bioavailability."""
    rules = [
        (d.tpsa > 140, "TPSA > 140"),
        (d.rotatable_bonds > 10, "rotatable bonds > 10"),
    ]
    return [msg for broken, msg in rules if broken]


def is_druglike(d: Descriptors) -> bool:
    return len(lipinski_violations(d)) <= 1 and not veber_violations(d)
