import 'dotenv/config';
import express from 'express';
import { createClient } from 'redis';
import { EventSource } from './eventSource';
import axios from 'axios';

const client = createClient({
  url: 'redis://localhost:6379',
});

const app = express();
app.use(express.json());

const eventSource = new EventSource();

// Quick and dirty way to generate a random string
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const makeid = () =>
  Array.from({ length: 6 }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join('');

app.post('/', async (req: any, res: any) => {
  const b = await req.body;

  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const channelId = makeid();
  client.publish(`new-req:${channelId}`, JSON.stringify(b));
  eventSource.newStream(channelId, res);

  eventSource.listen(channelId, (data: any) => {
    if (data === '<end>') {
      eventSource.close(channelId);
      res.end();
      return;
    }

    res.write(data);
  });
});

app.post('/callback/:id', async (req: any, res: any) => {
  const { id } = req.params;

  const b = await req.body;
  const podIp = b.podIp;

  axios
    .get(`${podIp}/stream/${id}`, { responseType: 'stream' })
    .then((response) => {
      eventSource.send(id, response.data);
    })
    .catch((err) => {
      console.error(err);
    });
});

async function main() {
  await client.connect();

  client.ping().then(() => {
    console.log('Connected to Redis');
  });

  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
}

main();
