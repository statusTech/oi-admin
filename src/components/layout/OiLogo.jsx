import React from 'react';
import { cn } from '@/lib/utils';
import logoWhite from '@/assets/images/logo.svg';

export const OiLogo = ({ collapsed = false, className = '' }) => {
  if (collapsed) {
    return (
      <div className={cn("flex items-center justify-center select-none", className)}>
        {/* Oi icon badge: white rounded box with blue "oi" symbol */}
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-black/40 hover:scale-105 transition-transform">
          <svg
            viewBox="0 0 45 45"
            className="w-7 h-7 shrink-0"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Letter "o" in Oi signature blue */}
            <path
              d="M23.2569 34.4989C24.1001 33.5152 24.5217 32.2388 24.5217 30.6692C24.5217 29.5449 24.2055 28.655 23.5731 27.9989C22.9407 27.3435 22.0622 27.0152 20.9379 27.0152C19.6028 27.0152 18.5136 27.5071 17.6704 28.4908C16.8271 29.4746 16.4055 30.7631 16.4055 32.3557C16.4055 33.48 16.7218 34.3645 17.3542 35.0084C17.9866 35.6529 18.865 35.9746 19.9893 35.9746C21.3244 35.9746 22.4136 35.4827 23.2569 34.4989ZM14.3326 40.2786C12.8333 39.5644 11.6738 38.5516 10.8542 37.2395C10.034 35.928 9.62444 34.4056 9.62444 32.6719C9.62444 30.5874 10.1279 28.7137 11.1353 27.0503C12.1421 25.3874 13.536 24.0759 15.3163 23.1152C17.0961 22.155 19.0988 21.6746 21.3244 21.6746C23.3386 21.6746 25.0954 22.032 26.5947 22.7463C28.0934 23.461 29.2529 24.4679 30.073 25.7679C30.8927 27.0679 31.3028 28.5847 31.3028 30.3179C31.3028 32.4029 30.7988 34.2827 29.792 35.957C28.7846 37.632 27.3968 38.9496 25.6285 39.9098C23.8597 40.8705 21.8515 41.3503 19.6028 41.3503C17.588 41.3503 15.8313 40.9934 14.3326 40.2786Z"
              fill="#38A0FF"
            />
            {/* Exclamation point / "i" */}
            <path
              d="M35.835 18.9341C35.1323 18.3016 34.7809 17.5172 34.7809 16.5801C34.7809 15.4794 35.1729 14.5719 35.9579 13.8571C36.7425 13.1428 37.7789 12.7854 39.0674 12.7854C40.2384 12.7854 41.1755 13.0841 41.8782 13.6814C42.5809 14.2787 42.9323 15.0462 42.9323 15.9828C42.9323 17.1307 42.5337 18.0678 41.7377 18.7936C40.9411 19.5199 39.8986 19.8828 38.6107 19.8828C37.4627 19.8828 36.5377 19.5666 35.835 18.9341ZM34.3593 21.9908H41.0001L37.2053 41.0341H30.5647L34.3593 21.9908Z"
              fill="#38A0FF"
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center select-none py-1 overflow-hidden", className)}>
      <img
        src={logoWhite}
        alt="Oi Tickets"
        className="h-8 md:h-8.5 w-auto max-w-[145px] object-contain block drop-shadow-sm transition-opacity duration-200"
      />
    </div>
  );
};

export default OiLogo;
