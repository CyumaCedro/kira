"""Command-line entry point: `kira <command> ...`."""

from __future__ import annotations

import argparse
import sys


def _cmd_papers(args: argparse.Namespace) -> None:
    from .literature import PubMedClient, classify_evidence

    for article in PubMedClient().search_and_fetch(args.query, max_results=args.max):
        level = classify_evidence(article)
        print(f"[{level.name:<14}] {article.year or '----'}  {article.title}\n                  {article.url}")


def _cmd_remedy(args: argparse.Namespace) -> None:
    from .remedies import REMEDIES, review_remedy

    if args.name == "list":
        for r in REMEDIES.values():
            print(f"{r.name:<22} {r.source}")
        return
    print(review_remedy(args.name, cancer=args.cancer, max_results=args.max).to_markdown())


def _cmd_vcf(args: argparse.Namespace) -> None:
    from .genomics import cancer_gene_hits, read_vcf, tumor_mutational_burden

    variants = list(read_vcf(args.path))
    print(f"Variants: {len(variants)}")
    print(f"TMB: {tumor_mutational_burden(variants, args.exome_mb):.2f} mutations/Mb")
    for gene, n in cancer_gene_hits(variants).items():
        print(f"  {gene}: {n}")


def _cmd_druglike(args: argparse.Namespace) -> None:
    from .drug_discovery import descriptors_from_smiles, is_druglike, lipinski_violations

    d = descriptors_from_smiles(args.smiles)
    print(d)
    print("Lipinski violations:", lipinski_violations(d) or "none")
    print("Drug-like:", is_druglike(d))


def _cmd_tiles(args: argparse.Namespace) -> None:
    from .imaging.tissue import load_image, tile_image

    tiles = tile_image(load_image(args.path), size=args.size, min_tissue=args.min_tissue)
    print(f"{len(tiles)} tissue tiles of {args.size}px")


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="kira", description="Cancer research toolkit")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("papers", help="Search PubMed and rank results by evidence level")
    p.add_argument("query")
    p.add_argument("--max", type=int, default=20)
    p.set_defaults(func=_cmd_papers)

    p = sub.add_parser("remedy", help="Evidence review for an integrative remedy ('list' to see all)")
    p.add_argument("name")
    p.add_argument("--cancer", help="Restrict to a cancer type, e.g. 'breast cancer'")
    p.add_argument("--max", type=int, default=100)
    p.set_defaults(func=_cmd_remedy)

    p = sub.add_parser("vcf", help="Summarize a somatic VCF (TMB, driver genes)")
    p.add_argument("path")
    p.add_argument("--exome-mb", type=float, default=38.0)
    p.set_defaults(func=_cmd_vcf)

    p = sub.add_parser("druglike", help="Drug-likeness of a SMILES string (needs kira[chem])")
    p.add_argument("smiles")
    p.set_defaults(func=_cmd_druglike)

    p = sub.add_parser("tiles", help="Count tissue tiles in a pathology image (needs kira[imaging])")
    p.add_argument("path")
    p.add_argument("--size", type=int, default=256)
    p.add_argument("--min-tissue", type=float, default=0.5)
    p.set_defaults(func=_cmd_tiles)

    args = parser.parse_args(argv)
    # Paper titles contain characters the Windows console code page can't encode.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    args.func(args)


if __name__ == "__main__":
    sys.exit(main())
