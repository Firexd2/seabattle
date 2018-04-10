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


class WSGameHandler(tornado.websocket.WebSocketHandler):

    games = dict()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # состояние поля
        # 0 - пусто, 1 - есть блок корабля, 2 - мимо, 3 - подбит
        self.field = {x: 0 for x in [str(n) + letter for letter in 'ABCDEFGHKL' for n in list(range(10))]}
        self.id = ''
        self.opponent = ''


    def check_origin(self, origin):
        return True

    def open(self, id, coordinates):
        self.id = id
        for coordinate in coordinates[:-1].split('-'):
            self.field[coordinate] = 1

        if not self.games.get(id):
            self.games[id] = {'one': self}
            self.opponent = 'two'
        else:
            _dict = self.games[id]
            _dict.update({'two': self})
            self.opponent = 'one'

        print(self.games)

    def on_message(self, coordinate):
        opponent = self.games[self.id][self.opponent]
        opponent_field = opponent.field

        if opponent_field[coordinate]:
            opponent_field[coordinate] = 3
            status = 'corrupted'
        else:
            opponent_field[coordinate] = 2
            status = 'past'

        response = {'coordinate': coordinate, 'status': status}

        self.write_message({'trigger': 'def', 'def': response})
        opponent.write_message({'trigger': 'attack', 'attack': response})

    def on_close(self):
        print("Game closed")


class WSOnlineHandler(tornado.websocket.WebSocketHandler):

    online = dict()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.nickname = ''

    def check_origin(self, origin):
        return True

    def open(self, nick):
        self.online[nick] = {'self': self}
        self.nickname = nick
        self.notification_online_user()
        print("NewUser")

    def on_message(self, message):
        # Создание игры
        _object = self.online[message]['self']
        _object.write_message({'game': self.nickname, 'trigger': 'game'})

    def on_close(self):
        self.online.pop(self.nickname)
        self.notification_online_user()
        print("UserLogOut")

    @property
    def list_user(self):
        # Формируем список текущего онлайна
        return {'user_online': [nickname for nickname in self.online.keys() if nickname != self.nickname]}

    def notification_online_user(self):
        # Обновляем у всех подключенных пользователей список онлайна
        for user in self.online:
            _object = self.online[user]['self']
            list_user = _object.list_user
            list_user.update({'trigger': 'list_user'})
            _object.write_message(list_user)


def main():
    app = tornado.web.Application(
        [
            (r'/', MainHandler),
            (r'/ws/game/(?P<id>\w+)/(?P<coordinates>\S+)/', WSGameHandler),
            (r'/ws/online/(?P<nick>\w+)/', WSOnlineHandler)
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
