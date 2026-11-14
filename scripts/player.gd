extends CharacterBody2D

const SPEED := 300.0
const GRAVITY := 1450.0
const JUMP_SPEED := -510.0
var enabled := false
var coyote := 0.0
var jump_buffer := 0.0
var facing := 1.0
var walk_time := 0.0

func _ready() -> void:
	collision_layer = 2
	collision_mask = 1
	var collider := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = Vector2(22, 38)
	collider.shape = shape
	add_child(collider)

func reset_at(checkpoint: Vector2) -> void:
	position = checkpoint
	velocity = Vector2.ZERO
	coyote = 0.0
	jump_buffer = 0.0
	reset_physics_interpolation()

func _physics_process(delta: float) -> void:
	if not enabled:
		return
	coyote = 0.11 if is_on_floor() else maxf(0.0, coyote - delta)
	jump_buffer = maxf(0.0, jump_buffer - delta)
	if Input.is_action_just_pressed("jump"):
		jump_buffer = 0.12
	var direction := Input.get_axis("left", "right")
	velocity.x = move_toward(velocity.x, direction * SPEED, (2200.0 if direction else 2600.0) * delta)
	if direction:
		facing = direction
	velocity.y = minf(velocity.y + GRAVITY * delta, 900.0)
	if jump_buffer > 0.0 and coyote > 0.0:
		velocity.y = JUMP_SPEED
		jump_buffer = 0.0
		coyote = 0.0
	if Input.is_action_just_released("jump") and velocity.y < -180.0:
		velocity.y = -180.0
	move_and_slide()
	position.x = clampf(position.x, 14.0, 1138.0)
	walk_time += delta * absf(velocity.x) * 0.04
	queue_redraw()

func _draw() -> void:
	var stride := sin(walk_time) * 4.0 if is_on_floor() else 3.0
	draw_circle(Vector2(0, -4), 28, Color(0.4, 0.85, 0.85, 0.06))
	draw_line(Vector2(-5, 8), Vector2(-5 + stride, 18), Color("8994b4"), 5)
	draw_line(Vector2(5, 8), Vector2(5 - stride, 18), Color("8994b4"), 5)
	draw_rect(Rect2(-10, -9, 20, 21), Color("d67166"))
	draw_rect(Rect2(-10, -9, 20, 5), Color("f3ad86"))
	draw_rect(Rect2(-7, -21, 14, 13), Color("eec9ad"))
	draw_rect(Rect2(-8, -22, 16, 5), Color("242739"))
	draw_rect(Rect2(4 * facing, -17, 3, 3), Color("242739"))
	draw_line(Vector2(8 * facing, -4), Vector2(14 * facing, 5), Color("eec9ad"), 4)
	draw_circle(Vector2(15 * facing, 4), 3, Color("ffe4ac"))

