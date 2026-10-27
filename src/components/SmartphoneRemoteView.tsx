import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  FastForward,
  Rewind,
  Focus,
  Smartphone,
  ArrowLeft,
  Circle,
  Square,
  Video,
  Zap,
} from 'lucide-react';
import { RemoteStatusState } from '../types';
import { RemoteChannel } from '../utils/remoteChannel';

interface SmartphoneRemoteViewProps {
  onExitRemote?: () => void;
}

export const SmartphoneRemoteView: React.FC<SmartphoneRemoteViewProps> = ({ onExitRemote }) => {
  const [remoteChannel] = useState(() => new RemoteChannel(false));
  const [status, setStatus] = useState<RemoteStatusState>({
    isPlaying: false,
    isRecording: false,
    recordingDuration: 0,
    speed: 4,
    fontSize: 52,
    title: 'Teleprompter Ao Vivo',
    cameraAlignment: 'center',
    flipHorizontal: false,
    elapsedSeconds: 0,
    targetDurationSeconds: 0,
    totalEstimatedSeconds: 0,
    progressRatio: 0,
    isVoiceActive: false,
  });

  const [connected, setConnected] = useState<boolean>(true);
  const [isWsLive, setIsWsLive] = useState<boolean>(false);
  const [lastAction, setLastAction] = useState<string>('');

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch {}
    }
  };

  useEffect(() => {
    remoteChannel.setOnStatus((newStatus) => {
      setStatus(newStatus);
      setConnected(true);
    });

    remoteChannel.setOnConnectionChange((isConnected, transport) => {
      setIsWsLive(isConnected && transport === 'websocket');
      setConnected(isConnected);
    });

    // Request initial state sync via WebSocket / Bus
    remoteChannel.sendCommand('sync_state_req');

    const interval = setInterval(() => {
      remoteChannel.sendCommand('sync_state_req');
    }, 3000);

    return () => {
      clearInterval(interval);
      remoteChannel.destroy();
    };
  }, [remoteChannel]);

  const send = (type: any, payload?: any, actionLabel?: string) => {
    triggerHaptic();
    if (actionLabel) {
      setLastAction(actionLabel);
      setTimeout(() => setLastAction(''), 1500);
    }
    remoteChannel.sendCommand(type, payload);
  };

  const mins = Math.floor(status.elapsedSeconds / 60);
  const secs = status.elapsedSeconds % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const recMins = Math.floor(status.recordingDuration / 60);
  const recSecs = status.recordingDuration % 60;
  const recTimeFormatted = `${String(recMins).padStart(2, '0')}:${String(recSecs).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between p-4 sm:p-6 select-none max-w-md mx-auto">
      {/* Header bar */}
      <header className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          {onExitRemote && (
            <button
              onClick={onExitRemote}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-wider uppercase text-zinc-300">
              Controle Remoto
            </h1>
            <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">
              {isWsLive ? (
                <>
                  <Zap className="w-3 h-3 text-emerald-400 fill-current animate-pulse" />
                  <span className="text-emerald-400 font-bold">WS &lt;5ms</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-zinc-400">Sync Ativo</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="text-right flex items-center gap-2">
          {status.isRecording && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-950 border border-red-500/80 text-red-400 font-mono font-bold text-xs animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>REC {recTimeFormatted}</span>
            </div>
          )}
          <div>
            <div className="text-xs font-mono font-bold text-amber-400">{timeFormatted}</div>
            <div className="text-[10px] text-zinc-500 truncate max-w-[120px]">{status.title}</div>
          </div>
        </div>
      </header>

      {/* Progress pill & Action feedback */}
      <div className="my-2">
        <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="bg-amber-400 h-full transition-all duration-300"
            style={{ width: `${Math.round(status.progressRatio * 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-1">
          <span>Progresso: {Math.round(status.progressRatio * 100)}%</span>
          {lastAction && (
            <span className="text-amber-400 font-medium animate-pulse">{lastAction}</span>
          )}
          {status.targetDurationSeconds > 0 && (
            <span>Meta: {Math.floor(status.targetDurationSeconds / 60)}m</span>
          )}
        </div>
      </div>

      {/* 2. DEDICATED RECORDING BUTTON (REC) ON REMOTE - EXPLICIT START/STOP DISPATCH */}
      <div className="my-2">
        {status.isRecording ? (
          <button
            onClick={() => send('stop_record', null, '⏹ Parando Gravação...')}
            className="w-full py-4 px-4 rounded-xl bg-red-950 border-2 border-red-500 text-red-200 font-extrabold flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all animate-pulse active:scale-95 cursor-pointer"
          >
            <Square className="w-5 h-5 fill-current text-red-400 shrink-0" />
            <div className="flex flex-col items-center">
              <span className="text-sm uppercase tracking-wider font-black">Parar Gravação no Host</span>
              <span className="text-[11px] font-mono text-red-300">REC {recTimeFormatted} • Salvar Vídeo</span>
            </div>
          </button>
        ) : (
          <button
            onClick={() => send('start_record', null, '🔴 Disparando Gravação...')}
            className="w-full py-4 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 active:scale-95 text-white font-extrabold flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all cursor-pointer"
          >
            <Circle className="w-5 h-5 fill-current text-white animate-pulse shrink-0" />
            <div className="flex flex-col items-center">
              <span className="text-sm uppercase tracking-wider font-black">Disparar Gravação (REC)</span>
              <span className="text-[10px] opacity-90 font-medium">Inicia gravação de vídeo na câmera do teleprompter</span>
            </div>
          </button>
        )}
      </div>

      {/* Primary BIG PLAY / PAUSE BUTTON */}
      <div className="my-auto py-2 flex flex-col items-center justify-center">
        <button
          onClick={() => send('toggle_play', null, status.isPlaying ? 'Pausado' : 'Reproduzindo')}
          className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center gap-1.5 shadow-2xl transition-all transform active:scale-95 border-4 ${
            status.isPlaying
              ? 'bg-amber-500 border-amber-300 text-black shadow-amber-500/30'
              : 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-500/30'
          }`}
        >
          {status.isPlaying ? (
            <>
              <Pause className="w-12 h-12 fill-current" />
              <span className="text-[11px] font-black uppercase tracking-wider">Pausar</span>
            </>
          ) : (
            <>
              <Play className="w-12 h-12 fill-current ml-1" />
              <span className="text-[11px] font-black uppercase tracking-wider">Iniciar</span>
            </>
          )}
        </button>
      </div>

      {/* Controls Grid */}
      <div className="space-y-2.5">
        {/* Speed & Font adjustments */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {/* Speed box */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase text-zinc-400 mb-1">
              Velocidade: <strong className="text-amber-400">{status.speed}x</strong>
            </span>
            <div className="flex items-center gap-2 w-full justify-between">
              <button
                onClick={() => send('speed_down', null, 'Velocidade -')}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-lg text-white font-bold flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => send('speed_up', null, 'Velocidade +')}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-lg text-white font-bold flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Font box */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase text-zinc-400 mb-1">
              Fonte: <strong className="text-cyan-400">{status.fontSize}px</strong>
            </span>
            <div className="flex items-center gap-2 w-full justify-between">
              <button
                onClick={() => send('font_down', null, 'Fonte -')}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-lg text-white font-bold flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => send('font_up', null, 'Fonte +')}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-lg text-white font-bold flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Camera Alignment Presets */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2">
          <div className="text-[10px] font-semibold uppercase text-zinc-400 mb-1 text-center flex items-center justify-center gap-1.5">
            <Focus className="w-3 h-3 text-amber-400" />
            <span>Foco da Câmera (Olhar)</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => send('align_camera', 'left', 'Olhar p/ Esquerda')}
              className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                status.cameraAlignment === 'left'
                  ? 'bg-amber-400 text-black border-amber-300 font-bold'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              ◧ Esq
            </button>
            <button
              onClick={() => send('align_camera', 'center', 'Olhar no Centro')}
              className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                status.cameraAlignment === 'center'
                  ? 'bg-amber-400 text-black border-amber-300 font-bold'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              ◨ Centro
            </button>
            <button
              onClick={() => send('align_camera', 'right', 'Olhar p/ Direita')}
              className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                status.cameraAlignment === 'right'
                  ? 'bg-amber-400 text-black border-amber-300 font-bold'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              ◨ Dir
            </button>
          </div>
        </div>

        {/* Quick Nav Row */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => send('restart', null, 'Reiniciado')}
            className="py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white flex flex-col items-center justify-center gap-0.5"
            title="Voltar ao início"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[9px] font-medium">Início</span>
          </button>
          <button
            onClick={() => send('prev_section', null, 'Seção Anterior')}
            className="py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white flex flex-col items-center justify-center gap-0.5"
            title="Seção anterior"
          >
            <Rewind className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[9px] font-medium">-Seção</span>
          </button>
          <button
            onClick={() => send('next_section', null, 'Próxima Seção')}
            className="py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white flex flex-col items-center justify-center gap-0.5"
            title="Próxima seção"
          >
            <FastForward className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[9px] font-medium">+Seção</span>
          </button>
          <button
            onClick={() => send('toggle_record', null, status.isRecording ? 'Parar Gravação' : 'Gravar')}
            className={`py-2.5 border rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors ${
              status.isRecording
                ? 'bg-red-950 border-red-500 text-red-300 animate-pulse'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
            title="Gravação de Vídeo"
          >
            <Video className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[9px] font-medium">{status.isRecording ? 'Parar' : 'Gravar'}</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-2 text-center text-[10px] text-zinc-600">
        Controle Remoto P2P & Wi-Fi ativo • Toque suave
      </footer>
    </div>
  );
};
