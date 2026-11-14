# ==========================================================
# game.gd
# Main Game Coordinator for "ECHOES: The Last Ride"
# Supports 3 Full Chapters with distinct themes,
# increased obstacles, shadowed silhouette backgrounds,
# and complete narrative progression.
# ==========================================================
extends Node2D

const PlayerScript = preload("res://scripts/player.gd")

const CHECKPOINT := Vector2(240, 498)

# Level Configurations
const LEVEL_CONFIGS = {
	1: {
		"title": "CHAPTER 01: THE BROKEN OVERPASS",
		"location": "HAVEN COUNTY • OAK STREET RIFT",
		"theme_color": Color("8ae1d2"), # Cold Cyan
		"bg_top": Color("0a121c"),
		"bg_shadow": Color("172635"),
		"ground": Color("15212d"),
		"spikes": [Rect2(530, 510, 40, 10), Rect2(880, 510, 45, 10)],
		"anchors": [Rect2(380, 460, 100, 16), Rect2(580, 385, 100, 16), Rect2(780, 310, 100, 16)],
		"radio_intro": "Sam?! Can you hear me?! We fell through the road... cross the broken overpass!",
		"radio_win": "Lucas is rescued! Maya and Ben were dragged toward the Power Substation!"
	},
	2: {
		"title": "CHAPTER 02: THE POWER SUBSTATION",
		"location": "HIGH VOLTAGE YARD • INDUSTRIAL RIFT",
		"theme_color": Color("f59e0b"), # Amber Voltage
		"bg_top": Color("14081e"),
		"bg_shadow": Color("261238"),
		"ground": Color("200f30"),
		"spikes": [Rect2(480, 510, 45, 10), Rect2(680, 430, 45, 10), Rect2(880, 360, 45, 10)],
		"anchors": [Rect2(370, 450, 90, 16), Rect2(560, 375, 90, 16), Rect2(760, 300, 90, 16)],
		"radio_intro": "Industrial hums crackle on the radio: 'Sam! Watch the high-voltage arcs!'",
		"radio_win": "Ben is rescued! He points up: 'Maya was taken to the top of the Water Tower!'"
	},
	3: {
		"title": "CHAPTER 03: THE WATER TOWER CORE",
		"location": "THE APEX • COSMIC RIFT ANCHOR",
		"theme_color": Color("ef4444"), # Crimson Core
		"bg_top": Color("160309"),
		"bg_shadow": Color("330a17"),
		"ground": Color("240610"),
		"spikes": [Rect2(460, 510, 50, 10), Rect2(650, 420, 50, 10), Rect2(850, 350, 50, 10)],
		"anchors": [Rect2(360, 440, 80, 16), Rect2(550, 365, 80, 16), Rect2(750, 290, 80, 16)],
		"radio_intro": "Cosmic winds howl: 'The rift anchor is pulsing at the tower summit! Free Maya!'",
		"radio_win": "THE CORE IS SHATTERED. Maya, Lucas, and Ben are safe. Four friends ride home."
	}
}

var current_level: int = 1
var state: String = "intro" # "intro", "playing", "won"
var echo_count: int = 0
var deaths: int = 0
var elapsed_time: float = 0.0
var flash_timer: float = 0.0

var radio_speaker: String = ""
var radio_message: String = ""
var radio_timer: float = 0.0

var player: CharacterBody2D
var echoes: Array[StaticBody2D] = []
var platforms: Array[StaticBody2D] = []
var default_font: Font = ThemeDB.fallback_font

# For smoke test compatibility
var ANCHORS: Array[Rect2] = []

func _ready() -> void:
	_setup_inputs()
	_load_level(1)

func _setup_inputs() -> void:
	_bind_action("left", [KEY_A, KEY_LEFT])
	_bind_action("right", [KEY_D, KEY_RIGHT])
	_bind_action("jump", [KEY_SPACE, KEY_W, KEY_UP])
	_bind_action("sacrifice", [KEY_R])
	_bind_action("restart", [KEY_BACKSPACE])
	_bind_action("start", [KEY_ENTER])

func _bind_action(action: String, keys: Array) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action)
		for key in keys:
			var event := InputEventKey.new()
			event.physical_keycode = key
			InputMap.action_add_event(action, event)

func _load_level(lvl: int) -> void:
	current_level = clampi(lvl, 1, 3)
	var cfg = LEVEL_CONFIGS[current_level]
	ANCHORS = cfg.anchors
	
	# Clean existing level geometry
	for p in platforms:
		if is_instance_valid(p): p.queue_free()
	platforms.clear()
	echoes.clear()
	
	# Solid start & end platforms
	platforms.append(_create_solid_platform(Rect2(0, 520, 300, 140)))
	platforms.append(_create_solid_platform(Rect2(930, 310, 230, 350)))
	
	# Echo Platforms
	for anchor in ANCHORS:
		var echo_plat := _create_solid_platform(anchor)
		echo_plat.collision_layer = 0
		echoes.append(echo_plat)
		platforms.append(echo_plat)
		
	if not player:
		player = PlayerScript.new()
		add_child(player)
	player.reset_at(CHECKPOINT)
	player.visible = false

func _create_solid_platform(rect: Rect2) -> StaticBody2D:
	var body := StaticBody2D.new()
	body.position = rect.position
	body.collision_layer = 1
	body.collision_mask = 0
	
	var collider := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = rect.size
	collider.position = rect.size / 2.0
	collider.shape = shape
	body.add_child(collider)
	add_child(body)
	return body

func start_run() -> void:
	echo_count = 0
	deaths = 0
	elapsed_time = 0.0
	state = "playing"
	for platform in echoes:
		platform.collision_layer = 0
		
	player.reset_at(CHECKPOINT)
	player.visible = true
	if "enabled" in player:
		player.enabled = true
		
	var cfg = LEVEL_CONFIGS[current_level]
	_broadcast_radio("LUCAS (RADIO)", cfg.radio_intro, 5.0)

func die() -> void:
	if state != "playing":
		return
	deaths += 1
	flash_timer = 0.15
	if echo_count < ANCHORS.size():
		echoes[echo_count].collision_layer = 1
		echo_count += 1
		_broadcast_radio("ECHO RESTORED", "Echo 0%d solidified! A memory you can stand on." % echo_count, 3.5)
	else:
		_broadcast_radio("RADIO NOISE", "All three echoes remain. Keep moving forward.", 2.5)
	player.reset_at(CHECKPOINT)

func _broadcast_radio(speaker: String, text: String, duration: float) -> void:
	radio_speaker = speaker
	radio_message = text
	radio_timer = duration

func _unhandled_key_input(event: InputEvent) -> void:
	if event is InputEventKey and event.echo:
		return
	if event.is_action_pressed("start"):
		if state == "intro":
			start_run()
		elif state == "won":
			if current_level < 3:
				_load_level(current_level + 1)
				start_run()
			else:
				_load_level(1)
				start_run()
	elif event.is_action_pressed("restart"):
		start_run()
	elif event.is_action_pressed("sacrifice"):
		if state == "won":
			if current_level < 3:
				_load_level(current_level + 1)
				start_run()
			else:
				_load_level(1)
				start_run()
		else:
			die()

func _physics_process(delta: float) -> void:
	flash_timer = maxf(0.0, flash_timer - delta)
	radio_timer = maxf(0.0, radio_timer - delta)
	if state == "playing":
		elapsed_time += delta
		if player.position.y > 625:
			die()
		elif player.position.x > 1030 and player.position.y < 315 and player.is_on_floor():
			state = "won"
			if "enabled" in player: player.enabled = false
			player.visible = false
	queue_redraw()

func _draw() -> void:
	var cfg = LEVEL_CONFIGS[current_level]
	var theme_col: Color = cfg.theme_color
	
	# 1. Sky Gradient
	draw_rect(Rect2(0, 0, 1152, 648), cfg.bg_top)
	for band in range(8):
		draw_rect(Rect2(0, 160 + band * 40, 1152, 40), Color(cfg.bg_top.r * 1.3, cfg.bg_top.g * 1.3, cfg.bg_top.b * 1.3, 0.4))
		
	# 2. Celestial Moon / Vortex
	draw_circle(Vector2(880, 130), 45, cfg.bg_shadow)
	draw_circle(Vector2(880, 130), 32, theme_col)
	draw_circle(Vector2(895, 120), 28, cfg.bg_shadow)
	
	# 3. ONLY SHADOWED BUILDINGS IN BACKGROUND (No front-row buildings!)
	for index in range(24):
		var bx := float(index * 52 - 10)
		var bh := float(80 + (index % 5) * 22)
		draw_rect(Rect2(bx, 280 - bh, 46, bh), cfg.bg_shadow)
		draw_rect(Rect2(bx + 6, 272 - bh, 34, 8), Color(cfg.bg_shadow.r * 1.2, cfg.bg_shadow.g * 1.2, cfg.bg_shadow.b * 1.2))
		if index % 3 == 0:
			draw_rect(Rect2(bx + 20, 260 - bh, 3, 14), cfg.bg_shadow) # Antenna
			
	# Midground Pines & Power Posts
	for tree in range(22):
		var tx := float(tree * 56 - 15)
		var th := float(70 + (tree * 35) % 110)
		draw_colored_polygon(PackedVector2Array([
			Vector2(tx, 520 - th), Vector2(tx - 40, 530), Vector2(tx + 40, 530)
		]), Color(0.06, 0.10, 0.16))
		
	# 4. Platforms & Roadway
	draw_rect(Rect2(0, 520, 300, 130), cfg.ground)
	draw_rect(Rect2(0, 520, 300, 8), Color("334155"))
	draw_rect(Rect2(930, 310, 230, 340), cfg.ground)
	draw_rect(Rect2(930, 310, 230, 8), Color("334155"))
	
	# Pillars
	for col in [60, 220, 960, 1090]:
		draw_rect(Rect2(col, 540 if col < 300 else 326, 16, 310), Color(0.03, 0.05, 0.08))
		
	# 5. Echo Platform Anchors
	for i in range(ANCHORS.size()):
		var anchor: Rect2 = ANCHORS[i]
		var is_active := i < echo_count
		var col := theme_col if is_active else Color("475569")
		if is_active:
			draw_rect(anchor.grow(6), Color(theme_col.r, theme_col.g, theme_col.b, 0.12))
			draw_rect(anchor, Color("1e293b"))
			draw_rect(Rect2(anchor.position, Vector2(anchor.size.x, 3)), theme_col)
			draw_string(default_font, anchor.position + Vector2(25, -14), "ECHO 0%d" % (i + 1), HORIZONTAL_ALIGNMENT_LEFT, -1, 14, theme_col)
		else:
			for dash in range(6):
				draw_line(anchor.position + Vector2(dash * 16, 0), anchor.position + Vector2(dash * 16 + 8, 0), col, 2)
			draw_string(default_font, anchor.position + Vector2(40, -14), "0%d" % (i + 1), HORIZONTAL_ALIGNMENT_LEFT, -1, 14, col)

	# 6. Spikes / Hazards (Dynamic per level)
	for spike in cfg.spikes:
		draw_rect(spike, Color("ef4444"))
		for sp in range(int(spike.size.x / 10)):
			draw_colored_polygon(PackedVector2Array([
				Vector2(spike.position.x + sp * 10, spike.position.y),
				Vector2(spike.position.x + sp * 10 + 5, spike.position.y - 12),
				Vector2(spike.position.x + sp * 10 + 10, spike.position.y)
			]), Color("ef4444"))

	# 7. Goal Doorway / Bus Shelter
	draw_rect(Rect2(1000, 240, 130, 62), Color("1e293b"))
	draw_rect(Rect2(1100, 246, 22, 54), theme_col)
	draw_string(default_font, Vector2(1005, 234), "SECTOR EXIT ↗", HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color("#f8fafc"))
	
	# 8. Top Status Header
	draw_rect(Rect2(0, 0, 1152, 76), Color(0.04, 0.06, 0.12, 0.94))
	draw_string(default_font, Vector2(32, 38), "E C H O E S", HORIZONTAL_ALIGNMENT_LEFT, -1, 24, Color("#f8fafc"))
	draw_string(default_font, Vector2(34, 60), cfg.title + " • " + cfg.location, HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color("#94a3b8"))
	draw_string(default_font, Vector2(780, 36), "ECHOES: %d / 3" % echo_count, HORIZONTAL_ALIGNMENT_LEFT, -1, 18, theme_col)
	draw_string(default_font, Vector2(980, 36), "DEATHS: %02d" % deaths, HORIZONTAL_ALIGNMENT_LEFT, -1, 18, Color("#f8fafc"))
	
	# Radio transmission box
	if radio_timer > 0.0 and state == "playing":
		var bx := 236.0
		var by := 92.0
		var bw := 680.0
		var bh := 64.0
		draw_rect(Rect2(bx, by, bw, bh), Color(0.05, 0.09, 0.18, 0.95))
		draw_rect(Rect2(bx, by, bw, bh), theme_col, false, 2)
		draw_string(default_font, Vector2(bx + 18, by + 24), "📻 " + radio_speaker, HORIZONTAL_ALIGNMENT_LEFT, -1, 13, theme_col)
		draw_string(default_font, Vector2(bx + 18, by + 48), radio_message, HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color("#f8fafc"))

	# Flash effect
	if flash_timer > 0.0:
		draw_rect(Rect2(0, 0, 1152, 648), Color(theme_col.r, theme_col.g, theme_col.b, flash_timer * 2.0))

	# Story Overlays
	if state == "intro":
		draw_rect(Rect2(0, 76, 1152, 532), Color(0.03, 0.05, 0.11, 0.94))
		_draw_centered("HAVEN COUNTY, INDIANA • OCTOBER 24, 1986", 180, 14, theme_col)
		_draw_centered("ECHOES: THE LAST RIDE", 250, 48, Color("#f8fafc"))
		_draw_centered("The bridge collapsed into an otherworldly rift. Lucas, Maya, and Ben vanished.", 320, 18, Color("#94a3b8"))
		_draw_centered("Every sacrifice leaves an Echo. Three memories to rebuild the way home.", 360, 18, theme_col)
		_draw_centered("[ PRESS ENTER TO BEGIN ]", 480, 22, Color("#f59e0b"))
	elif state == "won":
		draw_rect(Rect2(0, 76, 1152, 532), Color(0.03, 0.05, 0.11, 0.95))
		_draw_centered(cfg.title + " COMPLETED", 180, 18, theme_col)
		_draw_centered("NEVER RIDE ALONE.", 250, 42, Color("#f8fafc"))
		_draw_centered(cfg.radio_win, 320, 17, Color("#f8fafc"))
		var stats := "Echoes Used: %d / 3 • Deaths: %02d • Time: %02d:%02d" % [echo_count, deaths, int(elapsed_time)/60, int(elapsed_time)%60]
		_draw_centered(stats, 380, 18, theme_col)
		var next_prompt := "[ PRESS ENTER TO ENTER NEXT CHAPTER ]" if current_level < 3 else "[ PRESS ENTER TO RESTART CAMPAIGN ]"
		_draw_centered(next_prompt, 480, 20, Color("#f59e0b"))

func _draw_centered(text: String, y: float, size: int, color: Color) -> void:
	var w := default_font.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
	draw_string(default_font, Vector2((1152 - w) / 2.0, y), text, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)
