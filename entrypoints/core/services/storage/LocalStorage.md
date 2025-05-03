# LocalStorage Component Documentation

## Overview

The `LocalStorage` component is a standalone frontend service that provides a unified interface for persistent storage across different environments. It abstracts the browser's native `localStorage` API and Chrome extension's storage API into a single, consistent interface, allowing for seamless operation in both web and extension contexts.

## Architecture

### Design Principles

The `LocalStorage` component follows these key design principles:

1. **Environment Agnostic**: Works in both browser and extension contexts
2. **Simplified API**: Provides a clean, Promise-based interface
3. **Automatic Serialization**: Handles JSON conversion automatically
4. **Singleton Pattern**: Exported as a singleton for easy import and use

### Component Structure

The component consists of three main parts:

1. **Environment Detection**: Determines whether to use browser's native localStorage or Chrome's storage API
2. **Storage Adapters**: Provides consistent interfaces for different storage backends
3. **Public API**: Exposes methods for interacting with storage

### Storage Backends

The component supports two storage backends:

1. **Browser localStorage**: Used when `window.localStorage` is available
2. **Chrome Storage API**: Used in extension contexts where `window.localStorage` is not available

## API Reference

The `LocalStorage` component provides the following methods:

### `get(key: string): Promise<any>`

Retrieves data from storage by key.

- **Parameters**:
  - `key`: The storage key to retrieve
- **Returns**: A Promise that resolves to the stored data (parsed from JSON), or `null` if the key doesn't exist
- **Example**:
  ```typescript
  const data = await LocalStorage.get('my-key');
  ```

### `set(key: string, data: any): Promise<void>`

Stores data in storage.

- **Parameters**:
  - `key`: The storage key to use
  - `data`: The data to store (will be converted to JSON)
- **Returns**: A Promise that resolves when the data is stored
- **Example**:
  ```typescript
  await LocalStorage.set('my-key', { name: 'John', age: 30 });
  ```

### `removeAll(key: string): Promise<any>`

Clears data for a specific key by setting it to an empty object.

- **Parameters**:
  - `key`: The storage key to clear
- **Returns**: A Promise that resolves to the empty object
- **Example**:
  ```typescript
  await LocalStorage.removeAll('my-key');
  ```

### `update(key: string, newData: any): Promise<void>`

Updates data for a key, creating it if it doesn't exist.

- **Parameters**:
  - `key`: The storage key to update
  - `newData`: The new data to store (will be converted to JSON)
- **Returns**: A Promise that resolves when the data is updated
- **Example**:
  ```typescript
  await LocalStorage.update('my-key', { name: 'John', age: 31 });
  ```

## Data Structure and Storage Patterns

### Data Serialization

The `LocalStorage` component automatically handles JSON serialization and deserialization:

- When storing data, it converts objects to JSON strings using `JSON.stringify()`
- When retrieving data, it parses JSON strings back to objects using `JSON.parse()`

This allows for storing complex data structures without manual conversion.

### Key Naming Conventions

While the component doesn't enforce specific key naming conventions, it's recommended to:

- Use descriptive, namespaced keys to avoid collisions
- Use consistent prefixes for related data
- Avoid using special characters in keys

### Storage Limitations

Be aware of storage limitations:

- Browser localStorage typically has a limit of 5-10MB
- Chrome's storage.local has higher limits (usually around 5MB per item)
- Large objects should be split into smaller chunks if necessary

## Implementation Details

### Environment Detection

The component detects the environment using the following logic:

```typescript
if (self?.window?.localStorage) {
    localStorageModule = self.window.localStorage;
} else {
    localStorageModule = localStorageChrome;
}
```

### Chrome Storage Adapter

For Chrome extensions, the component provides an adapter that matches the localStorage API:

```typescript
const localStorageChrome = {
    getAllItems: async () => await browser.storage.local.get(),
    getItem: async (key) => (await browser.storage.local.get(key))[key],
    setItem: async (key, val) => await browser.storage.local.set({[key]: val}),
    removeItems: async (keys) => await browser.storage.local.remove(keys),
};
```

### Global Access

The component makes itself available globally for convenience:

```typescript
if (self) {
    if (!self.app) {
        self.app = {}
    }
    self.app.localStorageModule = localStorageModule
}
```

## Conclusion

The `LocalStorage` component provides a robust, environment-agnostic solution for persistent storage in frontend applications. By abstracting away the differences between browser localStorage and Chrome's storage API, it allows developers to use a consistent interface regardless of the execution context.