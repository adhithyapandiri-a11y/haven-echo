# ECHOES: The Last Ride — Godot 4 & Web Edition

> **Hack Club Haven 2026 Submission**  
> Built for Godot 4 (Standard) • Compatible with desktop & web browsers.

---

## 📖 Storyline & Level 1: "The Broken Overpass"

**Setting:** Haven County, Indiana • October 24, 1986 • 11:42 PM  

You play as **Sam** (wearing a red backpack and striped shirt). While biking home through the autumn woods, an otherworldly rift shatters County Road 9. Your three friends—**Lucas**, **Maya**, and **Ben**—vanish into the misty chasm below, leaving behind only their bicycles and a crackling walkie-talkie.

### The Core Mechanic: *The Echo*
Across the 600-foot rift, normal jumping cannot reach the far bank. However, each time Sam falls (or presses **R** to make a sacrifice), a spectral **Echo Platform** solidifies permanently in the void:
1. **Echo 01:** First stepping stone over the deep drop.
2. **Echo 02:** Mid-air boost platform.
3. **Echo 03:** Final anchor to reach the far cliff.

### Level 1 Climax: The Abandoned Bus
Reaching the Haven County Transit Bus shelter completes Level 1 and reveals the narrative payoff:
Inside the lit bus shelter, Sam discovers Lucas's yellow walkie-talkie and Maya's tape recorder. The recorded message reveals that their friends are being drawn toward the abandoned water tower deeper in Haven County, setting the stage for Chapter 2.

---

## 📂 Godot 4 Folder Structure

This project is organized into modular components that can be edited in the Godot 4 Inspector:

```
Haven/
├── project.godot            # Godot 4 project configuration
├── export_presets.cfg       # Web (HTML5) export preset
│
├── scenes/                  # Godot Scenes (.tscn)
│   ├── main.tscn            # Main Level 1 scene
│   ├── player.tscn          # Player CharacterBody2D scene
│   ├── echo_platform.tscn   # Spectral Echo stepping platform
│   ├── hazard.tscn          # Spike / void hazard Area2D
│   └── bus_stop.tscn        # Goal / Transit bus area
│
├── scripts/                 # Clean, commented GDScript (.gd)
│   ├── game.gd              # Main game loop, state & echo restoration coordinator
│   ├── player.gd            # Snappy platformer physics (coyote time & jump buffer)
│   ├── echo_platform.gd     # Solidifying platform logic and glow effects
│   ├── hazard.gd            # Hazard collision triggers
│   ├── bus_stop.gd          # Goal trigger
│   └── hud.gd               # UI, statistics & Walkie-Talkie radio subtitles
│
├── build/web/               # Exported standalone Godot Web build
└── index.html               # Instant browser preview runner
```

---

## 🎮 How to Play & Test

### Option 1: Browser Preview (Instant)
The local development server is running at:
👉 **http://127.0.0.1:8061**

### Option 2: In Godot 4
1. Open **Godot 4.3 / 4.4 / 4.5**.
2. Click **Import**, navigate to this `Haven` folder, and select `project.godot`.
3. Press **F5** (or the Play button) to run `scenes/main.tscn`.
4. Double-click `scenes/player.tscn` or `scenes/echo_platform.tscn` in the FileSystem dock to edit shapes, physics, or visuals in the 2D viewport.

### Controls:
* **A / D** or **Left / Right Arrows:** Move Sam
* **Space / W / Up Arrow:** Jump (hold for maximum height, tap for short hop)
* **R:** Sacrifice & restore the next Echo platform
* **Backspace:** Restart the level
* **Enter:** Start / Play Again
