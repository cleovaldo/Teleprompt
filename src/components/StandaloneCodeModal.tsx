import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode, Sparkles } from 'lucide-react';
import { generateStandaloneTeleprompterHtml } from '../utils/standaloneHtmlGenerator';

interface StandaloneCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  scriptTitle: string;
  scriptContent: string;
}

export const StandaloneCodeModal: React.FC<StandaloneCodeModalProps> = ({
  isOpen,
  onClose,
  scriptTitle,
  scriptContent,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const htmlCode = generateStandaloneTeleprompterHtml(scriptTitle, scriptContent);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = htmlCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'teleprompter.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800/80 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-amber-400/10 text-amber-400 rounded-lg">
              <FileCode className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Código Autônomo <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 bg-zinc-800 text-amber-300 rounded">teleprompter.html</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 hidden sm:block">
                HTML + CSS + JavaScript 100% integrados em um único arquivo offline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="p-3 sm:px-6 sm:py-3 bg-amber-400/5 border-b border-amber-400/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs text-amber-200/90 shrink-0">
          <span className="flex items-center gap-2 text-[11px] sm:text-xs">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            100% offline com rolagem suave, espelhamento, gravação de vídeo e voz.
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white font-medium rounded-lg text-xs transition-colors min-h-[38px] sm:min-h-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar Código'}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-black font-semibold rounded-lg text-xs transition-colors min-h-[38px] sm:min-h-0"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar .html
            </button>
          </div>
        </div>

        {/* Code display */}
        <div className="p-4 flex-1 overflow-auto bg-black font-mono text-xs text-zinc-300 selection:bg-amber-400 selection:text-black">
          <pre className="whitespace-pre overflow-x-auto leading-relaxed">
            <code>{htmlCode}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-900/60 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <span>Como usar: Salve o arquivo como <code className="text-zinc-200">teleprompter.html</code> e dê 2 cliques para abrir em qualquer navegador offline.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
