import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Rodapé padrão de formulário: ação primária primeiro, secundária ao lado.
 * - primary: { label, onClick, disabled, loading, type }
 * - secondary: { label, onClick, disabled, type }
 */
const FormActions = ({ primary, secondary, className }) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center gap-3 pt-2',
        className
      )}
    >
      {primary && (
        <Button
          type={primary.type || 'button'}
          variant="default"
          onClick={primary.onClick}
          disabled={primary.disabled || primary.loading}
          className="w-full sm:w-auto bg-oi-blue hover:bg-oi-blue/90 text-white min-w-[120px]"
        >
          {primary.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {primary.loading ? 'Salvando...' : primary.label}
        </Button>
      )}
      {secondary && (
        <Button
          type={secondary.type || 'button'}
          variant="ghost"
          onClick={secondary.onClick}
          disabled={secondary.disabled}
          className="w-full sm:w-auto"
        >
          {secondary.label}
        </Button>
      )}
    </div>
  )
}

export default FormActions
