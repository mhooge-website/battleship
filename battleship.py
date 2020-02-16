from waitress import serve
from app import web_app
from app import socket_io

if __name__ == "__main__":
    web_app.static_folder = 'static'
    socket_io.run(web_app, extra_files=["app/style.css"], debug=True, use_reloader=True, log_output=True)
    #serve(socket_io, host='0.0.0.0', port=8080)
