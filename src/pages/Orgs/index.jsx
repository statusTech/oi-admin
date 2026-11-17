import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Check, Plus, Search, X } from 'lucide-react';

import ClientsService from '@/service/clients';
import { fetchAdminClients } from '@/service/adminClients';
import { filterNeedsAccessData, resolveClientFilter } from '@/utils/clientFilters';
import Api from '@/api';
import { formatDate } from '@/utils/date';
import { cpfCnpjMask } from '@/utils/mask';
import SectionCard from '@/components/layout/SectionCard';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import ModalPassword from './changePassword';
import ModalExcludeOrganization from './excludeOrganization';

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

const Orgs = () => {
  const history = useHistory();
  const location = useLocation();
  const filterKey = new URLSearchParams(location.search).get('filter');
  const activeFilter = useMemo(() => resolveClientFilter(filterKey), [filterKey]);
  const [lastAccess, setLastAccess] = useState({});
  const { data, loading, removeClientLocally } = ClientsService();
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState({ id: null, showing: false });
  const [passwordModal, setPasswordModal] = useState({ userId: '', showing: false });

  // Filtros por último acesso dependem do dado da API (uid -> lastAccessAt).
  useEffect(() => {
    if (!filterNeedsAccessData(filterKey)) return;
    fetchAdminClients()
      .then(({ clients }) => {
        const map = {};
        clients.forEach((c) => {
          map[c.uid ?? c.id] = c.lastAccessAt ? new Date(c.lastAccessAt).getTime() : null;
        });
        setLastAccess(map);
      })
      .catch(() => {});
  }, [filterKey]);

  const clearFilter = () => history.push('/dashboard/organization');

  const handleGotoCreate = () => history.push('/dashboard/organization/new');

  const handleGotoEdit = (dados) => {
    history.push({ pathname: `/dashboard/organization/${dados.uid}`, state: dados.toJson() });
  };

  const deleteAction = async () => {
    const id = confirmDelete.id;

    if (!id) return { message: 'Usuário já deletado anteriormente.' };

    let status = 0;

    await Api.delete(`/user/deleteClient/${id}`)
      .then((res) => {
        status = res.status;
      })
      .catch((err) => {
        status = err?.response?.status;
      });

    if (status === 400) {
      return { message: 'Usuário não encontrado. Tente novamente mais tarde.' };
    }

    if (status === 200) {
      removeClientLocally(id);
      return { message: 'Cliente excluido com sucesso.' };
    }

    return { message: 'Houve um problema na operação. Tente novamente mais tarde.' };
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
      },
      {
        accessorKey: 'CNPJ',
        header: 'CPF/CNPJ',
        cell: ({ row }) => cpfCnpjMask(row.original.CNPJ ?? ''),
      },
      {
        accessorKey: 'expireAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Data expiração" />,
        cell: ({ row }) => formatExpire(row.original.expireAt),
      },
      {
        accessorKey: 'email',
        header: 'E-mail',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <BoolIcon value={row.original.status} />,
      },
      {
        accessorKey: 'devices',
        header: 'Dispositivos',
        cell: ({ row }) => <span className="tabular-nums">{row.original.devices}</span>,
      },
      {
        accessorKey: 'cashless',
        header: 'Cashless',
        cell: ({ row }) => <BoolIcon value={row.original.cashless} />,
      },
      {
        id: 'actions',
        header: 'Ações',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => handleGotoEdit(row.original)}>
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPasswordModal({ userId: row.original.uidUser, showing: true })}
            >
              Mudar senha
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete({ id: row.original.uid, showing: true })}
            >
              Excluir
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const now = Date.now();
    return data
      .filter((c) => !activeFilter || activeFilter.test({ ...c, lastAccessAt: lastAccess[c.uid] ?? null }, now))
      .filter(
        (c) => !term || `${c.name ?? ''} ${c.email ?? ''} ${c.CNPJ ?? ''}`.toLowerCase().includes(term)
      );
  }, [data, search, activeFilter, lastAccess]);

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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente"
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
        {activeFilter && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-oi-blue/10 px-3 py-1 text-[12px] font-medium text-oi-blue shadow-[inset_0_0_0_1px_#3B94FF]">
              Filtro: {activeFilter.label}
              <button
                type="button"
                onClick={clearFilter}
                aria-label="Limpar filtro"
                className="border-0 bg-transparent p-0 cursor-pointer text-oi-blue flex"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
            <span className="text-[12px] text-oi-text-muted tabular-nums">{filtered.length} cliente(s)</span>
          </div>
        )}
        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </SectionCard>
    </>
  );
};

export default Orgs;
