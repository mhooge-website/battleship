import sqlite3

conn = sqlite3.connect("./battleship.db")

for row in conn.cursor().execute("SELECT * FROM lobbies"):
    print(row)

for row in conn.cursor().execute("SELECT * FROM chat_messages"):
    print(row)

conn.close()