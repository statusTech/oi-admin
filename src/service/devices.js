import firebase from '../firebase';
import { ref, onValue, set, get, update, push, child, remove } from 'firebase/database';
import { useState, useEffect } from 'react';
import Clients from '../models/Clients';
import Api from '../api';
import Devices from '../models/Devices';

const DevicesService = () => {
  const table = 'Devices';
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reload();
    return () => {
      setData([]);
    };
  }, []);

  const reload = async () => {
    const devices = [];
    try {
      const {success, data} = (await Api.get(`/admin/device`)).data;
      if(success){
        for (let i in data) {
          const devicesObj = Devices();
          devices.push(devicesObj.fromJson(data[i]));
        }
        setData(devices);
      }
    } finally {
      setLoading(false);
    }
  }

  const unlink = async (imei) => {
    if(imei) {
     const {success} =  (await Api.delete(`/admin/device/${imei}`)).data;
      if(success){
        reload();
      }
    }
    return false;
  };

  return { data, loading, reload, unlink };
};
export default DevicesService;
