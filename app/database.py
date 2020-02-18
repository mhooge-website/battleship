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

if not os.path.exists(web_app.config["DATABASE"]):
    create_database()
