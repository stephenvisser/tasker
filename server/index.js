'use strict';

var Trello = require('node-trello');

var t = new Trello('e0f4f2383350169cde5a6c64b96626c1','f7e34f76cb5f8e18a3929c4817a2852e3fea54c84557820a9fea3ce92e8ac4f2');

t.get("/1/members/me/boards", function(err, data) {
  if (err) throw err;
  console.log(data.map(function(board){return board.name; }));
});