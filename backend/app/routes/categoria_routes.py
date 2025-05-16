from flask import Blueprint, jsonify
from app.models.categoria import Categoria
from app import db

categoria_bp = Blueprint('categoria', __name__)

# Endpoint para obtener todas las categorías
@categoria_bp.route('/categorias', methods=['GET'])
def obtener_categorias():
    try:
        categorias = Categoria.query.all()  # Obtiene todas las categorías de la base de datos
        
        # Si no hay categorías en la base de datos, retornar un mensaje adecuado
        if not categorias:
            return jsonify({"message": "No hay categorías disponibles"}), 404
        
        # Convertir las categorías a un formato serializado (una lista de diccionarios)
        categorias_data = [{"id": categoria.id, "nombre": categoria.nombre} for categoria in categorias]

        return jsonify(categorias_data), 200
    except Exception as e:
        # Si ocurre algún error, retornar un mensaje con el error
        return jsonify({"error": str(e)}), 500
