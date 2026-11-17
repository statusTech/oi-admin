import React from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import ValueText from '@/components/ui/value-text'

const KpiCard = ({
  label,
  value,
  sublabel = null,
  badge = null,
  variant = 'secondary',
  icon = null,
  iconColor = null,
  ariaLabel,
  loading = false,
  compact = false,
  className = '',
  emphasized = false,
  onClick,
}) => {
  const showIcon = Boolean(icon)
  const isPrimary = variant === 'primary' || variant === 'oi'

  const iconWrapStyle = isPrimary
    ? undefined
    : iconColor
    ? { color: iconColor, backgroundColor: `${iconColor}18` }
    : { color: '#3B94FF', backgroundColor: 'rgba(59,148,255,0.08)' }

  return (
    <section
      className={cn(
        "border rounded-xl p-3 sm:p-3.5 flex flex-col justify-between min-h-[92px] box-border transition-all hover:shadow-xs",
        onClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isPrimary
          ? "bg-oi-blue border-transparent text-white shadow-sm hover:shadow-md hover:bg-[#2884f8]"
          : "bg-white border-oi-border hover:border-oi-blue/60",
        compact && "min-h-[48px] p-2",
        className
      )}
      role={onClick ? "button" : "group"}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)}
    >
      {/* Top row: Label + Icon */}
      <div className="flex items-center justify-between gap-1.5 w-full">
        <span
          className={cn(
            "text-xs font-medium leading-tight truncate",
            isPrimary ? "text-blue-100" : "text-oi-text-muted"
          )}
          title={typeof label === 'string' ? label : undefined}
        >
          {label}
        </span>
        {showIcon && (
          <span
            className={cn(
              "inline-flex items-center justify-center w-7 h-7 rounded-md shrink-0 [&_svg]:w-3.5 [&_svg]:h-3.5",
              isPrimary ? "bg-white/20 text-white backdrop-blur-xs" : ""
            )}
            style={iconWrapStyle}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>

      {/* Bottom row: Value occupying full width */}
      <div className="mt-2 min-w-0">
        {loading ? (
          <Skeleton className={cn("h-6 w-28", isPrimary && "bg-white/20")} />
        ) : (
          <div className="flex items-baseline justify-between gap-1">
            <ValueText
              value={value}
              tone="neutral"
              className={cn(
                'font-bold tabular-nums tracking-tight leading-none truncate block',
                isPrimary
                  ? 'text-lg sm:text-xl text-white'
                  : !emphasized ? 'text-base sm:text-lg text-oi-text' : '',
                emphasized ? 'text-4xl text-oi-text' : ''
              )}
              title={typeof value === 'string' ? value : undefined}
            />
            {badge && !loading && (
              <span
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0",
                  isPrimary ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600"
                )}
              >
                {badge}
              </span>
            )}
          </div>
        )}
        {sublabel && !loading && (
          <p
            className={cn(
              "text-[11px] mt-1 truncate",
              isPrimary ? "text-blue-200/90" : "text-muted-foreground"
            )}
            title={sublabel}
          >
            {sublabel}
          </p>
        )}
      </div>
    </section>
  )
}

export default KpiCard
