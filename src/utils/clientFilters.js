const DAY = 24 * 60 * 60 * 1000;

const accessDays = (c, now) => (c.lastAccessAt ? (now - c.lastAccessAt) / DAY : null);

const monthKey = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const ACCESS_BUCKETS = {
  upTo7: { label: 'Acesso até 7 dias', test: (d) => d !== null && d <= 7 },
  from8to30: { label: 'Acesso de 8 a 30 dias', test: (d) => d !== null && d > 7 && d <= 30 },
  from31to90: { label: 'Acesso de 31 a 90 dias', test: (d) => d !== null && d > 30 && d <= 90 },
  over90: { label: 'Acesso há mais de 90 dias', test: (d) => d !== null && d > 90 },
  never: { label: 'Nunca acessou', test: (d) => d === null },
};

const SIMPLE = {
  active: { label: 'Ativos', test: (c) => Boolean(c.status) },
  inactive: { label: 'Inativos', test: (c) => !c.status },
  expired: { label: 'Licença vencida', test: (c, now) => Boolean(c.expireAt) && c.expireAt < now },
  expiring30: {
    label: 'Vence em 30 dias',
    test: (c, now) => Boolean(c.expireAt) && c.expireAt >= now && c.expireAt < now + 30 * DAY,
  },
  noExpiry: { label: 'Sem vencimento', test: (c) => !c.expireAt },
  listaPix: { label: 'Com Lista PIX', test: (c) => Boolean(c.hasECommerce) },
  onlyListaPix: { label: 'Só Lista PIX', test: (c) => Boolean(c.onlyECommerce) },
  cashless: { label: 'Com cashless', test: (c) => Boolean(c.cashless) },
  noAccess30: {
    label: 'Sem acesso há 30+ dias',
    test: (c, now) => {
      const d = accessDays(c, now);
      return d === null || d > 30;
    },
  },
  newThisMonth: {
    label: 'Novos no mês',
    test: (c, now) => Boolean(c.createdAt) && monthKey(c.createdAt) === monthKey(now),
  },
};

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export const formatMonth = (key) => {
  const [y, m] = String(key).split('-');
  return `${MONTHS[Number(m) - 1] ?? m}/${String(y).slice(2)}`;
};

// Resolve "chave" ou "chave:valor" em { label, test } (ou null se desconhecido).
export const resolveClientFilter = (filter) => {
  if (!filter) return null;
  if (SIMPLE[filter]) return SIMPLE[filter];

  const [key, value] = filter.split(':');
  if (key === 'created' && value) {
    return {
      label: `Cadastrados em ${formatMonth(value)}`,
      test: (c) => Boolean(c.createdAt) && monthKey(c.createdAt) === value,
    };
  }
  if (key === 'expires' && value) {
    return {
      label: `Vencem em ${formatMonth(value)}`,
      test: (c) => Boolean(c.expireAt) && monthKey(c.expireAt) === value,
    };
  }
  if (key === 'access' && ACCESS_BUCKETS[value]) {
    const bucket = ACCESS_BUCKETS[value];
    return { label: bucket.label, test: (c, now) => bucket.test(accessDays(c, now)) };
  }
  return null;
};

// Os filtros por último acesso precisam do dado da API.
export const filterNeedsAccessData = (filter) =>
  filter === 'noAccess30' || String(filter ?? '').startsWith('access:');

export const clientsListUrl = (filter) =>
  `/dashboard/organization${filter ? `?filter=${encodeURIComponent(filter)}` : ''}`;
