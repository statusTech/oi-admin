import React from 'react'
import { cn } from '@/lib/utils'

const SectionCard = ({
  title,
  headerRight,
  children,
  className,
  bodyStyle,
  headerClassName,
  headerRightClassName,
  bodyClassName,
}) => {
  const hasHeader = Boolean(title || headerRight)
  return (
    <section
      className={cn(
        'bg-white border border-oi-border rounded-lg p-5 flex flex-col gap-4 w-full box-border',
        className
      )}
    >
      {hasHeader && (
        <div
          className={cn(
            'flex items-center justify-between gap-3 min-h-[28px]',
            headerClassName
          )}
        >
          <div className="flex items-center gap-2 text-oi-text text-base font-semibold">
            {title}
          </div>
          {headerRight && (
            <div className={cn('flex items-center gap-2', headerRightClassName)}>
              {headerRight}
            </div>
          )}
        </div>
      )}
      <div className={cn('flex flex-col gap-3 w-full', bodyClassName)} style={bodyStyle}>
        {children}
      </div>
    </section>
  )
}

export default SectionCard
