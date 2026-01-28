export type CoachPersonality =
  | 'Viola'
  | 'Stella'
  | 'Margareta'
  | 'Laura'
  | 'Damian';

export function botVoiceSpeak(text: string, name: string): void {
  console.log('name bot answer voice', name);
  if (!text) return;
  if (!isCoachPersonality(name)) {
    console.warn('Unknown coach personality:', name);
    return;
  }
  const profile = BotPersonalities[name];
  if (!profile) return;

  const utterance = new SpeechSynthesisUtterance(text);

  const voice = findVoice(profile.voiceHints);
  if (voice) {
    utterance.voice = voice;
  }

  utterance.lang = 'en-US';
  utterance.rate = profile.rate;
  utterance.pitch = profile.pitch;
  utterance.volume = 1;

  // prekini prethodni govor da se ne preklapa
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function isCoachPersonality(value: string): value is CoachPersonality {
  return value in BotPersonalities;
}

function findVoice(
  voiceHints: readonly string[]
): SpeechSynthesisVoice | undefined {
  const voices = speechSynthesis.getVoices();

  return voices.find((v) =>
    voiceHints.some((hint) => v.name.toLowerCase().includes(hint.toLowerCase()))
  );
}

export const BotPersonalities = {
  Viola: {
    gender: 'female',
    voiceHints: ['UK', 'Female', 'Victoria', 'Moira'],
    rate: 0.95,
    pitch: 1.05,
    description: 'Elegant, strategic mentor',
  },

  Stella: {
    gender: 'female',
    voiceHints: ['Samantha', 'Karen'],
    rate: 0.9,
    pitch: 1.1,
    description: 'Explains concepts step by step',
  },

  Margareta: {
    gender: 'female',
    voiceHints: ['Female'],
    rate: 0.85,
    pitch: 1.0,
    description: 'Very calm, reassuring voice',
  },

  Laura: {
    gender: 'female',
    voiceHints: ['Zira', 'Hazel'],
    rate: 1.05,
    pitch: 1.2,
    description: 'Positive and encouraging',
  },

  Damian: {
    gender: 'male',
    voiceHints: ['David', 'Male'],
    rate: 0.95,
    pitch: 0.9,
    description: 'Direct, no-nonsense coach',
  },
} as const;
