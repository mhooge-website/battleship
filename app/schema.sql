CREATE TABLE [lobbies] (
	[id] NVARCHAR(64) NOT NULL PRIMARY KEY,
	[name] NVARCHAR(50) NOT NULL DEFAULT('Battleship Lobby'),
    [status] NVARCHAR(10) NOT NULL DEFAULT('pending') CHECK(status = 'pending' or status = 'ready' or status = 'setup'  or status = 'underway' or status = 'ended'),
    [public] INTEGER DEFAULT(0),
    [dt] TEXT NOT NULL
);
CREATE TABLE [games] (
    [id] NVARCHAR(64) NOT NULL PRIMARY KEY,
    [p1_ready] INTEGER DEFAULT(0),
    [p2_ready] INTEGER DEFAULT(0),
    [score_p1] INTEGER DEFAULT(0),
    [score_p2] INTEGER DEFAULT(0),
    [turn] INTEGER DEFAULT(0)
);
CREATE TABLE [ship_parts] (
    [id] INTEGER PRIMARY KEY,
    [game_id] NVARCHAR(64) NOT NULL,
    [ship_id] NVARCHAR(32) NOT NULL,
    [x] INTEGER NOT NULL,
    [y] INTEGER NOT NULL,
    [owner] INTEGER NOT NULL
);
CREATE TABLE [ships] (
    [id] NVARCHAR(32) NOT NULL,
    [game_id] NVARCHAR(64) NOT NULL,
    [owner] INTEGER NOT NULL,
    [sunk] INTEGER DEFAULT(0)
);
CREATE TABLE [shots] (
    [id] INTEGER PRIMARY KEY,
    [game_id] NVARCHAR(64) NOT NULL,
    [x] INTEGER NOT NULL,
    [y] INTEGER NOT NULL,
    [owner] INTEGER NOT NULL
);
CREATE TABLE [chat_messages] (
    [id] INTEGER PRIMARY KEY,
    [game_id] NVARCHAR(64) NOT NULL,
    [message] NVARCHAR(128) NOT NULL,
    [author] INTEGER NOT NULL,
    [date_time] TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);