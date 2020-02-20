from hashlib import md5
from app import web_app

def other_room(lobby_id, owner):
    return get_room(lobby_id, (int(owner) * -1) + 1)

def get_room(lobby_id, owner):
    return lobby_id + str(owner)

def encrypt_lobby_id(lobby_id, owner):
    return md5(bytearray(lobby_id + str(owner) + web_app.secret_key, encoding="UTF-8")).hexdigest()