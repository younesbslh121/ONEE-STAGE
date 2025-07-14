from marshmallow import Schema, fields, validate

class VehicleSchema(Schema):
    id = fields.Int(dump_only=True)
    license_plate = fields.Str(required=True, validate=validate.Length(min=1, max=20))
    brand = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    model = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    year = fields.Int()
    color = fields.Str(validate=validate.Length(max=30))
    fuel_type = fields.Str(validate=validate.OneOf(['gasoline', 'diesel', 'electric', 'hybrid']))
    status = fields.Str()
    current_latitude = fields.Float()
    current_longitude = fields.Float()
    last_location_update = fields.DateTime()
    driver_id = fields.Int()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    
class VehicleCreateSchema(Schema):
    license_plate = fields.Str(required=True, validate=validate.Length(min=1, max=20))
    brand = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    model = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    year = fields.Int()
    color = fields.Str(validate=validate.Length(max=30))
    fuel_type = fields.Str(validate=validate.OneOf(['gasoline', 'diesel', 'electric', 'hybrid']))
