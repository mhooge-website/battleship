import sqlite3

conn = sqlite3.connect("./battleship.db")

for row in conn.cursor().execute("SELECT * FROM games"):
    print(row)

conn.commit()

conn.close()