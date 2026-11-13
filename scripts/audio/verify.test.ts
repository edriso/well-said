import { describe, expect, it } from 'vitest';
import { normalizeSpeech } from './verify';

describe('speech transcript normalization', () => {
  it('spells out numbers, times, money, and percentages', () => {
    expect(normalizeSpeech('Can we make it 7:30?')).toEqual(normalizeSpeech('Can we make it seven thirty?'));
    expect(normalizeSpeech('It opens at 9:05.')).toEqual(['it', 'opens', 'at', 'nine', 'oh', 'five']);
    expect(normalizeSpeech("That'll be $18.")).toEqual(normalizeSpeech("That'll be eighteen dollars."));
    expect(normalizeSpeech('Room 214')).toEqual(['room', 'two', 'hundred', 'fourteen']);
    expect(normalizeSpeech('About 20% more')).toEqual(normalizeSpeech('About twenty percent more'));
  });

  it('ignores punctuation, case, hyphens, and curly apostrophes', () => {
    expect(normalizeSpeech('Hi there! What can I get for you?')).toEqual(normalizeSpeech('hi there. what can i get for you'));
    expect(normalizeSpeech('twenty-four')).toEqual(['twenty', 'four']);
    expect(normalizeSpeech('I’m sure')).toEqual(normalizeSpeech("I'm sure"));
  });

  it('treats US and UK spellings as the same word', () => {
    expect(normalizeSpeech('the colour of my neighbour’s harbour')).toEqual(normalizeSpeech("the color of my neighbor's harbor"));
    expect(normalizeSpeech('I realise it was cancelled')).toEqual(normalizeSpeech('I realize it was canceled'));
    expect(normalizeSpeech('the theatre centre')).toEqual(normalizeSpeech('the theater center'));
    expect(normalizeSpeech('coloured stickers, one centimetre')).toEqual(normalizeSpeech('colored stickers, one centimeter'));
  });

  it('still tells genuinely different words apart', () => {
    expect(normalizeSpeech('four')).not.toEqual(normalizeSpeech('for'));
    expect(normalizeSpeech('your')).not.toEqual(normalizeSpeech('yore'));
    expect(normalizeSpeech('fifteen')).not.toEqual(normalizeSpeech('fifty'));
    expect(normalizeSpeech('I can')).not.toEqual(normalizeSpeech("I can't"));
  });
});
