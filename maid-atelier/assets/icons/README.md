# Maid Atelier icons

User-supplied artwork: `source/sleepy.png`, `source/delighted.png`, and `source/determined.png`.
Original pixels are preserved in `source/`. The script removes connected pale background regions and explicitly seeded hair gaps, retains white clothing, and softens the one-pixel cutout edge. Generated icons use proportional scaling and transparent padding without repainting the character. The determined close-up retains its original cropped edges.

Regenerate from the repository root with Python, Pillow, and NumPy:

```sh
python scripts/build-maid-icons.py
```

The script emits transparent cutout PNGs, multi-resolution ICO files, runtime PNG sizes, `src/client/icon-art.generated.ts`, and a light/dark `preview.png`.
See the package's `NOTICE` and `LICENSE` for attribution and CC BY-NC-SA 4.0 terms.
