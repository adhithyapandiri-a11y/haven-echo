# ==========================================================
# bus_stop.gd
# Level 1 Goal: Reaching the Haven County Transit shelter
# ==========================================================
extends Area2D

signal reached

func _ready() -> void:
	collision_layer = 0
	collision_mask = 2 # Detects player
	body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node2D) -> void:
	if body.has_method("respawn"):
		reached.emit()
