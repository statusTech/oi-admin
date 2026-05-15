import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Grid, Button, CircularProgress } from '@material-ui/core';
import SettingsIcon from '../../assets/icons/ic_config.svg';
import EaseGrid from '../../components/EaseGrid';
import ButtonRound from '../../components/ButtonRound';
import { Check, Close } from '@material-ui/icons';
import ClientsService from './../../service/clients';
import firebase from '../../firebase';
import { ref, onValue } from "firebase/database";
import axios from 'axios';
import ModalPassword from './changePassword';
import { formatDate } from '../../utils/date';
import { cpfCnpjMask } from '../../utils/mask';
import Api from '../../api';
import ModalExcludeOrganization from '../../components/Confirm/excludeOrganization';

const Settings = () => {
  const history = useHistory();
  const { data, removeClientLocally } = ClientsService();
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ id: null, showing: false });
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (data.length) setLoading(false);
  }, [data]);

  const columns = [
    { title: 'Cliente', field: 'name' },
    {
      title: 'CPF/CNPJ',
      field: 'CNPJ',
      render: ({ CNPJ }) => {
        return cpfCnpjMask(CNPJ);
      },
    },
    {
      title: 'Data expiração',
      field: 'expireAt',
      render: ({ expireAt }) => {
        const date = new Date(expireAt);
        date.setHours(date.getHours() + 3);
        return formatDate(date);
      },
    },
    { title: 'E-mail', field: 'email' },
    {
      title: 'Status',
      field: 'status',
      render: ({ status }) => {
        return status ? <Check /> : <Close />;
      },
    },
    { title: 'Dispositivos', field: 'devices' },
    {
      title: 'Cashless',
      field: 'cashless',
      render: ({ cashless }) => {
        return cashless ? <Check /> : <Close />;
      },
    },
    {
      title: 'Ações',
      width: "20%",
      render: (dados) => (
        <Grid direction='row'>
          <Button onClick={() => handleGotoEdit(dados)} variant='outlined' size='small' color='primary'>
            Editar
          </Button>
          <Button onClick={() => handleDelete(dados)} style={{ marginLeft: 10 }} variant='outlined' size='small' color='secondary'>
            Excluir
          </Button>
          <Button onClick={() => handleChangePassword(dados.uidUser)} style={{ marginLeft: 10 }} variant='outlined' size='small' color='primary'>
            Mudar Senha
          </Button>

        </Grid>
      ),
    },
  ];
  const handleGotoCreate = () => {
    history.push(`/dashboard/organization/new`);
  };

  const handleGotoEdit = (dados) => {
    history.push({ pathname: `/dashboard/organization/${dados.uid}`, state: dados.toJson() });
  };

  const deleteAction = async () => {
    const id = confirmDelete.id

    if (!id) return { message: 'Usuário já deletado anteriormente.' }

    let status = 0

    await Api.delete(`/user/deleteClient/${id}`)
      .then(res => {
        status = res.status
      })
      .catch(err => {
        status = err?.response?.status
      })

    if (status === 400) {
      return { message: 'Usuário não encontrado. Tente novamente mais tarde.' }
    }

    if (status === 500) {
      return { message: 'Houve um problema na operação. Tente novamente mais tarde.' }
    }

    if (status === 200) {
      removeClientLocally(id)
      return { message: 'Cliente excluido com sucesso.' }
    }
  };

  const handleDelete = async (dados) => {
    setConfirmDelete({ id: dados.uid, showing: true });
  };

  const closeModal = () => {
    setShowModal(false);
    setPassword('');
  }

  const handleChangePassword = (id) => {
    setUserId(id);
    setShowModal(true);
  };
  const handleUpdate = async () => {
    setLoading(true)
    onValue(ref(firebase.db, '/Clients'), async (snapshot) => {
      const clients = snapshot.val();
      for (const key in clients) {
        const { dbName } = clients[key];
        const res = await axios.post(
          'https://api-databases.oitickets.com.br/updatedatabase',
          { database: dbName },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
      setLoading(false)
    });
  };

  return loading ? (
    <Grid container spacing={2} justifyContent='center'>
      <Grid item>
        <CircularProgress />
      </Grid>
    </Grid>
  ) : (
    <Grid container spacing={2}>
      <ModalExcludeOrganization
        show={confirmDelete.showing}
        id={confirmDelete.id}
        onClose={() => { setConfirmDelete({ ...confirmDelete, showing: false }) }}
        handleConfirm={deleteAction}
      />
      <ModalPassword show={showModal} onClose={closeModal} password={password} setPassword={setPassword} userId={userId} />
      <Grid item lg={12} md={12} sm={12} xs={12}>
        <EaseGrid
          columns={columns}
          data={data}
          toolbar={() => (
            <>
              <ButtonRound variant='contained' color='primary' onClick={() => handleGotoCreate()}>
                Cadastrar cliente
              </ButtonRound>
              {/*<ButtonRound style={{marginLeft: 20}} variant='contained' color='warning' onClick={() => handleUpdate()}>
                Atualizar clientes
              </ButtonRound>*/}
            </>
          )}
          config={{ pageConfig: { paging: false } }}
        />
      </Grid>
    </Grid>
  );
};

export const Icon = () => {
  return <img src={SettingsIcon} alt='Ícone configurações' />;
};

export default Settings;
