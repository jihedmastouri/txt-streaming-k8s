import 'dotenv/config';
import express from 'express';
import { createClient } from 'redis';
import { makeid } from 'utils';
import { EventEmitter } from 'node:events';

const client = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

const app = express();
app.use(express.json());

const eventEmitter = new EventEmitter();

app.post('/', async (req: any, res: any) => {
  const b = await req.body;

  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const channelId = makeid();
  client.LPUSH(`new-req`, JSON.stringify(b.data));

  eventEmitter.on(channelId, (data: string) => {
    if (data === '<end>') {
      res.end();
      return;
    }
    res.write(data);
  });
});

async function main() {
  await client.connect();

  client.ping().then(() => {
    console.log('Connected to Redis');
  });

  client.subscribe(`res`, (val) => {
    console.log('Received message:', val);
    let v;
    try {
      v = JSON.parse(val);
    } catch (e) {
      console.error('Error parsing message:', e);
      return;
    }
    const { id, data } = v;
    eventEmitter.emit(id, data);
  });

  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
}

main();
