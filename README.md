# WALLS HAVE EARS

[![GitHub license](https://img.shields.io/github/license/SebaSOFT/walls-have-ears)](https://github.com/SebaSOFT/walls-have-ears/blob/main/LICENSE)
[![GitHub release](https://img.shields.io/github/downloads-pre/SebaSOFT/walls-have-ears/latest/module.zip?label=downloads)](https://github.com/SebaSOFT/walls-have-ears/releases/)
[![Forge Installs](https://img.shields.io/badge/dynamic/json?color=green&label=Forge%20installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fwalls-have-ears)](https://forge-vtt.com/bazaar#package=walls-have-ears)
[![Foundry HUB Endorsements](https://img.shields.io/badge/dynamic/json?label=FoundryHUB%20Endorsements&query=%24.endorsements&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Fwalls-have-ears)](https://www.foundryvtt-hub.com/package/walls-have-ears/)
[![Minimum Foundry VTT version](https://img.shields.io/badge/dynamic/json?label=Foundry%20VTT%20version&query=%24.minimumCoreVersion&suffix=%20or%20later&url=https%3A%2F%2Fgithub.com%2FSebaSOFT%2Fwalls-have-ears%2Freleases%2Flatest%2Fdownload%2Fmodule.json)](https://github.com/SebaSOFT/walls-have-ears/releases/latest/download/module.json)

**Version:** 3.13.0

"A simple-as-possible module to muffle sounds that are behind a wall for a player or token."

walls-have-ears is a simple-as-possible module to muffle sounds that are behind a wall for a player in FoundryVTT. It is built and bundled using Parcel, offering a simple and efficient development experience.

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

https://youtu.be/rqj76KYpGQg

[http://www.youtube.com/watch?feature=player_embedded&v=rqj76KYpGQg](http://img.youtube.com/vi/rqj76KYpGQg/0.jpg)

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
