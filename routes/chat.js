var express = require('express');
var router = express.Router();
var mongodb = require('mongodb');

/*채팅 메시지 클라이언트가 서버에게 채팅메시지 전송 */
router.post('/add', function(req, res, next)
{
  var message = req.body.message;

  var db = req.app.get("database");
  
  if(db == undefined)
  {
    res.json({message : '503 Server Error'});
    return;
  }

  //1.유저 이름 찾기
  var usersCollection = db.collection('users');

  usersCollection.findOne({_id : mongodb.ObjectID(req.session.user_id)}, {projection : {_id : false, name : true}}, function(err, usersResult)
  {
    if(err) throw(err);

    //2.메시지의 Seq 찾기
    var counterCollection = db.collection("counter");
    counterCollection.findOneAndUpdate({_id: "chatcounter"}, {$inc : {seq: 1}},{returnOriginal:false}, function(err, result)
    {
      if(err) throw (err);

      console.log(result);

      var chatCollection = db.collection("chat");

      //3. chat collection에 메시지 추가하기
      //날짜 불러오기 date : Date()
      chatCollection.insertOne({_id : result.value.seq, message : message, name : usersResult.name, date : Date() }, function(err, result) 
      {
        if(err) throw err;
        res.status(200).send();
      });
    });
  });
});

/*서버에서 클라이언트로 메시지 전송*/
// /:seq -> seq이후에 나오는 값만 나오게 하도록 함
router.get('/', function(req, res, next)
{
  var db = req.app.get("database");
  
  if(db == undefined)
  {
    res.json({message : '503 Server Error'});
    return;
  }

  //db가 잘 동작하고 있다면....
  var chatCollection = db.collection("chat");

  //limit : 처음기준으로 지정한 숫자만큼 출력, skip : 지정한 수만큼  스킵 출력
  chatCollection.find().sort({_id : -1}).limit(5).toArray(function(err, result)
  {
    if(err) throw err;
    var resultStr = JSON.stringify({objects : result});
    res.status(200).json({message : resultStr});
  });
});

/*서버에서 클라이언트로 메시지 전송*/
// /:seq -> seq이후에 나오는 값만 나오게 하도록 함
router.get('/:seq', function(req, res, next)
{
  var db = req.app.get("database");
  
  if(db == undefined)
  {
    res.json({message : '503 Server Error'});
    return;
  }

  //db가 잘 동작하고 있다면....
  var chatCollection = db.collection("chat");

  //Number : 숫자로 변환
  var seq = Number(req.params.seq);
  //limit : 처음기준으로 지정한 숫자만큼 출력, skip : 지정한 수만큼  스킵 출력
  chatCollection.find({_id:{'$gt':seq}}).limit(5).toArray(function(err, result)
  {
    if(err) throw err;
    var resultStr = JSON.stringify({objects : result});
    res.status(200).json({message : resultStr});
  });
});
module.exports = router;