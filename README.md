# Foundry VTT - Walls have ears

"A simple-as-possible module to muffle sounds that are behind a wall for a player.

## Installation

In the setup screen, use the URL https://raw.githubusercontent.com/SebaSOFT/walls-have-ears/main/module.json to install the module.


## Release Notes

- v0.0.1: Initial release.
- v0.0.2: Added translations and now compatible with FoundryVTT 0.8.x
- v0.0.3: Cleaned up a lot of code, console logs. Update on more events. Added 4 levels of muffling

## Features

- Detects sound that are in range but through a wall, and muffles them
- Ignores open doors so sound should not be muffled if listened throughan open door

## How it works
- Set sound occlussion to limited or none as needed
- It will detect walls and muffle the sound
- It also works with sound easing
- Windows are less likely to muffle
- Terrain walls dont muffle

See:

![Test cases for Muffling logic](mufflinLogic.jpg)

## TO DO

- Estimate L shaped rooms and track sound bouncing, so it doesn't get muffled (possible echo/delay effect)
- Have three or more muffling densities and assign them to the wall they are listening through
- Have a setting for disable sound muffling, useful for muffled sounds or ambient global sounds you may want to eclude

## Contributing

We're always happy for community contributions.

## Licence

This module has been released under the MIT licence, meaning you can do pretty much anything you like with it, so long as the original copyright remains in place.

You **can** use it in commercial products.

If the licence terminology in the licence.txt is confusing, check out this: https://www.tldrlegal.com/l/mit
