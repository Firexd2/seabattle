var ws = new WebSocket('ws://127.0.0.1:8888/ws');

ws.onopen;

$('#btn').on('click', function () {
    ws.send($('input').val())
});

ws.onmessage = function (ev) { $('span').text(ev.data) };