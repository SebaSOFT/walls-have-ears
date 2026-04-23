# CHANGELOG

## [3.14.1] 2026-04-23

### ADDED

#### 🚀 Native Scene Levels Support (V14)
- **Vertical Occlusion Calculation:** The module now automatically detects when sound passes through a "Floor" or "Ceiling" defined in the new V14 Scene Levels system.
- **Native V14 Levels Fallback:** Implemented support for Foundry's native Level system if the "Levels" module is not present.
- **Floor Merging Logic (Structure Thickness):** Implemented an intelligent logic to prevent "double muffling". If two surfaces (e.g., a ceiling and the floor above) are within 10 units of distance, they are treated as a single solid structural element.
- **3D Raycast Physics:** Migrated all calculation logic from 2D straight lines to a real 3D vector (`Point3D`). This allows sound to be dynamically muffled based on the relative height between the source and the listener.

#### 🚪 Acoustic Portals (Stairs and Holes)
- **Region-Based Propagation:** Implementation of alternative "Acoustic Paths". If a direct path is blocked by a floor but a Region of type `teleport` or `changeLevel` (native V14 stairs) exists, the sound will "travel" through the portal if it offers a clearer path.
- **"Air" Detection:** Holes in levels (areas without a defined surface) are now correctly treated as air, allowing sound to pass without penalty even between different elevations.

#### 🌿 Material and Wall Refinement
- **Natural Walls (0.5 Rule):** Introduced an occlusion value of 0.5 for "natural" or limited obstacles (Terrain walls, Ethereal walls).
    - *Logic:* A single natural obstacle is "acoustically transparent". Only when sound passes through a second natural obstacle (summing to 1.0) is the first level of muffling applied.
- **Technical Table Compliance:** Verified via unit tests that every combination of walls (Solid, Window, Terrain, Ethereal) exactly matches the defined muffling matrix (e.g., 3 Windows = 1 Muffling Level).

#### 👤 Token Anatomy (Ear Height)
- **Hearing Height Offset:** For increased realism, the token's hearing point is no longer fixed on the floor. A new configurable setting allows adjusting the vertical offset (Default: 6 units) above the token's base elevation, simulating the actual height of a creature's ears.

#### ⚙️ New Settings
- **Floor Thickness:** New configurable setting defining the maximum distance to merge nearby surfaces into a single muffling layer (Default: 10 ft).
- **Hearing Height Offset:** Configurable vertical offset for token "ears" to support different scales (Metric/Imperial) and creature sizes.
- **V14 Feature Toggle:** Level and portal functions activate only in V14, maintaining full stability in V13.

### FIXED
- **Performance Optimization:** 
    - **Pre-calculated Data:** Implemented pre-fetching and pre-calculation for Scene Elevations and Portal Regions to minimize V14 API overhead and redundant object mapping during muffling passes.
    - **Audible Radius Filtering:** Optimized Acoustic Portal evaluation by skipping regions outside the sound's effective radius using high-speed Euclidean distance checks.
    - **Memory Management:** Eliminated redundant memory allocations (e.g., `Array.from` calls) in high-frequency wall collision filtering.
    - **Settings Lookup:** Optimized settings API access by fetching configuration values once per muffling pass.
- **Elevation Accuracy:** 
    - Fixed mapping of V14 elevation objects (`bottom`/`top` logic).
    - Ensured unit awareness (ft/m) in logs and calculations.
    - Improved normalization of Foundry Collections and Sets for cross-version compatibility.
- **Distance Accuracy:** Calculated distance now includes the vertical hypotenuse (True 3D distance), improving volume falloff calculations.
- **Memory Optimization:** Improved caching system for calculated muffling levels, reducing performance impact during token movement.
- **Bug Fixes:**
    - Resolved `TypeError` in `MufflingCalculatorService` during asynchronous wall loading.
    - Fixed a typo in the distance calculation function.
    - Corrected handling of infinite elevations (`Infinity`) in portal regions.
    - Added null safety checks for movement collision layers.
    - Fixed visibility of settings in the menu by using raw translation keys.

## [3.13.2] 2025-09-11

### CHANGED

- Revised functionality of preview setting

### ADDED

- Settings to disable the muffling functionality for door sounds

## [3.13.1] 2025-09-10

### CHANGED

- The module's core logic has been completely overhauled for better performance, stability, and accuracy in sound muffling.
- The new architecture ensures a more responsive and reliable experience, especially in complex scenes with many walls and sounds.

### ADDED

- Enhanced the precision of wall occlusion detection for more realistic sound muffling effects.
- Asynchronous detection of sound loading that caused failed detection on big sound files (mp3)

## [3.13.0] 2025-09-02

### CHANGED

- Removed the "Disable Muffling" setting. You can certainly disable the module. But this may come back a as a world setting, or a map setting

### ADDED

- Support for v13+
- Now the module is fully TypeScript. Parcel JS, Jest testing and type-checked
- Auto deployment script

## [1.11.1] 2023-09-19

### CHANGED

N/A

### ADDED

- Added Japanese translations thanks to the amazing contribution by @doumoku

## [1.11.0] 2023-05-25

### CHANGED

- Plucked away all compatibility warnings
- Added additional position check since now windows have "proximity" restrictions to sight by default (and windows contribute zero muffling as per sight)
- Sorted out a bug in Foundry's collision test

### ADDED

- Compatibility with v11
- Added a setting for enabling muffling during sound preview check (feature is coming when there si enough documentation/javascript types for v11)

## [1.10.1] 2022-09-21

### CHANGED

- Changed compatibility range to avoid sily warning on minor version change

## [1.10.0] 2022-09-10

### CHANGED

- Moved to yarn stable for quicker builds and better dev experience (no zero-install though)

### ADDED

- ESLint's configuration from FoundryVTT, I think it should be stricter though
- Compatibility with v10
- Implemented a muffling cache to avoid changing the filter nodes if no muffling is needed (preventing ticks)

## [1.0.2] 2022-04-22

### CHANGED

- Corrected a problem for scenes with no walls

### ADDED

- Added a check for ignoring/cleaning sounds that are not constrained by walls (they NEED to be constrained by walls)
- Better debugging logs

## [1.0.1] 2022-04-20

### CHANGED

- Corrected some translations and improved code commenting

### ADDED

- Debug setting, so you can see the inner workings of the module and troubleshoot your scenes

## [1.0.0] 2022-02-28

### CHANGED

- Added compatibility with v9, all other versions are not compatible now.

### ADDED

- Better logging for debugging. End users not affected.

## [0.1.0] 2021-06-19

### CHANGED

- Better initialization of scripts and the new global `WHE` object

### ADDED

- Gihub badges to README
- A proper CHANGELOG file

## [0.0.4] 2021-06-05

### CHANGED

- Better event detection (opening doors)
- Simpler logic will ignore far away, occluded sounds
- Better support for async initialization of sound

### ADDED

- GitHub workflow for easier release workflow

## [0.0.3] 2021-06-03

### CHANGED

- Cleaned a lot of code
- Sounds now update in more events
- A new logic for estimating muffling levels. See:
  ![Test cases for Muffling logic](https://raw.githubusercontent.com/SebaSOFT/walls-have-ears/develop/mufflingLogic.jpg)

### FIXED

- Remove cosnole logs

### ADDED

- Added 4 levels of muffling

## [0.0.2-beta] 2021-06-02

### CHANGED

- Added some translations (pt, de)
- Now compatible with 0.8.x

## [0.0.1-alpha] 2020-10-19

### ADDED

- First initial release
