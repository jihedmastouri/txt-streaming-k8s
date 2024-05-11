import type { Stream } from 'node:stream';

// Usage:
//   eventSource.newStream(channelId, res);
//
//   eventSource.listen(channelId, (data: any) => {
//      /* do something with the data */
//   });
//
//    Somewhere else in the code:
//    for {
//      eventSource.send(id, response.data);
//    }

export class EventSource {
  private mapStreams: Map<string, Stream>;

  constructor() {
    this.mapStreams = new Map();
  }

  newStream(channelId: string, streamer: Stream) {
    this.mapStreams.set(channelId, streamer);
  }

  send(channelId: string, data: any) {
    if (!this.mapStreams.has(channelId)) {
      console.log(`Channel ${channelId} not found`);
      return;
    }
    const streamer = this.mapStreams.get(channelId);
    streamer?.emit('message', data);
  }

  listen(channelId: string, callback: (data: string) => void) {
    const streamer = this.mapStreams.get(channelId) as Stream;
    if (!streamer) {
      console.log(`Channel ${channelId} not found`);
      return;
    }

    streamer.on('message', (data) => {
      callback(data);
    });
  }

  close(channelId: string) {
    const stream = this.mapStreams.get(channelId);
    if (!stream) {
      console.log(`Channel ${channelId} not found`);
      return;
    }
    stream.removeAllListeners();
    this.mapStreams.delete(channelId);
  }
}
