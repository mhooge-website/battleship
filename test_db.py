import sqlite3

conn = sqlite3.connect("./battleship.db")

for row in conn.cursor().execute("SELECT * FROM lobbies"):
    print(row)

for row in conn.cursor().execute("SELECT * FROM chat_messages"):
    print(row)

conn.cursor().execute("INSERT INTO lobbies(id, name, status, public) VALUES ('123', 'test123', 'setup', 1)")
conn.commit()

conn.close()