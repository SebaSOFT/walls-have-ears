# AGENTS.md

This file provides instructions and guidelines for AI agents interacting with this project.

## Agent Instructions

- This project uses yarn stable. PnP or Zero-Installs are not used.
- This project uses ESLint for linting. Please use `yarn lint` to check for linting errors and `yarn lint:fix` to automatically fix them.

# walls-have-ears Documentation

This document provides a comprehensive overview of the walls-have-ears project for AI agents and developers. It is intended to be the primary source of information for understanding the project's structure, conventions, and development process.

## Project Overview

walls-have-ears is a simple-as-possible module to muffle sounds that are behind a wall for a player in FoundryVTT. It is built and bundled using Parcel, offering a simple and efficient development experience.

## Project Structure

The project is organized as follows:

- `src/`: The main source code directory.
  - `index.ts`: The main entry point of the library, responsible for module initialization and settings.
  - `canvas/`: Contains classes related to canvas objects.
    - `WHEBaseObject.ts`: A base class for other canvas objects.
    - `WHESoundObject.ts`: Extends `WHEBaseObject`, intended for sound-related logic.
    - `WHEWallObject.ts`: Extends `WHEBaseObject`, intended for wall-related logic.
  - `hooks/`: (Currently empty) Reserved for FoundryVTT hook implementations.
  - `game/`: Contains game-related classes.
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

To use walls-have-ears in your project, you need to have a FoundryVTT instance running.

1.  **Installation**: Download the module from the FoundryVTT package manager or by downloading the latest release from the GitHub repository.

## Development

This section outlines the development process for the walls-have-ears library.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Yarn](https://yarnpkg.com/) (v4 or higher)

### Scripts

The following scripts are available in `package.json`:

- `build`: Builds the library for production.
- `build:analyze`: Builds the library and generates a bundle analysis report.
- `dev`: Watches for file changes and automatically rebuilds the library.
- `clean`: Removes the `dist` directory.
- `test`: Runs the tests using Jest.
- `lint`: Lints the code using ESLint.
- `lint:fix`: Lints the code and automatically fixes issues.
- `format`: Checks the code formatting using Prettier.
- `format:fix`: Formats the code using Prettier.

### Coding Style

This project uses [Prettier](https://prettier.io/) for code formatting and [ESLint](https://eslint.org/) for linting. It's recommended to set up your editor to format on save.

### Testing

This project uses [Jest](https://jestjs.io/) for unit testing. Tests are configured to run with TypeScript using `ts-jest` in a `node` environment.

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
- `typescript-eslint`: An ESLint plugin which provides lint rules for TypeScript codebases.

### Package Manager

- `yarn`: Version 4 or higher.

This documentation should provide a clear understanding of the walls-have-ears project. If you have any questions, please refer to the source code or contact the project maintainers.
