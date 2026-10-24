export type TextColorTheme = 'white' | 'yellow' | 'green' | 'cyan';

export interface PrompterConfig {
  speed: number;             // 1 to 20 pixels per frame / relative speed
  fontSize: number;          // 24px to 120px
  lineHeight: number;        // 1.2 to 2.4
  marginWidth: number;       // 35% to 95% of viewport width
  textAlign: 'left' | 'center' | 'right';
  flipHorizontal: boolean;   // Mirror horizontal (for teleprompter glass beam splitters)
  flipVertical: boolean;     // Mirror vertical
  colorTheme: TextColorTheme;// 'white' | 'yellow' | 'green' | 'cyan'
  showEyelineGuide: boolean; // Reading guide line
  eyelinePosition: number;   // 15% to 75% of viewport height
  guideOpacity: number;      // 0.2 to 1.0
  autoHideControls: boolean; // Auto-hide overlay after 2.5s
  enableVoiceScroll: boolean;// Web Speech API tracking
  enableCountdown: boolean;  // 3-2-1 countdown before auto-scrolling
  countdownSeconds: number;  // 3, 5, etc.
  wordsPerMinute: number;    // Reference WPM for speech duration calculation (default 130)
  scrollDirection: 'vertical' | 'horizontal'; // 'vertical' (classic) or 'horizontal' (YouTube broadcast ticker)
  aspectRatio: '16:9' | '9:16' | 'full';     // Video and framing aspect ratio (YouTube 16:9 vs Shorts 9:16)
  horizontalBandPosition: 'top' | 'center' | 'bottom'; // Position of horizontal reading band (top is optimal for webcam)
  youtubeMode: boolean;      // Quick flag for YouTube optimized layout (16:9 + lens alignment)
  cameraAlignment: 'left' | 'center' | 'right'; // Horizontal column alignment to lock gaze directly with camera lens
  horizontalOffsetPercent: number; // 5% to 95% (default 50 for center, 15 for left, 85 for right)
  // 1. Smartphone Remote
  remoteSessionId?: string;
  // 2. VoiceTrack & Karaoke
  enableKaraokeHighlight: boolean;
  voiceLanguage: string;
  // 3. Pacing Target Timer & Auto-Ramp
  targetDurationSeconds: number; // 0 for free/disabled, 30, 60 (Shorts), 90 (Reels), 180 (3min), etc.
  enableAutoPaceRamp: boolean;   // Auto-adjusts scroll speed to meet target duration
  // 4. Multi-Speaker & Bookmarks
  activeSpeakerFilter: string;   // 'all' or speaker name
  // 5. Transparent Camera Overlay & Framing
  cameraOverlayMode: 'pip' | 'fullscreen-glass' | 'hidden';
  prompterBackgroundOpacity: number; // 0 (100% transparent glass) to 100 (solid OLED black)
  cameraFramingGuide: 'none' | '16:9' | '9:16' | 'grid';
  showAudioMeter: boolean;
}

export interface ScriptItem {
  id: string;
  title: string;
  content: string;
  lastModified: number;
}

export interface ScriptSectionBookmark {
  index: number;
  lineIndex: number;
  title: string;
}

export interface RemoteCommandMessage {
  type:
    | 'play'
    | 'pause'
    | 'toggle_play'
    | 'speed_up'
    | 'speed_down'
    | 'font_up'
    | 'font_down'
    | 'restart'
    | 'align_camera'
    | 'toggle_flip'
    | 'toggle_voice'
    | 'next_section'
    | 'prev_section'
    | 'sync_state_req'
    | 'sync_state_res';
  payload?: any;
  timestamp: number;
}

export interface RemoteStatusState {
  isPlaying: boolean;
  speed: number;
  fontSize: number;
  title: string;
  cameraAlignment: 'left' | 'center' | 'right';
  flipHorizontal: boolean;
  elapsedSeconds: number;
  targetDurationSeconds: number;
  totalEstimatedSeconds: number;
  progressRatio: number;
  isVoiceActive: boolean;
}

export const DEFAULT_CONFIG: PrompterConfig = {
  speed: 4,
  fontSize: 52,
  lineHeight: 1.6,
  marginWidth: 70,
  textAlign: 'left',
  flipHorizontal: false,
  flipVertical: false,
  colorTheme: 'yellow',
  showEyelineGuide: true,
  eyelinePosition: 35, // 35% from top is the optimal camera eye-level
  guideOpacity: 0.8,
  autoHideControls: true,
  enableVoiceScroll: false,
  enableCountdown: true,
  countdownSeconds: 3,
  wordsPerMinute: 130,
  scrollDirection: 'vertical',
  aspectRatio: '16:9',
  horizontalBandPosition: 'top',
  youtubeMode: true,
  cameraAlignment: 'center',
  horizontalOffsetPercent: 50,
  // 1. Smartphone Remote
  remoteSessionId: 'prompter-live',
  // 2. VoiceTrack & Karaoke
  enableKaraokeHighlight: true,
  voiceLanguage: 'pt-BR',
  // 3. Pacing Target Timer & Auto-Ramp
  targetDurationSeconds: 0,
  enableAutoPaceRamp: false,
  // 4. Multi-Speaker & Bookmarks
  activeSpeakerFilter: 'all',
  // 5. Transparent Camera Overlay & Framing
  cameraOverlayMode: 'pip',
  prompterBackgroundOpacity: 100,
  cameraFramingGuide: 'none',
  showAudioMeter: true,
};

export const COLOR_THEMES: Record<TextColorTheme, { label: string; textClass: string; hex: string; bgBadge: string }> = {
  white: {
    label: 'Branco Studio',
    textClass: 'text-white',
    hex: '#FFFFFF',
    bgBadge: 'bg-white text-black',
  },
  yellow: {
    label: 'Amarelo Pro',
    textClass: 'text-amber-300',
    hex: '#FDE047',
    bgBadge: 'bg-amber-300 text-black',
  },
  green: {
    label: 'Verde Neon',
    textClass: 'text-emerald-400',
    hex: '#4ADE80',
    bgBadge: 'bg-emerald-400 text-black',
  },
  cyan: {
    label: 'Ciano Foco',
    textClass: 'text-cyan-300',
    hex: '#67E8F9',
    bgBadge: 'bg-cyan-300 text-black',
  },
};

export interface SpeakerStyle {
  label: string;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
  textClass: string;
}

export const SPEAKER_STYLES: Record<string, SpeakerStyle> = {
  host: {
    label: 'Host / Apresentador',
    badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-500/40',
    badgeText: 'text-amber-300',
    borderClass: 'border-l-4 border-amber-400 pl-3',
    textClass: 'text-amber-100',
  },
  apresentador: {
    label: 'Apresentador',
    badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-500/40',
    badgeText: 'text-amber-300',
    borderClass: 'border-l-4 border-amber-400 pl-3',
    textClass: 'text-amber-100',
  },
  convidado: {
    label: 'Convidado',
    badgeBg: 'bg-emerald-400/20 text-emerald-300 border-emerald-500/40',
    badgeText: 'text-emerald-300',
    borderClass: 'border-l-4 border-emerald-400 pl-3',
    textClass: 'text-emerald-100',
  },
  narrador: {
    label: 'Narrador',
    badgeBg: 'bg-cyan-400/20 text-cyan-300 border-cyan-500/40',
    badgeText: 'text-cyan-300',
    borderClass: 'border-l-4 border-cyan-400 pl-3',
    textClass: 'text-cyan-100',
  },
  direcao: {
    label: 'Direção / Ação',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    badgeText: 'text-purple-300',
    borderClass: 'border-l-4 border-purple-400 pl-3 italic opacity-85',
    textClass: 'text-purple-200 italic',
  },
  default: {
    label: 'Locutor',
    badgeBg: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    badgeText: 'text-zinc-300',
    borderClass: 'border-l-4 border-zinc-500 pl-3',
    textClass: 'text-zinc-200',
  },
};

export function getSpeakerStyle(speakerTag: string): SpeakerStyle {
  const norm = speakerTag.toLowerCase().trim();
  if (norm.includes('host') || norm.includes('apresentador')) return SPEAKER_STYLES.host;
  if (norm.includes('convidado') || norm.includes('guest') || norm.includes('entrevistado')) return SPEAKER_STYLES.convidado;
  if (norm.includes('narrador') || norm.includes('voz off')) return SPEAKER_STYLES.narrador;
  if (norm.includes('direção') || norm.includes('direcao') || norm.includes('pausa') || norm.includes('acao')) return SPEAKER_STYLES.direcao;
  return SPEAKER_STYLES.default;
}


export const SAMPLE_SCRIPTS: ScriptItem[] = [
  {
    id: 'script-sample-1',
    title: 'Pitch de Vendas & Apresentação de Impacto',
    lastModified: Date.now() - 3600000,
    content: `Olá a todos e sejam muito bem-vindos!

Hoje vou revelar a vocês um dos segredos mais valiosos para comunicar com clareza, autoridade e magnetismo diante de qualquer público ou câmera.

[PAUSA - Respire fundo e faça contato visual]

Quantas vezes você já começou a gravar um vídeo importante e travou na primeira frase? Ou sentiu que perdeu o fio da meada no meio da explicação?

Isso acontece com mais de 80% dos profissionais e criadores de conteúdo.

A verdade é que a nossa mente trabalha em múltiplos fluxos simultâneos. Quando você tenta decorar um texto inteiro palavra por palavra, a tensão muscular aumenta e a naturalidade da sua voz desaparece.

É exatamente aqui que entra a técnica do teleprompter profissional.

Com este aplicativo, seu roteiro rola de forma contínua e suave, perfeitamente sincronizado com o seu ritmo de fala.

Você pode ajustar a velocidade pelas setas do teclado, aumentar o tamanho do texto para ler confortavelmente a metros de distância e até mesmo usar espelhamento óptico para câmeras profissionais.

[PAUSA - Tom entusiasmado]

Nos próximos minutos, prepare seu roteiro, ajuste a velocidade ideal e sinta a diferença de gravar seus vídeos com 100% de confiança e sem nenhum corte desnecessário.

Muito obrigado pela atenção de todos, e um excelente trabalho!`,
  },
  {
    id: 'script-sample-2',
    title: 'Podcast & Entrevista com Multi-Locutores',
    lastModified: Date.now() - 7200000,
    content: `[SEÇÃO: Introdução do Podcast]
[HOST] Muito boa noite, ouvintes e espectadores de todo o Brasil!
Está no ar mais uma edição inédita do nosso podcast sobre tecnologia, inteligência artificial e criação de conteúdo.

[DIREÇÃO: Olhar direto para a câmera 1 e sorrir]

[SEÇÃO: Apresentação do Convidado]
[HOST] Hoje tenho a honra de receber um dos maiores especialistas em edição e produção de mídia da atualidade. Seja muito bem-vindo ao nosso estúdio!

[CONVIDADO] Muito obrigado pelo convite! É um enorme prazer estar aqui para compartilhar as melhores práticas com essa audiência incrível.

[SEÇÃO: Pergunta Principal]
[HOST] Para abrir nossa discussão: qual é a dica número um para quem quer gravar sem gaguejar e com olhar 100% natural?

[CONVIDADO] A chave é dividir o pensamento em blocos, manter o teleprompter alinhado com a lente da câmera e falar no ritmo natural da sua respiração.

[DIREÇÃO: Transição para vinheta rápida]`,
  },
  {
    id: 'script-sample-3',
    title: 'Vídeo Educativo / Aula Curta',
    lastModified: Date.now() - 10800000,
    content: `Bem-vindos à nossa aula rápida de hoje!

O tópico de estudo desta semana é a organização da comunicação em 3 pilares fundamentais: Gancho, Desenvolvimento e Conclusão.

1. Primeiro pilar: O Gancho. Nos primeiros 5 segundos, você precisa responder à pergunta mental do espectador: "Por que eu deveria me importar com isso agora?".

2. Segundo pilar: O Desenvolvimento. Entregue exatamente aquilo que prometeu, usando exemplos do cotidiano e evitando jargões técnicos sem explicação.

3. Terceiro pilar: A Conclusão e Chamada para Ação. Resuma em uma frase o aprendizado principal e convide o aluno para praticar o exercício proposto.

Pratique a leitura deste roteiro mantendo um tom conversacional e pausado.

Bons estudos e até a próxima aula!`,
  },
];
