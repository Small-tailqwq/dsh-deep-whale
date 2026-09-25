"""Build the ORCA LINK desktop shortcut ICO from its 512 px page icon."""
import re
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parent.parent / 'orca-link'
source = (root / 'src' / 'client' / 'page-icon-art.generated.ts').read_text(encoding='utf-8')
match = re.search(r"PAGE_ICON_512 = skinAssetUrl\('([a-f0-9]{64}\.png)'\)", source)
if match is None:
    raise SystemExit('PAGE_ICON_512 reference not found')
name = match.group(1)
target = root / 'assets' / 'icons' / 'orca-link.ico'
target.parent.mkdir(parents=True, exist_ok=True)
with Image.open(root / 'assets' / 'runtime' / name) as icon:
    icon.convert('RGBA').save(target, sizes=[(n, n) for n in (16, 24, 32, 48, 64, 128, 256)])
print(target)
