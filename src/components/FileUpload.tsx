'use client';
import { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Paper,
  CircularProgress,
  Chip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import { toast } from 'react-toastify';
import api from '@/utils/axios';

interface FileItem {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  mediaUrl?: string;
  createdAt: string;
}

interface FileUploadProps {
  contentId?: number;
  files: FileItem[];
  onFilesChange?: () => void;
  disabled?: boolean;
  onFileSelect?: (files: File[]) => void; // Para modo de seleção (sem upload imediato)
  onFileRemove?: (index: number) => void; // Para remover arquivo no modo seleção
  localFiles?: File[]; // Para exibir arquivos selecionados localmente
}

export default function FileUpload({ 
  contentId, 
  files, 
  onFilesChange, 
  disabled = false,
  onFileSelect,
  onFileRemove,
  localFiles = []
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const isLocalMode = !contentId && onFileSelect; // Modo de seleção local (sem upload)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    // Modo local: apenas armazena os arquivos
    if (isLocalMode && onFileSelect) {
      onFileSelect(Array.from(selectedFiles));
      event.target.value = ''; // Reset input
      return;
    }

    // Modo upload imediato (quando contentId existe)
    if (!contentId) return;

    const formData = new FormData();
    Array.from(selectedFiles).forEach((file) => {
      formData.append('medias', file);
    });

    try {
      setUploading(true);
      await api.post(`/intranet/contents/${contentId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Arquivo(s) enviado(s) com sucesso!');
      onFilesChange?.();
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error(error.response?.data?.message || 'Erro ao enviar arquivo(s)');
    } finally {
      setUploading(false);
      event.target.value = ''; // Reset input
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!window.confirm('Tem certeza que deseja deletar este arquivo?')) return;

    try {
      await api.delete(`/intranet/files/${fileId}`);
      toast.success('Arquivo deletado com sucesso!');
      onFilesChange?.();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast.error(error.response?.data?.message || 'Erro ao deletar arquivo');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <PictureAsPdfIcon color="error" />;
    if (fileType.includes('image')) return <ImageIcon color="primary" />;
    if (fileType.includes('word') || fileType.includes('document')) return <DescriptionIcon color="info" />;
    return <InsertDriveFileIcon />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const hasFiles = files.length > 0 || localFiles.length > 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Anexos</Typography>
        <Button
          variant="outlined"
          size="small"
          component="label"
          startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
          disabled={disabled || uploading}
          sx={{ padding: '0.2rem 0.7rem' }}
        >
          {uploading ? 'Enviando...' : 'Adicionar Arquivos'}
          <input
            type="file"
            hidden
            multiple
            onChange={handleFileSelect}
            disabled={disabled || uploading}
          />
        </Button>
      </Box>

      {!hasFiles ? (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
          <InsertDriveFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Nenhum arquivo anexado
          </Typography>
        </Paper>
      ) : (
        <List>
          {/* Arquivos locais (selecionados mas não enviados) */}
          {localFiles.map((file, index) => (
            <ListItem
              key={`local-${index}`}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                mb: 1,
                bgcolor: 'info.lighter',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <Box sx={{ mr: 2 }}>
                {getFileIcon(file.type)}
              </Box>
              <ListItemText
                primary={file.name}
                secondary={
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip label={formatFileSize(file.size)} size="small" />
                    <Chip label="Aguardando envio" size="small" color="info" variant="outlined" />
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => onFileRemove?.(index)}
                  disabled={disabled}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}

          {/* Arquivos remotos (já enviados) */}
          {files.map((file) => (
            <ListItem
              key={file.id}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                mb: 1,
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <Box sx={{ mr: 2 }}>
                {getFileIcon(file.fileType)}
              </Box>
              <ListItemText
                primary={file.fileName}
                secondary={
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip label={formatFileSize(file.fileSize)} size="small" />
                    <Chip label={new Date(file.createdAt).toLocaleDateString('pt-BR')} size="small" variant="outlined" />
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleDelete(file.id)}
                  disabled={disabled}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}

