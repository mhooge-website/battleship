from app import init

application, socket_io = init.create_app()
from app import game, lobby
application.static_folder = 'static'
socket_io.run(application, host=("0.0.0.0"), port=5000, extra_files=["app/style.css"], use_reloader=True, log_output=True)
