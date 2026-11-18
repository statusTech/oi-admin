import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';

import Api from '@/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const defaultApiEndpoint = import.meta.env.VITE_ENDPOINT_DEFAULT ?? 'https://api.oitickets.com.br/api/v1';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('pt-BR');
};

const TONES = {
  success: { box: 'border-oi-green/40 bg-oi-green/10', icon: 'text-oi-green', Icon: CheckCircle2 },
  warning: { box: 'border-oi-orange/40 bg-oi-orange/10', icon: 'text-oi-orange', Icon: AlertTriangle },
  danger: { box: 'border-oi-red/40 bg-oi-red/10', icon: 'text-oi-red', Icon: XCircle },
};

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 border-b border-oi-border py-1.5 last:border-b-0 text-sm">
    <span className="text-oi-text-muted">{label}</span>
    <span className="font-medium text-oi-text">{value}</span>
  </div>
);

/**
 * Status da conexão OAuth do tenant com o Mercado Pago
 * (GET /oauth/mercadopago/status). Só consulta quando há clientId (edição) e
 * `enabled` (Split ligado).
 */
const MpStatus = ({ clientId, enabled }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // false/null = sem erro; string = motivo; true = erro genérico

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);

    try {
      const req = await Api.get(`/oauth/mercadopago/status?clientId=${clientId}`, { baseURL: defaultApiEndpoint });
      if (!req.data || req.data.success === false) {
        setStatus(null);
        setError(req.data?.message || true);
      } else {
        setStatus(req.data);
      }
    } catch (err) {
      setStatus(null);
      setError(err?.response?.data?.message || true);
    }

    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  const refresh = (
    <Button type="button" variant="outline" size="sm" onClick={load} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      Atualizar status
    </Button>
  );

  const Box = ({ tone, title, children, details }) => {
    const { box, icon, Icon } = TONES[tone];
    return (
      <div role="status" className={cn('flex flex-col gap-3 rounded-md border p-3 max-w-md', box)}>
        <div className="flex items-start gap-2">
          <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', icon)} />
          <div className="flex flex-col gap-1 text-sm text-oi-text">
            <strong>{title}</strong>
            {children}
          </div>
        </div>
        {details}
        <div>{refresh}</div>
      </div>
    );
  };

  if (!clientId) return null;
  if (loading && !status) {
    return (
      <div className="flex items-center gap-2 text-sm text-oi-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Consultando status do Mercado Pago...
      </div>
    );
  }

  if (error) {
    return (
      <Box tone="warning" title="Não foi possível consultar o status da conexão com o Mercado Pago.">
        {typeof error === 'string' && <span>Motivo: {error}.</span>}
      </Box>
    );
  }

  if (!status) return null;

  const expired =
    status.status === 'expired' ||
    status.is_expired ||
    (status.connected && status.status && status.status !== 'active');

  if (expired) {
    const revoked = status.status === 'revoked';
    return (
      <Box tone="warning" title="Reconectar">
        <span>
          {revoked ? 'A conexão com a conta Mercado Pago foi revogada' : 'A conexão com a conta Mercado Pago venceu'} (conta{' '}
          {status.user_id ?? '-'}
          {status.expires_at ? `, venceu em ${formatDate(status.expires_at)}` : ''}). Gere o link e envie ao organizador.
        </span>
        {status.message && <span>{status.message}</span>}
      </Box>
    );
  }

  if (status.connected) {
    return (
      <Box
        tone="success"
        title="Conectado"
        details={
          <div className="flex flex-col">
            <Row label="Conta (user_id)" value={status.user_id ?? '-'} />
            <Row label="Válido até" value={formatDate(status.expires_at)} />
            <Row label="Última renovação" value={formatDate(status.last_refresh_at)} />
          </div>
        }
      />
    );
  }

  return (
    <Box tone="danger" title="Conta Mercado Pago não conectada">
      <span>As vendas caem na conta da Oi, sem split. Gere o link e envie ao organizador.</span>
    </Box>
  );
};

export default MpStatus;
