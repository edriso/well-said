import { useCallback, useEffect, useRef, useState } from 'react';

export type PlayableLine = {
  text: string;
  src?: string;
  voiceIndex?: number;
};

type PlayRequest = PlayableLine & {
  id: string;
  rate?: number;
  loop?: boolean;
  onEnd?: () => void;
};

type SequenceOptions = {
  rate?: number;
  gapMs?: number;
  onEnd?: () => void;
};

const isExternalSrc = (src: string) => /^(blob:|data:|https?:)/.test(src);

export function useLessonAudio() {
  const [activeId, setActiveId] = useState<string>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const audioRef = useRef<HTMLAudioElement | undefined>(undefined);
  const sessionRef = useRef(0);
  const speechAvailable = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  const stop = useCallback(() => {
    sessionRef.current += 1;
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = undefined;
    }
    setActiveId(undefined);
    setIsPlaying(false);
  }, []);

  const speakItem = useCallback(
    (item: PlayableLine & { rate?: number }, done: () => void) => {
      if (!speechAvailable) {
        setUnavailable(true);
        done();
        return;
      }
      if (!item.text) {
        done();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(item.text);
      const voices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.startsWith('en'));
      utterance.voice = voices[(item.voiceIndex ?? 0) % Math.max(voices.length, 1)] ?? null;
      utterance.lang = 'en-US';
      utterance.rate = item.rate ?? 1;
      utterance.onend = done;
      utterance.onerror = done;
      window.speechSynthesis.speak(utterance);
    },
    [speechAvailable],
  );

  const playItem = useCallback(
    (item: PlayableLine & { rate?: number }, done: () => void) => {
      if (!item.src) {
        speakItem(item, done);
        return;
      }
      let fellBack = false;
      const fallBack = () => {
        if (fellBack) return;
        fellBack = true;
        audioRef.current = undefined;
        speakItem(item, done);
      };
      const url = isExternalSrc(item.src) ? item.src : `${import.meta.env.BASE_URL}${item.src.replace(/^\//, '')}`;
      const audio = new Audio(url);
      audio.playbackRate = item.rate ?? 1;
      audio.onended = done;
      audio.onerror = fallBack;
      audioRef.current = audio;
      void audio.play().catch(fallBack);
    },
    [speakItem],
  );

  const play = useCallback(
    (request: PlayRequest) => {
      stop();
      const token = sessionRef.current;
      const live = () => sessionRef.current === token;
      setActiveId(request.id);
      setIsPlaying(true);
      const finish = () => {
        if (!live()) return;
        request.onEnd?.();
        setActiveId(undefined);
        setIsPlaying(false);
      };
      const attempt = () =>
        playItem(request, () => {
          if (!live()) return;
          if (request.loop) {
            window.setTimeout(() => live() && attempt(), 300);
          } else {
            finish();
          }
        });
      attempt();
    },
    [playItem, stop],
  );

  const playLines = useCallback(
    (id: string, items: PlayableLine[], options?: SequenceOptions) => {
      stop();
      const token = sessionRef.current;
      const live = () => sessionRef.current === token;
      setActiveId(id);
      setIsPlaying(true);
      const finish = () => {
        if (!live()) return;
        options?.onEnd?.();
        setActiveId(undefined);
        setIsPlaying(false);
      };
      const step = (index: number) => {
        if (!live()) return;
        const item = items[index];
        if (!item) {
          finish();
          return;
        }
        playItem({ ...item, rate: options?.rate }, () => {
          if (!live()) return;
          window.setTimeout(() => step(index + 1), options?.gapMs ?? 420);
        });
      };
      step(0);
    },
    [playItem, stop],
  );

  useEffect(() => stop, [stop]);

  return { activeId, isPlaying, unavailable, speechAvailable, play, playLines, stop };
}
