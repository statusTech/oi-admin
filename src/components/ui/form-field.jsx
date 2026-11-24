import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function FormField({ label, htmlFor, error, helperText, className, children }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label htmlFor={htmlFor} className={cn(error && "text-destructive")}>
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : helperText ? (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  )
}
