import os

import tornado.web
import tornado.websocket
import tornado.ioloop
import tornado.web


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("home.html")


class WSHandler(tornado.websocket.WebSocketHandler):

    def check_origin(self, origin):
        return True

    def open(self, game_id):
        print("WebSocket opened")

    def on_message(self, message):
        self.write_message(str(int(message)*2))

    def on_close(self):
        print("WebSocket closed")


def main():
    app = tornado.web.Application(
        [
            (r"/", MainHandler),
            (r'/scripts/(?P<game_id>\d+)/', WSHandler)
        ],
        cookie_secret="__TODO:_GENERATE_YOUR_OWN_RANDOM_VALUE_HERE__",
        template_path=os.path.join(os.path.dirname(__file__), "templates"),
        static_path=os.path.join(os.path.dirname(__file__), "static"),
        xsrf_cookies=True,
        debug=True,
        autoreload=True
    )
    app.listen(8888)
    tornado.ioloop.IOLoop.current().start()


if __name__ == "__main__":
    main()
