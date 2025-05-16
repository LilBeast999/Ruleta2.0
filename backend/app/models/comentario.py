from app import db

class Comentario(db.Model):
    __tablename__ = 'comentario'
    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.DateTime, nullable=False)
    descripcion = db.Column(db.Text, nullable=False)
    id_sorteo = db.Column(db.Integer, db.ForeignKey('sorteo.id'), nullable=False)
