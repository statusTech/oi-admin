"use client"

import { AlertCircle, CheckCircle2 } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

const VARIANT_ICON = {
  destructive: AlertCircle,
  success: CheckCircle2,
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={3000}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const Icon = VARIANT_ICON[variant]
        return (
          <Toast key={id} variant={variant} {...props}>
            {Icon && <Icon className="h-5 w-5 shrink-0" />}
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
