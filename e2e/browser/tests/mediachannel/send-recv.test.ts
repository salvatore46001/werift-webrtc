import { waitVideoPlay } from "../fixture";
import { WebSocketTransport, Peer } from "protoo-client";

const transport = new WebSocketTransport("ws://localhost:8886");
const peer = new Peer(transport);

describe("mediachannel_sendrecv", () => {
  it(
    "answer",
    async (done) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pc.ontrack = ({ track }) => {
        waitVideoPlay(track).then(done);
      };

      const [track] = (
        await navigator.mediaDevices.getUserMedia({ video: true })
      ).getTracks();
      pc.addTrack(track);

      const offer = await peer.request("mediachannel_send_recv_answer", {
        type: "init",
      });
      await pc.setRemoteDescription(offer);
      await pc.setLocalDescription(await pc.createAnswer());

      pc.onicecandidate = ({ candidate }) => {
        peer.request("mediachannel_send_recv_answer", {
          type: "candidate",
          payload: candidate,
        });
      };

      peer.request("mediachannel_send_recv_answer", {
        type: "answer",
        payload: pc.localDescription,
      });
    },
    10 * 1000
  );

  it(
    "offer",
    async (done) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pc.ontrack = ({ track }) => {
        waitVideoPlay(track).then(done);
      };
      pc.onicecandidate = ({ candidate }) => {
        peer.request("mediachannel_send_recv_offer", {
          type: "candidate",
          payload: candidate,
        });
      };

      const [track] = (
        await navigator.mediaDevices.getUserMedia({ video: true })
      ).getTracks();
      pc.addTransceiver(track, { direction: "sendonly" });
      pc.addTransceiver("video", { direction: "recvonly" });

      await pc.setLocalDescription(await pc.createOffer());
      const answer = await peer.request("mediachannel_send_recv_offer", {
        type: "init",
        payload: pc.localDescription,
      });
      await pc.setRemoteDescription(answer);
    },
    10 * 1000
  );
});