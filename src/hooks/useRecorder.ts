import { useCallback, useEffect, useRef, useState } from 'react';

export function useRecorder() {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'recording' | 'ready' | 'denied'>('idle');
  const [recordingUrl, setRecordingUrl] = useState<string>();
  const recorderRef = useRef<MediaRecorder | undefined>(undefined);
  const streamRef = useRef<MediaStream | undefined>(undefined);

  const clear = useCallback(() => {
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    setRecordingUrl(undefined);
    setStatus('idle');
  }, [recordingUrl]);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || !('MediaRecorder' in window)) {
      setStatus('denied');
      return;
    }
    try {
      setStatus('requesting');
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      setRecordingUrl(undefined);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType });
        setRecordingUrl(URL.createObjectURL(blob));
        setStatus('ready');
        stream.getTracks().forEach((track) => track.stop());
      };
      recorderRef.current = recorder;
      recorder.start();
      setStatus('recording');
    } catch {
      setStatus('denied');
    }
  }, [recordingUrl]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }, []);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    },
    [recordingUrl],
  );

  return { status, recordingUrl, start, stop, clear };
}
