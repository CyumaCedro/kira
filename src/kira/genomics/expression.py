"""Tumor vs. normal differential gene expression."""

from __future__ import annotations

import numpy as np
import pandas as pd
from scipy import stats


def benjamini_hochberg(pvalues: np.ndarray) -> np.ndarray:
    """False discovery rate adjusted p-values."""
    p = np.asarray(pvalues, dtype=float)
    n = p.size
    order = np.argsort(p)
    ranked = p[order] * n / np.arange(1, n + 1)
    adjusted = np.minimum.accumulate(ranked[::-1])[::-1]
    out = np.empty(n)
    out[order] = np.clip(adjusted, 0, 1)
    return out


def differential_expression(
    counts: pd.DataFrame,
    tumor_samples: list[str],
    normal_samples: list[str],
    pseudocount: float = 1.0,
) -> pd.DataFrame:
    """Welch t-test on log2 CPM for each gene (rows = genes, columns = samples).

    A quick first look. For publication-grade results use count models such as
    DESeq2 or edgeR.
    """
    cpm = counts / counts.sum(axis=0) * 1e6
    logged = np.log2(cpm + pseudocount)
    tumor = logged[tumor_samples]
    normal = logged[normal_samples]

    log2fc = tumor.mean(axis=1) - normal.mean(axis=1)
    _, pvals = stats.ttest_ind(tumor, normal, axis=1, equal_var=False)
    pvals = np.nan_to_num(pvals, nan=1.0)

    result = pd.DataFrame(
        {"log2fc": log2fc, "pvalue": pvals, "padj": benjamini_hochberg(pvals)},
        index=counts.index,
    )
    return result.sort_values("padj")
