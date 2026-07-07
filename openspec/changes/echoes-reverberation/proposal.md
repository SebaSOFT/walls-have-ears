## Why

Foundry VTT V14 introduces native 3D scene levels and audio improvements, but does not provide dynamic, zero-configuration environmental reverberation or echo simulation. This feature implements dynamic room size estimation and reflection calculations via raycasting, applying lightweight algorithmic reverb to sounds (ambient and door interactions) to significantly enhance immersion without requiring manual GM setup or heavy external audio files.

## What Changes

- **Settings & UI**:
  - Introduce three new settings in [WHESettings.ts](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/src/settings/WHESettings.ts): `echo-enable` (Boolean feature flag), `echo-rays` (Number choice: 8, 12, 16, 20), and `echo-exterior-threshold` (Number, default 120 ft).
  - Add corresponding localization strings in all languages (starting with English and Spanish).
- **Geometric Calculation**:
  - Implement radial raycasting in [MufflingCalculatorService.ts](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/src/framework/services/MufflingCalculatorService.ts) to calculate both emitter ($S_{room}$) and listener ($L_{room}$) room sizes.
  - Perform secondary direct raycasts from collision points to the listener to check for rebound paths.
- **Audio Processing**:
  - Construct a lightweight algorithmic reverb sub-graph in [SoundManager.ts](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/src/framework/audio/SoundManager.ts) (Delay node + Gain node feedback loop + Lowpass filter).
  - Dynamically chain this reverb effect at index 1 of the sound's active effects pipeline.
  - Support reverb effects on door sounds triggered by `playDoorSound` via the positional audio layer.
- **Caching**:
  - Extend the caching layer in [WHEUtils.ts](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/src/utils/WHEUtils.ts) to store calculated room sizes and invalidate them on token movement, wall/door updates, and scene initialization.

## Capabilities

### New Capabilities
- `echoes-reverberation`: Calculates room sizes and applies a dynamic algorithmic reverb Web Audio graph to active ambient sounds and door sounds.

### Modified Capabilities
<!-- None -->

## Impact

- **Affected Files**:
  - [WHEConstants.ts](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/src/utils/WHEConstants.ts) (Added setting keys)
  - [WHESettings.ts](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/src/settings/WHESettings.ts) (Registered settings)
  - [walls-have-ears.en.json](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/lang/walls-have-ears.en.json), [walls-have-ears.es.json](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/lang/walls-have-ears.es.json) (Translation keys)
  - [MufflingCalculatorService.ts](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/src/framework/services/MufflingCalculatorService.ts) (Raycasting math for room size and reflection path calculation)
  - [SoundManager.ts](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/src/framework/audio/SoundManager.ts) (Audio node chain manipulation for reverberation)
  - [HookManager.ts](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/src/framework/hooks/HookManager.ts) (Listen to events and trigger recalculations/caching updates)
- **Dependencies**: No external dependencies or libraries added. Fully native to Foundry VTT V14 and Web Audio API.
