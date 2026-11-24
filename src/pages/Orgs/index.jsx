import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Check, MoreHorizontal, Plus, Search, X } from 'lucide-react';

import ClientsService from '@/service/clients';
import { fetchAdminClients } from '@/service/adminClients';
import {
  ACCESS_OPTIONS,
  LICENSE_OPTIONS,
  PRODUCT_OPTIONS,
  STATUS_OPTIONS,
  buildListSearch,
  formatLastAccess,
  licenseState,
  matchesListFilters,
  parseListParams,
  resolveClientFilter,
} from '@/utils/clientFilters';
import Api from '@/api';
import { formatDate } from '@/utils/date';
import { cpfCnpjMask } from '@/utils/mask';
import SectionCard from '@/components/layout/SectionCard';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ModalPassword from './changePassword';
import ModalExcludeOrganization from './excludeOrganization';

// Exclusão na API principal (não no apiadmin): só ela apaga o banco do
// cliente, tira o cliente do Firebase e libera o domínio da Lista PIX.
const defaultApiEndpoint = import.meta.env.VITE_ENDPOINT_DEFAULT ?? 'https://api.oitickets.com.br/api/v1';

const BoolIcon = ({ value }) =>
  value ? (
    <Check className="h-4 w-4 text-oi-green" aria-label="Sim" />
  ) : (
    <X className="h-4 w-4 text-oi-red" aria-label="Não" />
  );

const formatExpire = (expireAt) => {
  const date = new Date(expireAt);
  date.setHours(date.getHours() + 3);
  return formatDate(date);
};

const LICENSE_BADGE = {
  ok: { label: 'Em dia', className: 'bg-oi-green/10 text-oi-green' },
  expiring30: { label: 'Vence em 30 dias', className: 'bg-[#FF9843]/15 text-[#C2670F]' },
  expired: { label: 'Vencida', className: 'bg-oi-red/10 text-oi-red' },
  noExpiry: { label: 'Sem vencimento', className: 'bg-muted text-oi-text-muted' },
};

const LicenseBadge = ({ state }) => {
  const b = LICENSE_BADGE[state];
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${b.className}`}>
      {b.label}
    </span>
  );
};

const ALL = 'all';

const FilterSelect = ({ label, value, options, onChange }) => (
  <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? '' : v)}>
    <SelectTrigger className="h-9 w-full text-[13px]" aria-label={label}>
      <SelectValue placeholder={label} />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value={ALL}>{label}: todos</SelectItem>
      {options.map((o) => (
        <SelectItem key={o.value} value={o.value}>
          {o.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const productLabels = (c) =>
  [c.onlyECommerce ? 'Só Lista PIX' : c.hasECommerce ? 'Lista PIX' : null, c.cashless ? 'Cashless' : null].filter(Boolean);

const Orgs = () => {
  const history = useHistory();
  const location = useLocation();
  const params = useMemo(() => parseListParams(location.search), [location.search]);
  const activeFilter = useMemo(() => resolveClientFilter(params.filter), [params.filter]);
  const { data, loading, removeClientLocally } = ClientsService();
  // uid -> lastAccessAt (ms | null). Vem de GET /admin/clients.
  const [lastAccess, setLastAccess] = useState(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState({ id: null, showing: false });
  const [passwordModal, setPasswordModal] = useState({ userId: '', showing: false });

  useEffect(() => {
    fetchAdminClients()
      .then(({ clients }) => {
        const map = {};
        clients.forEach((c) => {
          map[c.uid ?? c.id] = c.lastAccessAt ? new Date(c.lastAccessAt).getTime() : null;
        });
        setLastAccess(map);
      })
      .catch(() => setLastAccess(null))
      .finally(() => setAccessLoading(false));
  }, []);

  // Atualiza a URL (filtros, busca, ordenação e página). Mudou filtro → volta p/ página 1.
  const update = useCallback(
    (patch, { keepPage = false } = {}) => {
      const next = { ...params, ...patch };
      if (!keepPage && !('page' in patch)) next.page = 1;
      history.replace({ pathname: location.pathname, search: buildListSearch(next) });
    },
    [params, history, location.pathname]
  );

  const clearFilters = () => history.replace({ pathname: location.pathname, search: '' });

  const handleGotoCreate = () => history.push('/dashboard/organization/new');

  const handleGotoEdit = (client) => {
    history.push({ pathname: `/dashboard/organization/${client.uid}`, state: client.toJson() });
  };

  const deleteAction = async () => {
    const id = confirmDelete.id;

    if (!id) return { message: 'Usuário já deletado anteriormente.' };

    let status = 0;
    let body = null;

    await Api.delete(`/user/deleteClient/${id}`, { baseURL: defaultApiEndpoint })
      .then((res) => {
        status = res.status;
        body = res.data;
      })
      .catch((err) => {
        status = err?.response?.status;
        body = err?.response?.data;
      });

    if (status === 200) {
      removeClientLocally(id);
      return {
        message: body?.domain
          ? `Cliente excluído. O domínio "${body.domain}" da Lista PIX está livre.`
          : 'Cliente excluído com sucesso.',
      };
    }

    if (status === 404) {
      removeClientLocally(id);
      return { message: 'Cliente não encontrado (já tinha sido excluído).' };
    }

    // 403/409/400/500 já vêm com a mensagem pronta do backend.
    if (body?.error) return { message: body.error };

    // 504: um banco muito grande pode passar do tempo da requisição; a
    // exclusão continua no servidor.
    if (status === 504) {
      return { message: 'A exclusão está demorando (banco grande). Atualize a lista em alguns minutos.' };
    }

    return { message: 'Houve um problema na operação. Tente novamente mais tarde.' };
  };

  const now = Date.now();

  const rows = useMemo(
    () =>
      data.map((c) => ({
        ...c,
        client: c,
        // undefined = dado da API indisponível; null = nunca acessou.
        lastAccessAt: lastAccess ? lastAccess[c.uid] ?? null : undefined,
      })),
    [data, lastAccess]
  );

  const ufOptions = useMemo(
    () =>
      [...new Set(data.map((c) => String(c.uf ?? '').toUpperCase()).filter(Boolean))]
        .sort()
        .map((uf) => ({ value: uf, label: uf })),
    [data]
  );

  const filtered = useMemo(
    () => rows.filter((c) => matchesListFilters(c, params, now) && (!activeFilter || activeFilter.test(c, now))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, params, activeFilter]
  );

  const hasFilters = Boolean(
    params.q || params.status || params.license || params.product || params.access || params.uf || params.filter
  );

  // Desktop: menu de três pontinhos.
  const actions = (row) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Ações" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleGotoEdit(row.client)}>Editar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setPasswordModal({ userId: row.uidUser, showing: true })}>
          Mudar senha
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => setConfirmDelete({ id: row.uid, showing: true })}
        >
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Mobile (cards): os três botões à mostra.
  const mobileActions = (row) => (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => handleGotoEdit(row.client)}>
        Editar
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setPasswordModal({ userId: row.uidUser, showing: true })}
      >
        Mudar senha
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-destructive hover:text-destructive"
        onClick={() => setConfirmDelete({ id: row.uid, showing: true })}
      >
        Excluir
      </Button>
    </div>
  );

  const columns = useMemo(
    () => [
      {
        id: 'name',
        accessorFn: (r) => String(r.name ?? '').toLowerCase(),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
        cell: ({ row }) => row.original.name,
      },
      {
        id: 'CNPJ',
        header: 'CNPJ',
        enableSorting: false,
        accessorFn: (r) => r.CNPJ,
        cell: ({ row }) => cpfCnpjMask(row.original.CNPJ ?? ''),
      },
      {
        id: 'location',
        header: 'Cidade/UF',
        enableSorting: false,
        accessorFn: (r) => [r.city, r.uf].filter(Boolean).join('/'),
        cell: ({ row }) => [row.original.city, row.original.uf].filter(Boolean).join('/') || '—',
      },
      {
        id: 'status',
        accessorFn: (r) => (r.status ? 1 : 0),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <BoolIcon value={row.original.status} />,
      },
      {
        id: 'expireAt',
        accessorFn: (r) => r.expireAt || undefined,
        sortUndefined: 'last',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Vencimento" />,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex flex-col items-start gap-1">
              <span>{c.expireAt ? formatExpire(c.expireAt) : '—'}</span>
              <LicenseBadge state={licenseState(c, now)} />
            </div>
          );
        },
      },
      {
        id: 'lastAccess',
        accessorFn: (r) => r.lastAccessAt ?? undefined,
        sortUndefined: 'last',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Último acesso" />,
        cell: ({ row }) => formatLastAccess(row.original.lastAccessAt, now),
      },
      {
        id: 'listaPix',
        header: 'Lista PIX',
        enableSorting: false,
        accessorFn: (r) => r.hasECommerce,
        cell: ({ row }) =>
          row.original.onlyECommerce ? (
            <span className="whitespace-nowrap text-[12px]">Só Lista PIX</span>
          ) : (
            <BoolIcon value={row.original.hasECommerce} />
          ),
      },
      {
        id: 'devices',
        header: 'Dispositivos',
        enableSorting: false,
        accessorFn: (r) => r.devices,
        cell: ({ row }) => <span className="tabular-nums">{row.original.devices ?? 0}</span>,
      },
      {
        id: 'createdAt',
        accessorFn: (r) => r.createdAt || undefined,
        sortUndefined: 'last',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cadastrado em" />,
        cell: ({ row }) => (row.original.createdAt ? formatDate(row.original.createdAt) : '—'),
      },
      {
        id: 'actions',
        header: 'Ações',
        enableSorting: false,
        cell: ({ row }) => actions(row.original),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [now, data]
  );

  const sortingState = useMemo(
    () => (params.sort ? [{ id: params.sort, desc: params.dir === 'desc' }] : []),
    [params.sort, params.dir]
  );

  const handleSorting = (updater) => {
    const next = typeof updater === 'function' ? updater(sortingState) : updater;
    const first = next[0];
    update({ sort: first ? first.id : '', dir: first?.desc ? 'desc' : 'asc' });
  };

  const pageCount = Math.max(1, Math.ceil(filtered.length / params.size));
  const paginationState = { pageIndex: Math.min(params.page, pageCount) - 1, pageSize: params.size };

  const handlePagination = (updater) => {
    const next = typeof updater === 'function' ? updater(paginationState) : updater;
    if (next.pageSize !== params.size) update({ size: next.pageSize, page: 1 });
    else update({ page: next.pageIndex + 1 }, { keepPage: true });
  };

  const mobileCard = (r) => {
    const products = productLabels(r);
    return (
      <div className="rounded-lg border border-oi-border p-3 flex flex-col gap-2 text-[13px]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="font-semibold text-oi-text">{r.name}</span>
            <span className="text-oi-text-muted">{cpfCnpjMask(r.CNPJ ?? '')}</span>
            <span className="text-oi-text-muted">{[r.city, r.uf].filter(Boolean).join('/') || '—'}</span>
          </div>
          <BoolIcon value={r.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LicenseBadge state={licenseState(r, now)} />
          <span className="text-oi-text-muted">{r.expireAt ? formatExpire(r.expireAt) : ''}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-oi-text-muted">
          <span>Último acesso: {formatLastAccess(r.lastAccessAt, now)}</span>
          <span>Dispositivos: {r.devices ?? 0}</span>
          <span>Produtos: {products.length ? products.join(', ') : '—'}</span>
          <span>Cadastro: {r.createdAt ? formatDate(r.createdAt) : '—'}</span>
        </div>
        {mobileActions(r)}
      </div>
    );
  };

  const ready = !loading && !accessLoading;

  return (
    <>
      <ModalExcludeOrganization
        show={confirmDelete.showing}
        onClose={() => setConfirmDelete((prev) => ({ ...prev, showing: false }))}
        handleConfirm={deleteAction}
      />
      <ModalPassword
        show={passwordModal.showing}
        userId={passwordModal.userId}
        onClose={() => setPasswordModal((prev) => ({ ...prev, showing: false }))}
      />

      <SectionCard
        title="Clientes"
        headerRight={
          <>
            <div className="relative w-56 max-w-full">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={params.q}
                onChange={(e) => update({ q: e.target.value })}
                placeholder="Nome, CNPJ ou e-mail"
                className="h-9 pl-8 text-[13px]"
              />
            </div>
            <Button size="sm" className="bg-oi-blue hover:bg-oi-blue/90 text-white" onClick={handleGotoCreate}>
              <Plus className="h-4 w-4" />
              Cadastrar cliente
            </Button>
          </>
        }
        headerRightClassName="flex-wrap justify-end"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
          <FilterSelect label="Status" value={params.status} options={STATUS_OPTIONS} onChange={(v) => update({ status: v })} />
          <FilterSelect label="Licença" value={params.license} options={LICENSE_OPTIONS} onChange={(v) => update({ license: v })} />
          <FilterSelect label="Produto" value={params.product} options={PRODUCT_OPTIONS} onChange={(v) => update({ product: v })} />
          <FilterSelect label="Último acesso" value={params.access} options={ACCESS_OPTIONS} onChange={(v) => update({ access: v })} />
          <FilterSelect label="UF" value={params.uf} options={ufOptions} onChange={(v) => update({ uf: v })} />
        </div>

        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilter && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-oi-blue/10 px-3 py-1 text-[12px] font-medium text-oi-blue shadow-[inset_0_0_0_1px_#3B94FF]">
                Filtro: {activeFilter.label}
                <button
                  type="button"
                  onClick={() => update({ filter: '' })}
                  aria-label="Remover filtro"
                  className="border-0 bg-transparent p-0 cursor-pointer text-oi-blue flex"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
            {ready && (
              <span className="text-[12px] text-oi-text-muted tabular-nums">{filtered.length} cliente(s)</span>
            )}
            <Button size="sm" variant="ghost" className="h-7 text-[12px]" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        )}

        {!ready ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            sortingState={sortingState}
            onSortingChange={handleSorting}
            paginationState={paginationState}
            onPaginationChange={handlePagination}
            mobileCard={mobileCard}
          />
        )}
      </SectionCard>
    </>
  );
};

export default Orgs;
