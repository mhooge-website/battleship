import os
import sqlite3
from contextlib import closing
from app import web_app

def create_database():
    with closing(get_connection()) as db:
        with web_app.open_resource("schema.sql", mode="r") as f:
            db.cursor().executescript(f.read())
        db.commit()

def get_connection():
    return sqlite3.connect(web_app.config["DATABASE"])

def create_lobby(lobby_id):
    with closing(get_connection()) as db:
        db.cursor().execute("INSERT INTO lobbies(id) VALUES (?)", (lobby_id,))
        db.commit()

def create_game(lobby_id, start_turn):
    with closing(get_connection()) as db:
        db.cursor().execute("INSERT INTO games(id, turn) VALUES (?, ?)", (lobby_id, start_turn))
        db.commit()

def valid_id(lobby_id):
    return get_lobby_data(lobby_id) is not None

def get_lobby_data(lobby_id):
    with closing(get_connection()) as db:
        lobby_config = db.cursor().execute("SELECT * FROM lobbies WHERE id=?", (lobby_id,)).fetchone()
        lobby_messages = get_chat_messages(lobby_id, db)
        return (lobby_config, lobby_messages)

def get_public_lobbies():
    with closing(get_connection()) as db:
        return db.cursor().execute("SELECT id, name, status FROM lobbies WHERE public=1").fetchall()

def change_lobby_setting(lobby_id, setting, value):
    with closing(get_connection()) as db:
        db.cursor().execute("UPDATE lobbies SET "+setting+"=? WHERE id=?", (value, lobby_id))
        db.commit()

def add_chat_msg(lobby_id, msg, author):
    with closing(get_connection()) as db:
        db.cursor().execute("INSERT INTO chat_messages(game_id, message, author) VALUES (?, ?, ?)", (lobby_id, msg, author))
        db.commit()

def get_chat_messages(lobby_id, db):
    return db.cursor().execute("SELECT message, author, date_time FROM " +
                               "chat_messages WHERE game_id=?", (lobby_id,)).fetchall()

def mark_player_ready(lobby_id, player):
    player_name = "p1_ready" if player == 1 else "p2_ready"
    other_name = "p2_ready" if player == 1 else "p1_ready"
    with closing(get_connection()) as db:
        db.cursor().execute("UPDATE games SET " + player_name + "=1 WHERE game_id=?", (lobby_id,))
        db.commit()
        return db.cursor().execute("SELECT " + other_name + " FROM games WHERE game_id=?", (lobby_id,)).fetchone()

def save_ship_coords(lobby_id, owner, ships):
    with closing(get_connection()) as db:
        for coords in ships:
            x = coords["x"]
            y = coords["y"]
            db.cursor().execute("INSERT INTO ships(game_id, x, y, owner) VALUES (?, ?, ?, ?)", (lobby_id, x, y, owner))
        db.commit()

def get_ships(lobby_id, owner):
    with closing(get_connection()) as db:
        query_str = "SELECT x, y, hit, owner FROM ships WHERE game_id =?"
        param_tuple = (lobby_id,)
        if owner is not None:
            query_str += " AND owner=?"
            param_tuple = param_tuple + (owner,)
        return db.cursor().execute(query_str, param_tuple).fetchall()

def get_turn(lobby_id):
    with closing(get_connection()) as db:
        return db.cursor().execute("SELECT turn FROM games WHERE id=?", (lobby_id,)).fetchone()

if not os.path.exists(web_app.config["DATABASE"]):
    create_database()
