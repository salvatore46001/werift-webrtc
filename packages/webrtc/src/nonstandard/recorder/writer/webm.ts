import * as fs from "fs/promises";

import { SupportedCodec } from "../../../../../rtp/src/container/webm";
import {
  JitterBuffer,
  MediaStreamTrack,
  SampleBuilder,
  WebmIO,
  WebmOutput,
} from "../../..";
import { MediaWriter } from ".";

export class WebmFactory extends MediaWriter {
  webm?: WebmOutput;
  jitterBuffer!: JitterBuffer;

  start(tracks: MediaStreamTrack[]) {
    this.webm = new WebmOutput(
      fs as WebmIO,
      "./test.webm",
      tracks.map((track, i) => {
        const trackNumber = i + 1;
        const payloadType = track.codec!.payloadType;

        if (track.kind === "video") {
          const codec = ((): SupportedCodec => {
            switch (track.codec?.name.toLowerCase() as SupportedVideoCodec) {
              case "vp8":
                return "VP8";
              case "vp9":
                return "VP9";
              case "h264":
                return "MPEG4/ISO/AVC";
              case "av1x":
                return "AV1";
              default:
                throw new Error();
            }
          })();
          return {
            kind: "video",
            clockRate: 90000,
            payloadType,
            trackNumber,
            codec,
            width: this.options.width,
            height: this.options.height,
          };
        } else {
          return {
            kind: "audio",
            clockRate: 48000,
            payloadType,
            trackNumber,
            codec: "OPUS",
          };
        }
      })
    );

    tracks.forEach((track) => {
      const sampleBuilder =
        track.kind === "video"
          ? new SampleBuilder((h) => !!h.marker).pipe(this.webm!)
          : new SampleBuilder(() => true).pipe(this.webm!);
      this.jitterBuffer = new JitterBuffer({
        rtpStream: track.onReceiveRtp,
        rtcpStream: track.onReceiveRtcp,
      });
      this.jitterBuffer.pipe(sampleBuilder);
    });
  }

  async stop(insertDuration = true) {
    this.jitterBuffer.stop();
    await this.webm!.stop(insertDuration);
  }
}

const supportedVideoCodecs = ["h264", "vp8", "vp9", "av1x"] as const;
type SupportedVideoCodec = typeof supportedVideoCodecs[number];
