var net          = require('net');
var fs           = require('fs');
var path         = require('path');
var protobuf     = require('protocol-buffers');
var MCEmailProto = protobuf(fs.readFileSync(path.resolve(__dirname) + '/../MCEmail.proto'));

var log  = require('printit')({
  date: false,
  prefix: 'utils:socketServerHandler'
});

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function(socket){
  console.log('a user connected');
});

http.listen(9005, function(){
  console.log('listening on *:9005');
});

module.exports.initialize = function(){
  socketServer = net.createServer(function(connection){
    connection.on('end', function(){
      console.log('client close socket.');
    });

    connection.on('data', function(data){
      try
      {
        console.log(data, ' // socket receive the data');
        var MCEmail = MCEmailProto.MCEmail.decode(data);

        // add the push other server code...
        console.log(MCEmail, ' // buffer to Object')
        connection.write('ok\r\n');
        connection.pipe(connection);
        //connection.end();
      }
      catch(err)
      {
        connection.write('invalid data\r\n');
        connection.pipe(connection);
        connection.end();
      }
    });

    connection.write('connected\r\n');
    connection.pipe(connection);
  });

  socketServer.listen(9004, function() { //'listening' listener
    console.log('msg connector socket server is listen on 9004 port! :D');
  });

};
