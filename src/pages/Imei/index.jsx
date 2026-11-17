import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import DevicesService from '@/service/devices';
import SectionCard from '@/components/layout/SectionCard';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

const Imei = () => {
  const { data, loading, unlink } = DevicesService();
  const [search, setSearch] = useState('');

  const handleUnlink = async (imei) => {
    if (!window.confirm('Deseja realmente desvincular?')) return;
    try {
      await unlink(imei);
      toast({ variant: 'success', title: 'Dispositivo desvinculado' });
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível desvincular o dispositivo' });
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'imei',
        header: ({ column }) => <DataTableColumnHeader column={column} title="IMEI" />,
      },
      {
        accessorKey: 'client',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
      },
      {
        id: 'actions',
        header: 'Ações',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => handleUnlink(row.original.imei)}
          >
            Desvincular
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data;
    return data.filter((d) => `${d.imei ?? ''} ${d.client ?? ''}`.toLowerCase().includes(term));
  }, [data, search]);

  return (
    <SectionCard
      title="Dispositivos vinculados"
      headerRight={
        <div className="relative w-56 max-w-full">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar IMEI ou cliente"
            className="h-9 pl-8 text-[13px]"
          />
        </div>
      }
    >
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
  );
};

export default Imei;
