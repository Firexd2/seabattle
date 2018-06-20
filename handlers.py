import asyncio

import tornado.web
import tornado.web
import tornado.websocket
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
                self.write('Incorrect password')
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
        try:
            return [self.chats[self.id][key] for key in self.chats[self.id] if key != self.nickname][0]
        except KeyError:
            pass

    def check_origin(self, origin):
        return True

    def open(self, id, nick):
        self.id = id
        self.nickname = nick

        if not self.chats.get(id):
            self.chats[id] = {}

        self.chats[id].update({nick: self})

    def on_message(self, message):
        oponent = self.get_opponent_object
        if oponent:
            oponent.write_message(message)
        else:
            self.write_message('error')

    def on_close(self):
        self.chats.pop(self.id, None)


class WSGameHandler(tornado.websocket.WebSocketHandler):

    games = dict()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # 0 - null, 1 - block ship, 2 - pass, 3 - corrupted
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

                    if int(coordinate[0]) + route[0] * m < 0 or letters.index(coordinate[1]) + route[1] * m < 0:
                        raise KeyError
                    if cell == 1:
                        return False
                    if cell != 3:
                        break
                except (KeyError, IndexError):
                    break
        return True

    @property
    def get_opponent_object(self):
        try:
            return tuple(self.games[self.id][key] for key in self.games[self.id] if key != self.nickname)[0]
        except KeyError:
            pass

    def check_origin(self, origin):
        return True

    def open(self, id, coordinates, nick):
        self.id = id
        self.nickname = nick

        for coordinate in coordinates[:-1].split('-'):
            self.field[coordinate] = 1

        if not self.games.get(id):
            self.games[id] = {}

        self.games[id].update({nick: self})

        if len(self.games[id]) == 2:
            for object in self.games[id].values():
                object.write_message('startgame')

    def on_message(self, coordinate):
        opponent = self.get_opponent_object
        opponent_field = opponent.field
        if opponent:
            if coordinate:
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
        else:
            self.write_message('error')

    def on_close(self):
        loop = asyncio.get_event_loop()
        loop.create_task(self.after_close())

    async def after_close(self):
        score = await objects.get(Score.select().join(User).where(User.username == self.nickname))
        if self.close_code != 1010:
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


class WSOnlineHandler(tornado.websocket.WebSocketHandler):

    online = dict()
    await_game = dict()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.nickname = ''

    def check_origin(self, origin):
        return True

    def open(self, nick):
        self.online[nick] = self
        self.nickname = nick
        self.notification_online_user()

    def check_for_repeated_call(self, nick, opponent_nick):
        for game_id in self.await_game:
            if nick in self.await_game[game_id] or opponent_nick in self.await_game[game_id]:
                return True

    def on_message(self, message):
        message = message.split(' ')
        trigger = message[0]

        if trigger == 'newgame':
            my_nick = message[1]
            opponent_nick = message[2]
            id_game = my_nick + opponent_nick

            obj_opponent = self.online.get(opponent_nick)

            if not self.check_for_repeated_call(my_nick, opponent_nick) and obj_opponent:
                self.await_game[id_game] = (my_nick, opponent_nick)
                obj_opponent.write_message({'id': id_game, 'trigger': 'offergame'})
            else:
                self.write_message({'trigger': 'busy'})
        elif trigger == 'startgame':
            id_game = message[1]
            objects = self.await_game[id_game]
            for march, name in enumerate(objects):
                self.online[name].write_message({'id': id_game, 'trigger': 'startgame', 'march': march})
            self.await_game.pop(id_game, None)

    @property
    def list_user(self):
        return {'user_online': [nickname for nickname in self.online.keys() if nickname != self.nickname]}

    def notification_online_user(self):
        for user in self.online:
            _object = self.online[user]
            list_user = _object.list_user
            list_user.update({'trigger': 'list_user'})
            try:
                _object.write_message(list_user)
            except tornado.websocket.WebSocketClosedError:
                self.online.pop(_object.nickname, None)

    def on_close(self):
        self.online.pop(self.nickname, None)
        self.notification_online_user()
