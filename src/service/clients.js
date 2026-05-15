import firebase from '../firebase';
import { ref, set, get, update, push, child, remove } from 'firebase/database';
import { useState, useEffect } from 'react';
import Clients from '../models/Clients';
import Api from '../api';

const ClientsService = () => {
  const table = 'Clients';
  const [data, setData] = useState([]);
  const load = ref(firebase.db, table);

  useEffect(() => {
    reload();
    return () => {
      setData([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkWebstoreNameAvailability = async (webstoreName, uidUser = "") => {
    try {
      const snapshot = await get(load);

      if (!snapshot.exists()) return true;

      const data = snapshot.val();
      
      const found = Object.values(data).some(
        (client) => client.eCommerce?.webstoreUrl === webstoreName && client.uidUser !== uidUser
      );

      return !found;

    } catch (error) {
      return false;
    }
  }

  const reload = async () => {
    const clients = [];
    const snapshot = await get(load);
    if (snapshot.exists()) {
      const snapshotVal = snapshot.val();
      for (let i in snapshotVal) {
        const clientObj = Clients();
        clients.push(clientObj.fromJson({ uid: i, ...snapshotVal[i] }));
      }
      setData(clients);
    }
  }

  const save = (data, uid = null) => {
    let key = uid;
    if (!uid) {
      key = push(child(ref(firebase.db), table)).key;
    }
    return set(ref(firebase.db, `${table}/${key}`), data)
      .then(() => [key, false])
      .catch(() => [null, true]);
  };

  const saveUpdate = (data, uid = null) => {
    let key = uid;
    if (!uid) {
      key = push(child(ref(firebase.db), table)).key;
    }
    return update(ref(firebase.db, `${table}/${key}`), data)
      .then(() => [key, false])
      .catch(() => [null, true]);
  };

  // const removeClient = async (uid) => {
  //   if (uid) {
  //     const snapshot = await get(ref(firebase.db, `${table}/${uid}`));
  //     if (snapshot.exists()) {
  //       const res = await Api.delete(`/user/deleteClient/${uid}`);
  //       if (res.data.success) {
  //         await set(ref(firebase.db, `removed/${table}/${uid}`), snapshot.val());
  //         await remove(ref(firebase.db, `${table}/${uid}`))
  //       }
  //     }
  //   }
  // };

  const removeClientLocally = async (uid) => {
    if (uid) {
      setData(data.filter(u => u.uid !== uid))
    }
  };

  return { data, checkWebstoreNameAvailability, save, saveUpdate, reload, removeClientLocally };
};
export default ClientsService;
