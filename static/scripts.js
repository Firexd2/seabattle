$(function () {

    const letters = 'ABCDEFGHKL';
    const opponent_field = $('#opponent-table-ship');
    const my_field = $('#my-table-ship');
    const colors = {1: '#00ff00', 2: '#00ffff', 3: '#191970', 4: '#8b008b'};
    const second_march = 60;
    let flag = true;

    const clear_array = function array_ships() {
        let array_ships = [];
        for (let i=0; i<11; i++) {
            array_ships[i] = [];
            for (let j=0; j<11; j++) {
                array_ships[i][j] = 0;
            }}
        return array_ships
    };

    $('#reset').on('click', function () {
        reset_field()
    });

    $('#random').on('click', function () {
        random_ships()
    });

    $(window).scroll(function () {
        const tablo = $('#tablo');
        if ($('.game-info').is(':visible') && window.innerWidth <= 768) {
            if ($(document).height() - $(window).height() - $(window).scrollTop() < 100) {
                $('#message').hide()
            } else {
                $('#message').show();
                $('#message').removeClass('new-message');
            }
        }

        if ($(this).scrollTop() > 50) {
            if (!(tablo.attr('style'))) {
                const left = (window.innerWidth - 300) / 2;
                tablo.attr('style', 'position: fixed;z-index: 999;top:-30px;left:' + left + 'px');
                tablo.animate({'top': 10}, 200)
            }
        } else {
            tablo.attr('style', '')
        }
    });

    $('#message').on('click', function () {
        scrolltoField($('.messages'))
    });

    function scrolltoField(field) {
        if (window.innerWidth <= 768) {
            const top = $(field).offset().top;
            $('body,html').animate({scrollTop: top}, 1000);
        }
    }

    $(function () {
        const td = $('td');
        if (td.height() !== td.width()) {
            td.height(td.width())
        }
    });

    function tablo(message, color='default') {
        const tablo = $('#tablo');
        tablo.removeClass();
        tablo.addClass(color).html(message);
    }

    function reset_field() {
        my_field.find('td').removeClass().css({'background': 'none'});
    }

    function random_ships() {

        reset_field();

        let ships = [0, 4, 3, 2, 1];
        const movement = [[1, 0], [0, 1]];
        const all_movement = [[0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1]];
        let current_size = 4;
        let clear_array_ships = clear_array();
        let random_coordinate;
        let road;
        let result_coordinates_ships = [];
        let hypothetical_coordinates_ships = [];

        function random() {
            let random1;
            let random2;
            function random_digit() {
                let rand = 0 - 0.5 + Math.random() * 10;
                return Math.round(rand);
            }
            while (1) {
                random1 = random_digit();
                random2 = random_digit();
                if (!clear_array_ships[random1][random2]) {
                    return '' + random1 + random2
                }
            }
        }


        while (ships.some(elem => elem > 0)) {

            random_coordinate = random();
            road = movement[Math.round(Math.random())];

            hypothetical_coordinates_ships.push(random_coordinate);

            for (let size=1;size<current_size;size++) {

                const one = parseInt(random_coordinate[0]) + road[0]*size;
                const two = parseInt(random_coordinate[1]) + road[1]*size;

                if (one < 10 && one > -1 && two < 10 && two > -1) {
                    if (!(clear_array_ships[one][two])) {
                        hypothetical_coordinates_ships.push('' + one + two)
                    } else {
                        hypothetical_coordinates_ships.length = 0;
                    }
                } else {
                    hypothetical_coordinates_ships.length = 0
                }
            }


            if (hypothetical_coordinates_ships.length > 0) {
                let current_coordinate1;
                let current_coordinate2;
                for (let i=0;i<hypothetical_coordinates_ships.length;i++) {

                    current_coordinate1 = parseInt(hypothetical_coordinates_ships[i][0]);
                    current_coordinate2 = parseInt(hypothetical_coordinates_ships[i][1]);

                    clear_array_ships[current_coordinate1][current_coordinate2] = 1;

                    for (let j=0;j<all_movement.length;j++) {

                        const one = current_coordinate1 + all_movement[j][0];
                        const two = current_coordinate2 + all_movement[j][1];

                        if (one < 10 && one > -1 && two < 10 && two > -1) {
                            clear_array_ships[one][two] = 1;
                        }
                    }
                }

                for (let i=0;i<hypothetical_coordinates_ships.length;i++) {
                    result_coordinates_ships.push(hypothetical_coordinates_ships[i])
                }

                hypothetical_coordinates_ships.length = 0;

                ships[current_size] -= 1;
                if (ships[current_size] === 0) {
                    current_size -= 1
                }
            }



        }

        let block_colors = [4, 6, 6, 4];
        let color;
        for (let i=0;i<result_coordinates_ships.length;i++) {
            for (let c=0;c<block_colors.length;c++) {
                if (block_colors[c] !== 0) {
                    block_colors[c] -= 1;
                    color = colors[4-c];
                    break
                }
            }
            $('#' + result_coordinates_ships[i][0] + letters[result_coordinates_ships[i][1]]).css({'background': color}).addClass('block-ship-table')
        }
    }

    $(my_field.find('td')).on('click', function () {

        const movement = [[-1, 0], [1, 0], [0, 1], [0, -1]];
        let id;
        let elem;

        if (my_field.attr('class').split(' ').indexOf('block') === -1) {
            const classBlock = 'block-ship-table';
            if (check_class($(this))) {
                if (check_diagonale($(this))) {
                    if (check_length_ship_and_color($(this)) < 5) {
                        $(this).addClass(classBlock)
                    }
                }
            } else {
                $(this).removeClass(classBlock).css({'background': 'none'});
                // красим в другой цвет корабли, которые получились после удаления промежуточного блока
                id = $(this).attr('id');
                for (let i=0;i<4;i++) {
                    elem = $('#' + (parseInt(id[0]) + movement[i][0]) + (letters[letters.indexOf(id[1]) + movement[i][1]]));
                    if (elem.attr('class')) {
                        check_length_ship_and_color(elem)
                    }
                }
            }
        }
    });

    function check_class(element) {
        if (element.attr('class') === undefined) {
            return true
        } else return element.attr('class').length === 0;
    }

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

    function check_length_ship_and_color(element) {

        function paint_ship(cordinates) {
            for (let i=0;i<cordinates.length;i++) {
                $('#' + cordinates[i]).css({'background': colors[coordinates.length]})
            }
        }
        let length = 1;
        const movement = [[-1, 0], [1, 0], [0, 1], [0, -1]];
        const coorditate_digit = parseInt(element.attr('id')[0]);
        const coordinate_letter = element.attr('id')[1];
        let coordinates = [element.attr('id')];
        let new_coordinate;
        for (let i=0;i<4;i++) {
            for (let j=1;j<5;j++) {
                new_coordinate = (coorditate_digit + movement[i][0] * j) + (letters[letters.indexOf(coordinate_letter) + movement[i][1] * j]);
                if (!(check_class($('#' + new_coordinate)))) {
                    length += 1;
                    coordinates.push(new_coordinate)
                } else {
                    break
                }
            }
        }
        paint_ship(coordinates);
        return length
    }

    function check_count_ship() {

        const movement = [[1, 0], [0, 1]];
        let ships = [0, 0, 0, 0];
        let length;
        let array_ships = clear_array();

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

            online_socket.onerror = function(error) {
                alert("Ошибка " + error.message);
            };

            online_socket.onopen = function () {
                my_field.addClass('block');
                $('#my-control').hide();

                $('.middle-info').show();
                scrolltoField($('.middle-info'));

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
                        $('.start').hide();
                    } else if (ev.trigger === 'offergame') {
                        $('.middle-info').hide();
                        tablo('<i class="fa fa-spinner fa-spin fa-fw"></i> Ожидаем ответ от сервера');
                        online_socket.send('startgame ' + ev.id)
                    } else if (ev.trigger === 'startgame') {
                        const game_socket = new WebSocket('ws://' + location.host + '/ws/game/' + ev.id + '/' + coordinate_ships + '/' + nick + '/');
                        const chat_socket = new WebSocket('ws://' + location.host + '/ws/chat/' + ev.id + '/' + nick + '/');
                        game_socket.onopen = function () {
                            online_socket.close();
                            gaming(game_socket, chat_socket, ev.march === 0)
                        }
                    } else if (ev.trigger === 'busy') {
                        $('.middle-info').show();
                        tablo('Этот игрок уже начал игру')
                    }
                };

                $('body').on('click', '.user', function () {
                   $('.middle-info').hide();
                    tablo('<i class="fa fa-spinner fa-spin fa-fw"></i> Ожидание сервера');
                    const opponent_nick = $(this).text();
                    const my_nick = $('#nickname').text();
                    online_socket.send('newgame ' + my_nick + ' ' + opponent_nick);
                });

                function gaming(game_socket, chat_socket, march) {

                    tablo('<i class="fa fa-spinner fa-spin fa-fw"></i> Ожидаем соперника');

                    const my_time_element = $('#my-time');
                    const opponent_time_element = $('#opponent-time');
                    let timer_march;

                    $('.middle-info').hide();

                    function start_game() {
                        tablo('Игра началась!');
                        $('.start-info').hide();
                        $('.game-info').show();
                        $('#two-field').show();
                        _march(march);
                        my_time_element.text(second_march);
                        opponent_time_element.text(second_march);
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
                            scrolltoField(opponent)
                        } else {
                            my.removeClass('hide-field'); opponent.addClass('hide-field');
                            timer_element = opponent_time_element;
                            scrolltoField(my)
                        }
                        timer_element.text(second_march);
                        timer_march = setInterval(timer, 1000, timer_element)
                    }

                    $(opponent_field.find('td')).on('click', function () {
                        if ($('#two-field').attr('class').indexOf('hide-field') === -1) {
                            if (!($(this).attr('class')) && flag) {
                                tablo('<i class="fa fa-spinner fa-spin fa-fw"></i> Ожидаем ответ от сервера');
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
                        } else if (ev.data === 'startgame') {
                            start_game()
                        } else if (ev.data === 'error') {
                            game_socket.close(1010);
                            alert('Произошла непредвиденная ошибка. Страница будет перезагружена. Пожалуйста, сообщите ' +
                                'об этом сообщении разработчику')
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
                                    my_field.find($('#' + attack.coordinate)).removeClass().css({'background': 'none'}).addClass(attack.status);
                                }
                                if ('past pass'.indexOf(attack.status) !== -1) {
                                    tablo('Противник ударил мимо!', 'green');
                                    _march(true)
                                } else if ('corrupted dead'.indexOf(attack.status) !== -1) {
                                    if (attack.status === 'corrupted') {
                                        tablo('Ваш корабль ранен', 'red')
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
                        if (ev.data !== 'error') {
                            $('.messages').prepend('<p class="item-chat"><b>Соперник:</b> ' + ev.data + '</p>');
                            $('#message').addClass('new-message')
                        } else {
                            $('.messages').prepend('<p style="color: red" class="item-chat">' + 'Произошла ошибка' + '</p>')
                        }
                    }
                }
            }
        } else {
            alert('Корабли следует расположить в виде: 1 четырёхпалубный, 2 трехпалубные, 3 двухпалубные, 4 однопалубные')
        }
    });

    $('input[name=username]').on('input', function () {
        const $this = $(this);
        const regexp = /^[a-z0-9\s]+$/i;
        if ($this.val().length > 11 || !regexp.test($this.val())) {
            $this.val($this.val().slice(0,-1))
        }
    })
});
