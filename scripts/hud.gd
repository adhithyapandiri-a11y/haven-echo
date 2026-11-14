# ==========================================================
# hud.gd
# In-Game UI, Walkie-Talkie radio dialogue, and cutscenes
# ==========================================================
extends CanvasLayer

@onready var echo_label: Label = $TopBar/MarginContainer/HBoxContainer/EchoLabel
@onready var death_label: Label = $TopBar/MarginContainer/HBoxContainer/DeathLabel
@onready var dialogue_box: PanelContainer = $DialogueBox
@onready var speaker_label: Label = $DialogueBox/MarginContainer/VBoxContainer/SpeakerLabel
@onready var message_label: Label = $DialogueBox/MarginContainer/VBoxContainer/MessageLabel

var dialogue_timer: float = 0.0

func _ready() -> void:
	dialogue_box.visible = false

func update_stats(echoes: int, max_echoes: int, deaths: int) -> void:
	if echo_label:
		echo_label.text = "ECHOES: %d / %d" % [echoes, max_echoes]
	if death_label:
		death_label.text = "DEATHS: %02d" % deaths

func show_transmission(speaker: String, text: String, duration: float = 4.5) -> void:
	speaker_label.text = "📻 [ %s ]" % speaker.to_upper()
	message_label.text = text
	dialogue_box.visible = true
	dialogue_timer = duration

func _process(delta: float) -> void:
	if dialogue_timer > 0.0:
		dialogue_timer -= delta
		if dialogue_timer <= 0.0:
			dialogue_box.visible = false
