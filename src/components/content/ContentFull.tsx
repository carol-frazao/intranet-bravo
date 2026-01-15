'use client';
import { Box, Paper, Typography, Chip, CircularProgress, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useEffect, useState } from 'react';
import api from '@/utils/axios';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DownloadIcon from '@mui/icons-material/Download';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import LinkIcon from '@mui/icons-material/Link';
interface ContentFullProps {
  content: any;
  filesCount: number;
}

export default function ContentFull({ content, filesCount }: ContentFullProps) {
  if (!content) return null;

  const [files, setFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [content.id]);

  const loadFiles = async () => {
    if (!content.id) return;
    try {
      setLoadingFiles(true);
      const response = await api.get(`/intranet/contents/${content.id}/files`);
      setFiles(response.data);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          {content.title}
        </Typography>
        
        {/* Metadados */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3, mt: 2 }}>
          {content.type && (
            <Chip 
              label={content.type} 
              size="small" 
              color={content.type === 'aviso' ? 'warning' : (content.type === 'normativa' ? 'info' : 'default')}
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
          {content.author && (
            <Chip 
              icon={<PersonIcon fontSize="small" />} 
              label={content.author.name} 
              size="small" 
              variant="outlined"
            />
          )}
          {content.views !== undefined && (
            <Chip 
              icon={<VisibilityIcon fontSize="small" />} 
              label={`${content.views} visualizações`} 
              size="small" 
              variant="outlined"
            />
          )}
          {filesCount > 0 && (
            <Chip 
              icon={<AttachFileIcon fontSize="small" />} 
              label={`${filesCount} anexo${filesCount > 1 ? 's' : ''}`} 
              size="small" 
              variant="outlined"
              color="primary"
            />
          )}
        </Box>

        {/* URL */}
        {content.url && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, mb: 0.5 }}>
              <LinkIcon sx={{ color: 'primary.main', mr: 0.5 }} fontSize="small" /> URL:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{content.url}</Typography>
          </Box>
        )}

        {/* Conteúdo HTML */}
        {content.content && (
          <Box 
            sx={{ 
              mt: 2,
              '& img': { maxWidth: '100%', height: 'auto' },
              '& table': { borderCollapse: 'collapse', width: '100%' },
              '& td, & th': { border: '1px solid #ddd', padding: '8px' }
            }}
            dangerouslySetInnerHTML={{ __html: content.content }} 
          />
        )}

        <Box sx={{ my: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: '1rem', mb: 0 }}>
            Anexos
          </Typography>
          {loadingFiles ? (
            <CircularProgress size={20} />
          ) : files.length > 0 ? (
            <List>
              {files.map((file, index) => {
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

                return (
                  <ListItem
                    key={file.id}
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      mb: index < files.length - 1 ? 1 : 0,
                      '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' }
                    }}
                    component="a"
                    href={file.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ListItemIcon>
                      {getFileIcon(file.fileType)}
                    </ListItemIcon>
                    <ListItemText
                      primary={file.fileName}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip label={formatFileSize(file.fileSize)} size="small" />
                          <Chip
                            label={new Date(file.createdAt).toLocaleDateString('pt-BR')}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                    />
                    <DownloadIcon sx={{ color: 'text.secondary' }} />
                  </ListItem>
                );
              })}
          </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1}}>Nenhum anexo encontrado.</Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

