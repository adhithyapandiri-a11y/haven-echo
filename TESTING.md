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

Current entry point: `index.html`. The Godot checks below refer only to the archived prototype.

- `node tests/browser-engine.cjs`: PASS. The complete playable route passes at 30, 60, and 120 simulation steps per second, including every jump, the opening timeline, input release, safe Echo anchors and cap, checkpoint, rescue, replay, and falling death.
- `tests/browser-ui.cjs`: PASS in headless Google Chrome with Playwright. Actual keyboard input checks cumulative riding, release-to-stop, the shadow/dialogue/pit/blackout/dark-world sequence, pause/resume, fast retry taps, jumping, replay, and sound toggle. No uncaught browser errors.
- Layout checks: 1440, 1024, 768, 390, and 320 pixels; no horizontal overflow. Desktop title/town/dark and phone game screenshots visually inspected. Screenshots are in `build/browser-checks`.
- Browser test setup: install Playwright in your chosen development environment, start the local server on port 8061, then run `node tests/browser-ui.cjs`. Alternatively point `PLAYWRIGHT_PATH` to an existing Playwright package directory. Chrome must be installed. Neither dependency is needed to play or deploy.
- Not verified on physical touch devices or Safari/Firefox. Touch controls are implemented; gameplay is most readable on desktop or a landscape screen.

## Archived prototype checks

