from asyncio import Queue
from collections import defaultdict
from typing import DefaultDict

class EventSource:
    def __init__(self):
        self.mapStreams: DefaultDict[str, Queue] = defaultdict()

    def newStream(self, channel_id: str):
        self.mapStreams[channel_id] = Queue()

    async def add(self, channel_id: str, data: str):
        if channel_id not in self.mapStreams:
            print(f"Channel {channel_id} not found")
            return
        streamer = self.mapStreams[channel_id]
        await streamer.put(data)

    async def listen(self, channel_id: str):
        if channel_id not in self.mapStreams:
            print(f"Channel {channel_id} not found")
            return
        streamer = self.mapStreams[channel_id]
        while True:
            val = streamer.get()
            yield val
            if val == '<end>':
                self.mapStreams.pop(channel_id)
                return
