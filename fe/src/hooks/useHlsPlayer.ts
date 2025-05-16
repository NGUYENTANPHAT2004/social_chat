// src/hooks/useHlsPlayer.ts
import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface UseHlsPlayerProps {
  src: string;
  autoPlay?: boolean;
}

export const useHlsPlayer = ({ src, autoPlay = true }: UseHlsPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    let hls: Hls;

    const initializePlayer = () => {
      if (!videoRef.current) return;

      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hls.loadSource(src);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoPlay && videoRef.current) {
            videoRef.current.play().catch(error => {
              console.error('Error auto-playing video:', error);
            });
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('Network error, trying to recover...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('Media error, trying to recover...');
                hls.recoverMediaError();
                break;
              default:
                console.error('Unrecoverable error:', data);
                hls.destroy();
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        videoRef.current.src = src;
        if (autoPlay) {
          videoRef.current.play().catch(error => {
            console.error('Error auto-playing video:', error);
          });
        }
      }
    };

    if (src) {
      initializePlayer();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay]);

  return videoRef;
};