
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8099 });
console.log('Servidor escuchando en puerto 8099');

const clients = {};

wss.on('connection', function connection(ws) {
  let user = null;

  ws.on('message', function incoming(message) {
    const data = JSON.parse(message);

    if (data.type === 'auth') {
      user = data.username;
      clients[user] = ws;
      ws.pubkey = data.pubkey;

      for (let username in clients) {
        if (username !== user) {
          clients[username].send(JSON.stringify({
            type: 'pubkey',
            from: user,
            key: data.pubkey
          }));
          ws.send(JSON.stringify({
            type: 'pubkey',
            from: username,
            key: clients[username].pubkey
          }));
        }
      }
      return;
    }

    if (data.type === 'message') {
      const to = data.to;
      const content = data.content;

      if (clients[to]) {
        clients[to].send(JSON.stringify({
          type: 'message',
          from: user,
          content
        }));
      }
    }
  });

  ws.on('close', function () {
    if (user) {
      delete clients[user];
    }
  });
});
