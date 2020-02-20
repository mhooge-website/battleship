import json
from app import web_app
from app import socket_io
from app import database
from app import shared

@socket_io.on("player_ready")
def handle_player_ready(json_data):
    data = json.loads(json_data)
    if shared.encrypt_lobby_id(data["id"], data["owner"]) == data["hash"]:
        other_ready = database.mark_player_ready(data["id"], data["owner"])
        if int(other_ready) == 1:
            turn = database.get_turn(data["id"])
            socket_io.emit("start_game", turn)
        else:
            socket_io.emit("opponent_ready", "whew", room=shared.other_room(data["id"], data["owner"]))

@socket_io.on("player_move")
def handler_player_move(json_data):
    pass
