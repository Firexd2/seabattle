import asyncio
import tornado.web
import tornado.websocket
import tornado.web
from peewee import DoesNotExist
from config import objects
from models import User, Score


letters, digits = 'ABCDEFGHKL', list(range(10))
default_coordinates = [[str(digit)+letter for letter in letters] for digit in digits]


class LogoutHandler(tornado.web.RequestHandler):

    def get(self):
        self.clear_cookie('auth')
        self.redirect('/')


class ScoreHandler(tornado.web.RequestHandler):

    async def get(self):
        score = await objects.execute(Score.select().order_by(-Score.win))
        self.render('score.html', scores=score)


class MainHandler(tornado.web.RequestHandler):

    async def get(self):
        auth = self.get_cookie('auth', default=None)
        if auth:
            self.render('home.html', nickname=auth, coordinates=default_coordinates)
        else:
            self.render('login.html')

    async def post(self):
        username = self.get_argument('username')
        password = self.get_argument('password')

        try:
            user = await objects.get(User, username=username)
            if user.password == password:
                self.set_cookie('auth', username)
                self.redirect('/')
            else:
                self.write('Не верный пароль')
        except DoesNotExist:
            score = await objects.create(Score)
            await objects.create(User, username=username, password=password, score=score)
            self.set_cookie('auth', username)
            self.redirect('/')



class WSChatHandler(tornado.websocket.WebSocketHandler):

    chats = dict()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.id = self.nickname = ''

    @property
    def get_opponent_object(self):
        return [self.chats[self.id][key] for key in self.chats[self.id] if key != self.nickname][0]

    def check_origin(self, origin):
        return True

    async def open(self, id, nick):
        self.id = id
        self.nickname = nick
        if not self.chats.get(id):
            self.chats[id] = {nick: self}
        else:
            _dict = self.chats[id]
            _dict.update({nick: self})

    def on_message(self, message):
        oponent = self.get_opponent_object
        oponent.write_message(message)

    def on_close(self):
        if self.chats.get(self.id):
            self.chats.pop(self.id, None)


class WSGameHandler(tornado.websocket.WebSocketHandler):

    games = dict()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # состояние поля
        # 0 - пусто, 1 - есть блок корабля, 2 - мимо, 3 - подбит
        self.field = {coordinate: 0 for coordinate in sum(default_coordinates, [])}
        self.id = self.nickname = ''

    def definition_dead(self, coordinate):
        movement = ((-1, 0), (1, 0), (0, 1), (0, -1))
        field = self.get_opponent_object.field

        for route in movement:

            for m in list(range(4)):
                try:
                    cell = field.get(str(int(coordinate[0]) + route[0] * m) +
                                     str(letters[letters.index(coordinate[1]) + route[1] * m]))
                    if cell == 1:
                        return False
                    if cell != 3:
                        break
                except (KeyError, IndexError):
                    break
        return True

    @property
    def get_opponent_object(self):
        game = self.games.get(self.id)
        if game:
            return tuple(self.games[self.id][key] for key in game if key != self.nickname)[0]

    def check_origin(self, origin):
        return True

    def open(self, id, coordinates, nick):
        self.id = id
        self.nickname = nick
        for coordinate in coordinates[:-1].split('-'):
            self.field[coordinate] = 1

        if not self.games.get(id):
            self.games[id] = {nick: self}
        else:
            _dict = self.games[id]
            _dict.update({nick: self})
            self.get_opponent_object.write_message('opponent_ready')

        print(self.games)

    def on_message(self, coordinate):
        opponent = self.get_opponent_object
        opponent_field = opponent.field

        if coordinate:
            print(str(opponent_field[coordinate]) + '-' + coordinate)
            if opponent_field[coordinate]:
                opponent_field[coordinate] = 3
                if not self.definition_dead(coordinate):
                    status = 'corrupted'
                else:
                    status = 'dead'
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
        loop = asyncio.get_event_loop()
        loop.create_task(self.after_close())

    async def after_close(self):
        score = await objects.get(Score.select().join(User).where(User.username == self.nickname))
        if self.close_code == 1000:
            reason = self.close_reason
            if reason == 'victory':
                score.win += 1
            elif reason == 'lose':
                score.lose += 1
        else:
            opponent_object = self.get_opponent_object
            if opponent_object:
                opponent_object.write_message('opponent_out')
                score.out += 1

        score.games += 1
        await objects.update(score)

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
