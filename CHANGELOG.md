# CHANGELOG

## [1.11.1] 2023-09-19

### CHANGED

N/A

### ADDED

-  Added Japanese translations thanks to the amazing contribution by @doumoku

## [1.11.0] 2023-05-25

### CHANGED

-   Plucked away all compatibility warnings
-   Added additional position check since now windows have "proximity" restrictions to sight by default (and windows contribute zero muffling as per sight)
-   Sorted out a bug in Foundry's collision test

### ADDED

- Compatibility with v11
- Added a setting for enabling muffling during sound preview check (feature is coming when there si enough documentation/javascript types for v11)


## [1.10.1] 2022-09-21

### CHANGED

-   Changed compatibility range to avoid sily warning on minor version change

## [1.10.0] 2022-09-10

### CHANGED

-   Moved to yarn stable for quicker builds and better dev experience (no zero-install though)

### ADDED

- ESLint's configuration from FoundryVTT, I think it should be stricter though
- Compatibility with v10
- Implemented a muffling cache to avoid changing the filter nodes if no muffling is needed (preventing ticks)

## [1.0.2] 2022-04-22

### CHANGED

-   Corrected a problem for scenes with no walls

### ADDED

-   Added a check for ignoring/cleaning sounds that are not constrained by walls (they NEED to be constrained by walls)
-   Better debugging logs

## [1.0.1] 2022-04-20

### CHANGED

-   Corrected some translations and improved code commenting

### ADDED

-   Debug setting, so you can see the inner workings of the module and troubleshoot your scenes

## [1.0.0] 2022-02-28

### CHANGED

-   Added compatibility with v9, all other versions are not compatible now.

### ADDED

-   Better logging for debugging. End users not affected.

## [0.1.0] 2021-06-19

### CHANGED

-   Better initialization of scripts and the new global `WHE` object

### ADDED

-   Gihub badges to README
-   A proper CHANGELOG file

## [0.0.4] 2021-06-05

### CHANGED

-   Better event detection (opening doors)
-   Simpler logic will ignore far away, occluded sounds
-   Better support for async initialization of sound

### ADDED

-   GitHub workflow for easier release workflow

## [0.0.3] 2021-06-03

### CHANGED

-   Cleaned a lot of code
-   Sounds now update in more events
-   A new logic for estimating muffling levels. See:
    ![Test cases for Muffling logic](https://raw.githubusercontent.com/SebaSOFT/walls-have-ears/develop/mufflingLogic.jpg)

### FIXED

-   Remove cosnole logs

### ADDED

-   Added 4 levels of muffling

## [0.0.2-beta] 2021-06-02

### CHANGED

-   Added some translations (pt, de)
-   Now compatible with 0.8.x

## [0.0.1-alpha] 2020-10-19

### ADDED

-   First initial release
