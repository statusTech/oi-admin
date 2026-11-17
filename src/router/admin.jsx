import React from 'react';
import { Settings } from 'lucide-react';

import Orgs from '../pages/Orgs';
import Imei from '../pages/Imei';
import OrgsForm from '../pages/Orgs/form';

export default [
  {
    title: 'Configurações',
    path: '/organization',
    icon: Settings,
    content: <Orgs />,
    list: [
      {
        title: 'Clientes',
        path: '/organization',
        content: <Orgs />,
      },
      {
        title: 'IMEI',
        path: '/imei',
        content: <Imei />,
      },
      {
        path: '/organization/:idOrg',
        hide: true,
        content: <OrgsForm />,
      },
    ],
  },
];
