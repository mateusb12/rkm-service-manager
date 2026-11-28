"""Server-owned disassembly transitions inside the existing OS document."""

from datetime import datetime, timezone
from math import isfinite


DIMENSIONS = (
    "cylinderInternalDiameter", "cylinderExternalDiameter", "cylinderLength",
    "cylinderStroke", "cylinderRodDiameter",
)
TECHNICAL_FIELDS = ("component", "status", "notes", "firstAssessedAt", "confirmedAt", "confirmedBy")


def is_cylinder(payload):
    return payload.get("orderType") in {"Cilindro", "Cilindro hidráulico", "Cilindro pneumático"}


def _valid_dimensions(payload):
    try:
        return all(isfinite(float(payload.get(field) or 0)) and float(payload.get(field) or 0) > 0 for field in DIMENSIONS)
    except (TypeError, ValueError):
        return False


def _technical_equal(old, new):
    return all(old.get(key) == new.get(key) for key in TECHNICAL_FIELDS)


def _evaluation_equal(old, new):
    return all(old.get(key) == new.get(key) for key in ("component", "status", "firstAssessedAt", "confirmedAt", "confirmedBy"))


def _photo(payload, index):
    return (payload.get("photos") or {}).get(f"disassemblyChecklist-{index}", [])


def apply_disassembly_transition(existing, incoming, user, current_stage, requested_stage):
    """Return an error code or normalize a single, atomic technical transition."""
    action = incoming.pop("disassemblyAction", None)
    index = incoming.pop("disassemblyIndex", None)
    old = existing or {}
    active = bool(old.get("disassemblyTimingVersion"))
    for position, before in enumerate(old.get("disassemblyChecklist") or []):
        if before.get("confirmedAt"):
            incoming_items = incoming.get("disassemblyChecklist") or []
            if (position >= len(incoming_items) or not _evaluation_equal(before, incoming_items[position])
                    or (current_stage != "desmontagem" and (before.get("notes") != incoming_items[position].get("notes")
                        or _photo(old, position) != _photo(incoming, position)))):
                return "confirmed_evaluation_locked"
    if active and incoming.get("orderType") != old.get("orderType"):
        return "disassembly_preparation_locked"
    if not is_cylinder(incoming):
        if action:
            return "disassembly_not_cylinder"
        return None

    # Historical orders beyond disassembly keep their original timestamps and progress.
    if current_stage in {"orcamento", "reparo", "entrega"} and not active:
        if action:
            return "legacy_disassembly_read_only"
        return None

    if action == "start":
        if current_stage != "desmontagem" or requested_stage != "desmontagem":
            return "disassembly_stage_required"
        if active:
            return "disassembly_already_started"
        items = incoming.get("disassemblyChecklist") or []
        selected = incoming.get("cylinderOptionalItems") or []
        if (not incoming.get("disassemblyOperator") or not _valid_dimensions(incoming)
                or not selected or [item.get("component") for item in items] != selected
                or len(set(selected)) != len(selected)):
            return "disassembly_preparation_incomplete"
        if old.get("cylinderOptionalItems") and selected != old["cylinderOptionalItems"]:
            return "disassembly_checklist_locked"
        old_items = old.get("disassemblyChecklist") or []
        if (any(item.get("firstAssessedAt") or item.get("confirmedAt") or item.get("confirmedBy") for item in items)
                or (old_items and (len(old_items) != len(items)
                    or any(not _technical_equal(before, after) for before, after in zip(old_items, items))))
                or (not old_items and any(item.get("status") for item in items))):
            return "evaluation_before_start"
        incoming["disassemblyStartedAt"] = datetime.now(timezone.utc).isoformat()
        incoming["disassemblyEndedAt"] = ""
        incoming["disassemblyComplete"] = False
        incoming["disassemblyTimingVersion"] = 1
        return None

    if not active:
        incoming.pop("disassemblyTimingVersion", None)
        if current_stage == "desmontagem" and requested_stage != "desmontagem":
            return "disassembly_incomplete"
        if ((incoming.get("disassemblyStartedAt") or "") != (old.get("disassemblyStartedAt") or "")
                or (incoming.get("disassemblyEndedAt") or "") != (old.get("disassemblyEndedAt") or "")
                or bool(incoming.get("disassemblyComplete")) != bool(old.get("disassemblyComplete"))):
            return "disassembly_completion_locked"
        if action:
            return "evaluation_before_start"
        before_items = old.get("disassemblyChecklist") or []
        after_items = incoming.get("disassemblyChecklist") or []
        if current_stage in {"recebimento", "identificacao"} and not any(
            item.get("status") or item.get("firstAssessedAt") or item.get("confirmedAt")
            for item in [*before_items, *after_items]
        ):
            return None
        if (len(before_items) != len(after_items) and any(item.get("status") for item in after_items)
                or len(before_items) == len(after_items) and any(
                    not _technical_equal(before, after) for before, after in zip(before_items, after_items))
                or any(_photo(old, index) != _photo(incoming, index) for index in range(max(len(before_items), len(after_items))))):
            return "evaluation_before_start"
        # Old in-progress orders may carry a fictitious start from the old form.
        return None

    if (incoming.get("cylinderOptionalItems") != old.get("cylinderOptionalItems")
            or any(incoming.get(field) != old.get(field) for field in DIMENSIONS)
            or incoming.get("disassemblyOperator") != old.get("disassemblyOperator")
            or incoming.get("disassemblyStartedAt") != old.get("disassemblyStartedAt")):
        return "disassembly_preparation_locked"
    previous = old.get("disassemblyChecklist") or []
    items = incoming.get("disassemblyChecklist") or []
    if len(previous) != len(items) or [item.get("component") for item in items] != [item.get("component") for item in previous]:
        return "disassembly_checklist_locked"
    if incoming.get("disassemblyEndedAt") != old.get("disassemblyEndedAt") or incoming.get("disassemblyComplete") != old.get("disassemblyComplete"):
        return "disassembly_completion_locked"
    if action not in {None, "assess"}:
        return "invalid_disassembly_action"
    if action is not None and (not isinstance(index, int) or isinstance(index, bool) or index < 0 or index >= len(items)):
        return "invalid_disassembly_index"

    for position, (before, after) in enumerate(zip(previous, items)):
        if before.get("confirmedAt"):
            if (not _evaluation_equal(before, after)
                    or (current_stage != "desmontagem" and (before.get("notes") != after.get("notes")
                        or _photo(old, position) != _photo(incoming, position)))):
                return "confirmed_evaluation_locked"
        elif position != index or action is None:
            if before.get("firstAssessedAt") and not before.get("confirmedAt"):
                if (after.get("firstAssessedAt") != before.get("firstAssessedAt")
                        or after.get("confirmedAt") or after.get("confirmedBy")):
                    return "evaluation_requires_action"
            elif not _technical_equal(before, after) or _photo(old, position) != _photo(incoming, position):
                return "evaluation_requires_action"

    if action == "assess":
        before, after = previous[index], items[index]
        if before.get("confirmedAt") or after.get("status") not in {"Conforme", "Não conforme"}:
            return "invalid_assessment"
        if before.get("firstAssessedAt") and before.get("status") != after.get("status"):
            return "invalid_assessment"
        if before.get("status") and not before.get("firstAssessedAt") and before.get("status") != after.get("status"):
            return "invalid_assessment"
        now = datetime.now(timezone.utc).isoformat()
        after["firstAssessedAt"] = before.get("firstAssessedAt") or now
        after["confirmedAt"] = now
        after["confirmedBy"] = {"id": user.id, "name": user.name}
        if all(item.get("confirmedAt") for item in items):
            incoming["disassemblyEndedAt"] = now
            incoming["disassemblyComplete"] = True

    if requested_stage != "desmontagem" and current_stage == "desmontagem":
        if not incoming.get("disassemblyComplete"):
            return "disassembly_incomplete"
        if any(item.get("status") == "Não conforme" and not str(item.get("notes") or "").strip() for item in items):
            return "justification_required"
    incoming["disassemblyTimingVersion"] = 1
    return None
