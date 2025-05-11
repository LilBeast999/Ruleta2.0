from app import db

class Alumno(db.Model):
    __tablename__ = 'alumno'
    id = db.Column(db.Integer, primary_key=True)
    matricula = db.Column(db.String(12), nullable=False)
    nombre = db.Column(db.String(100), nullable=False)
    apellido = db.Column(db.String(100), nullable=False)
    id_grupo = db.Column(db.Integer, db.ForeignKey('grupo.id'), nullable=True)
