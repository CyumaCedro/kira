import numpy as np

from kira.imaging import tile_image, tissue_mask


def synthetic_slide() -> np.ndarray:
    """White glass with a pink/purple 'tissue' block in the top-left quadrant."""
    img = np.full((512, 512, 3), 240, dtype=np.uint8)
    img[:256, :256] = (180, 90, 160)
    return img


def test_tissue_mask_detects_stained_region():
    mask = tissue_mask(synthetic_slide())
    assert mask[:256, :256].all()
    assert not mask[256:, 256:].any()


def test_tile_image_keeps_only_tissue_tiles():
    tiles = tile_image(synthetic_slide(), size=128, min_tissue=0.5)
    assert len(tiles) == 4
    assert all(t.x < 256 and t.y < 256 for t in tiles)
    assert tiles[0].pixels.shape == (128, 128, 3)
