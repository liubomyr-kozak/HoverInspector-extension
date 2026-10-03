# Hover Inspector Extension

A browser extension that mimics display dimensions between selected and hover elements. Useful for designers and QA engineers.

## Project Structure

This project is a browser extension built with:
- React 19
- TypeScript
- Tailwind CSS
- WXT (WebExtension Tools)

## Development

The project uses **Yarn 1** (`packageManager` in `package.json`); `yarn.lock` is the only lockfile.

```bash
yarn install   # also runs `wxt prepare`
```

### Extension Development

```bash
# Start development server for all browsers
yarn dev

# Start development server for specific browsers
yarn dev:chrome
yarn dev:firefox
yarn dev:edge
```

### Standalone Development

```bash
# Start the standalone page with Vite (http://localhost:4400)
yarn start
```

It uses `vite.standalone.config.ts` and `tsconfig.standalone.json`, a less strict TypeScript configuration suitable for development.

### Tests

```bash
yarn test         # run once
yarn test:watch   # watch mode
```

## TypeScript Configuration

The project uses different TypeScript configurations for different environments:

- `tsconfig.json` - Used for the main extension build with WXT
- `tsconfig.standalone.json` - Used for standalone development with both Webpack and Vite

The standalone configuration (`tsconfig.standalone.json`) is less strict and includes specific settings for the standalone development environment.

## Building

To build the extension for production, use the following commands:

```bash
# Build for all browsers
yarn build

# Build for specific browsers
yarn build:chrome
yarn build:firefox
yarn build:edge
yarn build:safari
```

## Packaging

To create a zip file for distribution, use the following commands:

```bash
# Create zip for all browsers
yarn zip

# Create zip for specific browsers
yarn zip:chrome
yarn zip:firefox
yarn zip:edge
```

## Design Guidelines

The project follows a set of design guidelines and best practices to ensure consistency across the codebase and provide a better user experience. These guidelines cover:

- UI/UX Principles
- Component Design Standards
- Styling Guidelines
- Code Style and Patterns
- Accessibility Considerations
- Performance Optimization

For detailed information, please refer to the [Design Guidelines](./DESIGN_GUIDELINES.md) document.

## Notes

- The manifest.json file can be manually modified and won't be changed in the next build.
- The standalone development server is useful for testing the extension's functionality without having to load it into a browser.
- The Vite configuration is based on the Webpack configuration and provides the same functionality.