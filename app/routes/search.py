import json
from flask import Blueprint, render_template, request
from app import database
from app import shared

search_page = Blueprint("search", __name__, template_folder="templates")

@search_page.route('/')
def search_game():
    lobbies = database.get_public_lobbies()
    active_lobby = None
    if shared.verify_user_cookie():
        cookie_data = json.loads(request.cookies["battleship"])
        active_lobby = cookie_data["id"]
    return render_template("search.html", lobbies=lobbies, active_lobby=active_lobby)
