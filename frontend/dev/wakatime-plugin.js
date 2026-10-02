export function wakatimeDevPlugin() {
  const cache = new Map();
  const cacheTtlMs = 5 * 60 * 1000;

  const dateString = (date) => date.toISOString().slice(0, 10);

  const addDays = (value, count) => {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + count);
    return dateString(date);
  };

  const todayInTimezone = (timezone) => {
    const parts = Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const find = (type) => parts.find((part) => part.type === type)?.value;

    return `${find('year')}-${find('month')}-${find('day')}`;
  };

  return {
    name: 'rkm-local-wakatime',
    apply: 'serve',

    configureServer(server) {
      server.middlewares.use('/__dev/wakatime', async (req, res) => {
        const send = (status, payload) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify(payload));
        };

        if (req.method !== 'GET') {
          send(405, { error: 'Método não permitido.' });
          return;
        }

        const url = new URL(req.url || '/', 'http://localhost');
        const branch = url.searchParams.get('branch');

        if (
          !branch ||
          !/^[a-z0-9][a-z0-9._/-]*$/i.test(branch) ||
          branch.includes('..') ||
          branch.includes('//') ||
          branch.endsWith('/')
        ) {
          send(400, { error: 'Branch inválida.' });
          return;
        }

        const key = process.env.WAKATIME_API_KEY?.trim();

        if (!key) {
          send(503, {
            error: 'Configure WAKATIME_API_KEY no ambiente do Vite.',
          });
          return;
        }

        const project = process.env.WAKATIME_PROJECT || 'rkm-service-manager';

        const timezone = process.env.WAKATIME_TIMEZONE || 'America/Fortaleza';

        const start = process.env.WAKATIME_START_DATE || '2026-09-01';

        if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) {
          send(500, { error: 'WAKATIME_START_DATE inválida.' });
          return;
        }

        let today;

        try {
          today = todayInTimezone(timezone);
        } catch {
          send(500, { error: 'Timezone WakaTime inválida.' });
          return;
        }

        const cacheKey = [branch, project, timezone, start, today].join('|');

        const cached = cache.get(cacheKey);

        if (cached && Date.now() - cached.at < cacheTtlMs) {
          send(200, {
            ...cached.data,
            nextRefreshAt: cached.at + cacheTtlMs,
          });
          return;
        }

        try {
          let seconds = 0;
          const editorTotals = new Map();
          let cursor = start;

          while (cursor <= today) {
            const end = [addDays(cursor, 29), today].sort()[0];

            const params = new URLSearchParams({
              start: cursor,
              end,
              project,
              branches: branch,
              timezone,
            });

            const response = await fetch(
              `https://wakatime.com/api/v1/users/current/summaries?${params}`,
              {
                headers: {
                  Authorization: `Basic ${Buffer.from(key).toString('base64')}`,
                },
                signal: AbortSignal.timeout(15000),
              },
            );

            if (!response.ok) {
              throw new Error(`WakaTime retornou HTTP ${response.status}.`);
            }

            const payload = await response.json();

            if (!Array.isArray(payload.data)) {
              throw new Error('Resposta inesperada da API do WakaTime.');
            }

            for (const day of payload.data) {
              const value = Number(day.grand_total?.total_seconds ?? 0);

              if (!Number.isFinite(value) || value < 0) {
                throw new Error('Tempo inválido na resposta do WakaTime.');
              }

              seconds += value;

              for (const editor of day.editors || []) {
                const name = typeof editor.name === 'string' ? editor.name.trim() : '';

                const duration = Number(editor.total_seconds);

                if (!name || !Number.isFinite(duration) || duration < 0) {
                  continue;
                }

                editorTotals.set(name, (editorTotals.get(name) || 0) + duration);
              }
            }

            cursor = addDays(end, 1);
          }

          const data = {
            project,
            branch,
            start,
            end: today,
            totalSeconds: seconds,
            editors: [...editorTotals.entries()]
              .map(([name, totalSeconds]) => ({
                name,
                totalSeconds,
              }))
              .sort((a, b) => b.totalSeconds - a.totalSeconds),
          };

          const cachedAt = Date.now();
          cache.set(cacheKey, { at: cachedAt, data });

          send(200, {
            ...data,
            nextRefreshAt: cachedAt + cacheTtlMs,
          });
        } catch (error) {
          send(502, {
            error: error instanceof Error ? error.message : 'Falha na consulta ao WakaTime.',
          });
        }
      });
    },
  };
}
