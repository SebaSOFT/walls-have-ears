# WALLS HAVE EARS

[![GitHub license](https://img.shields.io/github/license/SebaSOFT/walls-have-ears)](https://github.com/SebaSOFT/walls-have-ears/blob/main/LICENSE)
[![GitHub release](https://img.shields.io/github/downloads-pre/SebaSOFT/walls-have-ears/latest/module.zip?label=downloads)](https://github.com/SebaSOFT/walls-have-ears/releases/)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/SebaSOFT/walls-have-ears/main.yml?branch=main&label=Test%20Build%20Release)
[![Forge Installs](https://img.shields.io/badge/dynamic/json?color=green&label=Forge%20installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fwalls-have-ears)](https://forge-vtt.com/bazaar#package=walls-have-ears)
[![Foundry HUB Endorsements](https://img.shields.io/badge/dynamic/json?label=FoundryHUB%20Endorsements&query=%24.endorsements&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Fwalls-have-ears)](https://www.foundryvtt-hub.com/package/walls-have-ears/)
[![Minimum Foundry VTT version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2FSebaSOFT%2Fwalls-have-ears%2Freleases%2Flatest%2Fdownload%2Fmodule.json&query=%24.compatibility.minimum&suffix=%2B&label=FoundryVTT%20compat&link=https%3A%2F%2Fgithub.com%2FSebaSOFT%2Fwalls-have-ears%2Freleases%2Flatest%2Fdownload%2Fmodule.json)](https://github.com/SebaSOFT/walls-have-ears/releases/latest/download/module.json)

**Version:** 3.13.2

"A zero-config module that dynamically muffles sounds based on wall occlusion. Supports door sounds and settings for a tailored audio experience."

## Installation

In the setup screen, use the URL `https://github.com/SebaSOFT/walls-have-ears/releases/latest/download/module.json` to install the module.

## Features

- Detects sound that are in range but through a wall, and muffles them
- Ignores open doors so sound should not be muffled if listened through an open door

## How it works

- Enable Token Vision on the scene (this is a **MUST**)
- Disable "Constrained by Walls" on the Sound
- It works with sound easing (volume changing)
- It will detect walls and muffle the sound (see table below)
- Windows are less likely to muffle (see table below)
- Terrain walls don't contribute to muffling (see table below)
- Ethereal Walls don't contribute to muffling (see table below)
- Secret Walls work like regular doors

See:

![Test cases for Muffling logic](https://raw.githubusercontent.com/SebaSOFT/walls-have-ears/develop/artwork/mufflingLogic.jpg)

### WHE Showwcase v13+

[![WHE Showwcase v13+](https://img.youtube.com/vi/rqj76KYpGQg/0.jpg)](https://www.youtube.com/watch?v=rqj76KYpGQg)

### Door Sounds demo

[![Door Sounds demo](https://img.youtube.com/vi/f7Ti98hel5s/0.jpg)](https://www.youtube.com/watch?v=f7Ti98hel5s)

## Development

For details on the project structure, development process, and dependencies, please see the [GEMINI.md](GEMINI.md) file.

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

**Discord:** https://discordapp.com/users/SebaSOFT#2613 (SebaSOFT#2613)

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
