import { fingerprint } from '../../src/content/audio';
import type { Lesson } from '../../src/content/types';

export type VoicePool = 'female' | 'male';

/**
 * Which voice pool fits each character name used in the curriculum.
 * Add new names here when authoring lessons; generation stops with a clear
 * error for any speaker that has not been cast.
 */
const castByName: Record<string, VoicePool> = {
  Adam: 'male', Alex: 'male', Amina: 'female', Aya: 'female', Ben: 'male', Daniel: 'male', David: 'male',
  Eli: 'male', Farah: 'female', Hana: 'female', Jonah: 'male', June: 'female', Karim: 'male', Leila: 'female',
  Leo: 'male', Lina: 'female', Lucas: 'male', Malik: 'male', Marta: 'female', Maya: 'female', Mei: 'female',
  Mina: 'female', Ngozi: 'female', Noah: 'male', Noura: 'female', Omar: 'male', Priya: 'female', Rami: 'male',
  Rina: 'female', Salma: 'female', Sam: 'female', Sara: 'female', Sofia: 'female', Theo: 'male', Youssef: 'male',
  Zoe: 'female',
};

export type Voice = { id: string; name: string };
export type VoicePools = Record<VoicePool, Voice[]>;

/** Assigns one voice per speaker: stable per name, never shared within a lesson. */
export function castLesson(lesson: Lesson, pools: VoicePools): Map<string, Voice> {
  const taken = new Set<string>();
  const cast = new Map<string, Voice>();
  for (const speaker of lesson.speakers) {
    const poolName = castByName[speaker.name];
    if (!poolName) throw new Error(`No voice cast for speaker "${speaker.name}" in ${lesson.id}. Add it to scripts/audio/cast.ts.`);
    const pool = pools[poolName];
    if (pool.length === 0) throw new Error(`The ${poolName} voice pool is empty. Check ELEVENLABS_VOICES_${poolName.toUpperCase()}.`);
    const start = Number.parseInt(fingerprint(speaker.name), 16) % pool.length;
    const voice = Array.from({ length: pool.length }, (_, offset) => pool[(start + offset) % pool.length]!)
      .find((candidate) => !taken.has(candidate.id));
    if (!voice) throw new Error(`Not enough distinct ${poolName} voices for ${lesson.id}. Add another voice ID to the pool.`);
    taken.add(voice.id);
    cast.set(speaker.id, voice);
  }
  return cast;
}
