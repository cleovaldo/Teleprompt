import { getSpeakerStyle, SpeakerStyle } from '../types';

export interface ParsedWord {
  id: number;
  rawWord: string;
  cleanWord: string;
}

export interface ParsedLine {
  lineIndex: number;
  text: string;
  isSectionHeader: boolean;
  sectionTitle?: string;
  isPause: boolean;
  isDirection: boolean;
  speakerTag?: string;
  speakerStyle?: SpeakerStyle;
  pureDialogue: string;
  words: ParsedWord[];
  isEmpty: boolean;
}

export interface ScriptSection {
  id: number;
  lineIndex: number;
  title: string;
}

export function parseScriptContent(content: string): {
  lines: ParsedLine[];
  sections: ScriptSection[];
  allWords: ParsedWord[];
  uniqueSpeakers: string[];
} {
  const rawLines = content.split('\n');
  const lines: ParsedLine[] = [];
  const sections: ScriptSection[] = [];
  const allWords: ParsedWord[] = [];
  const speakerSet = new Set<string>();

  let globalWordCounter = 0;
  let sectionCounter = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      lines.push({
        lineIndex: i,
        text: '',
        isSectionHeader: false,
        isPause: false,
        isDirection: false,
        pureDialogue: '',
        words: [],
        isEmpty: true,
      });
      continue;
    }

    // 1. Check for Section Header: [SEÇÃO: Introdução] or [CAPÍTULO: Gancho]
    const sectionMatch = trimmed.match(/^\[(?:SEÇÃO|SECAO|CAPÍTULO|CAPITULO|BLOCO):\s*([^\]]+)\]/i);
    if (sectionMatch) {
      const title = sectionMatch[1].trim();
      const sectionObj = {
        id: sectionCounter++,
        lineIndex: i,
        title,
      };
      sections.push(sectionObj);

      lines.push({
        lineIndex: i,
        text: rawLine,
        isSectionHeader: true,
        sectionTitle: title,
        isPause: false,
        isDirection: false,
        pureDialogue: title,
        words: [],
        isEmpty: false,
      });
      continue;
    }

    // 2. Check for Pause / Direction: [PAUSA: ...] or [DIREÇÃO: ...]
    const isPause = /^\[PAUSA[^\]]*\]/i.test(trimmed);
    const isDirection = /^\[(?:DIREÇÃO|DIRECAO|AÇÃO|ACAO)[^\]]*\]/i.test(trimmed);

    // 3. Check for Speaker Tag at start of line: [HOST], [CONVIDADO], [NARRADOR], [JOÃO]:
    let speakerTag: string | undefined;
    let pureDialogue = trimmed;

    const speakerMatch = trimmed.match(/^\[([a-zA-ZÀ-ÿ0-9_\s]{2,20})\]:?\s*(.*)$/);
    if (speakerMatch && !isPause && !isDirection) {
      const tagCandidate = speakerMatch[1].trim();
      // Exclude generic tags
      if (!/^(nota|obs|dica)/i.test(tagCandidate)) {
        speakerTag = tagCandidate;
        speakerSet.add(speakerTag.toUpperCase());
        pureDialogue = speakerMatch[2].trim();
      }
    }

    const speakerStyle = speakerTag ? getSpeakerStyle(speakerTag) : isDirection || isPause ? getSpeakerStyle('direcao') : undefined;

    // 4. Tokenize pure dialogue into words for Karaoke VoiceTrack
    const lineWords: ParsedWord[] = [];
    if (!isPause && !isDirection && pureDialogue) {
      const tokens = pureDialogue.split(/\s+/);
      for (const token of tokens) {
        if (!token) continue;
        const clean = token.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '');
        const wordObj: ParsedWord = {
          id: globalWordCounter++,
          rawWord: token,
          cleanWord: clean,
        };
        lineWords.push(wordObj);
        allWords.push(wordObj);
      }
    }

    lines.push({
      lineIndex: i,
      text: rawLine,
      isSectionHeader: false,
      isPause,
      isDirection,
      speakerTag,
      speakerStyle,
      pureDialogue,
      words: lineWords,
      isEmpty: false,
    });
  }

  return {
    lines,
    sections,
    allWords,
    uniqueSpeakers: Array.from(speakerSet),
  };
}
