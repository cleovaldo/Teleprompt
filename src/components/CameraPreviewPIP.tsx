import React, { useEffect, useRef } from 'react';
import {
  Camera,
  FlipHorizontal,
  Eye,
  EyeOff,
  X,
  Radio,
  Maximize2,
  Grid,
  Volume2,
} from 'lucide-react';
import { useAudioLevel } from '../utils/useAudioLevel';

interface CameraPreviewPIPProps {
  stream: MediaStream | null;
  isRecording: boolean;
  recordingDuration: number;
  mirrorCamera: boolean;
  position: 'top-center' | 'top-right' | 'top-left' | 'hidden';
  framingGuide?: 'none' | '16:9' | '9:16' | 'grid';
  showAudioMeter?: boolean;
  isGlassFullscreen?: boolean;
  onToggleMirror: () => void;
  onChangePosition: (pos: 'top-center' | 'top-right' | 'top-left' | 'hidden') => void;
  onToggleGlassFullscreen?: () => void;
  onChangeFramingGuide?: (guide: 'none' | '16:9' | '9:16' | 'grid') => void;
  onClose: () => void;
}

export const CameraPreviewPIP: React.FC<CameraPreviewPIPProps> = ({
  stream,
  isRecording,
  recordingDuration,
  mirrorCamera,
  position,
  framingGuide = 'none',
  showAudioMeter = true,
  isGlassFullscreen = false,
  onToggleMirror,
  onChangePosition,
  onToggleGlassFullscreen,
  onChangeFramingGuide,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioLevel = useAudioLevel(stream, showAudioMeter);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (position === 'hidden' || !stream) {
    return null;
  }

  const mins = Math.floor(recordingDuration / 60);
  const secs = Math.floor(recordingDuration % 60);
  const formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // If in Glass Fullscreen mode, the camera feed is rendered full-screen in PrompterView behind the text.
  // We only show a minimal controller pill here.
  if (isGlassFullscreen) {
    return (
      <div className="fixed top-4 left-4 z-40 bg-zinc-950/80 backdrop-blur-md border border-zinc-700/60 rounded-xl px-3 py-1.5 flex items-center gap-3 text-xs text-white shadow-xl">
        <div className="flex items-center gap-1.5 font-bold text-cyan-400">
          <Eye className="w-3.5 h-3.5" />
          <span>Fundo Vidro (Câmera Ativa)</span>
        </div>
        {/* Audio VU meter */}
        {showAudioMeter && (
          <div className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-zinc-400" />
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-75 ${
                  audioLevel > 70
                    ? 'bg-red-500'
                    : audioLevel > 35
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${audioLevel}%` }}
              />
            </div>
          </div>
        )}
        {onToggleGlassFullscreen && (
          <button
            onClick={onToggleGlassFullscreen}
            className="text-[11px] underline text-zinc-400 hover:text-white"
          >
            Voltar ao PIP
          </button>
        )}
      </div>
    );
  }

  // Floating PIP positioning
  let posClasses = 'top-2 sm:top-4 left-1/2 -translate-x-1/2'; // top-center (optimal for direct eye contact!)
  if (position === 'top-right') {
    posClasses = 'top-2 sm:top-4 right-3 sm:right-6';
  } else if (position === 'top-left') {
    posClasses = 'top-2 sm:top-4 left-3 sm:left-6';
  }

  return (
    <div
      className={`fixed ${posClasses} z-40 w-44 sm:w-60 md:w-68 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden transition-all duration-300`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top micro-bar with REC status & controls */}
      <div className="flex items-center justify-between px-2 sm:px-3 py-1 bg-zinc-900/90 border-b border-zinc-800/80 text-[10px] sm:text-[11px]">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isRecording ? (
            <div className="flex items-center gap-1 text-red-400 font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>{formattedDuration}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-zinc-400 font-medium">
              <Camera className="w-3 h-3 text-zinc-400" />
              <span className="hidden sm:inline">Câmera</span>
            </div>
          )}

          {/* Micro VU Meter */}
          {showAudioMeter && (
            <div
              className="flex items-center gap-1 px-1 py-0.5 rounded bg-zinc-800/80"
              title="Nível de Áudio do Microfone"
            >
              <div className="w-8 sm:w-10 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 ${
                    audioLevel > 70
                      ? 'bg-red-400'
                      : audioLevel > 35
                      ? 'bg-amber-300'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          {/* Glass Fullscreen Toggle */}
          {onToggleGlassFullscreen && (
            <button
              onClick={onToggleGlassFullscreen}
              className="p-1 rounded text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800 transition-colors"
              title="Modo Vidro Transparente (Roteiro sobreposto ao seu rosto)"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}

          {/* Framing guides */}
          {onChangeFramingGuide && (
            <button
              onClick={() => {
                const nextGuides: Record<string, 'none' | '16:9' | '9:16' | 'grid'> = {
                  none: '16:9',
                  '16:9': '9:16',
                  '9:16': 'grid',
                  grid: 'none',
                };
                onChangeFramingGuide(nextGuides[framingGuide] || 'none');
              }}
              className={`p-1 rounded transition-colors ${
                framingGuide !== 'none'
                  ? 'text-amber-400 bg-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title={`Guia de Enquadramento: ${framingGuide}`}
            >
              <Grid className="w-3 h-3" />
            </button>
          )}

          {/* Mirror */}
          <button
            onClick={onToggleMirror}
            className={`p-1 rounded hover:bg-zinc-800 transition-colors ${
              mirrorCamera ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Espelhar Prévia da Câmera"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Position */}
          <button
            onClick={() => {
              const nextPos: Record<string, 'top-center' | 'top-right' | 'top-left'> = {
                'top-center': 'top-right',
                'top-right': 'top-left',
                'top-left': 'top-center',
              };
              onChangePosition(nextPos[position] || 'top-center');
            }}
            className="p-1 text-zinc-500 hover:text-white rounded hover:bg-zinc-800"
            title="Mudar posição na tela"
          >
            <Radio className="w-3 h-3" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-800"
            title="Ocultar prévia"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Feed */}
      <div className="relative aspect-video bg-black overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${mirrorCamera ? '-scale-x-100' : ''}`}
        />

        {/* Framing Guides Overlay */}
        {framingGuide === '16:9' && (
          <div className="absolute inset-1 border border-cyan-400/50 rounded pointer-events-none flex items-center justify-center">
            <span className="text-[8px] bg-cyan-950/80 text-cyan-300 px-1 rounded font-mono">
              16:9 Widescreen
            </span>
          </div>
        )}

        {framingGuide === '9:16' && (
          <div className="absolute inset-y-0 left-1/4 right-1/4 border-x border-dashed border-amber-400/70 pointer-events-none flex items-center justify-center">
            <span className="text-[8px] bg-amber-950/80 text-amber-300 px-1 rounded font-mono">
              9:16 Shorts
            </span>
          </div>
        )}

        {framingGuide === 'grid' && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/10">
            <div className="border-r border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-b border-white/20" />
            <div className="border-r border-white/20" />
            <div className="border-r border-white/20" />
            <div />
          </div>
        )}

        {/* Subtle camera lens center marker */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-2 h-2 rounded-full border border-amber-400/40 bg-amber-400/10" />
        </div>
      </div>
    </div>
  );
};
