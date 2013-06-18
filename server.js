var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , logger = require('logger')
  , game = require('game')
  , curPlayerIndex = 0;

io.set('log level', 1);

server.listen(1337);

app.get('/', function (req, res) {
  res.sendfile('./client/pages/index.html');
});

app.use(express.static(__dirname + '/client/js'));

//setting up game
var gameLoopCallback = function(players) {
  io.sockets.emit('update', {players:players, elapsedTime:36});
};

game.addPlatform('top_floor', 0, 0, 1000, 32);
game.addPlatform('right_floor', 968, 0, 32, 600);
game.addPlatform('bottom_floor', 0, 600, 1000, 32);
game.addPlatform('left_floor', 0, 0, 32, 600);

game.addPlatform('middle_floor', 0, 135, 64, 32);




io.sockets.on('connection', function (socket) {
    var address = socket.handshake.address;
    var id = address.address + ':' + address.port + '/' + curPlayerIndex++;
    logger.log('New connection ' + id, logger.green);
    var player = game.addPlayer(id);
    //Give the platforms
    socket.emit('init_platforms', game.platforms);
    //Give the player his id
    socket.emit('init_id', id);

    //Manage player disconnect
    socket.on('disconnect', function () {
        logger.log('Player '+id + ' disconnect', logger.red);
        game.removePlayer(id);
    });

    //Manage inputs
    socket.on('input', function(data) {
      var type = data.type; //up or down
      var key = data.key; //up, down, left or right
      game.manageInput(type, key, player);
    });

    //Manage chat
    socket.on('chat_message', function(data) {
      io.sockets.emit('chat_message', '>' + id + ' : ' + data);
    });
});

game.start(gameLoopCallback);