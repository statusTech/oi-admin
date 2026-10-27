import { Button, CircularProgress, Grid, TextField, Typography } from '@material-ui/core'
import { Alert } from '@material-ui/lab'
import React, { useCallback, useEffect, useState } from 'react'
import Api from '../../api'

const defaultApiEndpoint = "https://api.oitickets.com.br/api/v1"

const friendlyError = (error, fallback) => {
    const status = error?.response?.status
    const message = error?.response?.data?.message

    if (status === 401 || status === 403) return 'Sem permissão para gerenciar a conexão PagBank desta loja.'
    if (status === 503) return 'Integração PagBank não configurada no servidor.'
    return message || fallback
}

const formatDate = (iso) => {
    if (!iso) return '-'
    const date = new Date(iso)
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR')
}

const FormPagbank = ({ clientId }) => {

    const [status, setStatus] = useState(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [linkLoading, setLinkLoading] = useState(false);
    const [disconnectLoading, setDisconnectLoading] = useState(false);
    const [authUrl, setAuthUrl] = useState(null);
    const [error, setError] = useState(null);

    const loadStatus = useCallback(async () => {
        if (!clientId) return

        setStatusLoading(true)
        setError(null)

        try {
            const req = await Api.get(`/oauth/pagbank/status?clientId=${clientId}`, {
                baseURL: defaultApiEndpoint,
            })
            setStatus(req.data)
        } catch (err) {
            setStatus(null)
            setError(friendlyError(err, 'Erro ao verificar o status da conexão PagBank.'))
        }

        setStatusLoading(false)
    }, [clientId])

    useEffect(() => {
        loadStatus()
    }, [loadStatus])

    const generateLink = async () => {
        setLinkLoading(true)
        setError(null)

        try {
            const req = await Api.get(`/oauth/pagbank/authorize?clientId=${clientId}`, {
                baseURL: defaultApiEndpoint,
            })

            if (req.data?.success && req.data?.authUrl) {
                setAuthUrl(req.data.authUrl)
            } else {
                setError('Não foi possível gerar o link de conexão PagBank.')
            }
        } catch (err) {
            setError(friendlyError(err, 'Erro ao gerar o link de conexão PagBank.'))
        }

        setLinkLoading(false)
    }

    const copyLink = () => {
        if (!authUrl) {
            alert("Nenhum link de conexão disponível para copiar.")
            return
        }

        navigator.clipboard.writeText(authUrl)
            .then(() => alert("Link de conexão copiado para a área de transferência!"))
            .catch(() => alert("Falha ao copiar o link de conexão."))
    }

    const disconnect = async () => {
        const confirmed = window.confirm(
            "Desconectar a conta PagBank? A loja passará a vender pelo Mercado Pago, sem split."
        )
        if (!confirmed) return

        setDisconnectLoading(true)
        setError(null)

        try {
            await Api.delete(`/oauth/pagbank/disconnect?clientId=${clientId}`, {
                baseURL: defaultApiEndpoint,
            })
            setAuthUrl(null)
            await loadStatus()
        } catch (err) {
            setError(friendlyError(err, 'Erro ao desconectar a conta PagBank.'))
        }

        setDisconnectLoading(false)
    }

    if (!clientId) {
        return (
            <Grid item xs={12}>
                <Alert severity='info'>
                    Salve a organização para poder gerar o link de conexão PagBank.
                </Alert>
            </Grid>
        )
    }

    const connected = !!status?.connected
    const needsReconnect = connected && (status.status !== 'active' || status.isExpired)
    const isHealthy = connected && !needsReconnect

    return (
        <>
            {error && (
                <Grid item xs={12}>
                    <Alert severity='error' onClose={() => setError(null)}>{error}</Alert>
                </Grid>
            )}

            <Grid item xs={12}>
                <Typography variant='subtitle2'>Conexão PagBank</Typography>
                {statusLoading && <CircularProgress size={20} />}
                {!statusLoading && status && !connected && (
                    <Typography variant='body2' color='textSecondary'>Conta não conectada.</Typography>
                )}
                {!statusLoading && isHealthy && (
                    <>
                        <Typography variant='body2'>Conta: {status.accountId}</Typography>
                        <Typography variant='body2'>Válida até: {formatDate(status.expiresAt)}</Typography>
                    </>
                )}
            </Grid>

            {needsReconnect && (
                <Grid item xs={12}>
                    <Alert severity='warning'>
                        A conexão com a conta PagBank {status.accountId ? `(${status.accountId}) ` : ''}
                        expirou ou foi revogada. Enquanto isso, a loja vende pelo Mercado Pago, sem split.
                        Use "Reconectar" para gerar um novo link.
                    </Alert>
                </Grid>
            )}

            {isHealthy && !status.hasPublicKey && (
                <Grid item xs={12}>
                    <Alert severity='warning'>
                        Cartão desta loja vai pelo Mercado Pago (PIX segue no PagBank).
                    </Alert>
                </Grid>
            )}

            {authUrl && (
                <Grid item container xs={12} spacing={2}>
                    <Grid item xs={8} md={4}>
                        <TextField
                            label='Link de conexão PagBank (vale 10 minutos)'
                            value={authUrl}
                            InputProps={{ readOnly: true }}
                            variant='outlined'
                            type='text'
                            size='small'
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={4} md={2}>
                        <Button onClick={copyLink} variant='outlined' color='primary'>
                            Copiar link
                        </Button>
                    </Grid>
                </Grid>
            )}

            <Grid item container xs={12} spacing={2} alignItems='center'>
                <Grid item>
                    <Button onClick={generateLink} variant='text' color='primary' disabled={linkLoading}>
                        {linkLoading
                            ? <CircularProgress size={25} />
                            : needsReconnect ? 'Reconectar' : 'Gerar link de conexão PagBank'}
                    </Button>
                </Grid>
                <Grid item>
                    <Button onClick={loadStatus} variant='text' color='primary' disabled={statusLoading}>
                        Atualizar status
                    </Button>
                </Grid>
                {connected && (
                    <Grid item>
                        <Button onClick={disconnect} variant='text' color='secondary' disabled={disconnectLoading}>
                            {disconnectLoading ? <CircularProgress size={25} /> : 'Desconectar'}
                        </Button>
                    </Grid>
                )}
            </Grid>
        </>
    )
}

export default FormPagbank
