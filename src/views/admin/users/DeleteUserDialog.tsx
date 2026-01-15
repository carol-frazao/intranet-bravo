'use client';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import BlockIcon from '@mui/icons-material/Block';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

interface DeleteUserDialogProps {
  open: boolean;
  onClose: () => void;
  onInactivate: () => void;
  onConfirmDelete: () => void;
  userName: string;
}

export default function DeleteUserDialog({
  open,
  onClose,
  onInactivate,
  onConfirmDelete,
  userName,
}: DeleteUserDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Excluir Usuário
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Recomendamos inativar o usuário ao invés de excluir
          </Typography>
          <Typography variant="body2">
            Ao inativar, o usuário será desabilitado mas os registros serão mantidos para histórico e auditoria.
          </Typography>
        </Alert>
        <Typography variant="body1" gutterBottom>
          Você está prestes a excluir permanentemente o usuário <strong>{userName}</strong>.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Esta ação é <strong>irreversível</strong> e removerá todos os dados do usuário do sistema.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button 
          onClick={onInactivate} 
          variant="outlined" 
          color="warning"
          startIcon={<BlockIcon />}
        >
          Inativar
        </Button>
        <Button 
          onClick={onConfirmDelete} 
          variant="contained" 
          color="error"
          startIcon={<DeleteForeverIcon />}
          autoFocus
        >
          Confirmar Exclusão
        </Button>
      </DialogActions>
    </Dialog>
  );
}

