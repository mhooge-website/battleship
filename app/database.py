import os
import sqlite3
from contextlib import closing
from flask import current_app

def create_database():
    with closing(get_connection()) as db:
        with current_app.open_resource("schema.sql", mode="r") as f:
            db.cursor().executescript(f.read())
        db.commit()

def get_connection():
    return sqlite3.connect(current_app.config["DATABASE"])

def create_lobby(lobby_id):
    with closing(get_connection()) as db:
        db.cursor().execute("INSERT INTO lobbies(id, dt) VALUES (?, CURRENT_TIMESTAMP)", (lobby_id,))
        db.commit()

def create_game(lobby_id, start_turn):
    with closing(get_connection()) as db:
        db.cursor().execute("INSERT INTO games(id, turn) VALUES (?, ?)", (lobby_id, start_turn))
        db.commit()

def valid_id(lobby_id):
    return get_lobby_data(lobby_id)[0] is not None

def get_lobby_data(lobby_id):
    with closing(get_connection()) as db:
        lobby_config = db.cursor().execute("SELECT * FROM lobbies WHERE id=?", (lobby_id,)).fetchone()
        lobby_messages = get_chat_messages(lobby_id, db)
        return (lobby_config, lobby_messages)

def get_game_data(lobby_id):
    with closing(get_connection()) as db:
        return db.cursor().execute("SELECT * FROM games WHERE id=?", (lobby_id,)).fetchone()

def get_public_lobbies():
    with closing(get_connection()) as db:
        return db.cursor().execute("SELECT id, name, status FROM lobbies WHERE public=1 ORDER BY dt DESC").fetchall()

def change_lobby_setting(lobby_id, setting, value):
    with closing(get_connection()) as db:
        db.cursor().execute("UPDATE lobbies SET "+setting+"=? WHERE id=?", (value, lobby_id))
        db.commit()

def add_chat_msg(lobby_id, msg, author):
    with closing(get_connection()) as db:
        db.cursor().execute("INSERT INTO chat_messages(game_id, message, author) VALUES (?, ?, ?)", (lobby_id, msg, author))
        db.commit()

def get_chat_messages(lobby_id, context=None):
    if context is None:
        with closing(get_connection()) as db:
            return db.cursor().execute("SELECT message, author, date_time FROM " +
                                       "chat_messages WHERE game_id=?", (lobby_id,)).fetchall()
    else:
        return context.cursor().execute("SELECT message, author, date_time FROM " +
                                        "chat_messages WHERE game_id=?", (lobby_id,)).fetchall()

def mark_player_ready(lobby_id, player):
    player_name = "p1_ready" if player == 1 else "p2_ready"
    other_name = "p2_ready" if player == 1 else "p1_ready"
    with closing(get_connection()) as db:
        db.cursor().execute("UPDATE games SET " + player_name + "=1 WHERE id=?", (lobby_id,))
        db.commit()
        return db.cursor().execute("SELECT " + other_name + " FROM games WHERE id=?", (lobby_id,)).fetchone()

def save_ship_coords(lobby_id, owner, ships):
    with closing(get_connection()) as db:
        for coords in ships:
            ship_id = coords["id"]
            x = coords["x"]
            y = coords["y"]
            db.cursor().execute("INSERT INTO ship_parts(game_id, ship_id, x, y, owner) " +
                                "VALUES (?, ?, ?, ?, ?)", (lobby_id, ship_id, x, y, owner))
            db.cursor().execute("INSERT INTO ships(id, game_id, owner) VALUES (?, ?, ?)", (ship_id, lobby_id, owner))
        db.commit()

def get_grid_data(lobby_id, owner):
    with closing(get_connection()) as db:
        query_ships = "SELECT x, y, owner, ship_id FROM ship_parts WHERE game_id=?"
        query_sunk_ships = "SELECT id, owner FROM ships WHERE sunk=1 AND game_id=?"
        query_shots = "SELECT x, y, owner FROM shots WHERE game_id=?"
        param_tuple = (lobby_id,)
        if owner is not None:
            query_ships += " AND owner=?"
            query_shots += " AND owner=?"
            param_tuple = param_tuple + (owner,)
        ships = db.cursor().execute(query_ships, param_tuple).fetchall()
        sunk_ships = db.cursor().execute(query_sunk_ships, (lobby_id,)).fetchall()
        for i in range(len(ships)):
            is_sunk = False
            for ship_id in sunk_ships:
                if ships[i][3] == ship_id[0] and ships[i][2] == ship_id[1]:
                    is_sunk = True
                    break
            ships[i] = ships[i] + (is_sunk,)
        shots = db.cursor().execute(query_shots, param_tuple).fetchall()
        return ships, shots

def get_turn(lobby_id):
    with closing(get_connection()) as db:
        return db.cursor().execute("SELECT turn FROM games WHERE id=?", (lobby_id,)).fetchone()

def make_move(lobby_id, new_turn, x, y):
    with closing(get_connection()) as db:
        db.cursor().execute("INSERT INTO shots(game_id, x, y, owner) VALUES (?, ?, ?, ?)",
                            (lobby_id, x, y, 0 if new_turn == 1 else 1))
        hit_ship = db.cursor().execute("SELECT ship_id FROM ship_parts WHERE game_id=? AND x=? AND y=? AND owner=?",
                                       (lobby_id, x, y, new_turn)).fetchone()
        hit = hit_ship is not None
        ship_sunk = None
        if hit:
            query = ("SELECT Count(DISTINCT shots.id) FROM shots, ship_parts, ships WHERE " +
                     "ship_parts.ship_id = ships.id AND shots.game_id=ship_parts.game_id " +
                     "AND ship_parts.game_id=? AND " "ships.owner = ship_parts.owner AND " +
                     "shots.owner != ship_parts.owner AND " +
                     "shots.owner != ships.owner AND ship_parts.x = shots.x AND " +
                     "ship_parts.y = shots.y AND ship_parts.owner=ships.owner AND ships.owner=? " +
                     "AND ship_id=?")
            sunk = db.cursor().execute(query, (lobby_id, new_turn, hit_ship[0])).fetchone()
            ship_size = int(hit_ship[0].split("_")[0])
            if sunk[0] == ship_size:
                ship_sunk = db.cursor().execute("SELECT x, y FROM ship_parts " +
                                                "WHERE game_id=? AND owner=? AND ship_id=?",
                                                (lobby_id, new_turn, hit_ship[0])).fetchall()
                db.cursor().execute("UPDATE ships SET sunk=1 WHERE id=? AND game_id=? AND owner=?",
                                    (hit_ship[0], lobby_id, new_turn))
        db.cursor().execute("UPDATE games SET turn=? WHERE id=?", (new_turn, lobby_id))
        db.commit()
        return hit, ship_sunk

def game_winner(lobby_id, player):
    with closing(get_connection()) as db:
        query = ("SELECT Count(*) FROM shots, ship_parts WHERE " +
                 "shots.game_id = ship_parts.game_id AND shots.game_id=? AND " +
                 "shots.x = ship_parts.x AND shots.y = ship_parts.y AND " +
                 "shots.owner != ship_parts.owner AND shots.owner=?")
        hits = db.cursor().execute(query, (lobby_id, player)).fetchone()
        if hits is None or hits[0] < 14:
            return -1
        return player

def get_best_spots():
    with closing(get_connection()) as db:
        query = "SELECT x, y, Count(*) as c FROM shots GROUP BY x, y ORDER BY c ASC"
        shots_freq = db.cursor().execute(query).fetchall()
        query = "SELECT x, y, Count(*), ship_id as c FROM ship_parts GROUP BY x, y ORDER BY c"
        ships_freq = db.cursor().execute(query).fetchall()
        return ships_freq, shots_freq

def init_db():
    if not os.path.exists(current_app.config["DATABASE"]):
        create_database()
