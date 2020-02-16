from flask import render_template, session
from app import web_app
from app import database

@web_app.route('/')
@web_app.route('/index')
def index():
    return render_template("index.html")

@web_app.route('/lobby/pvp')
def lobby_pvp():
    return render_template("lobby.html", game_type="pvp")

@web_app.route('/lobby/pvai')
def lobby_pvai():
    return render_template("lobby.html", game_type="pvai")

@web_app.route('/lobby/pvp/<lobby_id>', methods=['GET'])
def join_lobby(lobby_id):
    if database.valid_id(lobby_id):
        web_app.logger.info("Someone joined " + lobby_id)
        return render_template("lobby.html", lobby_id=lobby_id)
    return index()

@web_app.route('/search')
def search_game():
    # Load lobbies.
    return render_template("search.html")
