import { io, Socket } from 'socket.io-client';
import { audioEngine } from './audioEngine';

export type CallStatus = 'idle' | 'calling' | 'connecting' | 'connected' | 'ended' | 'failed';

export interface SignalData {
  type: 'offer' | 'answer' | 'candidate';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

class WebRTCService {
  private socket: Socket | null = null;
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private roomId: string | null = null;
  private status: CallStatus = 'idle';
  private onStatusChange: ((status: CallStatus) => void) | null = null;
  private onRemoteStream: ((stream: MediaStream) => void) | null = null;

  constructor() {
    this.socket = io();
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('user-joined', (userId) => {
      console.log('User joined room:', userId);
      if (this.status === 'calling') {
        this.createOffer();
      }
    });

    this.socket.on('signal', async ({ from, data }: { from: string, data: SignalData }) => {
      if (!this.pc) return;

      if (data.type === 'offer') {
        await this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp!));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        this.sendSignal({ type: 'answer', sdp: answer });
        this.updateStatus('connecting');
      } else if (data.type === 'answer') {
        await this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp!));
        this.updateStatus('connected');
      } else if (data.type === 'candidate') {
        await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate!));
      }
    });
  }

  private updateStatus(status: CallStatus) {
    this.status = status;
    if (this.onStatusChange) this.onStatusChange(status);
  }

  private sendSignal(data: SignalData) {
    if (this.socket && this.roomId) {
      this.socket.emit('signal', { roomId: this.roomId, data });
    }
  }

  public async startCall(roomId: string, isLoopback: boolean = false) {
    this.roomId = roomId;
    this.updateStatus('calling');

    if (isLoopback) {
      await this.setupLoopback();
      return;
    }

    if (this.socket) {
      this.socket.emit('join-room', roomId);
    }

    await this.setupPeerConnection();
  }

  private async setupPeerConnection() {
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({ type: 'candidate', candidate: event.candidate });
      }
    };

    this.pc.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      if (this.onRemoteStream) this.onRemoteStream(this.remoteStream);
    };

    this.pc.onconnectionstatechange = () => {
      console.log('PC Connection State:', this.pc?.connectionState);
      if (this.pc?.connectionState === 'connected') {
        this.updateStatus('connected');
      } else if (this.pc?.connectionState === 'failed' || this.pc?.connectionState === 'disconnected') {
        this.updateStatus('failed');
      }
    };

    // Get stream from audioEngine (which applies denoising/voiceprint)
    await audioEngine.startMicrophone();
    const stream = audioEngine.getProcessedStream();
    if (!stream) {
      throw new Error('Failed to get processed stream');
    }
    this.localStream = stream;
    stream.getTracks().forEach(track => this.pc?.addTrack(track, stream));
  }

  private async createOffer() {
    if (!this.pc) return;
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.sendSignal({ type: 'offer', sdp: offer });
    this.updateStatus('connecting');
  }

  private async setupLoopback() {
    await audioEngine.startMicrophone();
    const stream = audioEngine.getProcessedStream();
    if (!stream) throw new Error('Failed to get processed stream');
    
    this.localStream = stream;
    
    const pc1 = new RTCPeerConnection();
    const pc2 = new RTCPeerConnection();

    pc1.onicecandidate = e => e.candidate && pc2.addIceCandidate(e.candidate);
    pc2.onicecandidate = e => e.candidate && pc1.addIceCandidate(e.candidate);

    pc2.ontrack = e => {
      this.remoteStream = e.streams[0];
      if (this.onRemoteStream) this.onRemoteStream(this.remoteStream);
      this.updateStatus('connected');
    };

    stream.getTracks().forEach(track => pc1.addTrack(track, stream));

    const offer = await pc1.createOffer();
    await pc1.setLocalDescription(offer);
    await pc2.setRemoteDescription(offer);

    const answer = await pc2.createAnswer();
    await pc2.setLocalDescription(answer);
    await pc1.setRemoteDescription(answer);
    
    this.pc = pc1; // Keep reference to one for cleanup
  }

  public endCall() {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    this.remoteStream = null;
    this.updateStatus('ended');
    setTimeout(() => this.updateStatus('idle'), 2000);
  }

  public setHandlers(onStatus: (status: CallStatus) => void, onStream: (stream: MediaStream) => void) {
    this.onStatusChange = onStatus;
    this.onRemoteStream = onStream;
  }
}

export const webrtcService = new WebRTCService();
