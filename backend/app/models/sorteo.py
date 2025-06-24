from app import db

class Sorteo(db.Model):
    __tablename__ = 'sorteo'
    id = db.Column(db.Integer, primary_key=True)
    id_grupo = db.Column(db.Integer, db.ForeignKey('grupo.id'), nullable=False)
    fecha = db.Column(db.DateTime, nullable=False)
    id_profesor = db.Column(db.Integer, db.ForeignKey('profesor.id'), nullable=False)
    id_incidencia = db.Column(db.Integer, db.ForeignKey('incidencia.id'), nullable=False)
    id_alumno = db.Column(db.Integer, db.ForeignKey('alumno.id'), nullable=True)

    grupo = db.relationship('Grupo', backref='sorteos')
    profesor = db.relationship('Profesor', backref='sorteos')
    incidencia = db.relationship('Incidencia', backref='sorteos')
    alumno = db.relationship('Alumno', backref='sorteos')


