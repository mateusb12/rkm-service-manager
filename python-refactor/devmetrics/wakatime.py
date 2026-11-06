"""WakaTime integration used by the development metrics feature."""

from __future__ import annotations

import json
import os
import re
import time
from datetime import datetime, timedelta
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


_BRANCH_PATTERN = re.compile(r"^[a-z0-9][a-z0-9._/-]*$", re.IGNORECASE)
_DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_CACHE_TTL_SECONDS = 5 * 60
_METRIC_CACHE: dict[tuple[str, str, str, str, str], tuple[float, float, tuple[tuple[str, float], ...]]] = {}


class WakaTimeError(Exception):
    """Expected integration error that can be returned to the API client."""

    def __init__(self, message: str, status_code: int = 502) -> None:
        super().__init__(message)
        self.status_code = status_code


def _add_days(value: str, count: int) -> str:
    date = datetime.strptime(value, "%Y-%m-%d").date() + timedelta(days=count)
    return date.isoformat()


def _today(timezone_name: str) -> str:
    try:
        timezone_info = ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError as error:
        raise WakaTimeError("Timezone WakaTime inválida.", 500) from error
    return datetime.now(timezone_info).date().isoformat()


def _authorization() -> str:
    access_token = os.getenv("WAKATIME_ACCESS_TOKEN", "").strip()
    if not access_token:
        raise WakaTimeError("Configure WAKATIME_ACCESS_TOKEN no ambiente do backend.", 503)
    return f"Bearer {access_token}"


def _request_summary(parameters: dict[str, str], authorization: str) -> dict:
    query = urlencode(parameters)
    request = Request(
        f"https://wakatime.com/api/v1/users/current/summaries?{query}",
        headers={"Authorization": authorization, "Accept": "application/json"},
    )
    try:
        with urlopen(request, timeout=15) as response:
            payload = json.load(response)
    except HTTPError as error:
        raise WakaTimeError(f"WakaTime retornou HTTP {error.code}.") from error
    except (URLError, TimeoutError, OSError) as error:
        raise WakaTimeError("Falha na consulta ao WakaTime.") from error

    if not isinstance(payload.get("data"), list):
        raise WakaTimeError("Resposta inesperada da API do WakaTime.")
    return payload


def _fetch_metric(cache_key: tuple[str, str, str, str, str]) -> tuple[float, tuple[tuple[str, float], ...]]:
    branch, project, start, today, timezone_name = cache_key
    authorization = _authorization()
    seconds = 0.0
    editors: dict[str, float] = {}
    cursor = start

    while cursor <= today:
        end = min(_add_days(cursor, 29), today)
        payload = _request_summary(
            {
                "start": cursor,
                "end": end,
                "project": project,
                "branches": branch,
                "timezone": timezone_name,
            },
            authorization,
        )
        for day in payload["data"]:
            value = float(day.get("grand_total", {}).get("total_seconds", 0))
            if value < 0:
                raise WakaTimeError("Tempo inválido na resposta do WakaTime.")
            seconds += value
            for editor in day.get("editors", []):
                name = str(editor.get("name", "")).strip()
                duration = float(editor.get("total_seconds", 0))
                if name and duration >= 0:
                    editors[name] = editors.get(name, 0) + duration
        cursor = _add_days(end, 1)

    return seconds, tuple(sorted(editors.items(), key=lambda item: item[1], reverse=True))


def get_wakatime_metric(
    branch: str,
    project: str,
    start: str,
    timezone_name: str,
    force_refresh: bool = False,
) -> dict:
    branch = branch.strip()
    if not branch or not _BRANCH_PATTERN.fullmatch(branch) or ".." in branch or "//" in branch or branch.endswith("/"):
        raise WakaTimeError("Branch inválida.", 400)

    project = project.strip()
    start = start.strip()
    timezone_name = timezone_name.strip()
    if not project:
        raise WakaTimeError("Projeto WakaTime não informado.", 400)
    if not _DATE_PATTERN.fullmatch(start):
        raise WakaTimeError("Data inicial do WakaTime inválida.", 400)

    today = _today(timezone_name)
    cache_key = (branch, project, start, today, timezone_name)
    if force_refresh:
        _METRIC_CACHE.pop(cache_key, None)

    cached = _METRIC_CACHE.get(cache_key)
    if cached and time.time() - cached[0] < _CACHE_TTL_SECONDS:
        seconds, editor_totals = cached[1], cached[2]
    else:
        seconds, editor_totals = _fetch_metric(cache_key)
        _METRIC_CACHE[cache_key] = (time.time(), seconds, editor_totals)
    return {
        "project": project,
        "branch": branch,
        "start": start,
        "end": today,
        "totalSeconds": seconds,
        "editors": [{"name": name, "totalSeconds": total} for name, total in editor_totals],
        "nextRefreshAt": int((time.time() + _CACHE_TTL_SECONDS) * 1000),
    }
