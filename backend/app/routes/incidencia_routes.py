from flask import Blueprint, jsonify, request
from app.models.incidencia import Incidencia
from app import db

incidencia_bp = Blueprint('incidencia', __name__)

@incidencia_bp.route('/incidencias/categoria/<int:id_categoria>', methods=['GET'])
def get_incidencias_por_categoria(id_categoria):
    try:
        incidencias = Incidencia.query.filter_by(id_categoria=id_categoria).all()
        resultado = [
            {
                "id": inc.id,
                "id_categoria": inc.id_categoria,
                "duracion": inc.duracion,
                "descripcion": inc.descripcion
            }
            for inc in incidencias
        ]
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"error": f"Error al obtener las incidencias: {e}"}), 500
