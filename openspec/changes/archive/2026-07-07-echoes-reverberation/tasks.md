## 1. UI & Configurations

- [x] 1.1 Register setting keys in [WHEConstants.ts](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/src/utils/WHEConstants.ts)
- [x] 1.2 Register echo settings and choices in [WHESettings.ts](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/src/settings/WHESettings.ts)
- [x] 1.3 Add English and Spanish localization strings in [walls-have-ears.en.json](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/lang/walls-have-ears.en.json) and [walls-have-ears.es.json](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/lang/walls-have-ears.es.json)
- [x] 1.4 Add translation fallback values for other languages (de, fr, ja, pt-BR) in [lang/](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/lang)

## 2. Geometric Core (Raycasting & Physics)

- [x] 2.1 Create the new [RoomAcousticService.ts](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/src/framework/services/RoomAcousticService.ts) class under services/
- [x] 2.2 Implement radial raycast function in [RoomAcousticService.ts](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/src/framework/services/RoomAcousticService.ts) to estimate room size
- [x] 2.3 Implement secondary direct raycast checks to verify rebound/reflection path connection
- [x] 2.4 Implement the combined room size logic ($S_{room}$ and $L_{room}$ min/max combinations)
- [x] 2.5 Add unit tests in RoomAcousticService.test.ts for room size and rebound path calculations

## 3. Audio Engine Integration

- [x] 3.1 Implement the Web Audio API algorithmic reverb node graph (DelayNode + GainNode + BiquadFilterNode) in [SoundManager.ts](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/src/framework/audio/SoundManager.ts)
- [x] 3.2 Add the reverb node graph to the Sound.effects pipeline at index 1
- [x] 3.3 Implement dynamic parameter updates (delay time, feedback gain, lowpass cutoff) based on room size and path distance
- [x] 3.4 Hook up the reverb effects to `playDoorSound` for positional door sounds

## 4. Cache & Event Handling

- [x] 4.1 Update [HookManager.ts](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/src/framework/hooks/HookManager.ts) to invalidate the room size cache on token movement, wall/door changes, and scene init
- [ ] 4.2 Run end-to-end manual validation on test scenes in Foundry VTT
