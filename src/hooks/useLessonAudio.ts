import { useCallback, useEffect, useRef, useState } from 'react';

type PlayRequest = {
  id: string;
  text: string;
  src?: string;
  rate?: number;
  loop?: boolean;
  voiceIndex?: number;
  onEnd?: () => void;
};

export function useLessonAudio() {
  const [activeId, setActiveId] = useState<string>();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | undefined>(undefined);
  const cancelledRef = useRef(false);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = undefined;
    }
    setActiveId(undefined);
    setIsPlaying(false);
  }, []);

  const speakFallback = useCallback((request: PlayRequest, onEnd: () => void) => {
    if (!('speechSynthesis' in window)) {
      onEnd();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(request.text);
    const voices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.startsWith('en'));
    utterance.voice = voices[(request.voiceIndex ?? 0) % Math.max(voices.length, 1)] ?? null;
    utterance.lang = 'en-US';
    utterance.rate = request.rate ?? 1;
    utterance.onend = () => {
      if (request.loop && !cancelledRef.current) {
        window.setTimeout(() => window.speechSynthesis.speak(utterance), 300);
      } else {
        onEnd();
      }
    };
    utterance.onerror = onEnd;
    window.speechSynthesis.speak(utterance);
  }, []);

  const play = useCallback(
    (request: PlayRequest) => {
      stop();
      cancelledRef.current = false;
      setActiveId(request.id);
      setIsPlaying(true);

      const finish = () => {
        if (cancelledRef.current) return;
        request.onEnd?.();
        setActiveId(undefined);
        setIsPlaying(false);
      };

      if (request.src) {
        const audio = new Audio(`${import.meta.env.BASE_URL}${request.src.replace(/^\//, '')}`);
        audio.playbackRate = request.rate ?? 1;
        audio.loop = Boolean(request.loop);
        audio.onended = finish;
        audio.onerror = () => {
          audioRef.current = undefined;
          speakFallback(request, finish);
        };
        audioRef.current = audio;
        void audio.play().catch(() => speakFallback(request, finish));
        return;
      }

      speakFallback(request, finish);
    },
    [speakFallback, stop],
  );

  useEffect(() => stop, [stop]);

  return { activeId, isPlaying, play, stop };
}
