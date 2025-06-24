from app import db

class Grupo(db.Model):
    __tablename__ = 'grupo'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    id_proyecto1 = db.Column(db.Integer, db.ForeignKey('proyecto.id'), nullable=True)
    id_proyecto2 = db.Column(db.Integer, db.ForeignKey('proyecto.id'), nullable=True)
    
    # Relaciones
    proyecto1 = db.relationship('Proyecto', foreign_keys=[id_proyecto1])
    proyecto2 = db.relationship('Proyecto', foreign_keys=[id_proyecto2])