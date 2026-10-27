import React, { useEffect, useRef } from 'react';
import {
  Camera,
  FlipHorizontal,
  Eye,
  X,
  Radio,
  Maximize2,
  Grid,
  Volume2,
  Sparkles,
  Circle,
  Square,
} from 'lucide-react';
import { useAudioLevel } from '../utils/useAudioLevel';
import { getPresenterMaskStyle, getEffectiveBlurPx } from '../utils/backgroundSegmenter';

interface CameraPreviewPIPProps {
  stream: MediaStream | null;
  isRecording: boolean;
  recordingDuration: number;
  mirrorCamera: boolean;
  position: 'top-center' | 'top-right' | 'top-left' | 'hidden';
  framingGuide?: 'none' | '16:9' | '9:16' | 'grid';
  showAudioMeter?: boolean;
  isGlassFullscreen?: boolean;
  backgroundEffect?: 'none' | 'blur-light' | 'blur-medium' | 'blur-heavy' | 'studio-dark' | 'studio-bokeh' | 'vignette';
  blurAmount?: number;
  cameraAlignment?: 'left' | 'center' | 'right';
  onToggleRecord?: () => void;
  onToggleMirror: () => void;
  onChangePosition: (pos: 'top-center' | 'top-right' | 'top-left' | 'hidden') => void;
  onToggleGlassFullscreen?: () => void;
  onChangeFramingGuide?: (guide: 'none' | '16:9' | '9:16' | 'grid') => void;
  onChangeBackgroundEffect?: (effect: any) => void;
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
  backgroundEffect = 'none',
  blurAmount = 10,
  cameraAlignment = 'center',
  onToggleRecord,
  onToggleMirror,
  onChangePosition,
  onToggleGlassFullscreen,
  onChangeFramingGuide,
  onChangeBackgroundEffect,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sharpVideoRef = useRef<HTMLVideoElement>(null);
  const audioLevel = useAudioLevel(stream, showAudioMeter);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
    if (sharpVideoRef.current && stream) {
      sharpVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (position === 'hidden' || !stream) {
    return null;
  }

  const mins = Math.floor(recordingDuration / 60);
  const secs = Math.floor(recordingDuration % 60);
  const formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // If in Glass Fullscreen mode, the camera feed is rendered full-screen in PrompterView behind the text.
  if (isGlassFullscreen) {
    return (
      <div className="fixed top-4 left-4 z-40 bg-zinc-950/90 backdrop-blur-md border border-zinc-700/80 rounded-xl px-3 py-1.5 flex items-center gap-3 text-xs text-white shadow-2xl">
        {onToggleRecord && (
          <button
            onClick={onToggleRecord}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold transition-all ${
              isRecording
                ? 'bg-red-600 text-white animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                : 'bg-zinc-800 hover:bg-zinc-700 text-red-400'
            }`}
            title={isRecording ? 'Parar gravação' : 'Iniciar gravação'}
          >
            {isRecording ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span>REC {formattedDuration}</span>
              </>
            ) : (
              <>
                <Circle className="w-3 h-3 fill-current text-red-500" />
                <span>Gravar</span>
              </>
            )}
          </button>
        )}

        <div className="flex items-center gap-1.5 font-bold text-cyan-400">
          <Eye className="w-3.5 h-3.5" />
          <span>Fundo Vidro</span>
        </div>

        {/* Audio VU meter */}
        {showAudioMeter && (
          <div className="flex items-center gap-1" title="Nível de áudio">
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

  // Determine effective blur in px via Blur background utility
  const effectiveBlur = getEffectiveBlurPx(backgroundEffect, blurAmount);

  return (
    <div
      className={`fixed ${posClasses} z-40 w-44 sm:w-60 md:w-68 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden transition-all duration-300`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top micro-bar with REC status & controls */}
      <div className="flex items-center justify-between px-2 sm:px-3 py-1 bg-zinc-900/90 border-b border-zinc-800/80 text-[10px] sm:text-[11px]">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Clickable REC button */}
          <button
            onClick={onToggleRecord}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-all ${
              isRecording
                ? 'bg-red-600/30 text-red-300 border border-red-500/60 animate-pulse'
                : 'hover:bg-zinc-800 text-zinc-300'
            }`}
            title={isRecording ? 'Clique para Parar Gravação' : 'Clique para Iniciar Gravação'}
          >
            {isRecording ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="font-bold font-mono text-red-400">REC {formattedDuration}</span>
              </>
            ) : (
              <>
                <Camera className="w-3 h-3 text-red-400" />
                <span className="font-medium text-zinc-300">Gravar</span>
              </>
            )}
          </button>

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
          {/* Background Blur / Bokeh Cycle */}
          {onChangeBackgroundEffect && (
            <button
              onClick={() => {
                const nextEffects = {
                  none: 'studio-bokeh',
                  'studio-bokeh': 'blur-medium',
                  'blur-medium': 'studio-dark',
                  'studio-dark': 'none',
                };
                const next = (nextEffects as any)[backgroundEffect] || 'none';
                onChangeBackgroundEffect(next);
              }}
              className={`p-1 rounded transition-colors ${
                backgroundEffect !== 'none'
                  ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-500/40'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
              title={`Blur background: ${backgroundEffect === 'none' ? 'Desativado' : `${effectiveBlur}px`} (Clique para alternar níveis de blur)`}
            >
              <Sparkles className="w-3 h-3" />
            </button>
          )}

          {/* Glass Fullscreen Toggle */}
          {onToggleGlassFullscreen && (
            <button
              onClick={onToggleGlassFullscreen}
              className="p-1 rounded text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800 transition-colors"
              title="Modo Vidro Transparente (Roteiro sobreposto à Câmera)"
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

      {/* Video Feed with Background Blur & Bokeh Filter */}
      <div className="relative aspect-video bg-black overflow-hidden">
        {/* Layer 1: Background Video (with Blur background if enabled) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            filter: effectiveBlur > 0 ? `blur(${effectiveBlur}px) brightness(0.9)` : 'none',
            transform: mirrorCamera ? 'scaleX(-1)' : 'none',
          }}
          className="w-full h-full object-cover transition-all duration-200"
        />

        {/* Layer 2: Focal Crisp Presenter Layer (keeps face, eyes, hair & body 100% sharp, ONLY background is blurred) */}
        {effectiveBlur > 0 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={getPresenterMaskStyle(cameraAlignment)}
          >
            <video
              ref={sharpVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                transform: mirrorCamera ? 'scaleX(-1)' : 'none',
              }}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Studio Dark Vignette Overlay */}
        {(backgroundEffect === 'studio-dark' || backgroundEffect === 'vignette') && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
            }}
          />
        )}

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
