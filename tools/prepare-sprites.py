"""Extract keyed, fixed-cell sprites from the user-supplied source assets."""
from pathlib import Path
import argparse
import json
import shutil
import subprocess
import tempfile

import numpy as np
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
assets = root / 'assets'
parser = argparse.ArgumentParser()
parser.add_argument('--video', type=Path, default=assets / 'VIDEO-2026-11-14-13-13-42.mp4')
parser.add_argument('--monster', type=Path, default=assets / 'Shadow_creature_sprite_facing_left_c14a21bb.jpg')
arguments = parser.parse_args()
video, monster = arguments.video, arguments.monster
for source in (video, monster):
    if source.resolve() != (assets / source.name).resolve():
        shutil.copy2(source, assets / source.name)

def key_image(image, background):
    pixels = np.asarray(image.convert('RGB')).astype(float)
    distance = np.sqrt(np.sum((pixels - background) ** 2, axis=2))
    alpha = np.where(distance < 78, 0, 255).astype('uint8')
    spill = (pixels[:, :, 0] > 125) & (pixels[:, :, 2] > 120) & (pixels[:, :, 1] < 90) & (distance < 145)
    alpha[spill] = 0
    transparent = alpha == 0
    boundary = np.zeros(transparent.shape, dtype=bool)
    boundary[1:] |= transparent[:-1]
    boundary[:-1] |= transparent[1:]
    boundary[:, 1:] |= transparent[:, :-1]
    boundary[:, :-1] |= transparent[:, 1:]
    fringe = boundary & (pixels[:, :, 0] > pixels[:, :, 1] + 30) & (pixels[:, :, 2] > pixels[:, :, 1] + 30)
    pixels[:, :, 0][fringe] = np.minimum(pixels[:, :, 0][fringe], pixels[:, :, 1][fringe] + 25)
    pixels[:, :, 2][fringe] = np.minimum(pixels[:, :, 2][fringe], pixels[:, :, 1][fringe] + 35)
    result = np.dstack((pixels.astype('uint8'), alpha))
    result[alpha == 0, :3] = 0
    return Image.fromarray(result)

with tempfile.TemporaryDirectory() as directory:
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(assets / video.name), '-vf', 'fps=8', str(Path(directory) / '%03d.png')], check=True)
    atlas = Image.new('RGBA', (54 * 48, 72 * 4))
    for frame_index, frame_path in enumerate(sorted(Path(directory).glob('*.png'))):
        frame = Image.open(frame_path).convert('RGB')
        background = np.median(np.asarray(frame)[10:50, 10:50], axis=(0, 1))
        keyed = key_image(frame, background)
        for rider_index, (left, right) in enumerate([(22, 234), (234, 434), (434, 634), (634, 838)]):
            sprite = keyed.crop((left, 100, right, 380)).resize((54, 72), Image.Resampling.NEAREST)
            atlas.paste(sprite, (frame_index * 54, rider_index * 72))
    atlas.save(assets / 'riders.png', optimize=True)

creature = Image.open(assets / monster.name).convert('RGB')
creature = key_image(creature, np.array([255, 0, 255])).crop((250, 0, 1080, 768))
creature = creature.crop(creature.getbbox())
creature.resize((174, 160), Image.Resampling.NEAREST).save(assets / 'shadow.png', optimize=True)

bikes = Image.new('RGBA', (54 * 4, 38))
for rider_index, color in enumerate(['#863c44', '#d385ac', '#d2bd40', '#4b92bb']):
    sprite = Image.new('RGBA', (54, 38))
    painter = ImageDraw.Draw(sprite)
    for center in [12, 42]:
        painter.ellipse((center-10, 16, center+10, 36), fill='#171a24')
        painter.ellipse((center-7, 19, center+7, 33), fill=(0, 0, 0, 0), outline='#a2a5a1')
        painter.line((center-6, 21, center+6, 31), fill='#6e747c')
        painter.line((center-6, 31, center+6, 21), fill='#6e747c')
    painter.line([(12, 26), (22, 10), (29, 26), (12, 26)], fill=color, width=2)
    painter.line([(22, 10), (39, 10), (29, 26)], fill=color, width=2)
    painter.line([(42, 26), (37, 3), (43, 3)], fill=color, width=2)
    painter.line((17, 8, 26, 8), fill='#161b24', width=3)
    painter.line((29, 26, 34, 28), fill='#afb0a5', width=2)
    bikes.paste(sprite, (rider_index*54, 0))
bikes.save(assets / 'empty-bikes.png', optimize=True)
(assets / 'sprites-source.json').write_text(json.dumps({
    'riders': {'source': video.name, 'frames': 48, 'fps': 8, 'cell': [54, 72], 'rows': ['striped protagonist', 'purple jacket', 'green hoodie', 'yellow jacket'], 'key': 'per-frame sampled magenta; binary alpha', 'watermark': 'excluded by fixed crop below y=380'},
    'shadow': {'source': monster.name, 'size': [174, 160], 'watermark': 'excluded by crop outside creature bounds'},
    'empty_bikes': 'Reconstructed pixel bicycles with matching frame colors; source riders occlude the original bicycle geometry.'
}, indent=2) + '\n')
print('Created riders.png (48 frames × 4 riders), shadow.png, empty-bikes.png, and provenance metadata.')
