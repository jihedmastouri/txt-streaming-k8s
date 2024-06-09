from asyncio.queues import Queue
from collections import defaultdict
from typing import DefaultDict
import async_timeout
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import redis.asyncio as aioredis
from os import getenv
import uvicorn
import asyncio
import json
from threading import Thread

redis_host = getenv("REDIS_HOST", "localhost")
redis_port = int(getenv("REDIS_PORT", 6379))
host_addr = getenv("HOST_IP", "localhost")

app = FastAPI()

# Store the streams in a dictionary
# streams are Queues that will be used for communication between the listener and the stream endpoint
streams: DefaultDict[str, Queue] = defaultdict()
lock = asyncio.Semaphore(5) # Limit the number of concurrent requests


# Listen to the Redis queue for incoming requests to start processing asynchronously
async def listener():
    client = aioredis.from_url(f"redis://{redis_host}:{redis_port}")
    while True:
        try:
            async with async_timeout.timeout(2):
                req = await client.lpop("req-sol-1")
                if req is None:
                    continue

                req_jsml = json.loads(req)
                data = req_jsml["data"]
                id = req_jsml["id"]

                streams[id] = Queue()

                await client.publish(
                    "res-sol-1",
                    json.dumps({"id": id, "podAddr": "http://" + host_addr + ":8000"}),
                )

                asyncio.create_task(proceed_request(id, data))

        except asyncio.TimeoutError:
            pass


# Simulate An async request processing
async def proceed_request(id, data: str):
    # to limit the number of concurrent requests
    async with lock:
        await asyncio.sleep(0.5)  # Simulate processing time
        print(f"Processing request {id}, data: {data}")
        STATIC_STRING = "Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat. Exercitation laborum, in amet"
        for word in STATIC_STRING.split():
            await asyncio.sleep(0.05)  # Simulate processing time
            await streams[id].put(word)
            await streams[id].put(" ")
        await streams[id].put("<end>")


@app.get("/stream/{id}", response_class=StreamingResponse)
async def read_item(id: str):
    print(f"Requesting stream {id}")

    async def event_generator():
        while True:
            item = await streams[id].get()
            await asyncio.sleep(0.05)  # Simulate processing time
            yield item
            if item == "<end>":
                streams[id].task_done()
                streams.pop(id)
                break

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# helper function to start the listener
def start_listener(loop):
    asyncio.set_event_loop(loop)
    loop.run_until_complete(listener())


if __name__ == "__main__":
    # Start listener in a separate thread
    loop = asyncio.new_event_loop()
    listener_thread = Thread(target=start_listener, args=(loop,))
    listener_thread.start()

    # Start FastAPI app
    uvicorn.run(app, host="0.0.0.0", port=8000)
