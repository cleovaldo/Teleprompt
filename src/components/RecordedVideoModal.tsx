import React from 'react';
import { X, Download, RotateCcw, Video, CheckCircle2, Clock, HardDrive, Loader2 } from 'lucide-react';

interface RecordedVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string | null;
  videoBlob: Blob | null;
  durationSeconds: number;
  scriptTitle: string;
  onRecordAgain: () => void;
}

export const RecordedVideoModal: React.FC<RecordedVideoModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  videoBlob,
  durationSeconds,
  scriptTitle,
  onRecordAgain,
}) => {
  if (!isOpen) return null;

  const fileSizeMB = videoBlob ? (videoBlob.size / (1024 * 1024)).toFixed(2) : '0';
  const mins = Math.floor(durationSeconds / 60);
  const secs = Math.floor(durationSeconds % 60);
  const formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const handleDownload = () => {
    if (!videoUrl) return;
    const cleanTitle = (scriptTitle || 'video_teleprompter')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '');
    const extension = videoBlob?.type.includes('mp4') ? 'mp4' : 'webm';
    const filename = `${cleanTitle}_${timestamp}.${extension}`;

    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Vídeo Gravado com Sucesso</h2>
              <p className="text-[11px] sm:text-xs text-zinc-400">Assista ao seu take, faça o download ou regrave</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Container */}
        <div className="p-3 sm:p-6 bg-black flex justify-center items-center overflow-hidden flex-1 min-h-[220px]">
          {videoUrl ? (
            <div className="relative w-full max-w-2xl bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 aspect-video max-h-[45vh] shadow-2xl flex items-center justify-center">
              <video
                src={videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-zinc-400 py-12">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <span className="text-sm font-medium">Finalizando e gerando arquivo de vídeo...</span>
            </div>
          )}
        </div>

        {/* Meta details bar */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-zinc-900/50 border-t border-zinc-800/80 flex items-center justify-around text-[11px] sm:text-xs text-zinc-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>Duração: <strong className="text-zinc-200 font-mono">{formattedDuration}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
            <span>Tamanho: <strong className="text-zinc-200 font-mono">{fileSizeMB} MB</strong></span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-zinc-500" />
            <span>Formato: <strong className="text-zinc-200 font-mono">{videoBlob?.type || 'video/webm'}</strong></span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 sm:px-6 sm:py-4 bg-zinc-900/80 border-t border-zinc-800 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 shrink-0 pb-safe">
          <button
            onClick={() => {
              onClose();
              onRecordAgain();
            }}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-200 hover:text-white font-medium rounded-xl sm:rounded-lg text-xs transition-colors flex items-center justify-center gap-2 min-h-[44px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Gravar Novamente
          </button>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="hidden sm:block px-4 py-2 text-zinc-400 hover:text-white text-xs font-medium"
            >
              Concluir
            </button>
            <button
              onClick={handleDownload}
              disabled={!videoUrl}
              className="w-full sm:w-auto flex-1 sm:flex-initial px-5 py-2.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-black font-bold rounded-xl sm:rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Baixar Vídeo Gravado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
