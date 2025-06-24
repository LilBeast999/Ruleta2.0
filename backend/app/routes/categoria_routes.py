from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from app.models.categoria import Categoria
from app import db

categoria_bp = Blueprint('categoria', __name__)

# Endpoint para obtener todas las categorías
@categoria_bp.route('/categorias', methods=['GET'])
@cross_origin()
def obtener_categorias():
    try:
        categorias = Categoria.query.all()
        
        resultado = []
        for cat in categorias:
            resultado.append({
                'id': cat.id,
                'nombre': cat.nombre
            })
        return jsonify(resultado), 200
    except Exception as e:
        print(f"Error en obtener_categorias: {str(e)}")
        return jsonify({"error": f"Error obteniendo categorías: {str(e)}"}), 500

@categoria_bp.route('/categorias', methods=['POST'])
@cross_origin()
def crear_categoria():
    try:
        data = request.get_json()
        nombre = data.get('nombre')
        
        if not nombre:
            return jsonify({"error": "El nombre es requerido"}), 400
            
        # verificar si ya existe
        if Categoria.query.filter_by(nombre=nombre).first():
            return jsonify({"error": "Ya existe una categoría con ese nombre"}), 409
            
        nueva_categoria = Categoria(nombre=nombre)
        db.session.add(nueva_categoria)
        db.session.commit()
        
        return jsonify({"message": "Categoría creada correctamente"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error creando categoría: {str(e)}"}), 500

@categoria_bp.route('/categorias/<int:id>', methods=['PUT'])
@cross_origin()
def actualizar_categoria(id):
    try:
        categoria = Categoria.query.get(id)
        if not categoria:
            return jsonify({"error": "Categoría no encontrada"}), 404
            
        data = request.get_json()
        nombre = data.get('nombre')
        
        if not nombre:
            return jsonify({"error": "El nombre es requerido"}), 400
            
        # verificar nombre único (excluyendo la actual)
        existing = Categoria.query.filter(Categoria.nombre == nombre, Categoria.id != id).first()
        if existing:
            return jsonify({"error": "Ya existe una categoría con ese nombre"}), 409
            
        categoria.nombre = nombre
        db.session.commit()
        
        return jsonify({"message": "Categoría actualizada correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error actualizando categoría: {str(e)}"}), 500

@categoria_bp.route('/categorias/<int:id>', methods=['DELETE'])
@cross_origin()
def eliminar_categoria(id):
    try:
        categoria = Categoria.query.get(id)
        if not categoria:
            return jsonify({"error": "Categoría no encontrada"}), 404
            
        # verificar si tiene incidencias asociadas
        if categoria.incidencias:
            return jsonify({"error": "No se puede eliminar: tiene incidencias asociadas"}), 409
            
        db.session.delete(categoria)
        db.session.commit()
        
        return jsonify({"message": "Categoría eliminada correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error eliminando categoría: {str(e)}"}), 500
