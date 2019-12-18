var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('index', { title: '홍길동' });
  });
  
  module.exports = router;
  