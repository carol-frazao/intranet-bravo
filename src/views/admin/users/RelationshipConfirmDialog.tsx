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

interface RelationshipConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  usersCount: number;
  actionType: 'delete' | 'inactivate';
  itemType: 'perfil' | 'grupo' | 'unidade';
}

export default function RelationshipConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  usersCount,
  actionType,
  itemType,
}: RelationshipConfirmDialogProps) {
  const actionText = actionType === 'delete' ? 'excluir' : 'inativar';
  const actionTextPast = actionType === 'delete' ? 'excluído' : 'inativado';
  const relationshipText = actionType === 'delete' 
    ? 'irá deixar estes usuários órfãos' 
    : 'irá remover estes relacionamentos';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          {title}
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body1" fontWeight="bold" gutterBottom>
            {usersCount} usuário(s) estão associados a este {itemType}.
          </Typography>
          <Typography variant="body2">
            {actionType === 'delete' 
              ? `Excluí-lo irá deixar estes usuários órfãos de ${itemType}.`
              : `Inativá-lo irá remover estes relacionamentos.`
            }
          </Typography>
        </Alert>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
          Deseja {actionText} mesmo assim?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color={actionType === 'delete' ? 'error' : 'warning'}
          autoFocus
        >
          Sim, {actionText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

