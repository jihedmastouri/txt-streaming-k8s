from os import getenv
import async_timeout
import redis.asyncio as aioredis
import asyncio
import json

redis_host = getenv("REDIS_HOST", "localhost")
redis_port = int(getenv("REDIS_PORT", 6379))

client = aioredis.from_url(f"redis://{redis_host}:{redis_port}")
lock = asyncio.Semaphore(100)


async def proceed_request(id, data: str):
    async with lock:
        await asyncio.sleep(0.5)  # Simulate processing time
        print(f"Processing request {id}, data: {data}")
        STATIC_STRING = "Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat. Exercitation laborum, in amet"
        for word in STATIC_STRING.split():
            await asyncio.sleep(0.05)  # Simulate processing time
            await client.publish("res-sol-2", json.dumps({"id": id, "data": word}))
            await client.publish("res-sol-2", json.dumps({"id": id, "data": " "}))
        await client.publish("res-sol-2", json.dumps({"id": id, "data": "<end>"}))


# maybe make async or use threads
async def main():
    while True:
        try:
            async with async_timeout.timeout(2):
                req = await client.rpop("req-sol-2")
                if req is None:
                    continue

                req_jsml = json.loads(req)
                data = req_jsml["data"]
                id = req_jsml["id"]

                asyncio.create_task(proceed_request(id, data))

        except asyncio.TimeoutError:
            pass


if __name__ == "__main__":
    asyncio.run(main())
