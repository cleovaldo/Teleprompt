import React, { useRef } from 'react';
import {
  Play,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Clock,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  Focus,
  Sliders,
  FileCode,
  Keyboard,
  ShieldCheck,
  Flame,
  FileText,
  RotateCcw,
} from 'lucide-react';
import {
  PrompterConfig,
  ScriptItem,
  COLOR_THEMES,
  TextColorTheme,
  SAMPLE_SCRIPTS,
} from '../types';
import { useVideoRecorder } from '../utils/useVideoRecorder';
import {
  Camera,
  Video,
  Circle,
  Radio,
  Smartphone,
  Target,
  Sparkles,
  Users,
  Bookmark,
  Volume2,
  Mic,
} from 'lucide-react';

interface EditorViewProps {
  currentScript: ScriptItem;
  savedScripts: ScriptItem[];
  config: PrompterConfig;
  onUpdateScript: (title: string, content: string) => void;
  onSelectScript: (scriptId: string) => void;
  onCreateScript: () => void;
  onDuplicateScript: () => void;
  onDeleteScript: (scriptId: string) => void;
  onUpdateConfig: (updated: Partial<PrompterConfig>) => void;
  onStartPrompter: () => void;
  onOpenShortcuts: () => void;
  onOpenStandaloneModal: () => void;
  onOpenRemoteModal: () => void;
  videoRecorder: ReturnType<typeof useVideoRecorder>;
  onOpenRecordedVideoModal: () => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  currentScript,
  savedScripts,
  config,
  onUpdateScript,
  onSelectScript,
  onCreateScript,
  onDuplicateScript,
  onDeleteScript,
  onUpdateConfig,
  onStartPrompter,
  onOpenShortcuts,
  onOpenStandaloneModal,
  onOpenRemoteModal,
  videoRecorder,
  onOpenRecordedVideoModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate real-time metrics
  const textContent = currentScript.content;
  const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const charCount = textContent.length;
  const readingMinutes = wordCount / (config.wordsPerMinute || 130);
  const min = Math.floor(readingMinutes);
  const sec = Math.floor((readingMinutes - min) * 60);
  const formattedTime = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

  // Insert helper into textarea at current cursor position
  const insertTextAtCursor = (insertion: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const current = currentScript.content;
    const newContent = current.substring(0, start) + insertion + current.substring(end);
    onUpdateScript(currentScript.title, newContent);

    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + insertion.length;
    }, 0);
  };

  // Export current script as .txt
  const handleExportTxt = () => {
    const blob = new Blob([currentScript.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentScript.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'roteiro'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import .txt or .md file
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        const titleFromFile = file.name.replace(/\.[^/.]+$/, '');
        onUpdateScript(titleFromFile, result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Bar Contract (1 row, 3 zones separated by gap) */}
      <header className="flex items-center justify-between gap-3 sm:gap-8 px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
        {/* Zone 1: Brand Wordmark (Single text element in display face) */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-400 flex items-center justify-center font-black text-black text-sm sm:text-base shadow-[0_0_15px_rgba(251,191,36,0.4)]">
            T
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-white">
            Teleprompter Pro
          </span>
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-zinc-400">
          {/* Smartphone Remote Control Trigger */}
          <button
            onClick={onOpenRemoteModal}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-400/30 flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(251,191,36,0.15)]"
            title="Conectar Celular como Controle Remoto sem Fio via QR Code"
          >
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-xs">Controle Celular (QR Code)</span>
          </button>

          <button
            onClick={onOpenShortcuts}
            className="hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs"
          >
            <Keyboard className="w-4 h-4 text-zinc-500" />
            Atalhos
          </button>
          <button
            onClick={onOpenStandaloneModal}
            className="hover:text-amber-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 text-amber-400/90 text-xs"
          >
            <FileCode className="w-4 h-4" />
            Baixar teleprompter.html
          </button>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Local & Privado</span>
          </div>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Smartphone Remote Trigger (Mobile / Tablet) */}
          <button
            onClick={onOpenRemoteModal}
            className="lg:hidden p-2 text-amber-400 hover:text-amber-300 bg-zinc-900 border border-zinc-800 rounded-lg min-w-[38px] min-h-[38px] flex items-center justify-center"
            title="Abrir Controle Remoto Celular via QR Code"
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {videoRecorder.recordedBlob && (
            <button
              onClick={onOpenRecordedVideoModal}
              className="px-2.5 sm:px-3.5 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 rounded-lg hover:bg-emerald-900/60 transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[38px]"
              title="Assistir e baixar o último vídeo gravado"
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Gravação</span>
            </button>
          )}

          {/* Quick Standalone download on mobile */}
          <button
            onClick={onOpenStandaloneModal}
            className="lg:hidden p-2 text-amber-400 hover:text-amber-300 bg-zinc-900 border border-zinc-800 rounded-lg min-w-[38px] min-h-[38px] flex items-center justify-center"
            title="Baixar teleprompter.html offline"
          >
            <FileCode className="w-4 h-4" />
          </button>

          {/* Record Video Button (Desktop) */}
          <button
            onClick={async () => {
              if (!videoRecorder.isCameraActive) {
                await videoRecorder.startCamera();
              }
              videoRecorder.setShowCameraPreview(true);
              onStartPrompter();
            }}
            className="hidden sm:flex px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 border border-red-500/80 rounded-lg transition-all items-center gap-1.5 whitespace-nowrap shadow-[0_0_15px_rgba(239,68,68,0.35)] min-h-[38px]"
            title="Abrir teleprompter com câmera e gravação ativadas"
          >
            <Circle className="w-3.5 h-3.5 fill-current text-white animate-pulse" />
            <span>Gravar Vídeo</span>
          </button>

          {/* Start Button */}
          <button
            onClick={onStartPrompter}
            className="px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs font-bold text-black bg-amber-400 rounded-lg hover:bg-amber-300 transition-all flex items-center gap-1.5 sm:gap-2 shadow-[0_0_20px_rgba(251,191,36,0.35)] hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] whitespace-nowrap shrink-0 min-h-[38px]"
            title="Iniciar o teleprompter em tela cheia (Ctrl+Enter)"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Iniciar</span>
            <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-black/20 text-black rounded font-mono font-semibold">
              Espaço
            </kbd>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 pb-28 sm:pb-8">
        {/* Real-time Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-xs font-medium text-zinc-400 block mb-1">Total de Palavras</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-white">
              {wordCount.toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-xs font-medium text-zinc-400 block mb-1">Caracteres</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-zinc-300">
              {charCount.toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-zinc-400">Tempo de Leitura</span>
              <span className="text-[10px] text-zinc-500 font-mono">{config.wordsPerMinute} WPM</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
                {formattedTime}
              </span>
              <span className="text-xs text-zinc-500">min:seg</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-xs font-medium text-zinc-400 block mb-1">Privacidade & Armazenamento</span>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-cyan-400">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Salvo no LocalStorage</span>
            </div>
          </div>
        </div>

        {/* Script Selector Bar & Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-zinc-500 uppercase font-semibold whitespace-nowrap pl-1">
              Roteiros:
            </span>
            <select
              value={currentScript.id}
              onChange={(e) => onSelectScript(e.target.value)}
              className="bg-zinc-900 border border-zinc-700/80 text-white text-xs font-semibold rounded-lg px-3 py-2 outline-none cursor-pointer max-w-[220px] truncate"
            >
              {savedScripts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title || 'Sem título'}
                </option>
              ))}
            </select>

            <button
              onClick={onCreateScript}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-white font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
              title="Criar novo roteiro em branco"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              Novo
            </button>

            <button
              onClick={onDuplicateScript}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
              title="Duplicar roteiro atual"
            >
              <Copy className="w-3.5 h-3.5" />
              Duplicar
            </button>

            {savedScripts.length > 1 && (
              <button
                onClick={() => onDeleteScript(currentScript.id)}
                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors"
                title="Excluir este roteiro"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 font-medium rounded-lg flex items-center gap-1.5 transition-colors"
              title="Importar arquivo de texto (.txt ou .md)"
            >
              <Upload className="w-3.5 h-3.5" />
              Importar (.txt/.md)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.doc"
              onChange={handleFileImport}
              className="hidden"
            />

            <button
              onClick={handleExportTxt}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 font-medium rounded-lg flex items-center gap-1.5 transition-colors"
              title="Exportar roteiro como arquivo de texto"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar (.txt)
            </button>
          </div>
        </div>

        {/* Editor Main Grid: Left is Text Editor, Right is Prompter Setup */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Writing Area (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Script Title Field */}
            <div>
              <input
                type="text"
                value={currentScript.title}
                onChange={(e) => onUpdateScript(e.target.value, currentScript.content)}
                placeholder="Título do seu Roteiro ou Discurso..."
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-lg font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400/80 transition-colors"
              />
            </div>

            {/* Quick Helper Toolbar for Speaking Markers & Multi-Speakers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-zinc-500 font-semibold flex items-center gap-1 mr-1">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    Locutores:
                  </span>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('\n[HOST] ')}
                    className="px-2.5 py-1 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 rounded-md font-semibold text-[11px] transition-colors"
                    title="Inserir fala do Host / Apresentador"
                  >
                    + [HOST]
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('\n[CONVIDADO] ')}
                    className="px-2.5 py-1 bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 rounded-md font-semibold text-[11px] transition-colors"
                    title="Inserir fala do Convidado / Entrevistado"
                  >
                    + [CONVIDADO]
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('\n[NARRADOR] ')}
                    className="px-2.5 py-1 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-300 rounded-md font-semibold text-[11px] transition-colors"
                    title="Inserir fala do Narrador"
                  >
                    + [NARRADOR]
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('\n[SEÇÃO: Título do Bloco]\n')}
                    className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-md font-semibold text-[11px] flex items-center gap-1 transition-colors"
                    title="Inserir marcador de capítulo / seção no roteiro"
                  >
                    <Bookmark className="w-3 h-3 text-indigo-400" />
                    + [SEÇÃO]
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('\n[DIREÇÃO: Olhar para câmera e respirar]\n')}
                    className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-400/30 text-purple-300 rounded-md font-semibold text-[11px] transition-colors"
                    title="Inserir direção de cena / ação silenciosa"
                  >
                    + [DIREÇÃO]
                  </button>
                </div>

                {/* Sample script helper */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-zinc-500">Exemplos:</span>
                  <button
                    onClick={() => onUpdateScript(SAMPLE_SCRIPTS[0].title, SAMPLE_SCRIPTS[0].content)}
                    className="px-2 py-0.5 text-xs text-zinc-400 hover:text-white bg-zinc-900 rounded border border-zinc-800"
                  >
                    Pitch
                  </button>
                  <button
                    onClick={() => onUpdateScript(SAMPLE_SCRIPTS[1].title, SAMPLE_SCRIPTS[1].content)}
                    className="px-2 py-0.5 text-xs text-amber-300 hover:text-white bg-amber-400/10 rounded border border-amber-400/30 font-semibold"
                  >
                    Entrevista
                  </button>
                </div>
              </div>

              {/* Secondary format actions */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <button
                  type="button"
                  onClick={() => insertTextAtCursor('\n[PAUSA - Respire 2s e olhe para a câmera]\n')}
                  className="px-3 py-1 bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 text-red-300 rounded-lg font-semibold flex items-center gap-1.5 transition-colors text-[11px]"
                  title="Inserir marcador de pausa para respiração"
                >
                  <Clock className="w-3 h-3 text-red-400" />
                  + [PAUSA]
                </button>
                <button
                  type="button"
                  onClick={() => insertTextAtCursor('\n\n')}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-[11px] font-medium transition-colors"
                >
                  + Parágrafo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ta = textareaRef.current;
                    if (!ta) return;
                    const start = ta.selectionStart;
                    const end = ta.selectionEnd;
                    if (start === end) return;
                    const selected = currentScript.content.substring(start, end);
                    insertTextAtCursor(selected.toUpperCase());
                  }}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-[11px] font-medium transition-colors"
                  title="Converter texto selecionado em MAIÚSCULAS para ênfase na fala"
                >
                  MAIÚSCULAS
                </button>
              </div>
            </div>

            {/* Writing Textarea */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={currentScript.content}
                onChange={(e) => onUpdateScript(currentScript.title, e.target.value)}
                placeholder="Cole ou digite aqui seu texto completo sem nenhuma limitação de tamanho..."
                rows={18}
                className="w-full p-5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 font-sans text-base leading-relaxed resize-y selection:bg-amber-400 selection:text-black transition-colors"
              />
            </div>
          </div>

          {/* Settings & Presentation Presets (1 col) */}
          <div className="space-y-4">
            <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Configurações de Leitura</h3>
                </div>
                <span className="text-[10px] text-amber-400/90 font-mono bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  {config.scrollDirection === 'horizontal' ? 'Letreiro YouTube' : 'Rolagem Vertical'}
                </span>
              </div>

              {/* YouTube Mode & Scroll Direction Selector */}
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Direção da Leitura (YouTube)
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">Tecla O</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ scrollDirection: 'vertical' })}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      config.scrollDirection === 'vertical'
                        ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <span>↕ Vertical</span>
                    <span className="text-[10px] opacity-75">(Padrão)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ scrollDirection: 'horizontal' })}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      config.scrollDirection === 'horizontal'
                        ? 'bg-red-600 text-white border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.35)]'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <span>↔ Horizontal</span>
                    <span className="text-[10px] font-bold text-amber-300">YouTube</span>
                  </button>
                </div>

                {config.scrollDirection === 'horizontal' ? (
                  <div className="space-y-2 pt-1 border-t border-zinc-800/60 text-xs">
                    <div className="flex justify-between items-center text-zinc-400 text-[11px]">
                      <span>Posição do Letreiro</span>
                      <span className="text-amber-400 font-mono capitalize">{config.horizontalBandPosition}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onUpdateConfig({ horizontalBandPosition: 'top' })}
                        className={`py-1.5 px-2 rounded text-[11px] font-medium border transition-colors ${
                          config.horizontalBandPosition === 'top'
                            ? 'bg-zinc-800 text-amber-300 border-amber-400/50'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                        }`}
                        title="Posiciona a faixa de texto logo abaixo da webcam para contato visual direto"
                      >
                        Topo (Webcam)
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateConfig({ horizontalBandPosition: 'center' })}
                        className={`py-1.5 px-2 rounded text-[11px] font-medium border transition-colors ${
                          config.horizontalBandPosition === 'center'
                            ? 'bg-zinc-800 text-amber-300 border-amber-400/50'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        Centro
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateConfig({ horizontalBandPosition: 'bottom' })}
                        className={`py-1.5 px-2 rounded text-[11px] font-medium border transition-colors ${
                          config.horizontalBandPosition === 'bottom'
                            ? 'bg-zinc-800 text-amber-300 border-amber-400/50'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        Rodapé
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      💡 <strong>Dica YouTube:</strong> A faixa horizontal no <em>Topo</em> permite ler o roteiro da direita para a esquerda mantendo o olhar diretamente na webcam.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-[11px] text-zinc-400">
                    <span>Proporção de Gravação</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onUpdateConfig({ aspectRatio: '16:9' })}
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold transition-colors ${
                          config.aspectRatio === '16:9'
                            ? 'bg-zinc-800 text-amber-400 border-amber-400/40'
                            : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                        }`}
                      >
                        16:9 YouTube
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateConfig({ aspectRatio: '9:16' })}
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold transition-colors ${
                          config.aspectRatio === '9:16'
                            ? 'bg-zinc-800 text-amber-400 border-amber-400/40'
                            : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                        }`}
                      >
                        9:16 Shorts
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Pacing Target Timer & Auto-Ramp (YouTube Shorts / Reels / Pitch) */}
              <div className="p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Meta de Duração (Pacing Timer)</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {config.targetDurationSeconds > 0
                      ? `${Math.floor(config.targetDurationSeconds / 60)}m ${config.targetDurationSeconds % 60}s`
                      : 'Livre'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ targetDurationSeconds: 0 })}
                    className={`py-1.5 px-2 rounded-lg border font-semibold text-[11px] transition-all ${
                      config.targetDurationSeconds === 0
                        ? 'bg-zinc-800 text-white border-zinc-600'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    Livre (Sem meta)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ targetDurationSeconds: 30 })}
                    className={`py-1.5 px-2 rounded-lg border font-semibold text-[11px] transition-all ${
                      config.targetDurationSeconds === 30
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    30s Stories
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ targetDurationSeconds: 60 })}
                    className={`py-1.5 px-2 rounded-lg border font-semibold text-[11px] transition-all ${
                      config.targetDurationSeconds === 60
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    60s Shorts
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ targetDurationSeconds: 90 })}
                    className={`py-1.5 px-2 rounded-lg border font-semibold text-[11px] transition-all ${
                      config.targetDurationSeconds === 90
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    90s Reels
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ targetDurationSeconds: 180 })}
                    className={`py-1.5 px-2 rounded-lg border font-semibold text-[11px] transition-all ${
                      config.targetDurationSeconds === 180
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    3 min Pitch
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ targetDurationSeconds: 300 })}
                    className={`py-1.5 px-2 rounded-lg border font-semibold text-[11px] transition-all ${
                      config.targetDurationSeconds === 300
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    5 min Aula
                  </button>
                </div>

                {config.targetDurationSeconds > 0 && (
                  <div className="space-y-2 pt-2 border-t border-zinc-800/80 text-xs">
                    {/* Required WPM calculation */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">Ritmo de Fala Necessário:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        ~{Math.round((wordCount / (config.targetDurationSeconds / 60)))} WPM
                      </span>
                    </div>

                    <label className="flex items-center justify-between cursor-pointer py-1 text-zinc-300 hover:text-white">
                      <div>
                        <span className="font-medium text-xs block">Auto-Ramp de Velocidade</span>
                        <span className="text-[10px] text-zinc-500 block">
                          Ajusta a rolagem para finalizar exatamente no tempo
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.enableAutoPaceRamp}
                        onChange={(e) => onUpdateConfig({ enableAutoPaceRamp: e.target.checked })}
                        className="accent-emerald-400 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Speed Preset */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-zinc-400 font-medium">Velocidade da Rolagem</span>
                  <span className="font-mono font-bold text-amber-300">{config.speed}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={config.speed}
                  onChange={(e) => onUpdateConfig({ speed: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                  <span>Lenta (1)</span>
                  <span>Média (5-8)</span>
                  <span>Rápida (20)</span>
                </div>
              </div>

              {/* Font Size Preset */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-zinc-400 font-medium">Tamanho da Fonte</span>
                  <span className="font-mono font-bold text-white">{config.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="24"
                  max="110"
                  value={config.fontSize}
                  onChange={(e) => onUpdateConfig({ fontSize: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Reading Column Width */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-zinc-400 font-medium">Largura da Margem de Leitura</span>
                  <span className="font-mono font-bold text-white">{config.marginWidth}%</span>
                </div>
                <input
                  type="range"
                  min="35"
                  max="95"
                  value={config.marginWidth}
                  onChange={(e) => onUpdateConfig({ marginWidth: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Diminua a largura para manter o olhar focado próximo à lente da câmera.
                </p>
              </div>

              {/* Camera Alignment & Eye Gaze Lock */}
              <div className="p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Focus className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Alinhamento com a Câmera</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">Foco do Olhar</span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-snug">
                  Posicione o texto diretamente abaixo da lente da câmera/webcam para manter o contato visual natural com o público.
                </p>

                {/* 3 Quick Presets */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateConfig({
                        cameraAlignment: 'left',
                        horizontalOffsetPercent: 18,
                        textAlign: 'left',
                      })
                    }
                    className={`py-2 px-1.5 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                      config.cameraAlignment === 'left'
                        ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                    title="Alinhar texto à esquerda (webcam ou smartphone montado à esquerda)"
                  >
                    <span className="text-sm">◧</span>
                    <span className="text-[11px]">Esquerda</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateConfig({
                        cameraAlignment: 'center',
                        horizontalOffsetPercent: 50,
                        textAlign: 'center',
                      })
                    }
                    className={`py-2 px-1.5 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                      config.cameraAlignment === 'center'
                        ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                    title="Alinhar texto ao centro (câmera frontal central padrão)"
                  >
                    <span className="text-sm">◨</span>
                    <span className="text-[11px]">Centro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateConfig({
                        cameraAlignment: 'right',
                        horizontalOffsetPercent: 82,
                        textAlign: 'right',
                      })
                    }
                    className={`py-2 px-1.5 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                      config.cameraAlignment === 'right'
                        ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                    title="Alinhar texto à direita (webcam ou smartphone montado à direita)"
                  >
                    <span className="text-sm">◨</span>
                    <span className="text-[11px]">Direita</span>
                  </button>
                </div>

                {/* Interactive Screen & Camera Preview */}
                <div className="w-full bg-zinc-950 border border-zinc-800/90 rounded-lg p-2 relative">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1 px-1">
                    <span>Tela / Monitor</span>
                    <span className="text-amber-300 font-mono font-semibold">
                      Lente: {config.horizontalOffsetPercent}%
                    </span>
                  </div>
                  <div className="w-full h-10 bg-black rounded border border-zinc-800 relative overflow-hidden flex items-center">
                    {/* Camera Lens Indicator Dot */}
                    <div
                      className="absolute top-0 -translate-x-1/2 flex flex-col items-center z-10 transition-all duration-150"
                      style={{ left: `${config.horizontalOffsetPercent}%` }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] ring-2 ring-white/60 animate-pulse" />
                    </div>

                    {/* Column Block inside monitor */}
                    <div
                      className="h-6 rounded bg-amber-400/25 border border-amber-400/70 transition-all duration-150 flex items-center justify-center text-[9px] text-amber-300 font-bold px-1 select-none truncate"
                      style={{
                        marginLeft: `${Math.max(0, ((100 - config.marginWidth) * config.horizontalOffsetPercent) / 100)}%`,
                        width: `${config.marginWidth}%`,
                      }}
                    >
                      Texto do Roteiro
                    </div>
                  </div>
                </div>

                {/* Precision Slider */}
                <div>
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-zinc-400">Ajuste Fino de Posição</span>
                    <span className="font-mono font-bold text-amber-300">
                      {config.horizontalOffsetPercent}% (
                      {config.cameraAlignment === 'left' ? 'Esquerda' : config.cameraAlignment === 'right' ? 'Direita' : 'Centro'}
                      )
                    </span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="92"
                    value={config.horizontalOffsetPercent}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const align = val < 38 ? 'left' : val > 62 ? 'right' : 'center';
                      onUpdateConfig({
                        horizontalOffsetPercent: val,
                        cameraAlignment: align,
                      });
                    }}
                    className="w-full accent-amber-400 cursor-pointer h-1.5"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono mt-0.5">
                    <span>8% (Borda Esq.)</span>
                    <span>50% (Centro)</span>
                    <span>92% (Borda Dir.)</span>
                  </div>
                </div>

                {/* Text Alignment inside column */}
                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 text-[11px]">Alinhamento do Texto</span>
                  <div className="flex gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => onUpdateConfig({ textAlign: 'left' })}
                      className={`p-1.5 rounded transition-colors ${
                        config.textAlign === 'left'
                          ? 'bg-zinc-800 text-amber-300'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      title="Alinhar texto à esquerda"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateConfig({ textAlign: 'center' })}
                      className={`p-1.5 rounded transition-colors ${
                        config.textAlign === 'center'
                          ? 'bg-zinc-800 text-amber-300'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      title="Centralizar texto"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateConfig({ textAlign: 'right' })}
                      className={`p-1.5 rounded transition-colors ${
                        config.textAlign === 'right'
                          ? 'bg-zinc-800 text-amber-300'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      title="Alinhar texto à direita"
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <span className="text-zinc-400 font-medium text-xs block mb-2">Cor do Texto (Fundo OLED Preto)</span>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(COLOR_THEMES) as TextColorTheme[]).map((themeKey) => {
                    const theme = COLOR_THEMES[themeKey];
                    const isSelected = config.colorTheme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => onUpdateConfig({ colorTheme: themeKey })}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-amber-400 bg-zinc-900 text-white'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.hex }} />
                        <span>{theme.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mirroring Toggles */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                <span className="text-zinc-400 font-medium text-xs block">Espelhamento Óptico</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ flipHorizontal: !config.flipHorizontal })}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                      config.flipHorizontal
                        ? 'bg-amber-400/10 text-amber-300 border-amber-400/40 font-semibold'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    ⇄ Flip Horizontal
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ flipVertical: !config.flipVertical })}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                      config.flipVertical
                        ? 'bg-amber-400/10 text-amber-300 border-amber-400/40 font-semibold'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    ⇅ Flip Vertical
                  </button>
                </div>
              </div>

              {/* 2. VoiceTrack & Karaoke Settings */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-cyan-400" />
                    VoiceTrack & Karaokê
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">IA por Voz</span>
                </div>

                <label className="flex items-center justify-between cursor-pointer py-1 text-zinc-300 hover:text-white">
                  <div>
                    <span className="font-medium text-xs block">Rolagem por Voz (VoiceTrack)</span>
                    <span className="text-[10px] text-zinc-500 block">
                      O teleprompter acompanha o ritmo da sua fala
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.enableVoiceScroll}
                    onChange={(e) => onUpdateConfig({ enableVoiceScroll: e.target.checked })}
                    className="accent-cyan-400 w-4 h-4 cursor-pointer"
                  />
                </label>

                {config.enableVoiceScroll && (
                  <div className="space-y-2 pl-2 border-l-2 border-cyan-500/40 mt-1">
                    <label className="flex items-center justify-between cursor-pointer py-1 text-zinc-300 hover:text-white">
                      <div>
                        <span className="font-medium text-xs block">Realce Palavra-a-Palavra (Karaokê)</span>
                        <span className="text-[10px] text-zinc-500 block">
                          Ilumina cada palavra falada e esmaece as anteriores
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.enableKaraokeHighlight}
                        onChange={(e) => onUpdateConfig({ enableKaraokeHighlight: e.target.checked })}
                        className="accent-amber-400 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-zinc-400">Idioma da Fala:</span>
                      <select
                        value={config.voiceLanguage || 'pt-BR'}
                        onChange={(e) => onUpdateConfig({ voiceLanguage: e.target.value })}
                        className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-[11px] rounded px-2 py-0.5 outline-none"
                      >
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en-US">English (US)</option>
                        <option value="es-ES">Español</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Countdown & Guide Toggles */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-2 text-xs">
                <label className="flex items-center justify-between cursor-pointer py-1 text-zinc-300 hover:text-white">
                  <span>Linha Guia do Olhar (Eyeline)</span>
                  <input
                    type="checkbox"
                    checked={config.showEyelineGuide}
                    onChange={(e) => onUpdateConfig({ showEyelineGuide: e.target.checked })}
                    className="accent-amber-400 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1 text-zinc-300 hover:text-white">
                  <span>Contagem Regressiva 3-2-1</span>
                  <input
                    type="checkbox"
                    checked={config.enableCountdown}
                    onChange={(e) => onUpdateConfig({ enableCountdown: e.target.checked })}
                    className="accent-amber-400 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>

              {/* 5. Camera, Glass Overlay & Video Recording Settings */}
              <div className="pt-3 border-t border-zinc-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 font-semibold text-xs flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-red-400" />
                    Câmera, Vidro & Gravação
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (videoRecorder.isCameraActive) {
                        videoRecorder.stopCamera();
                      } else {
                        await videoRecorder.startCamera();
                        videoRecorder.setShowCameraPreview(true);
                      }
                    }}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                      videoRecorder.isCameraActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {videoRecorder.isCameraActive ? '● Câmera Ligada' : 'Testar Câmera'}
                  </button>
                </div>

                <div className="space-y-2 text-xs text-zinc-400">
                  {/* Mode selector: PIP vs Fullscreen Glass */}
                  <div>
                    <span className="text-[11px] block text-zinc-400 mb-1">Modo de Exibição da Câmera</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onUpdateConfig({ cameraOverlayMode: 'pip' })}
                        className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all ${
                          config.cameraOverlayMode === 'pip'
                            ? 'bg-zinc-800 text-amber-300 border-amber-400/50'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        PIP Flutuante
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateConfig({ cameraOverlayMode: 'fullscreen-glass' })}
                        className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all ${
                          config.cameraOverlayMode === 'fullscreen-glass'
                            ? 'bg-cyan-950/70 text-cyan-300 border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                        title="Roteiro projetado sobre o vídeo da câmera (efeito espelho óptico)"
                      >
                        Vidro Transparente
                      </button>
                    </div>
                  </div>

                  {/* Prompter Background Transparency Slider */}
                  {config.cameraOverlayMode === 'fullscreen-glass' && (
                    <div className="p-2.5 bg-zinc-900/90 rounded-lg border border-cyan-500/30 space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-300">Opacidade do Fundo (Vidro)</span>
                        <span className="text-cyan-300 font-mono font-bold">
                          {config.prompterBackgroundOpacity}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={config.prompterBackgroundOpacity}
                        onChange={(e) =>
                          onUpdateConfig({ prompterBackgroundOpacity: parseInt(e.target.value, 10) })
                        }
                        className="w-full accent-cyan-400 cursor-pointer h-1.5"
                      />
                      <div className="flex justify-between text-[9px] text-zinc-500">
                        <span>0% (Vidro Cristal)</span>
                        <span>50% (Fumê Suave)</span>
                        <span>100% (Preto)</span>
                      </div>
                    </div>
                  )}

                  {/* Framing Guides */}
                  <div>
                    <span className="text-[11px] block text-zinc-400 mb-1">Guia de Enquadramento</span>
                    <div className="grid grid-cols-4 gap-1 text-[10px]">
                      {(['none', '16:9', '9:16', 'grid'] as const).map((guide) => (
                        <button
                          key={guide}
                          type="button"
                          onClick={() => onUpdateConfig({ cameraFramingGuide: guide })}
                          className={`py-1 rounded border capitalize transition-colors ${
                            config.cameraFramingGuide === guide
                              ? 'bg-zinc-800 text-amber-300 border-amber-400/50 font-bold'
                              : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                          }`}
                        >
                          {guide === 'none' ? 'Nenhum' : guide === 'grid' ? 'Grade 3x3' : guide}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Audio VU meter & Mirror */}
                  <div className="pt-1 border-t border-zinc-800/60 space-y-1">
                    <label className="flex items-center justify-between cursor-pointer py-1 text-zinc-300 hover:text-white">
                      <span>Exibir VU Meter de Áudio</span>
                      <input
                        type="checkbox"
                        checked={config.showAudioMeter}
                        onChange={(e) => onUpdateConfig({ showAudioMeter: e.target.checked })}
                        className="accent-emerald-400 w-3.5 h-3.5 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer py-1 text-zinc-300 hover:text-white">
                      <span>Espelhar Câmera (Selfie)</span>
                      <input
                        type="checkbox"
                        checked={videoRecorder.mirrorCamera}
                        onChange={(e) => videoRecorder.setMirrorCamera(e.target.checked)}
                        className="accent-amber-400 w-3.5 h-3.5 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Big Start Prompter Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onStartPrompter}
                  className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm tracking-wide"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Iniciar Apresentação
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom Action Dock (Natural Thumb Zone) */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 p-2.5 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 z-30 pb-safe flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenRemoteModal}
          className="py-2.5 px-2 text-[11px] font-bold rounded-xl border border-amber-400/30 bg-zinc-900 text-amber-300 flex flex-col items-center justify-center min-h-[44px] min-w-[48px] shrink-0"
          title="Controle Remoto Celular via QR Code"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[8px] mt-0.5">Remoto</span>
        </button>

        <button
          type="button"
          onClick={() => onUpdateConfig({ scrollDirection: config.scrollDirection === 'horizontal' ? 'vertical' : 'horizontal' })}
          className={`py-2.5 px-2 text-[11px] font-bold rounded-xl border transition-all flex flex-col items-center justify-center min-h-[44px] min-w-[56px] shrink-0 ${
            config.scrollDirection === 'horizontal'
              ? 'bg-red-600/20 text-red-400 border-red-500/50'
              : 'bg-zinc-900 text-zinc-300 border-zinc-800'
          }`}
          title="Alternar entre modo Vertical e Letreiro Horizontal para YouTube"
        >
          <span>{config.scrollDirection === 'horizontal' ? '↔ Horiz.' : '↕ Vert.'}</span>
          <span className="text-[8px] opacity-70">{config.scrollDirection === 'horizontal' ? 'YouTube' : 'Padrão'}</span>
        </button>

        <button
          type="button"
          onClick={async () => {
            if (!videoRecorder.isCameraActive) {
              await videoRecorder.startCamera();
            }
            videoRecorder.setShowCameraPreview(true);
            onStartPrompter();
          }}
          className="flex-1 py-3 px-2 text-xs font-bold text-white bg-red-600 active:bg-red-700 rounded-xl transition-all flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(239,68,68,0.35)] min-h-[44px]"
        >
          <Circle className="w-3 h-3 fill-current text-white animate-pulse" />
          <span>Gravar</span>
        </button>

        <button
          type="button"
          onClick={onStartPrompter}
          className="flex-[1.2] py-3 px-3 text-xs font-extrabold text-black bg-amber-400 active:bg-amber-500 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(251,191,36,0.35)] min-h-[44px]"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Iniciar</span>
        </button>
      </div>
    </div>
  );
};
