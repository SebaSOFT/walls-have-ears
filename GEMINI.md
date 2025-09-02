# AGENTS.md

This file provides instructions and guidelines for AI agents interacting with this project.

## Agent Instructions

- This project uses yarn stable. PnP or Zero-Installs are not used.
- This project uses ESLint for linting. Please use `yarn lint` to check for linting errors and `yarn lint:fix` to automatically fix them.

# wallsHaveEars Documentation

This document provides a comprehensive overview of the wallsHaveEars project for AI agents and developers.

## Project Overview

wallsHaveEars is a simple-as-possible module to muffle sounds that are behind a wall for a player in FoundryVTT. It is built and bundled using Parcel, offering a simple and efficient development experience.

## Project Structure

The project is organized as follows:

- `src/`: The main source code directory.
  - `index.ts`: The main entry point of the library, responsible for module initialization and settings.
  - `canvas/`: Contains classes related to canvas objects.
    - `WHEBaseObject.ts`: A base class for other canvas objects.
    - `WHESoundObject.ts`: Extends `WHEBaseObject`, intended for sound-related logic.
    - `WHEWallObject.ts`: Extends `WHEBaseObject`, intended for wall-related logic.
  - `hooks/`: (Currently empty) Reserved for FoundryVTT hook implementations.
  - `settings/`: Contains settings-related classes.
    - `WHESettings.ts`: A singleton class for managing module settings.
  - `utils/`: Contains utility functions and constants.
    - `WHEConstants.ts`: Defines constants used throughout the module.
    - `WHEUtils.ts`: Provides static utility methods for logging, internationalization, number clamping, and caching.
- `dist/`: The output directory for the built library.
- `languages/`: Contains localization files for different languages.
- `module.json`: FoundryVTT module metadata.
- `package.json`: Defines project metadata, dependencies, and scripts.
- `tsconfig.json`: Configures the TypeScript compiler options.
- `yarn.lock`: The Yarn lockfile.
- `.parcel-cache/`: Parcel's cache directory.
- `parcel-bundle-reports/`: Contains Parcel bundle analysis reports.
- `.github/workflows/`: Contains GitHub Actions workflow definitions.
- `jest.config.cjs`: Jest configuration for testing.

## Class Structure and Relationships

- **`WHEBaseObject`**: The foundational class for canvas-related objects. Currently serves as a placeholder for common properties or methods that might be shared by `WHESoundObject` and `WHEWallObject`.
- **`WHESoundObject`**: Extends `WHEBaseObject`. This class is designed to encapsulate logic specific to sound objects within the FoundryVTT canvas.
- **`WHEWallObject`**: Extends `WHEBaseObject`. This class is designed to encapsulate logic specific to wall objects within the FoundryVTT canvas.
- **`WHESettings`**: A singleton class responsible for registering and retrieving module settings. It interacts with FoundryVTT's settings API and depends on `WHEConstants` for setting keys.
- **`WHEConstants`**: An enum that defines various constant values used across the module, such as the module ID and setting keys.
- **`WHEUtils`**: A static utility class providing helper functions for common tasks like logging (conditional on debug settings), internationalization (translating messages), clamping numerical values, and a simple in-memory cache for `WHEBaseObject` instances. It depends on `WHEConstants` and `WHEBaseObject`.
- **`index.ts`**: The primary entry point of the module. It orchestrates the initialization process, including setting up debug logging via `WHEUtils` and initializing module settings through `WHESettings`.

## Getting Started

To use wallsHaveEars in your project, you need to have a FoundryVTT instance running.

1.  **Installation**: Download the module from the FoundryVTT package manager or by downloading the latest release from the GitHub repository.

## Development

This section outlines the development process for the wallsHaveEars library.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Yarn](https://yarnpkg.com/) (v4 or higher)

### Building the Library

To build the library for production, run the following command:

```bash
yarn build
```

This command bundles the code and generates the output in the `dist` directory. Test files (`src/**/*.test.ts`) are explicitly excluded from the build process.

### Development Mode

For active development, you can use the watch command:

```bash
yarn dev
```

This command watches for file changes and automatically rebuilds the library.

### Linting

This project uses ESLint to enforce code quality. To check for linting errors, run:

```bash
yarn lint
```

To automatically fix linting errors, run:

```bash
yarn lint:fix
```

### Code Formatting

This project uses [Prettier](https://prettier.io/) to format the code. It's recommended to set up your editor to format on save.

To check for formatting errors, run:

```bash
yarn format
```

To automatically fix formatting errors, run:

```bash
yarn format:fix
```

### Testing

This project uses Jest for unit testing. To run the tests, use:

```bash
yarn test
```

Tests are configured to run with TypeScript using `ts-jest` in a `node` environment.

## Dependencies

The project relies on the following dependencies:

### Development Dependencies

- `@parcel/packager-ts`: Parcel packager for TypeScript.
- `@parcel/reporter-bundle-analyzer`: Parcel reporter for bundle analysis.
- `@parcel/transformer-typescript-tsc`: Parcel transformer for TypeScript compilation.
- `@parcel/transformer-typescript-types`: Parcel transformer for generating TypeScript declaration files.
- `@types/jest`: Type definitions for Jest.
- `eslint`: Pluggable JavaScript linter.
- `eslint-config-prettier`: Turns off all ESLint rules that are unnecessary or might conflict with Prettier.
- `eslint-plugin-prettier`: Runs Prettier as an ESLint rule.
- `fvtt-types`: FoundryVTT type definitions.
- `globals`: ESLint global variables.
- `jest`: JavaScript testing framework.
- `parcel`: The web application bundler.
- `prettier`: An opinionated code formatter.
- `ts-jest`: Jest transformer for TypeScript.
- `typescript`: The TypeScript compiler.

### Package Manager

- `yarn`: Version 4.9.2 or higher.

This documentation should provide a clear understanding of the wallsHaveEars project. If you have any questions, please refer to the source code or contact the project maintainers.
