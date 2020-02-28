#from gevent import monkey
#monkey.patch_all()

from app import init
#from gevent.pywsgi import WSGIServer

application, socket_io = init.create_app()
from app import game, lobby
application.static_folder = 'static'
socket_io.run(application, host=("0.0.0.0"), port=5000, extra_files=["app/style.css"], use_reloader=True, log_output=True)
#server = WSGIServer(("0.0.0.0", 5000), application)

#server.serve_forever()
