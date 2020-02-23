import json
from flask import render_template, request, make_response
from app import web_app
from app import database
from app import shared

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

def invalid_user():
    return make_response(
        render_template("error.html",
                        error_msg="You are not authorized to access this game"),
        401)

def invalid_lobby():
    return make_response(
        render_template("error.html",
                        error_msg="A lobby with that ID does not exist"),
        404)

def verify_user_cookie():
    if "battleship" in request.cookies:
        cookie_data = json.loads(request.cookies["battleship"])
        return shared.encrypt_lobby_id(
            cookie_data["id"], cookie_data["owner"]) == cookie_data["hash"]
    return False

@web_app.route('/lobby/pvp/<lobby_id>', methods=['GET'])
def join_lobby(lobby_id):
    if database.valid_id(lobby_id):
        web_app.logger.info("Someone joined " + lobby_id)
        return render_template("lobby.html", lobby_id=lobby_id)
    return invalid_lobby()

@web_app.route('/game/<lobby_id>', methods=['GET'])
def join_game(lobby_id):
    if not verify_user_cookie():
        return invalid_user()

    lobby_data = database.get_lobby_data(lobby_id)

    if lobby_data is not None and lobby_data[0][2] in ("setup", "underway"):
        grid_data = [[(y, [(x, 0) for x in range(10)]) for y in range(10)],
                     [(y, [(x, 0) for x in range(10)]) for y in range(10)]]
        shots = [[0 for x in range(10)] for y in range(10)]
        game_data = database.get_game_data(lobby_id)
        cookie_data = json.loads(request.cookies["battleship"])
        ship_data, shot_data = database.get_grid_data(lobby_data[0][0], None)

        # Grid values:
        # 1 = opponent missed shot.
        # 2 = own ship.
        # 3 = opponent hit our ship.
        # -1 = our missed shot.
        # -3 = we hit their ship.
        owner = cookie_data["owner"]

        for shot_x, shot_y, shot_owner in shot_data:
            player = 1 if shot_owner == owner else 0
            val = -1 if player == 1 else 1
            shots[shot_y][shot_x] = val
            grid_data[player][shot_y][1][shot_x] = (shot_x, val)

        for ship_x, ship_y, ship_owner in ship_data:
            shot_at_opp = shots[ship_y][ship_x] == -1
            shot_at_self = shots[ship_y][ship_x] == 1
            if ship_owner == owner:
                if shot_at_self:
                    grid_data[0][ship_y][1][ship_x] = (ship_x, 3)
                else:
                    grid_data[0][ship_y][1][ship_x] = (ship_x, 2)
            else:
                if shot_at_opp:
                    grid_data[1][ship_y][1][ship_x] = (ship_x, -3)

        self_ready = game_data[2 - owner] == 1
        other_ready = game_data[owner+1] == 1
        player_turn = game_data[5] == owner

        return render_template("game.html", p1_ready=self_ready, p2_ready=other_ready,
                               turn=player_turn, status=lobby_data[0][2], grid_data=grid_data)
    return invalid_lobby()

@web_app.route('/search')
def search_game():
    lobbies = database.get_public_lobbies()
    active_lobby = None
    if verify_user_cookie():
        cookie_data = json.loads(request.cookies["battleship"])
        active_lobby = cookie_data["id"]
    return render_template("search.html", lobbies=lobbies, active_lobby=active_lobby)
