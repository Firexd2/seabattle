import logging
import os

import peewee_async
from tornado.options import options, parse_command_line

psql_db = peewee_async.PostgresqlDatabase('seabattle', user='admin', password='seabattleistop', host='localhost')
objects = peewee_async.Manager(psql_db)
objects.database.allow_sync = logging.ERROR

options.logging = 'error'
options.log_file_prefix = os.path.join(os.path.dirname(__file__), "error.log")
parse_command_line()
