This project requires Node.js 20 or higher.

**Note for AI-Assisted Development**: This repository includes `AGENTS.md`, which contains specific instructions for AI coding agents working on this codebase. If you're using an AI assistant or automated agent, make sure it is [compatible with AGENTS.md](https://agents.md).

## Prerequisites

- Node.js 20 or higher
- npm or yarn

## Development Workflow

Once you have Node.js installed, you can contribute to this project:

1. **Fork and clone** this repository
2. **Install dependencies**: `npm install`
3. **Make your changes** to the source code
4. **Build locally**: `npm run build`
5. **Test in Obsidian** by copying the built files to your vault's plugins folder

## Testing

Before submitting a pull request, ensure:

- All tests pass: `npm run test`
- All linting checks pass: `npm run lint`
- Your code follows the project's style guidelines

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for development
npm run test:ui       # Interactive test UI
npm run test:coverage # Run tests with coverage report
```

### Running Linting

```bash
npm run lint       # Check for linting errors
npm run lint:fix   # Auto-fix linting issues
```

**All tests and linting must pass before your PR can be merged.**

## Project Guidelines

- Follow existing code style and patterns
- Add tests for new features or bug fixes
- Update documentation when changing functionality
- Keep commits focused and well-described
