# Foundry VTT - Walls have ears

"A simple-as-possible module to muffle sounds that are behind a wall for a player.

## Installation

In the setup screen, use the URL https://raw.githubusercontent.com/SebaSOFT/walls-have-ears/main/module.json to install the module.


## Release Notes

- v0.0.1: Initial release.

## Features

- Detects sound that are in range but through a wall, and muffles them
- Ignores open doors so sound should not be muffled if listened throughan open door

## TO DO

- Estimate L shaped rooms and track sound bouncing so it doesnt get muffled (possible echo/delay effect)
- Have three or more muffling densities and assign them to the wall they are listening through
- Test with more and more sounds

TO CHECK: I think you could prevent the native sound obscure logic by overriding `AmbientSound#computeFOV` Basically just copy the logic that is currently applied to global type sounds for all sound types

## Contributing

We're always happy for community contributions.


## Licence

This module has been released under the MIT licence, meaning you can do pretty much anything you like with it, so long as the original copyright remains in place.

You **can** use it in commercial products.

If the licence terminology in the licence.txt is confusing, check out this: https://www.tldrlegal.com/l/mit
