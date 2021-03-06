import flask
from app import database
from app import shared

lobby_page = flask.Blueprint("lobby", __name__, template_folder="templates")

@lobby_page.route("/pvp/new")
def new_pvp():
    resp = flask.make_response(flask.render_template("lobby.html"))
    resp.set_cookie("battleship", "", expires=0)
    return resp

@lobby_page.route('/pvp')
def lobby_pvp():
    return flask.render_template("lobby.html")

@lobby_page.route("/pvai/")
def new_pvai():
    return flask.redirect(flask.url_for("game.create_vs_ai"))

@lobby_page.route("/pvp/<lobby_id>", methods=['GET'])
def join_new_lobby(lobby_id):
    resp = flask.make_response(join_lobby("pvp", lobby_id))
    resp.set_cookie("battleship", "", expires=0)
    return resp

@lobby_page.route('/<lobby_type>/<lobby_id>', methods=['GET'])
def join_lobby(lobby_type, lobby_id):
    if lobby_type not in ("pvp", "pvai"):
        return flask.Response("Page not found.", status=404, mimetype='text/html')
    lobby_data = database.get_lobby_data(lobby_id)
    if lobby_data[0] is None:
        return shared.invalid_lobby()
    if lobby_data[0][2] != "pending":
        return shared.error_response("Lobby is full.", 403)
    return flask.render_template("lobby.html", lobby_id=lobby_id)
