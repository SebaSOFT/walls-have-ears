# Foundry VTT - Walls have ears

[![GitHub license](https://img.shields.io/github/license/SebaSOFT/walls-have-ears)](https://github.com/SebaSOFT/walls-have-ears/blob/main/LICENSE) 
[![GitHub release](https://img.shields.io/github/downloads-pre/SebaSOFT/walls-have-ears/latest/module.zip?label=downloads)](https://github.com/SebaSOFT/walls-have-ears/releases/) 
[![Forge Installs](https://img.shields.io/badge/dynamic/json?color=green&label=Forge%20installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fwalls-have-ears)](https://forge-vtt.com/bazaar#package=walls-have-ears) 
[![Foundry HUB Endorsements](https://img.shields.io/badge/dynamic/json?label=FoundryHUB%20Endorsements&query=%24.endorsements&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Fwalls-have-ears)](https://www.foundryvtt-hub.com/package/walls-have-ears/)
[![Maximum Foundry VTT version](https://img.shields.io/badge/dynamic/json?label=Foundry%20VTT%20support&query=%24.compatibility.maximum&url=https%3A%2F%2Fgithub.com%2FSebaSOFT%2Fwalls-have-ears%2Freleases%2Flatest%2Fdownload%2Fmodule.json)](https://github.com/SebaSOFT/walls-have-ears/releases/latest/download/module.json)

"A simple-as-possible module to muffle sounds that are behind a wall for a player or token."

## Installation

In the setup screen, use the URL https://github.com/SebaSOFT/walls-have-ears/releases/latest/download/module.json to install the module.

## A note in v12 plans

Foundry VTT has partially included some of the functionality of WHE into core, but the current implementation is not easy to setup and is already prone to incorrectness. 
So my idea for v12 is:
> - Move the project to parcel/TS
> - Implement if possible the types on the new framework
> - Update Yarn and automated workflows (autodeploy?)
> - Add a global or scene setting to "handle muffling intensity by wall estimation"
> - Prevent showing the Muffling intensity slider
> - Prevent showing the Muffling selector ( or auto assign it)
> - Change the intensity slider just for a given user and not be a server setting
> - Handle new types of walls and the proximity/reverse proximity cases
> - Create entire new tutorials and test bed

## Release Notes

See [CHANGELOG](CHANGELOG.md)

## Features

- Detects sound that are in range but through a wall, and muffles them
- Ignores open doors so sound should not be muffled if listened throughan open door

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

Demo videos:


### Nightclub demo
<a href="http://www.youtube.com/watch?feature=player_embedded&v=EXkrlQVEeAo
" target="_blank"><img src="http://img.youtube.com/vi/EXkrlQVEeAo/0.jpg"
alt="Nightclub demo" width="240" height="180" border="10" /></a>

### Test suite demo
<a href="http://www.youtube.com/watch?feature=player_embedded&v=hlsi4gw1YIA
" target="_blank"><img src="http://img.youtube.com/vi/hlsi4gw1YIA/0.jpg"
alt="Test suite demo" width="240" height="180" border="10" /></a>

## TO DO

- **Acoustic Ray Tracing:** Estimate L shaped rooms and track sound bouncing, so it doesn't get muffled (possible echo/delay effect)
- See v12 improvements above

## Known Issues

- If the first action you do when accessing the site is selecting a token, it won't be muffled, just select another token or move it one time.

## Contributing

We're always happy for community contributions.

## Licence

This module has been released under the MIT licence, meaning you can do pretty much anything you like with it, so long as the original copyright remains in place.

You **can** use it in commercial products.

If the licence terminology in the licence.txt is confusing, check out this: https://www.tldrlegal.com/l/mit
