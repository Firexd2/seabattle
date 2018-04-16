from peewee import PostgresqlDatabase, Model, CharField, IntegerField, ForeignKeyField

psql_db = PostgresqlDatabase('den', user='den')


class BaseModel(Model):
    class Meta:
        database = psql_db


class Score(BaseModel):
    win = IntegerField(default=0)
    lose = IntegerField(default=0)
    out = IntegerField(default=0)
    games = IntegerField(default=0)

    class Meta:
        order_by = ['win']


class User(BaseModel):
    username = CharField()
    password = CharField()
    score = ForeignKeyField(Score, related_name='score')


Score.create_table()
User.create_table()
