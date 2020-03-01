import json
from flask import Blueprint, render_template, request, current_app
from app import database
from app import shared

game_page = Blueprint("game", __name__, template_folder="templates")

@game_page.route('/<lobby_id>', methods=['GET'])
def join_game(lobby_id):
    if not shared.verify_user_cookie():
        return shared.invalid_user()

    lobby_data = database.get_lobby_data(lobby_id)

    if lobby_data is not None:
        if lobby_data[0][2] == "ended":
            return render_template("game_over.html")

        grid_data = [[(y, [(x, "") for x in range(10)]) for y in range(10)],
                     [(y, [(x, "") for x in range(10)]) for y in range(10)]]
        shots_self = [[False for x in range(10)] for y in range(10)]
        shots_opp = [[False for x in range(10)] for y in range(10)]
        game_data = database.get_game_data(lobby_id)
        cookie_data = json.loads(request.cookies["battleship"])
        ship_data, shot_data = database.get_grid_data(lobby_data[0][0], None)

        owner = cookie_data["owner"]

        for shot_x, shot_y, shot_owner in shot_data:
            player = 1 if shot_owner == owner else 0
            if player == 1:
                shots_self[shot_y][shot_x] = True
            else:
                shots_opp[shot_y][shot_x] = True
            val = "shot-missed"
            grid_data[player][shot_y][1][shot_x] = (shot_x, val)

        for ship_x, ship_y, ship_owner, _, sunk in ship_data:
            shot_at_opp = shots_self[ship_y][ship_x]
            shot_at_self = shots_opp[ship_y][ship_x]
            if ship_owner == owner:
                if sunk:
                    grid_data[0][ship_y][1][ship_x] = (ship_x, "sunk-ship")
                elif shot_at_self:
                    grid_data[0][ship_y][1][ship_x] = (ship_x, "hit-ship")
                else:
                    grid_data[0][ship_y][1][ship_x] = (ship_x, "placed-ship")
            else:
                if sunk:
                    grid_data[1][ship_y][1][ship_x] = (ship_x, "sunk-ship")
                elif shot_at_opp:
                    grid_data[1][ship_y][1][ship_x] = (ship_x, "hit-ship")

        self_ready = game_data[2 - owner] == 1
        other_ready = game_data[owner+1] == 1
        player_turn = game_data[5] == owner

        return render_template("game.html", p1_ready=self_ready, p2_ready=other_ready,
                            turn=player_turn, status=lobby_data[0][2], grid_data=grid_data)
    return shared.invalid_lobby()
