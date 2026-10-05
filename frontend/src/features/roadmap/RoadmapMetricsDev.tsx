import { useEffect, useMemo, useRef, useState } from 'react';

import { DurationPicker } from '../../utils/DurationPicker';
import { FunctionPointsDev } from './FunctionPointsDev';
import { getChatGptActivity } from './chatgpt-activity-service';
import {
  getPersistedFeatureMetric,
  readBranches,
  type ChatGptEntry,
  type FeatureMetricDraft,
  type WakatimeEntry,
} from './dev-feature-metrics-service';

type RoadmapMetricsDevProps = {
  featureId: string;
  defaultBranch: string;
  completed: boolean;
  onLiveMetricChange: (featureId: string, metric: FeatureMetricDraft | null) => void;
};

type HoursMap = Record<string, { estimated?: string; actual?: string }>;
type BranchMap = Record<string, string>;
const STORAGE_KEY = 'rkm:private-dev-hours';

function readHours() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

const WAKATIME_RETRY_MS = 30 * 1000;

function formatActivityDuration(seconds: number) {
  const roundedSeconds = Math.round(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainder = roundedSeconds % 60;
  return minutes > 0 ? `${minutes}min ${remainder}s` : `${remainder}s`;
}

function WakatimeCountdown({ nextAt }: { nextAt: number | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(timer);
  }, []);

  if (!nextAt) return 'Aguardando sincronização...';

  const remaining = Math.max(0, Math.ceil((nextAt - now) / 1000));

  if (remaining === 0) {
    return 'Atualizando em instantes...';
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, '0');

  return `Próxima consulta em ${minutes}m${seconds}s`;
}

export default function RoadmapMetricsDev({
  featureId,
  defaultBranch,
  completed,
  onLiveMetricChange,
}: RoadmapMetricsDevProps) {
  const [hours, setHours] = useState<HoursMap>(readHours);
  const [branches, setBranches] = useState<BranchMap>(readBranches);
  const [branchDraft, setBranchDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [wakatimeHours, setWakatimeHours] = useState<Record<string, WakatimeEntry>>({});
  const [chatGptActivity, setChatGptActivity] = useState<Record<string, ChatGptEntry>>({});
  const [nextWakatimeSyncAt, setNextWakatimeSyncAt] = useState<number | null>(null);
  const [manualRefreshKey, setManualRefreshKey] = useState(0);
  const handledManualRefresh = useRef(0);

  const activeBranch = branches[featureId] || defaultBranch;
  const editors = useMemo(
    () => wakatimeHours[featureId]?.editors ?? [],
    [featureId, wakatimeHours],
  );
  const chatGptEntry = chatGptActivity[featureId];
  const wakatimeSeconds = wakatimeHours[featureId]?.totalSeconds;
  const totalTrackedSeconds =
    wakatimeSeconds == null ? null : wakatimeSeconds + (chatGptEntry?.totalSeconds ?? 0);
  const totalTrackedMinutes =
    totalTrackedSeconds == null ? null : Math.round(totalTrackedSeconds / 60);
  const activityRows: Array<{ name: string; seconds?: number; chatGpt?: boolean }> = [
    ...editors.map((editor) => ({ name: editor.name, seconds: editor.totalSeconds })),
    ...(chatGptEntry
      ? [{ name: 'ChatGPT', seconds: chatGptEntry.totalSeconds, chatGpt: true }]
      : []),
  ].sort((first, second) => (second.seconds ?? -1) - (first.seconds ?? -1));

  useEffect(() => {
    if (
      completed ||
      !featureId ||
      wakatimeSeconds == null ||
      !Number.isFinite(wakatimeSeconds) ||
      wakatimeSeconds < 0
    ) {
      onLiveMetricChange(featureId, null);
      return;
    }

    const chatGptSeconds = chatGptEntry?.totalSeconds ?? 0;

    if (!Number.isFinite(chatGptSeconds) || chatGptSeconds < 0) {
      onLiveMetricChange(featureId, null);
      return;
    }

    onLiveMetricChange(featureId, {
      featureId,
      branch: activeBranch,
      wakatimeSeconds,
      chatGptSeconds,
      editors,
    });
  }, [
    activeBranch,
    chatGptEntry?.totalSeconds,
    completed,
    editors,
    featureId,
    onLiveMetricChange,
    wakatimeSeconds,
  ]);

  useEffect(() => {
    if (completed) setEditing(false);
  }, [completed]);

  useEffect(() => {
    if (!completed || !featureId) return;

    let cancelled = false;
    const requestAbortController = new AbortController();

    void getPersistedFeatureMetric(featureId, requestAbortController.signal)
      .then((metric) => {
        if (cancelled || !metric || !metric.locked) {
          return;
        }

        const nextWakatimeEntry: WakatimeEntry = {
          loading: false,
          error: '',
          minutes: Math.round(metric.wakatimeSeconds / 60),
          totalSeconds: metric.wakatimeSeconds,
          editors: metric.editors,
        };

        const nextChatGptEntry: ChatGptEntry = {
          loading: false,
          error: '',
          totalSeconds: metric.chatGptSeconds,
        };

        setBranches((previous) => ({
          ...previous,
          [featureId]: metric.branch,
        }));

        setWakatimeHours((previous) => ({
          ...previous,
          [featureId]: nextWakatimeEntry,
        }));

        setChatGptActivity((previous) => ({
          ...previous,
          [featureId]: nextChatGptEntry,
        }));
      })
      .catch((error) => {
        if (cancelled || error instanceof DOMException) {
          return;
        }

        console.error('Erro ao carregar métrica congelada:', error);
      });

    return () => {
      cancelled = true;
      requestAbortController.abort();
    };
  }, [featureId, completed]);

  useEffect(() => {
    if (!featureId || completed) {
      setNextWakatimeSyncAt(null);
      return;
    }

    let cancelled = false;
    let timer: number | undefined;
    let chatGptTimer: number | undefined;
    const requestAbortController = new AbortController();
    const forceRefresh = manualRefreshKey !== handledManualRefresh.current;
    handledManualRefresh.current = manualRefreshKey;

    async function refreshChatGpt(force = false) {
      if (cancelled || requestAbortController.signal.aborted) {
        return;
      }

      setChatGptActivity((previous) => ({
        ...previous,
        [featureId]: { ...previous[featureId], loading: true, error: '' },
      }));

      try {
        const result = await getChatGptActivity(
          activeBranch,
          force,
          undefined,
          undefined,
          requestAbortController.signal,
        );
        if (cancelled) return;

        const nextChatGptEntry: ChatGptEntry = {
          loading: false,
          totalSeconds: result.totalSeconds,
        };

        setChatGptActivity((previous) => ({
          ...previous,
          [featureId]: nextChatGptEntry,
        }));

        const delay = Math.max(1000, result.nextRefreshAt - Date.now() + 250);
        chatGptTimer = window.setTimeout(refreshChatGpt, delay);
      } catch (error) {
        if (cancelled) return;

        setChatGptActivity((previous) => ({
          ...previous,
          [featureId]: {
            loading: false,
            error: error instanceof Error ? error.message : 'ActivityWatch indisponível.',
          },
        }));
        chatGptTimer = window.setTimeout(refreshChatGpt, WAKATIME_RETRY_MS);
      }
    }

    async function refresh(force = false) {
      if (cancelled || requestAbortController.signal.aborted) {
        return;
      }

      setWakatimeHours((previous) => ({
        ...previous,
        [featureId]: {
          ...previous[featureId],
          loading: true,
          error: '',
        },
      }));

      try {
        const query = new URLSearchParams({ branch: activeBranch });
        if (force) query.set('refresh', '1');
        const response = await fetch(`/__dev/wakatime?${query}`, {
          signal: requestAbortController.signal,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Falha ao consultar WakaTime.');
        }

        const seconds = Number(result.totalSeconds);
        const nextAt = Number(result.nextRefreshAt);

        if (!Number.isFinite(seconds) || seconds < 0) {
          throw new Error('Tempo retornado é inválido.');
        }

        if (!Number.isFinite(nextAt) || nextAt <= 0) {
          throw new Error('Validade do cache não informada.');
        }

        if (cancelled) return;

        const nextWakatimeEntry: WakatimeEntry = {
          loading: false,
          error: '',
          minutes: Math.round(seconds / 60),
          totalSeconds: seconds,
          editors: Array.isArray(result.editors) ? result.editors : [],
        };

        setWakatimeHours((previous) => ({
          ...previous,
          [featureId]: nextWakatimeEntry,
        }));

        setNextWakatimeSyncAt(nextAt);

        timer = window.setTimeout(refresh, Math.max(1000, nextAt - Date.now() + 250));
      } catch (error) {
        if (cancelled) return;

        setWakatimeHours((previous) => ({
          ...previous,
          [featureId]: {
            ...previous[featureId],
            loading: false,
            error: error instanceof Error ? error.message : 'WakaTime indisponível.',
          },
        }));

        const retryAt = Date.now() + WAKATIME_RETRY_MS;
        setNextWakatimeSyncAt(retryAt);

        timer = window.setTimeout(refresh, WAKATIME_RETRY_MS);
      }
    }

    setNextWakatimeSyncAt(null);
    void refreshChatGpt(forceRefresh);
    refresh(forceRefresh);

    return () => {
      cancelled = true;
      requestAbortController.abort();
      window.clearTimeout(timer);
      window.clearTimeout(chatGptTimer);
    };
  }, [featureId, activeBranch, completed, manualRefreshKey]);

  const recordHours = (id: string, field: 'estimated', value: string) => {
    // RKM_LOCK_COMPLETED_HOURS_V1
    if (completed) return;

    const next = {
      ...hours,
      [id]: { ...hours[id], [field]: value },
    };

    setHours(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const saveBranch = (id: string) => {
    const branch = branchDraft.trim();
    if (!branch) return;

    const next = { ...branches, [id]: branch };
    try {
      localStorage.setItem(BRANCH_STORAGE_KEY, JSON.stringify(next));
      setBranches(next);
      setEditing(false);
    } catch (error) {
      console.error('Erro ao salvar branch:', error);
    }
  };

  return (
    <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-amber-300">HORAS · APENAS LOCALHOST</span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setManualRefreshKey((key) => key + 1)}
            disabled={Boolean(
              completed || wakatimeHours[featureId]?.loading || chatGptEntry?.loading,
            )}
            title="Atualizar tempos agora"
            aria-label="Atualizar tempos agora"
            className="rounded-md border border-amber-400/30 p-1.5 text-amber-200 hover:bg-amber-400/10 disabled:cursor-wait disabled:opacity-60"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className={`h-4 w-4 ${wakatimeHours[featureId]?.loading || chatGptEntry?.loading ? 'animate-spin' : ''}`}
            >
              <path
                d="M16.5 6.5V3.75m0 0h-2.75m2.75 0-2.1 2.1a6 6 0 1 0 1.3 5.9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            disabled={Boolean(completed)}
            onClick={() => {
              if (editing) {
                setEditing(false);
              } else {
                setBranchDraft(branches[featureId] || defaultBranch);
                setEditing(true);
              }
            }}
            className="rounded-md border border-amber-400/30 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {completed ? '🔒 Reabra para editar' : editing ? '✓ Concluir' : '✎ Editar'}
          </button>
        </div>
      </div>

      <div className="mb-3 border-t border-amber-400/20 pt-3">
        <FunctionPointsDev featureId={featureId} editable={!completed && editing} />
      </div>

      {editing && (
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <label className="min-w-0 flex-1 text-xs text-slate-400">
            Branch WakaTime
            <input
              value={branchDraft}
              onChange={(event) => setBranchDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') saveBranch(featureId);
              }}
              className="mt-1 w-full rounded-md border border-rkmborder bg-rkmcard2 px-3 py-2 text-sm text-slate-200"
              placeholder={defaultBranch}
            />
          </label>
          <button
            type="button"
            onClick={() => saveBranch(featureId)}
            className="rounded-md border border-sky-400/30 px-3 py-2 text-xs font-medium text-sky-200 hover:bg-sky-400/10"
          >
            Salvar branch
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <DurationPicker
          label="Estimativa inicial"
          mode={!completed && editing ? 'edit' : 'locked'}
          minutes={
            hours[featureId]?.estimated == null || hours[featureId]?.estimated === ''
              ? null
              : Math.round(Number(hours[featureId].estimated) * 60)
          }
          onChange={(value) =>
            recordHours(featureId, 'estimated', value === null ? '' : String(value / 60))
          }
        />

        <div className="space-y-2">
          <DurationPicker
            label="Tempo real · WakaTime + ChatGPT"
            mode="locked"
            minutes={totalTrackedMinutes}
            onChange={() => undefined}
          >
            {activityRows.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-xs text-slate-400">
                {activityRows.map((row) => (
                  <li
                    key={row.name}
                    title={row.chatGpt ? chatGptEntry?.error || undefined : undefined}
                  >
                    <span className="text-slate-300">{row.name}</span>
                    {' — '}
                    {!completed && row.chatGpt && chatGptEntry?.loading
                      ? 'consultando...'
                      : row.seconds != null
                        ? formatActivityDuration(row.seconds)
                        : row.chatGpt && chatGptEntry?.error
                          ? 'indisponível'
                          : '—'}
                  </li>
                ))}
              </ul>
            )}
          </DurationPicker>

          <p
            role="status"
            className={`text-xs ${
              completed
                ? 'text-emerald-300'
                : wakatimeHours[featureId]?.error
                  ? 'text-rose-300'
                  : 'text-slate-400'
            }`}
          >
            {completed
              ? 'Congelado — feature concluída.'
              : wakatimeHours[featureId]?.error ||
                (wakatimeHours[featureId]?.loading ? (
                  'Sincronizando com WakaTime...'
                ) : (
                  <WakatimeCountdown nextAt={nextWakatimeSyncAt} />
                ))}
          </p>
        </div>

        <div className="rounded-lg border border-rkmborder p-2 text-sm text-slate-300 sm:col-span-2 w-full">
          Desvio:{' '}
          {hours[featureId]?.estimated !== undefined &&
          hours[featureId]?.estimated !== '' &&
          totalTrackedSeconds != null
            ? `${(totalTrackedSeconds / 3600 - Number(hours[featureId].estimated)).toFixed(2)} h`
            : '—'}
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Estimativa local. WakaTime e ChatGPT por branch desde 01/09/2026.
      </p>
    </div>
  );
}
