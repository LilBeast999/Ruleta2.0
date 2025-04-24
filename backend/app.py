import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from flask_cors import CORS, cross_origin

# carga las variables para la base de datos desde el archivo .env
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# variables de entorno para la base de datos
DATABASE_USER = os.getenv("DATABASE_USER")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")
DATABASE_HOST = os.getenv("DATABASE_HOST")
DATABASE_NAME = os.getenv("DATABASE_NAME")

app.config["SQLALCHEMY_DATABASE_URI"] = f'postgresql://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}/{DATABASE_NAME}'
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# Definición del modelo de la tabla 'profesor'
class Profesor(db.Model):
    __tablename__ = 'profesor'
    rut = db.Column(db.String(50), primary_key=True)
    password = db.Column(db.String(128), nullable=False)
    nombre = db.Column(db.Text, nullable=False)
    apellido = db.Column(db.Text, nullable=False)
    codigo_recuperacion = db.Column(db.Text)

@app.route('/')
def home():
    return "¡Hola Mundo desde Flask!"

# API que recibe RUT y contraseña y consulta la base de datos para profesores
@app.route('/login', methods=['POST'])
@cross_origin()  # Asegura las cabeceras CORS
def login():
    data = request.get_json()
    rut = data.get("rut")
    password = data.get("password")
    
    if not rut or not password:
        return jsonify({"error": "Faltan datos requeridos"}), 400

    # consulta a la base de datos para verificar el RUT y la contraseña
    profesor = Profesor.query.filter_by(rut=rut, password=password).first()
    if profesor:
        return jsonify({"message": "Profesor autenticado correctamente"})
    else:
        return jsonify({"error": "Profesor o contraseña incorrectos"}), 401

if __name__ == '__main__':
    app.run(debug=True)