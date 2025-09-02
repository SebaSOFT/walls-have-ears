# wallsHaveEars

[![GitHub license](https://img.shields.io/github/license/SebaSOFT/walls-have-ears)](https://github.com/SebaSOFT/walls-have-ears/blob/main/LICENSE)
[![GitHub release](https://img.shields.io/github/downloads-pre/SebaSOFT/walls-have-ears/latest/module.zip?label=downloads)](https://github.com/SebaSOFT/walls-have-ears/releases/)
[![Forge Installs](https://img.shields.io/badge/dynamic/json?color=green&label=Forge%20installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fwalls-have-ears)](https://forge-vtt.com/bazaar#package=walls-have-ears)
[![Foundry HUB Endorsements](https://img.shields.io/badge/dynamic/json?label=FoundryHUB%20Endorsements&query=%24.endorsements&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Fwalls-have-ears)](https://www.foundryvtt-hub.com/package/walls-have-ears/)
[![Minimum Foundry VTT version](https://img.shields.io/badge/dynamic/json?label=Foundry%20VTT%20version&query=%24.minimumCoreVersion&suffix=%20or%20later&url=https%3A%2F%2Fgithub.com%2FSebaSOFT%2Fwalls-have-ears%2Freleases%2Flatest%2Fdownload%2Fmodule.json)](https://github.com/SebaSOFT/walls-have-ears/releases/latest/download/module.json)

**Version:** 3.13.0

"A simple-as-possible module to muffle sounds that are behind a wall for a player or token."

wallsHaveEars is a simple-as-possible module to muffle sounds that are behind a wall for a player in FoundryVTT. It is built and bundled using Parcel, offering a simple and efficient development experience.

## Installation

In the setup screen, use the URL `https://github.com/SebaSOFT/walls-have-ears/releases/latest/download/module.json` to install the module.

## Features

- Detects sound that are in range but through a wall, and muffles them
- Ignores open doors so sound should not be muffled if listened through an open door

## How it works
- Enable Token Vision on the scene (this is a **MUST**)
- **DO NOT** Disable "Constrained by Walls" on the Sound
- **EITHER** Set sound occlussion on Walls to limited or none as needed
- It works with sound easing (volume changing)
- It will detect walls and muffle the sound (see table below)
- Windows are less likely to muffle (see table below)
- Terrain walls don't contribute to muffling (see table below)
- Ethereal Walls don't contribute to muffling (see table below)

See:

![Test cases for Muffling logic](https://raw.githubusercontent.com/SebaSOFT/walls-have-ears/develop/mufflingLogic.jpg)

### Nightclub demo
<a href="http://www.youtube.com/watch?feature=player_embedded&v=EXkrlQVEeAo
" target="_blank"><img src="http://img.youtube.com/vi/EXkrlQVEeAo/0.jpg"
alt="Nightclub demo" width="240" height="180" border="10" /></a>

### Test suite demo
<a href="http://www.youtube.com/watch?feature=player_embedded&v=hlsi4gw1YIA
" target="_blank"><img src="http://img.youtube.com/vi/hlsi4gw1YIA/0.jpg"
alt="Test suite demo" width="240" height="180" border="10" /></a>

## Development

This section outlines the development process for the wallsHaveEars library.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v20 or higher)
-   [Yarn](https://yarnpkg.com/) (v4 or higher)

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

## Project Structure

The project is organized as follows:

-   `src/`: The main source code directory.
    -   `index.ts`: The main entry point of the library, responsible for module initialization and settings.
    -   `canvas/`: Contains classes related to canvas objects.
        -   `WHEBaseObject.ts`: A base class for other canvas objects.
        -   `WHESoundObject.ts`: Extends `WHEBaseObject`, intended for sound-related logic.
        -   `WHEWallObject.ts`: Extends `WHEBaseObject`, intended for wall-related logic.
    -   `hooks/`: (Currently empty) Reserved for FoundryVTT hook implementations.
    -   `settings/`: Contains settings-related classes.
        -   `WHESettings.ts`: A singleton class for managing module settings.
    -   `utils/`: Contains utility functions and constants.
        -   `WHEConstants.ts`: Defines constants used throughout the module.
        -   `WHEUtils.ts`: Provides static utility methods for logging, internationalization, number clamping, and caching.
-   `dist/`: The output directory for the built library.
-   `languages/`: Contains localization files for different languages.
-   `module.json`: FoundryVTT module metadata.
-   `package.json`: Defines project metadata, dependencies, and scripts.
-   `tsconfig.json`: Configures the TypeScript compiler options.
-   `yarn.lock`: The Yarn lockfile.
-   `.parcel-cache/`: Parcel's cache directory.
-   `parcel-bundle-reports/`: Contains Parcel bundle analysis reports.
-   `.github/workflows/`: Contains GitHub Actions workflow definitions.
-   `jest.config.cjs`: Jest configuration for testing.

## Class Structure and Relationships

-   **`WHEBaseObject`**: The foundational class for canvas-related objects. Currently serves as a placeholder for common properties or methods that might be shared by `WHESoundObject` and `WHEWallObject`.
-   **`WHESoundObject`**: Extends `WHEBaseObject`. This class is designed to encapsulate logic specific to sound objects within the FoundryVTT canvas.
-   **`WHEWallObject`**: Extends `WHEBaseObject`. This class is designed to encapsulate logic specific to wall objects within the FoundryVTT canvas.
-   **`WHESettings`**: A singleton class responsible for registering and retrieving module settings. It interacts with FoundryVTT's settings API and depends on `WHEConstants` for setting keys.
-   **`WHEConstants`**: An enum that defines various constant values used across the module, such as the module ID and setting keys.
-   **`WHEUtils`**: A static utility class providing helper functions for common tasks like logging (conditional on debug settings), internationalization (translating messages), clamping numerical values, and a simple in-memory cache for `WHEBaseObject` instances. It depends on `WHEConstants` and `WHEBaseObject`.
-   **`index.ts`**: The primary entry point of the module. It orchestrates the initialization process, including setting up debug logging via `WHEUtils` and initializing module settings through `WHESettings`.

## Dependencies

The project relies on the following dependencies:

### Development Dependencies

-   `@parcel/packager-ts`: Parcel packager for TypeScript.
-   `@parcel/reporter-bundle-analyzer`: Parcel reporter for bundle analysis.
-   `@parcel/transformer-typescript-tsc`: Parcel transformer for TypeScript compilation.
-   `@parcel/transformer-typescript-types`: Parcel transformer for generating TypeScript declaration files.
-   `@types/jest`: Type definitions for Jest.
-   `eslint`: Pluggable JavaScript linter.
-   `eslint-config-prettier`: Turns off all ESLint rules that are unnecessary or might conflict with Prettier.
-   `eslint-plugin-prettier`: Runs Prettier as an ESLint rule.
-   `fvtt-types`: FoundryVTT type definitions.
-   `globals`: ESLint global variables.
-   `jest`: JavaScript testing framework.
-   `parcel`: The web application bundler.
-   `prettier`: An opinionated code formatter.
-   `ts-jest`: Jest transformer for TypeScript.
-   `typescript`: The TypeScript compiler.

### Package Manager

-   `yarn`: Version 4.9.2 or higher.

## TO DO

- Estimate L shaped rooms and track sound bouncing, so it doesn't get muffled (possible echo/delay effect)

## Known Issues

- If the first action you do when accessing the site is selecting a token, it won't be muffled, just select another token or move it one time.

## Contributing

We're always happy for community contributions.

(Guidelines for contributing to the project will go here.)

## License

This module has been released under the MIT licence, meaning you can do pretty much anything you like with it, so long as the original copyright remains in place.

You **can** use it in commercial products.

If the licence terminology in the licence.txt is confusing, check out this: https://www.tldrlegal.com/l/mit

## Author

SebaSOFT

**Project URL:** https://github.com/SebaSOFT/walls-have-ears

**Foundry VTT:** https://foundryvtt.com/packages/walls-have-ears

**Bug Reports:** https://github.com/SebaSOFT/walls-have-ears/issues

**Discord:** https://discord.gg/Sebasoft (SebaSOFT#9414)

**Patreon:** https://www.patreon.com/SebaSOFT


## Credits

- Idea and original implementation by @KayelGee, from the FoundryVTT Discord
- Spanish translation by @lozalojo
- German translation by @Fallayn
- French translation by @JDR-Ninja
- Japanese translation by @Brother Sharp
- Portuguese translation by @castanhocorreia

## Buy me a coffee

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/W7W22C3S2)

## Release Notes

See [CHANGELOG](CHANGELOG.md)
