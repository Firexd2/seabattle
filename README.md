## Online game seabattle

Online game sea battle written with python tornado. The game is being build on the classic rules.

The game available in my server: http://seabattle.beloglazov.me

![seabattle](https://github.com/Firexd2/test/blob/master/seabattle.gif)

### Install

#### Clone repository

```bash
$ git clone https://github.com/Firexd2/seabattle.git
```

#### Requirements

In the project root folder and with the activated virtual environment:

```bash
$ pip install -r requirements.txt
```

#### Database setup

In the project uses PostgreSQL. To configure your database settings, change to ``config.py`` on 7 line.

```python
psql_db = peewee_async.PostgresqlDatabase('databasename', user='youruser', password='yourpassword', host='localhost')
```

#### Run tornado

In the project root folder and with the activated virtual environment:

```bash
$ python app.py
```

If you did everything right, then the game will available in your localhost adress. Yoy can play it with everyone, who will connection to your localhost.

If you want to deploy the project, then you must configure Nginx to successfully proxy the websocket. Do not forget configure the supervisord to launch the apllication in the background.

*Example setting Nginx:*

```bash
server {
    listen 80;
    server_name your.adress.com;

    location = /favicon.ico { access_log off; log_not_found off; }
    location /static/ {
        root /home/yourname/static;
    }

    location / {
        proxy_pass http://127.0.0.1:8888; # Tornado listen 8888 port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 1200; # time in seconds, through which Nginx will reset the connection
    }
}

```

*Example setting supervisord*

```bash
[program:seabattle]
command = /home/den/Env/seabattle/bin/python3.5 /home/den/seabattle/app.py
autorestart = true
autostart = true
stderr_logfile = /var/log/seabattle.err.log
stdout_logfile = /dev/null
```

