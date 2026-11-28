"""Server-owned repair assignment and execution transitions."""

from __future__ import annotations

from datetime import datetime, timezone


def _budget_line_references(payload):
    for item in payload.get("disassemblyChecklist") or []:
        if item.get("status") != "Não conforme":
            continue
        if item.get("component") == "Vedação":
            lines = item.get("budgetItems") or ([item] if item.get("budgetItem") else [])
            for index, line in enumerate(lines):
                if str(line.get("budgetItem") or "").strip():
                    yield item, line, index
        elif str(item.get("budgetItem") or "").strip():
            yield item, item, 0


def _user_reference(user):
    return {"id": user.id, "name": user.name}


def _completion_signature(payload):
    return {
        (item.get("component"), index): (line.get("repairCompletedAt"), line.get("repairCompletedBy"))
        for item, line, index in _budget_line_references(payload)
        if line.get("repairCompletedAt") or line.get("repairCompletedBy")
    }


def _budget_signature(payload):
    return [
        (
            item.get("component"),
            index,
            line.get("budgetItem"),
            line.get("budgetItemId"),
            line.get("budgetUnit"),
            line.get("budgetUnitPriceCents"),
            line.get("budgetQuantity"),
            bool(line.get("stockReceived")),
        )
        for item, line, index in _budget_line_references(payload)
    ]


def apply_repair_transition(existing, incoming, user, current_stage, requested_stage):
    """Apply repair assignment, start, and per-budget-line completion actions."""
    action = incoming.pop("repairAction", None)
    component = incoming.pop("repairComponent", None)
    line_index = incoming.pop("repairLineIndex", None)
    old = existing or {}

    if action in {"assign_mechanic", "start", "complete_item"} and current_stage != "reparo":
        return "repair_stage_required"

    server_fields = ("repairMechanicAssignedAt", "repairMechanicAssignedBy", "repairStartedAt", "repairTimingVersion", "repairCompletedAt")
    if any((incoming.get(field) or None) != (old.get(field) or None) for field in server_fields):
        return "repair_transition_requires_action"
    if _completion_signature(incoming) != _completion_signature(old):
        return "repair_transition_requires_action"

    if old.get("repairMechanicAssignedAt") and incoming.get("repairMechanic") != old.get("repairMechanic"):
        return "repair_mechanic_locked"
    if old.get("repairTimingVersion") and _budget_signature(incoming) != _budget_signature(old):
        return "repair_budget_locked"
    if old.get("repairTimingVersion") and incoming.get("repairStartedAt") != old.get("repairStartedAt"):
        return "repair_start_locked"

    now = datetime.now(timezone.utc).isoformat()
    if action == "assign_mechanic":
        if old.get("repairMechanicAssignedAt"):
            return "repair_mechanic_already_assigned"
        if not str(incoming.get("repairMechanic") or "").strip():
            return "repair_mechanic_required"
        incoming["repairMechanicAssignedAt"] = now
        incoming["repairMechanicAssignedBy"] = _user_reference(user)

    elif action == "start":
        if not incoming.get("repairMechanicAssignedAt") or not str(incoming.get("repairMechanic") or "").strip():
            return "repair_mechanic_required"
        if incoming.get("repairTimingVersion"):
            return "repair_already_started"
        incoming["repairStartedAt"] = now
        incoming["repairTimingVersion"] = 1

    elif action == "complete_item":
        if not incoming.get("repairTimingVersion"):
            return "repair_not_started"
        if not isinstance(line_index, int) or line_index < 0:
            return "invalid_repair_item"
        checklist = incoming.get("disassemblyChecklist") or []
        target = next((item for item in checklist if item.get("component") == component), None)
        if not target or target.get("status") != "Não conforme":
            return "invalid_repair_item"
        if component == "Vedação":
            lines = target.get("budgetItems") or ([target] if target.get("budgetItem") else [])
            if line_index >= len(lines):
                return "invalid_repair_item"
            line = lines[line_index]
        elif line_index == 0:
            line = target
        else:
            return "invalid_repair_item"
        if not str(line.get("budgetItem") or "").strip():
            return "invalid_repair_item"
        if line.get("repairCompletedAt"):
            return "repair_item_already_completed"
        line["repairCompletedAt"] = now
        line["repairCompletedBy"] = _user_reference(user)

    lines = list(_budget_line_references(incoming))
    all_items_completed = bool(lines) and all(line.get("repairCompletedAt") for _, line, _ in lines)
    if all_items_completed and user.role in {"admin", "mechanic"}:
        incoming["repairCompletedAt"] = incoming.get("repairCompletedAt") or now
        incoming["stage"] = "entrega"
        incoming["status"] = "Em entrega"
    elif requested_stage == "entrega" and current_stage == "reparo":
        return "repair_incomplete"

    return None
