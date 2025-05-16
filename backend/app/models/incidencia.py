from app import db

class Incidencia(db.Model):
    __tablename__ = 'incidencia'
    id = db.Column(db.Integer, primary_key=True)
    id_categoria = db.Column(db.Integer, db.ForeignKey('categoria.id'), nullable=False)
    duracion = db.Column(db.Integer, nullable=False)
    descripcion = db.Column(db.Text, nullable=False)
