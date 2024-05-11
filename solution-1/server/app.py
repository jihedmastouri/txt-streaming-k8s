import async_timeout
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import aioredis
from os import getenv
import uvicorn
from time import sleep
import asyncio
from event_source import EventSource
import json

redis_host = getenv("REDIS_HOST", "localhost")
redis_port = int(getenv("REDIS_PORT", 6379))
host_ip = getenv("HOST_IP", "localhost")

app = FastAPI()
es = EventSource()


async def listener():
    client = aioredis.from_url(f"redis://{redis_host}:{redis_port}")
    while True:
        try:
            async with async_timeout.timeout(1):
                req = await client.blpop("req-sol-1")
                req_jsml = json.loads(req[1])

                data = req_jsml["data"]
                id = req_jsml["id"]

                asyncio.create_task(proceed_request(id, data))
                client.publish("res-sol-1", json.dumps({"id": id, "podIp": host_ip}))
        except asyncio.TimeoutError:
            pass


async def proceed_request(id, data: str):
    sleep(1000)
    print(f"Processing request {id}, data: {data}")
    es.newStream(id)
    STATIC_STRING = "Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat. Exercitation laborum, in amet"
    for word in STATIC_STRING.split():
        await es.add(id, word)


@app.get("/stream/{id}", response_class=StreamingResponse)
async def read_item(id: str):
    sleep(1000)
    async for item in es.listen(id):
        yield item


if __name__ == "__main__":
    asyncio.run(listener())
    uvicorn.run(app, host="", port=8000)
