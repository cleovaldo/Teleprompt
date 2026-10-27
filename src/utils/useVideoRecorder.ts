import { useState, useRef, useCallback, useEffect } from 'react';

export interface VideoRecorderState {
  isRecording: boolean;
  isCameraActive: boolean;
  recordingDuration: number;
  recordedBlob: Blob | null;
  recordedUrl: string | null;
  cameraStream: MediaStream | null;
  cameraError: string | null;
  showCameraPreview: boolean;
  cameraPosition: 'top-center' | 'top-right' | 'top-left' | 'hidden';
  mirrorCamera: boolean;
  isProcessing: boolean;
}

export function useVideoRecorder(onRecordingComplete?: (blob: Blob, url: string) => void) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showCameraPreview, setShowCameraPreview] = useState<boolean>(true);
  const [cameraPosition, setCameraPosition] = useState<'top-center' | 'top-right' | 'top-left' | 'hidden'>('top-center');
  const [mirrorCamera, setMirrorCamera] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onCompleteCbRef = useRef(onRecordingComplete);
  onCompleteCbRef.current = onRecordingComplete;

  // Stop camera tracks helper
  const stopCameraTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraStream(null);
    setIsCameraActive(false);
  }, []);

  // Request camera and microphone access
  const startCamera = useCallback(async (): Promise<MediaStream | null> => {
    try {
      setCameraError(null);
      if (streamRef.current && streamRef.current.active) {
        return streamRef.current;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;
      setCameraStream(stream);
      setIsCameraActive(true);
      return stream;
    } catch (err: any) {
      console.error('Camera/Mic permission error:', err);
      let errorMsg = 'Não foi possível acessar a câmera ou microfone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Permissão de acesso à câmera/microfone foi negada pelo navegador.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'Nenhuma câmera ou microfone foi encontrado no dispositivo.';
      }
      setCameraError(errorMsg);
      setIsCameraActive(false);
      return null;
    }
  }, []);

  // Determine supported mimeType with fallback
  const getSupportedMimeType = (): string => {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4;codecs=avc1,mp4a',
      'video/mp4',
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  };

  // Start recording
  const startRecording = useCallback(async (customStream?: MediaStream) => {
    try {
      setCameraError(null);
      let stream = customStream || streamRef.current;
      if (!stream || !stream.active) {
        stream = await startCamera();
        if (!stream) {
          throw new Error('Câmera não inicializada');
        }
      }

      chunksRef.current = [];
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        setIsProcessing(false);
        const finalMimeType = recorder.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: finalMimeType });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        setIsRecording(false);
        if (durationTimerRef.current) {
          clearInterval(durationTimerRef.current);
          durationTimerRef.current = null;
        }

        // Notify callback immediately
        if (onCompleteCbRef.current) {
          onCompleteCbRef.current(blob, url);
        }
      };

      recorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event);
        setIsRecording(false);
        setIsProcessing(false);
      };

      // Request data slice every 1 second
      recorder.start(1000);
      setIsRecording(true);
      setRecordingDuration(0);

      // Duration counter
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to start MediaRecorder:', err);
      setCameraError(`Erro ao iniciar a gravação: ${err.message || 'Falha de gravação'}`);
      setIsRecording(false);
      setIsProcessing(false);
    }
  }, [startCamera]);

  // Stop recording with return promise
  const stopRecording = useCallback((): Promise<{ blob: Blob; url: string } | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        setIsRecording(false);
        resolve(null);
        return;
      }

      setIsProcessing(true);

      const handleStop = () => {
        const finalMimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: finalMimeType });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        setIsRecording(false);
        setIsProcessing(false);

        if (durationTimerRef.current) {
          clearInterval(durationTimerRef.current);
          durationTimerRef.current = null;
        }

        if (onCompleteCbRef.current) {
          onCompleteCbRef.current(blob, url);
        }

        resolve({ blob, url });
      };

      // Set one-time listener
      mediaRecorderRef.current.addEventListener('stop', handleStop, { once: true });
      mediaRecorderRef.current.stop();
    });
  }, []);

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      return stopRecording();
    } else {
      return startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Clean recorded video
  const clearRecordedVideo = useCallback(() => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingDuration(0);
  }, [recordedUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCameraTracks();
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [stopCameraTracks, recordedUrl]);

  return {
    isRecording,
    isCameraActive,
    recordingDuration,
    recordedBlob,
    recordedUrl,
    cameraStream,
    cameraError,
    showCameraPreview,
    cameraPosition,
    mirrorCamera,
    isProcessing,
    startCamera,
    stopCamera: stopCameraTracks,
    startRecording,
    stopRecording,
    toggleRecording,
    clearRecordedVideo,
    setShowCameraPreview,
    setCameraPosition,
    setMirrorCamera,
  };
}
