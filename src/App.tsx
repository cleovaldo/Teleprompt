/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  PrompterConfig,
  ScriptItem,
  DEFAULT_CONFIG,
  SAMPLE_SCRIPTS,
} from './types';
import { EditorView } from './components/EditorView';
import { PrompterView } from './components/PrompterView';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { StandaloneCodeModal } from './components/StandaloneCodeModal';
import { RecordedVideoModal } from './components/RecordedVideoModal';
import { SmartphoneRemoteModal } from './components/SmartphoneRemoteModal';
import { SmartphoneRemoteView } from './components/SmartphoneRemoteView';
import { useVideoRecorder } from './utils/useVideoRecorder';

const SCRIPTS_STORAGE_KEY = 'prompter_pro_scripts_v1';
const CURRENT_ID_STORAGE_KEY = 'prompter_pro_current_id_v1';
const CONFIG_STORAGE_KEY = 'prompter_pro_config_v1';

export default function App() {
  const [mode, setMode] = useState<'editor' | 'prompter' | 'remote'>(() => {
    if (
      typeof window !== 'undefined' &&
      (window.location.hash === '#remote' || window.location.search.includes('remote=1'))
    ) {
      return 'remote';
    }
    return 'editor';
  });

  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isStandaloneModalOpen, setIsStandaloneModalOpen] = useState<boolean>(false);
  const [isRecordedVideoModalOpen, setIsRecordedVideoModalOpen] = useState<boolean>(false);
  const [isRemoteModalOpen, setIsRemoteModalOpen] = useState<boolean>(false);

  const videoRecorder = useVideoRecorder();

  // Listen for hashchange (e.g. user goes to #remote or clears hash)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#remote') {
        setMode('remote');
      } else if (mode === 'remote') {
        setMode('editor');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [mode]);

  // Initialize saved scripts from localStorage or default samples
  const [savedScripts, setSavedScripts] = useState<ScriptItem[]>(() => {
    try {
      const stored = localStorage.getItem(SCRIPTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load scripts from localStorage:', e);
    }
    return SAMPLE_SCRIPTS;
  });

  // Current active script ID
  const [currentScriptId, setCurrentScriptId] = useState<string>(() => {
    try {
      const storedId = localStorage.getItem(CURRENT_ID_STORAGE_KEY);
      if (storedId) return storedId;
    } catch {}
    return SAMPLE_SCRIPTS[0].id;
  });

  // Teleprompter configuration
  const [config, setConfig] = useState<PrompterConfig>(() => {
    try {
      const storedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (storedConfig) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(storedConfig) };
      }
    } catch {}
    return DEFAULT_CONFIG;
  });

  // Persist scripts
  useEffect(() => {
    try {
      localStorage.setItem(SCRIPTS_STORAGE_KEY, JSON.stringify(savedScripts));
    } catch (e) {
      console.error('Failed to save scripts to localStorage:', e);
    }
  }, [savedScripts]);

  // Persist current script id
  useEffect(() => {
    try {
      localStorage.setItem(CURRENT_ID_STORAGE_KEY, currentScriptId);
    } catch {}
  }, [currentScriptId]);

  // Persist config
  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch {}
  }, [config]);

  // Active script object
  const currentScript = savedScripts.find((s) => s.id === currentScriptId) || savedScripts[0];

  // Update active script content
  const handleUpdateScript = (title: string, content: string) => {
    setSavedScripts((prev) =>
      prev.map((s) =>
        s.id === currentScript.id
          ? { ...s, title, content, lastModified: Date.now() }
          : s
      )
    );
  };

  // Create new script
  const handleCreateScript = () => {
    const newScript: ScriptItem = {
      id: `script-${Date.now()}`,
      title: `Novo Roteiro ${savedScripts.length + 1}`,
      content: 'Digite ou cole seu roteiro aqui...',
      lastModified: Date.now(),
    };
    setSavedScripts((prev) => [newScript, ...prev]);
    setCurrentScriptId(newScript.id);
  };

  // Duplicate current script
  const handleDuplicateScript = () => {
    const copyScript: ScriptItem = {
      id: `script-${Date.now()}`,
      title: `${currentScript.title} (Cópia)`,
      content: currentScript.content,
      lastModified: Date.now(),
    };
    setSavedScripts((prev) => [copyScript, ...prev]);
    setCurrentScriptId(copyScript.id);
  };

  // Delete script
  const handleDeleteScript = (scriptId: string) => {
    if (savedScripts.length <= 1) return;
    const remaining = savedScripts.filter((s) => s.id !== scriptId);
    setSavedScripts(remaining);
    if (currentScriptId === scriptId) {
      setCurrentScriptId(remaining[0].id);
    }
  };

  // Update prompter config
  const handleUpdateConfig = (updated: Partial<PrompterConfig>) => {
    setConfig((prev) => ({ ...prev, ...updated }));
  };

  // Switch to presentation mode
  const handleStartPrompter = () => {
    setMode('prompter');
  };

  // Global keydown listeners for editor mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (mode === 'editor') {
          e.preventDefault();
          handleStartPrompter();
        }
      } else if (e.key === '?' && mode === 'editor') {
        // Only trigger if not actively typing inside textarea or input
        const activeTag = document.activeElement?.tagName;
        if (activeTag !== 'TEXTAREA' && activeTag !== 'INPUT') {
          e.preventDefault();
          setIsShortcutsOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode]);

  // Mode: Dedicated Smartphone Remote
  if (mode === 'remote') {
    return (
      <SmartphoneRemoteView
        onExitRemote={() => {
          if (window.location.hash === '#remote') {
            window.location.hash = '';
          }
          setMode('editor');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {mode === 'editor' ? (
        <EditorView
          currentScript={currentScript}
          savedScripts={savedScripts}
          config={config}
          onUpdateScript={handleUpdateScript}
          onSelectScript={setCurrentScriptId}
          onCreateScript={handleCreateScript}
          onDuplicateScript={handleDuplicateScript}
          onDeleteScript={handleDeleteScript}
          onUpdateConfig={handleUpdateConfig}
          onStartPrompter={handleStartPrompter}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenStandaloneModal={() => setIsStandaloneModalOpen(true)}
          onOpenRemoteModal={() => setIsRemoteModalOpen(true)}
          videoRecorder={videoRecorder}
          onOpenRecordedVideoModal={() => setIsRecordedVideoModalOpen(true)}
        />
      ) : (
        <PrompterView
          scriptTitle={currentScript.title}
          scriptContent={currentScript.content}
          config={config}
          onUpdateConfig={handleUpdateConfig}
          onExit={() => setMode('editor')}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenRemoteModal={() => setIsRemoteModalOpen(true)}
          videoRecorder={videoRecorder}
          onOpenRecordedVideoModal={() => setIsRecordedVideoModalOpen(true)}
        />
      )}

      {/* Recorded Video Modal */}
      <RecordedVideoModal
        isOpen={isRecordedVideoModalOpen}
        onClose={() => setIsRecordedVideoModalOpen(false)}
        videoUrl={videoRecorder.recordedUrl}
        videoBlob={videoRecorder.recordedBlob}
        durationSeconds={videoRecorder.recordingDuration}
        scriptTitle={currentScript.title}
        onRecordAgain={async () => {
          setIsRecordedVideoModalOpen(false);
          videoRecorder.clearRecordedVideo();
          setMode('prompter');
          await videoRecorder.startRecording();
        }}
      />

      {/* Smartphone Remote QR Code Modal */}
      <SmartphoneRemoteModal
        isOpen={isRemoteModalOpen}
        onClose={() => setIsRemoteModalOpen(false)}
        onOpenRemoteDirectly={() => setMode('remote')}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Standalone Code Export Modal */}
      <StandaloneCodeModal
        isOpen={isStandaloneModalOpen}
        onClose={() => setIsStandaloneModalOpen(false)}
        scriptTitle={currentScript.title}
        scriptContent={currentScript.content}
      />
    </div>
  );
}
