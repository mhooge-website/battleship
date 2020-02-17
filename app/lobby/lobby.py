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
    if encrypt_lobby_id(data["id"], data["owner"]) == data["hash"]:
        handle_join(data["id"], 1 if data["owner"] else 0)

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
def lobby_full(lobby_id):
    json_data = json.dumps({"lobby_id": lobby_id, "setting": "status", "value": "ready"})
    change_setting(json_data)
    handle_join(lobby_id, 0)
    join_room(get_room(lobby_id, 0))
    encrypted = encrypt_lobby_id(lobby_id, 0)
    json_data = json.dumps({"id": lobby_id, "hash": encrypted})
    socket_io.emit("lobby_ready_opp", json_data, room=get_room(lobby_id, 0))
    socket_io.emit("lobby_ready_owner", json_data, room=get_room(lobby_id, 1))

@socket_io.on("setting_changed")
def change_setting(json_data):
    data = json.loads(json_data)
    if encrypt_lobby_id(data["lobby_id"], data["owner"]) == data["hash"]:
        database.change_lobby_setting(data["lobby_id"], data["setting"], data["value"])
        web_app.logger.info("Updated: " + str(data["setting"]))
        if data["setting"] == "status" and data["value"] == "ready":
            socket_io.emit("setup_started", data["lobby_id"])
        else:
            json_dump = json.dumps({"setting": data["setting"], "value": data["value"]})
            socket_io.emit("setting_changed", json_dump, room=get_room(json_data["lobby_id"], 0))

@socket_io.on("message_sent")
def handle_chat_message(json_data):
    data = json.loads(json_data)
    web_app.logger.info("Saved chat message: " + data["msg"])
    database.add_chat_msg(data["id"], data["msg"], data["owner"])
    socket_io.emit("message_received", data["msg"],
                   room=other_room(data["id"], data["owner"]))
