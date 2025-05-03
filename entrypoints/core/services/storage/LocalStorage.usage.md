# LocalStorage Component - Developer Usage Guide

This guide provides practical information on how to use the `LocalStorage` component in your frontend applications, including examples, best practices, and integration patterns.

## Getting Started

### Importing the Component

The `LocalStorage` component is exported as a singleton, so you can import it directly:

```typescript
import LocalStorage from "@entrypoints/core/services/storage/LocalStorage.ts";
```

### Basic Usage

#### Storing Data

To store data in localStorage:

```typescript
// Store a simple value
await LocalStorage.set('user-name', 'John Doe');

// Store a complex object
await LocalStorage.set('user-preferences', {
  theme: 'dark',
  fontSize: 16,
  notifications: {
    email: true,
    push: false
  }
});
```

#### Retrieving Data

To retrieve data from localStorage:

```typescript
// Get a value
const userName = await LocalStorage.get('user-name');
console.log(userName); // 'John Doe'

// Get a complex object
const preferences = await LocalStorage.get('user-preferences');
console.log(preferences.theme); // 'dark'
console.log(preferences.notifications.email); // true
```

#### Updating Data

To update existing data:

```typescript
// Update a specific property in a complex object
const preferences = await LocalStorage.get('user-preferences');
preferences.theme = 'light';
await LocalStorage.update('user-preferences', preferences);

// Or use the update method directly
await LocalStorage.update('user-preferences', {
  theme: 'light',
  fontSize: 16,
  notifications: {
    email: true,
    push: true
  }
});
```

#### Clearing Data

To clear data for a specific key:

```typescript
await LocalStorage.removeAll('user-preferences');
```

## Integration Patterns

### Creating a Domain-Specific Storage Service

For better organization, create domain-specific storage services that use the `LocalStorage` component:

```typescript
// UserStorageService.ts
import LocalStorage from "@entrypoints/core/services/storage/LocalStorage.ts";

const USER_PREFERENCES_KEY = 'user-preferences';
const USER_PROFILE_KEY = 'user-profile';

class UserStorageService {
  async getPreferences() {
    return await LocalStorage.get(USER_PREFERENCES_KEY) || {};
  }

  async setPreferences(preferences) {
    await LocalStorage.set(USER_PREFERENCES_KEY, preferences);
  }

  async getProfile() {
    return await LocalStorage.get(USER_PROFILE_KEY) || {};
  }

  async setProfile(profile) {
    await LocalStorage.set(USER_PROFILE_KEY, profile);
  }

  async clearUserData() {
    await LocalStorage.removeAll(USER_PREFERENCES_KEY);
    await LocalStorage.removeAll(USER_PROFILE_KEY);
  }
}

export default new UserStorageService();
```

### Integration with React Components

#### Using LocalStorage in React Hooks

Create a custom hook for localStorage access:

```typescript
// useLocalStorage.ts
import { useState, useEffect } from 'react';
import LocalStorage from "@entrypoints/core/services/storage/LocalStorage.ts";

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load value from localStorage on mount
  useEffect(() => {
    async function loadValue() {
      try {
        const storedValue = await LocalStorage.get(key);
        setValue(storedValue !== null ? storedValue : initialValue);
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        setValue(initialValue);
      } finally {
        setLoading(false);
      }
    }
    
    loadValue();
  }, [key, initialValue]);

  // Update localStorage when value changes
  const updateValue = async (newValue) => {
    try {
      setValue(newValue);
      await LocalStorage.set(key, newValue);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [value, updateValue, loading];
}

export default useLocalStorage;
```

Usage in a component:

```tsx
// UserSettingsComponent.tsx
import React from 'react';
import useLocalStorage from './useLocalStorage';

const UserSettingsComponent = () => {
  const [settings, setSettings, loading] = useLocalStorage('user-settings', {
    theme: 'light',
    fontSize: 16
  });

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div>
      <h2>User Settings</h2>
      <div>
        <label>
          Theme:
          <select 
            value={settings.theme} 
            onChange={(e) => setSettings({...settings, theme: e.target.value})}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Font Size:
          <input 
            type="number" 
            value={settings.fontSize} 
            onChange={(e) => setSettings({...settings, fontSize: parseInt(e.target.value)})}
          />
        </label>
      </div>
    </div>
  );
};

export default UserSettingsComponent;
```

## Best Practices

### Key Naming

Use a consistent naming convention for keys to avoid collisions:

```typescript
// Good - Namespaced keys
const USER_PREFERENCES_KEY = 'user:preferences';
const USER_PROFILE_KEY = 'user:profile';

// Good - Module-based prefixes
const SETTINGS_THEME_KEY = 'settings.theme';
const SETTINGS_FONT_SIZE_KEY = 'settings.fontSize';

// Avoid - Generic names that might collide
const BAD_KEY = 'data'; // Too generic
const ANOTHER_BAD_KEY = 'settings'; // Too broad
```

### Error Handling

Always handle potential errors when working with localStorage:

```typescript
async function saveUserPreferences(preferences) {
  try {
    await LocalStorage.set('user-preferences', preferences);
    return true;
  } catch (error) {
    console.error('Failed to save user preferences:', error);
    // Show user-friendly error message
    return false;
  }
}
```

### Data Validation

Validate data before storing and after retrieving:

```typescript
async function getUserTheme() {
  try {
    const preferences = await LocalStorage.get('user-preferences');
    
    // Validate the data
    if (!preferences || typeof preferences !== 'object') {
      return 'light'; // Default value
    }
    
    // Validate specific property
    if (!preferences.theme || typeof preferences.theme !== 'string') {
      return 'light'; // Default value
    }
    
    // Validate allowed values
    const allowedThemes = ['light', 'dark', 'system'];
    return allowedThemes.includes(preferences.theme) ? preferences.theme : 'light';
  } catch (error) {
    console.error('Error retrieving user theme:', error);
    return 'light'; // Default value
  }
}
```

### Versioning

Include version information in your stored data to handle schema changes:

```typescript
const initialData = {
  version: '1.0',
  settings: {
    theme: 'light',
    fontSize: 16
  }
};

async function migrateDataIfNeeded() {
  const data = await LocalStorage.get('app-data');
  
  if (!data || !data.version) {
    // No data or no version - initialize with current version
    await LocalStorage.set('app-data', initialData);
    return initialData;
  }
  
  if (data.version === '1.0') {
    // Current version - no migration needed
    return data;
  }
  
  if (data.version === '0.9') {
    // Migrate from 0.9 to 1.0
    const migratedData = {
      version: '1.0',
      settings: {
        ...data.settings,
        // Add new fields or transform existing ones
        notifications: {
          enabled: true
        }
      }
    };
    await LocalStorage.set('app-data', migratedData);
    return migratedData;
  }
  
  // Unknown version - reset to current version
  await LocalStorage.set('app-data', initialData);
  return initialData;
}
```

### Performance Considerations

#### Minimize Storage Operations

Batch related changes together to minimize storage operations:

```typescript
// Avoid - Multiple separate operations
await LocalStorage.set('user-name', userData.name);
await LocalStorage.set('user-email', userData.email);
await LocalStorage.set('user-preferences', userData.preferences);

// Better - Single operation with all related data
await LocalStorage.set('user-data', {
  name: userData.name,
  email: userData.email,
  preferences: userData.preferences
});
```

#### Debounce Frequent Updates

For frequently changing values, use debouncing to reduce storage operations:

```typescript
import { debounce } from 'lodash';

// Create a debounced save function
const debouncedSave = debounce(async (key, value) => {
  await LocalStorage.set(key, value);
}, 500); // Wait 500ms after last call before saving

// Use the debounced function
function handleInputChange(e) {
  const newValue = e.target.value;
  setDraftValue(newValue); // Update UI immediately
  debouncedSave('draft-content', newValue); // Save to storage after debounce
}
```

## Common Patterns

### Caching API Responses

Use localStorage to cache API responses:

```typescript
async function fetchUserData(userId) {
  const cacheKey = `api-cache:user:${userId}`;
  
  // Try to get from cache first
  const cachedData = await LocalStorage.get(cacheKey);
  if (cachedData && cachedData.timestamp > Date.now() - 3600000) {
    // Cache is less than 1 hour old
    return cachedData.data;
  }
  
  // Fetch fresh data
  try {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();
    
    // Cache the response
    await LocalStorage.set(cacheKey, {
      timestamp: Date.now(),
      data
    });
    
    return data;
  } catch (error) {
    // If API call fails but we have cached data, return it regardless of age
    if (cachedData) {
      return cachedData.data;
    }
    throw error;
  }
}
```

### Form State Persistence

Save form state to prevent data loss:

```typescript
function RegistrationForm() {
  const formKey = 'registration-form-draft';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  
  // Load saved draft on mount
  useEffect(() => {
    async function loadDraft() {
      const savedDraft = await LocalStorage.get(formKey);
      if (savedDraft) {
        setFormData(savedDraft);
      }
    }
    
    loadDraft();
    
    // Clear draft when component unmounts
    return () => {
      LocalStorage.removeAll(formKey);
    };
  }, []);
  
  // Save draft on change
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      LocalStorage.set(formKey, formData);
    }, 500);
    
    return () => clearTimeout(saveTimeout);
  }, [formData]);
  
  // Form handlers...
}
```

### User Preferences

Store and apply user preferences:

```typescript
// Load and apply theme preference
async function applyUserTheme() {
  const preferences = await LocalStorage.get('user-preferences');
  const theme = preferences?.theme || 'light';
  
  document.documentElement.setAttribute('data-theme', theme);
  
  // Apply additional theme-specific styles
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}

// Call on application start
applyUserTheme();
```

## Conclusion

The `LocalStorage` component provides a robust foundation for persistent storage in frontend applications. By following the patterns and best practices in this guide, you can effectively use localStorage for a variety of use cases while maintaining clean, maintainable code.

Remember that localStorage has limitations, particularly in terms of storage capacity and synchronous nature. For more complex storage needs, consider using IndexedDB or server-side storage solutions.