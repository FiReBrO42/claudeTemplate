/**
 * 技術棧無關的 i18n 核心模組。
 * 純 ESM、零依賴、不做任何 I/O（messages 由呼叫端注入）。
 */

function getByPath(obj, path) {
  const segments = path.split('.');
  let current = obj;
  for (const segment of segments) {
    if (current == null || typeof current !== 'object' || !(segment in current)) {
      return undefined;
    }
    current = current[segment];
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(message, params) {
  if (!params) return message;
  return message.replace(/\{(\w+)\}/g, (match, name) => {
    return Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match;
  });
}

export function createI18n({ locale, fallbackLocale, messages = {} } = {}) {
  let currentLocale = locale;

  function t(key, params) {
    const primary = getByPath(messages[currentLocale], key);
    if (primary !== undefined) return interpolate(primary, params);

    if (fallbackLocale && fallbackLocale !== currentLocale) {
      const fallback = getByPath(messages[fallbackLocale], key);
      if (fallback !== undefined) return interpolate(fallback, params);
    }

    return key;
  }

  function setLocale(nextLocale) {
    currentLocale = nextLocale;
  }

  function getLocale() {
    return currentLocale;
  }

  return { t, setLocale, getLocale };
}
