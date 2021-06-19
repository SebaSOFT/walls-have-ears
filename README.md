# Foundry VTT - Walls have ears

[![GitHub license](https://img.shields.io/github/license/SebaSOFT/walls-have-ears)](https://github.com/SebaSOFT/walls-have-ears/blob/main/LICENSE) 
[![GitHub release](https://img.shields.io/github/downloads-pre/SebaSOFT/walls-have-ears/latest/module.zip?label=downloads)](https://github.com/SebaSOFT/walls-have-ears/releases/) 
[![Forge Installs](https://img.shields.io/badge/dynamic/json?color=green&label=Forge%20installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fwalls-have-ears)](https://forge-vtt.com/bazaar#package=walls-have-ears) 
[![Foundry HUB Endorsements](https://img.shields.io/badge/dynamic/json?label=FoundryHUB%20Endorsements&query=%24.endorsements&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Fwalls-have-ears)](https://www.foundryvtt-hub.com/package/walls-have-ears/)
[![Minimum Foundry VTT version](https://img.shields.io/badge/dynamic/json?label=Foundry%20VTT%20version&query=%24.minimumCoreVersion&suffix=%20or%20later&url=https%3A%2F%2Fgithub.com%2FSebaSOFT%2Fwalls-have-ears%2Freleases%2Flatest%2Fdownload%2Fmodule.json)](https://github.com/SebaSOFT/walls-have-ears/releases/latest/download/module.json)

"A simple-as-possible module to muffle sounds that are behind a wall for a player or token."

## Installation

In the setup screen, use the URL https://github.com/SebaSOFT/walls-have-ears/releases/latest/download/module.json to install the module.


## Release Notes

See [CHANGELOG](CHANGELOG.md)

## Features

- Detects sound that are in range but through a wall, and muffles them
- Ignores open doors so sound should not be muffled if listened throughan open door

## How it works
- Set sound occlussion to limited or none as needed
- It will detect walls and muffle the sound
- It also works with sound easing
- Windows are less likely to muffle
- Terrain walls don't contribute to muffling
- Ethereal Walls don't contribute to muffling

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

- Estimate L shaped rooms and track sound bouncing, so it doesn't get muffled (possible echo/delay effect)
- ~~Have three or more muffling densities and assign them to the wall they are listening through~~
- ~~Have a setting for disable sound muffling, useful for muffled sounds or ambient global sounds you may want to eclude~~

## Contributing

We're always happy for community contributions.

## Licence

This module has been released under the MIT licence, meaning you can do pretty much anything you like with it, so long as the original copyright remains in place.

You **can** use it in commercial products.

If the licence terminology in the licence.txt is confusing, check out this: https://www.tldrlegal.com/l/mit
