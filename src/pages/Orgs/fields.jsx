import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { SwitchField } from '@/components/ui/switch-field';

/**
 * Campo de texto ligado ao react-hook-form dentro de um FormField do painel.
 * - mask: formata o valor guardado para exibição (ex.: percentageMask)
 * - parse: converte o texto digitado no valor guardado (ex.: removeMask)
 * - onValueChange: efeito colateral após a mudança (recebe o valor já convertido)
 */
export const ControlledInput = ({
  name,
  label,
  rules,
  mask,
  parse,
  onValueChange,
  className,
  inputClassName,
  suffix,
  ...inputProps
}) => {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <FormField label={label} htmlFor={name} error={fieldState.error?.message} className={className}>
          <div className="relative flex items-center">
            <Input
              {...inputProps}
              id={name}
              ref={field.ref}
              name={field.name}
              onBlur={field.onBlur}
              className={inputClassName}
              value={mask ? mask(field.value) : field.value ?? ''}
              onChange={(e) => {
                const value = parse ? parse(e.target.value) : e.target.value;
                field.onChange(value);
                onValueChange?.(value);
              }}
            />
            {suffix && (
              <span className="pointer-events-none absolute right-3 text-sm text-muted-foreground">{suffix}</span>
            )}
          </div>
        </FormField>
      )}
    />
  );
};

/** Switch ligado ao react-hook-form. onCheckedChange roda além de atualizar o valor. */
export const ControlledSwitch = ({ name, id, label, onCheckedChange, ...props }) => {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <SwitchField
          {...props}
          id={id ?? name}
          label={label}
          checked={Boolean(field.value)}
          onCheckedChange={(checked) => {
            field.onChange(checked);
            onCheckedChange?.(checked);
          }}
        />
      )}
    />
  );
};
