"""OpenAPI schemas generated from the SQLAlchemy entities."""

from __future__ import annotations

import re

from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

try:
    from ..features.auth.model import AuthSession, User
    from ..features.clients.model import Client
    from ..features.devmetrics.model import FeatureMetric
    from ..features.file_storage.model import File
except ImportError:
    from features.auth.model import AuthSession, User
    from features.clients.model import Client
    from features.devmetrics.model import FeatureMetric
    from features.file_storage.model import File


def _camel_case(value: str) -> str:
    return re.sub(r"_([a-z])", lambda match: match.group(1).upper(), value)


class EntityAutoSchema(SQLAlchemyAutoSchema):
    """Generate an entity schema and expose fields in the API's camelCase style."""

    class Meta:
        load_instance = False
        include_fk = True

    def on_bind_field(self, field_name, field):
        field.data_key = _camel_case(field_name)


class UserEntitySchema(EntityAutoSchema):
    class Meta(EntityAutoSchema.Meta):
        model = User
        exclude = ("password_hash",)


class AuthSessionEntitySchema(EntityAutoSchema):
    class Meta(EntityAutoSchema.Meta):
        model = AuthSession
        exclude = ("access_hash", "refresh_hash")


class ClientEntitySchema(EntityAutoSchema):
    class Meta(EntityAutoSchema.Meta):
        model = Client


class FeatureMetricEntitySchema(EntityAutoSchema):
    class Meta(EntityAutoSchema.Meta):
        model = FeatureMetric


class FileEntitySchema(EntityAutoSchema):
    class Meta(EntityAutoSchema.Meta):
        model = File


ENTITY_SCHEMAS = {
    "User": UserEntitySchema,
    "AuthSession": AuthSessionEntitySchema,
    "Client": ClientEntitySchema,
    "FeatureMetricEntity": FeatureMetricEntitySchema,
    "File": FileEntitySchema,
}
