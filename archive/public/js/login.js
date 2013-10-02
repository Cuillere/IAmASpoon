(function(){
    'use strict'

    var log_div = document.getElementById('log-div');
    var game_div = document.getElementById('game-div');

    var team_input = document.getElementById('team-hidden');
    var name_input = document.getElementById('log-name');
    var blue_input = document.getElementById('team-blue-button');
    var red_input = document.getElementById('team-red-button');

    blue_input.addEventListener('click', function() {
        startGame('blue');
    });

    red_input.addEventListener('click', function() {
        startGame('red');
    });

    function startGame(team) {
        team_input.value = team;
        if(name_input.value.length > 0) {
            setupGame();
            log_div.style.display = 'none';
            game_div.style.display = 'block';
        } else {
            alert('You need to choose a nickname !')
        }
    }

})();
