from flask import Blueprint, request, jsonify
from app.models.sorteo import Sorteo
from app import db
from datetime import datetime

sorteo_bp = Blueprint('sorteo', __name__)

@sorteo_bp.route('/sorteo', methods=['POST'])
def crear_sorteo():
    data = request.get_json()

    id_grupo = data.get('id_grupo')
    fecha_str = data.get('fecha')
    id_profesor = data.get('id_profesor')
    id_incidencia = data.get('id_incidencia')
    id_alumno = data.get('id_alumno')

    if not all([id_grupo, fecha_str, id_profesor, id_incidencia, id_alumno]):
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    try:
        fecha = datetime.fromisoformat(fecha_str)
        nuevo_sorteo = Sorteo(
            id_grupo=id_grupo,
            fecha=fecha,
            id_profesor=id_profesor,
            id_incidencia=id_incidencia,
            id_alumno=id_alumno
        )
        db.session.add(nuevo_sorteo)
        db.session.commit()
        return jsonify({"message": "Sorteo creado exitosamente"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al crear el sorteo: {e}"}), 500

@sorteo_bp.route('/sorteos', methods=['GET'])
def obtener_sorteos():
    try:
        sorteos = Sorteo.query.all()
        resultado = []
        for s in sorteos:
            resultado.append({
                "id": s.id,
                "id_grupo": s.id_grupo,
                "fecha": s.fecha.isoformat(),
                "id_profesor": s.id_profesor,
                "id_incidencia": s.id_incidencia,
                "id_alumno": s.id_alumno
            })
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"error": f"Error al obtener sorteos: {e}"}), 500

@sorteo_bp.route('/sorteo/<int:id>', methods=['GET'])
def obtener_sorteo_por_id(id):
    try:
        sorteo = Sorteo.query.get(id)
        if not sorteo:
            return jsonify({"error": "Sorteo no encontrado"}), 404

        resultado = {
            "id": sorteo.id,
            "fecha": sorteo.fecha.isoformat(),
            "grupo": {
                "id": sorteo.grupo.id,
                "nombre": sorteo.grupo.nombre
            },
            "profesor": {
                "id": sorteo.profesor.id,
                "nombre": sorteo.profesor.nombre,
                "apellido": sorteo.profesor.apellido
            },
            "incidencia": {
                "id": sorteo.incidencia.id,
                "descripcion": sorteo.incidencia.descripcion,
                "duracion": sorteo.incidencia.duracion
            },
            "alumno": {
                "id": sorteo.alumno.id,
                "nombre": sorteo.alumno.nombre,
                "apellido": sorteo.alumno.apellido
            }
        }

        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"error": f"Error al obtener sorteo: {e}"}), 500