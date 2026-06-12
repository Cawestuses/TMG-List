import { describe, it, expect } from 'vitest';
import { getFlagEmoji, getCapitalNameAndTz, formatChangelogTime } from './country';

describe('Country and Timezone Utilites (.test.ts)', () => {
  describe('getFlagEmoji', () => {
    it('should return a globe emoji for unknown, empty, or UN values', () => {
      expect(getFlagEmoji('')).toBe('🌐');
      expect(getFlagEmoji(undefined)).toBe('🌐');
      expect(getFlagEmoji('UN')).toBe('🌐');
      expect(getFlagEmoji('UNKNOWN')).toBe('🌐');
    });

    it('should map countries by name or ISO 2-letter codes nicely', () => {
      expect(getFlagEmoji('RU')).toBe('🇷🇺');
      expect(getFlagEmoji('RUSSIA')).toBe('🇷🇺');
      expect(getFlagEmoji('US')).toBe('🇺🇸');
      expect(getFlagEmoji('USA')).toBe('🇺🇸');
      expect(getFlagEmoji('UKRAINE')).toBe('🇺🇦');
      expect(getFlagEmoji('UA')).toBe('🇺🇦');
    });

    it('should dynamically calculate regional indicators for arbitrary 2-letter ISO codes', () => {
      // "FI" code point calculation
      expect(getFlagEmoji('FI')).toBe('🇫🇮');
      expect(getFlagEmoji('JP')).toBe('🇯🇵');
    });
  });

  describe('getCapitalNameAndTz', () => {
    it('should fall back to Moscow timezone for empty inputs', () => {
      expect(getCapitalNameAndTz(undefined)).toEqual({ city: 'Moscow', tz: 'Europe/Moscow' });
    });

    it('should correctly fetch capitals and IANA timezones', () => {
      expect(getCapitalNameAndTz('RU')).toEqual({ city: 'Moscow', tz: 'Europe/Moscow' });
      expect(getCapitalNameAndTz('UA')).toEqual({ city: 'Kyiv', tz: 'Europe/Kyiv' });
      expect(getCapitalNameAndTz('US')).toEqual({ city: 'Washington D.C.', tz: 'America/New_York' });
      expect(getCapitalNameAndTz('FR')).toEqual({ city: 'Paris', tz: 'Europe/Paris' });
    });
  });

  describe('formatChangelogTime', () => {
    it('should format timestamps relative to the specified country capital and tz', () => {
      const sampleDate = '2026-06-12T12:00:00Z';
      const formatted = formatChangelogTime(sampleDate, 'RU');
      // "2026-06-12T12:00:00Z" in Moscow (+3) is "06/12/2026, 15:00"
      expect(formatted).toContain('06/12/2026');
      expect(formatted).toContain('15:00');
      expect(formatted).toContain('(Moscow)');
    });

    it('should gracefully handle invalid date inputs without crashing', () => {
      const formatted = formatChangelogTime('not-a-date', 'RU');
      expect(formatted).toContain('(Moscow)');
    });
  });

  describe('YouTube & Twitch Video Regex (Security auditing target)', () => {
    const videoRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be|twitch\.tv)\/.+$/;

    it('should successfully match valid YouTube and YouTube short links', () => {
      expect(videoRegex.test('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(videoRegex.test('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
      expect(videoRegex.test('http://youtube.com/shorts/sample')).toBe(true);
    });

    it('should successfully match valid Twitch channel/video links', () => {
      expect(videoRegex.test('https://twitch.tv/ninja')).toBe(true);
      expect(videoRegex.test('https://www.twitch.tv/videos/123456')).toBe(true);
    });

    it('should fail on insecure, phishy, or malicious domains', () => {
      expect(videoRegex.test('https://youtube.com.phishing.ru/watch')).toBe(false);
      expect(videoRegex.test('https://malicious-site.com/video')).toBe(false);
      expect(videoRegex.test('ftp://youtube.com/watch?v=123')).toBe(false);
    });
  });
});
