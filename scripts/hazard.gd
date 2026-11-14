# ==========================================================
# hazard.gd
# Environmental danger (rift spikes / void)
# ==========================================================
extends Area2D

signal triggered

func _ready() -> void:
	collision_layer = 0
	collision_mask = 2 # Detects player
	body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node2D) -> void:
	if body.has_method("respawn"):
		triggered.emit()
