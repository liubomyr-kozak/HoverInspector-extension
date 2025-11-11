# Integration Plan: New Note Taking Tools View

This document outlines the plan for adding new view type entrypoints and components for note taking tools in HoverInspector, located under `content/modules/PopupContainer/NoteTakingTools`. The goal is to enhance the note-taking experience while keeping the existing logic and data intact.

The new NoteTakingTools will utilize the existing `notesActionsSlice` for state management, ensuring consistency with the current notes implementation.

## notesActionsSlice Integration

The new NoteTakingTools will leverage the existing `notesActionsSlice` for all state management operations:

### Key Actions Used:
- `setNote`: Create or update notes
- `deleteNote`: Remove notes
- `loadNotes`: Initialize notes state
- `clearNotes`: Reset notes state

### Benefits:
- **Consistency**: Same state management as existing notes feature
- **Data Integrity**: Shared state ensures no data conflicts
- **Maintainability**: Single source of truth for notes operations
- **Performance**: Optimized state updates and selectors

### Implementation Strategy:
The NoteTakingTools components will:
1. Import and use existing `notesActionsSlice` actions
2. Subscribe to the same state selectors
3. Dispatch actions through the same Redux store
4. Maintain the same URL-based note mapping

## Steps

1. **Entrypoints**
   - Add new entrypoints in the extension popup and content modules to route to the new note-taking views.

2. **View Components**
   - Implement new UI components for notes under `NoteTakingTools`, supporting advanced editing and listing.
   - Components will use `useDispatch` and `useSelector` with `notesActionsSlice`

3. **Logic Preservation**
   - Retain the current notes logic (CRUD, storage, URL mapping) and ensure new views use the same services.
   - Use existing `notesActionsSlice` actions and reducers

4. **Documentation**
   - Update documentation to describe the new architecture, entrypoints, and how old and new views interact.

5. **Testing**
   - Validate that both old and new views work seamlessly and share the same notes data.
   - Test `notesActionsSlice` integration in new components

```typescript
// Example NoteTakingTools component structure
import { useDispatch, useSelector } from 'react-redux';
import { notesActionsSlice } from '../../../store/slices/notesSlice';

const NoteTakingTools = () => {
  const dispatch = useDispatch();
  const notes = useSelector(state => state.notes);
  const currentUrl = useSelector(state => state.tabs.currentUrl);
  
  const handleSaveNote = (content: string) => {
    dispatch(notesActionsSlice.actions.setNote({
      url: currentUrl,
      content,
      updatedAt: Date.now()
    }));
  };
  
  const handleDeleteNote = () => {
    dispatch(notesActionsSlice.actions.deleteNote({ url: currentUrl }));
  };
  
  // ...component implementation
};
```

## Architecture Overview

- **Old Logic**: NotesService, StorageService, and slice-based state management remain unchanged.
- **New Views**: Enhanced note-taking UI, accessible via new entrypoints, using the same backend logic.
- **State Management**: Both old and new views use the same `notesActionsSlice` for consistency.
- **Compatibility**: Both views read/write notes mapped by URL and stored in `chrome.storage.local`.

## Workflow

1. User opens the extension popup or sidebar.
2. User accesses the new note-taking tools view.
3. Notes are loaded and managed using the existing logic.
4. User can switch between old and new views without data loss.

## Goals

- Provide a modern, flexible note-taking UI.
- Ensure backward compatibility and data integrity.
- Allow users to benefit from both old and new workflows.