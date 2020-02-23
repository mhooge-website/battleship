import json
from flask_socketio import join_room
from app import web_app
from app import socket_io
from app import database
from app import shared

@socket_io.on("player_joined")
def handle_player_joined(json_data):
    data = json.loads(json_data)
    room = shared.get_room(data["id"], data["owner"])
    join_room(room)
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
            web_app.logger.info("Both players are ready!")
            socket_io.emit("start_game", turn)
        else:
            web_app.logger.info("One player is ready")
            socket_io.emit("opponent_ready", "whew", room=shared.other_room(data["id"], data["owner"]))

@socket_io.on("player_move")
def handler_player_move(json_data):
    data = json.loads(json_data)
    turn = database.get_turn(data["id"])[0]
    if data["owner"] == turn:
        new_turn = 0 if turn == 1 else 1
        hit = database.make_move(data["id"], new_turn, data["x"], data["y"])
        winning_player = database.game_winner(data["id"], data["owner"])
        hit_str = " It was a hit!" if hit else ""
        web_app.logger.info(f"Player {data['owner']} made a move at {data['x']}, {data['y']}.{hit_str}")
        if winning_player != -1:
            web_app.logger.info(f"Player {winning_player} won!")
        data["turn"] = new_turn
        data["hit"] = hit
        data["winner"] = winning_player
        socket_io.emit("move_made", json.dumps(data))
