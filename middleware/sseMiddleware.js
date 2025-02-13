const sseClients = new Map();

const sseMiddleware = (req, res, next) => {
  if (req.url.includes('/events')) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const clientId = Date.now();
    const client = {
      id: clientId,
      res,
      heartbeat: setInterval(() => {
        res.write(': heartbeat\n\n');
      }, 30000)
    };

    sseClients.set(clientId, client);
    console.log(`Client ${clientId} connected. Total clients: ${sseClients.size}`);

    // Send initial connection confirmation
    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({ clientId })}\n\n`);

    req.on('close', () => {
      clearInterval(client.heartbeat);
      sseClients.delete(clientId);
      console.log(`Client ${clientId} disconnected. Remaining clients: ${sseClients.size}`);
    });
  } else {
    next();
  }
};

const notifyAllClients = (eventType = 'update', data = 'fetch') => {
  console.log(`Notifying ${sseClients.size} clients`);
  
  for (const [clientId, client] of sseClients) {
    try {
      client.res.write(`event: ${eventType}\n`);
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error(`Error notifying client ${clientId}:`, error);
      clearInterval(client.heartbeat);
      sseClients.delete(clientId);
    }
  }
};

module.exports = { sseMiddleware, notifyAllClients };
