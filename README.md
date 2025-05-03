# Hover Inspector Extension

A browser extension that mimics display dimensions between selected and hover elements. Useful for designers and QA engineers.

## Project Structure

This project is a browser extension built with:
- React 19
- TypeScript
- Tailwind CSS
- WXT (WebExtension Tools)

## Development

### Extension Development

To develop the extension, use the following commands:

```bash
# Start development server for all browsers
npm run dev

# Start development server for specific browsers
npm run dev:chrome
npm run dev:firefox
npm run dev:edge
```

### Standalone Development

The project includes two configurations for standalone development:

#### Webpack (Original)

```bash
# Start standalone development server with Webpack
npm run start
```

#### Vite (New)

```bash
# Start standalone development server with Vite
npm run start:vite

# Build standalone version with Vite
npm run build:vite
```

The Vite configuration provides the same functionality as the Webpack configuration but with faster build times and hot module replacement. Both standalone configurations use `tsconfig.standalone.json` for TypeScript compilation, which provides a less strict configuration suitable for development.

## TypeScript Configuration

The project uses different TypeScript configurations for different environments:

- `tsconfig.json` - Used for the main extension build with WXT
- `tsconfig.standalone.json` - Used for standalone development with both Webpack and Vite

The standalone configuration (`tsconfig.standalone.json`) is less strict and includes specific settings for the standalone development environment.

## Building

To build the extension for production, use the following commands:

```bash
# Build for all browsers
npm run build

# Build for specific browsers
npm run build:chrome
npm run build:firefox
npm run build:edge
npm run build:safari
```

## Packaging

To create a zip file for distribution, use the following commands:

```bash
# Create zip for all browsers
npm run zip

# Create zip for specific browsers
npm run zip:chrome
npm run zip:firefox
npm run zip:edge
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