import json
from flask_socketio import join_room
from flask import current_app, request
from app import database
from app import shared

socket_io = shared.socketio

@socket_io.on("player_joined")
def handle_player_joined(json_data):
    data = json.loads(json_data)
    room = shared.get_room(data["id"], data["owner"])
    join_room(room)
    join_room(data["id"])
    chat_messages = database.get_chat_messages(data["id"])
    json_dump = {"owner": data["owner"], "messages": chat_messages}
    socket_io.emit("chat_loaded", json.dumps(json_dump), room=room)

@socket_io.on("player_ready")
def handle_player_ready(json_data):
    data = json.loads(json_data)
    if shared.encrypt_lobby_id(data["id"], data["owner"]) == data["hash"]:
        database.save_ship_coords(data["id"], data["owner"], data["ships"])
        other_ready = database.mark_player_ready(data["id"], data["owner"])[0]
        if int(other_ready) == 1:
            turn = database.get_turn(data["id"])
            database.change_lobby_setting(data["id"], "status", "underway")
            current_app.logger.info("Both players are ready!")
            socket_io.emit("start_game", turn, room=data["id"])
        else:
            current_app.logger.info("One player is ready")
            socket_io.emit("opponent_ready", "whew", room=shared.other_room(data["id"], data["owner"]))

@socket_io.on("player_move")
def handler_player_move(json_data):
    data = json.loads(json_data)
    if shared.encrypt_lobby_id(data["id"], data["owner"]) == data["hash"]:
        turn = database.get_turn(data["id"])[0]
        if data["owner"] == turn:
            new_turn = 0 if turn == 1 else 1
            hit, ship_sunk = database.make_move(data["id"], new_turn, data["x"], data["y"])
            winning_player = database.game_winner(data["id"], data["owner"])
            hit_str = " It was a hit!" if hit else ""
            sunk_str = " The ship is sunk!" if ship_sunk is not None else ""
            current_app.logger.info(f"Player {data['owner']} made a move at {data['x']}, {data['y']}.{hit_str}{sunk_str}")
            if winning_player != -1:
                current_app.logger.info(f"Player {winning_player} won!")
                database.change_lobby_setting(data["id"], "status", "ended")
                data["opp_ships"] = database.get_grid_data(data["id"], new_turn)[0]
            data["turn"] = new_turn
            data["hit"] = hit
            data["sunk"] = [] if ship_sunk is None else ship_sunk
            data["winner"] = winning_player
            socket_io.emit("move_made", json.dumps(data), room=data["id"])

@socket_io.on("ai_init")
def init_ai(yes):
    current_app.logger.info("Initiating AI...")
    ship_spots, attack_spots = database.get_best_spots()
    socket_io.emit("ai_ready", json.dumps([ship_spots, attack_spots]), room=request.sid)
