//browserify ./public/js/home.js -t babelify --outfile ./public/js/bundle.js

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server);
const path = require('path');
const router = express.Router();
const NodeRSA = require('node-rsa');
const port = process.env.PORT || 4000;
const fs = require('fs');
const fileName = 'messages.json';

// Load data from file
let rawData = fs.readFileSync(fileName);
let data = JSON.parse(rawData);
let size = data.length;
var servermsg, clientmsg;

io.on('connection', (socket) => {
  const rsa = rsaKeys();
  const serverprk = rsa.privateKey;
  const serverpuk = rsa.publicKey;
  var clientpukey;
  console.log('A User Connected');

  console.log("Server Public Key: " + serverpuk);
  console.log("Server Private Key: " + serverprk);

  //Send server public key to client
  socket.emit("pukey", serverpuk);

  //Get client public key
  socket.on('client puk', (clientpuk) => {
    clientpukey = clientpuk;
    console.log("Client Public Key: " + clientpukey);
  });

  //Decrypt client message and send encrypted response
  socket.on('client message', (message) => {
    clientmsg = resDecrypt(message, serverprk);
    console.log("Message Received From Iron Man: " + message);
    console.log("Decrypted Message: " + clientmsg);
    var index = Math.floor(Math.random() * size);
    temp = data[index];
    servermsg = resEncrypt(temp, clientpukey);
    socket.emit("server message", servermsg);
  });

  //when user disconnects
  socket.on('disconnect', () => {
    console.log('User Disconnected');
  });
});

let serverprk = "";

//------------------------------------------RSA Decryption function---------------------------------------------------
resDecrypt = (text, key) => {
  let keyPrivate = new NodeRSA(key);
  let decrypt = keyPrivate.decrypt(text, 'utf8');
  return decrypt;
}

//------------------------------------------RSA Encryption function---------------------------------------------------
resEncrypt = (text, key) => {
    let keyPublic = new NodeRSA(key);
    const encrypted = keyPublic.encrypt(text, 'base64');
    return encrypted;
}

//------------------------------------------Generate RSA Keys for client----------------------------------------------
rsaKeys = () =>{
  const keys = new NodeRSA({b: 1024});
  const publicKey = keys.exportKey('public');
  const privateKey = keys.exportKey('private');
  return{
      publicKey: publicKey,
      privateKey: privateKey
  }
}

app.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/public/index.html'));
});

app.use(express.static('public'));


server.listen(port, () =>{
    console.log(`The rebel alliance is hiding at port ${port}`);
});
