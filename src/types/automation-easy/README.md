# Automation Easy Type Definitions

This directory contains TypeScript type definitions for the Automation Easy extension. These type definitions provide type safety and improved developer experience when working with the Automation Easy functionality.

## Directory Structure

- `index.d.ts` - Entry point for all type definitions
- `types.d.ts` - Core type definitions (selectors, steps, scenarios)
- `dto.d.ts` - Data Transfer Object definitions
- `actions.d.ts` - Type definitions for action functions
- `executor.d.ts` - Type definitions for scenario execution functions
- `integration.d.ts` - Type definitions for integration services

## Usage

### Importing Types

You can import the types in your TypeScript files:

```typescript
import { AutomationEasy } from '../../types/automation-easy';

// Use the types
const scenario: AutomationEasy.Scenario = {
  name: 'My Scenario',
  steps: []
};
```

### Using Types with JavaScript

You can also use these types with JavaScript files using JSDoc comments:

```javascript
/**
 * @param {AutomationEasy.Scenario} scenario - The scenario to execute
 * @param {number} tabId - The ID of the tab to execute in
 * @returns {Promise<void>}
 */
async function executeMyScenario(scenario, tabId) {
  // Implementation
}
```

## Type Definitions

### Core Types

#### Selectors

```typescript
// Simple CSS selector
type CssSelector = string;

// Complex selector for targeting elements by text or placeholder
interface ComplexSelector {
  type: 'text' | 'placeholder';
  matching: 'full' | 'partial' | 'contains';
  content: string;
}

// Union type for all selector types
type Selector = CssSelector | ComplexSelector;
```

#### Steps

```typescript
// Base step interface
interface BaseStep {
  type: StepType;
  id?: string;
  subtype?: string;
  data: any;
}

// Example of a specific step type
interface ClickStep extends BaseStep {
  type: 'click';
  data: {
    selector: Selector;
    loop_index?: number;
  };
}
```

#### Scenarios

```typescript
interface Scenario {
  id?: string;
  name: string;
  virtual?: boolean;
  steps?: Step[];
  data?: {
    steps: Step[];
    tracking?: {
      save_page_url?: string;
      save_scenario_name?: string;
      save_variables?: string[];
    };
  };
}
```

### Action Parameters

```typescript
// Parameters for click action
interface ClickElementParams extends ActionParams {
  selector: Selector;
  loop_index?: number;
  waitTime?: number;
  scroll_to?: boolean;
}

// Parameters for input action
interface SetInputParams extends ActionParams {
  selector: Selector;
  value: string;
  waitTime?: number;
  target?: string;
}
```

### Data Transfer Objects

```typescript
// Message sent to execute a scenario
interface ExecuteScenarioMessage extends Message {
  type: 'execute_scenario';
  scenario: Scenario;
  tabId: number;
}

// Schedule entry
interface ScheduleEntry {
  id: string;
  scenarioId: string;
  name: string;
  schedule: {
    type: 'one-time' | 'recurring';
    date?: string;
    time?: string;
    days?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
    frequency?: 'daily' | 'weekly' | 'monthly';
  };
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}
```

## Integration with Existing Code

These type definitions are designed to work with the existing JavaScript code in the Automation Easy extension. They provide type information without requiring changes to the underlying implementation.

## Implementation Note

The extension currently has two implementations of automation functionality:

1. **Automation Easy** (in `playground/Automation Easy`): The original JavaScript-based implementation that provides user-facing automation functions. This implementation uses a traditional Chrome extension architecture with background scripts and content scripts.

2. **AutomationScenarios** (in `entrypoints/content/modules/PopupContainer/AutomationScenarios`): A newer TypeScript/React-based implementation that provides a more modern UI and additional features like folder organization, scheduling, and trigger-based execution.

These shared type definitions help ensure consistency between the two implementations and facilitate potential future consolidation. For more information about each implementation, see:

- [Automation Easy Functions Documentation.md](../../../Automation%20Easy%20Functions%20Documentation.md) - Documents the user-facing automation functions
- [AutomationScenarios_Documentation.md](../../../AutomationScenarios_Documentation.md) - Documents the implementation details of the AutomationScenarios module

## Contributing

When adding new functionality to the Automation Easy extension, please update the type definitions accordingly to maintain type safety and documentation.