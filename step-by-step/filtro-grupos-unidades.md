## Objetivo
Aplicar **filtro por Grupo(s) e Unidade(s)** (selecionados no header) para **Categorias** e **Conteúdos**, respeitando **apenas as permissões do usuário** (tabelas `user_groups` e `user_units`).

## Decisões técnicas
- **Seleção múltipla no header**: usuário pode selecionar **vários** grupos/unidades.
- **“Todas”**: representa *todas as opções permitidas para o usuário* (não é “todas do sistema”).
- **Estado global**: a seleção e as listas permitidas ficam em Redux (`contextSlice`) para reuso em todas as telas.
- **Backend valida permissões via token**: endpoints `GET /intranet/categories` e `GET /intranet/contents` passam a exigir `isAuth` para garantir `req.user` e respeitar permissões.

## Arquivos criados/alterados

### Frontend (Next.js)
- `intranet/redux-files/slices/contextSlice.ts`
  - **Função**: armazena `availableGroups/availableUnits` e seleção (`selectedGroupIds/selectedUnitIds`).
  - **Justificativa**: estado compartilhado entre Home, Gestão de Conteúdo e Gestão de Categorias.
  - **Impacto**: ao trocar seleção no header, as telas conseguem re-fetch com os filtros corretos.

- `intranet/redux-files/store.ts`
  - **Função**: adiciona o reducer `context`.
  - **Impacto**: disponibiliza o estado de contexto no app inteiro.

- `intranet/src/components/GroupUnitSelector.tsx`
  - **Função**: selector no header com **multi-select** e opção **“Todas”**.
  - **Justificativa**: requisito de selecionar mais de um grupo/unidade e aplicar filtro por arrays.
  - **Impacto**: persiste seleção em `localStorage` (chaves v2) e publica no Redux.

- `intranet/redux-files/slices/categoriesSlice.ts`
  - **Função**: `fetchCategories` agora aceita `{ status?, groupIds?, unitIds? }`.
  - **Impacto**: chamadas de categorias passam a ser parametrizadas por contexto.

- `intranet/redux-files/slices/contentsSlice.ts`
  - **Função**: `fetchAllContents` aceita `{ status?, categoryId?, groupIds?, unitIds? }` e `fetchContentsByCategory` aceita `{ categoryId, groupIds?, unitIds? }`.
  - **Impacto**: conteúdos passam a ser buscados com o contexto aplicado.

- Telas ajustadas para re-fetch ao mudar o contexto:
  - `intranet/src/views/public/HomePage.tsx`
  - `intranet/src/views/gestao-conteudo/Dashboard.tsx`
  - `intranet/src/views/gestao-conteudo/Categories.tsx`
  - `intranet/src/views/gestao-conteudo/CategoryForm.tsx`
  - `intranet/src/views/gestao-conteudo/CategoryEdit.tsx`
  - `intranet/src/views/gestao-conteudo/ContentForm.tsx`
  - `intranet/src/views/gestao-conteudo/ContentEdit.tsx`

### Backend (Express/Sequelize)
- `back/src/routes/Intranet/intranet.ts`
  - **Mudança**: `GET /intranet/categories` e `GET /intranet/contents` (e `GET /intranet/contents/:id`) agora exigem `isAuth`.
  - **Impacto**: garante que o backend sempre tenha `req.user` para filtrar por permissões.

- `back/src/controllers/Intranet/Categories/IntranetCategoryController.ts`
  - **Mudança**: parse de `groupIds` e `unitIds` (array ou string “1,2,3”) e repasse ao service.

- `back/src/controllers/Intranet/Contents/IntranetContentController.ts`
  - **Mudança**: parse de `groupIds` e `unitIds` e repasse ao service.

- `back/src/Services/Intranet/IntranetCategoryService.ts`
  - **Mudança**: aplica filtro adicional por seleção (header) usando `categoryGroups`/`categoryUnits`.
  - **Detalhe**: mantém a árvore navegável adicionando **ancestrais** das categorias que passaram no filtro.

- `back/src/Services/Intranet/IntranetContentService.ts`
  - **Mudança**: aplica filtro adicional por seleção (header) usando `contentGroups`/`contentUnits`.

## Riscos / Próximos passos
- **Performance**: se houver muitos logs/itens, pode ser necessário otimizar queries (hoje o filtro adicional é em memória após o `findAll`, o que costuma ser suficiente para volumes moderados).
- **UX**: ajustar labels dos chips no header (ex.: “2 grupos / 3 unidades”) conforme feedback.



