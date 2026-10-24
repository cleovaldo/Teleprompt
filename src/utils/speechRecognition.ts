/**
 * Web Speech API wrapper for real-time speech-tracked prompter scrolling
 */

type SpeechCallback = (spokenPhrase: string, isFinal: boolean) => void;

interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export class SpeechScrollManager {
  private recognition: any = null;
  private isListening: boolean = false;
  private shouldKeepListening: boolean = false;
  private onSpeechMatch: SpeechCallback;
  private onErrorCallback?: (errMessage: string) => void;

  private language: string = 'pt-BR';

  constructor(
    onSpeechMatch: SpeechCallback,
    onError?: (errMessage: string) => void,
    language: string = 'pt-BR'
  ) {
    this.onSpeechMatch = onSpeechMatch;
    this.onErrorCallback = onError;
    this.language = language;
    this.initRecognition();
  }

  public setLanguage(lang: string) {
    if (this.language !== lang) {
      this.language = lang;
      if (this.recognition) {
        this.recognition.lang = lang;
      }
    }
  }

  public static isSupported(): boolean {
    const win = window as unknown as IWindowWithSpeech;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  private initRecognition() {
    const win = window as unknown as IWindowWithSpeech;
    const SpeechConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechConstructor) {
      return;
    }

    try {
      this.recognition = new SpeechConstructor();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.language;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }

        const trimmed = transcript.trim().toLowerCase();
        if (trimmed) {
          this.onSpeechMatch(trimmed, isFinal);
        }
      };

      this.recognition.onerror = (event: any) => {
        // 'no-speech' is a normal transient event when the speaker pauses
        if (event.error === 'no-speech') return;
        
        console.warn('Speech recognition warning:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.shouldKeepListening = false;
          this.isListening = false;
          this.onErrorCallback?.('Permissão de microfone negada. Verifique as configurações do navegador.');
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        // If user wants continuous listening, restart automatically
        if (this.shouldKeepListening) {
          try {
            this.recognition.start();
            this.isListening = true;
          } catch {
            // Ignore retry collisions
          }
        }
      };
    } catch (err) {
      console.error('Failed to init SpeechRecognition:', err);
    }
  }

  public start() {
    if (!this.recognition) return;
    this.shouldKeepListening = true;
    if (!this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
      } catch (e) {
        console.warn('Could not start recognition:', e);
      }
    }
  }

  public stop() {
    this.shouldKeepListening = false;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
      this.isListening = false;
    }
  }

  public getStatus(): boolean {
    return this.isListening;
  }
}

/**
 * Searches for spoken words in a text and returns the estimated character offset and progress ratio (0 to 1)
 */
export function findSpokenTextPosition(
  spokenText: string,
  fullText: string,
  lastProgressRatio: number = 0
): { targetRatio: number; matchedIndex: number } | null {
  if (!spokenText || !fullText) return null;

  const cleanSpoken = spokenText
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);

  if (cleanSpoken.length === 0) return null;

  const cleanFull = fullText.toLowerCase();
  const currentEstIndex = Math.floor(fullText.length * lastProgressRatio);

  // Look for 2 to 4 consecutive words match first
  for (let n = Math.min(4, cleanSpoken.length); n >= 2; n--) {
    const phrase = cleanSpoken.slice(-n).join(' ');
    // Search near current position first (forward up to 2500 chars)
    const searchSlice = cleanFull.slice(currentEstIndex, currentEstIndex + 2500);
    const localIdx = searchSlice.indexOf(phrase);
    if (localIdx !== -1) {
      const matchPos = currentEstIndex + localIdx;
      return {
        matchedIndex: matchPos,
        targetRatio: Math.min(1, Math.max(0, matchPos / fullText.length)),
      };
    }

    // Global search if not found immediately ahead
    const globalIdx = cleanFull.indexOf(phrase);
    if (globalIdx !== -1) {
      return {
        matchedIndex: globalIdx,
        targetRatio: Math.min(1, Math.max(0, globalIdx / fullText.length)),
      };
    }
  }

  // Fallback: search for the last significant spoken word near current progress
  const lastWord = cleanSpoken[cleanSpoken.length - 1];
  if (lastWord.length >= 4) {
    const forwardSlice = cleanFull.slice(currentEstIndex, currentEstIndex + 2000);
    const localWordIdx = forwardSlice.indexOf(lastWord);
    if (localWordIdx !== -1) {
      const matchPos = currentEstIndex + localWordIdx;
      return {
        matchedIndex: matchPos,
        targetRatio: Math.min(1, Math.max(0, matchPos / fullText.length)),
      };
    }
  }

  return null;
}

/**
 * High-precision word-level karaoke matcher
 */
export function findKaraokeWordMatch(
  spokenText: string,
  words: { cleanWord: string; id: number }[],
  currentWordIndex: number = 0
): number | null {
  if (!spokenText || words.length === 0) return null;

  const cleanSpoken = spokenText
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (cleanSpoken.length === 0) return null;

  // Search forward near currentWordIndex (window of 40 words ahead)
  const windowStart = Math.max(0, currentWordIndex - 5);
  const windowEnd = Math.min(words.length, currentWordIndex + 45);

  // Try matching last 2 spoken words
  if (cleanSpoken.length >= 2) {
    const lastTwo = cleanSpoken.slice(-2);
    for (let i = windowStart; i < windowEnd - 1; i++) {
      if (
        words[i].cleanWord === lastTwo[0] &&
        words[i + 1].cleanWord === lastTwo[1]
      ) {
        return words[i + 1].id;
      }
    }
  }

  // Try matching last single spoken word (if at least 3 chars)
  const lastSpoken = cleanSpoken[cleanSpoken.length - 1];
  if (lastSpoken.length >= 3) {
    for (let i = windowStart; i < windowEnd; i++) {
      if (words[i].cleanWord === lastSpoken) {
        return words[i].id;
      }
    }
  }

  return null;
}

