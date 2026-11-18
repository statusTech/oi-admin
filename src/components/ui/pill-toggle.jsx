import React from 'react';
import { cn } from '@/lib/utils';

const VARIANTS = {
  primary: {
    active: 'bg-oi-blue shadow-[inset_0_0_0_1px_#3B94FF] text-white font-medium',
    inactive: 'bg-transparent shadow-[inset_0_0_0_1px_#E5E7EB] text-oi-text-muted hover:bg-muted',
  },
  secondary: {
    active: 'bg-oi-blue/10 shadow-[inset_0_0_0_1px_#3B94FF] text-oi-blue font-medium',
    inactive: 'bg-transparent shadow-[inset_0_0_0_1px_#E5E7EB] text-oi-text-muted hover:bg-muted',
  },
};

const SIZES = {
  lg: 'px-4 py-2.5 text-[13px]',
  md: 'px-4 py-1.5 text-[13px]',
  sm: 'px-3 py-1 text-[12px]',
  toolbar: 'px-3 py-1.5 text-[13px]',
};

export default function PillToggle({
  label,
  options,
  value,
  onChange,
  variant = 'primary',
  size = 'md',
  className,
  pillFillMaxSize
}) {
  const styles = VARIANTS[variant];

  return (
    <div className={className}>
      {label && (
        <div className="text-[11px] uppercase tracking-wide text-oi-text-muted font-medium mb-1">
          {label}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={opt.disabled}
              onClick={() => !opt.disabled && onChange(opt.value)}
              className={cn(
                'appearance-none border-0 outline-none rounded-full cursor-pointer transition-colors flex items-center gap-1.5',
                SIZES[size],
                active ? styles.active : styles.inactive,
                opt.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
                pillFillMaxSize ? 'max-md:w-full' : ''
              )}
            >
              {opt.label}
              {opt.count !== undefined && (
                <span
                  className={cn(
                    'text-xs tabular-nums',
                    active ? 'text-white/70' : 'text-muted-foreground'
                  )}
                >
                  {opt.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
