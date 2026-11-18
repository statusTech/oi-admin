import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const initialDeletion = { finished: false, deleting: false, message: 'Essa ação é irreversível!' };

const ModalExcludeOrganization = ({ show, onClose = () => {}, handleConfirm = () => {} }) => {
  const [deletion, setDeletion] = useState(initialDeletion);

  useEffect(() => {
    if (show) setDeletion(initialDeletion);
  }, [show]);

  const onConfirm = async () => {
    setDeletion({ finished: false, deleting: true, message: 'Excluindo...' });
    const { message } = await handleConfirm();
    setDeletion({ finished: true, deleting: false, message });
  };

  return (
    <AlertDialog open={show} onOpenChange={(open) => !open && !deletion.deleting && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza que deseja excluir esse cliente?</AlertDialogTitle>
          <AlertDialogDescription className="text-base pt-2">{deletion.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          {/* Botão comum (não AlertDialogAction) para o diálogo continuar aberto durante a exclusão. */}
          {!deletion.finished && (
            <Button type="button" variant="destructive" disabled={deletion.deleting} onClick={onConfirm}>
              {deletion.deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Tenho certeza
            </Button>
          )}
          <AlertDialogCancel disabled={deletion.deleting} className="mt-0">
            {deletion.finished ? 'Fechar' : 'Cancelar'}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ModalExcludeOrganization;
