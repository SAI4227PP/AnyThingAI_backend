const express = require('express');
const router = express.Router();

let clients = new Map();

const sendEventToClient = (client, data) => {
  client.write(`data: ${JSON.stringify(data)}\n\n`);
};

router.get('/connect/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    sessionId,
    response: res
  };

  clients.set(clientId, newClient);

  req.on('close', () => {
    clients.delete(clientId);
  });
});

// Export both router and event sender
module.exports = {
  router,
  broadcastToSession: (sessionId, data) => {
    for (const [_, client] of clients) {
      if (client.sessionId === sessionId) {
        sendEventToClient(client.response, data);
      }
    }
  }
};
