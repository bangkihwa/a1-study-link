import NodeCache from 'node-cache';
import { query } from '../config/database';
import { AdminSettings } from '../types';

const SETTINGS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

const SETTINGS_DEFAULTS: AdminSettings = {
  allowRegistrations: true,
  maintenanceMode: false,
  supportEmail: 'support@a1studylink.com',
  apiRateLimit: 100
};

interface CachedSettings extends AdminSettings {
  autoApproveTeachers: boolean;
}

const settingsCache = new NodeCache({ stdTTL: 30, checkperiod: 15 });
const CACHE_KEY = 'system-settings';

async function ensureSettingsTable(): Promise<void> {
  await query(SETTINGS_TABLE_SQL);
}

function coerceBoolean(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s === 'true' || s === '1') return true;
    if (s === 'false' || s === '0' || s === '') return false;
    // any other non-empty string: treat as false to be conservative for settings
    return false;
  }
  return Boolean(val);
}

function parseSettings(rows: any[]): AdminSettings {
  const settings = { ...SETTINGS_DEFAULTS };

  rows.forEach((row) => {
    const key = row.setting_key as keyof AdminSettings;
    let value = row.setting_value;

    if (typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch {
        // ignore parse error -> use raw value
      }
    }

    const resolved = value?.value ?? value;

    if (key === 'apiRateLimit') {
      settings.apiRateLimit = Number(resolved ?? SETTINGS_DEFAULTS.apiRateLimit);
    } else if (key === 'supportEmail') {
      settings.supportEmail = resolved ?? SETTINGS_DEFAULTS.supportEmail;
    } else if (key === 'allowRegistrations') {
      settings.allowRegistrations = coerceBoolean(resolved);
    } else if (key === 'maintenanceMode') {
      settings.maintenanceMode = coerceBoolean(resolved);
    }
  });

  return settings;
}

async function fetchSettings(): Promise<CachedSettings> {
  await ensureSettingsTable();
  const rows = await query('SELECT setting_key, setting_value FROM system_settings', []) as any[];
  const raw = parseSettings(rows);

  return {
    ...raw,
    autoApproveTeachers: raw.allowRegistrations
  };
}

export default class SystemSettingsService {
  static async getCachedSettings(): Promise<CachedSettings> {
    const cached = settingsCache.get<CachedSettings>(CACHE_KEY);
    if (cached) {
      return cached;
    }

    const settings = await fetchSettings();
    settingsCache.set(CACHE_KEY, settings);
    return settings;
  }

  static async getSettings(): Promise<CachedSettings> {
    const settings = await fetchSettings();
    settingsCache.set(CACHE_KEY, settings);
    return settings;
  }

  static async updateSettings(partial: Partial<AdminSettings>): Promise<CachedSettings> {
    await ensureSettingsTable();

    const entries = Object.entries(partial) as Array<[keyof AdminSettings, any]>;

    for (const [key, value] of entries) {
      let normalized: any = value;
      if (key === 'allowRegistrations' || key === 'maintenanceMode') {
        normalized = coerceBoolean(value);
      } else if (key === 'apiRateLimit') {
        normalized = Number(value);
      }
      await query(
        `INSERT INTO system_settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
        [key, JSON.stringify({ value: normalized })]
      );
    }

    settingsCache.del(CACHE_KEY);
    return this.getCachedSettings();
  }
}
