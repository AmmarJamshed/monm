'use client';

import { useLayoutEffect, useRef } from 'react';

type Props = {
  mode: 'incoming' | 'outgoing' | 'active';
  peerName: string;
  isVideo: boolean;
  onClose: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
};

export default function CallModal({ mode, peerName, isVideo, onClose, onAccept, onReject, localStream, remoteStream }: Props) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Bind streams when elements exist - useLayoutEffect ensures refs are set before paint
  useLayoutEffect(() => {
    if (localStream && localRef.current) {
      localRef.current.srcObject = localStream;
    }
  }, [localStream, mode, isVideo]);
  useLayoutEffect(() => {
    if (remoteStream && remoteRef.current) {
      remoteRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, mode, isVideo]);
  // Voice calls: play remote audio via hidden audio element
  useLayoutEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, mode, isVideo]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900 text-white">
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <span className="font-medium">{isVideo ? 'Video' : 'Voice'} call {mode === 'incoming' ? 'from' : mode === 'outgoing' ? 'to' : 'with'} {peerName}</span>
        {mode === 'active' && (
          <button onClick={onClose} className="p-2 rounded-full bg-red-600 hover:bg-red-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.516l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" /></svg>
          </button>
        )}
      </div>
      <div className="flex-1 flex items-center justify-center gap-4 p-4">
        {mode === 'active' && isVideo ? (
          <>
            <div className="relative w-full max-w-md aspect-video bg-slate-800 rounded-xl overflow-hidden min-h-[180px]">
              <video ref={remoteRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-2 right-2 w-24 aspect-video bg-slate-700 rounded-lg overflow-hidden border-2 border-white">
                <video ref={localRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>
            </div>
          </>
        ) : mode === 'active' ? (
          <div className="flex flex-col items-center gap-4">
            <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
            <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center text-3xl font-bold">{peerName[0]}</div>
            <p className="text-slate-300">Voice call in progress</p>
          </div>
        ) : mode === 'incoming' ? (
          <div className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center text-4xl font-bold">{peerName[0]}</div>
            <p className="text-xl">{peerName} is calling</p>
            <div className="flex gap-4">
              <button onClick={onReject} className="p-4 rounded-full bg-red-600 hover:bg-red-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.516l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" /></svg>
              </button>
              <button onClick={onAccept} className="p-4 rounded-full bg-green-600 hover:bg-green-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center text-4xl font-bold animate-pulse">{peerName[0]}</div>
            <p className="text-xl">Calling {peerName}…</p>
            <button onClick={onClose} className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 font-medium">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
