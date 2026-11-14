# ==========================================================
# player.gd
# Player Controller for "ECHOES: The Last Ride"
# Standard CharacterBody2D platformer physics with coyote time
# and jump buffering.
# ==========================================================
extends CharacterBody2D

signal died

# Movement constants (feels snappy like classic 80s platformers)
const SPEED := 300.0
const GRAVITY := 1450.0
const JUMP_VELOCITY := -510.0
const JUMP_CUTOFF := -180.0

# Coyote time & jump buffer tolerances
const COYOTE_TIME := 0.12
const JUMP_BUFFER_TIME := 0.12

var coyote_timer := 0.0
var jump_buffer_timer := 0.0
var enabled: bool = false:
	get: return is_active
	set(val): is_active = val

func reset_at(checkpoint: Vector2) -> void:
	respawn(checkpoint)
var facing_direction := 1.0
var walk_cycle := 0.0

func _ready() -> void:
	collision_layer = 2
	collision_mask = 1

func respawn(spawn_pos: Vector2) -> void:
	position = spawn_pos
	velocity = Vector2.ZERO
	coyote_timer = 0.0
	jump_buffer_timer = 0.0
	is_active = true
	visible = true
	if is_inside_tree():
		reset_physics_interpolation()

func disable() -> void:
	is_active = false
	velocity = Vector2.ZERO

func _physics_process(delta: float) -> void:
	if not is_active:
		return

	# Timers update
	if is_on_floor():
		coyote_timer = COYOTE_TIME
	else:
		coyote_timer = maxf(0.0, coyote_timer - delta)

	jump_buffer_timer = maxf(0.0, jump_buffer_timer - delta)

	# Jump inputs (Keyboard Space/W/Up)
	if Input.is_action_just_pressed("jump"):
		jump_buffer_timer = JUMP_BUFFER_TIME

	# Horizontal movement (A / D or Arrow Keys)
	var move_input := Input.get_axis("left", "right")
	if move_input != 0.0:
		facing_direction = signf(move_input)
		velocity.x = move_toward(velocity.x, move_input * SPEED, 2200.0 * delta)
	else:
		velocity.x = move_toward(velocity.x, 0.0, 2600.0 * delta)

	# Gravity
	velocity.y = minf(velocity.y + GRAVITY * delta, 900.0)

	# Execute Jump if buffered and coyote time is active
	if jump_buffer_timer > 0.0 and coyote_timer > 0.0:
		velocity.y = JUMP_VELOCITY
		jump_buffer_timer = 0.0
		coyote_timer = 0.0

	# Variable Jump Height: release early to jump lower
	if Input.is_action_just_released("jump") and velocity.y < JUMP_CUTOFF:
		velocity.y = JUMP_CUTOFF

	move_and_slide()

	# Keep within screen boundaries
	position.x = clampf(position.x, 14.0, 1138.0)

	# Walk cycle animation timer
	walk_cycle += delta * absf(velocity.x) * 0.04
	queue_redraw()

# Clean visual representation of Sam (striped shirt, red backpack)
# Easy to replace with an AnimatedSprite2D node in Godot Inspector!
func _draw() -> void:
	var stride := sin(walk_cycle) * 4.0 if is_on_floor() else 3.0
	
	# Spectral aura
	draw_circle(Vector2(0, -4), 26.0, Color(0.4, 0.85, 0.85, 0.08))
	
	# Legs
	draw_line(Vector2(-5, 8), Vector2(-5 + stride, 18), Color("8994b4"), 4)
	draw_line(Vector2(5, 8), Vector2(5 - stride, 18), Color("8994b4"), 4)
	
	# Red Backpack
	draw_rect(Rect2(-12 * facing_direction - 4, -9, 6, 16), Color("b93838"))
	
	# Torso (Striped shirt)
	draw_rect(Rect2(-8, -9, 16, 18), Color("d67166"))
	draw_rect(Rect2(-8, -6, 16, 4), Color("f3ad86"))
	draw_rect(Rect2(-8, 2, 16, 4), Color("f3ad86"))
	
	# Head & Hair
	draw_rect(Rect2(-7, -21, 14, 13), Color("eec9ad"))
	draw_rect(Rect2(-8, -23, 16, 5), Color("242739"))
	
	# Face & Eyes
	draw_rect(Rect2(3 * facing_direction, -17, 3, 3), Color("242739"))
	
	# Walkie-Talkie in hand (Level 1 item)
	draw_rect(Rect2(9 * facing_direction, -2, 5, 9), Color("3d434d"))
	draw_line(Vector2(11 * facing_direction, -2), Vector2(11 * facing_direction, -7), Color("8b949e"), 2)
