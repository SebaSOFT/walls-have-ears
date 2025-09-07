global.game = {
  i18n: {
    localize: jest.fn((key) => key),
    format: jest.fn((key, data) => `${key} ${JSON.stringify(data)}`),
  },
  settings: {
    get: jest.fn(),
    register: jest.fn(),
  },
};

global.Hooks = {
  once: jest.fn(),
  on: jest.fn(),
};

// Mock foundry.utils.isNewerVersion
global.foundry = {
  utils: {
    isNewerVersion: jest.fn((v1, v2) => {
      const parts1 = v1.split('.').map(Number);
      const parts2 = v2.split('.').map(Number);

      for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;

        if (p1 > p2) return true;
        if (p1 < p2) return false;
      }
      return false;
    }),
  },
  Game: jest.fn(),
  helpers: {
    ClientSettings: jest.fn(),
    Localization: jest.fn(),
  },
};
