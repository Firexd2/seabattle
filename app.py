import asyncio
import os

import tornado.web
from tornado.platform.asyncio import AsyncIOMainLoop

from handlers import MainHandler, WSGameHandler, WSChatHandler, WSOnlineHandler, LogoutHandler, ScoreHandler

app = tornado.web.Application(
    [
        (r'/', MainHandler),
        (r'/ws/game/(?P<id>\w+)/(?P<coordinates>\S+)/(?P<nick>\S+)/', WSGameHandler),
        (r'/ws/chat/(?P<id>\w+)/(?P<nick>\w+)/', WSChatHandler),
        (r'/ws/online/(?P<nick>\w+)/', WSOnlineHandler),
        (r'/logout/', LogoutHandler),
        (r'/score/', ScoreHandler),
    ],
    template_path=os.path.join(os.path.dirname(__file__), "templates"),
    static_path=os.path.join(os.path.dirname(__file__), "static"),
    xsrf_cookies=False,
    debug=True
)

app.listen(8888)
AsyncIOMainLoop().install()
loop = asyncio.get_event_loop()
try:
    loop.run_forever()
except KeyboardInterrupt:
    print("server stopped")
