import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  X,
  Copy,
  Check,
  ExternalLink,
  Wifi,
  Sparkles,
  Zap,
} from 'lucide-react';

interface SmartphoneRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRemoteDirectly: () => void;
}

export const SmartphoneRemoteModal: React.FC<SmartphoneRemoteModalProps> = ({
  isOpen,
  onClose,
  onOpenRemoteDirectly,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [remoteUrl, setRemoteUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    // Build the remote URL pointing to #remote
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const targetUrl = `${origin}${pathname}#remote`;
    setRemoteUrl(targetUrl);

    QRCode.toDataURL(
      targetUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrCodeDataUrl(url);
        }
      }
    );
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (navigator.clipboard && remoteUrl) {
      navigator.clipboard.writeText(remoteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Controle Remoto sem Fio</h2>
            <p className="text-xs text-zinc-400">
              Transforme seu celular ou tablet em um passador de slides/prompter
            </p>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-5 my-4">
          {qrCodeDataUrl ? (
            <div className="p-3 bg-white rounded-xl shadow-lg">
              <img
                src={qrCodeDataUrl}
                alt="QR Code para Controle Remoto"
                className="w-48 h-48 sm:w-56 sm:h-56 block object-contain"
              />
            </div>
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-zinc-500">
              Gerando QR Code...
            </div>
          )}

          <div className="flex items-center gap-2 mt-3 text-xs text-emerald-400 font-medium">
            <Wifi className="w-4 h-4" />
            <span>Aponte a câmera do celular para conectar</span>
          </div>
        </div>

        {/* URL Box & Copy */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-2 mb-4">
          <input
            type="text"
            readOnly
            value={remoteUrl}
            className="flex-1 bg-transparent text-xs text-zinc-300 font-mono outline-none px-1 select-all"
          />
          <button
            onClick={handleCopy}
            className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-medium flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>

        {/* Direct Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => {
              window.open(remoteUrl, '_blank', 'width=380,height=720');
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white flex items-center justify-center gap-2 transition-all"
          >
            <ExternalLink className="w-4 h-4 text-cyan-400" />
            <span>Abrir Controle em Nova Janela Popup</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenRemoteDirectly();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>Simular Controle Remoto nesta Tela</span>
          </button>
        </div>
      </div>
    </div>
  );
};
