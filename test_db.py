import sqlite3

conn = sqlite3.connect("./battleship.db")

try:
    while True:
        query = input(">")
        for row in conn.cursor().execute(query):
            print(row)
finally:
    conn.close()
