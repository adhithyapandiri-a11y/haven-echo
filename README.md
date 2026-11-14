# ECHOES: The Last Ride — Browser MVP

The current game is pure HTML/CSS/JavaScript and Canvas. No engine, package installation, build step, or third-party network requests are required. The 640 × 360 canvas combines procedural characters with the supplied sunset-town scenery. The former Godot prototype is retained only as an archive.

## Town artwork

`assets/town-sunset.png` is a scrolling panorama extracted from the supplied `Animate_pixel_art_town_clean.mp4`. Cinema, arcade, diner, water tower, houses, and sunset come from that clip. A static panorama keeps street movement tied to player input; the MP4 does not autoplay behind a stationary player. Nearest-neighbor sampling preserves sharp pixels. The dark world reuses the same panorama and world coordinates with a cold, dim palette and red vines. The procedural town remains a fallback if the image fails to load.

Source information is in `assets/town-source.json`. To regenerate, install Python Pillow/NumPy and FFmpeg, then run `python3 tools/prepare-town.py /path/to/Animate_pixel_art_town_clean.mp4`. These tools are only needed to rebuild the art, not to play. The original video stays outside the project.

## Play the current game

### Opening sprites and sequence

Both new original files are copied into `assets`: `VIDEO-2026-11-14-13-13-42.mp4` and `Shadow_creature_sprite_facing_left_c14a21bb.jpg`. The runtime loads only the transparent PNGs: `riders.png` (48 frames at 8 fps, four rows), `shadow.png`, and `empty-bikes.png`. Frame selection advances only while riding; there is no video playback. The striped-shirt rider in row zero is the leftmost protagonist. Nearest-neighbor drawing and binary alpha preserve crisp edges. The separate corner decorations are cropped out, and magenta edge spill is suppressed. Empty bicycles are reconstructed in matching colors because the source riders obscure parts of their bikes. Walking sprites remain procedural, with the protagonist's striped shirt and red backpack retained.

After 5.6 seconds of accumulated forward movement, the sequence plays once per run: two red pulses (1.6 s), monster reveal (2.2 s), abduction flash (0.24 s), upright empty bikes (0.65 s), toppling bikes (0.9 s), “What happened?!” (1.8 s), then “I have to save them!” (2 s). The crimson environment persists through the approach and fall. Controls return after the second line. The pit grows open as the rider approaches. Gentle effects reduce flash brightness without changing sequence timing. Replay deliberately resets the sequence.

Regenerate the processed sprites with `python3 tools/prepare-sprites.py` (FFmpeg, Pillow, and NumPy needed for processing only). Optional `--video` and `--monster` arguments copy alternate inputs into `assets`. Processing details are recorded in `assets/sprites-source.json`.

Open `index.html` directly in a browser, or run from this folder:

```sh
python3 -m http.server 8061 --bind 127.0.0.1
```

Visit http://127.0.0.1:8061. Click **Start the ride**. Hold **D / Right Arrow** to ride; releasing stops the group, camera, and pedalling. After the supernatural sequence and both dialogue lines, keep riding to the corrupted pit. **A / D** also steer during the fall.

In the dark town: **A / D or arrows** move, **Space / W / Up** jump (hold for height), **R** leaves an Echo and retries, **Escape** pauses. On-screen buttons support touch. The game pauses when the window loses focus. Sound is optional; gentle red effects default on. There is no saved progress.

## First-level route

Jump the first red spikes. The broken road needs three Echo platforms. Each death, including R, restores the next safe, fixed anchor; the three permanent platforms never disappear. You may build all three at the checkpoint. Jump from the road edge across the three platforms to the opposite bank. The flag saves a checkpoint for this run. Cross the spikes and patrolling shadow using the raised ledges, then enter the doorway to reunite with all three friends. Unlimited retries; replay resets the story and Echoes.

## Deploy

Upload `index.html`, `style.css`, `engine.js`, `game.js`, and the `assets` folder to any static host, keeping the folder structure. For itch.io, zip these files and `assets` with `index.html` at the zip root and choose an HTML browser game, 16:9 / 1280 × 720 or responsive embed. No server-side code or special cross-origin headers are needed. Do not upload the old `build/web` Godot export as the current game.

## Validate

```sh
node tests/browser-engine.cjs
```

This drives the actual simulation through the timed opening and every jump in the level, testing pause, death, the Echo cap, checkpoints, rescue, and replay. `engine.js` owns the simulation; `game.js` owns pixel drawing, input, UI, and synthesized audio. Add `?test` to the browser URL to expose the simulation to browser tests.

The MVP is one complete short level. Walking sprites and music remain procedural, the fall is steerable but scripted, and progress lasts for the current session only. Compressed source video limits fine sprite detail; the keyed sprites are not hand-redrawn. The copied MP4/JPG are source material and need not be deployed; the game requires the PNG assets only.

<details><summary>Archived Godot prototype documentation (superseded)</summary>

A small Godot 4 / GDScript puzzle platformer set on a haunted overpass in October 1986. All graphics are drawn in code; no external artwork, plugins, or paid assets are needed. Desktop keyboard play, one level, no audio or save system in this MVP.

## Play in Godot

Tested with **Godot 4.5.1 standard (not .NET)**. Import `project.godot` in Godot, then press **F6** with the main scene open or **F5** to run the project. Press **Enter** on the opening screen.

| Key | Action |
| --- | --- |
| A / D or left / right | Move |
| Space / W / up | Jump; hold for maximum height, release for a short hop |
| R | Sacrifice and instantly respawn; restore the next Echo |
| Backspace | Reset the entire level, including Echoes and counters |
| Enter | Start / replay from the win screen |

Movement includes acceleration, braking, 110 ms coyote time, and a 120 ms jump buffer. Falling below the screen immediately returns you to the bus-stop checkpoint. Death restores the next fixed safe anchor, from left to right, up to three. Later deaths never erase platforms. R on the win screen also replays.

## Puzzle solution

The far bank is beyond a single jump. Restore all three marked Echoes by falling or using R. You can restore them all at the checkpoint or discover them through attempts. Run toward the right edge of each platform, hold jump while moving right, and land on the next one. Reach the lit bus door to finish. There are no limited lives or permanent failure states.

## Browser build

The `Web` export preset uses Compatibility rendering and disables threads. This avoids the cross-origin isolation requirement for threaded exports. Godot's [Web export documentation](https://docs.godotengine.org/en/4.5/tutorials/export/exporting_for_web.html) covers browser requirements. Use a desktop browser with WebGL 2 enabled.

1. Install the matching export templates through Godot's **Editor → Manage Export Templates** if needed.
2. Choose **Project → Export → Web → Export Project** and save to `build/web/index.html`.
3. Serve the build over HTTP, not by double-clicking the HTML:

```sh
python3 tools/serve.py
```

Open http://127.0.0.1:8060 and click the game if keyboard focus is elsewhere. The server binds only to your computer. To host elsewhere, upload the contents of `build/web` together; keep the generated filenames unchanged. For itch.io, zip these files with `index.html` at the archive root and select an HTML game. The game is keyboard-only.

Command-line export from this folder, with `godot` pointing to the standard executable:

```sh
godot --headless --path . --editor --import --quit
mkdir -p build/web
godot --headless --path . --export-release Web build/web/index.html
```

## Verify

```sh
godot --headless --path . --script tests/smoke.gd
```

The smoke test drives the actual character physics through each required jump and checks fall death, checkpoint respawn, inactive/active platform collisions, the three-Echo cap, the exit, and clean replay. Expected result: `SMOKE RESULT: 0 failures`.

## Files

- `scripts/game.gd`: level geometry, Echo progression, opening/win screens, procedural art, input bindings.
- `scripts/player.gd`: player movement and drawing.
- `scenes/main.tscn`: runnable entry scene.
- `export_presets.cfg`: single-threaded Web configuration.
- `tests/smoke.gd`: deterministic gameplay checks.
- `build/web`: generated browser deliverable (excluded from source control).

The short route is deliberately designed for a first playable release. Later additions could include sound, additional levels, or requiring each Echo to be discovered, without changing the core death/checkpoint loop.
</details>
