const AW_API_BASE = import.meta.env.VITE_AW_API_BASE || 'http://127.0.0.1:5600/api/0';
const CHATGPT_CACHE_PREFIX = 'rkm:roadmap:chatgpt-activity:v1:';
const CHATGPT_CACHE_TTL_MS = 5 * 60 * 1000;

type AwBucket = {
  type?: string;
  client?: string;
  hostname?: string;
};

type AwEvent = {
  timestamp?: string;
  duration?: number;
  data?: {
    url?: string;
    title?: string;
  };
};

export type ChatGptActivity = {
  totalSeconds: number;
  eventCount: number;
  nextRefreshAt: number;
};

type CachedChatGptActivity = Omit<ChatGptActivity, 'nextRefreshAt'> & { cachedAt: number };

function readChatGptCache(key: string): CachedChatGptActivity | null {
  try {
    const value = sessionStorage.getItem(key);
    if (!value) return null;

    const cached = JSON.parse(value) as CachedChatGptActivity;
    const isValid =
      Number.isFinite(cached.cachedAt) &&
      Number.isFinite(cached.totalSeconds) &&
      Number.isFinite(cached.eventCount);

    if (!isValid || Date.now() - cached.cachedAt >= CHATGPT_CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }

    return cached;
  } catch {
    return null;
  }
}

async function awGet<T>(path: string): Promise<T> {
  const response = await fetch(`${AW_API_BASE}${path}`, {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`aw-server retornou HTTP ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

function isBrowserBucket(bucketId: string, bucket: AwBucket) {
  const description = [bucketId, bucket.type, bucket.client, bucket.hostname]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return description.includes('aw-watcher-web') || description.includes('web.tab.current');
}

function isChatGptUrl(value: string | undefined) {
  if (!value) return false;

  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return (
      hostname === 'chatgpt.com' ||
      hostname.endsWith('.chatgpt.com') ||
      hostname === 'chat.openai.com' ||
      hostname.endsWith('.chat.openai.com')
    );
  } catch {
    return false;
  }
}

function eventMatchesBranch(title: string | undefined, branch: string) {
  return (title || '').trim().toLowerCase() === branch.trim().toLowerCase();
}

/** Soma eventos do ChatGPT cujo título corresponde à branch no intervalo informado. */
export async function getChatGptActivity(
  branch: string,
  forceRefresh = false,
  start: Date = new Date(2026, 8, 1),
  end: Date = new Date(),
): Promise<ChatGptActivity> {
  const startMs = start.getTime();
  const endMs = end.getTime();

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs >= endMs) {
    throw new Error('Intervalo de consulta do ActivityWatch inválido.');
  }
  if (!branch.trim()) {
    throw new Error('Branch para consulta do ChatGPT não informada.');
  }

  const cacheKey = `${CHATGPT_CACHE_PREFIX}${start.toISOString().slice(0, 10)}:${branch.trim().toLowerCase()}`;
  if (!forceRefresh) {
    const cached = readChatGptCache(cacheKey);
    if (cached) {
      return {
        totalSeconds: cached.totalSeconds,
        eventCount: cached.eventCount,
        nextRefreshAt: cached.cachedAt + CHATGPT_CACHE_TTL_MS,
      };
    }
  }

  const buckets = await awGet<Record<string, AwBucket>>('/buckets/');
  const bucketIds = Object.entries(buckets)
    .filter(([bucketId, bucket]) => isBrowserBucket(bucketId, bucket))
    .map(([bucketId]) => bucketId);

  const period = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
  });
  const eventResults = await Promise.allSettled(
    bucketIds.map((bucketId) =>
      awGet<AwEvent[]>(`/buckets/${encodeURIComponent(bucketId)}/events?${period}`),
    ),
  );
  const eventLists = eventResults.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  );

  if (bucketIds.length > 0 && eventLists.length === 0) {
    throw new Error('Não foi possível consultar os eventos do ActivityWatch.');
  }

  let totalSeconds = 0;
  let eventCount = 0;

  for (const events of eventLists) {
    for (const event of events) {
      if (!isChatGptUrl(event.data?.url) || !eventMatchesBranch(event.data?.title, branch))
        continue;

      const timestamp = Date.parse(event.timestamp || '');
      const duration = Number(event.duration);
      if (!Number.isFinite(timestamp) || !Number.isFinite(duration) || duration <= 0) continue;

      const overlapMs = Math.max(
        0,
        Math.min(timestamp + duration * 1000, endMs) - Math.max(timestamp, startMs),
      );
      if (overlapMs <= 0) continue;

      totalSeconds += overlapMs / 1000;
      eventCount += 1;
    }
  }

  const cachedAt = Date.now();
  try {
    const cachedValue: CachedChatGptActivity = { totalSeconds, eventCount, cachedAt };
    sessionStorage.setItem(cacheKey, JSON.stringify(cachedValue));
  } catch {
    // A indisponibilidade do storage não deve impedir a consulta ao ActivityWatch.
  }

  return { totalSeconds, eventCount, nextRefreshAt: cachedAt + CHATGPT_CACHE_TTL_MS };
}
