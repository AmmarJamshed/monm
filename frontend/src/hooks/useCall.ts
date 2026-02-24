'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import CallModal from '@/components/CallModal';
import { showCallNotification } from '@/lib/notifications';

const servers: RTCConfiguration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

type CallData = { type: string; from?: string; to?: string; fromName?: string; offer?: RTCSessionDescriptionInit; answer?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit; isVideo?: boolean };

export function useCall(userId: string | null, wsSend: (m: Record<string, unknown>) => void, wsSubscribe: (h: (d: Record<string, unknown>) => void) => () => void) {
  const [callState, setCallState] = useState<'idle' | 'incoming' | 'outgoing' | 'active'>('idle');
  const [peerName, setPeerName] = useState('');
  const [isVideo, setIsVideo] = useState(false);
  const [peerId, setPeerId] = useState<string | null>(null);
  const pendingOfferRef = useRef<{ offer: RTCSessionDescriptionInit; fromId: string; fromName: string; isVideo: boolean } | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pendingOfferRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setPeerId(null);
  }, []);

  const hangup = useCallback(() => {
    if (peerId) wsSend({ type: 'call_hangup', to: peerId });
    cleanup();
  }, [peerId, wsSend, cleanup]);

  useEffect(() => {
    return wsSubscribe((data) => {
      if (!userId) return;
      const d = data as CallData;
      if (d.type === 'call_request' && d.to === userId) {
        const callerName = d.fromName || 'Someone';
        const video = d.isVideo ?? false;
        pendingOfferRef.current = d.offer ? { offer: d.offer, fromId: d.from!, fromName: callerName, isVideo: video } : null;
        setPeerId(d.from ?? null);
        setPeerName(callerName);
        setIsVideo(video);
        setCallState('incoming');
        if (typeof document !== 'undefined' && document.hidden) showCallNotification(callerName, video);
      }
      if (d.type === 'call_answer' && d.to === userId && pcRef.current && d.answer) {
        pcRef.current.setRemoteDescription(new RTCSessionDescription(d.answer));
        setCallState('active');
      }
      if ((d.type === 'call_reject' || d.type === 'call_hangup') && d.from) {
        cleanup();
      }
      if (d.type === 'ice_candidate' && d.to === userId && pcRef.current && d.candidate) {
        pcRef.current.addIceCandidate(new RTCIceCandidate(d.candidate)).catch(() => {});
      }
    });
  }, [userId, wsSubscribe, cleanup]);

  const startCall = useCallback(
    async (targetId: string, targetName: string, video: boolean) => {
      if (!userId) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setPeerId(targetId);
        setPeerName(targetName);
        setIsVideo(video);
        setCallState('outgoing');

        const pc = new RTCPeerConnection(servers);
        pcRef.current = pc;
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        pc.ontrack = (e) => setRemoteStream(e.streams[0] ?? null);
        pc.onicecandidate = (e) => {
          if (e.candidate) wsSend({ type: 'ice_candidate', to: targetId, candidate: e.candidate.toJSON() });
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        wsSend({ type: 'call_request', to: targetId, fromName: (JSON.parse(localStorage.getItem('monm_user') || '{}')).name, conversationId: '', isVideo: video, offer: offer });
      } catch (e) {
        alert((e as Error).message || 'Could not start call');
        cleanup();
      }
    },
    [userId, wsSend, cleanup]
  );

  const acceptCall = useCallback(
    async (fromId: string, fromName: string, video: boolean, offer?: RTCSessionDescriptionInit) => {
      if (!userId || !offer) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setPeerId(fromId);
        setPeerName(fromName);
        setIsVideo(video);
        setCallState('active');

        const pc = new RTCPeerConnection(servers);
        pcRef.current = pc;
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        pc.ontrack = (e) => setRemoteStream(e.streams[0] ?? null);
        pc.onicecandidate = (e) => {
          if (e.candidate) wsSend({ type: 'ice_candidate', to: fromId, candidate: e.candidate.toJSON() });
        };

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        wsSend({ type: 'call_answer', to: fromId, answer });
      } catch (e) {
        alert((e as Error).message || 'Could not accept call');
        wsSend({ type: 'call_reject', to: fromId });
        cleanup();
      }
    },
    [userId, wsSend, cleanup]
  );

  const rejectCall = useCallback(() => {
    if (peerId) wsSend({ type: 'call_reject', to: peerId });
    cleanup();
  }, [peerId, wsSend, cleanup]);

  const handleAccept = useCallback(() => {
    const pending = pendingOfferRef.current;
    if (pending) acceptCall(pending.fromId, pending.fromName, pending.isVideo, pending.offer);
  }, [acceptCall]);

  return {
    startCall,
    callState,
    peerName,
    isVideo,
    peerId,
    hangup,
    rejectCall,
    handleAccept,
    localStream,
    remoteStream,
    CallModalComponent: callState !== 'idle' ? (
      <CallModal
        mode={callState === 'incoming' ? 'incoming' : callState === 'outgoing' ? 'outgoing' : 'active'}
        peerName={peerName}
        isVideo={isVideo}
        onClose={hangup}
        onAccept={callState === 'incoming' ? handleAccept : undefined}
        onReject={callState === 'incoming' ? rejectCall : undefined}
        localStream={localStream ?? undefined}
        remoteStream={remoteStream ?? undefined}
      />
    ) : null,
  };
}
