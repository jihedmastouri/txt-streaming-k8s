import 'dotenv/config';
import express from 'express';
import { createClient } from 'redis';
import axios from 'axios';
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

  client.LPUSH(`req-sol-1`, JSON.stringify({ id: channelId, data: b.data }));

  eventEmitter.once(channelId, (ip: string) => {
    axios
      .get(`${ip}/stream/${channelId}`, { responseType: 'stream' })
      .then(({ data }: { data: string }) => {
        if (data === '<end>') {
          res.end();
          return;
        }
        res.write(data);
      })
      .catch((err: any) => {
        console.error(err);
      });
  });
});

async function main() {
  await client.connect();

  client.ping().then(() => {
    console.log('Connected to Redis');
  });

  client.subscribe(`res-sol-1`, (val) => {
    console.log('Received message:', val);
    let v;
    try {
      v = JSON.parse(val);
    } catch (e) {
      console.error('Error parsing message:', e);
      return;
    }
    const { id, podIp } = v;
    eventEmitter.emit(id, podIp);
  });

  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
}

main();
