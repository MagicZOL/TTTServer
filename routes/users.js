var express = require('express');
var router = express.Router();
var mongodb = require('mongodb');

/* GET users listing. */
router.get('/', function(req, res, next) {
  //res.send('respond with a resource');
});

/*회원가입*/
router.post('/signup', function(req , res, next)
{
  var username = req.body.username;
  var password = req.body.password;
  var name = req.body.name;

  var db = req.app.get("database");
  
  if(db == undefined)
  {
    res.json({message : '503 Server Error'});
    return;
  }

  var validate = userValidation(username, password);
  if(validate == false)
  {
    res.json({message : '400 Bad Request'});
  }
  //db가 잘 동작하고 있다면....
  var usersCollection = db.collection("users");

  //username이 기존에 존재하는지 확인부터..
  //존재하면 insert 금지
  //존재하지 않으면 insert 실행

  usersCollection.count({'username' : username}, function(err, result) {
    if(err) throw(err);
    
    if(result > 0)
    {
      res.json({message : '400 Bad Request'});
      return;
    }
    else //count가 실행되고 insertOne이 실행된 후 insertOne function결과가 나온다 (비동기함수, 비동기함수, 비동기함수.....)
    {
      usersCollection.insertOne(
        {'username' : username, 'password' : password, 'name' : name}, function(err, result) 
          {
              if (err) throw(err);
              if(result.ops.length>0)
              res.json(result.ops[0]);
              else
              res.json({message : "503 server error"});
          });
    }
  }); //해당 값이 몇개 존재하는지 알려주는 코드
  //count가 실행되고 insertOne이 실행되는 구조라서 count의 function이 동작할지 inserOne의 function이 실행될지 모른다 (비동기함수)
  //만약 count를 기다리는 구조라면 count가 끝날때까지 다음줄로 넘어가지 못하므로 일단 실행해주고 다음함수로 넘어갈수 있게 해준다.
  //따라서 count가 먼저 실행되서 결과값이 중복이 아니다 라는걸 받고 insert를 실행해야한다.(동기함수)
  //그래서 else문에 insert함수를 넣어줘야한다.
});

var userValidation = function(username, password) {
  //회원가입정보 확인
  if(username =="" || password=="")
  {
    return false;
  }
  if(username.length <4 || username.length >12)
  {
    return false;
  }
  if(password < 4 || password > 12)
  {
    return false;
  }
  return true;
}

/*로그인"*/ 
router.post('/signin', function(req , res, next)
{
  
});

//---------------------------------
// /*회원가입*/
// router.post('/signup', function(req , res, next)
// {
//   var newMember = req.body;
//   var userid = newMember.userid;
//   var pw = newMember.pw
//   var nickname = newMember.nickname;
//   var email = newMember.email

//   var database = req.app.get("database");
//   var users = database.collection("users");

//   users.insertOne({"userid" : userid, "pw" : pw, "nickname" : nickname, "email" : email}, function(err, result)
//   {
//     if(err) throw err;

//     res.status(200).send({"result" : "success"});
//   });
// });

// /*로그인"*/ 
// router.post('/signin', function(req , res, next)
// {
//   var loginMember = req.body;
//   var userid = loginMember.userid;
//   var pw = loginMember.pw;

//   var database = req.app.get("database");
//   var users = database.collection("users");

//   users.findOne( {$and: [ {"userid" : userid}, {"pw" : pw}]}, function(err, user) {
//     if (err) res.status(500).json({error:err});
//    res.json(user)
//   });
// });

module.exports = router;