var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var mongodb = require('mongodb');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/*유저정보*/
router.get('/info', function(req, res, next)
{
  var db = req.app.get('database');

  if(db==undefined)
  {
      res.status(503).json({message: '503 Server Error'});
      return;
  }

  var userId = req.session.user_id;

  if(userId)
  {
    var usersCollection = db.collection('users');
    usersCollection.findOne({_id: mongodb.ObjectID(userId)},{projection : {_id : false, name : true, score : true}}, function(err, result)
    {
      if(err) throw(err);
      if(result)
      {
        var resultStr = JSON.stringify(result);
        res.status(200).json({message : resultStr});
      }
      else
      {
        res.status(401).json({message : 'Unauthotized'});
      }
    });
  }
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
    res.status(503).json({message : '503 Server Error'});
    return;
  }

  var validate = userValidation(username, password);
  if(validate == false)
  {
    res.status(400).json({message : '400 Bad Request'});
    return;
  }

  //db가 잘 동작하고 있다면....
  var usersCollection = db.collection("users");

  //username이 기존에 존재하는지 확인부터..
  //존재하면 insert 금지
  //존재하지 않으면 insert 실행

  usersCollection.count({username : username}, function(err, result) {
    if(err) throw(err);
    
    if(result > 0)
    {
      res.status(400).json({message : '400 Bad Request'});
      return;
    }
    else //count가 실행되고 insertOne이 실행된 후 insertOne function결과가 나온다 (비동기함수, 비동기함수, 비동기함수.....)
    {
      //Hash로 암호화
      //var cryptoPassword = crypto.createHash('sha512').update(password).digest("base64"); //암호화알고리즘, update(바꿀값), digest(인코딩)

      crypto.randomBytes(64, function(err, buf)
      {
        const saltStr = buf.toString('base64');

         //솔트, 반복횟수, 사이즈 , 알고리즘
        crypto.pbkdf2(password, saltStr, 123418, 64, 'sha512', function(err, key)
        {
          const cryptoPassword = key.toString('base64');

          usersCollection.insertOne({'username' : username, 'password' : cryptoPassword, 'name' : name, 'salt' : saltStr, 'score' : 0}, function(err, result) 
          {
              if (err) throw(err);
              if(result.ops.length>0)
              {
                req.session.user_id = result.insertedId.toString();

                var resultObj = {name:name, score:0};
                var resultStr = JSON.stringify(resultObj);

                res.status(200).json({message: resultStr});
              }
              else
              res.status(503).json({message : "503 server error"});
          });
    
        });
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
  var username = req.body.username;
  var password = req.body.password;

  var db = req.app.get("database");

  if(db == undefined)
  {
    res.json({message : '503 Server Error'});
    return;
  }

  var usersCollection = db.collection('users');

  usersCollection.findOne({username : username}, function(err, result)
  {
    if(err) throw(err);

    if (result) 
    {
      var saltStr = result.salt;
      crypto.pbkdf2(password, saltStr, 123418, 64, 'sha512', function(err, key)
      {
        var cryptoPassword = key.toString('base64');

        usersCollection.findOne({username: username, password:cryptoPassword}, {projection : {name : true, score : true}}, function(err, result)
        {
          if(err) throw(err);

          if (result)
          {
            req.session.regenerate(function(err)
            {
              //세션
              req.session.user_id = result._id.toString();
              var resultObj = {'name':result.name, 'score':result.score};
              var resultStr = JSON.stringify(resultObj);
              res.status(200).json({message : resultStr});
            });

            //쿠키
            //res.cookie('user_id', result._id.toString());
          }
          else
          {
            res.status(204).json({message: '204 No Content'});
          }
        });
      });
    }
    else
    {
      res.status(204).json({message: '204 No Content'});
    }
  });
});

//점수 추가
router.post('/addscore', function(req, res, next)
{
  var score = req.body.score;

  var db = req.app.get('database');

  if (db == undefined)
  {
    res.status(503).json({message : '503 Server Error'});
    return;
  }

  //var userId = req.cookies.user_id; //로그인한 유저 쿠키 가져오기
  var userId = req.session.user_id;

  if(userId)
  {
    var usersCollection = db.collection('users');

  //찾을 대상, $set 무슨 값을 어떻게 바꿀지
  //$inc 기존 값에 얼마나 감소 혹은 증가  될지
    usersCollection.findOneAndUpdate({_id:mongodb.ObjectID(userId)}, {$inc : {score: score}},{returnOriginal:false}, function(err, result)
    {
      if(err) throw(err);

      var resultObj = {name : result.value.name, score : result.value.score};
      var resultStr = JSON.stringify(resultObj);

      if(result)
      {
        res.status(200).json({message : resultStr});
      }
      else
      {
        res.status(204).json({message : '204 No Content'});
      }
    });
  }
  else
  {
    //res.json({message : '401 Unauthorized'});
    res.status(401).send('Unauthotized');
  }
});

/*로그아웃*/
router.get('/logout', function(req, res, next)
{
  //세션이 해제되면 
  req.session.destroy(function(err)
  {
    res.clearCookie('connect.sid');
    res.status(200).json({message : '200 OK'});
  });
  //res.clearCookie('user_id');
  res.status(200).json({message : '200 OK'});
});

module.exports = router;