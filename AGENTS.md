# Solo TTRPG Notation Plugin - Developer Guide

This guide provides essential information for agentic coding agents working on this Obsidian plugin.

## Build & Development Commands

```bash
npm run dev          # Development build with watch mode (rebuilds on file changes)
npm run build        # Production build to main.js
npm run lint         # Lint TypeScript files
npm run lint:fix     # Auto-fix linting issues
```

**Note:** This project has no test suite. Manual testing in Obsidian is required.

## Project Structure

```
src/
├── main.ts                 # Plugin entry point
├── settings.ts             # Settings interface & tab
├── types/notation.ts       # All TypeScript type definitions
├── parser/                 # Parsers for different notation elements
├── indexer/                # Campaign file indexing & caching
├── views/                  # Obsidian ItemView implementations
├── templates/              # Template management & snippets
├── commands/               # Command registration
└── utils/                  # Helper functions
```

## Code Style Guidelines

### TypeScript Configuration
- Target: ES2022
- Strict mode enabled (noImplicitAny, strictNullChecks)
- Path alias: `@/*` → `src/*`

### Naming Conventions
- Classes: PascalCase (`NotationParser`, `DashboardView`)
- Methods/Functions: camelCase (`parseCampaignFile`, `render`)
- Constants: UPPER_SNAKE_CASE (`VIEW_TYPE_DASHBOARD`)
- Private members: TypeScript `private` keyword (no underscore prefix)
- File names: PascalCase for types, camelCase for implementations

### Import Style
```typescript
// External dependencies first
import { Plugin, App, Notice } from 'obsidian';

// Internal types
import { Campaign, Session, Location } from '../types/notation';

// Same directory imports use './'
import { CodeBlockParser } from './CodeBlockParser';

// Relative imports with '../' for parent directories
import { TemplateManager } from '../templates/TemplateManager';
```

### Formatting
- Use tabs for indentation (not spaces)
- Single blank line between methods/functions
- No trailing whitespace
- Max line length: not enforced, but aim for readability

### JSDoc Comments
Required for all public methods:
```typescript
/**
 * Parse a complete campaign file
 * @param content - The file content as string
 * @param filePath - Path to the campaign file
 * @returns Parsed Campaign object
 */
parseCampaignFile(content: string, filePath: string): Campaign {
```

### Type Definitions
All types defined in `src/types/notation.ts`. Use type guards for union types:
```typescript
export function isAction(element: NotationElement): element is Action {
    return element.type === 'action';
}
```

### Error Handling
```typescript
try {
    await this.templateManager.fillTemplate(template, variables);
} catch (error) {
    console.error('Error message:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    new Notice(`User-friendly message: ${errorMsg}`);
}
```

### Obsidian Plugin Patterns

#### Commands
```typescript
plugin.addCommand({
    id: 'command-id',
    name: 'Command Name',
    checkCallback: (checking: boolean) => {
        // Check if command should be available
        return true;
    },
    editorCallback: (editor: Editor, view: MarkdownView) => {
        // Editor context
    },
    callback: () => {
        // General context
    }
});
```

#### Views
All views extend `ItemView` and implement:
- `getViewType()`: Unique string identifier
- `getDisplayText()`: Display name in UI
- `getIcon()`: Obsidian icon name
- `onOpen()`: Called when view opens
- `onClose()`: Cleanup resources

#### Settings
Settings defined in `src/settings.ts` with:
- Interface definition
- `DEFAULT_SETTINGS` constant
- `SoloRPGSettingTab` class extending `PluginSettingTab`

### Parsing Architecture
- `NotationParser` orchestrates parsing
- Sub-parsers handle specific elements (CodeBlockParser, TagExtractor, ProgressParser)
- Parsers return typed objects from `src/types/notation.ts`
- Use regex for markdown notation patterns

### Indexing
- `NotationIndexer` manages campaign data
- Indexes entire vault or single files
- Caches parsed data with expiry (configurable)
- Listens to file change events

### UI Construction
Use Obsidian's DOM methods:
```typescript
const container = this.containerEl.children[1];
container.empty();
container.addClass('solo-rpg-container');

const header = container.createDiv({ cls: 'solo-rpg-header' });
header.createEl('h2', { text: 'Title' });
```

## Important Notes

- **No tests exist** - All changes require manual testing in Obsidian
- Build output is `main.js` (CommonJS format via esbuild)
- Obsidian API types imported from `obsidian` package
- Plugin entry point is `src/main.ts` → `export default class SoloRPGNotationPlugin extends Plugin`
- All notation parsing happens inside code blocks (```) in markdown files
- Italian locale support exists (Session/Sessione headers)

## Common Patterns

### Creating a new view:
1. Extend `ItemView` in `src/views/`
2. Define unique `VIEW_TYPE_*` constant
3. Register view in `main.ts` via `registerView()`
4. Add ribbon icon or command to open view

### Adding new notation elements:
1. Add type to `NotationElement` union in `types/notation.ts`
2. Create parser in `parser/` or extend existing parser
3. Add to indexing logic in `NotationParser.collectAllTags()`
4. Add type guard function

### Adding settings:
1. Update `SoloRPGSettings` interface
2. Update `DEFAULT_SETTINGS` constant
3. Add UI in `SoloRPGSettingTab.display()`
