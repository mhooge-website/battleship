import json
from flask import Blueprint, render_template, request, current_app
from app import database
from app import shared

game_page = Blueprint("game", __name__, template_folder="templates")

@game_page.route('/pvai')
def create_vs_ai():
    grid_data = [[(y, [(x, "") for x in range(10)]) for y in range(10)],
                 [(y, [(x, "") for x in range(10)]) for y in range(10)]]
    return render_template("game.html", p1_ready=False, p2_ready=False, turn=0,
                           status="setup", grid_data=grid_data, game_type="pvai")

@game_page.route('/<lobby_id>', methods=['GET'])
def join_game(lobby_id):
    if lobby_id == "test123":
        grid_data = [[(y, [(x, "") for x in range(10)]) for y in range(10)],
                     [(y, [(x, "") for x in range(10)]) for y in range(10)]]
        grid_data[0][2][1][0] = (0, "placed-ship ship-submarine")
        grid_data[0][3][1][0] = (0, "placed-ship ship-submarine")
        grid_data[0][4][1][0] = (0, "placed-ship ship-submarine")
        grid_data[0][2][1][1] = (1, "placed-ship ship-battleship")
        grid_data[0][3][1][1] = (1, "placed-ship ship-battleship")
        grid_data[0][4][1][1] = (1, "placed-ship ship-battleship")
        grid_data[0][6][1][3] = (3, "placed-ship ship-aircraft")
        grid_data[0][6][1][4] = (4, "placed-ship ship-aircraft")
        grid_data[0][6][1][5] = (5, "placed-ship ship-aircraft")
        grid_data[0][6][1][6] = (6, "placed-ship ship-aircraft")
        grid_data[0][2][1][3] = (3, "placed-ship ship-cruiser")
        grid_data[0][3][1][3] = (3, "placed-ship ship-cruiser")
        grid_data[0][2][1][4] = (4, "placed-ship ship-patrol")
        grid_data[0][3][1][4] = (4, "placed-ship ship-patrol")
        return render_template("game.html", p1_ready=True, p2_ready=True,
                               turn=1, status="underway",
                               grid_data=grid_data, game_type="pvp")

    lobby_data = database.get_lobby_data(lobby_id)

    if lobby_data[0] is not None:
        if not shared.verify_user_cookie():
            return shared.invalid_user()

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

        for ship_x, ship_y, ship_owner, ship_id, sunk in ship_data:
            shot_at_opp = shots_self[ship_y][ship_x]
            shot_at_self = shots_opp[ship_y][ship_x]
            if ship_owner == owner:
                if sunk:
                    grid_data[0][ship_y][1][ship_x] = (ship_x, "sunk-ship")
                elif shot_at_self:
                    grid_data[0][ship_y][1][ship_x] = (ship_x, "hit-ship")
                else:
                    grid_data[0][ship_y][1][ship_x] = (ship_x, "placed-ship " + ship_id)
            else:
                if sunk:
                    grid_data[1][ship_y][1][ship_x] = (ship_x, "sunk-ship")
                elif shot_at_opp:
                    grid_data[1][ship_y][1][ship_x] = (ship_x, "hit-ship")
                elif lobby_data[0][2] == "ended": # If game is over, we show the enemy board.
                    grid_data[1][ship_y][1][ship_x] = (ship_x, "placed-ship " + ship_id)

        self_ready = game_data[2 - owner] == 1
        other_ready = game_data[owner+1] == 1
        player_turn = game_data[5] == owner

        return render_template("game.html", p1_ready=self_ready, p2_ready=other_ready,
                               turn=player_turn, status=lobby_data[0][2],
                               grid_data=grid_data, game_type="pvp")
    return shared.invalid_lobby()
