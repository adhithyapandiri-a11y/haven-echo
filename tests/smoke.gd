extends SceneTree

var game: Node2D
var failures := 0

func _initialize() -> void:
	call_deferred("run")

func check(condition: bool, message: String) -> void:
	if condition:
		print("PASS: " + message)
	else:
		push_error("FAIL: " + message)
		failures += 1

func frames(count: int) -> void:
	for frame in range(count):
		await physics_frame

func run() -> void:
	game = load("res://scenes/main.tscn").instantiate()
	root.add_child(game)
	await frames(2)
	check(game.state == "intro", "Opening screen")
	game.start_run()
	await frames(5)
	check(game.player.is_on_floor(), "Checkpoint is on solid ground")
	check(game.echoes[0].collision_layer == 0, "Unrestored echoes cannot be stood on")
	game.player.position = Vector2(540, 640)
	await frames(3)
	check(game.deaths == 1 and game.echo_count == 1, "Falling restores exactly one echo")
	check(game.player.position.distance_to(game.CHECKPOINT) < 5, "Death respawns instantly at checkpoint")
	game.die()
	game.die()
	game.die()
	check(game.echo_count == 3 and game.deaths == 4, "Echo cap holds after extra deaths")
	await frames(5)
	var targets := [Vector2(430, 441), Vector2(630, 366), Vector2(830, 291), Vector2(980, 291)]
	var takeoffs := [287.0, 468.0, 668.0, 868.0]
	for index in range(targets.size()):
		Input.action_press("right")
		var timeout := 0
		while game.player.position.x < takeoffs[index] and timeout < 180:
			await frames(1)
			timeout += 1
		Input.action_press("jump")
		await frames(2)
		timeout = 0
		while timeout < 90:
			if game.player.position.x >= targets[index].x - 16:
				Input.action_release("right")
			await frames(1)
			timeout += 1
			if timeout > 5 and game.player.is_on_floor():
				break
		Input.action_release("jump")
		Input.action_release("right")
		await frames(3)
		check(absf(game.player.position.y - targets[index].y) < 3 and absf(game.player.position.x - targets[index].x) < 40, "Physics route: landing %d" % (index + 1))
	Input.action_press("right")
	await frames(30)
	Input.action_release("right")
	check(game.state == "won", "Walking to bus completes level")
	game.start_run()
	await frames(3)
	check(game.state == "playing" and game.echo_count == 0 and game.deaths == 0, "Replay clears counters")
	check(game.echoes[0].collision_layer == 0 and game.echoes[2].collision_layer == 0, "Replay clears Echo collisions")
	print("SMOKE RESULT: %d failures" % failures)
	quit(1 if failures else 0)
