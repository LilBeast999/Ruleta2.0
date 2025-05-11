from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from app.models.profesor import Profesor
from app import db

profesor_bp = Blueprint('profesor', __name__)

@profesor_bp.route('/login', methods=['POST'])
@cross_origin()
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

@profesor_bp.route('/register', methods=['POST'])
@cross_origin()
def register():
    data = request.get_json()
    rut = data.get("rut")
    password = data.get("password")
    nombre = data.get("nombre")
    apellido = data.get("apellido")
    codigo_recuperacion = data.get("codigo_recuperacion")

    if not (rut and password and nombre and apellido):
        return jsonify({"error": "Faltan datos requeridos para el registro"}), 400

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
