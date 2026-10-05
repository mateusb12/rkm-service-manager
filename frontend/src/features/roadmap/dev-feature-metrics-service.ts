import { apiRequest, csrfHeaders } from '../../shared/api/http';

export type EditorTime = {
  name: string;
  totalSeconds: number;
};

export type WakatimeEntry = {
  loading?: boolean;
  error?: string;
  minutes?: number | null;
  totalSeconds?: number;
  editors?: EditorTime[];
};

export type ChatGptEntry = {
  loading?: boolean;
  error?: string;
  totalSeconds?: number;
};

export type FeatureMetricDraft = {
  featureId: string;
  branch: string;
  wakatimeSeconds: number;
  chatGptSeconds: number;
  editors: EditorTime[];
};

export type DevFeatureMetric = FeatureMetricDraft & {
  locked: boolean;
  completedAt: number;
  updatedAt: number;
};

const BRANCH_STORAGE_KEY = 'rkm:private-dev-branches';

export function readBranches(): Record<string, string> {
  try {
    const value = JSON.parse(localStorage.getItem(BRANCH_STORAGE_KEY) || '{}');

    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

async function readJSON<T>(response: Response, fallbackMessage: string): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ({ error?: string } & T) | null;

  if (!response.ok) {
    throw new Error(payload?.error || fallbackMessage);
  }

  return payload as T;
}

export async function listPersistedFeatureMetrics(): Promise<DevFeatureMetric[]> {
  const response = await apiRequest('/dev/feature-metrics');

  return readJSON<DevFeatureMetric[]>(
    response,
    'Não foi possível carregar as métricas persistidas.',
  );
}

export async function getPersistedFeatureMetric(
  featureId: string,
  signal?: AbortSignal,
): Promise<DevFeatureMetric | null> {
  const response = await apiRequest(
    `/dev/feature-metrics?feature=${encodeURIComponent(featureId)}`,
    { signal },
  );

  if (response.status === 404) {
    return null;
  }

  return readJSON<DevFeatureMetric>(response, 'Não foi possível carregar a métrica persistida.');
}

export async function freezeFeatureMetric(input: FeatureMetricDraft): Promise<DevFeatureMetric> {
  const response = await apiRequest('/dev/feature-metrics/freeze', {
    method: 'POST',
    headers: csrfHeaders(),
    body: JSON.stringify(input),
  });

  return readJSON<DevFeatureMetric>(response, 'Não foi possível congelar a métrica.');
}

export async function unlockFeatureMetric(featureId: string): Promise<DevFeatureMetric> {
  const response = await apiRequest('/dev/feature-metrics/unlock', {
    method: 'POST',
    headers: csrfHeaders(),
    body: JSON.stringify({ featureId }),
  });

  return readJSON<DevFeatureMetric>(response, 'Não foi possível reabrir a métrica.');
}
