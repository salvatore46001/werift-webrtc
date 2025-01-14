import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from "../../../packages/webrtc/src";
import { Server } from "ws";

const server = new Server({ port: 8889 });
console.log("start");

server.on("connection", async (socket) => {
  const pc = new RTCPeerConnection({
    iceServers: [
      {
        urls: "turn:relay.backups.cz:3478",
        credential: "webrtc",
        username: "webrtc",
      },
    ],
    iceTransportPolicy: "relay",
  });

  const transceiver = pc.addTransceiver("video");
  transceiver.onTrack.subscribe(async (track) => {
    transceiver.sender.replaceTrack(track);

    await track.onReceiveRtp.asPromise();
    setInterval(() => {
      transceiver.receiver.sendRtcpPLI(track.ssrc);
    }, 1000);
  });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  const sdp = JSON.stringify(pc.localDescription);
  socket.send(sdp);

  socket.on("message", async (data: any) => {
    const msg = JSON.parse(data);
    if (RTCIceCandidate.isThis(msg)) {
      await pc.addIceCandidate(msg);
    } else if (RTCSessionDescription.isThis(msg)) {
      await pc.setRemoteDescription(msg);
    }
  });
});
