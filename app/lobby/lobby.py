import json
from hashlib import md5
from time import time
from flask import redirect
from flask_socketio import join_room
from app import web_app
from app import socket_io
from app import database

def other_room(lobby_id, owner):
    return get_room(lobby_id, (int(owner) * -1) + 1)

def get_room(lobby_id, owner):
    return lobby_id + str(owner)

def encrypt_lobby_id(lobby_id, owner):
    return md5(bytearray(lobby_id + str(owner) + web_app.secret_key, encoding="UTF-8")).hexdigest()

def change_setting(lobby_id, setting, value):
    database.change_lobby_setting(lobby_id, setting, value)
    web_app.logger.info("Updated: " + str(setting) + " to " + str(value))

@socket_io.on("lobby_pvp")
def handle_message(message):
    lobby_id = md5(bytearray(str(int(time() * 100)), encoding="UTF-8")).hexdigest()
    try:
        database.create_lobby(lobby_id)
        encrypted = encrypt_lobby_id(lobby_id, 1)
        json_data = json.dumps({"id": lobby_id, "hash": encrypted})
        join_room(get_room(lobby_id, 1))
        socket_io.emit("lobby_created", json_data, room=get_room(lobby_id, 1))
        web_app.logger.info("Created lobby. ID: " + lobby_id)
    except IOError:
        socket_io.emit("lobby_error", "Error when creating lobby.", room=get_room(lobby_id, 1))

@socket_io.on("lobby_rejoin")
def handle_rejoin(json_data):
    data = json.loads(json_data)
    join_room(get_room(data["id"], data["owner"]))
    web_app.logger.info("Trying to rejoin " + data["id"] + " owner: " + str(data["owner"]))
    if encrypt_lobby_id(data["id"], data["owner"]) == data["hash"]:
        handle_join(data["id"], data["owner"])

def handle_join(lobby_id, owner):
    data = database.get_lobby_data(lobby_id)
    if data is None:
        socket_io.emit("invalid_lobby", "Invalid Lobby ID.", room=get_room(lobby_id, owner))
    else:
        web_app.logger.info("Rejoined " + lobby_id + " as " + str(owner))
        settings, messages = data
        socket_io.emit("lobby_joined",
                       json.dumps({"settings": settings, "messages": messages, "owner": owner}),
                       room=get_room(lobby_id, owner))

@socket_io.on("lobby_full")
def handle_lobby_full(lobby_id):
    web_app.logger.info("Lobby is full: " + lobby_id)
    change_setting(lobby_id, "status", "ready")
    handle_join(lobby_id, 0)
    join_room(get_room(lobby_id, 0))
    encrypted = encrypt_lobby_id(lobby_id, 0)
    json_data = json.dumps({"id": lobby_id, "hash": encrypted})
    socket_io.emit("lobby_ready_opp", json_data, room=get_room(lobby_id, 0))
    socket_io.emit("lobby_ready_owner", json_data, room=get_room(lobby_id, 1))

@socket_io.on("setting_changed")
def handle_setting_changed(json_data):
    data = json.loads(json_data)
    if encrypt_lobby_id(data["lobby_id"], 1) == data["hash"]:
        change_setting(data["lobby_id"], data["setting"], data["value"])
        json_dump = json.dumps({"setting": data["setting"], "value": data["value"]})
        socket_io.emit("changed_setting", json_dump, room=get_room(data["lobby_id"], 0))

@socket_io.on("start_setup")
def handle_start_setup(json_data):
    data = json.loads(json_data)
    if encrypt_lobby_id(data["id"], 1) == data["hash"]:
        change_setting(data["id"], "status", "setup")
        socket_io.emit("setup_started", data["id"], room=get_room(data["id"], 0))

@socket_io.on("message_sent")
def handle_chat_message(json_data):
    data = json.loads(json_data)
    web_app.logger.info(f"Saved chat message: {data['msg']}, author: {data['owner']}")
    database.add_chat_msg(data["id"], data["msg"], data["owner"])
    if not data["is_event"]:
        socket_io.emit("message_received", data["msg"],
                       room=other_room(data["id"], data["owner"]))
