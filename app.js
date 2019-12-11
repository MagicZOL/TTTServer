var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var fileStore = require('session-file-store')(session);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

//세션초기설정
app.use(session)
{
  app.use(session(
    {
      secret : 'keyboard cat', //암호화에 사용하는 문자열
      resave : false,         //항상 저장할지 여부
      saveUninitialized : true, //초기화되지 않은 정보에 대해 저장 
      sotre : new fileStore() 
    }));
  
}

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://ZOLadmin:admin1234@cluster0-f0ard.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
  const dbName = 'Tictactoc';
  const db = client.db(dbName);
  app.set("database", db);
  // perform actions on the collection object
  client.close();
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
