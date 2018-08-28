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
var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/math_race_db");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, " Name is required"],
    minlength: [3, " The name must be at least 3 characters"],
  },
  email: {
    unique: [true, " This email already exists"],
    type: String,
    required: [true, " Email is required"],
    minlength: [3, " Email must be at least 3 characters"],
  }
}, {timestamps: true});

const Users = mongoose.model("users", UserSchema);

// Email validator, unsure if this applies w/o Angular
// UserSchema.path('email').validate({
//   isAsync: true,
//   validator: function(value, done) {
//       mongoose.model('users', UserSchema).count({email: value}, function(errs,count){
//           if (errs) {
//               return done(errs);
//           }
//       done(!count);
//       });
//   },
//   message: 'That email already exists'
// });

io.on('connection', function (socket) {
  socket.emit('greeting', { msg: 'Greetings, from server Node, brought to you by Sockets! -Server' }); //3
  socket.on('thankyou', function (data) { //7
    console.log(data.msg);
  });
  socket.on('new_user', function(thisname){

    users[socket.id] = {name: thisname, dist: 0}
    io.emit('current_users', users);

  });
  socket.on('advance', function() {
    users[socket.id].dist += 50;
    if(users[socket.id].dist >= 820) {
      // io.emit('current_users');
      io.emit('win', users[socket.id]['name']);
      for (user in users) {
        users[user]['dist'] = 0;
      }
      io.emit('current_users');
    }
    io.emit('current_users', users);
    // socket.emit("this_user_dist", users[socket.id]['dist'])
  });
  socket.on('wrong', function() {
    if(users[socket.id].dist > 50) {
      users[socket.id].dist -= 50;
    }
    io.emit('current_users', users);
    socket.emit("this_user_dist", users[socket.id]['dist'])
  });
  socket.on('disconnect', function() {
    delete users[socket.id];
    io.emit('current_users', users);
  });
});

app.get('/', function(req, res) {
  res.render("index");
});
