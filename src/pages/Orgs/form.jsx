import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import axios from 'axios';
import sha1 from 'sha1';

import { formatDateToMysqlDate } from '@/utils/date';
import { ufList } from '@/utils/utils';
import { cellPhoneMask, cpfCnpjMask, percentageMask, removeMask } from '@/utils/mask';
import ClientsService from '@/service/clients';
import ManagersService from '@/service/managers';
import Authentication from '@/service/auth';
import firebase from '@/firebase';
import ImagePicker from '@/components/ImagePicker';
import SectionCard from '@/components/layout/SectionCard';
import FormActions from '@/components/layout/FormActions';
import { FormField } from '@/components/ui/form-field';
import { SwitchField } from '@/components/ui/switch-field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import FormECommerce from './formECommerce';

const defaultApiEndpoint = import.meta.env.VITE_ENDPOINT_DEFAULT ?? 'https://api.oitickets.com.br/api/v1';

const eCommerceDefault = {
  adminTax: false,
  adminTaxValue: 0,
  adminTaxPercentage: 0,
  adminTaxMinimum: 0,
  chargeClient: false,
  credit: false,
  allowInstallments: false,
  additionalTaxCard: null,
  additionalTaxPix: null,
  pix: false,
  hasSplit: false,
  splitValue: 0,
  splitPercentage: 0,
  gatewayToken: '',
  webstoreUrl: '',
};

const taxesDefault = { debit: 0, credit: 0, pix: 0 };

const authErrors = {
  'auth/email-already-in-use': 'E-mail já existente!',
};

const REQUIRED = 'É necessário preencher este campo';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file); // já adiciona o prefixo data:image/png;base64,...
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

const notifyError = (title) => toast({ variant: 'destructive', title });

const Organization = () => {
  const history = useHistory();
  const { idOrg } = useParams();
  const isCreate = idOrg === 'new';
  const state = history.location.state;

  const clientsService = ClientsService();
  const managersService = ManagersService();
  const { createUser } = Authentication(firebase);

  const [errorsVerify, setErrorsVerify] = useState({});
  const [buttonLoading, setButtonLoading] = useState(false);
  const [logoFixed, setLogoFixed] = useState(state ? state.logoFixed : null);
  const [logoWebstore, setLogoWebstore] = useState(state ? state.logoWebstore : null);
  const [password, setPassword] = useState('');
  const [taxes, setTaxes] = useState(taxesDefault);
  const [initialECommerceWebstoreUrl, setInitialECommerceWebstoreUrl] = useState('');
  const [eCommerce, setECommerce] = useState(eCommerceDefault);
  const [client, setClient] = useState({
    name: '',
    CNPJ: '',
    devices: 0,
    cashless: false,
    status: false,
    hasECommerce: false,
    onlyECommerce: false,
    expireAt: formatDateToMysqlDate(new Date()),
    email: '',
    uf: '',
    city: '',
    phone: '',
    uidUser: '',
    corporateName: '',
  });

  useEffect(() => {
    if (isCreate) return;
    // Edição depende do state da navegação (vem da lista); sem ele (F5 direto
    // na URL) não há dados do cliente para editar.
    if (!state) {
      history.replace('/dashboard/organization');
      return;
    }
    const taxesVal = state.taxes ?? taxesDefault;
    const eCommerceVal = state.eCommerce ?? eCommerceDefault;
    const date = new Date(state.expireAt);
    date.setHours(date.getHours() + 3);
    setClient({ ...state, expireAt: formatDateToMysqlDate(date) });
    setTaxes(taxesVal);
    setECommerce(eCommerceVal);
    if (eCommerceVal.webstoreUrl) setInitialECommerceWebstoreUrl(eCommerceVal.webstoreUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogoImage = async () => {
    let logoFixedData = null;
    let webstorelogoData = null;
    let logoWebstoreUrl = null;

    // Logo Fixed
    if (!logoFixed) {
      logoFixedData = '';
    } else if (typeof logoFixed === 'string') {
      logoFixedData = logoFixed;
    } else {
      const pathFile = `logoFixed/${new Date().getTime()}-${logoFixed.name}`;
      const storageRef = ref(firebase.storage, pathFile);
      const bytes = await uploadBytes(storageRef, logoFixed);
      logoFixedData = await getDownloadURL(bytes.ref);
    }

    // Webstore Logo
    if (!logoWebstore) {
      webstorelogoData = '';
    } else if (typeof logoWebstore === 'string') {
      webstorelogoData = logoWebstore;
    } else {
      webstorelogoData = await fileToBase64(logoWebstore);

      const pathFile = `logoWebstore/${new Date().getTime()}-${logoWebstore.name}`;
      const storageRef = ref(firebase.storage, pathFile);
      const bytes = await uploadBytes(storageRef, logoWebstore);
      logoWebstoreUrl = await getDownloadURL(bytes.ref);
    }

    return { imageUrl: logoFixedData, webstorelogoData, logoWebstoreUrl };
  };

  // Valida a loja virtual; retorna false (e avisa) se não puder salvar.
  const checkWebstore = async (uidUser) => {
    if (!eCommerce.webstoreUrl) return true;

    if (!eCommerce.credit && !eCommerce.pix) {
      notifyError('Para habilitar a loja virtual, é necessário habilitar pelo menos uma forma de pagamento (PIX ou Crédito)');
      return false;
    }

    const available = await clientsService.checkWebstoreNameAvailability(eCommerce.webstoreUrl, uidUser);
    if (!available) {
      notifyError(`Esse nome da loja online não está disponível: ${eCommerce.webstoreUrl}`);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    try {
      setButtonLoading(true);

      if (!(await checkWebstore())) {
        setButtonLoading(false);
        return;
      }

      const [user, createError] = await createUser(client.email, password);
      if (createError) {
        throw new Error(authErrors[user] ?? `Erro ao criar o usuário (${user})`);
      }

      // Logos antes de gravar o cliente; erro de upload cai no catch.
      const logos = await handleLogoImage();

      const dbName = `DB${sha1(Math.random())}`;
      const [uid, error2] = await clientsService.save({
        ...client,
        dbName,
        createdAt: +new Date(),
        expireAt: +new Date(client.expireAt),
        logoFixed: logos.imageUrl,
        logoWebstore: logos.webstorelogoData,
        logoWebstoreUrl: logos.logoWebstoreUrl,
        uidUser: user.uid,
        taxes,
        eCommerce,
      });
      if (error2) throw new Error('Erro ao gravar o cliente');

      const [, error3] = await managersService.save(
        {
          email: client.email,
          uid: user.uid,
          client: uid,
          dbName,
          master: true,
        },
        user.uid
      );
      if (error3) throw new Error('Erro ao gravar o usuário do cliente');

      // Banco do cliente pela API (só super-admin). Antes era
      // api-databases.oitickets.com.br/newdatabase, público — incidente 2026-11-12.
      const res = await axios.post(
        `${defaultApiEndpoint}/admin/tenant-database`,
        { database: dbName },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (!res.data?.success) throw new Error('Erro ao criar o banco do cliente');

      setButtonLoading(false);
      history.goBack();
    } catch (error) {
      notifyError(error?.response?.data?.message ?? error?.message ?? 'Ocorreu um erro');
      setButtonLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      setButtonLoading(true);

      if (!(await checkWebstore(client.uidUser))) {
        setButtonLoading(false);
        return;
      }

      const logos = await handleLogoImage();
      const [, error] = await clientsService.saveUpdate(
        {
          ...client,
          uid: state.uid,
          email: state.email ?? null,
          logoFixed: logos.imageUrl,
          logoWebstore: logos.webstorelogoData,
          logoWebstoreUrl: logos.logoWebstoreUrl,
          uidUser: state.uidUser ?? null,
          createdAt: state.createdAt,
          expireAt: +new Date(client.expireAt),
          taxes,
          eCommerce,
        },
        state.uid
      );
      if (error) throw new Error('Erro ao gravar o cliente');

      setButtonLoading(false);
      history.goBack();
    } catch (error) {
      notifyError(error?.message ?? 'Ocorreu um erro');
      setButtonLoading(false);
    }
  };

  // Valida todos os campos obrigatórios e mostra os erros de uma vez.
  const validate = () => {
    const errors = {};
    if (!client.name) errors.name = REQUIRED;
    const docLength = removeMask(client.CNPJ ?? '').length;
    if (docLength !== 14 && docLength !== 11) errors.cnpj = REQUIRED;
    if (!client.uf) errors.uf = 'Selecione a UF';

    if (isCreate) {
      if (!client.email) errors.email = REQUIRED;
      else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(client.email)) errors.email = 'Endereço de email inválido';
      if (!/^\S{4,}/.test(password)) errors.password = 'Mínimo 4 caracteres';
      else if (!/^\S*$/i.test(password)) errors.password = 'Não pode espaço em branco no campo';
    }

    setErrorsVerify(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (buttonLoading) return;
    if (!validate()) {
      notifyError('Um ou mais campos possui erro!');
      return;
    }
    if (isCreate) handleSave();
    else handleEdit();
  };

  const handleCancel = () => history.push('/dashboard/organization');

  const setField = (field, value) => {
    setClient((prev) => ({ ...prev, [field]: value }));
    setErrorsVerify((prev) => (prev[field] ? { ...prev, [field]: null } : prev));
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <SectionCard title={isCreate ? 'Cadastrar cliente' : 'Editar cliente'}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 content-start">
            <FormField label="Nome fantasia" htmlFor="name" error={errorsVerify.name} className="sm:col-span-6">
              <Input id="name" value={client.name} onChange={(e) => setField('name', e.target.value.slice(0, 80))} />
            </FormField>
            <FormField label="Razão social" htmlFor="corporateName" className="sm:col-span-6">
              <Input
                id="corporateName"
                value={client.corporateName}
                onChange={(e) => setField('corporateName', e.target.value.slice(0, 100))}
              />
            </FormField>
            <FormField label="CPF/CNPJ" htmlFor="CNPJ" error={errorsVerify.cnpj} className="sm:col-span-6">
              <Input
                id="CNPJ"
                value={cpfCnpjMask(client.CNPJ ?? '')}
                onChange={(e) => {
                  setField('CNPJ', removeMask(e.target.value));
                  setErrorsVerify((prev) => ({ ...prev, cnpj: null }));
                }}
              />
            </FormField>
            <FormField label="UF" htmlFor="uf" error={errorsVerify.uf} className="sm:col-span-2">
              <Select value={client.uf || undefined} onValueChange={(value) => setField('uf', value)}>
                <SelectTrigger id="uf">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {ufList.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Cidade" htmlFor="city" className="sm:col-span-4">
              <Input id="city" value={client.city} onChange={(e) => setField('city', e.target.value.slice(0, 255))} />
            </FormField>
            <FormField label="Telefone" htmlFor="phone" className="sm:col-span-6">
              <Input
                id="phone"
                value={cellPhoneMask(client.phone ?? '')}
                onChange={(e) => setField('phone', removeMask(e.target.value))}
              />
            </FormField>
            <FormField label="Número de dispositivos" htmlFor="devices" className="sm:col-span-3">
              <Input
                id="devices"
                type="number"
                value={client.devices}
                onChange={(e) => setField('devices', e.target.value)}
              />
            </FormField>
            <FormField label="Data de vencimento" htmlFor="expireAt" className="sm:col-span-3">
              <Input
                id="expireAt"
                type="date"
                value={client.expireAt}
                onChange={(e) => setField('expireAt', e.target.value)}
              />
            </FormField>
            <FormField label="E-mail" htmlFor="email" error={errorsVerify.email} className="sm:col-span-6">
              <Input
                id="email"
                type="email"
                value={client.email}
                disabled={!isCreate}
                onChange={(e) => setField('email', e.target.value)}
              />
            </FormField>
            {isCreate && (
              <FormField label="Senha" htmlFor="password" error={errorsVerify.password} className="sm:col-span-6">
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorsVerify((prev) => ({ ...prev, password: null }));
                  }}
                />
              </FormField>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
            <ImagePicker label="Logo fixa" name="imageLogo" image={logoFixed} setImage={setLogoFixed} />
            <ImagePicker
              label="Logo loja virtual"
              name="imageLogoWebstore"
              image={logoWebstore}
              setImage={setLogoWebstore}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Taxas e recursos">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
          <FormField label="Taxa PIX" htmlFor="taxPix">
            <Input
              id="taxPix"
              value={percentageMask(taxes.pix)}
              onChange={(e) => setTaxes({ ...taxes, pix: removeMask(e.target.value) })}
            />
          </FormField>
          <FormField label="Taxa crédito" htmlFor="taxCredit">
            <Input
              id="taxCredit"
              value={percentageMask(taxes.credit)}
              onChange={(e) => setTaxes({ ...taxes, credit: removeMask(e.target.value) })}
            />
          </FormField>
          <FormField label="Taxa débito" htmlFor="taxDebit">
            <Input
              id="taxDebit"
              value={percentageMask(taxes.debit)}
              onChange={(e) => setTaxes({ ...taxes, debit: removeMask(e.target.value) })}
            />
          </FormField>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
          <SwitchField
            id="cashless"
            label="Permitido uso de cashless"
            checked={Boolean(client.cashless)}
            onCheckedChange={(checked) => setField('cashless', checked)}
          />
          <SwitchField
            id="status"
            label="Status"
            checked={Boolean(client.status)}
            onCheckedChange={(checked) =>
              setClient({
                ...client,
                status: checked,
                hasECommerce: checked ? client.hasECommerce : false,
                onlyECommerce: checked ? client.onlyECommerce : false,
              })
            }
          />
          <SwitchField
            id="hasECommerce"
            label="Loja virtual"
            checked={Boolean(client.hasECommerce)}
            disabled={!client.status}
            onCheckedChange={(checked) => {
              setField('hasECommerce', checked);
              setECommerce({ ...eCommerceDefault, webstoreUrl: initialECommerceWebstoreUrl });
            }}
          />
          <SwitchField
            id="onlyECommerce"
            label="Somente loja virtual"
            checked={Boolean(client.onlyECommerce)}
            disabled={!client.status}
            onCheckedChange={(checked) => setField('onlyECommerce', checked)}
          />
        </div>
      </SectionCard>

      {client.hasECommerce && (
        <SectionCard title="Configuração loja virtual">
          <FormECommerce
            data={eCommerce}
            setData={setECommerce}
            isWebstoreNameAvailable={!initialECommerceWebstoreUrl}
            clientId={client.uid}
          />
        </SectionCard>
      )}

      <FormActions
        primary={{ label: 'Salvar', type: 'submit', loading: buttonLoading }}
        secondary={{ label: 'Cancelar', onClick: handleCancel }}
      />
    </form>
  );
};

export default Organization;
