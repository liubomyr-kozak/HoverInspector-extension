// Test script to verify NoteForm Redux integration
// This can be run in browser console to test the functionality

console.log("Testing NoteForm Redux integration...");

// Test 1: Check if notes slice is properly registered
try {
  const store = window.__REDUX_DEVTOOLS_EXTENSION__ ? window.store : null;
  if (store) {
    const state = store.getState();
    console.log("✓ Redux store accessible");
    console.log("Notes state:", state.notes);
    
    if (state.notes) {
      console.log("✓ Notes slice is registered");
    } else {
      console.log("✗ Notes slice not found in store");
    }
  } else {
    console.log("Store not accessible for testing");
  }
} catch (error) {
  console.log("Error accessing store:", error);
}

// Test 2: Test openNoteForm action
console.log("\nTesting openNoteForm action...");
console.log("You can dispatch actions in the browser console:");
console.log("store.dispatch({ type: 'notes/openNoteForm', payload: { editingNote: null } })");
console.log("store.dispatch({ type: 'notes/closeNoteForm' })");

console.log("\nTest completed. Check NoteFormPopup rendering in LauncherManager.");