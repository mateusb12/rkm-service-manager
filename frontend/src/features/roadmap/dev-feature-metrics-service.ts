import { apiRequest } from '../../shared/api/http';
import { getChatGptActivity } from './chatgpt-activity-service';

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
  chatGptSeconds?: number;
  localSeconds?: number;
};

export type FeatureMetricDraft = {
  featureId: string;
  branch: string;
  wakatimeSeconds: number;
  chatGptSeconds: number;
  localSeconds: number;
  editors: EditorTime[];
};

export type DevFeatureMetric = FeatureMetricDraft & {
  estimatedHours: number | null;
  functionPoints: number | null;
  locked: boolean;
  completedAt: number;
  updatedAt: number;
};

export type DevFeatureSettings = {
  branch?: string;
  estimatedHours?: number | null;
  functionPoints?: number | null;
};

async function readJSON<T>(response: Response, fallbackMessage: string): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ({ error?: string } & T) | null;

  if (!response.ok) {
    throw new Error(payload?.error || fallbackMessage);
  }

  return payload as T;
}

export async function saveFeatureSettings(
  featureId: string,
  settings: DevFeatureSettings,
): Promise<DevFeatureMetric> {
  const response = await apiRequest('/dev/feature-metrics/settings', {
    method: 'PUT',
    body: JSON.stringify({ featureId, ...settings }),
  });

  return readJSON<DevFeatureMetric>(
    response,
    'Não foi possível salvar as configurações da feature.',
  );
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
    body: JSON.stringify(input),
  });

  return readJSON<DevFeatureMetric>(response, 'Não foi possível congelar a métrica.');
}

export async function unlockFeatureMetric(featureId: string): Promise<DevFeatureMetric> {
  const response = await apiRequest('/dev/feature-metrics/unlock', {
    method: 'POST',
    body: JSON.stringify({ featureId }),
  });

  return readJSON<DevFeatureMetric>(response, 'Não foi possível reabrir a métrica.');
}

export async function getLiveFeatureMetric(
  featureId: string,
  branch: string,
  signal?: AbortSignal,
): Promise<FeatureMetricDraft> {
  const query = new URLSearchParams({ branch });
  const wakatimeResponse = await fetch(`/__dev/wakatime?${query}`, { signal });
  const wakatimeResult = (await wakatimeResponse.json()) as {
    totalSeconds?: number;
    editors?: EditorTime[];
    error?: string;
  };

  if (!wakatimeResponse.ok) {
    throw new Error(wakatimeResult.error || 'Falha ao consultar WakaTime.');
  }

  const wakatimeSeconds = Number(wakatimeResult.totalSeconds);
  if (!Number.isFinite(wakatimeSeconds) || wakatimeSeconds < 0) {
    throw new Error('Tempo retornado pelo WakaTime é inválido.');
  }

  let chatGptSeconds = 0;
  let localSeconds = 0;

  try {
    const activity = await getChatGptActivity(branch, false, undefined, undefined, signal);
    chatGptSeconds = activity.chatGptSeconds;
    localSeconds = activity.localSeconds;
  } catch {
    // WakaTime continua sendo suficiente para exibir a duração local.
  }

  return {
    featureId,
    branch,
    wakatimeSeconds,
    chatGptSeconds,
    localSeconds,
    editors: Array.isArray(wakatimeResult.editors) ? wakatimeResult.editors : [],
  };
}
