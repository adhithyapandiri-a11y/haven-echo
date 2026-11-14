# Version 1 verification

Verified using Godot 4.5.1 stable on macOS:

- Headless project import: successful, no script parse errors.
- Automated physics playthrough: 13 checks passed, zero failures.
- Opening screen and grounded checkpoint confirmed.
- Falling restores exactly one Echo and respawns at the checkpoint.
- Unrestored Echoes have no collision; restored Echoes support the player.
- Further deaths preserve the three-Echo cap.
- All three Echo jumps and the final bank jump completed using simulated movement/jump input and actual physics, without teleporting between platforms.
- Bus exit triggers the win state; replay clears counters and Echo collisions.
- Single-threaded Web release export: successful, generated HTML, JavaScript, WASM, and PCK files.

Browser UI verification was attempted but blocked because browser access to the local preview was declined. Browser rendering and physical keyboard input are therefore not verified in this session. The native physics tests use action input; keyboard bindings should be checked manually.

Manual browser checklist: open the locally served game, click the canvas, press Enter, move with A/D, jump with Space, press R three times, jump across the restored Echoes, enter the bus, press Enter to replay, then use Backspace to confirm a fresh level. Hold R to confirm one death per press. Check arrows and W/Up as alternate controls.
# Browser MVP verification — 2026-11-14

## Sprite and opening update

Files modified in this update: `engine.js`, `game.js`, `tests/browser-engine.cjs`, `tests/browser-ui.cjs`, `README.md`, `TESTING.md`.

Files added in this update:

- `tools/prepare-sprites.py`
- `assets/VIDEO-2026-11-14-13-13-42.mp4` (unchanged source copy)
- `assets/Shadow_creature_sprite_facing_left_c14a21bb.jpg` (unchanged source copy)
- `assets/riders.png`
- `assets/shadow.png`
- `assets/empty-bikes.png`
- `assets/sprites-source.json`

Generated outputs refreshed: `build/echoes-browser.zip`; in `build/browser-checks/`: `title.png`, `town.png`, `shadow.png`, `empty-bikes.png`, `vanished.png`, `dark.png`, `width-1024.png`, `width-768.png`, `width-390.png`, `width-320.png`.

`index.html`, `style.css`, the town panorama and its processing script, dark-world geometry, jump physics, checkpoints, and Echo progression were not changed by this update. Earlier uncommitted town-art work remains intact.

Performance spot check: headless Chrome, 175 sampled frame intervals after warm-up, median 16.7 ms and p95 16.7 ms (approximately 60 fps). This is a short local rendering measurement, not a guarantee on other devices.

- Transparent rider atlas: 48 frames × four fixed rows at 54 × 72; monster: 174 × 160; empty-bike atlas: four 54 × 38 cells. Magenta keyed per frame; binary alpha; corner decorations excluded by crop. The original inputs remain unchanged in `assets`.
- Simulation tests cover exactly two red pulses, four visible riders before abduction, clear monster reveal, only three disappearing, upright empty bikes, collapse, separate dialogue, frozen pedalling/camera on release, locked movement during the event, and a consumed opening flag after dark-world entry. The full dark-world route, deaths, Echo cap, checkpoints, and replay still pass.
- Chrome checks use real keyboard input through the complete opening and dark-world transition, verify asset loading and stop-on-release animation, capture reveal/upright/fallen-bike screenshots, and test pause, retry, jump, replay, sound, and responsive widths. No uncaught browser errors.
- Empty bicycles are reconstructed because the supplied rider footage hides bike parts. On-foot characters remain the existing procedural sprites, with the protagonist's outfit updated to match. Source compression can leave minor edge color variation. Physical-device performance and non-Chrome browsers remain unverified.


Current entry point: `index.html`. The Godot checks below refer only to the archived prototype.

- `node tests/browser-engine.cjs`: PASS. The complete playable route passes at 30, 60, and 120 simulation steps per second, including every jump, the opening timeline, input release, safe Echo anchors and cap, checkpoint, rescue, replay, and falling death.
- `tests/browser-ui.cjs`: PASS in headless Google Chrome with Playwright. Actual keyboard input checks cumulative riding, release-to-stop, the shadow/dialogue/pit/blackout/dark-world sequence, pause/resume, fast retry taps, jumping, replay, and sound toggle. No uncaught browser errors.
- Layout checks: 1440, 1024, 768, 390, and 320 pixels; no horizontal overflow. Desktop title/town/dark and phone game screenshots visually inspected. Screenshots are in `build/browser-checks`.
- Browser test setup: install Playwright in your chosen development environment, start the local server on port 8061, then run `node tests/browser-ui.cjs`. Alternatively point `PLAYWRIGHT_PATH` to an existing Playwright package directory. Chrome must be installed. Neither dependency is needed to play or deploy.
- Not verified on physical touch devices or Safari/Firefox. Touch controls are implemented; gameplay is most readable on desktop or a landscape screen.

## Archived prototype checks

