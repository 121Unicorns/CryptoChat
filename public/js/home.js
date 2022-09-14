/*
1. Send client public key/receive server public key
2. Encrypt typed message and send to server
3. Receive message from client and decrypt, triggering server response
4. Encrypt response and send to client
5. Receive server response and decrypt
6. Add to chat
*/

import NodeRSA from "node-rsa";

var clientciphermsg, serverciphermsg;
var serverpuk;

const rsa = rsaKeys();
const clientprk = rsa.privateKey;
const clientpuk = rsa.publicKey;
const msgerChat = document.getElementById("msg-chat");
const SERVER_IMG = "assets/darth-vader.svg";
const CLIENT_IMG = "assets/iron-man.svg";
const SERVER_NAME = "Darth Vader";
const CLIENT_NAME = "Iron Man";

//------------------------------------------Exchange Public Keys with server------------------------------------------
exchangeKeys();

//------------------------------------------Generate RSA Keys for client----------------------------------------------
function rsaKeys() {
  const keys = new NodeRSA({b: 1024});
  const publicKey = keys.exportKey('public');
  const privateKey = keys.exportKey('private');
  console.log("Client Public Key: " + publicKey);
  console.log("Client Private Key: " + privateKey);
  return{
      publicKey: publicKey,
      privateKey: privateKey
  }
}

//------------------------------------------RSA Encryption function---------------------------------------------------
function rsaEncrypt(text, key) {
    console.log("I encrypt");
    let keyPublic = new NodeRSA(key);
    const encrypted = keyPublic.encrypt(text, "base64");
    return encrypted;
}

//------------------------------------------RSA Decryption function---------------------------------------------------
function rsaDecrypt(text, key) {
  console.log("I decrypt");
  let keyPrivate = new NodeRSA(key);
  let decrypt = keyPrivate.decrypt(text, 'utf8');
  return decrypt;
}

//------------------------------------------Exchange Public Keys with server-------------------------------------------
function exchangeKeys() {

  //------------------------------------Get Server Public Key------------------------------------------
  socket.once('pukey', function (message) {
    serverpuk = message;
    console.log("Server Public Key: " + message);
  });

  //------------------------------------Send client Public Key------------------------------------------
  socket.emit("client puk", clientpuk);
}


//------------------------------------------Encrypt and send messages from user (IronMan)-----------------------------
document.querySelector('#message_form').addEventListener('submit', (e) => {
  var msgText = document.getElementById('usermsg').value;

  if (msgText) {
    document.getElementById("message_form").reset();
    clientciphermsg = rsaEncrypt(msgText, serverpuk);
    sendMessage(clientciphermsg);
  }

  var temp = "User Typed Message: " + msgText + "\n\n\t\tEncrypted Message Sent to Darth: " + clientciphermsg;
  temp = temp.replace('\n', '<br/>');
  temp = temp.replace('\t', '<br/>');
  appendMessage(CLIENT_NAME, CLIENT_IMG, "right", temp);

  e.preventDefault();
});

//------------------------------------------Add time to chat messages------------------------------------------------
function formatDate(date) {
  const h = "0" + date.getHours();
  const m = "0" + date.getMinutes();

  return `${h.slice(-2)}:${m.slice(-2)}`;
}

//------------------------------------------Send messages to server, triggering response-----------------------------
function sendMessage(themessage) {
  socket.emit("client message", themessage);

  socket.once('server message', function (message) {
    const serverciphermsg = message;
    const msgText = rsaDecrypt(serverciphermsg, clientprk);
    var temp = "Message Received From Darth: " + message + "\n\n\t\tDecrypted Message: " + msgText;
    temp = temp.replace('\n', '<br/>');
    temp = temp.replace('\t', '<br/>');
    appendMessage(SERVER_NAME, SERVER_IMG, "left", temp);
  });
}

//------------------------------------------Add message to chat display---------------------------------------------
function appendMessage(name, img, side, text) {
  const msgHTML = `
    <div class="msg ${side}-msg">
      <div class="msg-img" style="background-image: url(${img})"></div>

      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name}</div>
          <div class="msg-info-time">${formatDate(new Date())}</div>
        </div>

        <div class="msg-text" style="word-wrap: break-word;">${text}</div>
      </div>
    </div>
  `;

  msgerChat.insertAdjacentHTML("beforeend", msgHTML);
  msgerChat.scrollTop += 500;
}