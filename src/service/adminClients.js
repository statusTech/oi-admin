import Api from '../api';

const defaultApiEndpoint = import.meta.env.VITE_ENDPOINT_DEFAULT ?? 'https://api.oitickets.com.br/api/v1';

/**
 * GET /api/v1/admin/clients (KAN-371) — só super-admin (403 para outros tokens).
 *
 * Fica na API PRINCIPAL (VITE_ENDPOINT_DEFAULT), não no apiadmin. Contrato em
 * docs/contract.md. Os KPIs seguem as regras de src/utils/clientFilters.js; se
 * mudar uma regra lá, avisar o backend.
 *
 * {
 *   success: true,
 *   data: {                        // (ou direto na raiz)
 *     clients: [{ uid, lastAccessAt, ... }],
 *     kpis: {
 *       total, active, inactive, expired, expiring30Days, noExpiry,
 *       withListaPix, onlyListaPix, withCashless, noAccess30Days, newThisMonth
 *     },
 *     charts: {
 *       newClientsByMonth:      [{ month: 'YYYY-MM', count }],   // 12 meses
 *       expirationsNext6Months: [{ month: 'YYYY-MM', count }],   // 6 meses
 *       activeVsInactive:       { active, inactive },
 *       byLastAccess:           { upTo7, from8to30, from31to90, over90, never }
 *     }
 *   }
 * }
 */

const num = (v) => Number(v) || 0;

const series = (list) =>
  (Array.isArray(list) ? list : []).map((item) => ({ month: item.month, count: num(item.count) }));

export const normalizeAdminClients = (body) => {
  const data = body?.data ?? body ?? {};
  const k = data.kpis ?? {};
  const c = data.charts ?? {};
  const access = c.byLastAccess ?? {};
  const status = c.activeVsInactive ?? {};

  return {
    clients: Array.isArray(data.clients) ? data.clients : [],
    kpis: {
      total: num(k.total),
      active: num(k.active),
      inactive: num(k.inactive),
      expired: num(k.expired),
      expiring30Days: num(k.expiring30Days),
      noExpiry: num(k.noExpiry),
      withListaPix: num(k.withListaPix),
      onlyListaPix: num(k.onlyListaPix),
      withCashless: num(k.withCashless),
      noAccess30Days: num(k.noAccess30Days),
      newThisMonth: num(k.newThisMonth),
    },
    charts: {
      newClientsByMonth: series(c.newClientsByMonth),
      expirationsNext6Months: series(c.expirationsNext6Months),
      activeVsInactive: { active: num(status.active), inactive: num(status.inactive) },
      byLastAccess: {
        upTo7: num(access.upTo7),
        from8to30: num(access.from8to30),
        from31to90: num(access.from31to90),
        over90: num(access.over90),
        never: num(access.never),
      },
    },
  };
};

export const fetchAdminClients = async () => {
  const res = await Api.get('/admin/clients', { baseURL: defaultApiEndpoint });
  return normalizeAdminClients(res.data);
};
