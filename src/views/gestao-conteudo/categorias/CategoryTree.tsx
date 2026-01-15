'use client';
import { Box } from '@mui/material';
import CategoryCard, { Category } from './CategoryCard';

interface CategoryTreeProps {
  categories: Category[];
  level: number;
  onEdit: (id: number) => void;
  onDelete: (category: Category) => void;
  onView: (category: Category) => void;
  onInactivate: (category: Category) => void;
  overId?: number | null;
  parentNumber?: string;
  potentialParentId?: number | null;
  insertionTarget?: { id: number; position: 'top' | 'bottom' } | null;
}

/**
 * Renderiza uma árvore hierárquica de categorias com suporte a drag-and-drop
 */
export default function CategoryTree({
  categories,
  level,
  onEdit,
  onDelete,
  onView,
  onInactivate,
  overId,
  parentNumber = '',
  potentialParentId,
  insertionTarget,
}: CategoryTreeProps) {
  return (
    <Box sx={{ position: 'relative' }}>
      {categories.map((category, index) => {
        const positionNumber = parentNumber ? `${parentNumber}.${index + 1}` : `${index + 1}`;
        const isLastChild = index === categories.length - 1;

        return (
          <Box key={category.id} sx={{ position: 'relative' }}>
            <CategoryCard
              category={category}
              onEdit={() => onEdit(category.id)}
              onDelete={() => onDelete(category)}
              onView={() => onView(category)}
              onInactivate={() => onInactivate(category)}
              isPotentialParent={potentialParentId === category.id}
              positionNumber={positionNumber}
              level={level}
              isLastChild={isLastChild}
            />
            {category.children && category.children.length > 0 && (
              <Box sx={{ ml: 0, mt: 0.5 }}>
                <CategoryTree
                  categories={category.children}
                  level={level + 1}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onView={onView}
                  onInactivate={onInactivate}
                  overId={overId}
                  parentNumber={positionNumber}
                  potentialParentId={potentialParentId}
                  insertionTarget={insertionTarget}
                />
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

