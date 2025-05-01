import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from flask_cors import CORS, cross_origin
from sqlalchemy import text

# Carga las variables para la base de datos desde el archivo .env
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise Exception("No se encontró DATABASE_URL en el archivo .env")

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# verificar la conexión dentro del contexto de la aplicación
with app.app_context():
    try:
        with db.engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            # Si deseas ver el resultado, puedes imprimirlo:
            print("base de datos conectada exitosamente")
    except Exception as e:
        raise Exception(f"No se pudo conectar a la base de datos: {e}")

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

    profesor = Profesor.query.filter_by(rut=rut, password=password).first()
    if profesor:
        return jsonify({"message": "Profesor autenticado correctamente"})
    else:
        return jsonify({"error": "Profesor o contraseña incorrectos"}), 401

@app.route('/register', methods=['POST'])
@cross_origin()
def register():
    data = request.get_json()
    rut = data.get("rut")
    password = data.get("password")
    nombre = data.get("nombre")
    apellido = data.get("apellido")
    codigo_recuperacion = data.get("codigo_recuperacion")  # Opcional

    if not (rut and password and nombre and apellido):
        return jsonify({"error": "Faltan datos requeridos para el registro"}), 400

    # verifica si ya existe un profesor con el mismo RUT
    if Profesor.query.filter_by(rut=rut).first():
        return jsonify({"error": "El profesor ya está registrado"}), 409

    try:
        nuevo_profesor = Profesor(
            rut=rut,
            password=password,
            nombre=nombre,
            apellido=apellido,
            codigo_recuperacion=codigo_recuperacion
        )
        db.session.add(nuevo_profesor)
        db.session.commit()
        return jsonify({"message": "Profesor registrado correctamente"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al registrar profesor: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True)