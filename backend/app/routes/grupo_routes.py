from flask import Blueprint, jsonify
from app.models.grupo import Grupo
from app import db

grupo_bp = Blueprint('grupo', __name__)

@grupo_bp.route('/grupos', methods=['GET'])
def get_all_grupos():
    try:
        grupos = Grupo.query.all()  # Obtener todos los grupos
        grupos_list = [{"id": grupo.id, "nombre": grupo.nombre} for grupo in grupos]
        return jsonify(grupos_list), 200
    except Exception as e:
        return jsonify({"error": f"Error al obtener los grupos: {e}"}), 500

@grupo_bp.route('/grupo/<int:id>', methods=['GET'])
def get_grupo_by_id(id):
    try:
        grupo = Grupo.query.get(id)
        if grupo:
            alumnos = [{
                "id": alumno.id,
                "nombre": alumno.nombre,
                "apellido": alumno.apellido
            } for alumno in grupo.alumnos]

            return jsonify({
                "id": grupo.id,
                "nombre": grupo.nombre,
                "alumnos": alumnos
            }), 200
        else:
            return jsonify({"error": "Grupo no encontrado"}), 404
    except Exception as e:
        return jsonify({"error": f"Error al obtener el grupo: {e}"}), 500
