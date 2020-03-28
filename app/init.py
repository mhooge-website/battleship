from flask_socketio import SocketIO
from flask import Flask, url_for
from flask_cors import CORS
from logging.config import dictConfig
from app import database

def create_app():
    dictConfig({
        'version': 1,
        'formatters': {'default': {
            'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
        }},
        'handlers': {'wsgi': {
            'class': 'logging.StreamHandler',
            'stream': 'ext://flask.logging.wsgi_errors_stream',
            'formatter': 'default'
        }},
        'root': {
            'level': 'INFO',
            'handlers': ['wsgi']
        }
    })
    web_app = Flask(__name__)
    CORS(web_app)
    root = "/projects/battleship/"
    from app.routes import game, lobby, index, search
    web_app.register_blueprint(index.start_page, url_prefix=root)
    web_app.register_blueprint(lobby.lobby_page, url_prefix=root + "/lobby")
    web_app.register_blueprint(game.game_page, url_prefix=root + "/game")
    web_app.register_blueprint(search.search_page, url_prefix=root + "/search")
    web_app.config['TESTING'] = True
    web_app.config["DATABASE"] = "./battleship.db"
    web_app.secret_key = open("app/static/secret.txt").readline()
    with web_app.app_context():
        database.init_db()

    from app import shared
    shared.socketio = SocketIO(web_app, logger=True)

    return web_app, shared.socketio
