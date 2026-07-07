# Echoes & Reverberation Spec

## Purpose
This specification defines the requirements for dynamic echoes, room size calculations, and reverberation simulation based on scene walls and acoustic reflections in the Walls Have Ears module.

## Requirements

### Requirement: Room Size Calculation
The system SHALL calculate the room size of the source ($S_{room}$) and the listener ($L_{room}$) by casting $N$ radial rays (where $N$ is configurable as 8, 12, 16, or 20) from their respective coordinates up to the maximum sound radius or threshold.

#### Scenario: Calculating room size in enclosed space
- **WHEN** a room size calculation is triggered for an entity inside an enclosed room
- **THEN** the system casts $N$ radial rays and returns the average ray length as the room size, which is less than the exterior threshold (120 ft)

#### Scenario: Identifying open nature environment
- **WHEN** a room size calculation is triggered in an open field where rays do not collide with walls
- **THEN** the average ray length equals or exceeds the exterior threshold (120 ft), and the space is classified as open/exterior

---

### Requirement: Rebound Path Check
The system SHALL cast direct rays from each of the $N$ collision points of the emitter's rays to the listener's coordinates to identify if at least one rebound path is unobstructed by walls.

#### Scenario: Finding a valid reflection in L-shaped corridor
- **WHEN** the direct path between source and listener is blocked, but a secondary ray from a wall collision point has a clear line-of-sight to the listener
- **THEN** the system identifies a valid rebound path and calculates the total distance $D_{path} = d_{source \to collision} + d_{collision \to listener}$

#### Scenario: No reflection path available
- **WHEN** all secondary rays from all collision points to the listener are blocked by walls
- **THEN** the system determines that no rebound path is available, setting the wet reverb gain to 0

---

### Requirement: Web Audio Algorithmic Reverb
The system SHALL construct and connect a lightweight Web Audio API algorithmic reverb node graph (containing a DelayNode, a GainNode for feedback, and a BiquadFilterNode for lowpass absorption) at index 1 of the active Sound effects array.

#### Scenario: Updating ambient sound effects pipeline
- **WHEN** echoes are enabled and a sound is active in an enclosed room (or listener is in an enclosed room)
- **THEN** the system creates or updates the Web Audio sub-graph at `sound.effects[1]`, dynamically setting the delay time, feedback gain, and lowpass filter frequency based on the calculated room size and rebound distance

#### Scenario: Applying reverb to positional door sounds
- **WHEN** `playDoorSound` is triggered, the door is in range, and echoes are enabled
- **THEN** the system applies the custom algorithmic reverb effect to the resolved positional Sound instance

#### Scenario: Deactivating reverb when disabled or in open spaces
- **WHEN** the echo setting is disabled globally or both emitter and listener are in open spaces (nature)
- **THEN** the system sets the wet gain node of the reverb graph to 0, outputting only the dry audio signal
