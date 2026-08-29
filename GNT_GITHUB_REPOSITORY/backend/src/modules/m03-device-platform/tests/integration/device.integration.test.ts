import { describe, it, expect } from 'vitest';
import { deviceService } from '../../services/device.service';
import { deviceInternal } from '../../services/device.internal';

describe('M03 - Integration Tests', () => {
  describe('Version comparison', () => {
    it('should correctly compare versions', () => {
      expect(deviceInternal.compareVersions('1.0.0', '2.0.0')).toBe(-1);
      expect(deviceInternal.compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(deviceInternal.compareVersions('2.0.0', '2.0.0')).toBe(0);
      expect(deviceInternal.compareVersions('2.0.9', '2.1.0')).toBe(-1);
    });

    it('should detect update severity correctly', async () => {
      expect(await deviceInternal.getUpdateSeverity('1.0.0', '2.0.0')).toBe('critical');
      expect(await deviceInternal.getUpdateSeverity('2.0.0', '2.1.0')).toBe('major');
      expect(await deviceInternal.getUpdateSeverity('2.0.0', '2.0.10')).toBe('minor');
      expect(await deviceInternal.getUpdateSeverity('2.0.0', '2.0.1')).toBe('patch');
    });
  });

  describe('Default settings', () => {
    it('should return consistent default settings', () => {
      const defaults = deviceInternal.getDefaultSettings();
      expect(defaults.sessionTimeout).toBe(30);
      expect(defaults.offlineSync).toBe(true);
      expect(defaults.syncInterval).toBe(15);
    });
  });
});
