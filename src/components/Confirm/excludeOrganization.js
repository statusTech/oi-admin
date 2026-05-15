import React, { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    Button,
    DialogActions,
} from "@material-ui/core"

const initialDeletion = { finished: false, deleting: false, message: 'Essa ação é irreversível!' }

const ModalExcludeOrganization = ({
    show,
    onClose = () => { },
    handleConfirm = () => { }
}) => {
    const [deletion, setDeletion] = useState(initialDeletion)

    const closeModal = () => {
        onClose()
    }

    const onConfirm = async () => {
        setDeletion({ finished: false, deleting: true, message: 'Excluindo...' })
        const { message } = await handleConfirm()
        setDeletion({ finished: true, deleting: false, message })
    }

    useEffect(() => {
        if (show) {
            setDeletion(initialDeletion)
        }
    }, [show])

    return (
        <Dialog open={show} onClose={deletion.deleting ? () => { } : closeModal} fullWidth maxWidth="sm">
            <DialogTitle style={{ textAlign: 'center' }}>Tem certeza que deseja excluir esse cliente?</DialogTitle>
            <DialogContent>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 24,
                        maxHeight: "60vh",
                    }}
                >
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        overflowY: 'auto',
                        gap: 12,
                        padding: "0 0 12px"
                    }}>
                        <span style={{ fontSize: 20, textAlign: 'center' }}>
                            {deletion.message}
                        </span>
                    </div>
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="outlined"
                    color="secondary"
                    style={{ cursor: "pointer" }}
                    disabled={deletion.deleting}
                    onClick={() => {
                        closeModal()
                    }}
                >
                    {!deletion.finished ? 'Cancelar' : 'Fechar'}
                </Button>
                {!deletion.finished && (
                    <Button
                        variant="outlined"
                        color="primary"
                        style={{ cursor: "pointer" }}
                        disabled={deletion.deleting}
                        onClick={onConfirm}
                    >
                        Tenho certeza
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    )
}

export default ModalExcludeOrganization
