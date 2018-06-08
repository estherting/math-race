const express = require('express');
var path = require("path");
var bodyParser = require('body-parser');
const app = express();
app.use(express.static(__dirname + "/static"));
app.use(bodyParser.urlencoded({ extended: true }));
const server = app.listen(1337);
const io = require('socket.io')(server);
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');
var count = 0;
var users = {};

io.on('connection', function (socket) {
  socket.emit('greeting', { msg: 'Greetings, from server Node, brought to you by Sockets! -Server' }); //3
  socket.on('thankyou', function (data) { //7
    console.log(data.msg);
  });
  socket.on('new_user', function(thisname){

    users[socket.id] = {name: thisname, dist: 0}
    io.emit('current_users', users);

  })
  socket.on('advance', function() {
    users[socket.id].dist += 10
    if(users[socket.id].dist >= 500) {
      io.emit('win', users[socket.id]['name']);
      for (user in users) {
        users[user]['dist'] = 0;
      }
      io.emit('current_users');
    }
    io.emit('current_users', users);
  })
  socket.on('wrong', function() {
    if(users[socket.id].dist > 10) {
      users[socket.id].dist -= 10;
    }
    io.emit('current_users', users);
  })
  socket.on('disconnect', function() {
    delete users[socket.id];
    io.emit('current_users', users);
  })
});

app.get('/', function(req, res) {
  res.render("index");
});
