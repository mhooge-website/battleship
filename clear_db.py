import sqlite3

conn = sqlite3.connect("./battleship.db")

conn.cursor().execute("DELETE FROM lobbies")
conn.cursor().execute("DELETE FROM games")
conn.cursor().execute("DELETE FROM chat_messages")
conn.commit()

conn.close()