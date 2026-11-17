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

// ---------------------------------------------------------------------------
// Listagem de clientes: filtros/ordenação/paginação guardados na URL.
// ---------------------------------------------------------------------------

export const licenseState = (c, now) => {
  if (!c.expireAt) return 'noExpiry';
  if (c.expireAt < now) return 'expired';
  if (c.expireAt < now + 30 * DAY) return 'expiring30';
  return 'ok';
};

export const LICENSE_OPTIONS = [
  { value: 'ok', label: 'Em dia' },
  { value: 'expiring30', label: 'Vence em 30 dias' },
  { value: 'expired', label: 'Vencida' },
  { value: 'noExpiry', label: 'Sem vencimento' },
];

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
];

export const PRODUCT_OPTIONS = [
  { value: 'listaPix', label: 'Lista PIX' },
  { value: 'onlyListaPix', label: 'Só Lista PIX' },
  { value: 'cashless', label: 'Cashless' },
];

export const ACCESS_OPTIONS = [
  { value: '7', label: 'Até 7 dias' },
  { value: '30', label: 'Até 30 dias' },
  { value: '90', label: 'Até 90 dias' },
  { value: 'never', label: 'Nunca acessou' },
];

export const SORT_KEYS = ['lastAccess', 'expireAt', 'status', 'name', 'createdAt'];

const PAGE_SIZES = [10, 20, 30, 50];

const pick = (value, options) => (options.some((o) => o.value === value) ? value : '');

export const parseListParams = (search) => {
  const sp = new URLSearchParams(search);
  const sort = sp.get('sort');
  const size = Number(sp.get('size'));
  const page = Number(sp.get('page'));
  return {
    q: sp.get('q') ?? '',
    status: pick(sp.get('status'), STATUS_OPTIONS),
    license: pick(sp.get('license'), LICENSE_OPTIONS),
    product: pick(sp.get('product'), PRODUCT_OPTIONS),
    access: pick(sp.get('access'), ACCESS_OPTIONS),
    uf: sp.get('uf') ?? '',
    filter: sp.get('filter') ?? '', // link vindo dos KPIs/gráficos
    sort: SORT_KEYS.includes(sort) ? sort : '',
    dir: sp.get('dir') === 'desc' ? 'desc' : 'asc',
    page: Number.isInteger(page) && page > 0 ? page : 1,
    size: PAGE_SIZES.includes(size) ? size : 10,
  };
};

const DEFAULTS = { q: '', status: '', license: '', product: '', access: '', uf: '', filter: '', sort: '', dir: 'asc', page: 1, size: 10 };

// Só grava na URL o que difere do padrão.
export const buildListSearch = (params) => {
  const sp = new URLSearchParams();
  Object.keys(DEFAULTS).forEach((k) => {
    if (params[k] !== DEFAULTS[k] && !(k === 'dir' && !params.sort)) sp.set(k, String(params[k]));
  });
  const str = sp.toString();
  return str ? `?${str}` : '';
};

export const matchesListFilters = (c, p, now) => {
  if (p.status === 'active' && !c.status) return false;
  if (p.status === 'inactive' && c.status) return false;
  if (p.license && licenseState(c, now) !== p.license) return false;
  if (p.product && !SIMPLE[p.product].test(c, now)) return false;
  if (p.uf && String(c.uf ?? '').toUpperCase() !== p.uf.toUpperCase()) return false;
  if (p.access) {
    if (c.lastAccessAt === undefined) return false; // dado da API indisponível
    const d = accessDays(c, now);
    if (p.access === 'never' ? d !== null : d === null || d > Number(p.access)) return false;
  }
  const term = p.q.trim().toLowerCase();
  if (term) {
    const digits = term.replace(/\D/g, '');
    const hay = `${c.name ?? ''} ${c.email ?? ''}`.toLowerCase();
    const cnpj = String(c.CNPJ ?? '').replace(/\D/g, '');
    if (!hay.includes(term) && !(digits && cnpj.includes(digits))) return false;
  }
  return true;
};

export const formatLastAccess = (lastAccessAt, now) => {
  if (lastAccessAt === undefined) return '—';
  if (lastAccessAt === null) return 'nunca';
  const days = Math.floor((now - lastAccessAt) / DAY);
  if (days <= 0) return 'hoje';
  return days === 1 ? 'há 1 dia' : `há ${days} dias`;
};
