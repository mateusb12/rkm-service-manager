"""OpenAPI schemas for the file storage feature."""

from marshmallow import Schema, fields, validate


class FileResponseSchema(Schema):
    id = fields.String(required=True)
    key = fields.String(required=True)
    name = fields.String(required=True)
    size = fields.Integer(required=True)
    etag = fields.String(required=True)
    content_type = fields.String(required=True, data_key="contentType")
    category = fields.String(required=True, allow_none=True)
    uploaded_by_id = fields.String(required=True, allow_none=True, data_key="uploadedById")
    uploaded_by = fields.String(required=True, allow_none=True, data_key="uploadedBy")
    uploaded_at = fields.DateTime(required=True, data_key="uploadedAt")


class FileUploadSchema(Schema):
    file = fields.Raw(required=True, metadata={"type": "string", "format": "binary"})
    category = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=80))


class StorageHealthSchema(Schema):
    status = fields.String(required=True)
    provider = fields.String(required=False)
    error = fields.String(required=False)
