import 'dotenv/config';
import express from 'express';
import { createClient } from 'redis';
import { makeid } from './utils';
import { EventEmitter } from 'node:events';

const clientSub = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

const clientPush = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

const app = express();
app.use(express.json());

const eventEmitter = new EventEmitter();

app.post('/', async (req: any, res: any) => {
    const b = await req.body;

    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('transfer-encoding', 'chunked');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    console.log('pusing to new-req', JSON.stringify(b.data));

    const channelId = makeid();
    clientPush.LPUSH(
        'req-sol-2',
        JSON.stringify({ id: channelId, data: b.data })
    );

    eventEmitter.on(`res-id:${channelId}`, (data: string) => {
        if (data === '<end>') {
            res.end();
            return;
        }
        res.write(data);
    });
});

async function main() {
    await clientSub.connect();
    await clientPush.connect();

    clientSub.ping().then(() => {
        console.log('Connected to Redis for sub');
    });

    clientPush.ping().then(() => {
        console.log('Connected to Redis for push');
    });

    clientSub.subscribe('res-sol-2', (val) => {
        console.log('Received message:', val);
        let v;
        try {
            v = JSON.parse(val);
        } catch (e) {
            console.error('Error parsing message:', e);
            return;
        }
        const { id, data } = v;
        eventEmitter.emit(`res-id:${id}`, data);
    });

    app.listen(3001, () => {
        console.log('Server is running on port 3001');
    });
}

main();
