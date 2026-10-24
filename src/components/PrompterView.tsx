import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  FlipHorizontal,
  FlipVertical,
  Sliders,
  Eye,
  EyeOff,
  Clock,
  ChevronUp,
  ChevronDown,
  Camera,
  Focus,
  Smartphone,
  Target,
  Bookmark,
  Users,
  Volume2,
  FastForward,
  Rewind,
  X,
  Grid,
} from 'lucide-react';
import { PrompterConfig, COLOR_THEMES, TextColorTheme } from '../types';
import { SpeechScrollManager, findSpokenTextPosition, findKaraokeWordMatch } from '../utils/speechRecognition';
import { CameraPreviewPIP } from './CameraPreviewPIP';
import { useVideoRecorder } from '../utils/useVideoRecorder';
import { RemoteChannel } from '../utils/remoteChannel';
import { parseScriptContent, ScriptSection } from '../utils/scriptParser';
import { useAudioLevel } from '../utils/useAudioLevel';

interface PrompterViewProps {
  scriptTitle: string;
  scriptContent: string;
  config: PrompterConfig;
  onUpdateConfig: (updated: Partial<PrompterConfig>) => void;
  onExit: () => void;
  onOpenShortcuts: () => void;
  onOpenRemoteModal: () => void;
  videoRecorder: ReturnType<typeof useVideoRecorder>;
  onOpenRecordedVideoModal: () => void;
}

export const PrompterView: React.FC<PrompterViewProps> = ({
  scriptTitle,
  scriptContent,
  config,
  onUpdateConfig,
  onExit,
  onOpenShortcuts,
  onOpenRemoteModal,
  videoRecorder,
  onOpenRecordedVideoModal,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [showSectionsDrawer, setShowSectionsDrawer] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number | null>(
    config.enableCountdown ? config.countdownSeconds : null
  );
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceSupported, setVoiceSupported] = useState<boolean>(true);
  const [progressRatio, setProgressRatio] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const horizontalViewportRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const scrollYRef = useRef<number>(0);
  const scrollXRef = useRef<number>(0);
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechManagerRef = useRef<SpeechScrollManager | null>(null);
  const remoteChannelRef = useRef<RemoteChannel | null>(null);

  // Parse structured script content (sections, speakers, and word tokens)
  const parsedData = useMemo(() => {
    return parseScriptContent(scriptContent);
  }, [scriptContent]);

  const { lines, sections, allWords, uniqueSpeakers } = parsedData;

  // Real-time audio VU meter
  const audioLevel = useAudioLevel(videoRecorder.cameraStream, config.showAudioMeter);

  // Total words and estimated duration
  const totalWords = allWords.length;
  const totalEstimatedSeconds = useMemo(() => {
    if (totalWords === 0) return 0;
    return Math.ceil((totalWords / config.wordsPerMinute) * 60);
  }, [totalWords, config.wordsPerMinute]);

  // Keep background fullscreen video connected to camera stream
  useEffect(() => {
    if (
      config.cameraOverlayMode === 'fullscreen-glass' &&
      backgroundVideoRef.current &&
      videoRecorder.cameraStream
    ) {
      backgroundVideoRef.current.srcObject = videoRecorder.cameraStream;
    }
  }, [config.cameraOverlayMode, videoRecorder.cameraStream]);

  // Check speech recognition support
  useEffect(() => {
    setVoiceSupported(SpeechScrollManager.isSupported());
  }, []);

  // Sync state back to remote channel
  const broadcastCurrentStatus = useCallback(() => {
    if (!remoteChannelRef.current) return;
    remoteChannelRef.current.broadcastStatus({
      isPlaying,
      speed: config.speed,
      fontSize: config.fontSize,
      title: scriptTitle,
      cameraAlignment: config.cameraAlignment,
      flipHorizontal: config.flipHorizontal,
      elapsedSeconds,
      targetDurationSeconds: config.targetDurationSeconds,
      totalEstimatedSeconds,
      progressRatio,
      isVoiceActive,
    });
  }, [
    isPlaying,
    config.speed,
    config.fontSize,
    scriptTitle,
    config.cameraAlignment,
    config.flipHorizontal,
    elapsedSeconds,
    config.targetDurationSeconds,
    totalEstimatedSeconds,
    progressRatio,
    isVoiceActive,
  ]);

  // Jump to specific section
  const handleJumpToSection = useCallback((section: ScriptSection) => {
    if (viewportRef.current) {
      const lineEl = document.getElementById(`prompter-line-${section.lineIndex}`);
      if (lineEl) {
        const eyelineOffset = window.innerHeight * (config.eyelinePosition / 100);
        const targetScroll = Math.max(0, lineEl.offsetTop - eyelineOffset);
        scrollYRef.current = targetScroll;
        viewportRef.current.scrollTo({
          top: targetScroll,
          behavior: 'smooth',
        });
      }
    }
    setShowSectionsDrawer(false);
  }, [config.eyelinePosition]);

  // Auto-hide controls timer
  const resetAutoHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
    }
    if (isPlaying && config.autoHideControls && !showSettingsDrawer && !showSectionsDrawer) {
      autoHideTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 2500);
    }
  }, [isPlaying, config.autoHideControls, showSettingsDrawer, showSectionsDrawer]);

  // Start play
  const startPrompter = useCallback(() => {
    if (config.scrollDirection === 'horizontal') {
      if (horizontalViewportRef.current) {
        scrollXRef.current = horizontalViewportRef.current.scrollLeft;
      }
    } else {
      if (viewportRef.current) {
        scrollYRef.current = viewportRef.current.scrollTop;
      }
    }
    lastTimestampRef.current = 0;
    setIsPlaying(true);
    resetAutoHideTimer();
  }, [config.scrollDirection, resetAutoHideTimer]);

  // Pause play
  const pausePrompter = useCallback(() => {
    setIsPlaying(false);
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    setControlsVisible(true);
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pausePrompter();
    } else {
      startPrompter();
    }
  }, [isPlaying, pausePrompter, startPrompter]);

  // Restart to top
  const handleRestart = useCallback(() => {
    pausePrompter();
    scrollYRef.current = 0;
    scrollXRef.current = 0;
    if (viewportRef.current) {
      viewportRef.current.scrollTop = 0;
    }
    if (horizontalViewportRef.current) {
      horizontalViewportRef.current.scrollLeft = 0;
    }
    setProgressRatio(0);
    setElapsedSeconds(0);
    setActiveWordIndex(null);
  }, [pausePrompter]);

  // Initialize Remote Channel Bus for Smartphone Remote Control
  useEffect(() => {
    const remote = new RemoteChannel();
    remoteChannelRef.current = remote;

    remote.setOnCommand((cmd) => {
      switch (cmd.type) {
        case 'play':
          startPrompter();
          break;
        case 'pause':
          pausePrompter();
          break;
        case 'toggle_play':
          togglePlayPause();
          break;
        case 'speed_up':
          onUpdateConfig({ speed: Math.min(20, config.speed + 1) });
          break;
        case 'speed_down':
          onUpdateConfig({ speed: Math.max(1, config.speed - 1) });
          break;
        case 'font_up':
          onUpdateConfig({ fontSize: Math.min(120, config.fontSize + 4) });
          break;
        case 'font_down':
          onUpdateConfig({ fontSize: Math.max(24, config.fontSize - 4) });
          break;
        case 'restart':
          handleRestart();
          break;
        case 'align_camera':
          if (cmd.payload) {
            const offset = cmd.payload === 'left' ? 18 : cmd.payload === 'right' ? 82 : 50;
            onUpdateConfig({
              cameraAlignment: cmd.payload,
              horizontalOffsetPercent: offset,
              textAlign: cmd.payload,
            });
          }
          break;
        case 'toggle_flip':
          onUpdateConfig({ flipHorizontal: !config.flipHorizontal });
          break;
        case 'toggle_voice':
          handleToggleVoice();
          break;
        case 'next_section': {
          if (sections.length > 0) {
            const currentIdx = Math.floor(progressRatio * sections.length);
            const nextSec = sections[Math.min(sections.length - 1, currentIdx + 1)];
            if (nextSec) handleJumpToSection(nextSec);
          }
          break;
        }
        case 'prev_section': {
          if (sections.length > 0) {
            const currentIdx = Math.floor(progressRatio * sections.length);
            const prevSec = sections[Math.max(0, currentIdx - 1)];
            if (prevSec) handleJumpToSection(prevSec);
          }
          break;
        }
        case 'sync_state_req':
          broadcastCurrentStatus();
          break;
      }
    });

    broadcastCurrentStatus();

    return () => {
      remote.destroy();
      remoteChannelRef.current = null;
    };
  }, [
    startPrompter,
    pausePrompter,
    togglePlayPause,
    handleRestart,
    config.speed,
    config.fontSize,
    config.flipHorizontal,
    broadcastCurrentStatus,
    sections,
    progressRatio,
    handleJumpToSection,
    onUpdateConfig,
  ]);

  // Sync status to remote every second
  useEffect(() => {
    broadcastCurrentStatus();
  }, [broadcastCurrentStatus, isPlaying, elapsedSeconds, progressRatio]);

  // Toggle voice recognition
  const handleToggleVoice = useCallback(() => {
    if (!voiceSupported) return;

    if (isVoiceActive) {
      speechManagerRef.current?.stop();
      setIsVoiceActive(false);
    } else {
      speechManagerRef.current?.start();
      setIsVoiceActive(true);
    }
  }, [isVoiceActive, voiceSupported]);

  // Initialize Speech Scroll Manager with word-by-word karaoke tracking
  useEffect(() => {
    if (!SpeechScrollManager.isSupported()) return;

    speechManagerRef.current = new SpeechScrollManager(
      (spokenPhrase) => {
        setVoiceTranscript(spokenPhrase);

        // 1. Karaoke Word Highlight
        if (config.enableKaraokeHighlight && allWords.length > 0) {
          const matchedWordIdx = findKaraokeWordMatch(
            spokenPhrase,
            allWords,
            activeWordIndex || 0
          );
          if (matchedWordIdx !== null) {
            setActiveWordIndex(matchedWordIdx);
            // Smoothly align active word with reading eyeline
            const wordEl = document.getElementById(`prompter-word-${matchedWordIdx}`);
            if (wordEl && viewportRef.current) {
              const eyelineOffset = window.innerHeight * (config.eyelinePosition / 100);
              const targetScroll = Math.max(0, wordEl.offsetTop - eyelineOffset);
              scrollYRef.current = targetScroll;
              viewportRef.current.scrollTo({
                top: targetScroll,
                behavior: 'smooth',
              });
            }
          }
        }

        // 2. Continuous speech position tracking
        const match = findSpokenTextPosition(spokenPhrase, scriptContent, progressRatio);
        if (match) {
          if (config.scrollDirection === 'horizontal' && horizontalViewportRef.current) {
            const hViewport = horizontalViewportRef.current;
            const maxScrollX = hViewport.scrollWidth - hViewport.clientWidth;
            if (maxScrollX > 0) {
              const targetX = match.targetRatio * maxScrollX;
              scrollXRef.current = targetX;
              hViewport.scrollLeft = targetX;
            }
          } else if (viewportRef.current && !config.enableKaraokeHighlight) {
            const viewport = viewportRef.current;
            const maxScroll = viewport.scrollHeight - viewport.clientHeight;
            if (maxScroll > 0) {
              const targetY = match.targetRatio * maxScroll;
              scrollYRef.current = targetY;
              viewport.scrollTop = targetY;
            }
          }
        }
      },
      (err) => {
        console.warn('Voice recognition error:', err);
        setIsVoiceActive(false);
      },
      config.voiceLanguage || 'pt-BR'
    );

    return () => {
      speechManagerRef.current?.stop();
    };
  }, [
    scriptContent,
    progressRatio,
    config.scrollDirection,
    config.enableKaraokeHighlight,
    config.voiceLanguage,
    config.eyelinePosition,
    allWords,
    activeWordIndex,
  ]);

  // Elapsed timer tracking
  useEffect(() => {
    if (isPlaying) {
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
      }
    }
    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [isPlaying]);

  // Scroll animation loop with Auto-Pace Ramp
  const scrollLoop = useCallback((timestamp: number) => {
    if (!lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;
    }

    const delta = Math.min((timestamp - lastTimestampRef.current) / 1000, 0.1);
    lastTimestampRef.current = timestamp;

    let effectiveSpeed = config.speed;

    // Auto-Pace Ramp calculation
    if (config.enableAutoPaceRamp && config.targetDurationSeconds > 0) {
      const remainingTime = Math.max(1, config.targetDurationSeconds - elapsedSeconds);
      const remainingProgress = Math.max(0.01, 1 - progressRatio);
      // Adaptive speed factor
      const idealSpeed = (remainingProgress / remainingTime) * 35;
      effectiveSpeed = Math.min(20, Math.max(1, Math.round(idealSpeed)));
    }

    if (config.scrollDirection === 'horizontal') {
      const hViewport = horizontalViewportRef.current;
      if (hViewport) {
        const pixelsPerSecond = effectiveSpeed * 32;
        scrollXRef.current += pixelsPerSecond * delta;
        hViewport.scrollLeft = scrollXRef.current;

        const maxScroll = hViewport.scrollWidth - hViewport.clientWidth;
        if (maxScroll > 0) {
          const ratio = Math.min(1, Math.max(0, hViewport.scrollLeft / maxScroll));
          setProgressRatio(ratio);

          if (hViewport.scrollLeft >= maxScroll - 5) {
            setIsPlaying(false);
            setControlsVisible(true);
            return;
          }
        }
      }
    } else {
      const viewport = viewportRef.current;
      if (viewport) {
        const pixelsPerSecond = effectiveSpeed * 20;
        scrollYRef.current += pixelsPerSecond * delta;
        viewport.scrollTop = scrollYRef.current;

        const maxScroll = viewport.scrollHeight - viewport.clientHeight;
        if (maxScroll > 0) {
          const ratio = Math.min(1, Math.max(0, viewport.scrollTop / maxScroll));
          setProgressRatio(ratio);

          if (viewport.scrollTop >= maxScroll - 5) {
            setIsPlaying(false);
            setControlsVisible(true);
            return;
          }
        }
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
  }, [
    config.speed,
    config.scrollDirection,
    config.enableAutoPaceRamp,
    config.targetDurationSeconds,
    elapsedSeconds,
    progressRatio,
  ]);

  // Play animation frame trigger
  useEffect(() => {
    if (isPlaying) {
      animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isPlaying, scrollLoop]);

  // Jump to specific chunk in horizontal mode
  const handleHorizontalClick = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
    const target = e.currentTarget;
    if (!horizontalViewportRef.current) return;
    const hViewport = horizontalViewportRef.current;
    const centerScreen = window.innerWidth / 2;
    const targetLeft = target.offsetLeft - centerScreen + target.offsetWidth / 2;
    scrollXRef.current = Math.max(0, targetLeft);
    hViewport.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: 'smooth',
    });
  }, []);

  // Jump to line in vertical mode
  const handleLineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (!viewportRef.current) return;
    const eyelineOffset = window.innerHeight * (config.eyelinePosition / 100);
    const targetScroll = Math.max(0, target.offsetTop - eyelineOffset);
    scrollYRef.current = targetScroll;
    viewportRef.current.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });
  }, [config.eyelinePosition]);

  // Sync scroll on manual viewport scroll
  const handleViewportScroll = useCallback(() => {
    if (!viewportRef.current) return;
    const viewport = viewportRef.current;
    const maxScroll = viewport.scrollHeight - viewport.clientHeight;
    if (maxScroll > 0) {
      setProgressRatio(Math.min(1, Math.max(0, viewport.scrollTop / maxScroll)));
    }
  }, []);

  const handleHorizontalScroll = useCallback(() => {
    if (!horizontalViewportRef.current) return;
    const hViewport = horizontalViewportRef.current;
    const maxScroll = hViewport.scrollWidth - hViewport.clientWidth;
    if (maxScroll > 0) {
      setProgressRatio(Math.min(1, Math.max(0, hViewport.scrollLeft / maxScroll)));
    }
  }, []);

  // Countdown effect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null);
      startPrompter();
    }
  }, [countdown, startPrompter]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (countdown !== null && countdown > 0) {
        if (e.code === 'Space') {
          e.preventDefault();
          setCountdown(null);
          startPrompter();
          return;
        }
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        onUpdateConfig({ speed: Math.min(20, config.speed + 1) });
        resetAutoHideTimer();
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        onUpdateConfig({ speed: Math.max(1, config.speed - 1) });
        resetAutoHideTimer();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (config.scrollDirection === 'horizontal' && horizontalViewportRef.current) {
          scrollXRef.current = Math.max(0, scrollXRef.current - config.speed * 120);
          horizontalViewportRef.current.scrollLeft = scrollXRef.current;
        } else if (viewportRef.current) {
          scrollYRef.current = Math.max(0, scrollYRef.current - config.speed * 80);
          viewportRef.current.scrollTop = scrollYRef.current;
        }
        resetAutoHideTimer();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (config.scrollDirection === 'horizontal' && horizontalViewportRef.current) {
          const maxScrollX =
            horizontalViewportRef.current.scrollWidth - horizontalViewportRef.current.clientWidth;
          scrollXRef.current = Math.min(maxScrollX, scrollXRef.current + config.speed * 120);
          horizontalViewportRef.current.scrollLeft = scrollXRef.current;
        } else if (viewportRef.current) {
          scrollYRef.current = Math.min(
            viewportRef.current.scrollHeight - viewportRef.current.clientHeight,
            scrollYRef.current + config.speed * 80
          );
          viewportRef.current.scrollTop = scrollYRef.current;
        }
        resetAutoHideTimer();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        onOpenRemoteModal();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setShowSectionsDrawer((prev) => !prev);
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        onUpdateConfig({ enableKaraokeHighlight: !config.enableKaraokeHighlight });
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        const nextAlign =
          config.cameraAlignment === 'left'
            ? 'center'
            : config.cameraAlignment === 'center'
            ? 'right'
            : 'left';
        const nextOffset = nextAlign === 'left' ? 18 : nextAlign === 'right' ? 82 : 50;
        onUpdateConfig({
          cameraAlignment: nextAlign,
          horizontalOffsetPercent: nextOffset,
          textAlign: nextAlign,
        });
      } else if (e.key === 'r' || e.key === 'R') {
        if (!e.shiftKey) {
          e.preventDefault();
          handleRestart();
        }
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        onUpdateConfig({ flipHorizontal: !config.flipHorizontal });
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        onUpdateConfig({ flipVertical: !config.flipVertical });
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        onUpdateConfig({
          scrollDirection: config.scrollDirection === 'horizontal' ? 'vertical' : 'horizontal',
        });
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleVoice();
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        onUpdateConfig({ showEyelineGuide: !config.showEyelineGuide });
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        pausePrompter();
        onExit();
      } else if (e.key === '?') {
        e.preventDefault();
        onOpenShortcuts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    countdown,
    startPrompter,
    togglePlayPause,
    config,
    onUpdateConfig,
    resetAutoHideTimer,
    handleRestart,
    handleToggleVoice,
    toggleFullscreen,
    pausePrompter,
    onExit,
    onOpenShortcuts,
    onOpenRemoteModal,
  ]);

  // Mirror transform style
  const mirrorTransform = useMemo(() => {
    if (config.flipHorizontal && config.flipVertical) return 'scale(-1, -1)';
    if (config.flipHorizontal) return 'scaleX(-1)';
    if (config.flipVertical) return 'scaleY(-1)';
    return 'none';
  }, [config.flipHorizontal, config.flipVertical]);

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Pacing status calculation
  const pacingStatus = useMemo(() => {
    if (config.targetDurationSeconds <= 0) return null;
    const expectedRatio = elapsedSeconds / config.targetDurationSeconds;
    const delta = progressRatio - expectedRatio;
    if (Math.abs(delta) <= 0.06) {
      return { label: 'No Ritmo Certo', color: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/50' };
    }
    if (delta < -0.06) {
      return { label: 'Acelere a Fala', color: 'text-amber-300 bg-amber-950/80 border-amber-500/50' };
    }
    return { label: 'Desacelere', color: 'text-cyan-300 bg-cyan-950/80 border-cyan-500/50' };
  }, [config.targetDurationSeconds, elapsedSeconds, progressRatio]);

  return (
    <div
      className="fixed inset-0 text-white overflow-hidden select-none z-40"
      style={{
        backgroundColor:
          config.cameraOverlayMode === 'fullscreen-glass'
            ? `rgba(0, 0, 0, ${config.prompterBackgroundOpacity / 100})`
            : '#000000',
      }}
      onMouseMove={() => resetAutoHideTimer()}
      onClick={() => {
        if (showSettingsDrawer) setShowSettingsDrawer(false);
        if (showSectionsDrawer) setShowSectionsDrawer(false);
      }}
    >
      {/* 5. Fullscreen Glass Camera Video Stream (Under text) */}
      {config.cameraOverlayMode === 'fullscreen-glass' && videoRecorder.cameraStream && (
        <video
          ref={backgroundVideoRef}
          autoPlay
          playsInline
          muted
          className={`fixed inset-0 w-full h-full object-cover -z-10 pointer-events-none transition-all duration-300 ${
            videoRecorder.mirrorCamera ? '-scale-x-100' : ''
          }`}
        />
      )}

      {/* Framing Guides Overlay */}
      {config.cameraFramingGuide === '16:9' && (
        <div className="fixed inset-4 sm:inset-12 border-2 border-dashed border-cyan-400/40 pointer-events-none z-10 flex items-start justify-end p-2">
          <span className="text-[10px] bg-black/80 text-cyan-300 px-2 py-0.5 rounded font-mono">
            Guia 16:9 Widescreen
          </span>
        </div>
      )}

      {config.cameraFramingGuide === '9:16' && (
        <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-[56.25vh] max-w-full border-2 border-dashed border-amber-400/50 pointer-events-none z-10 flex items-start justify-center p-2">
          <span className="text-[10px] bg-black/80 text-amber-300 px-2 py-0.5 rounded font-mono">
            Guia 9:16 Shorts / Reels
          </span>
        </div>
      )}

      {config.cameraFramingGuide === 'grid' && (
        <div className="fixed inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3 border border-white/5">
          <div className="border-r border-b border-white/10" />
          <div className="border-r border-b border-white/10" />
          <div className="border-b border-white/10" />
          <div className="border-r border-b border-white/10" />
          <div className="border-r border-b border-white/10" />
          <div className="border-b border-white/10" />
          <div className="border-r border-white/10" />
          <div className="border-r border-white/10" />
          <div />
        </div>
      )}

      {/* Floating PIP Camera Preview */}
      {config.cameraOverlayMode === 'pip' &&
        videoRecorder.showCameraPreview &&
        videoRecorder.cameraStream && (
          <CameraPreviewPIP
            stream={videoRecorder.cameraStream}
            isRecording={videoRecorder.isRecording}
            recordingDuration={videoRecorder.recordingDuration}
            mirrorCamera={videoRecorder.mirrorCamera}
            position={videoRecorder.cameraPosition}
            framingGuide={config.cameraFramingGuide}
            showAudioMeter={config.showAudioMeter}
            onToggleMirror={() => videoRecorder.setMirrorCamera(!videoRecorder.mirrorCamera)}
            onChangePosition={(pos) => videoRecorder.setCameraPosition(pos)}
            onToggleGlassFullscreen={() => onUpdateConfig({ cameraOverlayMode: 'fullscreen-glass' })}
            onChangeFramingGuide={(g) => onUpdateConfig({ cameraFramingGuide: g })}
            onClose={() => videoRecorder.setShowCameraPreview(false)}
          />
        )}

      {/* 3. Top HUD: Pacing Target Timer & Audio VU Meter */}
      <div
        className={`fixed top-3 inset-x-4 sm:inset-x-6 z-30 flex items-center justify-between pointer-events-none transition-all duration-300 ${
          controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        {/* Left: Script Title & Speaker Filter */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="px-3 py-1 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-full text-xs font-semibold text-zinc-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="max-w-[150px] sm:max-w-[260px] truncate">{scriptTitle}</span>
          </div>

          {/* 4. Multi-Speaker Filter Chip */}
          {uniqueSpeakers.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-full p-1 text-xs">
              <button
                onClick={() => onUpdateConfig({ activeSpeakerFilter: 'all' })}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                  config.activeSpeakerFilter === 'all'
                    ? 'bg-amber-400 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              {uniqueSpeakers.map((spk) => (
                <button
                  key={spk}
                  onClick={() => onUpdateConfig({ activeSpeakerFilter: spk })}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                    config.activeSpeakerFilter === spk
                      ? 'bg-amber-400 text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {spk}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center / Right: Pacing Target Gauge & Audio Meter */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Pacing Target Gauge */}
          {config.targetDurationSeconds > 0 && pacingStatus && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950/90 border border-zinc-800 backdrop-blur-md shadow-xl text-xs">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono font-bold text-white">
                {formatTime(elapsedSeconds)} / {formatTime(config.targetDurationSeconds)}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${pacingStatus.color}`}
              >
                {pacingStatus.label}
              </span>
            </div>
          )}

          {/* Audio VU Meter */}
          {config.showAudioMeter && videoRecorder.cameraStream && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950/90 border border-zinc-800 backdrop-blur-md text-xs"
              title="Nível de captação do microfone"
            >
              <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
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
        </div>
      </div>

      {/* Main Reading Viewports */}
      {config.scrollDirection === 'horizontal' ? (
        /* Horizontal Mode */
        <div className="relative w-full h-full flex flex-col justify-center items-center overflow-hidden">
          {/* Central Eyeline Reticle for Horizontal Reading */}
          {config.showEyelineGuide && (
            <div
              className="absolute pointer-events-none z-30 flex flex-col items-center justify-between transition-all duration-150"
              style={{
                left: `${config.horizontalOffsetPercent}%`,
                transform: 'translateX(-50%)',
                top:
                  config.horizontalBandPosition === 'top'
                    ? '28px'
                    : config.horizontalBandPosition === 'center'
                    ? 'calc(50% - 130px)'
                    : 'calc(100% - 290px)',
                height: '240px',
                opacity: config.guideOpacity,
              }}
            >
              <div className="flex flex-col items-center gap-0.5 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.95)]">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 bg-black/85 px-2.5 py-0.5 rounded-full border border-amber-400/40 whitespace-nowrap">
                  Olhe Aqui (
                  {config.cameraAlignment === 'left'
                    ? 'Câmera Esq.'
                    : config.cameraAlignment === 'right'
                    ? 'Câmera Dir.'
                    : 'Câmera Centro'}
                  )
                </span>
                <span className="text-2xl font-black">▼</span>
              </div>
              <div
                className="w-[2px] flex-1 my-1"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(251,191,36,0.95), rgba(251,191,36,0.2) 50%, rgba(251,191,36,0.95))',
                  boxShadow: '0 0 10px rgba(251,191,36,0.8)',
                }}
              />
              <div className="text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.95)]">
                <span className="text-2xl font-black">▲</span>
              </div>
            </div>
          )}

          {/* Horizontal Track */}
          <div
            ref={horizontalViewportRef}
            onScroll={handleHorizontalScroll}
            className={`w-full overflow-x-scroll no-scrollbar py-6 transition-all duration-300 ${
              config.horizontalBandPosition === 'top'
                ? 'absolute top-14 sm:top-20 inset-x-0'
                : config.horizontalBandPosition === 'center'
                ? 'my-auto w-full'
                : 'absolute bottom-28 sm:bottom-36 inset-x-0'
            }`}
            style={{
              scrollBehavior: 'auto',
              maskImage:
                'linear-gradient(90deg, transparent 0%, black 15%, black 85%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(90deg, transparent 0%, black 15%, black 85%, transparent 100%)',
            }}
          >
            <div
              style={{
                transform: mirrorTransform,
                transformOrigin: 'center center',
                fontSize: `${config.fontSize}px`,
                color: COLOR_THEMES[config.colorTheme].hex,
                paddingLeft: `${config.horizontalOffsetPercent}vw`,
                paddingRight: '100vw',
              }}
              className="flex items-center gap-10 whitespace-nowrap font-sans font-medium select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]"
            >
              {lines
                .filter((l) => !l.isEmpty)
                .map((line) => {
                  if (line.isPause) {
                    return (
                      <span
                        key={line.lineIndex}
                        onClick={handleHorizontalClick}
                        className="px-4 py-1.5 rounded-full bg-red-950/80 border border-red-500/70 text-red-300 text-[0.6em] font-mono font-bold tracking-wider cursor-pointer hover:bg-red-900 transition-colors shadow-lg shrink-0"
                      >
                        ⏱ {line.text}
                      </span>
                    );
                  }

                  if (line.isSectionHeader) {
                    return (
                      <span
                        key={line.lineIndex}
                        onClick={handleHorizontalClick}
                        className="px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/70 text-indigo-300 text-[0.6em] font-bold tracking-wider cursor-pointer shrink-0 flex items-center gap-1.5"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                        {line.sectionTitle}
                      </span>
                    );
                  }

                  return (
                    <span
                      key={line.lineIndex}
                      onClick={handleHorizontalClick}
                      className="cursor-pointer hover:underline underline-offset-8 transition-opacity shrink-0 px-2"
                    >
                      {line.speakerTag && (
                        <span className="mr-2 text-[0.65em] font-black uppercase text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30">
                          [{line.speakerTag}]
                        </span>
                      )}
                      {line.pureDialogue}
                    </span>
                  );
                })}
            </div>
          </div>
        </div>
      ) : (
        /* Vertical Mode */
        <>
          {/* Eyeline Guide Beam */}
          {config.showEyelineGuide && (
            <div
              className="fixed left-0 w-full pointer-events-none z-30 transition-all duration-150 flex items-center justify-between"
              style={{
                top: `${config.eyelinePosition}%`,
                opacity: config.guideOpacity,
              }}
            >
              <div className="flex items-center gap-1.5 pl-4 sm:pl-8 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
                <span className="text-xl sm:text-2xl font-black">▶</span>
              </div>
              <div
                className="flex-1 h-[2px] mx-2 relative"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(251, 191, 36, 0.4) 15%, rgba(251, 191, 36, 0.95) 50%, rgba(251, 191, 36, 0.4) 85%, transparent 100%)',
                  boxShadow: '0 0 12px rgba(251, 191, 36, 0.6)',
                }}
              >
                <div
                  className="absolute -top-3.5 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-150"
                  style={{ left: `${config.horizontalOffsetPercent}%` }}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)] ring-2 ring-black" />
                  <span className="text-[9px] uppercase font-bold tracking-wider text-amber-300 bg-black/90 px-2 py-0.5 rounded-full border border-amber-400/40 whitespace-nowrap mt-1">
                    ● Lente (
                    {config.cameraAlignment === 'left'
                      ? 'Esq.'
                      : config.cameraAlignment === 'right'
                      ? 'Dir.'
                      : 'Centro'}
                    )
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 pr-4 sm:pr-8 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
                <span className="text-xl sm:text-2xl font-black">◀</span>
              </div>
            </div>
          )}

          {/* Main Prompter Text Viewport */}
          <div
            ref={viewportRef}
            onScroll={handleViewportScroll}
            className="w-full h-full overflow-y-scroll no-scrollbar"
            style={{ scrollBehavior: 'auto' }}
          >
            <div
              ref={textContainerRef}
              style={{
                marginLeft: `${Math.max(
                  0,
                  ((100 - config.marginWidth) * config.horizontalOffsetPercent) / 100
                )}%`,
                width: `${config.marginWidth}%`,
                maxWidth: `${config.marginWidth}%`,
                transform: mirrorTransform,
                transformOrigin:
                  config.cameraAlignment === 'left'
                    ? 'left center'
                    : config.cameraAlignment === 'right'
                    ? 'right center'
                    : 'center center',
                fontSize: `${config.fontSize}px`,
                lineHeight: config.lineHeight,
                textAlign: config.textAlign,
                color: COLOR_THEMES[config.colorTheme].hex,
              }}
              className="pt-[38vh] pb-[80vh] px-4 font-sans font-medium tracking-normal transition-all duration-150 drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]"
            >
              {lines.map((line) => {
                if (line.isEmpty) {
                  return <div key={line.lineIndex} className="h-[1.2em]" />;
                }

                // Check speaker filter
                const isFilteredOut =
                  config.activeSpeakerFilter !== 'all' &&
                  line.speakerTag &&
                  line.speakerTag.toUpperCase() !== config.activeSpeakerFilter.toUpperCase();

                // 4. Section Header Banner
                if (line.isSectionHeader) {
                  return (
                    <div
                      key={line.lineIndex}
                      id={`prompter-line-${line.lineIndex}`}
                      onClick={handleLineClick}
                      className="my-8 p-3 rounded-xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-200 text-[0.6em] font-bold tracking-wider cursor-pointer hover:bg-indigo-900 transition-colors flex items-center gap-2 shadow-xl"
                    >
                      <Bookmark className="w-5 h-5 text-indigo-400" />
                      <span>{line.sectionTitle}</span>
                    </div>
                  );
                }

                // Pause Pill
                if (line.isPause) {
                  return (
                    <div
                      key={line.lineIndex}
                      id={`prompter-line-${line.lineIndex}`}
                      onClick={handleLineClick}
                      className="my-6 py-2 px-4 rounded-lg bg-red-950/40 border border-red-500/50 text-red-300 text-[0.65em] font-mono font-bold tracking-wider cursor-pointer hover:bg-red-900/40 transition-colors w-fit shadow-md"
                    >
                      ⏱ {line.text}
                    </div>
                  );
                }

                // Direction Pill
                if (line.isDirection) {
                  return (
                    <div
                      key={line.lineIndex}
                      id={`prompter-line-${line.lineIndex}`}
                      onClick={handleLineClick}
                      className="my-4 py-1.5 px-3 rounded-lg bg-purple-950/40 border border-purple-500/40 text-purple-300 text-[0.6em] font-sans italic cursor-pointer hover:bg-purple-900/40 transition-colors w-fit"
                    >
                      🎬 {line.text}
                    </div>
                  );
                }

                // Regular dialogue line with speaker tag & 2. Karaoke Word Highlight
                return (
                  <div
                    key={line.lineIndex}
                    id={`prompter-line-${line.lineIndex}`}
                    onClick={handleLineClick}
                    className={`mb-8 cursor-pointer rounded transition-all duration-200 ${
                      line.speakerStyle ? line.speakerStyle.borderClass : ''
                    } ${isFilteredOut ? 'opacity-20 blur-[0.5px]' : 'opacity-100'}`}
                  >
                    {/* Speaker badge */}
                    {line.speakerTag && (
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span
                          className={`text-[0.45em] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            line.speakerStyle?.badgeBg || 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {line.speakerTag}
                        </span>
                      </div>
                    )}

                    {/* Words with Karaoke Highlight */}
                    <div className="inline">
                      {line.words.map((word) => {
                        const isSpoken = activeWordIndex !== null && word.id === activeWordIndex;
                        const isPast = activeWordIndex !== null && word.id < activeWordIndex;

                        return (
                          <span
                            key={word.id}
                            id={`prompter-word-${word.id}`}
                            className={`inline-block mr-[0.28em] transition-all duration-150 ${
                              isSpoken && config.enableKaraokeHighlight
                                ? 'bg-amber-400/30 text-amber-200 ring-2 ring-amber-400/90 rounded px-1 scale-105 shadow-[0_0_15px_rgba(251,191,36,0.6)] font-bold'
                                : isPast && config.enableKaraokeHighlight
                                ? 'opacity-65'
                                : 'opacity-100'
                            }`}
                          >
                            {word.rawWord}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* 3-2-1 Countdown Overlay */}
      {countdown !== null && countdown > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer"
          onClick={() => {
            setCountdown(null);
            startPrompter();
          }}
        >
          <span className="text-zinc-500 text-sm font-semibold tracking-widest uppercase mb-4">
            Preparando gravação...
          </span>
          <div className="text-9xl font-black text-amber-400 animate-bounce drop-shadow-[0_0_30px_rgba(251,191,36,0.6)]">
            {countdown}
          </div>
          <p className="text-zinc-400 text-xs mt-8">
            Clique na tela ou pressione <kbd className="px-2 py-0.5 bg-zinc-800 text-zinc-200 rounded">Espaço</kbd> para iniciar
          </p>
        </div>
      )}

      {/* 4. Section Bookmarks Drawer */}
      {showSectionsDrawer && (
        <div
          className="fixed right-4 bottom-24 z-50 w-72 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-4 text-white animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Bookmark className="w-4 h-4" />
              <span>Capítulos / Seções ({sections.length})</span>
            </div>
            <button
              onClick={() => setShowSectionsDrawer(false)}
              className="p-1 text-zinc-400 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 max-h-60 overflow-y-auto space-y-1.5">
            {sections.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">
                Nenhuma seção encontrada. Adicione <code className="text-amber-400">[SEÇÃO: Título]</code> no seu roteiro.
              </p>
            ) : (
              sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => handleJumpToSection(sec)}
                  className="w-full text-left p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 text-xs text-zinc-200 hover:text-white flex items-center justify-between transition-colors"
                >
                  <span className="truncate">{sec.title}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Pular ➔</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating Control Bar Dock (Natural Thumb Zone) */}
      <div
        className={`fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 w-[96%] max-w-fit ${
          controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-2">
          {/* Main Controls Pill */}
          <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/90 rounded-full shadow-2xl text-zinc-200 w-full sm:w-auto">
            {/* Exit to Editor */}
            <button
              onClick={() => {
                pausePrompter();
                onExit();
              }}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-full transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center shrink-0"
              title="Voltar ao Editor (Esc)"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Restart from Top */}
            <button
              onClick={handleRestart}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-full transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center shrink-0"
              title="Reiniciar do Topo (R)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Big Play / Pause Button */}
            <button
              onClick={togglePlayPause}
              className={`p-2.5 sm:p-3 rounded-full font-bold transition-all shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 ${
                isPlaying
                  ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
              }`}
              title={isPlaying ? 'Pausar (Espaço)' : 'Iniciar Rolagem (Espaço)'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            {/* 1. Smartphone Remote Button */}
            <button
              onClick={onOpenRemoteModal}
              className="p-2 text-amber-400 hover:text-amber-300 hover:bg-zinc-800/80 rounded-full transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center shrink-0"
              title="Abrir QR Code para Controle Remoto Celular (P)"
            >
              <Smartphone className="w-4 h-4" />
            </button>

            {/* 4. Section Bookmarks Drawer Button */}
            <button
              onClick={() => setShowSectionsDrawer((prev) => !prev)}
              className={`p-2 rounded-full transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center shrink-0 ${
                showSectionsDrawer
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
              }`}
              title="Capítulos e Seções do Roteiro (S)"
            >
              <Bookmark className="w-4 h-4" />
            </button>

            {/* Quick Camera Eye Alignment */}
            <button
              onClick={() => {
                const nextAlign =
                  config.cameraAlignment === 'left'
                    ? 'center'
                    : config.cameraAlignment === 'center'
                    ? 'right'
                    : 'left';
                const nextOffset = nextAlign === 'left' ? 18 : nextAlign === 'right' ? 82 : 50;
                onUpdateConfig({
                  cameraAlignment: nextAlign,
                  horizontalOffsetPercent: nextOffset,
                  textAlign: nextAlign,
                });
                resetAutoHideTimer();
              }}
              className="px-2.5 py-1.5 rounded-full transition-all text-xs font-semibold flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 shrink-0 min-h-[36px]"
              title={`Alinhamento do Olhar com a Câmera: ${config.cameraAlignment} (L)`}
            >
              <Focus className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-300">
                {config.cameraAlignment === 'left' ? '◧ Esq' : config.cameraAlignment === 'right' ? '◨ Dir' : '◨ Centro'}
              </span>
            </button>

            {/* Speed Controls */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-zinc-900 rounded-full border border-zinc-800">
              <button
                onClick={() => onUpdateConfig({ speed: Math.max(1, config.speed - 1) })}
                className="p-1 text-zinc-400 hover:text-white rounded-full"
                title="Diminuir velocidade (↓)"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono font-bold text-amber-300 w-8 text-center">
                {config.speed}x
              </span>
              <button
                onClick={() => onUpdateConfig({ speed: Math.min(20, config.speed + 1) })}
                className="p-1 text-zinc-400 hover:text-white rounded-full"
                title="Aumentar velocidade (↑)"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. VoiceTrack / Karaoke Toggle */}
            {voiceSupported && (
              <button
                onClick={handleToggleVoice}
                className={`p-2 rounded-full transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center shrink-0 ${
                  isVoiceActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                }`}
                title="VoiceTrack: Acompanhamento por Voz & Karaokê (M)"
              >
                {isVoiceActive ? <Mic className="w-4 h-4 text-cyan-400 animate-pulse" /> : <MicOff className="w-4 h-4" />}
              </button>
            )}

            {/* Settings Drawer Button */}
            <button
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              className={`p-2 rounded-full transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center shrink-0 ${
                showSettingsDrawer
                  ? 'bg-zinc-800 text-white ring-1 ring-amber-400'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
              }`}
              title="Ajustes de Leitura"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Drawer Modal */}
      {showSettingsDrawer && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-sm bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-4 text-white space-y-3 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Ajustes do Teleprompter
            </span>
            <button
              onClick={() => setShowSettingsDrawer(false)}
              className="p-1 text-zinc-400 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Speed slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Velocidade</span>
              <span className="text-amber-400 font-mono font-bold">{config.speed}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={config.speed}
              onChange={(e) => onUpdateConfig({ speed: parseInt(e.target.value, 10) })}
              className="w-full accent-amber-400 cursor-pointer h-1.5"
            />
          </div>

          {/* Font size */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Tamanho da Fonte</span>
              <span className="text-cyan-400 font-mono font-bold">{config.fontSize}px</span>
            </div>
            <input
              type="range"
              min="24"
              max="110"
              value={config.fontSize}
              onChange={(e) => onUpdateConfig({ fontSize: parseInt(e.target.value, 10) })}
              className="w-full accent-cyan-400 cursor-pointer h-1.5"
            />
          </div>

          {/* Karaoke Toggle */}
          <label className="flex items-center justify-between cursor-pointer py-1 text-xs text-zinc-300 hover:text-white">
            <span>Realce Karaokê Palavra-a-Palavra</span>
            <input
              type="checkbox"
              checked={config.enableKaraokeHighlight}
              onChange={(e) => onUpdateConfig({ enableKaraokeHighlight: e.target.checked })}
              className="accent-amber-400 w-4 h-4 cursor-pointer"
            />
          </label>

          {/* Glass background opacity (if in glass mode) */}
          {config.cameraOverlayMode === 'fullscreen-glass' && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Transparência do Fundo (Vidro)</span>
                <span className="text-cyan-400 font-mono font-bold">
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
            </div>
          )}

          {/* Optical mirror toggles */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
            <button
              onClick={() => onUpdateConfig({ flipHorizontal: !config.flipHorizontal })}
              className={`py-1.5 px-2 rounded-lg border text-xs font-semibold ${
                config.flipHorizontal
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              ⇄ Flip Horizontal
            </button>
            <button
              onClick={() => onUpdateConfig({ flipVertical: !config.flipVertical })}
              className={`py-1.5 px-2 rounded-lg border text-xs font-semibold ${
                config.flipVertical
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              ⇅ Flip Vertical
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
