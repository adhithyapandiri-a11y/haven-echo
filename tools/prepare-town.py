"""Build a compact scrolling backdrop from the supplied town video."""
import argparse
import json
from pathlib import Path
import subprocess
import tempfile

import numpy as np
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('video', type=Path)
args = parser.parse_args()
destination = Path(__file__).resolve().parents[1] / 'assets'
destination.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory() as directory:
    frames = []
    for index, timestamp in enumerate([0, 5.8]):
        output = Path(directory) / f'frame-{index}.png'
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', str(timestamp), '-i', str(args.video), '-frames:v', '1', str(output)], check=True)
        frames.append(Image.open(output).convert('RGB'))
    first, last = frames
    first_pixels = np.asarray(first, dtype=float)
    last_pixels = np.asarray(last, dtype=float)
    candidates = []
    for offset in range(700, 1050):
        overlap = first.width - offset
        difference = first_pixels[310:460, offset:] - last_pixels[310:460, :overlap]
        candidates.append((float(np.mean(np.abs(difference))), offset))
    _, offset = min(candidates)
    panorama = Image.new('RGB', (last.width + offset, first.height))
    panorama.paste(first, (0, 0))
    seam = min(range(offset + 40, first.width - 40), key=lambda column: np.mean(np.abs(first_pixels[250:470, column-8:column+8] - last_pixels[250:470, column-offset-8:column-offset+8])))
    panorama.paste(last.crop((seam - offset, 0, last.width, last.height)), (seam, 0))
    blend_width = 64
    blend_start = seam - blend_width // 2
    first_strip = first_pixels[:, blend_start:blend_start+blend_width]
    last_strip = last_pixels[:, blend_start-offset:blend_start-offset+blend_width]
    threshold = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16
    mask = np.tile(threshold, (143, 16)) < np.linspace(0, 1, blend_width)[None, :]
    blended = np.where(mask[:, :, None], last_strip, first_strip).astype('uint8')
    panorama.paste(Image.fromarray(blended), (blend_start, 0))
    panorama = panorama.crop((0, 58, panorama.width, 572))
    panorama = panorama.resize((round(panorama.width * 360 / 514), 360), Image.Resampling.NEAREST)
    panorama.save(destination / 'town-sunset.png', optimize=True)
    metadata = {'source': args.video.name, 'sample_seconds': [0, 5.8], 'pan_offset': offset, 'size': list(panorama.size), 'usage': 'User-supplied town scenery; extracted panorama with nearest-neighbor scaling. Original video is not bundled.'}
    (destination / 'town-source.json').write_text(json.dumps(metadata, indent=2) + '\n')
    print(json.dumps(metadata))
