"""Marshmallow schemas for development metrics."""

from __future__ import annotations

from marshmallow import Schema, fields, missing, validate


SECONDS = validate.Range(min=0)


class EditorTimeSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=120))
    total_seconds = fields.Float(required=True, data_key="totalSeconds", validate=SECONDS)


class FeatureMetricSchema(Schema):
    feature_id = fields.String(required=True, data_key="featureId")
    branch = fields.String(required=True)
    description = fields.String(required=True)
    estimated_hours = fields.Float(allow_none=True, data_key="estimatedHours")
    function_points = fields.Integer(allow_none=True, data_key="functionPoints")
    wakatime_seconds = fields.Float(required=True, data_key="wakatimeSeconds")
    chatgpt_seconds = fields.Float(required=True, data_key="chatGptSeconds")
    local_seconds = fields.Float(required=True, data_key="localSeconds")
    editors = fields.List(fields.Nested(EditorTimeSchema), required=True)
    locked = fields.Boolean(required=True)
    completed_at = fields.Integer(required=True, data_key="completedAt")
    updated_at = fields.Integer(required=True, data_key="updatedAt")


class FreezeMetricSchema(Schema):
    feature_id = fields.String(required=True, data_key="featureId", validate=validate.Length(min=1, max=160))
    branch = fields.String(required=True, validate=validate.Length(min=1, max=200))
    wakatime_seconds = fields.Float(required=True, data_key="wakatimeSeconds", validate=SECONDS)
    chatgpt_seconds = fields.Float(required=True, data_key="chatGptSeconds", validate=SECONDS)
    local_seconds = fields.Float(required=True, data_key="localSeconds", validate=SECONDS)
    editors = fields.List(fields.Nested(EditorTimeSchema), required=True)


class FeatureSettingsSchema(Schema):
    feature_id = fields.String(required=True, data_key="featureId", validate=validate.Length(min=1, max=160))
    branch = fields.String(allow_none=True, load_default=missing, validate=validate.Length(max=200))
    estimated_hours = fields.Float(allow_none=True, load_default=missing, data_key="estimatedHours", validate=SECONDS)
    function_points = fields.Integer(allow_none=True, load_default=missing, data_key="functionPoints", validate=SECONDS)


class UnlockMetricSchema(Schema):
    feature_id = fields.String(required=True, data_key="featureId", validate=validate.Length(min=1, max=160))


class WakaTimeQuerySchema(Schema):
    branch = fields.String(required=True, validate=validate.Length(min=1, max=200))
    project = fields.String(required=True, validate=validate.Length(min=1, max=200))
    start_date = fields.String(
        required=True,
        data_key="startDate",
        validate=validate.Regexp(r"^\d{4}-\d{2}-\d{2}$"),
    )
    timezone = fields.String(required=True, validate=validate.Length(min=1, max=100))
    refresh = fields.Boolean(load_default=False)
