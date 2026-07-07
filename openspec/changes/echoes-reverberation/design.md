## Context

The `walls-have-ears` module currently muffles sounds dynamically based on wall occlusion using a `BiquadFilterEffect` (low-pass filter) at index 0 of a sound's effects array. To increase auditory immersion, we want to simulate how sound bounces off walls in enclosed spaces (reverberation and echoes). This design outlines the dynamic raycast sampling of room size and reflection paths, along with a self-contained, lightweight Web Audio API algorithmic reverb chain.

## Goals / Non-Goals

**Goals:**
- Implement a dynamic, zero-configuration reverberation effect based on the size of the room containing the sound source or the listener.
- Use a radial raycasting pattern (8 to 20 rays) to estimate room sizes.
- Establish a one-bounce reflection check (rebound) to apply echoes when the direct line of sight is blocked but a reflective path exists.
- Construct a pure Web Audio API node graph (no external files) to simulate algorithmic reverb and delay.
- Cache computed room parameters to maintain high frame rates.

**Non-Goals:**
- Do not use a `ConvolverEffect` with external `.wav` files (impulse responses) to avoid heavy asset overhead.
- Do not perform full, real-time wave equation or multi-bounce audio propagation modeling.

## Decisions

### Decision 1: Web Audio API Algorithmic Reverb over Convolution
- **Rationale**: An algorithmic reverb constructed from native Web Audio nodes (`DelayNode`, `GainNode`, `BiquadFilterNode`) is lightweight, highly parameterizable in real-time, and does not require loading or downloading external impulse response files.
- **Alternative considered**: `ConvolverEffect`. Rejected due to the performance and storage overhead of bundling, distributing, and loading multiple environmental `.wav` files.

### Decision 2: 1-Bounce Rebound Raycasting Check
- **Rationale**: To simulate sound traveling around corners (like an L-shaped corridor), we cast $N$ radial rays from the source, and then cast a direct ray from each collision point to the listener. If any direct ray connects, a reflection path exists. The shortest path distance $D_{path}$ is used to determine the delay time.
- **Alternative considered**: Full recursive ray-tracing. Rejected because of excessive CPU overhead that would severely degrade game client performance.

### Decision 3: Combined Emitter/Listener Acoustics
- **Rationale**: Reverberation is applied if either the sound source ($S_{room}$) or the listener ($L_{room}$) is in an enclosed room (average ray length is below 120 ft). If both are enclosed, we use the listener's environment as the primary factor ($RoomSize_{eff} = L_{room}$) since it dominates human perception. If only one is enclosed, we use that room's size. If neither is enclosed, the reverb is disabled (`wetGain = 0`).

### Decision 4: Storing and Caching Calculations on Document Flags
- **Rationale**: Storing the room size on the sound document's flags prevents redundant raycasting calculations. We only invalidate the cache when the sound document is updated, the token moves, a door state changes, or settings are altered.

### Decision 5: Architectural Separation of Concerns
- **Rationale**: To prevent [MufflingCalculatorService.ts](file:///Users/sebasoft/dev/git-repo/sebasoft/walls-have-ears/src/framework/services/MufflingCalculatorService.ts) from becoming a monolithic class, all raycasting, room size calculations, and rebound connections will be isolated inside a new service called `RoomAcousticService`. This keeps the existing muffling logic cleanly separated from the new reverberation/echo geometry.

## Risks / Trade-offs

- **[Risk] CPU overhead from raycasting** $\to$ *Mitigation*: Limit the number of rays (configurable to 8, 12, 16, or 20) and aggressively cache calculations.
- **[Risk] Metallic ringing from simple feedback loops** $\to$ *Mitigation*: Insert a `BiquadFilterNode` lowpass filter inside the feedback loop to damp higher frequencies on each cycle, simulating natural wall absorption.

