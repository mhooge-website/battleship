import flask
from app import database
from app import shared

lobby_page = flask.Blueprint("lobby", __name__, template_folder="templates")

@lobby_page.route("/pvp/new")
def new_lobby():
    resp = flask.make_response(flask.render_template("lobby.html", game_type="pvp"))
    resp.set_cookie("battleship", "", expires=0)
    return resp

@lobby_page.route('/pvp')
def lobby_pvp():
    return flask.render_template("lobby.html", game_type="pvp")

@lobby_page.route('/pvai')
def lobby_pvai():
    return flask.render_template("lobby.html", game_type="pvai")

@lobby_page.route('/pvp/<lobby_id>', methods=['GET'])
def join_lobby(lobby_id):
    if database.valid_id(lobby_id):
        #web_app.logger.info("Someone joined " + lobby_id)
        return flask.render_template("lobby.html", lobby_id=lobby_id)
    return shared.invalid_lobby()
