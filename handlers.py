import os
import tornado.web
import tornado.websocket
import tornado.ioloop
import tornado.web

from models import User, Score


class LogoutHandler(tornado.web.RequestHandler):

    def get(self):
        self.clear_cookie('auth')
        self.redirect('/')


class ScoreHandler(tornado.web.RequestHandler):

    def get(self):
        self.render('score.html', users=User.select().order_by(User.score))


class MainHandler(tornado.web.RequestHandler):

    def get(self):
        auth = self.get_cookie('auth', default=None)
        if auth:
            self.render('home.html', nickname=auth)
        else:
            self.render('login.html')

    def post(self):
        username = self.get_argument('username')
        password = self.get_argument('password')

        user = User.get_or_none(username=username)
        if not user:
            score = Score.create()
            User.create(username=username, password=password, score=score)
            self.set_cookie('auth', username)
            self.redirect('/')
        else:
            if user.password == password:
                self.set_cookie('auth', username)
                self.redirect('/')
            else:
                self.write('Не верный пароль')


class WSGameHandler(tornado.websocket.WebSocketHandler):

    games = dict()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # состояние поля
        # 0 - пусто, 1 - есть блок корабля, 2 - мимо, 3 - подбит
        self.field = {x: 0 for x in [str(n) + letter for letter in 'ABCDEFGHKL' for n in list(range(10))]}
        self.id = self.opponent = self.nickname = ''

    def check_origin(self, origin):
        return True

    def open(self, id, coordinates, nick):
        self.id = id
        self.nickname = nick
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
        if coordinate:
            if opponent_field[coordinate]:
                opponent_field[coordinate] = 3
                status = 'corrupted'
            else:
                opponent_field[coordinate] = 2
                status = 'past'
        else:
            status = 'pass'

        for field_item in opponent_field:
            if opponent_field[field_item] == 1:
                break
        else:
            status = 'victory'

        response = {'coordinate': coordinate, 'status': status}

        self.write_message({'trigger': 'def', 'def': response})
        opponent.write_message({'trigger': 'attack', 'attack': response})

    def on_close(self):
        score = Score.select().join(User).where(User.username == self.nickname)[0]
        if self.close_code == 1000:
            reason = self.close_reason
            if reason == 'victory':
                score.win += 1
                score.games += 1
            elif reason == 'lose':
                score.lose += 1
                score.games += 1
        else:
            self.games[self.id][self.opponent].write_message('opponent_out')
            score.out += 1
            score.games += 1
        score.save()

        self.games.pop(self.id, None)
        print('game over')
        print(self.games)


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
            (r'/ws/game/(?P<id>\w+)/(?P<coordinates>\S+)/(?P<nick>\S+)/', WSGameHandler),
            (r'/ws/online/(?P<nick>\w+)/', WSOnlineHandler),
            (r'/logout/', LogoutHandler),
            (r'/score/', ScoreHandler),
        ],
        template_path=os.path.join(os.path.dirname(__file__), "templates"),
        static_path=os.path.join(os.path.dirname(__file__), "static"),
        xsrf_cookies=False,
        debug=True,
        autoreload=True,
    )
    app.listen(8888)
    tornado.ioloop.IOLoop.current().start()


if __name__ == "__main__":
    main()
