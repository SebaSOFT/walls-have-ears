# Foundry VTT - Walls have ears

[![GitHub license](https://img.shields.io/github/license/SebaSOFT/walls-have-ears)](https://github.com/SebaSOFT/walls-have-ears/blob/main/LICENSE) 
[![GitHub release](https://img.shields.io/github/downloads-pre/SebaSOFT/walls-have-ears/latest/module.zip?label=downloads)](https://github.com/SebaSOFT/walls-have-ears/releases/) 
[![Foundry HUB Installs](https://img.shields.io/badge/dynamic/json?color=green&label=FoundryHUB%20installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fwalls-have-ears)](https://forge-vtt.com/bazaar#package=walls-have-ears) 
[![Foundry HUB Endorsements](https://img.shields.io/badge/dynamic/json?label=FoundryHUB%20Endorsements&query=%24.endorsements&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Fwalls-have-ears)](https://forge-vtt.com/bazaar#package=walls-have-ears)
[![Minimum Foundry VTT version](https://img.shields.io/badge/dynamic/json?label=Foundry%20VTT%20version&query=%24.minimumCoreVersion&suffix=%20or%20later&url=https%3A%2F%2Fgithub.com%2FSebaSOFT%2Fwalls-have-ears%2Freleases%2Flatest%2Fdownload%2Fmodule.json)](https://github.com/SebaSOFT/walls-have-ears/releases/latest/download/module.json)

"A simple-as-possible module to muffle sounds that are behind a wall for a player or token."

## Installation

In the setup screen, use the URL https://github.com/SebaSOFT/walls-have-ears/releases/latest/download/module.json to install the module.


## Release Notes

- v0.0.1: Initial release.
- v0.0.2: Added translations and now compatible with FoundryVTT 0.8.x
- v0.0.3: Cleaned up a lot of code, console logs. Update on more events. Added 4 levels of muffling
- v0.0.4: Better event detection
  - Better event detection when opening doors etc.
  - Simpler logic won't take into consideration har await sounds, occluded sounds and more.
  - Better initialization detection. All sound needs to start after first user interaction.
  - GitHub Workflow for more automated releases
- latest:
  - Added Badges to README 

## Features

- Detects sound that are in range but through a wall, and muffles them
- Ignores open doors so sound should not be muffled if listened throughan open door

## How it works
- Set sound occlussion to limited or none as needed
- It will detect walls and muffle the sound
- It also works with sound easing
- Windows are less likely to muffle
- Terrain walls dont contribute to muffling
- Ethereal Walls dont contribute to muffling

See:

![Test cases for Muffling logic](https://raw.githubusercontent.com/SebaSOFT/walls-have-ears/develop/mufflingLogic.jpg)

## TO DO

- Estimate L shaped rooms and track sound bouncing, so it doesn't get muffled (possible echo/delay effect)
- ~~Have three or more muffling densities and assign them to the wall they are listening through~~
- ~~Have a setting for disable sound muffling, useful for muffled sounds or ambient global sounds you may want to eclude~~

## Contributing

We're always happy for community contributions.

## Licence

This module has been released under the MIT licence, meaning you can do pretty much anything you like with it, so long as the original copyright remains in place.

You **can** use it in commercial products.

If the licence terminology in the licence.txt is confusing, check out this: https://www.tldrlegal.com/l/mit
