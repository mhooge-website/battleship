from flask import render_template, request, make_response
from hashlib import md5
from app import web_app

def other_room(lobby_id, owner):
    return get_room(lobby_id, (int(owner) * -1) + 1)

def get_room(lobby_id, owner):
    return lobby_id + str(owner)

def encrypt_lobby_id(lobby_id, owner):
    return md5(bytearray(lobby_id + str(owner) + web_app.secret_key, encoding="UTF-8")).hexdigest()

def error_response(msg, http_code):
    return make_response(
        render_template("error.html", error_msg=msg), http_code)

def invalid_user():
    return error_response("You are not authorized to access this game", 401)

def invalid_lobby():
    return error_response("A lobby with that ID does not exist", 404)

def verify_user_cookie():
    if "battleship" in request.cookies:
        cookie_data = json.loads(request.cookies["battleship"])
        return encrypt_lobby_id(
            cookie_data["id"], cookie_data["owner"]) == cookie_data["hash"]
    return False
