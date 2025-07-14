from marshmallow import Schema, fields, validate

class AnomalySchema(Schema):
    id = fields.Int(dump_only=True)
    type = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    description = fields.Str(required=True)
    severity = fields.Str(validate=validate.OneOf(['low', 'medium', 'high', 'critical']))
    detected_at = fields.DateTime()
    vehicle_id = fields.Int(required=True)
    mission_id = fields.Int()
    created_at = fields.DateTime(dump_only=True)
