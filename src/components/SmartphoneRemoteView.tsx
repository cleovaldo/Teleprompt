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
  Mic,
  MicOff,
  FlipHorizontal,
  Smartphone,
  CheckCircle2,
  ArrowLeft,
  Volume2,
} from 'lucide-react';
import { RemoteStatusState } from '../types';
import { RemoteChannel } from '../utils/remoteChannel';

interface SmartphoneRemoteViewProps {
  onExitRemote?: () => void;
}

export const SmartphoneRemoteView: React.FC<SmartphoneRemoteViewProps> = ({ onExitRemote }) => {
  const [remoteChannel] = useState(() => new RemoteChannel());
  const [status, setStatus] = useState<RemoteStatusState>({
    isPlaying: false,
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

    // Request initial state sync
    remoteChannel.sendCommand('sync_state_req');

    const interval = setInterval(() => {
      remoteChannel.sendCommand('sync_state_req');
    }, 4000);

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
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm font-semibold tracking-wider uppercase text-zinc-300">
              Controle Remoto
            </h1>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-mono font-bold text-amber-400">{timeFormatted}</div>
          <div className="text-[10px] text-zinc-500 truncate max-w-[120px]">{status.title}</div>
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

      {/* Primary BIG PLAY / PAUSE BUTTON */}
      <div className="my-auto py-4 flex flex-col items-center justify-center">
        <button
          onClick={() => send('toggle_play', null, status.isPlaying ? 'Pausado' : 'Reproduzindo')}
          className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center gap-2 shadow-2xl transition-all transform active:scale-95 border-4 ${
            status.isPlaying
              ? 'bg-amber-500 border-amber-300 text-black shadow-amber-500/30'
              : 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-500/30'
          }`}
        >
          {status.isPlaying ? (
            <>
              <Pause className="w-14 h-14 fill-current" />
              <span className="text-xs font-black uppercase tracking-wider">Pausar</span>
            </>
          ) : (
            <>
              <Play className="w-14 h-14 fill-current ml-2" />
              <span className="text-xs font-black uppercase tracking-wider">Iniciar</span>
            </>
          )}
        </button>
      </div>

      {/* Controls Grid */}
      <div className="space-y-3">
        {/* Speed & Font adjustments */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {/* Speed box */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[11px] font-semibold uppercase text-zinc-400 mb-1">
              Velocidade: <strong className="text-amber-400">{status.speed}</strong>
            </span>
            <div className="flex items-center gap-2 w-full justify-between">
              <button
                onClick={() => send('speed_down', null, 'Velocidade -')}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-lg text-white font-bold flex items-center justify-center"
              >
                <Minus className="w-5 h-5" />
              </button>
              <button
                onClick={() => send('speed_up', null, 'Velocidade +')}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-lg text-white font-bold flex items-center justify-center"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Font box */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[11px] font-semibold uppercase text-zinc-400 mb-1">
              Fonte: <strong className="text-cyan-400">{status.fontSize}px</strong>
            </span>
            <div className="flex items-center gap-2 w-full justify-between">
              <button
                onClick={() => send('font_down', null, 'Fonte -')}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-lg text-white font-bold flex items-center justify-center"
              >
                <Minus className="w-5 h-5" />
              </button>
              <button
                onClick={() => send('font_up', null, 'Fonte +')}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-lg text-white font-bold flex items-center justify-center"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Camera Alignment Presets */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5">
          <div className="text-[11px] font-semibold uppercase text-zinc-400 mb-1.5 text-center flex items-center justify-center gap-1.5">
            <Focus className="w-3.5 h-3.5 text-amber-400" />
            <span>Foco da Câmera (Olhar)</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => send('align_camera', 'left', 'Olhar p/ Esquerda')}
              className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                status.cameraAlignment === 'left'
                  ? 'bg-amber-400 text-black border-amber-300 font-bold'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              ◧ Esquerda
            </button>
            <button
              onClick={() => send('align_camera', 'center', 'Olhar no Centro')}
              className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                status.cameraAlignment === 'center'
                  ? 'bg-amber-400 text-black border-amber-300 font-bold'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              ◨ Centro
            </button>
            <button
              onClick={() => send('align_camera', 'right', 'Olhar p/ Direita')}
              className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                status.cameraAlignment === 'right'
                  ? 'bg-amber-400 text-black border-amber-300 font-bold'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              ◨ Direita
            </button>
          </div>
        </div>

        {/* Quick Nav Row */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => send('restart', null, 'Reiniciado')}
            className="py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white flex flex-col items-center justify-center gap-1"
            title="Voltar ao início"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-medium">Início</span>
          </button>
          <button
            onClick={() => send('prev_section', null, 'Seção Anterior')}
            className="py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white flex flex-col items-center justify-center gap-1"
            title="Seção anterior"
          >
            <Rewind className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-medium">-Seção</span>
          </button>
          <button
            onClick={() => send('next_section', null, 'Próxima Seção')}
            className="py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white flex flex-col items-center justify-center gap-1"
            title="Próxima seção"
          >
            <FastForward className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-medium">+Seção</span>
          </button>
          <button
            onClick={() => send('toggle_flip', null, 'Espelhar')}
            className={`py-3 border rounded-xl flex flex-col items-center justify-center gap-1 transition-colors ${
              status.flipHorizontal
                ? 'bg-amber-400/20 border-amber-500/50 text-amber-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
            title="Espelhamento de vidro"
          >
            <FlipHorizontal className="w-4 h-4" />
            <span className="text-[10px] font-medium">Espelho</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-2 text-center text-[10px] text-zinc-600">
        Controle Remoto P2P sem fio ativo • Toque suave
      </footer>
    </div>
  );
};
