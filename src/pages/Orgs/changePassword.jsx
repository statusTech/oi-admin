import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import Api from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

const ModalPassword = ({ show, onClose, userId }) => {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (show) setPassword('');
  }, [show]);

  const handleChangePassword = async () => {
    if (!password || password.length < 6) {
      toast({ variant: 'destructive', title: 'A senha deve ter no mínimo 6 caracteres' });
      return;
    }
    try {
      setLoading(true);
      const { success } = (await Api.post('/user/changeUserPassword', { userId, password })).data;
      if (success) {
        toast({ variant: 'success', title: 'Alterado com sucesso!' });
        onClose();
      } else {
        toast({ variant: 'destructive', title: 'Senha inválida' });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Sem permissão para mudar a senha' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mudança de senha</DialogTitle>
          <DialogDescription>Informe a nova senha</DialogDescription>
        </DialogHeader>
        <FormField label="Senha" htmlFor="new-password">
          <Input
            id="new-password"
            type="password"
            autoComplete="one-time-code"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            className="bg-oi-blue hover:bg-oi-blue/90 text-white"
            onClick={handleChangePassword}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Alterando...' : 'Alterar'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalPassword;
