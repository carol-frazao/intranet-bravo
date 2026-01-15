"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Paper,
  Divider,
  IconButton,
  Tab,
  Tabs,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ChangesViewerProps {
  open: boolean;
  onClose: () => void;
  changes: string | any | null;
  title?: string;
}

// Labels dos campos em português
const FIELD_LABELS: Record<string, string> = {
  title: 'Título',
  description: 'Descrição',
  content: 'Conteúdo',
  categoryId: 'Categoria',
  type: 'Tipo',
  url: 'URL',
  accessLevel: 'Nível de Acesso',
  status: 'Status',
  publishedAt: 'Data de Publicação',
  order: 'Ordem',
  name: 'Nome',
  parentId: 'Categoria Pai',
  icon: 'Ícone',
  color: 'Cor',
};

export default function ChangesViewer({ open, onClose, changes, title = "Alterações" }: ChangesViewerProps) {
  const [tabValue, setTabValue] = useState(0);

  if (!changes) return null;

  // Parse changes se for string - formato: { field: { before, after }, ... }
  const changesData = typeof changes === 'string' ? JSON.parse(changes) : changes;
  
  // Converter para array de alterações
  const changesArray = Object.keys(changesData).map(field => ({
    field,
    label: FIELD_LABELS[field] || field,
    before: changesData[field].before,
    after: changesData[field].after,
  }));

  const isHTMLContent = (value: any, field: string) => {
    return field === 'content' && typeof value === 'string' && value.includes('<');
  };

  const renderValue = (value: any, field: string) => {
    if (value === null || value === undefined) {
      return <Typography variant="body2" color="text.secondary" fontStyle="italic">Não definido</Typography>;
    }

    // Se for conteúdo HTML
    if (isHTMLContent(value, field)) {
      return (
        <Paper variant="outlined" sx={{ p: 2, maxHeight: 400, overflow: 'auto', bgcolor: 'background.default' }}>
          <div dangerouslySetInnerHTML={{ __html: value }} className="inner-html" />
        </Paper>
      );
    }

    // Se for campo de arquivos (formato especial)
    if (field === 'files' && typeof value === 'string') {
      // Detectar se é adição ou remoção
      const isAddition = value.includes('Anexado');
      const isDeletion = value.includes('deletado');
      
      return (
        <Box sx={{ 
          p: 1.5, 
          bgcolor: isAddition ? 'success.lighter' : isDeletion ? 'error.lighter' : 'grey.100',
          borderRadius: 1,
          border: '1px solid',
          borderColor: isAddition ? 'success.light' : isDeletion ? 'error.light' : 'grey.300'
        }}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {value}
          </Typography>
        </Box>
      );
    }

    // Se for data
    if (field === 'publishedAt' && value) {
      return (
        <Typography variant="body2">
          {new Date(value).toLocaleString('pt-BR')}
        </Typography>
      );
    }

    // Se for booleano
    if (typeof value === 'boolean') {
      return <Chip label={value ? 'Sim' : 'Não'} size="small" color={value ? 'success' : 'default'} />;
    }

    // Valor padrão
    return <Typography variant="body2">{String(value)}</Typography>;
  };

  const renderDiffItem = (change: any, index: number) => (
    <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom fontWeight={600} color="primary">
        {change.label}
      </Typography>
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {/* Antes */}
        <Box>
          <Typography variant="caption" color="error.main" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
            ❌ Antes:
          </Typography>
          {renderValue(change.before, change.field)}
        </Box>

        {/* Depois */}
        <Box>
          <Typography variant="caption" color="success.main" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
            ✅ Depois:
          </Typography>
          {renderValue(change.after, change.field)}
        </Box>
      </Box>
    </Paper>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{title}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Resumo */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1, border: '1px solid', borderColor: 'info.light' }}>
          <Typography variant="body2">
            <strong>Total de alterações:</strong> {changesArray.length} campo(s) modificado(s)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {changesArray.map(c => c.label).join(', ')}
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab label={`Campo por Campo (${changesArray.length})`} />
          <Tab label="Comparação Lado a Lado" />
        </Tabs>

        {/* Conteúdo das Tabs */}
        {tabValue === 0 && (
          <Box>
            {changesArray.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Nenhuma alteração detectada
              </Typography>
            ) : (
              changesArray.map((change, index) => renderDiffItem(change, index))
            )}
          </Box>
        )}

        {tabValue === 1 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {/* Antes (esquerda) */}
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'error.lighter' }}>
              <Typography variant="h6" color="error.main" gutterBottom>
                ❌ Antes
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {changesArray.map((change, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">{change.label}:</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {renderValue(change.before, change.field)}
                  </Box>
                </Box>
              ))}
            </Paper>

            {/* Depois (direita) */}
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.lighter' }}>
              <Typography variant="h6" color="success.main" gutterBottom>
                ✅ Depois
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {changesArray.map((change, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">{change.label}:</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {renderValue(change.after, change.field)}
                  </Box>
                </Box>
              ))}
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

