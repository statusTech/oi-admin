import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, trailingIcon: TrailingIcon, ...props }, ref) => {
  const input = (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        TrailingIcon && "pr-9",
        className
      )}
      ref={ref}
      {...props} />
  );

  if (!TrailingIcon) return input

  return (
    <div className="relative flex items-center">
      {input}
      <TrailingIcon className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" />
    </div>
  )
})
Input.displayName = "Input"

export { Input }
