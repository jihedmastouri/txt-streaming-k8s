# PoC: Text Streaming between microservices inside K8s using Redis

Exploring ways to stream data between 2 microservices (`Node-MS` and `Python-MS`) inside k8s.

We will use Redis as a message broker/Queue to enable "async" communication between the services.

This is a PoC, and it's not intended to be used in production.

<p align="center">
  <img alt="diagram" src="./assets/diag.png" height="500" />
</p>


## Solution 1:

Redis as a job orchestrator

- The client queries Node-MS with a text to be processed. Node-MS will keep the connection open.

- Node-Ms will queue a "job" with the text to be processed and an ID.

- After the dequeuing the job, Python-MS will publish a message containing its IP and the message ID.

- After receiving the message, each Node-MS instance will check if the job ID belongs it. If it does, it will send a GET request to Python-MS to get the data as a stream.

- Node-MS will forward the results to the client as a stream.

<p align="center">
  <img alt="diagram" src="./assets/solution-1-seq.png" height="500" />
</p>

## Solution 2:

Redis as the main communication channel:

- The client queries Node-MS with a text to be processed. Node-MS will keep the connection open.

- Node-Ms will queue a "job" with the text to be processed and an ID.

- After the dequeuing the job, Python-MS will start publishing the results in chunks to a Redis channel (attaching the job ID to each message).

- Upon receiving any message, each Node-MS instance will check if the job ID belongs it. If it does, it will write that message data to the client.

<p align="center">
  <img alt="diagram" src="./assets/solution-2-seq.png" height="500" />
</p>
