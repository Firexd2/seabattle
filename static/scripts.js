// var scripts = new WebSocket('scripts://127.0.0.1:8888/scripts/13/');
//
// scripts.onopen;
//
// $('#btn').on('click', function () {
//     scripts.send($('input').val())
// });
//
// scripts.onmessage = function (ev) { $('span').text(ev.data) };

$(function () {
    $('td').on('click', function () {
        var classBlock = 'block-ship-table';
        if ($(this).attr('class') !== 'row-n') {
            if (check_class($(this)) ) {
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
        var letters = 'ABCDEFGHKL';
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

        circumvention(element);

        function circumvention(element, last='start') {
            var letters = 'ABCDEFGHKL';
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
                            circumvention(future_element, element);
                        }
                    } else {
                        length += 1;
                        circumvention(future_element, element);
                    }
                }
            }
        }
        return length
    }

});


