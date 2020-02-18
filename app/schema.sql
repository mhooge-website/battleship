CREATE TABLE [lobbies] ( 
	[id] NVARCHAR(64) NOT NULL PRIMARY KEY,
	[name] NVARCHAR(50) NOT NULL DEFAULT('Battleship Lobby'),
    [status] NVARCHAR(10) NOT NULL DEFAULT('pending') CHECK(status = 'pending' or status = 'ready' or status = 'setup'  or status = 'underway' or status = 'ended'),
    [public] INTEGER DEFAULT(0)
);
CREATE TABLE [games] (
    [id] NVARCHAR(64) NOT NULL PRIMARY KEY,
    [p1_ready] INTEGER DEFAULT(0),
    [p2_ready] INTEGER DEFAULT(0),
    [score_p1] INTEGER DEFAULT(0),
    [score_p2] INTEGER DEFAULT(0),
    [turn] INTEGER DEFAULT(0),
    [active] INTEGER DEFAULT(1)
);
CREATE TABLE [ships] (
    [id] INTEGER PRIMARY KEY,
    [game_id] NVARCHAR(64) NOT NULL,
    [x] INTEGER NOT NULL,
    [y] INTEGER NOT NULL,
    [owner] INTEGER NOT NULL,
    [hit] INTEGER DEFAULT(0)
);
CREATE TABLE [chat_messages] (
    [id] INTEGER PRIMARY KEY,
    [game_id] NVARCHAR(64) NOT NULL,
    [message] NVARCHAR(128) NOT NULL,
    [author] INTEGER NOT NULL,
    [date_time] TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);