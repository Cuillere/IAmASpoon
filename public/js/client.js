function setupGame() {
    "use strict"

    //VARS
    //--->Log
    var name_input = document.getElementById('log-name');
    var team_input = document.getElementById('team-hidden');
    //--->Chat
    var chat_box = document.getElementById("chat-box");
    var chat_msg = document.getElementById("chat-message");
    var chat_send = document.getElementById("chat-send");
    //--->Graphics
    var size = getWindowSize();
    var assets = new Assets();
    var canvas = document.getElementById("draw-space");
    var ctx = canvas.getContext("2d");
    var cursorX = 0, cursorY = 0;
    //--->Graphics--->Sprites
    var cursorSprite;
    var playerSprite;
    var bulletSprite;
    var flagSprite;
    var assetsLoaded = false;
    //--->Socket IO
    var socket;
    //--->Game data
    var platforms;
    var id;
    var name =  name_input.value;
    var me;   //me.body me.id
    var pingDate;
    var pingTime = 0;

    //Setting up chat
    var sendMessage = function() {
        if(socket) {
            var msg = chat_msg.value;
            socket.emit('chat_message', msg);
            chat_msg.value = '';
        }
    };
    chat_send.addEventListener('click', sendMessage);

    //Setting up canvas
    canvas.width = size.w*2/3;
    canvas.height = size.h*4/5;

    window.onresize = function(event) {
        size = getWindowSize();
        canvas.width = size.w*2/3;
        canvas.height = size.h*4/5;
    };


    canvas.addEventListener('mousemove', function(event) {
        if(assetsLoaded) {
            event.preventDefault();
            cursorX = event.clientX - cursorSprite.rect.width/2 - canvas.offsetLeft;
            cursorY = event.clientY - cursorSprite.rect.height/2 - canvas.offsetTop;

            var offsetX = canvas.width/2 - 16 - me.body.x;
            var offsetY = canvas.height/2 - 16 - me.body.y;
            var x = cursorX-offsetX+cursorSprite.rect.width/2;
            var y = cursorY-offsetY+cursorSprite.rect.height/2;

            var cursorXMeRelative = x - me.body.x - me.body.width/2;
            var cursorYMeRelative = y - me.body.y - me.body.height/2;
            socket.emit('input_mouse', {type:'move', x:cursorXMeRelative, y:cursorYMeRelative});
        }
        return false;
    });

    canvas.addEventListener('mousedown', function(event) {
        if(socket && cursorSprite) {
            socket.emit('input_mouse', {type:'down', x:cursorX, y:cursorY});
        }
    });

    canvas.addEventListener('mouseup', function(event) {
        if(socket && cursorSprite) {
            socket.emit('input_mouse', {type:'up', x:cursorX, y:cursorY});
        }
    });

    function getCursorCoordinates() {
        var offsetX = canvas.width/2 - 16 - me.body.x;
        var offsetY = canvas.height/2 - 16 - me.body.y;
        var x = cursorX-offsetX+cursorSprite.rect.width/2;
        var y = cursorY-offsetY+cursorSprite.rect.height/2;
        return {x:x, y:y};
    }

    //Loading assets
    assets.add("player","/images/test.jpg");
    assets.add("cursor","/images/cursor.jpg");
    assets.load(function(progress, max){
        //background
        ctx.fillStyle = "#333";
        ctx.fillRect(0,0,canvas.width,canvas.height);

        var px = 10;
        var py = canvas.height/2-5;
        var w = canvas.width-20;
        var h = 20;

        //progress
        ctx.fillStyle = 'rgb(60,180,60)';
        ctx.fillRect(px,py,(w)*progress/max,h);

        //loading border
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 5;
        ctx.strokeRect(px,py,w,h);
    }, function(){
        //Setting up sprites
        var playerImages = [];
        playerImages.push(assets.get('player'));
        playerSprite = new Sprite(playerImages,50,80);
        playerSprite.scaleType('deform');

        var cursorImages = [];
        cursorImages.push(assets.get('cursor'));
        cursorSprite = new Sprite(cursorImages, 10, 10);
        cursorSprite.scaleType('deform');

        var bulletImages = [];
        bulletImages.push(assets.get('cursor'));
        bulletSprite = new Sprite(cursorImages, 10, 10);
        bulletSprite.scaleType('deform');

        var flagImages = [];
        flagImages.push(assets.get('cursor'));
        flagSprite = new Sprite(flagImages, 32, 64);
        flagSprite.scaleType('deform');

        assetsLoaded = true;
    });


    //Setting up socket IO
    //socket = io.connect('http://90.48.213.48:1337');
    //socket = io.connect('http://127.0.0.1:1337');
    socket = io.connect();
    ping();
    socket.on('pong', function(data) {
        pingTime = Date.now() - pingDate;
    });

    socket.on('chat_message', function(data) {
        var divTag = document.createElement("div");
        divTag.innerHTML = data;
        chat_box.appendChild(divTag);
        chat_box.scrollTop = chat_box.scrollHeight;
    });

    socket.on('init_platforms', function(data) {
        platforms = data;
    });

    socket.on('init_id', function(data) {
        id = data;
        socket.emit('player_name', {id:id, name:name_input.value, team:team_input.value});
    });

    socket.on('pause', function(data) {
        ctx.font="30px Arial";
        ctx.fillText("Game paused",10,50);
    });

    socket.on('resume', function(data) {

    });

    socket.on('update', function(data) {
        if(assetsLoaded) {
            ctx.fillStyle = "rgb(50,90,155)";
            ctx.fillRect(0,0,canvas.width,canvas.height);

            //Find me
            data.players.forEach(function(element, index, array) {
                if(element.id == id) {
                    //This is me !
                    me = element;
                }
            });

            var offsetX = canvas.width/2 - 16 - me.body.x;
            var offsetY = canvas.height/2 - 16 - me.body.y;

            data.players.forEach(function(element, index, array) {
                //Draw sprite
                playerSprite.move(element.body.x+offsetX, element.body.y+offsetY);
                playerSprite.draw(ctx, data.elapsedTime);

                //Draw health
                ctx.fillStyle = "rgb(255,90,90)";
                ctx.fillRect(element.body.x +offsetX,element.body.y-5+offsetY,element.body.width*element.health/element.max_health,3);

                //Draw nickname
                ctx.font="12px Arial";
                if(element.team == 'blue') {
                    ctx.fillStyle = "rgb(60,60,255)";
                } else {
                    ctx.fillStyle = "rgb(255,60,60)";
                }
                ctx.fillText(element.name,element.body.x +offsetX,element.body.y-17+offsetY);
            });

            data.projectiles.forEach(function(element, index, array) {
                bulletSprite.move(element.body.x+offsetX, element.body.y+offsetY);
                bulletSprite.draw(ctx, data.elapsedTime);
            });

            data.flags.forEach(function(element, index, array) {
                flagSprite.move(element.body.x+offsetX, element.body.y+offsetY);
                flagSprite.draw(ctx, data.elapsedTime);
            });

            platforms.forEach(function(element, index, array) {
                ctx.fillStyle = "rgb(60,200,60)";
                ctx.fillRect(element.x+offsetX, element.y+offsetY, element.width, element.height);
            });

            cursorSprite.move(cursorX, cursorY);
            cursorSprite.draw(ctx, data.elapsedTime);

            //Draw ping
            ctx.font="12px Arial";
            ctx.fillStyle = "rgb(60,255,65)";
            ctx.fillText(pingTime, 10, 10);
        }
    });

    //Setting up keyboard events
    document.onkeydown = function(event) {
        var winObj = checkEventObj(event);
        var intKeyCode = winObj.keyCode;
        if(isKeyUp(intKeyCode)) {
            setKeyDown(intKeyCode);
            manageKeyboardInput('down', intKeyCode, socket);
        }
    };

    document.onkeyup = function(event) {
        var winObj = checkEventObj(event);
        var intKeyCode = winObj.keyCode;
        if(isKeyDown(intKeyCode)) {
            setKeyUp(intKeyCode);
            manageKeyboardInput('up', intKeyCode, socket);
        }
    };

    function ping() {
        if(socket) {
            console.log('PING');
            socket.emit('ping', '');
            pingDate = Date.now();
        }
        setTimeout(ping, 1000);
    }

    function manageKeyboardInput(type, intKeyCode, socket) {
        var keyStr = '';
        switch(intKeyCode) {
            case KEY_S:
            case KEY_DOWN:
                keyStr = 'down';
                break;
            case KEY_Z:
            case KEY_UP:
                keyStr = 'up';
                break;
            case KEY_Q:
            case KEY_LEFT:
                keyStr = 'left';
                break;
            case KEY_D:
            case KEY_RIGHT:
                keyStr = 'right';
                break;
            case KEY_ENTER:
                sendMessage();
                break;
        }
        socket.emit('input_keyboard', {type:type, action:keyStr});
    };

    function getWindowSize() {
        var myWidth = 0, myHeight = 0;
        if( typeof( window.innerWidth ) == 'number' ) {
            //Non-IE
            myWidth = window.innerWidth;
            myHeight = window.innerHeight;
        } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
            //IE 6+ in 'standards compliant mode'
            myWidth = document.documentElement.clientWidth;
            myHeight = document.documentElement.clientHeight;
        } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
            //IE 4 compatible
            myWidth = document.body.clientWidth;
            myHeight = document.body.clientHeight;
        }
        return {w:myWidth, h:myHeight};
    }

};