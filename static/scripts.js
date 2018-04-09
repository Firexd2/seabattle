$(function () {

    var letters = 'ABCDEFGHKL';

    $('td').on('click', function () {
        if ($('#my-table-ship').attr('class') !== 'block') {
            var classBlock = 'block-ship-table';
            if ($(this).attr('class') !== 'row-n') {
                if (check_class($(this))) {
                    if (check_diagonale($(this))) {
                        if (check_length_ship($(this)) < 5) {
                            $(this).addClass(classBlock)
                        }
                    }
                } else {
                    $(this).removeClass(classBlock)
                }
            }
        }
    });

    function check_class(element) {
        if (element.attr('class') === undefined) {
            return true
        } else return element.attr('class').length === 0;
    }


    // проверка на возможность расположения блоков кораблей
    function check_diagonale(element) {
        var coorditate_digit = parseInt(element.attr('id')[0]);
        var coordinate_letter = element.attr('id')[1];
        var movement = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
        var current_index_off;
        for (var i=0;i<movement.length;i++) {
            current_index_off = letters.indexOf(coordinate_letter);
            if (!(check_class($('#' + (coorditate_digit + movement[i][0]) + (letters[current_index_off + movement[i][1]]))))) {
                return false
            }
        }
        return true
    }

    // подсчет длинны корабля
    function check_length_ship(element) {
        var length = 1;

        circumvention({element: element, last:'start'});

        function circumvention(parameters) {
            var element = parameters.element;
            var last = parameters.last;
            var coorditate_digit = parseInt(element.attr('id')[0]);
            var coordinate_letter = element.attr('id')[1];
            var movement = [[-1, 0], [1, 0], [0, 1], [0, -1]];
            var current_index_off;
            var future_element;
            for (var i=0;i<movement.length;i++) {
                current_index_off = letters.indexOf(coordinate_letter);
                future_element = $('#' + (coorditate_digit + movement[i][0]) + (letters[current_index_off + movement[i][1]]));
                if (!(check_class(future_element))) {
                    if (last !== 'start') {
                        if (last.attr('id') !== future_element.attr('id')) {
                            length += 1;
                            circumvention({element: future_element, last: element});
                        }
                    } else {
                        length += 1;
                        circumvention({element: future_element, last: element});
                    }
                }
            }
        }
        return length
    }

    function check_count_ship() {

        var ships = [0, 0, 0, 0];
        var length;

        // Делаем массив для отметок о проверенных кораблях
        var n = 11, m = 11;
        var array_ships = [];
        for (var i = 0; i < m; i++){
            array_ships[i] = [];
            for (var j = 0; j < n; j++){
                array_ships[i][j] = 0;
            }}

        for (var i=0;i<10;i++) {
            for (var j=0;j<10;j++) {
                if (!(array_ships[i][j])) {

                    if (!(check_class($('#' + i + letters[j])))) {
                        array_ships[i][j] = 1;
                        length = 1;

                        search_ship({element: $('#' + i + letters[j]), last: 'start'});

                        function search_ship(parameters) {
                            var element = parameters.element;
                            var last = parameters.last;
                            var coorditate_digit = parseInt(element.attr('id')[0]);
                            var coordinate_letter = element.attr('id')[1];
                            var movement = [[-1, 0], [1, 0], [0, 1], [0, -1]];
                            var current_index_off;
                            var future_element;
                            for (var q = 0; q < movement.length; q++) {
                                current_index_off = letters.indexOf(coordinate_letter);
                                future_element = $('#' + (coorditate_digit + movement[q][0]) + (letters[current_index_off + movement[q][1]]));
                                if (!(check_class(future_element))) {
                                    if (last !== 'start') {
                                        if (last.attr('id') !== future_element.attr('id')) {
                                            length += 1;
                                            search_ship({element: future_element, last: element});
                                        }
                                    } else {
                                        length += 1;
                                        search_ship({element: future_element, last: element});
                                    }
                                    if (i + movement[q][0] >= 0 && j + movement[q][1] >= 0) {
                                        array_ships[i + movement[q][0]][j + movement[q][1]] = 1;
                                    }
                                }
                            }
                        }
                        ships[length - 1] += 1;
                    }
                }
            }
        }

        ships[2] = ships[2] / 2;
        ships[3] = ships[3] / 2;
        return ships
    }

    $('button').on('click', function () {
        if (check_count_ship().toString() === '4,3,2,1') {




        } else {

            var item_field = $('#my-table-ship').find('td');
            var coordinate_ships = '';
            var current_item_field;
            var nick = $('#nickname').val();

            for (var i=0;i<item_field.length;i++) {

                current_item_field = item_field.eq(i);

                if (!(current_item_field.attr('class') === 'row-n')) {
                    if (!(check_class(item_field.eq(i)))) {
                        coordinate_ships += current_item_field.attr('id') + '-'
                    }
                }
            }

            var online_socket = new WebSocket('ws://127.0.0.1:8888/ws/online/' + nick + '/');

            online_socket.onopen = function () {
                $('#my-table-ship').addClass('block');
                $('#my-control').hide();

                online_socket.onmessage = function (ev) {
                    ev = JSON.parse(ev.data);
                    if (ev.trigger === 'list_user') {
                        var user_online = ev.user_online;
                        var html = '';
                        for (var i = 0; i < user_online.length; i++) {
                            html += '<p class="user">' + user_online[i] + '</p>'
                        }

                        if (!(html)) {
                            html = 'Список онлайна пуст'
                        }

                        $('.list-online').html(html);
                        $('#online').show()
                    } else if (ev.trigger === 'game') {
                        var user = ev.game;
                        var id = $('input').val() + user;
                        var game_socket = new WebSocket('ws://127.0.0.1:8888/ws/game/' + id + '/' + coordinate_ships + '/');
                        game_socket.onopen = function () {
                            online_socket.close();
                            gaming(game_socket)
                        }
                    }
                };

                $('body').on('click', '.user', function () {

                    var user = $(this).text();
                    var id = user + $('input').val();
                    var game_socket = new WebSocket('ws://127.0.0.1:8888/ws/game/' + id + '/' + coordinate_ships + '/');
                    game_socket.onopen = function () {
                        online_socket.send(user);
                        online_socket.close();
                        gaming(game_socket)
                    }
                });

                function gaming(game_socket) {

                    $('#online').hide();
                    $('#two-field').show();
                    alert('ИГРА НАЧАЛАСЬ')
                }
            }


            // alert('Корабли расположены не по правилам')
        }



    })
});
