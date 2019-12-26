
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
                });
            }
            else
            {
                //2.새로운방을 만들어서 접속한 유저 할당
                createRoom();

            }

            socket.on('disconnect', function(reason)
            {
                console.log("disconnect");
            });
        });
}