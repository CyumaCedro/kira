import numpy as np
import pandas as pd

from kira.genomics import cancer_gene_hits, differential_expression, tumor_mutational_burden
from kira.genomics.expression import benjamini_hochberg
from kira.genomics.variants import parse_vcf_lines

VCF = """##fileformat=VCFv4.2
#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO
chr17\t7675088\t.\tC\tT\t60\tPASS\tGENE=TP53;CONSEQUENCE=missense_variant
chr12\t25245350\t.\tC\tA,G\t55\tPASS\tGENE=KRAS;CONSEQUENCE=missense_variant
chr1\t1000\t.\tA\tG\t10\tLowQual\tGENE=TP53;CONSEQUENCE=missense_variant
chr2\t2000\t.\tG\tT\t50\tPASS\tGENE=FOO;CONSEQUENCE=synonymous_variant
"""


def test_vcf_parsing_splits_multiallelic():
    variants = list(parse_vcf_lines(VCF.splitlines()))
    assert len(variants) == 5
    assert [v.alt for v in variants if v.gene == "KRAS"] == ["A", "G"]


def test_tmb_counts_only_pass_nonsynonymous():
    variants = list(parse_vcf_lines(VCF.splitlines()))
    assert tumor_mutational_burden(variants, exome_size_mb=1.0) == 3.0


def test_cancer_gene_hits():
    variants = list(parse_vcf_lines(VCF.splitlines()))
    assert cancer_gene_hits(variants) == {"KRAS": 2, "TP53": 1}


def test_benjamini_hochberg():
    adj = benjamini_hochberg(np.array([0.01, 0.04, 0.03, 0.2]))
    np.testing.assert_allclose(adj, [0.04, 0.04 * 4 / 3, 0.04 * 4 / 3, 0.2])


def test_differential_expression_finds_upregulated_gene():
    rng = np.random.default_rng(0)
    counts = pd.DataFrame(rng.poisson(100, size=(50, 8)), columns=[f"s{i}" for i in range(8)])
    counts.index = [f"gene{i}" for i in range(50)]
    counts.loc["gene0", ["s0", "s1", "s2", "s3"]] *= 10
    result = differential_expression(counts, ["s0", "s1", "s2", "s3"], ["s4", "s5", "s6", "s7"])
    assert result.index[0] == "gene0"
    assert result.loc["gene0", "log2fc"] > 2
