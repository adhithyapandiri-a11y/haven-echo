# ==========================================================
# echo_platform.gd
# The core mechanic of "ECHOES: The Last Ride"
# Starts intangible (transparent outline). When restored,
# it becomes solid collision that the player can walk on.
# ==========================================================
extends StaticBody2D

@export var echo_id: int = 1
@export var platform_size: Vector2 = Vector2(100, 16)

var is_solid: bool = false
const CYAN_SOLID := Color("8ae1d2")
const CYAN_GLOW := Color(0.4, 0.9, 0.8, 0.12)
const DORMANT_OUTLINE := Color("485568")

@onready var collision_shape: CollisionShape2D = $CollisionShape2D

func _ready() -> void:
	reset_platform()

func reset_platform() -> void:
	is_solid = false
	collision_layer = 0
	collision_mask = 0
	queue_redraw()

func restore() -> void:
	is_solid = true
	collision_layer = 1
	collision_mask = 0
	queue_redraw()

func _draw() -> void:
	var rect := Rect2(Vector2.ZERO, platform_size)
	
	if is_solid:
		# Glow aura
		draw_rect(rect.grow(8), CYAN_GLOW)
		# Solid platform core
		draw_rect(rect, Color("203e48"))
		# Top neon edge
		draw_rect(Rect2(0, 0, platform_size.x, 3), CYAN_SOLID)
		# Echo Label
		draw_string(ThemeDB.fallback_font, Vector2(36, -10), "ECHO %02d" % echo_id, HORIZONTAL_ALIGNMENT_LEFT, -1, 13, CYAN_SOLID)
	else:
		# Dormant dashed outline showing where the Echo anchor is
		for i in range(8):
			var start_x := i * (platform_size.x / 8.0)
			draw_line(Vector2(start_x, 0), Vector2(start_x + 6, 0), DORMANT_OUTLINE, 2)
		draw_string(ThemeDB.fallback_font, Vector2(38, -10), "%02d" % echo_id, HORIZONTAL_ALIGNMENT_LEFT, -1, 13, DORMANT_OUTLINE)
