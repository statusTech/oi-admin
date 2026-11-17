import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

import Api from '@/api';
import { currencyMask, percentageMask, removeMask } from '@/utils/mask';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { SwitchField } from '@/components/ui/switch-field';
import { toast } from '@/hooks/use-toast';

const defaultApiEndpoint = import.meta.env.VITE_ENDPOINT_DEFAULT ?? 'https://api.oitickets.com.br/api/v1';

const FormECommerce = ({ data, setData, isWebstoreNameAvailable, clientId }) => {
  const [buttonLoading, setButtonLoading] = useState(false);
  const [oAuthAuthenticationUrl, setOAuthAuthenticationUrl] = useState(null);

  const handleChangeOpposite = (e, field, opposite) => {
    setData({ ...data, [field]: removeMask(e.target.value), [opposite]: 0 });
  };

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
        <SwitchField
          id="chargeClient"
          label="Cobrar do cliente"
          checked={data.chargeClient}
          onCheckedChange={(checked) =>
            setData({
              ...data,
              chargeClient: checked,
              ...(checked ? {} : { additionalTaxCard: null, additionalTaxPix: null }),
            })
          }
        />
        <SwitchField
          id="adminTax"
          label="Taxa administrativa"
          checked={data.adminTax}
          onCheckedChange={(checked) =>
            setData({ ...data, adminTaxValue: 0, adminTaxPercentage: 0, adminTaxMinimum: 0, adminTax: checked })
          }
        />
      </div>

      {data.adminTax && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="Taxa (R$)" htmlFor="adminTaxValue">
            <Input
              id="adminTaxValue"
              value={currencyMask(data.adminTaxValue)}
              onChange={(e) => handleChangeOpposite(e, 'adminTaxValue', 'adminTaxPercentage')}
            />
          </FormField>
          <FormField label="Taxa (%)" htmlFor="adminTaxPercentage">
            <Input
              id="adminTaxPercentage"
              value={percentageMask(data.adminTaxPercentage)}
              onChange={(e) => handleChangeOpposite(e, 'adminTaxPercentage', 'adminTaxValue')}
            />
          </FormField>
          <FormField label="Taxa mínima (R$)" htmlFor="adminTaxMinimum">
            <Input
              id="adminTaxMinimum"
              value={currencyMask(data?.adminTaxMinimum)}
              onChange={(e) => setData({ ...data, adminTaxMinimum: removeMask(e.target.value) })}
            />
          </FormField>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-wide font-medium text-oi-text-muted">
          Formas de pagamento
        </span>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <SwitchField
            id="credit"
            label="Cartão de crédito"
            checked={data.credit}
            onCheckedChange={(checked) =>
              setData({
                ...data,
                credit: checked,
                allowInstallments: checked ? data.allowInstallments : false,
              })
            }
          />
          {data.credit && (
            <SwitchField
              id="allowInstallments"
              label="Permitir parcelamento"
              checked={data.allowInstallments}
              onCheckedChange={(checked) => setData({ ...data, allowInstallments: checked })}
            />
          )}
          <SwitchField
            id="pix"
            label="PIX"
            checked={data.pix}
            onCheckedChange={(checked) => setData({ ...data, pix: checked })}
          />
        </div>
      </div>

      <FormField label="Nome da loja virtual" htmlFor="webstoreUrl" className="max-w-md">
        <div className="relative flex items-center">
          <Input
            id="webstoreUrl"
            value={data.webstoreUrl}
            onChange={(e) => setData({ ...data, webstoreUrl: e.target.value })}
            disabled={!isWebstoreNameAvailable}
            className="pr-28"
          />
          <span className="pointer-events-none absolute right-3 text-sm text-muted-foreground">
            .listapix.com
          </span>
        </div>
      </FormField>

      <SwitchField
        id="hasSplit"
        label="Split"
        checked={data.hasSplit}
        onCheckedChange={(checked) =>
          setData({
            ...data,
            splitValue: 0,
            splitPercentage: 0,
            additionalTaxCard: null,
            additionalTaxPix: null,
            hasSplit: checked,
          })
        }
      />

      {data.hasSplit && (
        <>
          <FormField label="ID do Mercado Pago" htmlFor="gatewayToken" className="max-w-md">
            <Input
              id="gatewayToken"
              value={data.gatewayToken}
              onChange={(e) => setData({ ...data, gatewayToken: e.target.value })}
            />
          </FormField>

          {data.chargeClient && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
              <FormField label="Taxa adicional cartão (%)" htmlFor="additionalTaxCard">
                <Input
                  id="additionalTaxCard"
                  value={percentageMask(data.additionalTaxCard)}
                  onChange={(e) => setData({ ...data, additionalTaxCard: removeMask(e.target.value) })}
                />
              </FormField>
              <FormField label="Taxa adicional PIX (%)" htmlFor="additionalTaxPix">
                <Input
                  id="additionalTaxPix"
                  value={percentageMask(data.additionalTaxPix)}
                  onChange={(e) => setData({ ...data, additionalTaxPix: removeMask(e.target.value) })}
                />
              </FormField>
            </div>
          )}

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
