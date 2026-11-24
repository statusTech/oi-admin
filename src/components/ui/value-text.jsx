import React from 'react'
import { cn } from '@/lib/utils'

// Cor de cada tom centralizada aqui — mude só isso p/ afetar o app inteiro.
const TONE_CLASSES = {
  positive: 'text-oi-green',
  negative: 'text-oi-red',
  neutral: 'text-oi-dark-gray',
}

const ValueText = ({ value, tone = 'neutral', as: Comp = 'span', className, ...props }) => (
  <Comp className={cn('tabular-nums font-semibold', TONE_CLASSES[tone], className)} {...props}>
    {value}
  </Comp>
)

export default ValueText
