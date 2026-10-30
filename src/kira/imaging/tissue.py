"""Pathology image preprocessing: separate tissue from glass and cut it into patches.

These steps come before any deep-learning model (tumor detection, grading,
mutation prediction from H&E). Images are numpy arrays (H, W, 3) in RGB uint8.
Whole-slide formats (.svs, .ndpi) should be read with OpenSlide and passed in
one region at a time.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np


@dataclass
class Tile:
    x: int
    y: int
    tissue_fraction: float
    pixels: np.ndarray


def to_grayscale(rgb: np.ndarray) -> np.ndarray:
    return (rgb[..., :3] @ np.array([0.299, 0.587, 0.114])).astype(np.uint8)


def otsu_threshold(gray: np.ndarray) -> int:
    """Threshold that best splits pixel intensities into two classes."""
    hist = np.bincount(gray.ravel(), minlength=256).astype(float)
    total = hist.sum()
    weight_bg = np.cumsum(hist)
    weight_fg = total - weight_bg
    cum_mean = np.cumsum(hist * np.arange(256))
    mean_bg = cum_mean / np.maximum(weight_bg, 1)
    mean_fg = (cum_mean[-1] - cum_mean) / np.maximum(weight_fg, 1)
    between = weight_bg * weight_fg * (mean_bg - mean_fg) ** 2
    return int(np.argmax(between))


def tissue_mask(rgb: np.ndarray) -> np.ndarray:
    """Boolean mask of stained tissue. Stained tissue is darker than the bright slide background."""
    gray = to_grayscale(rgb)
    return gray <= otsu_threshold(gray)


def tile_image(rgb: np.ndarray, size: int = 256, min_tissue: float = 0.5) -> list[Tile]:
    """Cut an image into non-overlapping square tiles, keeping those with enough tissue."""
    mask = tissue_mask(rgb)
    tiles = []
    h, w = mask.shape
    for y in range(0, h - size + 1, size):
        for x in range(0, w - size + 1, size):
            frac = float(mask[y : y + size, x : x + size].mean())
            if frac >= min_tissue:
                tiles.append(Tile(x, y, frac, rgb[y : y + size, x : x + size]))
    return tiles


def load_image(path: str | Path) -> np.ndarray:
    """Read a regular image file (PNG, JPEG, TIFF). Requires `pip install kira[imaging]`."""
    from PIL import Image

    return np.asarray(Image.open(path).convert("RGB"))
