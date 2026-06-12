export function getFlagEmoji(countryCode: string | undefined): string {
  if (!countryCode) return "🌐";
  const trimmed = countryCode.trim().toUpperCase();
  if (trimmed === "UN" || trimmed === "UNKNOWN") return "🌐";
  
  const mapping: Record<string, string> = {
    "RUSSIA": "🇷🇺",
    "РОССИЯ": "🇷🇺",
    "RU": "🇷🇺",
    "UNITED STATES": "🇺🇸",
    "US": "🇺🇸",
    "USA": "🇺🇸",
    "UKRAINE": "🇺🇦",
    "UA": "🇺🇦",
    "BELARUS": "🇧🇾",
    "BY": "🇧🇾",
    "KAZAKHSTAN": "🇰🇿",
    "KZ": "🇰🇿",
    "GERMANY": "🇩🇪",
    "DE": "🇩🇪",
    "FRANCE": "🇫🇷",
    "FR": "🇫🇷",
    "UNITED KINGDOM": "🇬🇧",
    "GB": "🇬🇧",
    "CANADA": "🇨🇦",
    "CA": "🇨🇦",
  };
  
  if (mapping[trimmed]) return mapping[trimmed];
  
  if (trimmed.length === 2) {
    const codePoints = trimmed
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    try {
      return String.fromCodePoint(...codePoints);
    } catch {
      return countryCode;
    }
  }
  
  return countryCode;
}

export function getCapitalNameAndTz(countryCode: string | undefined) {
  if (!countryCode) return { city: "Moscow", tz: "Europe/Moscow" };
  const trimmed = countryCode.trim().toUpperCase();
  const mapping: Record<string, { city: string, tz: string }> = {
    "RU": { city: "Moscow", tz: "Europe/Moscow" },
    "RUSSIA": { city: "Moscow", tz: "Europe/Moscow" },
    "РОССИЯ": { city: "Moscow", tz: "Europe/Moscow" },
    "US": { city: "Washington D.C.", tz: "America/New_York" },
    "USA": { city: "Washington D.C.", tz: "America/New_York" },
    "UNITED STATES": { city: "Washington D.C.", tz: "America/New_York" },
    "UA": { city: "Kyiv", tz: "Europe/Kyiv" },
    "UKRAINE": { city: "Kyiv", tz: "Europe/Kyiv" },
    "BY": { city: "Minsk", tz: "Europe/Minsk" },
    "BELARUS": { city: "Minsk", tz: "Europe/Minsk" },
    "KZ": { city: "Astana", tz: "Asia/Almaty" },
    "KAZAKHSTAN": { city: "Astana", tz: "Asia/Almaty" },
    "DE": { city: "Berlin", tz: "Europe/Berlin" },
    "GERMANY": { city: "Berlin", tz: "Europe/Berlin" },
    "FR": { city: "Paris", tz: "Europe/Paris" },
    "FRANCE": { city: "Paris", tz: "Europe/Paris" },
    "GB": { city: "London", tz: "Europe/London" },
    "UK": { city: "London", tz: "Europe/London" },
    "UNITED KINGDOM": { city: "London", tz: "Europe/London" },
    "CA": { city: "Ottawa", tz: "America/Toronto" },
    "CANADA": { city: "Ottawa", tz: "America/Toronto" },
    "KR": { city: "Seoul", tz: "Asia/Seoul" },
    "SOUTH KOREA": { city: "Seoul", tz: "Asia/Seoul" },
    "IT": { city: "Rome", tz: "Europe/Rome" },
    "ITALY": { city: "Rome", tz: "Europe/Rome" },
    "ES": { city: "Madrid", tz: "Europe/Madrid" },
    "SPAIN": { city: "Madrid", tz: "Europe/Madrid" },
  };
  return mapping[trimmed] || { city: "Moscow", tz: "Europe/Moscow" };
}

export function formatChangelogTime(dateStr: string, countryCode: string | undefined): string {
  const { city, tz } = getCapitalNameAndTz(countryCode);
  try {
    const formattedDate = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date(dateStr));
    return `${formattedDate} (${city})`;
  } catch (e) {
    return new Date(dateStr).toLocaleString() + ` (${city})`;
  }
}
