import { Info } from "lucide-react"

import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function SwitchField({ id, label, checked, onCheckedChange, tooltip, disabled, className }) {
  const labelNode = (
    <Label
      htmlFor={id}
      className={cn("cursor-pointer select-none", tooltip && "inline-flex items-center gap-1 cursor-help")}
    >
      {label}
      {tooltip && <Info className="h-3.5 w-3.5 text-muted-foreground" />}
    </Label>
  )

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="data-[state=checked]:bg-oi-green"
      />
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{labelNode}</TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        labelNode
      )}
    </div>
  )
}
