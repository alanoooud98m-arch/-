
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface PlayButtonProps {
  onClick: () => void;
  isPlaying: boolean;
  isLoading: boolean;
}

export const PlayButton: React.FC<PlayButtonProps> = ({ onClick, isPlaying, isLoading }) => {
  const buttonText = isPlaying ? "إيقاف" : "تشغيل الصوت";
  const Icon = isPlaying ? 'fa-solid fa-stop' : 'fa-solid fa-play';

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`
        flex items-center justify-center
        px-8 py-4 w-64 h-16
        text-xl font-bold rounded-full shadow-lg
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-4 focus:ring-amber-500/50
        transform hover:scale-105
        disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
        ${
          isPlaying
            ? 'bg-red-600 text-white'
            : 'bg-amber-800 text-white'
        }
      `}
    >
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <i className={`${Icon} ml-3`}></i>
          <span>{buttonText}</span>
        </>
      )}
    </button>
  );
};
