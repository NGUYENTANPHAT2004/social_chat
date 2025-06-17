'use client';
import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Heart, 
  Users,
  Gift,
  Settings
} from 'lucide-react';
import Button from '@/components/atoms/Button/Button';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Badge from '@/components/atoms/Badge/Badge';
import { Room, User } from '@/types';

interface LiveStreamProps {
  room: Room;
  streamUrl?: string;
  isHost?: boolean;
  viewers: User[];
  onSendGift?: (giftId: string) => void;
  onFollow?: () => void;
  onShare?: () => void;
}

const LiveStream: React.FC<LiveStreamProps> = ({
  room,
  streamUrl,
  isHost = false,
  viewers,
  onSendGift,
  onFollow,
  onShare,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!document.fullscreenElement) {
      video.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    onFollow?.();
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
      {/* Video Player */}
      <div 
        className="relative aspect-video bg-gray-900"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {streamUrl ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            src={streamUrl}
            autoPlay
            playsInline
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-10 h-10" />
              </div>
              <p className="text-lg font-medium">Stream will start soon</p>
            </div>
          </div>
        )}

        {/* Stream Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30">
          {/* Top Bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge variant="danger" size="sm" className="bg-red-500 text-white">
                ● LIVE
              </Badge>
              <div className="flex items-center space-x-2 text-white">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{viewers.length}</span>
              </div>
            </div>
            
            {isHost && (
              <Button variant="ghost" size="sm" className="text-white">
                <Settings className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Bottom Bar */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between">
              {/* Host Info */}
              <div className="flex items-center space-x-3">
                <Avatar
                  src={room.host.avatar}
                  name={room.host.username}
                  size="md"
                  online={true}
                />
                <div className="text-white">
                  <h3 className="font-semibold">{room.host.username}</h3>
                  <p className="text-sm opacity-90">{room.name}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {!isHost && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant={isFollowing ? "secondary" : "primary"}
                    size="sm"
                    onClick={handleFollow}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${isFollowing ? 'fill-current' : ''}`} />
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onSendGift?.('1')}
                  >
                    <Gift className="w-4 h-4 mr-1" />
                    Gift
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Video Controls */}
          {showControls && streamUrl && (
            <div className={`absolute bottom-16 left-4 right-4 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center space-x-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  className="text-white"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 accent-purple-500"
                />

                <div className="flex-1"></div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white"
                >
                  <Maximize className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stream Info */}
      <div className="p-4 bg-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">{room.name}</h2>
          <div className="flex items-center space-x-2">
            {room.tags.map((tag) => (
              <Badge key={tag} variant="secondary" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-3">{room.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{viewers.length} viewers</span>
            </div>
            <div className="text-sm text-gray-500">
              Started {new Date(room.createdAt).toLocaleTimeString()}
            </div>
          </div>
          
          <Button variant="outline" size="sm" onClick={onShare}>
            Share Stream
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LiveStream;