export enum WHEConstants {
  MODULE = 'walls-have-ears',
  SETTING_DEBUG = 'client-debug',
  SETTING_TESTER = 'tester-enable',
  SETTING_DOOR_MUFFLING = 'door-muffling-enable',
  SETTING_FLOOR_THICKNESS = 'floor-thickness',
  SETTING_HEARING_HEIGHT = 'hearing-height',
  SETTING_ECHO_ENABLE = 'echo-enable',
  SETTING_ECHO_RAYS = 'echo-rays',
  SETTING_ECHO_EXTERIOR_THRESHOLD = 'echo-exterior-threshold',
  SETTING_ECHO_FEEDBACK = 'echo-feedback',
  SETTING_ECHO_DAMPENING = 'echo-dampening',
}

export type Arrayish = Record<string, number>;

export const MUFFLING_MAPPING: Arrayish = {
  'level-1': 0,
  level0: 0,
  level1: 1,
  level2: 4,
  level3: 6,
  level4: 8,
  level5: 10,
};
