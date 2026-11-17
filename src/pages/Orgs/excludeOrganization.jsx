import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
    <Dialog open={show} onOpenChange={(open) => !open && !deletion.deleting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tem certeza que deseja excluir esse cliente?</DialogTitle>
          <DialogDescription className="text-base pt-2">{deletion.message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          {!deletion.finished && (
            <Button
              type="button"
              variant="destructive"
              disabled={deletion.deleting}
              onClick={onConfirm}
            >
              {deletion.deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Tenho certeza
            </Button>
          )}
          <Button type="button" variant="ghost" disabled={deletion.deleting} onClick={onClose}>
            {deletion.finished ? 'Fechar' : 'Cancelar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalExcludeOrganization;
