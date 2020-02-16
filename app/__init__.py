from flask_socketio import SocketIO
from flask import Flask
from logging.config import dictConfig

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
web_app.config['TESTING'] = True
web_app.config["DATABASE"] = "./battleship.db"
web_app.secret_key = "guyhtgsytggg23rteg6221gdgadaw"

socket_io = SocketIO(web_app, logger=True)

from app import routes
from app.lobby import lobby
