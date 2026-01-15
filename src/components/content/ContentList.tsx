'use client';
import { useRouter } from 'next/navigation';
import { Box, Paper, Typography, Chip, Button } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AttachFileIcon from '@mui/icons-material/AttachFile';

interface Content {
  id: number;
  title: string;
  description: string;
  type: string;
  categoryId: number;
  content?: string;
  views?: number;
  files?: any[];
  author?: { name: string, email: string, id: number };
  publishedAt?: string;
  url?: string;
  updatedAt?: string;
  updatedById?: number;
  order?: number;
  status?: string;
}

interface ContentListProps {
  contents: any[];
  filesCount: Record<number, number>;
}

export default function ContentList({ contents, filesCount }: ContentListProps) {
  const router = useRouter();

  if (contents.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
        Nenhum conteúdo disponível nesta categoria.
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      {contents.map((content) => (
        <Paper 
          key={content.id} 
          sx={{ p: 2.5, mb: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', boxShadow: 2 } }}
          onClick={() => router.push(`/conteudo/${content.id}`)}
        >
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            {content.title || 'N/A'}
          </Typography>
          
          {content.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {content.description || 'N/A'}
            </Typography>
          )}

          {/* Informações adicionais */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
            <Chip 
              label={content.type} 
              size="small" 
              color={content.type === 'aviso' ? 'warning' : (content.type === 'normativa' ? 'info' : 'default')}
              variant="outlined"
            />
            
            {content.author && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {content.author.name || 'N/A'}
                </Typography>
              </Box>
            )}
            
            {content.views !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <VisibilityIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {content.views} {content.views === 1 ? 'visualização' : 'visualizações'}
                </Typography>
              </Box>
            )}
            
            {filesCount[content.id] > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AttachFileIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
                  {filesCount[content.id]} anexo{filesCount[content.id] > 1 ? 's' : ''}
                </Typography>
              </Box>
            )}
          </Box>

          {/* previa do conteudo (ou url se for link) */}
          {content.content && (
            <Box 
              sx={{ 
                '& h2': { mt: 3, mb: 2 },
                '& h3': { mt: 2, mb: 1 },
                '& p': { mb: 2 },
                '& ul': { ml: 3, mb: 2 }
              }}
              dangerouslySetInnerHTML={{ __html: content.content?.substring(0, 500) + '...' || content.description?.substring(0, 500) + '...' }}
            />
          )}

          {content.url && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {content.url}
            </Typography>
          )}

          <Button 
            variant="outlined"
            size="small" 
            sx={{ mt: 2, px: 2, py: 0.5 }}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/conteudo/${content.id}`);
            }}
          >
            Ver conteúdo completo
          </Button>
        </Paper>
      ))}
    </Box>
  );
}

