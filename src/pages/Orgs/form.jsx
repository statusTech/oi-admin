import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Controller, FormProvider, useForm } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import FormECommerce from './formECommerce';
import { ControlledInput, ControlledSwitch } from './fields';

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

const clientDefault = {
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
};

const authErrors = {
  'auth/email-already-in-use': 'E-mail já existente!',
};

const REQUIRED = 'É necessário preencher este campo';
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file); // já adiciona o prefixo data:image/png;base64,...
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

const notifyError = (title) => toast({ variant: 'destructive', title });

// Valores iniciais do formulário. Na edição, tudo que veio do cliente (state da
// navegação) segue no form para ser gravado de volta como antes.
const buildDefaultValues = (state) => {
  if (!state) {
    return {
      ...clientDefault,
      password: '',
      taxes: taxesDefault,
      eCommerce: eCommerceDefault,
      logoFixed: null,
      logoWebstore: null,
    };
  }
  const date = new Date(state.expireAt);
  date.setHours(date.getHours() + 3);
  return {
    ...clientDefault,
    ...state,
    expireAt: formatDateToMysqlDate(date),
    password: '',
    taxes: state.taxes ?? taxesDefault,
    eCommerce: state.eCommerce ?? eCommerceDefault,
    logoFixed: state.logoFixed ?? null,
    logoWebstore: state.logoWebstore ?? null,
  };
};

const Organization = () => {
  const history = useHistory();
  const { idOrg } = useParams();
  const isCreate = idOrg === 'new';
  const state = history.location.state;

  const clientsService = ClientsService();
  const managersService = ManagersService();
  const { createUser } = Authentication(firebase);

  const [buttonLoading, setButtonLoading] = useState(false);
  const [initialECommerceWebstoreUrl] = useState(() => (isCreate ? '' : state?.eCommerce?.webstoreUrl ?? ''));

  const methods = useForm({
    defaultValues: buildDefaultValues(isCreate ? null : state),
    shouldFocusError: true,
  });
  const { control, handleSubmit, setValue, getValues, watch } = methods;

  const status = watch('status');
  const hasECommerce = watch('hasECommerce');

  useEffect(() => {
    // Edição depende do state da navegação (vem da lista); sem ele (F5 direto
    // na URL) não há dados do cliente para editar.
    if (!isCreate && !state) history.replace('/dashboard/organization');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogoImage = async ({ logoFixed, logoWebstore }) => {
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
  const checkWebstore = async (eCommerce, uidUser) => {
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

  const handleSave = async ({ password, taxes, eCommerce, logoFixed, logoWebstore, ...client }) => {
    try {
      setButtonLoading(true);

      if (!(await checkWebstore(eCommerce))) {
        setButtonLoading(false);
        return;
      }

      // Usuário no app secundário (org-signup): não troca a sessão do super-admin.
      const [user, createError] = await createUser(client.email, password);
      if (createError) {
        throw new Error(authErrors[user] ?? `Erro ao criar o usuário (${user})`);
      }

      // Logos antes de gravar o cliente; erro de upload cai no catch.
      const logos = await handleLogoImage({ logoFixed, logoWebstore });

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

  // eslint-disable-next-line no-unused-vars
  const handleEdit = async ({ password, taxes, eCommerce, logoFixed, logoWebstore, ...client }) => {
    try {
      setButtonLoading(true);

      if (!(await checkWebstore(eCommerce, client.uidUser))) {
        setButtonLoading(false);
        return;
      }

      const logos = await handleLogoImage({ logoFixed, logoWebstore });
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

  const onValid = (values) => {
    if (buttonLoading) return;
    return isCreate ? handleSave(values) : handleEdit(values);
  };

  const onInvalid = () => notifyError('Um ou mais campos possui erro!');

  const handleCancel = () => history.push('/dashboard/organization');

  const nameRules = { required: REQUIRED };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onValid, onInvalid)} noValidate className="flex flex-col gap-3">
        <SectionCard title={isCreate ? 'Cadastrar cliente' : 'Editar cliente'}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 content-start">
              <ControlledInput
                name="name"
                label="Nome fantasia"
                rules={nameRules}
                parse={(v) => v.slice(0, 80)}
                className="sm:col-span-6"
              />
              <ControlledInput
                name="corporateName"
                label="Razão social"
                parse={(v) => v.slice(0, 100)}
                className="sm:col-span-6"
              />
              <ControlledInput
                name="CNPJ"
                label="CPF/CNPJ"
                rules={{
                  validate: (v) => {
                    const length = removeMask(v ?? '').length;
                    return length === 11 || length === 14 || REQUIRED;
                  },
                }}
                mask={(v) => cpfCnpjMask(v ?? '')}
                parse={removeMask}
                className="sm:col-span-6"
              />
              <Controller
                name="uf"
                control={control}
                rules={{ required: 'Selecione a UF' }}
                render={({ field, fieldState }) => (
                  <FormField label="UF" htmlFor="uf" error={fieldState.error?.message} className="sm:col-span-2">
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger id="uf" ref={field.ref}>
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
                )}
              />
              <ControlledInput name="city" label="Cidade" parse={(v) => v.slice(0, 255)} className="sm:col-span-4" />
              <ControlledInput
                name="phone"
                label="Telefone"
                mask={(v) => cellPhoneMask(v ?? '')}
                parse={removeMask}
                className="sm:col-span-6"
              />
              <ControlledInput name="devices" label="Número de dispositivos" type="number" className="sm:col-span-3" />
              <ControlledInput name="expireAt" label="Data de vencimento" type="date" className="sm:col-span-3" />
              <ControlledInput
                name="email"
                label="E-mail"
                type="email"
                disabled={!isCreate}
                rules={
                  isCreate
                    ? {
                        required: REQUIRED,
                        pattern: { value: EMAIL_REGEX, message: 'Endereço de email inválido' },
                      }
                    : undefined
                }
                className="sm:col-span-6"
              />
              {isCreate && (
                <ControlledInput
                  name="password"
                  label="Senha"
                  type="password"
                  autoComplete="new-password"
                  rules={{
                    validate: (v) => {
                      if (!/^\S{4,}/.test(v ?? '')) return 'Mínimo 4 caracteres';
                      if (!/^\S*$/.test(v)) return 'Não pode espaço em branco no campo';
                      return true;
                    },
                  }}
                  className="sm:col-span-6"
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
              <Controller
                name="logoFixed"
                control={control}
                render={({ field }) => (
                  <ImagePicker label="Logo fixa" name="imageLogo" image={field.value} setImage={field.onChange} />
                )}
              />
              <Controller
                name="logoWebstore"
                control={control}
                render={({ field }) => (
                  <ImagePicker
                    label="Logo loja virtual"
                    name="imageLogoWebstore"
                    image={field.value}
                    setImage={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Taxas e recursos">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
            <ControlledInput name="taxes.pix" label="Taxa PIX" mask={percentageMask} parse={removeMask} />
            <ControlledInput name="taxes.credit" label="Taxa crédito" mask={percentageMask} parse={removeMask} />
            <ControlledInput name="taxes.debit" label="Taxa débito" mask={percentageMask} parse={removeMask} />
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
            <ControlledSwitch name="cashless" label="Permitido uso de cashless" />
            <ControlledSwitch
              name="status"
              label="Status"
              onCheckedChange={(checked) => {
                if (!checked) {
                  setValue('hasECommerce', false);
                  setValue('onlyECommerce', false);
                }
              }}
            />
            <ControlledSwitch
              name="hasECommerce"
              label="Loja virtual"
              disabled={!status}
              onCheckedChange={() =>
                setValue('eCommerce', { ...eCommerceDefault, webstoreUrl: initialECommerceWebstoreUrl })
              }
            />
            <ControlledSwitch name="onlyECommerce" label="Somente loja virtual" disabled={!status} />
          </div>
        </SectionCard>

        {hasECommerce && (
          <SectionCard title="Configuração loja virtual">
            <FormECommerce
              isWebstoreNameAvailable={!initialECommerceWebstoreUrl}
              clientId={getValues('uid')}
            />
          </SectionCard>
        )}

        <FormActions
          primary={{ label: 'Salvar', type: 'submit', loading: buttonLoading }}
          secondary={{ label: 'Cancelar', onClick: handleCancel }}
        />
      </form>
    </FormProvider>
  );
};

export default Organization;
