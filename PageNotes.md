# Plan: Integrating New View Type for Note Taking Tools

This update introduces new entrypoints and view components for note-taking tools in the HoverInspector extension, located under `content/modules/PopupContainer/NoteTakingTools`. The goal is to provide an enhanced note-taking experience while preserving the existing notes logic and data.

## Steps
1. **Entrypoints**: Add new entrypoints in the extension popup and content modules to route to the new note-taking views.
2. **View Components**: Implement new UI components for notes under `NoteTakingTools`, supporting advanced editing and listing.
3. **Logic Preservation**: Retain the current notes logic (CRUD, storage, URL mapping) and ensure new views use the same services.
4. **Documentation**: Update this file to describe the new architecture, entrypoints, and how old and new views interact.
5. **Testing**: Validate that both old and new views work seamlessly and share the same notes data.

## Architecture Overview
- **Old Logic**: NotesService, StorageService, and slice-based state management remain unchanged.
- **New Views**: Enhanced note-taking UI, accessible via new entrypoints, using the same backend logic.
- **Compatibility**: Both views read/write notes mapped by URL and stored in `chrome.storage.local`.

This approach ensures a smooth transition and backward compatibility for users.

# PageNotes Structure and Methods

PageNotes enables users to attach notes to specific web pages in HoverInspector. Notes are mapped by page URL and persisted in browser storage.

## Data Structure
- Each note is an object:
  - `url`: string (unique page URL, used as key)
  - `content`: string (note text)
  - `createdAt`: number (timestamp)
  - `updatedAt`: number (timestamp)

Notes are stored in a map-like object: `{ [url]: PageNote }`.

## Storage Mechanism
- Uses `chrome.storage.local` for persistence.
- Notes are retained across sessions and isolated by URL.

## Main Services
- **NotesService**:
  - `getNote(url)`: Retrieve note for URL.
  - `saveNote(url, content)`: Create/update note.
  - `deleteNote(url)`: Remove note.
  - `listNotes()`: List all notes.
- **TabService**: Gets current tab and URL.
- **StorageService**: Wraps browser storage API.

## UI Component
- Displays note for active page.
- Allows editing, saving, and deleting.
- Listens for tab changes to update displayed note.

## State Management (Slice Method)
- Uses a slice (Redux-like) for modular state updates.
- Reducers handle CRUD operations for notes.

## Workflow
1. User opens a page.
2. Extension fetches note for page URL.
3. User edits/saves note; changes are persisted.
4. On revisit, note is loaded automatically.

## Mandatory Details
- Notes are strictly mapped by URL.
- Storage is local and private unless sync is enabled.
- All CRUD operations are exposed via NotesService.
- UI is reactive to tab changes and note updates.

# PageNotes Feature Documentation

## Overview

PageNotes allows users to attach, view, and manage notes specific to web pages within the HoverInspector extension. This feature helps users keep context-specific information, reminders, or annotations directly linked to the inspected page.

## Main Logic

- **Storage**: Notes are stored per-page, using the page URL as a key for uniqueness.
- **Retrieval**: On visiting a page, the extension fetches and displays any notes associated with that URL.
- **Editing**: Users can add, edit, or delete notes. Changes are saved immediately or on demand.
- **Sync**: Notes may be synced across devices if supported by the extension.
- **UI Integration**: The notes interface is accessible via the extension popup or sidebar.

## Usage

- **Add a Note**: Open HoverInspector, go to PageNotes, enter your note, and save.
- **View Notes**: Revisit a page and open the extension to see saved notes.
- **Edit/Delete**: Modify or remove notes as needed.

## Main Components

- **Notes Manager**: This module is responsible for creating, reading, updating, and deleting notes. In HoverInspector, it interacts with the browser storage API to associate each note with the current page's URL. It exposes functions to fetch notes for the active tab, save new notes, update existing notes, and remove notes. The logic ensures that notes are only shown for the exact page they were created on.
- **UI Component**: The PageNotes UI is typically a section in the extension's popup or sidebar. It displays the current note for the active page, provides a text area for editing, and includes buttons for saving or deleting notes. The UI listens for changes in the active tab and updates the displayed note accordingly.
- **Storage Layer**: HoverInspector uses the browser's `chrome.storage.local` API to persist notes. Each note is stored with the page URL as the key, allowing fast lookup and isolation between different pages. The storage layer ensures notes are retained across browser sessions and can be retrieved instantly when the user revisits a page.

## Services and Methods

- **NotesService**: Provides the main API for interacting with notes. Methods include:
   - `getNote(url)`: Retrieves the note for a given page URL.
   - `saveNote(url, content)`: Saves or updates the note for a page URL.
   - `deleteNote(url)`: Removes the note for a page URL.
   - `listNotes()`: Returns all notes stored by the extension.

- **TabService**: Used to get the current active tab and its URL, so notes can be mapped correctly.
- **StorageService**: Wraps browser storage APIs (`chrome.storage.local`) for reading and writing notes data.
- **UI Methods**:
   - `renderNote(note)`: Displays the note in the UI.
   - `onSave()`: Handles the save button click, calls `saveNote`.
   - `onDelete()`: Handles the delete button click, calls `deleteNote`.
   - `onTabChange()`: Updates the displayed note when the user switches tabs.

## Page Note Structure

Each page note is represented as an object with the following structure:

```typescript
interface PageNote {
  url: string;        // The unique URL of the page
  content: string;    // The note text
  createdAt: number;  // Timestamp when the note was created
  updatedAt: number;  // Timestamp when the note was last updated
}
```

Notes are stored in a map-like object, where each key is a page URL and the value is a PageNote.

## Slice Method

The slice method is used in the logic to extract a subset of notes or to manage state updates efficiently. For example, in a Redux-like state management setup, a slice might represent the notes state and provide reducers for CRUD operations:

```typescript
// Example notes slice (pseudo-code)
const notesSlice = createSlice({
  name: 'notes',
  initialState: {},
  reducers: {
    setNote(state, action) {
      const { url, content } = action.payload;
      state[url] = {
        url,
        content,
        updatedAt: Date.now(),
        createdAt: state[url]?.createdAt || Date.now()
      };
    },
    deleteNote(state, action) {
      delete state[action.payload.url];
    }
  }
});
```

This approach helps keep the notes logic modular and maintainable.

## Example Workflow

1. User opens a web page.
2. User clicks the HoverInspector extension icon.
3. In PageNotes, user writes and saves a note.
4. The note is stored using the page URL as a key.
5. On future visits, the note is loaded and displayed.

## Benefits

- **Contextual Memory**: Track important info per page.
- **Productivity**: Recall actions or reasons for visiting a page.
- **Organization**: Manage research, tasks, or reminders efficiently.

## Limitations

- Notes are tied to URLs; changes in URL structure may affect retrieval.
- Privacy depends on storage implementation (local vs. cloud).