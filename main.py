import os

import tornado.web
import tornado.websocket
import tornado.ioloop
import tornado.web
from collections import defaultdict


class WaiterSet(defaultdict):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.default_factory = set

    def broadcast(self, key, message):
        for waiter in self[key]:
            try:
                waiter.write_message(message)
            except Exception:
                print('Error in WaiterSet')



class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("home.html")


class WSHandler(tornado.websocket.WebSocketHandler):

    def check_origin(self, origin):
        return True

    def open(self):

        print("WebSocket opened")

    def on_message(self, message):
        self.write_message(str(int(message)*2))

    def on_close(self):
        print("WebSocket closed")


class WSOnlineHandler(tornado.websocket.WebSocketHandler):

    online = dict()

    def __init__(self, application, request, **kwargs):
        super().__init__(application, request, **kwargs)
        self.nickname = ''

    def check_origin(self, origin):
        return True

    def open(self, nick, coordinates):
        self.online[nick] = {'self': self, 'coordinates': coordinates[:-1]}
        self.nickname = nick
        self.notification_new_user()
        print("NewUser")

    def on_message(self, message):
        pass

    def on_close(self):
        self.online.pop(self.nickname)
        self.notification_new_user()
        print("UserLogOut")

    @property
    def list_user(self):
        # Формируем список текущего онлайна
        return {'user_online': [nickname for nickname in self.online.keys() if nickname != self.nickname]}

    def notification_new_user(self):
        # Обновляем у всех подключенных пользователей список онлайна
        for user in self.online:
            _object = self.online[user]['self']
            list_user = _object.list_user
            _object.write_message(list_user)


def main():
    app = tornado.web.Application(
        [
            (r"/", MainHandler),
            (r'/ws/', WSHandler),
            (r'/ws/online/(?P<nick>\w+)/(?P<coordinates>\S+)/', WSOnlineHandler)
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
