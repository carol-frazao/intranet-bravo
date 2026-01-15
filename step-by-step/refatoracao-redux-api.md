# Refatoração: Centralização de Chamadas API no Redux

## Data: 2026-01-08

## Objetivo
Centralizar chamadas de API que são compartilhadas entre componentes no Redux, mantendo chamadas pontuais/locais diretamente nos componentes conforme boas práticas.

---

## Análise Completa

### ✅ MIGRAR PARA REDUX (Dados Compartilhados)

#### **Categories**
- ✅ `fetchCategories` - JÁ EXISTE (usar em todos os lugares)
- ❌ `createCategory` - CRIAR (usado em CategoryForm.tsx)
- ❌ `updateCategory` - CRIAR (usado em CategoryEdit.tsx, Categories.tsx)
- ❌ `inactivateCategory` - CRIAR (usado em CategoryActionModal.tsx, Categories.tsx)
- ✅ `deleteCategory` - JÁ EXISTE (migrar CategoryActionModal.tsx)
- ✅ `updateCategoryParent` - JÁ EXISTE
- ✅ `updateCategoryOrder` - JÁ EXISTE

**Componentes a migrar:**
- `CategoryForm.tsx` - usar `fetchCategories` + criar `createCategory`
- `CategoryEdit.tsx` - usar `fetchCategories` + criar `updateCategory`
- `ContentForm.tsx` - usar `fetchCategories` do Redux
- `ContentEdit.tsx` - usar `fetchCategories` do Redux
- `CategoryActionModal.tsx` - usar `deleteCategory` + criar `inactivateCategory`
- `Categories.tsx` - já usa Redux parcialmente, completar

#### **Contents**
- ✅ `fetchContentsByCategory` - JÁ EXISTE
- ✅ `fetchContentById` - JÁ EXISTE (usar em todos os lugares)
- ❌ `createContent` - CRIAR (usado em ContentForm.tsx)
- ❌ `updateContent` - CRIAR (usado em ContentEdit.tsx, Dashboard.tsx)
- ❌ `deleteContent` - CRIAR (usado em Dashboard.tsx)
- ❌ `inactivateContent` - CRIAR (usado em Dashboard.tsx)
- ❌ `fetchAllContents` - CRIAR (usado em Dashboard.tsx com `status: 'all'`)

**Componentes a migrar:**
- `ContentForm.tsx` - criar `createContent`
- `ContentEdit.tsx` - usar `fetchContentById` + criar `updateContent`
- `Dashboard.tsx` - criar `fetchAllContents`, `updateContent`, `deleteContent`, `inactivateContent`
- `HomePage.tsx` - já usa `fetchContentById` parcialmente

---

### ✅ MANTER LOCAL (Operações Pontuais)

#### **Files** - Manter direto
- `GET /intranet/contents/:id/files` - dados locais (HomePage, ContentDetail, ContentEdit)
- `POST /intranet/contents/:id/files` - upload pontual (FileUpload, ContentForm, ContentEdit)
- `DELETE /intranet/files/:id` - deleção pontual (FileUpload, ContentEdit)

**Justificativa:** Operações de arquivo são pontuais e não precisam de estado compartilhado.

#### **Logs** - Manter direto
- `GET /intranet/logs` - dados específicos por componente
- `GET /intranet/contents/:id/logs` - histórico local do conteúdo
- `GET /intranet/logs/users` - lista de usuários para filtro local

**Justificativa:** Logs são dados temporários e específicos por contexto.

#### **Outras Operações Pontuais**
- `GET /intranet/categories/:id/contents-count` - contagem local (CategoryActionModal)
- `GET /intranet/users/:id/groups-units` - dados específicos do usuário (GroupUnitSelector)

**Justificativa:** Dados pontuais que não precisam de cache global.

---

## Plano de Implementação

### Fase 1: Adicionar Thunks Faltantes nos Slices

1. **categoriesSlice.ts**
   - Adicionar `createCategory`
   - Adicionar `updateCategory`
   - Adicionar `inactivateCategory`

2. **contentsSlice.ts**
   - Adicionar `createContent`
   - Adicionar `updateContent`
   - Adicionar `deleteContent`
   - Adicionar `inactivateContent`
   - Adicionar `fetchAllContents`

### Fase 2: Migrar Componentes para Redux

1. **CategoryForm.tsx**
   - Substituir `api.get('intranet/categories')` por `dispatch(fetchCategories())`
   - Substituir `api.post('intranet/categories')` por `dispatch(createCategory())`

2. **CategoryEdit.tsx**
   - Substituir `api.get('intranet/categories')` por `dispatch(fetchCategories())`
   - Substituir `api.get('intranet/categories/:id')` por buscar do Redux
   - Substituir `api.put('intranet/categories/:id')` por `dispatch(updateCategory())`

3. **ContentForm.tsx**
   - Substituir `api.get('intranet/categories')` por `dispatch(fetchCategories())`
   - Substituir `api.post('intranet/contents')` por `dispatch(createContent())`

4. **ContentEdit.tsx**
   - Substituir `api.get('intranet/categories')` por `dispatch(fetchCategories())`
   - Substituir `api.get('intranet/contents/:id')` por `dispatch(fetchContentById())`
   - Substituir `api.put('intranet/contents/:id')` por `dispatch(updateContent())`

5. **CategoryActionModal.tsx**
   - Substituir `api.delete()` por `dispatch(deleteCategory())`
   - Substituir `api.patch('/inactivate')` por `dispatch(inactivateCategory())`

6. **Dashboard.tsx**
   - Substituir todas as chamadas por Redux thunks

7. **HomePage.tsx**
   - Substituir `api.get('intranet/contents/:id')` por `dispatch(fetchContentById())`

---

## Benefícios Esperados

1. **Consistência**: Todos os componentes usam a mesma fonte de dados
2. **Cache**: Redux mantém estado, evitando refetch desnecessário
3. **Manutenibilidade**: Lógica de API centralizada
4. **Testabilidade**: Thunks são mais fáceis de testar
5. **Performance**: Estado compartilhado reduz chamadas duplicadas

---

## Progresso da Implementação

### ✅ Fase 1: Slices Atualizados (Concluído)

**categoriesSlice.ts**
- ✅ `createCategory` - criado
- ✅ `updateCategory` - criado  
- ✅ `inactivateCategory` - criado
- ✅ `deleteCategory` - atualizado para aceitar payload

**contentsSlice.ts**
- ✅ `createContent` - criado
- ✅ `updateContent` - criado
- ✅ `deleteContent` - criado
- ✅ `inactivateContent` - criado
- ✅ `fetchAllContents` - criado

### ✅ Fase 2: Componentes Migrados

**Concluídos:**
- ✅ `CategoryForm.tsx` - usa `fetchCategories` + `createCategory`
- ✅ `CategoryEdit.tsx` - usa `fetchCategories` + `updateCategory`
- ✅ `ContentForm.tsx` - usa `fetchCategories` + `createContent`

- ✅ `ContentEdit.tsx` - usa `fetchCategories`, `fetchContentById`, `updateContent`
- ✅ `CategoryActionModal.tsx` - usa `deleteCategory`, `inactivateCategory`
- ✅ `Dashboard.tsx` - usa `fetchAllContents`, `updateContent`, `deleteContent`, `inactivateContent`
- ✅ `HomePage.tsx` - usa `fetchContentById` para carregar conteúdo único

### 🎉 Refatoração Completa!

Todos os componentes foram migrados com sucesso para usar Redux onde apropriado.

---

## Resumo das Mudanças

### Arquivos Modificados

**Slices (2):**
- `redux-files/slices/categoriesSlice.ts` — +4 thunks, +handlers
- `redux-files/slices/contentsSlice.ts` — +5 thunks, +handlers

**Componentes (7):**
1. `views/gestao-conteudo/CategoryForm.tsx` — migrado para Redux
2. `views/gestao-conteudo/CategoryEdit.tsx` — migrado para Redux
3. `views/gestao-conteudo/ContentForm.tsx` — migrado para Redux
4. `views/gestao-conteudo/ContentEdit.tsx` — migrado para Redux
5. `views/gestao-conteudo/Dashboard.tsx` — migrado para Redux
6. `components/CategoryActionModal.tsx` — migrado para Redux
7. `views/public/HomePage.tsx` — completado migração

### O que foi mantido local (conforme planejado)

- ✅ Upload de arquivos (`api.post` direto) — operação pontual
- ✅ Delete de arquivos (`api.delete` direto) — operação pontual
- ✅ Logs (`api.get` direto) — dados temporários/específicos
- ✅ Contadores (`contents-count`) — dados locais
- ✅ Grupos/Unidades do usuário — dados específicos

## Notas Técnicas

- Estado global agora gerenciado pelo Redux
- Cache automático de categorias e conteúdos
- Loading states centralizados
- Toasts de sucesso/erro nos thunks
- Upload de arquivos permanece local (não precisa de estado global)
- Logs permanecem locais (dados temporários/específicos)

## Como Testar

1. **Categorias:**
   - Criar nova categoria
   - Editar categoria existente
   - Inativar categoria
   - Deletar categoria

2. **Conteúdos:**
   - Criar novo conteúdo (com/sem arquivos)
   - Editar conteúdo existente
   - Alternar status (ativo/inativo)
   - Deletar conteúdo

3. **Navegação:**
   - HomePage deve carregar categorias e conteúdos
   - Dashboard deve listar todos os conteúdos
   - Refresh deve atualizar dados do Redux

