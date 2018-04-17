$(function () {

    const letters = 'ABCDEFGHKL';
    const opponent_field = $('#opponent-table-ship');
    const my_field = $('#my-table-ship');
    const second_march = 60;
    let flag = true;

    $('#reset').on('click', function () {
        reset_field()
    });

    $(function () {
        const td = $('td');
        if (td.height() !== td.width()) {
            td.height(td.width())
        }
    });

    function tablo(message, color='default') {
        const colors = {'default': '#f7f7f7', 'red': '#b90000;', 'light_red': '#ffa3a7',
            'green': '#5DF75C', 'light_green': '#a8f7af', 'yellow': '#F7F6C5'};
        const tablo = $('#tablo');

        tablo.css({'background': colors[color]}).html(message);

        // if (animate) {
        //     function animated() {
        //         let new_color;
        //         if (tablo.css('background-color') === 'rgb(233, 233, 233)') {
        //
        //             new_color = '#f7f7f7'
        //         } else {
        //             new_color = '#e9e9e9'
        //         }
        //
        //         tablo.animate({backgroundColor: new_color}, 1000, 'linear', animated)
        //     }
        //     animated()
        // }
    }

    function reset_field() {
        my_field.find('td').removeClass();opponent_field.find('td').removeClass()
    }

    $(my_field.find('td')).on('click', function () {
        if (my_field.attr('class').split(' ').indexOf('block') === -1) {
            const classBlock = 'block-ship-table';
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

    });

    function check_class(element) {
        if (element.attr('class') === undefined) {
            return true
        } else return element.attr('class').length === 0;
    }


    // проверка на возможность расположения блоков кораблей
    function check_diagonale(element) {
        const coorditate_digit = parseInt(element.attr('id')[0]);
        const coordinate_letter = element.attr('id')[1];
        const movement = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
        let current_index_off;
        for (let i=0;i<movement.length;i++) {
            current_index_off = letters.indexOf(coordinate_letter);
            if (!(check_class($('#' + (coorditate_digit + movement[i][0]) + (letters[current_index_off + movement[i][1]]))))) {
                return false
            }
        }
        return true
    }

    // подсчет длинны корабля
    function check_length_ship(element) {
        let length = 1;
        const movement = [[-1, 0], [1, 0], [0, 1], [0, -1]];
        const coorditate_digit = parseInt(element.attr('id')[0]);
        const coordinate_letter = element.attr('id')[1];
        for (let i=0;i<4;i++) {
            for (let j=1;j<5;j++) {
                if (!(check_class($('#' + (coorditate_digit + movement[i][0] * j) + (letters[letters.indexOf(coordinate_letter) + movement[i][1] * j]))))) {
                    length += 1
                } else {
                    break
                }
            }
        }
        return length
    }

    function check_count_ship() {

        const movement = [[1, 0], [0, 1]];
        let ships = [0, 0, 0, 0];
        let length;

        // Делаем массив для отметок о проверенных кораблях
        const n = 11, m = 11;
        let array_ships = [];
        for (let i=0; i<m; i++) {
            array_ships[i] = [];
            for (let j=0; j<n; j++) {
                array_ships[i][j] = 0;
            }}

        for (let i=0;i<10;i++) {
            for (let j=0;j<10;j++) {
                if (!(array_ships[i][j])) {
                    if (!(check_class($('#' + i + letters[j])))) {
                        array_ships[i][j] = 1;
                        length = 1;
                        for (let q=0;q<2;q++) {
                            for (let f=1;f<5;f++) {
                                if (!(check_class($('#' + (i + movement[q][0] * f) + (letters[letters.indexOf(letters[j]) + movement[q][1] * f]))))) {
                                    length += 1;
                                    array_ships[i + movement[q][0] * f][j + movement[q][1] * f] = 1;
                                } else {
                                    break
                                }
                            }
                        }
                        ships[length - 1] += 1;
                    }
                }
            }
        }
        return ships
    }

    $('#run-game').on('click', function () {
        if (check_count_ship().toString() === '4,3,2,1') {




        } else {

            tablo('Ожидание игры');

            const item_field = my_field.find('td');
            let coordinate_ships = '';
            let current_item_field;
            const nick = $('#nickname').text();

            for (let i=0;i<item_field.length;i++) {

                current_item_field = item_field.eq(i);

                if (!(check_class(item_field.eq(i)))) {
                    coordinate_ships += current_item_field.attr('id') + '-'
                }
            }

            const online_socket = new WebSocket('ws://' + location.host + '/ws/online/' + nick + '/');

            online_socket.onopen = function () {
                my_field.addClass('block');
                $('#my-control').hide();

                online_socket.onmessage = function (ev) {
                    ev = JSON.parse(ev.data);
                    if (ev.trigger === 'list_user') {
                        const user_online = ev.user_online;
                        let html = '';
                        for (let i = 0; i < user_online.length; i++) {
                            html += '<p class="user">' + user_online[i] + '</p>'
                        }

                        if (!(html)) {
                            html = '<span style="font-size: 18px">Список пуст</span>'
                        }

                        $('.list-online').html(html);
                        $('.middle-info').show();
                        $('.start').hide();
                    } else if (ev.trigger === 'game') {
                        const user = ev.game;
                        const id = nick + user;
                        const game_socket = new WebSocket('ws://' + location.host + '/ws/game/' + id + '/' + coordinate_ships + '/' + nick + '/');
                        const chat_socket = new WebSocket('ws://' + location.host + '/ws/chat/' + id + '/' + nick + '/');
                        game_socket.onopen = function () {
                            online_socket.close();
                            gaming(game_socket, chat_socket, false)
                        }
                    }
                };

                $('body').on('click', '.user', function () {

                    const user = $(this).text();
                    const id = user + $('#nickname').text();
                    const game_socket = new WebSocket('ws://' + location.host + '/ws/game/' + id + '/' + coordinate_ships + '/' + nick + '/');
                    const chat_socket = new WebSocket('ws://' + location.host + '/ws/chat/' + id + '/' + nick + '/');
                    game_socket.onopen = function () {
                        online_socket.send(user);
                        online_socket.close();
                        gaming(game_socket, chat_socket, true)
                    }
                });

                function gaming(game_socket, chat_socket, march) {

                    tablo('Ожидаем соперника');

                    $('.middle-info').hide();

                    const my_time_element = $('#my-time');
                    const opponent_time_element = $('#opponent-time');
                    let timer_march;

                    function start_game() {
                        tablo('Игра началась!');
                        $('.start-info').hide();
                        $('.game-info').show();
                        $('#two-field').show();
                        _march(march);
                        my_time_element.text(second_march);
                        opponent_time_element.text(second_march);
                    }

                    if (!(march)) {
                        start_game()
                    }


                    function mark_around(coordinate, field) {
                        const coorditate_digit = parseInt(coordinate[0]);
                        const coordinate_letter = coordinate[1];
                        const movement = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
                        let current_index_off;
                        let coordinate_with_movement;
                        for (let i=0;i<movement.length;i++) {
                            current_index_off = letters.indexOf(coordinate_letter);
                            coordinate_with_movement = (coorditate_digit + movement[i][0]) + (letters[current_index_off + movement[i][1]]);
                            if (field === 'opponent_field') {
                                $('#' + coordinate_with_movement).addClass('past')
                            } else if (field === 'my_field') {
                                $('td[id2="' + coordinate_with_movement + '"]').addClass('past')
                            }
                        }
                    }


                    function timer(element) {
                        let value = element.text() - 1;
                        element.text(value);
                        if (value < 1) {
                            clearInterval(timer_march);
                            if (element.attr('id') === 'my-time') {
                                game_socket.send('')
                            }
                        }
                    }

                    function _march(march) {
                        let timer_element;

                        const my = $('#my');
                        const opponent= $('#two-field');

                        clearInterval(timer_march);
                        if (march) {
                            opponent.removeClass('hide-field'); my.addClass('hide-field');
                            timer_element = my_time_element;
                        } else {
                            my.removeClass('hide-field'); opponent.addClass('hide-field');
                            timer_element = opponent_time_element
                        }
                        timer_element.text(second_march);
                        timer_march = setInterval(timer, 1000, timer_element)
                    }

                    $(opponent_field.find('td')).on('click', function () {
                        if ($('#two-field').attr('class').indexOf('hide-field') === -1) {
                            if (!($(this).attr('class')) && flag) {
                                tablo('Ожидаем ответ от сервера');
                                flag = false;
                                game_socket.send($(this).attr('id2'));
                            }
                        }
                    });

                    game_socket.onmessage = function (ev) {
                        if (ev.data === 'opponent_out') {
                            alert('Противник покинул игру. Победа ваша!');
                            game_socket.close(1000, 'victory');
                            chat_socket.close();
                            location.reload()
                        } else if (ev.data === 'opponent_ready') {
                            start_game()
                        } else {
                            ev = JSON.parse(ev.data);
                            if (ev.trigger === 'def') {
                                const def = ev.def;
                                if (def.coordinate) {
                                    $('td[id2="' + def.coordinate + '"]').removeClass().addClass(def.status);
                                    flag = true;
                                }
                                if (def.status === 'dead' || def.status === 'victory') {
                                    tablo('Вы уничтожили корабль!', 'green');
                                    const movement = [[-1, 0], [1, 0], [0, 1], [0, -1]];
                                    const coorditate_digit = parseInt(def.coordinate[0]);
                                    const coordinate_letter = def.coordinate[1];
                                    let elem;
                                    for (let i=0;i<4;i++) {
                                        for (let j=1;j<5;j++) {
                                            elem = $('td[id2="' + (coorditate_digit + movement[i][0] * j) + (letters[letters.indexOf(coordinate_letter) + movement[i][1] * j])+ '"]');
                                            if (elem.attr('class') === 'corrupted') {
                                                elem.removeClass().addClass('dead')
                                            } else {
                                                break
                                            }
                                        }
                                    }
                                }
                                if ('past pass'.indexOf(def.status) !== -1) {
                                    tablo('Мимо!', 'yellow');
                                    if (def.status === 'past') {
                                        // audio
                                    }
                                    _march(false)
                                } else if ('corrupted dead'.indexOf(def.status) !== -1) {
                                    if (def.status === 'corrupted') {tablo('Вы подбили корабль', 'green')}
                                    my_time_element.text(second_march);
                                    mark_around(def.coordinate, 'my_field')
                                } else if (def.status === 'victory') {
                                    alert('Вы выиграли!');
                                    game_socket.close(1000, 'victory');
                                    chat_socket.close();
                                    location.reload()
                                }

                            } else if (ev.trigger === 'attack') {
                                const attack = ev.attack;
                                if (attack.coordinate) {
                                    my_field.find($('#' + attack.coordinate)).removeClass().addClass(attack.status);
                                }
                                if ('past pass'.indexOf(attack.status) !== -1) {
                                    tablo('Противник ударил мимо!', 'light_green');
                                    if (attack.status === 'past') {
                                        $('#past').click()
                                    }
                                    _march(true)
                                } else if ('corrupted dead'.indexOf(attack.status) !== -1) {
                                    if (attack.status === 'corrupted') {
                                        tablo('Ваш корабль ранен', 'light_red')
                                    } else {
                                        tablo('Ваш корабль убит', 'red')
                                    }
                                    opponent_time_element.text(second_march);
                                    mark_around(attack.coordinate, 'opponent_field')
                                } else if (attack.status === 'victory') {
                                    alert('Вы проиграли');
                                    game_socket.close(1000, 'lose');
                                    chat_socket.close();
                                    location.reload()
                                }
                            }
                        }
                    };

                    $('button[name=chat]').on('click', function () {
                        const input = $('input[name=chat]');
                        chat_socket.send(input.val());
                        $('.messages').prepend('<p class="item-chat"><b>Вы:</b> ' + input.val() + '</p>');
                        input.val('')
                    });

                    chat_socket.onmessage = function (ev) {
                        $('.messages').prepend('<p class="item-chat"><b>Соперник:</b> ' + ev.data + '</p>')
                    }
                }
            }


            // alert('Корабли расположены не по правилам')
        }
    })
});
