from marshmallow import Schema, fields

class LocationSchema(Schema):
    id = fields.Int(dump_only=True)
    latitude = fields.Float(required=True)
    longitude = fields.Float(required=True)
    altitude = fields.Float()
    speed = fields.Float()
    heading = fields.Float()
    accuracy = fields.Float()
    timestamp = fields.DateTime()
    vehicle_id = fields.Int(required=True)
    mission_id = fields.Int()
    created_at = fields.DateTime(dump_only=True)

class LocationCreateSchema(Schema):
    latitude = fields.Float(required=True)
    longitude = fields.Float(required=True)
    altitude = fields.Float()
    speed = fields.Float()
    heading = fields.Float()
    accuracy = fields.Float()
    vehicle_id = fields.Int(required=True)
    mission_id = fields.Int()
