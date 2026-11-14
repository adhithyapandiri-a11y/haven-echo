extends Node2D

const Player = preload("res://scripts/player.gd")
const CHECKPOINT := Vector2(240, 498)
const ANCHORS := [Rect2(380, 460, 100, 16), Rect2(580, 385, 100, 16), Rect2(780, 310, 100, 16)]
const CYAN := Color("8ae1d2")
const PALE := Color("e9e4d6")
var player: CharacterBody2D
var echoes: Array[StaticBody2D] = []
var echo_count := 0
var deaths := 0
var state := "intro"
var elapsed := 0.0
var flash := 0.0
var notice := ""
var notice_time := 0.0
var font: Font = ThemeDB.fallback_font

func _ready() -> void:
	bind_key("left", [KEY_A, KEY_LEFT])
	bind_key("right", [KEY_D, KEY_RIGHT])
	bind_key("jump", [KEY_SPACE, KEY_W, KEY_UP])
	bind_key("sacrifice", [KEY_R])
	bind_key("restart", [KEY_BACKSPACE])
	bind_key("start", [KEY_ENTER])
	make_platform(Rect2(0, 520, 300, 150))
	make_platform(Rect2(930, 310, 222, 360))
	for anchor in ANCHORS:
		var platform := make_platform(anchor)
		platform.collision_layer = 0
		echoes.append(platform)
	player = Player.new()
	add_child(player)
	player.reset_at(CHECKPOINT)
	player.visible = false

func bind_key(action: String, keys: Array) -> void:
	if InputMap.has_action(action):
		return
	InputMap.add_action(action)
	for key in keys:
		var event := InputEventKey.new()
		event.physical_keycode = key
		InputMap.action_add_event(action, event)

func make_platform(rect: Rect2) -> StaticBody2D:
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
	elapsed = 0.0
	for platform in echoes:
		platform.collision_layer = 0
	state = "playing"
	player.enabled = true
	player.visible = true
	player.reset_at(CHECKPOINT)
	notice = "The road is gone. Your echoes remember the way."
	notice_time = 5.0

func die() -> void:
	if state != "playing":
		return
	deaths += 1
	if echo_count < ANCHORS.size():
		echoes[echo_count].collision_layer = 1
		echo_count += 1
		notice = "ECHO %02d RESTORED  /  A memory you can stand on." % echo_count
	else:
		notice = "All three echoes remain. Take your time."
	notice_time = 3.5
	flash = 0.16
	player.reset_at(CHECKPOINT)

func _unhandled_key_input(event: InputEvent) -> void:
	if event is InputEventKey and event.echo:
		return
	if event.is_action_pressed("start") and state != "playing":
		start_run()
	elif event.is_action_pressed("restart"):
		start_run()
	elif event.is_action_pressed("sacrifice"):
		if state == "won":
			start_run()
		else:
			die()

func _physics_process(delta: float) -> void:
	flash = maxf(0.0, flash - delta)
	notice_time = maxf(0.0, notice_time - delta)
	if state == "playing":
		elapsed += delta
		if player.position.y > 625:
			die()
		elif player.position.x > 1030 and player.position.y < 315 and player.is_on_floor():
			state = "won"
			player.enabled = false
			player.visible = false
	queue_redraw()

func label_at(text: String, point: Vector2, size: int = 18, color: Color = PALE) -> void:
	draw_string(font, point, text, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)

func centered(text: String, baseline: float, size: int, color: Color = PALE) -> void:
	label_at(text, Vector2((1152 - font.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x) / 2, baseline), size, color)

func _draw() -> void:
	draw_rect(Rect2(0, 0, 1152, 648), Color("0c1124"))
	for band in range(12):
		draw_rect(Rect2(0, 160 + band * 32, 1152, 32), Color(0.12 + band * 0.003, 0.12, 0.22, 0.5))
	draw_circle(Vector2(844, 151), 67, Color("252d48"))
	draw_circle(Vector2(844, 151), 47, Color("b2bac2"))
	draw_circle(Vector2(865, 137), 43, Color("252d48"))
	for star in range(42):
		var point := Vector2(20 + (star * 157) % 1110, 100 + (star * 73) % 260)
		draw_circle(point, 1, Color(0.7, 0.75, 0.9, 0.35))
	for tree in range(26):
		var horizontal := float(tree * 49 - 30)
		var height := float(80 + (tree * 37) % 160)
		draw_colored_polygon(PackedVector2Array([Vector2(horizontal, 490 - height), Vector2(horizontal - 55, 540), Vector2(horizontal + 55, 540)]), Color("111c2b"))
	for fog in range(5):
		draw_rect(Rect2(0, 440 + fog * 37, 1152, 13), Color(0.34, 0.48, 0.58, 0.035))
	draw_rect(Rect2(0, 520, 300, 128), Color("192334"))
	draw_rect(Rect2(0, 520, 300, 8), Color("68717c"))
	draw_rect(Rect2(930, 310, 222, 338), Color("192334"))
	draw_rect(Rect2(930, 310, 222, 8), Color("68717c"))
	for stripe in range(6):
		draw_rect(Rect2(stripe * 54, 536, 26, 3), Color("a78e74"))
	for support in [75, 210, 960, 1090]:
		draw_rect(Rect2(support, 550 if support < 300 else 336, 13, 300), Color("101825"))
	draw_line(Vector2(225, 520), Vector2(225, 420), Color("88929c"), 3)
	draw_rect(Rect2(194, 413, 62, 29), Color("b8c5bc"))
	label_at("STOP", Vector2(202, 433), 16, Color("263347"))
	draw_circle(Vector2(240, 515), 21, Color(0.54, 0.88, 0.82, 0.12))
	label_at("CHECKPOINT", Vector2(160, 568), 13, CYAN)
	for index in range(ANCHORS.size()):
		var anchor: Rect2 = ANCHORS[index]
		var active := index < echo_count
		var color := CYAN if active else Color("596779")
		if active:
			draw_rect(anchor.grow(7), Color(0.4, 0.9, 0.8, 0.06))
			draw_rect(anchor, Color("365d64"))
			draw_rect(Rect2(anchor.position, Vector2(100, 3)), CYAN)
		else:
			for dash in range(7):
				draw_line(anchor.position + Vector2(dash * 15, 0), anchor.position + Vector2(dash * 15 + 8, 0), color, 2)
		label_at("%02d" % (index + 1), anchor.position + Vector2(40, -15), 16, color)
		if active:
			draw_line(anchor.position + Vector2(14, 8), anchor.position + Vector2(85, 8), Color(0.54, 0.88, 0.82, 0.25), 1)
	draw_rect(Rect2(995, 246, 135, 54), Color("b0a389"))
	draw_rect(Rect2(1002, 254, 95, 23), Color("253d4b"))
	draw_rect(Rect2(1102, 253, 20, 47), Color("f1d2a0"))
	for wheel in [1018, 1100]:
		draw_circle(Vector2(wheel, 301), 10, Color("0a1020"))
	label_at("LAST RIDE", Vector2(1001, 241), 13, PALE)
	draw_rect(Rect2(0, 0, 1152, 88), Color(0.03, 0.05, 0.10, 0.9))
	label_at("E C H O E S", Vector2(32, 42), 27)
	label_at("THE LAST RIDE  /  OCTOBER 1986", Vector2(34, 66), 12, Color("a2a6b8"))
	label_at("ECHOES  %d / 3" % echo_count, Vector2(794, 39), 18, CYAN)
	label_at("DEATHS  %02d" % deaths, Vector2(985, 39), 18)
	label_at("01  /  THE BROKEN OVERPASS", Vector2(794, 65), 12, Color("a2a6b8"))
	draw_rect(Rect2(0, 598, 1152, 50), Color("0b1120"))
	centered("A / D or arrows  MOVE      SPACE / W / UP  JUMP      R  SACRIFICE      BACKSPACE  RESET LEVEL", 628, 15, Color("b9c2ce"))
	if notice_time > 0 and state == "playing":
		centered(notice, 125, 18, CYAN)
	elif state == "playing":
		centered("Each death makes the next marked echo solid. Reach the last bus.", 125, 17, CYAN)
	if flash > 0:
		draw_rect(Rect2(0, 88, 1152, 510), Color(0.6, 0.95, 0.9, flash * 1.8))
	if state != "playing":
		draw_rect(Rect2(0, 88, 1152, 510), Color(0.025, 0.04, 0.09, 0.88))
		centered("HAVEN COUNTY  /  11:58 PM", 184, 15, CYAN)
		centered("ECHOES" if state == "intro" else "YOU MADE THE LAST RIDE.", 262, 64 if state == "intro" else 40)
		centered("T H E   L A S T   R I D E" if state == "intro" else "Some part of you will always be here.", 303, 21, Color("dba99c"))
		if state == "intro":
			centered("The last bus is waiting across a road that no longer exists.", 365, 19)
			centered("Every death leaves an echo. Three memories. One way home.", 397, 19)
			centered("Fall or press R to restore a marked platform. Your echoes stay.", 439, 16, CYAN)
		else:
			centered("%d echoes restored    /    %d deaths    /    %02d:%02d" % [echo_count, deaths, int(elapsed) / 60, int(elapsed) % 60], 381, 20, CYAN)
			centered("VERSION ONE  /  END OF TRANSMISSION", 427, 15)
		centered("[ ENTER ]  " + ("BEGIN" if state == "intro" else "PLAY AGAIN"), 508, 22)
