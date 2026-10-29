import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'sih.lastCrash';

export type CrashInfo = { message: string; stack: string; fatal: boolean; at: string };

export async function saveCrash(error: unknown, fatal: boolean): Promise<void> {
  const e = error as { message?: unknown; stack?: unknown } | null;
  const info: CrashInfo = {
    message: String(e?.message ?? error ?? 'Unknown error').slice(0, 600),
    stack: String(e?.stack ?? '').split('\n').slice(0, 14).join('\n').slice(0, 2500),
    fatal,
    at: new Date().toISOString(),
  };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(info));
  } catch {
    // nothing more we can do while crashing
  }
}

export async function readCrash(): Promise<CrashInfo | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CrashInfo) : null;
  } catch {
    return null;
  }
}

export const clearCrash = () => AsyncStorage.removeItem(KEY).catch(() => {});

export function crashText(c: CrashInfo): string {
  return `Sell It Habibi crash report\n${c.at}${c.fatal ? ' (fatal)' : ''}\n\n${c.message}\n\n${c.stack}`;
}

/**
 * Remembers the last uncaught JavaScript error so the next launch can show it. The normal handler still runs afterwards
 * (a short moment later, so the note has time to be written). Native crashes are outside JavaScript and are not caught.
 */
export function installCrashCapture(): void {
  const utils = (globalThis as { ErrorUtils?: { getGlobalHandler?: () => (e: unknown, f?: boolean) => void; setGlobalHandler?: (h: (e: unknown, f?: boolean) => void) => void } }).ErrorUtils;
  if (!utils?.setGlobalHandler) return;
  const previous = utils.getGlobalHandler?.();
  utils.setGlobalHandler((error, isFatal) => {
    saveCrash(error, !!isFatal);
    setTimeout(() => previous?.(error, isFatal), 300);
  });
}
