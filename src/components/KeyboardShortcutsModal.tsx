import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Espaço', desc: 'Iniciar / Pausar rolagem contínua', context: 'Teleprompter' },
    { key: '↑ / ↓', desc: 'Aumentar / Diminuir velocidade (+ / -)', context: 'Teleprompter' },
    { key: '← / →', desc: 'Recuar / Avançar 5 segundos de leitura', context: 'Teleprompter' },
    { key: 'R', desc: 'Reiniciar a leitura do topo', context: 'Teleprompter' },
    { key: 'F', desc: 'Alternar Tela Cheia (Fullscreen)', context: 'Geral' },
    { key: 'H', desc: 'Espelhar Horizontalmente (Beam Splitter / Vidro)', context: 'Teleprompter' },
    { key: 'V', desc: 'Espelhar Verticalmente (Flip Vertical)', context: 'Teleprompter' },
    { key: 'C', desc: 'Exibir / Ocultar Prévia da Câmera (PIP)', context: 'Teleprompter' },
    { key: 'Shift + R', desc: 'Iniciar / Parar Gravação de Vídeo', context: 'Teleprompter' },
    { key: 'O', desc: 'Alternar Rolagem: Vertical ↕ / Letreiro Horizontal ↔ (YouTube)', context: 'Teleprompter' },
    { key: 'L', desc: 'Alternar Alinhamento com a Câmera (Esquerda / Centro / Direita)', context: 'Teleprompter' },
    { key: 'P', desc: 'Abrir QR Code para Controle Remoto Celular', context: 'Teleprompter' },
    { key: 'S', desc: 'Abrir Gaveta de Seções e Capítulos do Roteiro', context: 'Teleprompter' },
    { key: 'K', desc: 'Alternar Realce Palavra-a-Palavra (Modo Karaokê)', context: 'Teleprompter' },
    { key: 'Y', desc: 'Alternar Modo YouTube (16:9 Paisagem / Widescreen)', context: 'Teleprompter' },
    { key: 'G', desc: 'Ocultar / Exibir Linha Guia do Olhar', context: 'Teleprompter' },
    { key: 'M', desc: 'Ativar / Desativar Reconhecimento de Voz', context: 'Teleprompter' },
    { key: 'Esc', desc: 'Sair da apresentação e voltar ao Editor', context: 'Teleprompter' },
    { key: 'Ctrl + Enter', desc: 'Iniciar o teleprompter a partir do Editor', context: 'Editor' },
    { key: '?', desc: 'Abrir este painel de atalhos rápidos', context: 'Geral' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800/80 bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 bg-amber-400/10 text-amber-400 rounded-lg">
              <Keyboard className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Atalhos de Teclado Profissionais</h2>
              <p className="text-[11px] sm:text-xs text-zinc-400">Controle o teleprompter sem tocar na tela durante a gravação</p>
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

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-2">
          {shortcuts.map((item, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-zinc-200">{item.desc}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-500 font-mono">{item.context}</span>
                <kbd className="px-2.5 py-1 text-xs font-semibold font-mono bg-zinc-800 text-amber-300 border border-zinc-700/80 rounded shadow-sm">
                  {item.key}
                </kbd>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3.5 bg-zinc-900/40 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Command className="w-3.5 h-3.5 text-zinc-500" /> Dica: Pressione <strong className="text-zinc-200">?</strong> a qualquer momento
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg text-xs transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
