import React, { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Loader2 } from 'lucide-react';

import Api from '@/api';
import { currencyMask, percentageMask, removeMask } from '@/utils/mask';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { toast } from '@/hooks/use-toast';
import { ControlledInput, ControlledSwitch } from './fields';
import MpStatus from './mpStatus';

const defaultApiEndpoint = import.meta.env.VITE_ENDPOINT_DEFAULT ?? 'https://api.oitickets.com.br/api/v1';

// Sub-formulário da loja virtual: roda dentro do FormProvider de form.jsx e
// grava tudo sob o nó `eCommerce` do formulário.
const FormECommerce = ({ isWebstoreNameAvailable, clientId }) => {
  const { control, setValue } = useFormContext();
  const [chargeClient, adminTax, credit, hasSplit] = useWatch({
    control,
    name: ['eCommerce.chargeClient', 'eCommerce.adminTax', 'eCommerce.credit', 'eCommerce.hasSplit'],
  });

  const [buttonLoading, setButtonLoading] = useState(false);
  const [oAuthAuthenticationUrl, setOAuthAuthenticationUrl] = useState(null);

  const set = (field, value) => setValue(`eCommerce.${field}`, value, { shouldDirty: true });

  const loadOAuthUrl = async () => {
    setButtonLoading(true);

    try {
      const req = await Api.get(`/oauth/mercadopago/authorize?clientId=${clientId}`, {
        baseURL: defaultApiEndpoint,
      });

      if (req.data?.success && req.data?.authUrl) {
        setOAuthAuthenticationUrl(req.data.authUrl);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Falha ao gerar a url de autenticação.' });
    }

    setButtonLoading(false);
  };

  const copyOAuthUrl = () => {
    if (!oAuthAuthenticationUrl) {
      toast({ variant: 'destructive', title: 'Nenhuma url de autenticação disponível para copiar.' });
      return;
    }
    navigator.clipboard
      .writeText(oAuthAuthenticationUrl)
      .then(() => toast({ variant: 'success', title: 'Url de autenticação copiada!' }))
      .catch(() => toast({ variant: 'destructive', title: 'Falha ao copiar a url de autenticação.' }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <ControlledSwitch
          name="eCommerce.chargeClient"
          label="Cobrar do cliente"
          onCheckedChange={(checked) => {
            if (!checked) {
              set('additionalTaxCard', null);
              set('additionalTaxPix', null);
            }
          }}
        />
        <ControlledSwitch
          name="eCommerce.adminTax"
          label="Taxa administrativa"
          onCheckedChange={() => {
            set('adminTaxValue', 0);
            set('adminTaxPercentage', 0);
            set('adminTaxMinimum', 0);
          }}
        />
      </div>

      {adminTax && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Valor fixo e percentual são excludentes: preencher um zera o outro. */}
          <ControlledInput
            name="eCommerce.adminTaxValue"
            label="Taxa (R$)"
            mask={currencyMask}
            parse={removeMask}
            onValueChange={() => set('adminTaxPercentage', 0)}
          />
          <ControlledInput
            name="eCommerce.adminTaxPercentage"
            label="Taxa (%)"
            mask={percentageMask}
            parse={removeMask}
            onValueChange={() => set('adminTaxValue', 0)}
          />
          <ControlledInput
            name="eCommerce.adminTaxMinimum"
            label="Taxa mínima (R$)"
            mask={currencyMask}
            parse={removeMask}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-wide font-medium text-oi-text-muted">
          Formas de pagamento
        </span>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <ControlledSwitch
            name="eCommerce.credit"
            label="Cartão de crédito"
            onCheckedChange={(checked) => {
              if (!checked) set('allowInstallments', false);
            }}
          />
          {credit && <ControlledSwitch name="eCommerce.allowInstallments" label="Permitir parcelamento" />}
          <ControlledSwitch name="eCommerce.pix" label="PIX" />
        </div>
      </div>

      <ControlledInput
        name="eCommerce.webstoreUrl"
        label="Nome da loja virtual"
        disabled={!isWebstoreNameAvailable}
        inputClassName="pr-28"
        suffix=".listapix.com"
        className="max-w-md"
      />

      <ControlledSwitch
        name="eCommerce.hasSplit"
        label="Split"
        onCheckedChange={() => {
          set('splitValue', 0);
          set('splitPercentage', 0);
          set('additionalTaxCard', null);
          set('additionalTaxPix', null);
        }}
      />

      {hasSplit && (
        <>
          <ControlledInput name="eCommerce.gatewayToken" label="ID do Mercado Pago" className="max-w-md" />

          {chargeClient && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
              <ControlledInput
                name="eCommerce.additionalTaxCard"
                label="Taxa adicional cartão (%)"
                mask={percentageMask}
                parse={removeMask}
              />
              <ControlledInput
                name="eCommerce.additionalTaxPix"
                label="Taxa adicional PIX (%)"
                mask={percentageMask}
                parse={removeMask}
              />
            </div>
          )}

          <MpStatus clientId={clientId} enabled={hasSplit} />

          <div className="flex flex-col sm:flex-row sm:items-end gap-3 max-w-2xl">
            <FormField label="Url de autenticação OAuth" htmlFor="oauthUrl" className="flex-1">
              <Input
                id="oauthUrl"
                readOnly
                disabled={!oAuthAuthenticationUrl}
                value={oAuthAuthenticationUrl ?? 'Nenhuma url gerada'}
              />
            </FormField>
            <Button type="button" variant="outline" onClick={copyOAuthUrl} disabled={!oAuthAuthenticationUrl}>
              Copiar
            </Button>
            <Button type="button" variant="ghost" onClick={loadOAuthUrl} disabled={buttonLoading}>
              {buttonLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Gerar url de autenticação
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default FormECommerce;
