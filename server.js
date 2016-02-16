var mongo = require('mongodb').MongoClient;
var fs = require('fs');
var index = fs.readFileSync('index.html');
var client = require('socket.io').listen(8080).sockets;
var http = require('http');

    var server = http.createServer(function(request, response){
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write('hello world');
        response.end(index);
    });

    server.listen(8001);

console.log('listening...port 8080');
console.log('listening...port 8001');


mongo.connect('mongodb://127.0.0.1/chat', function(err, db){
  if(err) throw err;

  client.on('connection', function(socket){
    console.log('Someone has connected');
    var col = db.collection('messages');
    var sendStatus = function(s){
      socket.emit('status', s);
    }

    //Emit all messages
    col.find().limit(100).sort({_id: 1}).toArray(function(err, res){
      if(err) throw err;
      socket.emit('output', res);
    })

    //wait fot input
    socket.on('input', function(data){
      var name = data.name;
      var message = data.message;
      var whitespacePattern = /^\s*$/;

      if(whitespacePattern.test(name) || whitespacePattern.test(message)){
        sendStatus('Name and message is required.');
        console.log('invalid');
      } else {
        col.insert({name: name, message:message}, function(){
          console.log('Inserted');

          //emit latest message to all clients
          client.emit('output', [data]);
          sendStatus({
            message: "Message sent",
            clear: true
          });
        })
      }
    })
  });
});
