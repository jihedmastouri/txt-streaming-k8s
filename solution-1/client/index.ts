import 'dotenv/config';
import express from 'express';
import { createClient } from 'redis';
import axios from 'axios';
import { makeid } from './utils';
import { EventEmitter } from 'node:events';

const clientRedisListen = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

const clientRedisPub = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

const app = express();
app.use(express.json());

const eventEmitter = new EventEmitter();

app.post('/', async (req: any, res: any) => {
    const b = await req.body;
    console.log(b);

    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('transfer-encoding', 'chunked');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const channelId = makeid();

    clientRedisPub.LPUSH(
        `req-sol-1`,
        JSON.stringify({ id: channelId, data: b.data })
    );

    res.write(`data: ${channelId}\n\n`);

    eventEmitter.once(channelId, async (addr: string) => {
        res.write(`data: ${addr}\n\n`);

        const response = await axios.get(`${addr}/stream/${channelId}`, {
            responseType: 'stream',
        });

        const stream = response.data;
        stream.on('data', (data: any) => {
            const text = new TextDecoder().decode(data);
            console.log(text);
            if (text === '<end>') {
                res.end();
                return;
            }
            res.write(text);
        });

        stream.on('end', () => {
            console.log('stream done');
        });

        stream.on('error', (err: any) => {
            console.error('stream error:', err);
        });

    });
});

async function main() {
    await clientRedisListen.connect();
    await clientRedisPub.connect();

    clientRedisListen.ping().then(() => {
        console.log('Connected to Redis for listening');
    });
    clientRedisPub.ping().then(() => {
        console.log('Connected to Redis for publishing');
    });

    clientRedisListen.subscribe(`res-sol-1`, (val) => {
        console.log('Received message:', val);
        let v;
        try {
            v = JSON.parse(val);
        } catch (e) {
            console.error('Error parsing message:', e);
            return;
        }
        const { id, podAddr } = v;
        eventEmitter.emit(id, podAddr);
    });

    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
}

main();
