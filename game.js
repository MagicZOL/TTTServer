
const uuidv4 = require('uuid/v4');

//다른 파일에서 읽어갈수 있게 하기 위해 module.exports 사용
//var require 로 접근할수 있게 만드는것
module.exports = function(server) 
{
    var rooms = [];
    
    var io = require('socket.io')(server, 
        {
            transports : ['websocket'],
        });

        //socket에는 연결한 클라이언트의 정보를 가지고 있다.
        io.on('connection', function(socket)
        {
            console.log('Connect');

            //1.유저가 접속하면 빈 방이 있는지 확인한다.
            //2.빈방이 없으면 새로운 방을 하나 만들어서 접속한 유저를 할당한다.
            //3.빈방이 있으면 해당 방으로 유저를 할당한다.
            //4.한방에 두 유저가 존재하면 해당 방의 유저들은 게임을 시작한다.
            //5.누군가 접속을 해제하면 그 유저의 방은 게임을 종료한다.

            //방 만들기
            var createRoom = function()
            {
                //방 이름 생성
                var roomId = uuidv4();
                socket.join(roomId, function() 
                {
                    var room = { roomId: roomId, clients: [{ clientId : socket.id, ready : false }]};
                    rooms.push(room);

                    socket.emit("join", {roomId : roomId, clientId : socket.id});
                });
            }

            //유효한 방 찾기
            var getAvailableRoomId = function() 
            {
                if (rooms.length > 0)
                {
                    for (var i=0; i<rooms.length; i++)
                    {
                        //한명이 들어가있는 방
                        if(rooms[i].clients.length < 2)
                        {
                            return i;
                        }
                    }
                }
                //방이 하나도 없는 경우 -1, 방이 처음 한개 있다면 0번째 방이 되서
                return -1;
            }

            //1.빈방 찾기
            var roomIndex = getAvailableRoomId();
            if(roomIndex > -1)
            {
                //3.접속한 유저를 그 방에 보낸다.
                socket.join(rooms[roomIndex].roomId, function()
                {
                    var client = { clientId : socket.id, ready : false }
                    rooms[roomIndex].clients.push(client);

                    socket.emit("join", {roomId : rooms[roomIndex].roomId, clientId : socket.id});
                });
            }
            else
            {
                //2.새로운방을 만들어서 접속한 유저 할당
                createRoom();

            }


            //클라이언트가 Ready되면 호출되는 이벤트
            socket.on('ready', function(data) 
            {
                if(!data) return;
                
                //find함수 안에는 함수를 넣을 수 있는데 rooms가 가지고 있는 요소중 하나를 찾기 위한 함수
                var room = rooms.find(room => room.roomId === data.roomId);

                if(room)
                {
                    var clients = room.clients;
                    var client = clients.find(client =>client.clientId === data.clientId)
                    if(client) client.ready=true;

                    //방안에 모두가 true이면 게임시작
                    if(clients.length == 2)
                    {
                        if(clients[0].ready == true && clients[1].ready == true)
                        {
                            //io.in(room.roomId).emit('play', {first : clients[0].clientId});
                            io.to(clients[0].clientId).emit('play', {first : true});
                            io.to(clients[1].clientId).emit('play', {first : false});
                        }
                    }
                }
                
                // var room = rooms.find((room) => 
                // {
                //     if(room.roomId === data.roomId)
                //     {
                //         return true;
                //     }
                //     return false;
                // });

                // for(var i =0; i<rooms.length; i++)
                // {
                //     if(rooms[i].roomId == data.roomId)
                //     {
                //         var clients = rooms[i].clients;
                //         for(var j=0; j<clients.length; j++)
                //         {
                //             var client = clients[j];
                //             if(client.clientId == data.clientId)
                //             {
                //                 client.ready = true;
                //             }
                //         }
                //     }
                // }
            });

            //셀을 선택했을 때
            socket.on('select', function(data)
            {
                if(!data) return;
                var index = data.index;
                var roomId = data.roomId;

                if(index > -1 && roomId)
                {
                    socket.to(roomId).emit('selected', {index : index});
                }
            });

            //클라이언트가 승리했을 때
            socket.on('win', function(data)
            {
                if(!data) return;
                var index = data.index;
                var roomId = data.roomId;

                if(index > -1 && roomId)
                {
                    socket.to(roomId).emit('lose', {index : index});
                }
            });
            
            //클라이언트가 무승부
            socket.on('tie', function(data)
            {
                if(!data) return;
                var index = data.index;
                var roomId = data.roomId;

                if(index > -1 && roomId)
                {
                    socket.to(roomId).emit('tie', {index : index});
                }
            });
            //테스트
            //메시지를 보낼때 emit라는 함수를 사용한다 socket.emit("이벤트이름", "객체(키, 값")
            //socket.emit('test', {message : '안녕하세여'});

            //이벤트를 정의하는 함수
            //socket.on("hello", function(data)
            // {
            //     console.log(data.msg);
            // });

            //게임에서 나갔을 때
            socket.on('disconnect', function(reason)
            {
                console.log("disconnect");

                for ( var i =0; i<rooms.length; i++)
                {
                    var client = rooms[i].clients.find(client => client.clientId == socket.id);

                    if (client) 
                    {
                        var clientIndex = rooms[i].clients.indexOf(client);
                        rooms[i].clients.splice(clientIndex, 1);
    
                        if (rooms[i].clients.length == 0) 
                        {
                            var roomIndex = rooms.indexOf(rooms[i]);
                            rooms.splice(roomIndex, 1);
                        }
                    }
                }
            });
        });
}