import { Job, QueueOptions, Queue, Worker } from 'bullmq';
import 'dotenv/config'
import express from 'express';

const opts: QueueOptions = {
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
};

const queue = new Queue('my-queue', opts);

const worker = new Worker(
  'my-queue-res',
  async (job: Job) => { return job.data; }, opts);

const app = express();
app.use(express.json());

app.post('/', async (req: any, res: any) => {
  const b = await req.body;
  res.setHeader('Transfer-Encoding', 'chunked');
  await queue.add('my-job', { data: b.text });

  worker.on('completed', () => {
    res.end();
  });
});
