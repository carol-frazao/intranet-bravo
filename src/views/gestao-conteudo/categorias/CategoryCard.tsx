'use client';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Interface representando uma categoria, incluindo filhos (children)
 */
export interface Category {
  id: number;
  name: string;
  description: string;
  parentId: number | null;
  icon: string;
  color: string;
  order: number;
  status: string;
  children?: Category[];
}

export interface CategoryCardProps {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  onInactivate: () => void;
  isPotentialParent?: boolean;
  positionNumber?: string;
  level?: number;
  isLastChild?: boolean;
}

/**
 * Cartão individual de categoria, com conectores de linha vertical e horizontal,
 * e suporte a drag-and-drop.
 */
export default function CategoryCard({
  category,
  onEdit,
  onDelete,
  onView,
  onInactivate,
  isPotentialParent = false,
  positionNumber = '',
  level = 0,
  isLastChild = false
}: CategoryCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const theme = useTheme();

  // Define o estilo de movimento durante o drag
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Define o recuo lateral por nível (24px por nível)
  const indent = level * 24;

  return (
    <Box sx={{ position: 'relative', pl: `${indent}px` }}>
      {/* Linha vertical conectando ao pai */}
      {level > 0 && (
        <Box
          sx={{
            position: 'absolute',
            left: `${indent - 12}px`,
            top: 0,
            bottom: isLastChild ? '50%' : 0,
            width: '2px',
            backgroundColor: '#ccc',
            zIndex: 0,
          }}
        />
      )}

      {/* Linha horizontal ligando ao nó pai */}
      {level > 0 && (
        <Box
          sx={{
            position: 'absolute',
            left: `${indent - 12}px`,
            top: '50%',
            width: '12px',
            height: '2px',
            backgroundColor: '#ccc',
            zIndex: 0,
          }}
        />
      )}

      <Card
        ref={setNodeRef}
        style={style}
        data-id={`category-${category.id}`}
        sx={{
          mb: 0.5,
          border: isPotentialParent ? `2px dashed ${theme.palette.primary.main}` : '1px solid #e0e0e0',
          '&:hover': { borderColor: theme.palette.primary.main, cursor: 'pointer' },
          borderRadius: 1,
          boxShadow: 'none',
        }}
        onClick={onView}
      >
        <CardContent sx={{ py: '6px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Ícone de arrastar */}
          <Box 
            {...attributes} 
            {...listeners} 
            sx={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <DragIndicatorIcon color="action" fontSize="small" />
          </Box>

          {/* Nome e status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            {category.color && (
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  bgcolor: category.color,
                  borderRadius: '50%',
                  border: '1px solid #ccc',
                }}
              />
            )}
            <Typography variant="body2" fontWeight={500}>
              {category.name}
            </Typography>
            <Chip
              label={category.status === 'active' ? 'Ativo' : 'Inativo'}
              size="small"
              color={category.status === 'active' ? 'success' : 'default'}
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Box>

          {/* Ações */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
            {positionNumber && (
              <Typography variant="caption" color="warning.main" fontWeight={600}>
                {positionNumber}
              </Typography>
            )}
            <Button 
              size="small" 
              onClick={onView}
              sx={{ minWidth: 'auto', padding: '2px 6px', borderRadius: 0, marginLeft: 0.5, fontSize: '0.75rem', '&:hover': { backgroundColor: 'transparent' } }}
            >
              Ver mais
            </Button>
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                onInactivate();
              }}
              title="Inativar categoria"
              color={category.status === 'active' ? 'success' : 'error'}
            >
              {category.status === 'active' ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
            </IconButton>
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              color="error" 
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
