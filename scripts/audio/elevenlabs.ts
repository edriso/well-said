const API_ROOT = 'https://api.elevenlabs.io/v1';

export class ElevenLabsError extends Error {
  constructor(message: string, readonly status: number, readonly fatal: boolean) {
    super(message);
  }
}

export type SpeechRequest = {
  voiceId: string;
  text: string;
  modelId: string;
  outputFormat: string;
  seed?: number;
  speed?: number;
  previousText?: string;
  nextText?: string;
};

export type Subscription = {
  tier: string;
  character_count: number;
  character_limit: number;
  next_character_count_reset_unix?: number;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createClient(apiKey: string) {
  const request = async (path: string, init: RequestInit = {}, attempt = 0): Promise<Response> => {
    const response = await fetch(`${API_ROOT}${path}`, {
      ...init,
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', ...init.headers },
    });
    if (response.ok) return response;

    const body = await response.text();
    const retryable = response.status === 429 || response.status >= 500;
    const quota = /quota_exceeded|insufficient|credits/i.test(body);
    if (retryable && !quota && attempt < 5) {
      await wait(1000 * 2 ** attempt + Math.random() * 500);
      return request(path, init, attempt + 1);
    }
    const fatal = response.status === 401 || response.status === 403 || quota;
    throw new ElevenLabsError(`ElevenLabs ${response.status} on ${path}: ${body.slice(0, 400)}`, response.status, fatal);
  };

  return {
    async speech({ voiceId, text, modelId, outputFormat, seed, speed = 1, previousText, nextText }: SpeechRequest): Promise<Buffer> {
      const response = await request(`/text-to-speech/${voiceId}?output_format=${outputFormat}`, {
        method: 'POST',
        body: JSON.stringify({
          text,
          model_id: modelId,
          seed,
          previous_text: previousText,
          next_text: nextText,
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true, speed },
        }),
      });
      return Buffer.from(await response.arrayBuffer());
    },

    async subscription(): Promise<Subscription> {
      return (await request('/user/subscription')).json() as Promise<Subscription>;
    },

    async voices(): Promise<Array<{ voice_id: string; name: string; category?: string; labels?: Record<string, string> }>> {
      const data = (await (await request('/voices')).json()) as { voices: Array<{ voice_id: string; name: string; category?: string; labels?: Record<string, string> }> };
      return data.voices;
    },
  };
}

export type ElevenLabsClient = ReturnType<typeof createClient>;
