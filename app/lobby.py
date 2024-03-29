import json
from hashlib import md5
from random import randint
from time import time
from flask_socketio import join_room
from flask import current_app
from app import database
from app import shared

socket_io = shared.socketio

def change_setting(lobby_id, setting, value):
    database.change_lobby_setting(lobby_id, setting, value)
    current_app.logger.info("Updated: " + str(setting) + " to " + str(value))

@socket_io.on("lobby_pvp")
def handle_message(message):
    current_app.logger.info("New lobby bois")
    lobby_id = md5(bytearray(str(int(time() * 100)), encoding="UTF-8")).hexdigest()
    try:
        database.create_lobby(lobby_id)
        encrypted = shared.encrypt_lobby_id(lobby_id, 1)
        json_data = json.dumps({"id": lobby_id, "hash": encrypted})
        join_room(shared.get_room(lobby_id, 1))
        join_room(lobby_id)
        socket_io.emit("lobby_created", json_data, room=shared.get_room(lobby_id, 1))
        current_app.logger.info("Created lobby. ID: " + lobby_id)
    except IOError:
        socket_io.emit("lobby_error", "Error when creating lobby.", room=shared.get_room(lobby_id, 1))

@socket_io.on("lobby_rejoin")
def handle_rejoin(json_data):
    data = json.loads(json_data)
    join_room(shared.get_room(data["id"], data["owner"]))
    join_room(data["id"])
    current_app.logger.info("Trying to rejoin " + data["id"] + " owner: " + str(data["owner"]))
    if shared.encrypt_lobby_id(data["id"], data["owner"]) == data["hash"]:
        handle_join(data["id"], data["owner"])
        socket_io.emit("opp_rejoin", "Rejoin", room=shared.other_room(data["id"], data["owner"]))

def handle_join(lobby_id, owner):
    data = database.get_lobby_data(lobby_id)
    if data is None:
        socket_io.emit("invalid_lobby", "Invalid Lobby ID.", room=shared.get_room(lobby_id, owner))
    else:
        current_app.logger.info("Rejoined " + lobby_id + " as " + str(owner))
        settings, messages = data
        socket_io.emit("lobby_joined",
                       json.dumps({"settings": settings, "messages": messages, "owner": owner}),
                       room=shared.get_room(lobby_id, owner))

@socket_io.on("lobby_full")
def handle_lobby_full(lobby_id):
    current_app.logger.info("Lobby is full: " + lobby_id)
    change_setting(lobby_id, "status", "ready")
    join_room(lobby_id)
    join_room(shared.get_room(lobby_id, 0))
    encrypted = shared.encrypt_lobby_id(lobby_id, 0)
    json_data = json.dumps({"id": lobby_id, "hash": encrypted})
    socket_io.emit("lobby_ready_opp", json_data, room=shared.get_room(lobby_id, 0))
    handle_join(lobby_id, 0)
    socket_io.emit("lobby_ready_owner", json_data, room=shared.get_room(lobby_id, 1))

@socket_io.on("setting_changed")
def handle_setting_changed(json_data):
    data = json.loads(json_data)
    if shared.encrypt_lobby_id(data["lobby_id"], 1) == data["hash"]:
        change_setting(data["lobby_id"], data["setting"], data["value"])
        json_dump = json.dumps({"setting": data["setting"], "value": data["value"]})
        socket_io.emit("changed_setting", json_dump, room=shared.get_room(data["lobby_id"], 0))

@socket_io.on("start_setup")
def handle_start_setup(json_data):
    data = json.loads(json_data)
    if shared.encrypt_lobby_id(data["id"], 1) == data["hash"]:
        change_setting(data["id"], "status", "setup")
        start_turn = randint(0, 1)
        database.create_game(data["id"], start_turn)
        socket_io.emit("setup_started", data["id"], room=shared.get_room(data["id"], 0))

@socket_io.on("message_sent")
def handle_chat_message(json_data):
    data = json.loads(json_data)
    current_app.logger.info(f"Saved chat message: {data['msg']}, author: {data['owner']}")
    database.add_chat_msg(data["id"], data["msg"], data["owner"])
    socket_io.emit("message_received", data["msg"],
                    room=shared.other_room(data["id"], data["owner"]))

@socket_io.on("disconnected")
def handle_disconnect(json_data):
    data = json.loads(json_data)
    current_app.logger.info("Player disconnected")
    socket_io.emit("opp_disconnect", "Disconnect", room=shared.other_room(data["id"], data["owner"]))
