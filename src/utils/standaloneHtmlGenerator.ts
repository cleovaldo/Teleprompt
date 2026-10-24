/**
 * Generates a complete, single-file standalone HTML/CSS/JS teleprompter
 * that can be saved as `teleprompter.html` and opened locally in any browser offline.
 */
export function generateStandaloneTeleprompterHtml(initialScriptTitle?: string, initialScriptContent?: string): string {
  const safeTitle = (initialScriptTitle || 'Meu Roteiro de Teleprompter').replace(/"/g, '&quot;');
  const safeContent = JSON.stringify(initialScriptContent || `Olá a todos e sejam muito bem-vindos!

Hoje vou revelar a vocês um dos segredos mais valiosos para comunicar com clareza, autoridade e magnetismo diante de qualquer público ou câmera.

[PAUSA - Respire fundo e faça contato visual]

Com este aplicativo, seu roteiro rola de forma contínua e suave, perfeitamente sincronizado com o seu ritmo de fala.

Você pode ajustar a velocidade pelas setas do teclado, aumentar o tamanho do texto para ler confortavelmente a metros de distância e até mesmo usar espelhamento óptico para câmeras profissionais.`);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Teleprompter Pro Studio - 100% Offline</title>
  <meta name="description" content="Teleprompter Profissional gratuito, responsivo e focado em privacidade que roda 100% no navegador sem servidores.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg-oled: #000000;
      --card-bg: #121216;
      --border-color: #27272a;
      --text-white: #ffffff;
      --text-yellow: #fde047;
      --text-green: #4ade80;
      --text-cyan: #38bdf8;
    }
    body {
      background: var(--bg-oled);
      color: #ffffff;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
      user-select: none;
    }
    textarea, input, select {
      user-select: text;
      font-family: inherit;
    }
    /* Mode views */
    .view-mode { display: none; }
    .view-mode.active { display: flex; flex-direction: column; }

    /* Custom scrollbars */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #09090b; }
    ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #3f3f46; }

    /* Prompter text container */
    #prompterViewport {
      position: relative;
      width: 100vw;
      height: 100vh;
      overflow-y: scroll;
      overflow-x: hidden;
      scroll-behavior: auto;
      background: #000000;
    }
    #prompterViewport::-webkit-scrollbar { display: none; }
    #prompterViewport { -ms-overflow-style: none; scrollbar-width: none; }

    #prompterText {
      will-change: transform;
      padding-top: 40vh;
      padding-bottom: 75vh;
      margin: 0 auto;
      line-height: 1.6;
      transition: color 0.2s, font-size 0.1s;
      cursor: pointer;
    }

    /* Mirroring */
    .mirror-h { transform: scaleX(-1); }
    .mirror-v { transform: scaleY(-1); }
    .mirror-both { transform: scale(-1, -1); }

    /* Reading eyeline guide */
    .eyeline-guide {
      position: fixed;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(250, 204, 21, 0.8) 15%, rgba(250, 204, 21, 0.9) 50%, rgba(250, 204, 21, 0.8) 85%, transparent);
      box-shadow: 0 0 16px rgba(250, 204, 21, 0.4);
      pointer-events: none;
      z-index: 50;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .eyeline-guide::before, .eyeline-guide::after {
      content: '▶';
      color: #facc15;
      font-size: 16px;
      padding: 0 12px;
      text-shadow: 0 0 8px rgba(250, 204, 21, 0.6);
    }
    .eyeline-guide::after { content: '◀'; }

    /* Controls overlay */
    #floatingControls {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(18, 18, 22, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 9999px;
      padding: 8px 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      z-index: 100;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    @media (max-width: 640px) {
      #floatingControls {
        bottom: 14px;
        padding: 6px 10px;
        gap: 6px;
        max-width: 96vw;
      }
      .slider-group {
        display: none;
      }
      .btn-ctrl {
        padding: 8px 10px !important;
        font-size: 11px !important;
        min-height: 40px;
      }
    }
    #floatingControls.fade-out {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
      pointer-events: none;
    }

    .btn-ctrl {
      background: #27272a;
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 9999px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .btn-ctrl:hover {
      background: #3f3f46;
      border-color: rgba(255, 255, 255, 0.25);
    }
    .btn-ctrl.btn-primary {
      background: #facc15;
      color: #000000;
      border-color: #facc15;
    }
    .btn-ctrl.btn-primary:hover {
      background: #fde047;
    }
    .btn-ctrl.active {
      background: #3b82f6;
      color: #ffffff;
      border-color: #60a5fa;
    }

    .slider-group {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #a1a1aa;
    }
    .slider-group input[type="range"] {
      cursor: pointer;
      accent-color: #facc15;
      width: 80px;
    }

    /* Paragraph hover in reading mode */
    .pro-paragraph {
      margin-bottom: 1.5em;
      transition: opacity 0.2s ease;
      border-radius: 4px;
      padding: 4px 8px;
    }
    .pro-paragraph:hover {
      background: rgba(255, 255, 255, 0.04);
    }
    .pro-pause {
      color: #ef4444;
      font-weight: 700;
      font-size: 0.8em;
      letter-spacing: 0.05em;
    }

    /* Countdown overlay */
    #countdownOverlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      z-index: 200;
      display: none;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    }
    #countdownNumber {
      font-size: 120px;
      font-weight: 800;
      color: #facc15;
      text-shadow: 0 0 30px rgba(250, 204, 21, 0.6);
      animation: pulse 1s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.15); opacity: 0.85; }
      100% { transform: scale(1); opacity: 1; }
    }
  </style>
</head>
<body>

  <!-- ==================== MODO EDIÇÃO ==================== -->
  <div id="editorMode" class="view-mode active" style="min-height: 100vh; padding: 24px; max-width: 1200px; margin: 0 auto;">
    <!-- Header -->
    <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 1px solid #27272a; padding-bottom: 16px;">
      <div>
        <h1 style="font-size: 22px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
          <span style="color: #facc15;">●</span> Teleprompter Pro Studio
        </h1>
        <p style="font-size: 13px; color: #a1a1aa; margin-top: 4px;">Executado 100% localmente no navegador • Privacidade Absoluta</p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button id="btnStartPrompterTop" class="btn-ctrl btn-primary" style="padding: 10px 20px; font-size: 15px;">
          ▶ Iniciar Teleprompter (Espaço)
        </button>
      </div>
    </header>

    <!-- Metrics Bar -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px;">
      <div style="background: #18181b; border: 1px solid #27272a; padding: 12px 16px; border-radius: 8px;">
        <div style="font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: 600;">Palavras</div>
        <div id="metricWords" style="font-size: 24px; font-weight: 700; color: #facc15; font-family: 'JetBrains Mono', monospace;">0</div>
      </div>
      <div style="background: #18181b; border: 1px solid #27272a; padding: 12px 16px; border-radius: 8px;">
        <div style="font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: 600;">Caracteres</div>
        <div id="metricChars" style="font-size: 24px; font-weight: 700; color: #ffffff; font-family: 'JetBrains Mono', monospace;">0</div>
      </div>
      <div style="background: #18181b; border: 1px solid #27272a; padding: 12px 16px; border-radius: 8px;">
        <div style="font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: 600;">Tempo Estimado (130 WPM)</div>
        <div id="metricTime" style="font-size: 24px; font-weight: 700; color: #4ade80; font-family: 'JetBrains Mono', monospace;">00:00</div>
      </div>
      <div style="background: #18181b; border: 1px solid #27272a; padding: 12px 16px; border-radius: 8px;">
        <div style="font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: 600;">Status do Armazenamento</div>
        <div style="font-size: 14px; font-weight: 600; color: #38bdf8; margin-top: 6px;">✓ Salvo no LocalStorage</div>
      </div>
    </div>

    <!-- Script Title & Editor -->
    <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
      <input type="text" id="scriptTitleInput" value="${safeTitle}" style="background: #18181b; border: 1px solid #27272a; color: #ffffff; padding: 12px 16px; border-radius: 8px; font-size: 18px; font-weight: 700; outline: none;" placeholder="Título do Roteiro...">
      
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button id="btnInsertPause" class="btn-ctrl" type="button">+ Inserir [PAUSA]</button>
        <button id="btnSamplePitch" class="btn-ctrl" type="button">Exemplo: Pitch</button>
        <button id="btnSamplePodcast" class="btn-ctrl" type="button">Exemplo: Podcast</button>
        <button id="btnClearScript" class="btn-ctrl" type="button" style="color: #f87171;">Limpar Texto</button>
      </div>

      <textarea id="scriptTextarea" style="width: 100%; min-height: 400px; background: #0c0c0e; border: 1px solid #27272a; color: #f4f4f5; padding: 20px; border-radius: 8px; font-size: 17px; line-height: 1.7; resize: vertical; outline: none;"></textarea>
    </div>

    <!-- Quick Settings Accordion -->
    <div style="background: #121216; border: 1px solid #27272a; border-radius: 8px; padding: 18px; margin-bottom: 30px;">
      <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 14px; color: #f4f4f5;">Configurações Padrão de Leitura</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
        <div>
          <label style="font-size: 12px; color: #a1a1aa; display: block; margin-bottom: 6px;">Cor do Texto no Fundo Preto</label>
          <select id="settingColor" style="width: 100%; background: #1f1f23; color: #fff; border: 1px solid #333; padding: 8px; border-radius: 6px;">
            <option value="yellow" selected>Amarelo Pro (#FDE047)</option>
            <option value="white">Branco Studio (#FFFFFF)</option>
            <option value="green">Verde Neon (#4ADE80)</option>
            <option value="cyan">Ciano (#38BDF8)</option>
          </select>
        </div>
        <div>
          <label style="font-size: 12px; color: #a1a1aa; display: block; margin-bottom: 6px;">Tamanho Inicial da Fonte (<span id="lblFontSize">52</span>px)</label>
          <input type="range" id="settingFontSize" min="28" max="110" value="52" style="width: 100%; accent-color: #facc15;">
        </div>
        <div>
          <label style="font-size: 12px; color: #a1a1aa; display: block; margin-bottom: 6px;">Velocidade Inicial (<span id="lblSpeed">4</span>)</label>
          <input type="range" id="settingSpeed" min="1" max="18" value="4" style="width: 100%; accent-color: #facc15;">
        </div>
        <div>
          <label style="font-size: 12px; color: #a1a1aa; display: block; margin-bottom: 6px;">Largura da Coluna (<span id="lblMargin">70</span>%)</label>
          <input type="range" id="settingMargin" min="40" max="95" value="70" style="width: 100%; accent-color: #facc15;">
        </div>
        <div style="grid-column: span 2;">
          <label style="font-size: 12px; color: #a1a1aa; display: block; margin-bottom: 6px;">Alinhamento da Câmera (Foco do Olhar)</label>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn-ctrl" id="btnAlignLeft" style="flex: 1; justify-content: center;">◧ Esquerda</button>
            <button type="button" class="btn-ctrl active" id="btnAlignCenter" style="flex: 1; justify-content: center;">◨ Centro</button>
            <button type="button" class="btn-ctrl" id="btnAlignRight" style="flex: 1; justify-content: center;">◨ Direita</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== MODO APRESENTAÇÃO (TELEPROMPTER) ==================== -->
  <div id="prompterMode" class="view-mode" style="position: fixed; inset: 0; background: #000000; z-index: 50;">
    
    <!-- Linha Guia do Olhar -->
    <div id="eyelineGuide" class="eyeline-guide" style="top: 35%;"></div>

    <!-- Viewport com texto com rolagem suave -->
    <div id="prompterViewport">
      <div id="prompterText" style="max-width: 70%; font-size: 52px; color: #fde047;"></div>
    </div>

    <!-- Câmera PIP Flutuante -->
    <div id="cameraPipContainer" style="display: none; position: fixed; top: 16px; left: 50%; transform: translateX(-50%); width: 220px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2); background: #111; z-index: 60; box-shadow: 0 10px 25px rgba(0,0,0,0.8);">
      <div style="background: rgba(0,0,0,0.8); padding: 4px 8px; font-size: 11px; display: flex; justify-content: space-between; align-items: center; color: #fff;">
        <span id="pipRecBadge" style="color: #ef4444; font-weight: bold;">● REC 00:00</span>
        <button id="btnClosePip" style="background: none; border: none; color: #aaa; cursor: pointer; font-size: 13px;">✕</button>
      </div>
      <video id="cameraPipVideo" autoplay playsinline muted style="width: 100%; aspect-ratio: 16/9; object-fit: cover; transform: scaleX(-1); background: #000;"></video>
    </div>

    <!-- Barra de Controle Flutuante -->
    <div id="floatingControls">
      <button id="btnExitPrompter" class="btn-ctrl" title="Voltar para Edição (Esc)">⟵ Sair</button>
      
      <button id="btnPlayPause" class="btn-ctrl btn-primary" title="Iniciar/Pausar (Espaço)">
        <span id="playPauseIcon">▶</span> <span id="playPauseText">Play</span>
      </button>

      <!-- Botão Gravar Vídeo -->
      <button id="btnRecordVideo" class="btn-ctrl" style="background: #dc2626; color: #ffffff; border-color: #ef4444;" title="Iniciar / Parar Gravação de Vídeo">
        <span id="recordDot">●</span> <span id="recordText">Gravar</span>
      </button>

      <!-- Botão Modo YouTube (Horizontal) -->
      <button id="btnToggleDirection" class="btn-ctrl" title="Alternar Rolagem Vertical ↕ / Letreiro Horizontal ↔ YouTube (O)">
        ↔ YouTube
      </button>

      <!-- Botão Alinhamento com a Câmera -->
      <button id="btnCameraAlign" class="btn-ctrl" title="Alternar Alinhamento com a Câmera: Esquerda / Centro / Direita (L)">
        ◨ Centro
      </button>

      <button id="btnRestart" class="btn-ctrl" title="Reiniciar do topo (R)">↺ Início</button>

      <div class="slider-group">
        <span>Velocidade</span>
        <input type="range" id="liveSpeed" min="1" max="18" value="4">
        <span id="liveSpeedVal" style="font-family: monospace; font-weight: bold; width: 18px;">4</span>
      </div>

      <div class="slider-group">
        <span>Fonte</span>
        <input type="range" id="liveFontSize" min="28" max="110" value="52">
        <span id="liveFontSizeVal" style="font-family: monospace; font-weight: bold; width: 26px;">52</span>
      </div>

      <button id="btnFlipH" class="btn-ctrl" title="Espelhamento Horizontal para teleprompter com espelho">⇄ Flip H</button>
      <button id="btnFlipV" class="btn-ctrl" title="Espelhamento Vertical">⇅ Flip V</button>
      <button id="btnToggleVoice" class="btn-ctrl" title="Acompanhamento por Voz (Microfone)">🎙️ Voz</button>
      <button id="btnFullscreen" class="btn-ctrl" title="Tela Cheia (F)">⛶ Tela Cheia</button>
    </div>

    <!-- Countdown Overlay -->
    <div id="countdownOverlay">
      <div style="font-size: 16px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Gravando em</div>
      <div id="countdownNumber">3</div>
      <div style="font-size: 13px; color: #71717a; margin-top: 16px;">Pressione [Espaço] para iniciar imediatamente</div>
    </div>
  </div>

  <script>
    (function() {
      // Estado da Aplicação
      let isPlaying = false;
      let scrollSpeed = 4;
      let fontSize = 52;
      let marginWidth = 70;
      let colorTheme = 'yellow';
      let flipH = false;
      let flipV = false;
      let isHorizontal = false;
      let isVoiceActive = false;
      let cameraAlign = 'center';
      let horizontalOffset = 50;
      let animationFrameId = null;
      let currentScrollY = 0;
      let currentScrollX = 0;
      let hideControlsTimeout = null;
      let recognition = null;

      // Elementos do DOM
      const editorMode = document.getElementById('editorMode');
      const prompterMode = document.getElementById('prompterMode');
      const scriptTextarea = document.getElementById('scriptTextarea');
      const scriptTitleInput = document.getElementById('scriptTitleInput');
      const prompterViewport = document.getElementById('prompterViewport');
      const prompterText = document.getElementById('prompterText');
      const floatingControls = document.getElementById('floatingControls');
      const eyelineGuide = document.getElementById('eyelineGuide');
      const countdownOverlay = document.getElementById('countdownOverlay');
      const countdownNumber = document.getElementById('countdownNumber');

      const btnPlayPause = document.getElementById('btnPlayPause');
      const playPauseIcon = document.getElementById('playPauseIcon');
      const playPauseText = document.getElementById('playPauseText');
      const btnRestart = document.getElementById('btnRestart');
      const btnExitPrompter = document.getElementById('btnExitPrompter');
      const btnStartPrompterTop = document.getElementById('btnStartPrompterTop');
      const btnFlipH = document.getElementById('btnFlipH');
      const btnFlipV = document.getElementById('btnFlipV');
      const btnToggleVoice = document.getElementById('btnToggleVoice');
      const btnFullscreen = document.getElementById('btnFullscreen');
      const btnRecordVideo = document.getElementById('btnRecordVideo');
      const btnToggleDirection = document.getElementById('btnToggleDirection');
      const btnCameraAlign = document.getElementById('btnCameraAlign');
      const btnAlignLeft = document.getElementById('btnAlignLeft');
      const btnAlignCenter = document.getElementById('btnAlignCenter');
      const btnAlignRight = document.getElementById('btnAlignRight');
      const recordDot = document.getElementById('recordDot');
      const recordText = document.getElementById('recordText');
      const cameraPipContainer = document.getElementById('cameraPipContainer');
      const cameraPipVideo = document.getElementById('cameraPipVideo');
      const pipRecBadge = document.getElementById('pipRecBadge');
      const btnClosePip = document.getElementById('btnClosePip');

      let isRecordingVideo = false;
      let mediaRecorder = null;
      let recordedChunks = [];
      let cameraStream = null;
      let recDurationSeconds = 0;
      let recDurationInterval = null;

      const liveSpeed = document.getElementById('liveSpeed');
      const liveSpeedVal = document.getElementById('liveSpeedVal');
      const liveFontSize = document.getElementById('liveFontSize');
      const liveFontSizeVal = document.getElementById('liveFontSizeVal');

      const metricWords = document.getElementById('metricWords');
      const metricChars = document.getElementById('metricChars');
      const metricTime = document.getElementById('metricTime');

      // Inicialização do Script
      const initialContent = ${safeContent};
      const savedScript = localStorage.getItem('prompter_pro_script') || initialContent;
      const savedTitle = localStorage.getItem('prompter_pro_title') || '${safeTitle}';
      
      scriptTextarea.value = savedScript;
      scriptTitleInput.value = savedTitle;

      // Carregar preferências
      try {
        const savedPrefs = JSON.parse(localStorage.getItem('prompter_pro_prefs') || '{}');
        if (savedPrefs.speed) scrollSpeed = savedPrefs.speed;
        if (savedPrefs.fontSize) fontSize = savedPrefs.fontSize;
        if (savedPrefs.marginWidth) marginWidth = savedPrefs.marginWidth;
        if (savedPrefs.colorTheme) colorTheme = savedPrefs.colorTheme;
        if (savedPrefs.flipH !== undefined) flipH = savedPrefs.flipH;
        if (savedPrefs.flipV !== undefined) flipV = savedPrefs.flipV;
      } catch (e) {}

      // Atualizar interface de configurações
      document.getElementById('settingFontSize').value = fontSize;
      document.getElementById('lblFontSize').textContent = fontSize;
      document.getElementById('settingSpeed').value = scrollSpeed;
      document.getElementById('lblSpeed').textContent = scrollSpeed;
      document.getElementById('settingMargin').value = marginWidth;
      document.getElementById('lblMargin').textContent = marginWidth;
      document.getElementById('settingColor').value = colorTheme;

      liveSpeed.value = scrollSpeed;
      liveSpeedVal.textContent = scrollSpeed;
      liveFontSize.value = fontSize;
      liveFontSizeVal.textContent = fontSize;

      function updateMetrics() {
        const text = scriptTextarea.value.trim();
        const words = text ? text.split(/\\s+/).length : 0;
        const chars = text.length;
        const minutes = words / 130;
        const min = Math.floor(minutes);
        const sec = Math.floor((minutes - min) * 60);

        metricWords.textContent = words.toLocaleString('pt-BR');
        metricChars.textContent = chars.toLocaleString('pt-BR');
        metricTime.textContent = String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');

        localStorage.setItem('prompter_pro_script', scriptTextarea.value);
        localStorage.setItem('prompter_pro_title', scriptTitleInput.value);
      }

      function savePreferences() {
        localStorage.setItem('prompter_pro_prefs', JSON.stringify({
          speed: scrollSpeed,
          fontSize: fontSize,
          marginWidth: marginWidth,
          colorTheme: colorTheme,
          flipH: flipH,
          flipV: flipV
        }));
      }

      scriptTextarea.addEventListener('input', updateMetrics);
      scriptTitleInput.addEventListener('input', updateMetrics);
      updateMetrics();

      // Renderizar texto no teleprompter com destaque para [PAUSAS]
      function renderPrompterText() {
        const lines = scriptTextarea.value.split('\\n');
        let html = '';
        lines.forEach((line, idx) => {
          if (!line.trim()) {
            html += isHorizontal ? '<span style="display:inline-block; width: 30px;"></span>' : '<div style="height: 1.2em;"></div>';
          } else {
            const formatted = line.replace(/\\[PAUSA([^\\]]*)\\]/gi, '<span class="pro-pause">[PAUSA$1]</span>');
            if (isHorizontal) {
              html += '<span class="pro-paragraph" style="display: inline-block; margin-right: 48px; cursor: pointer; white-space: nowrap;" data-idx="' + idx + '">' + formatted + '</span>';
            } else {
              html += '<div class="pro-paragraph" data-idx="' + idx + '">' + formatted + '</div>';
            }
          }
        });
        prompterText.innerHTML = html;

        if (isHorizontal) {
          prompterViewport.style.overflowX = 'scroll';
          prompterViewport.style.overflowY = 'hidden';
          prompterViewport.style.display = 'flex';
          prompterViewport.style.alignItems = 'flex-start';
          prompterText.style.display = 'flex';
          prompterText.style.flexDirection = 'row';
          prompterText.style.whiteSpace = 'nowrap';
          prompterText.style.paddingLeft = '50vw';
          prompterText.style.paddingRight = '100vw';
          prompterText.style.paddingTop = '18vh';
          prompterText.style.maxWidth = 'none';
          eyelineGuide.style.display = 'none';
        } else {
          prompterViewport.style.overflowX = 'hidden';
          prompterViewport.style.overflowY = 'scroll';
          prompterViewport.style.display = 'block';
          prompterText.style.display = 'block';
          prompterText.style.whiteSpace = 'normal';
          prompterText.style.paddingLeft = '0';
          prompterText.style.paddingRight = '0';
          prompterText.style.paddingTop = '40vh';
          prompterText.style.maxWidth = marginWidth + '%';
          eyelineGuide.style.display = 'flex';
        }

        applyStyles();

        // Clique em parágrafo para saltar
        const paras = prompterText.querySelectorAll('.pro-paragraph');
        paras.forEach(p => {
          p.addEventListener('click', (e) => {
            if (isHorizontal) {
              currentScrollX = p.offsetLeft - (window.innerWidth / 2) + (p.offsetWidth / 2);
              prompterViewport.scrollLeft = Math.max(0, currentScrollX);
            } else {
              currentScrollY = p.offsetTop - (window.innerHeight * 0.35);
              prompterViewport.scrollTop = Math.max(0, currentScrollY);
            }
          });
        });
      }

      function applyStyles() {
        prompterText.style.fontSize = fontSize + 'px';
        if (!isHorizontal) {
          const availableSpace = Math.max(0, 100 - marginWidth);
          const colMarginLeft = (availableSpace * horizontalOffset) / 100;
          prompterText.style.marginLeft = colMarginLeft + '%';
          prompterText.style.maxWidth = marginWidth + '%';
          prompterText.style.textAlign = cameraAlign;
        } else {
          prompterText.style.marginLeft = '0';
          prompterText.style.paddingLeft = horizontalOffset + 'vw';
        }

        const colorMap = {
          yellow: '#fde047',
          white: '#ffffff',
          green: '#4ade80',
          cyan: '#38bdf8'
        };
        prompterText.style.color = colorMap[colorTheme] || '#fde047';

        // Flip classes
        let transformStr = '';
        if (flipH && flipV) transformStr = 'scale(-1, -1)';
        else if (flipH) transformStr = 'scaleX(-1)';
        else if (flipV) transformStr = 'scaleY(-1)';
        prompterText.style.transform = transformStr;

        btnFlipH.classList.toggle('active', flipH);
        btnFlipV.classList.toggle('active', flipV);
      }

      // Loop de Rolagem Suave com requestAnimationFrame
      let lastTimestamp = 0;
      function prompterScrollLoop(timestamp) {
        if (!isPlaying) return;

        if (!lastTimestamp) lastTimestamp = timestamp;
        const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
        lastTimestamp = timestamp;

        if (isHorizontal) {
          const pixelsPerSec = scrollSpeed * 30;
          currentScrollX += pixelsPerSec * delta;
          prompterViewport.scrollLeft = currentScrollX;
          if (prompterViewport.scrollLeft + prompterViewport.clientWidth >= prompterViewport.scrollWidth - 50) {
            pausePrompter();
            return;
          }
        } else {
          // Velocidade suave vertical
          const pixelsPerSec = scrollSpeed * 18;
          currentScrollY += pixelsPerSec * delta;
          prompterViewport.scrollTop = currentScrollY;

          // Se atingir o fim da página
          if (prompterViewport.scrollTop + prompterViewport.clientHeight >= prompterViewport.scrollHeight - 50) {
            pausePrompter();
            return;
          }
        }

        animationFrameId = requestAnimationFrame(prompterScrollLoop);
      }

      function playPrompter() {
        isPlaying = true;
        playPauseIcon.textContent = '❚❚';
        playPauseText.textContent = 'Pausar';
        btnPlayPause.style.background = '#eab308';
        lastTimestamp = 0;
        if (isHorizontal) {
          currentScrollX = prompterViewport.scrollLeft;
        } else {
          currentScrollY = prompterViewport.scrollTop;
        }
        animationFrameId = requestAnimationFrame(prompterScrollLoop);
        resetAutoHideTimer();
      }

      function pausePrompter() {
        isPlaying = false;
        playPauseIcon.textContent = '▶';
        playPauseText.textContent = 'Play';
        btnPlayPause.style.background = '#facc15';
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        showControls();
      }

      function togglePlayPause() {
        if (isPlaying) pausePrompter();
        else playPrompter();
      }

      function restartPrompter() {
        pausePrompter();
        currentScrollY = 0;
        currentScrollX = 0;
        prompterViewport.scrollTop = 0;
        prompterViewport.scrollLeft = 0;
      }

      function startCountdown(onComplete) {
        countdownOverlay.style.display = 'flex';
        let count = 3;
        countdownNumber.textContent = count;

        const interval = setInterval(() => {
          count--;
          if (count > 0) {
            countdownNumber.textContent = count;
          } else {
            clearInterval(interval);
            countdownOverlay.style.display = 'none';
            onComplete();
          }
        }, 1000);

        function skipCountdown(e) {
          if (e.code === 'Space') {
            clearInterval(interval);
            countdownOverlay.style.display = 'none';
            window.removeEventListener('keydown', skipCountdown);
            onComplete();
          }
        }
        window.addEventListener('keydown', skipCountdown);
      }

      function enterPrompter() {
        editorMode.classList.remove('active');
        prompterMode.classList.add('active');
        renderPrompterText();
        restartPrompter();

        startCountdown(() => {
          playPrompter();
        });
      }

      function exitPrompter() {
        pausePrompter();
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        prompterMode.classList.remove('active');
        editorMode.classList.add('active');
      }

      // Auto-hide controls
      function resetAutoHideTimer() {
        showControls();
        if (hideControlsTimeout) clearTimeout(hideControlsTimeout);
        if (isPlaying) {
          hideControlsTimeout = setTimeout(() => {
            floatingControls.classList.add('fade-out');
          }, 2500);
        }
      }

      function showControls() {
        floatingControls.classList.remove('fade-out');
      }

      window.addEventListener('mousemove', () => {
        if (prompterMode.classList.contains('active')) {
          resetAutoHideTimer();
        }
      });

      // Controles de velocidade e fonte
      liveSpeed.addEventListener('input', (e) => {
        scrollSpeed = parseInt(e.target.value, 10);
        liveSpeedVal.textContent = scrollSpeed;
        savePreferences();
      });

      liveFontSize.addEventListener('input', (e) => {
        fontSize = parseInt(e.target.value, 10);
        liveFontSizeVal.textContent = fontSize;
        applyStyles();
        savePreferences();
      });

      document.getElementById('settingFontSize').addEventListener('input', (e) => {
        fontSize = parseInt(e.target.value, 10);
        document.getElementById('lblFontSize').textContent = fontSize;
        liveFontSize.value = fontSize;
        liveFontSizeVal.textContent = fontSize;
        savePreferences();
      });

      document.getElementById('settingSpeed').addEventListener('input', (e) => {
        scrollSpeed = parseInt(e.target.value, 10);
        document.getElementById('lblSpeed').textContent = scrollSpeed;
        liveSpeed.value = scrollSpeed;
        liveSpeedVal.textContent = scrollSpeed;
        savePreferences();
      });

      document.getElementById('settingMargin').addEventListener('input', (e) => {
        marginWidth = parseInt(e.target.value, 10);
        document.getElementById('lblMargin').textContent = marginWidth;
        applyStyles();
        savePreferences();
      });

      document.getElementById('settingColor').addEventListener('change', (e) => {
        colorTheme = e.target.value;
        applyStyles();
        savePreferences();
      });

      // Botões de Espelhamento
      btnFlipH.addEventListener('click', () => {
        flipH = !flipH;
        applyStyles();
        savePreferences();
      });

      btnFlipV.addEventListener('click', () => {
        flipV = !flipV;
        applyStyles();
        savePreferences();
      });

      // Botão Tela Cheia
      btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });

      // Suporte a Reconhecimento de Voz (Web Speech API)
      const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechAPI) {
        recognition = new SpeechAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        recognition.onresult = (evt) => {
          let phrase = '';
          for (let i = evt.resultIndex; i < evt.results.length; i++) {
            phrase += evt.results[i][0].transcript;
          }
          const words = phrase.toLowerCase().trim().split(/\\s+/);
          if (words.length > 0) {
            const lastWord = words[words.length - 1];
            if (lastWord.length >= 4) {
              const full = scriptTextarea.value.toLowerCase();
              const idx = full.indexOf(lastWord);
              if (idx !== -1) {
                const ratio = idx / full.length;
                currentScrollY = ratio * (prompterViewport.scrollHeight - window.innerHeight);
                prompterViewport.scrollTop = currentScrollY;
              }
            }
          }
        };

        btnToggleVoice.addEventListener('click', () => {
          isVoiceActive = !isVoiceActive;
          btnToggleVoice.classList.toggle('active', isVoiceActive);
          if (isVoiceActive) {
            try { recognition.start(); } catch (e) {}
          } else {
            try { recognition.stop(); } catch (e) {}
          }
        });
      } else {
        btnToggleVoice.style.display = 'none';
      }

      // Gravação de Vídeo pela Webcam (MediaRecorder)
      async function startVideoRecording() {
        try {
          if (!cameraStream) {
            cameraStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'user', width: { ideal: 1920 } },
              audio: true
            });
            cameraPipVideo.srcObject = cameraStream;
          }
          cameraPipContainer.style.display = 'block';

          recordedChunks = [];
          const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
          mediaRecorder = new MediaRecorder(cameraStream, { mimeType: mime });

          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) recordedChunks.push(e.data);
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'gravacao_teleprompter_' + Date.now() + '.webm';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          };

          mediaRecorder.start(1000);
          isRecordingVideo = true;
          recDurationSeconds = 0;
          recordDot.textContent = '■';
          recordText.textContent = 'REC 00:00';
          btnRecordVideo.style.background = '#991b1b';

          if (recDurationInterval) clearInterval(recDurationInterval);
          recDurationInterval = setInterval(() => {
            recDurationSeconds++;
            const m = String(Math.floor(recDurationSeconds / 60)).padStart(2, '0');
            const s = String(recDurationSeconds % 60).padStart(2, '0');
            const timeStr = m + ':' + s;
            recordText.textContent = 'REC ' + timeStr;
            pipRecBadge.textContent = '● REC ' + timeStr;
          }, 1000);
        } catch (err) {
          alert('Erro ao acessar a câmera: ' + (err.message || 'Permissão negada'));
        }
      }

      function stopVideoRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        if (recDurationInterval) clearInterval(recDurationInterval);
        isRecordingVideo = false;
        recordDot.textContent = '●';
        recordText.textContent = 'Gravar';
        btnRecordVideo.style.background = '#dc2626';
      }

      btnRecordVideo.addEventListener('click', () => {
        if (isRecordingVideo) stopVideoRecording();
        else startVideoRecording();
      });

      btnClosePip.addEventListener('click', () => {
        cameraPipContainer.style.display = 'none';
      });

      // Atalhos de teclado
      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            enterPrompter();
          }
          return;
        }

        if (prompterMode.classList.contains('active')) {
          if (e.code === 'Space') {
            e.preventDefault();
            togglePlayPause();
          } else if (e.code === 'ArrowUp') {
            e.preventDefault();
            scrollSpeed = Math.min(18, scrollSpeed + 1);
            liveSpeed.value = scrollSpeed;
            liveSpeedVal.textContent = scrollSpeed;
            savePreferences();
          } else if (e.code === 'ArrowDown') {
            e.preventDefault();
            scrollSpeed = Math.max(1, scrollSpeed - 1);
            liveSpeed.value = scrollSpeed;
            liveSpeedVal.textContent = scrollSpeed;
            savePreferences();
          } else if (e.code === 'ArrowLeft') {
            if (isHorizontal) {
              currentScrollX = Math.max(0, currentScrollX - 100);
              prompterViewport.scrollLeft = currentScrollX;
            } else {
              currentScrollY = Math.max(0, currentScrollY - 80);
              prompterViewport.scrollTop = currentScrollY;
            }
          } else if (e.code === 'ArrowRight') {
            if (isHorizontal) {
              currentScrollX += 100;
              prompterViewport.scrollLeft = currentScrollX;
            } else {
              currentScrollY += 80;
              prompterViewport.scrollTop = currentScrollY;
            }
          } else if (e.key === 'o' || e.key === 'O') {
            btnToggleDirection.click();
          } else if (e.key === 'l' || e.key === 'L') {
            btnCameraAlign.click();
          } else if (e.key === 'f' || e.key === 'F') {
            btnFullscreen.click();
          } else if (e.key === 'r' || e.key === 'R') {
            restartPrompter();
          } else if (e.key === 'Escape') {
            exitPrompter();
          } else if (e.key === 'h' || e.key === 'H') {
            btnFlipH.click();
          }
        }
      });

      // Listeners principais
      function setCameraAlignment(align) {
        cameraAlign = align;
        horizontalOffset = align === 'left' ? 18 : align === 'right' ? 82 : 50;
        btnAlignLeft.classList.toggle('active', align === 'left');
        btnAlignCenter.classList.toggle('active', align === 'center');
        btnAlignRight.classList.toggle('active', align === 'right');
        btnCameraAlign.textContent = align === 'left' ? '◧ Esq' : align === 'right' ? '◨ Dir' : '◨ Centro';
        applyStyles();
      }

      btnAlignLeft.addEventListener('click', () => setCameraAlignment('left'));
      btnAlignCenter.addEventListener('click', () => setCameraAlignment('center'));
      btnAlignRight.addEventListener('click', () => setCameraAlignment('right'));
      btnCameraAlign.addEventListener('click', () => {
        const next = cameraAlign === 'left' ? 'center' : cameraAlign === 'center' ? 'right' : 'left';
        setCameraAlignment(next);
      });

      btnToggleDirection.addEventListener('click', () => {
        isHorizontal = !isHorizontal;
        btnToggleDirection.textContent = isHorizontal ? '↕ Vertical' : '↔ YouTube';
        btnToggleDirection.style.background = isHorizontal ? 'rgba(239, 68, 68, 0.3)' : '';
        btnToggleDirection.style.borderColor = isHorizontal ? '#ef4444' : '';
        btnToggleDirection.style.color = isHorizontal ? '#fca5a5' : '';
        renderPrompterText();
        restartPrompter();
      });

      btnStartPrompterTop.addEventListener('click', enterPrompter);
      btnPlayPause.addEventListener('click', togglePlayPause);
      btnRestart.addEventListener('click', restartPrompter);
      btnExitPrompter.addEventListener('click', exitPrompter);

      document.getElementById('btnInsertPause').addEventListener('click', () => {
        const ta = scriptTextarea;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const text = ta.value;
        const insert = '\\n[PAUSA - Respire 2s]\\n';
        ta.value = text.substring(0, start) + insert + text.substring(end);
        ta.focus();
        ta.selectionStart = ta.selectionEnd = start + insert.length;
        updateMetrics();
      });

      document.getElementById('btnClearScript').addEventListener('click', () => {
        if (confirm('Tem certeza de que deseja limpar o texto atual?')) {
          scriptTextarea.value = '';
          updateMetrics();
        }
      });
    })();
  </script>
</body>
</html>`;
}
