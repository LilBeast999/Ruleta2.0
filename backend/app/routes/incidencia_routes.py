from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from app.models.incidencia import Incidencia
from app.models.categoria import Categoria
from app import db

incidencia_bp = Blueprint('incidencia', __name__)

@incidencia_bp.route('/incidencias', methods=['GET'])
@cross_origin()
def obtener_incidencias():
    try:
        # usar query más simple para evitar errores
        incidencias = Incidencia.query.all()
        
        resultado = []
        for inc in incidencias:
            # obtener categoría de forma segura
            categoria_nombre = 'Sin categoría'
            try:
                if inc.id_categoria:
                    categoria = Categoria.query.get(inc.id_categoria)
                    categoria_nombre = categoria.nombre if categoria else 'Sin categoría'
            except:
                categoria_nombre = 'Sin categoría'
            
            resultado.append({
                'id': inc.id,
                'descripcion': inc.descripcion,
                'duracion': getattr(inc, 'duracion', 0) or 0,
                'categoria_id': inc.id_categoria,
                'categoria_nombre': categoria_nombre
            })
        return jsonify(resultado), 200
    except Exception as e:
        print(f"Error en obtener_incidencias: {str(e)}")
        return jsonify({"error": f"Error obteniendo incidencias: {str(e)}"}), 500

@incidencia_bp.route('/incidencias/categoria/<int:categoria_id>', methods=['GET'])
@cross_origin()
def obtener_incidencias_por_categoria(categoria_id):
    try:
        incidencias = Incidencia.query.filter_by(id_categoria=categoria_id).all()
        resultado = []
        for inc in incidencias:
            resultado.append({
                'id': inc.id,
                'descripcion': inc.descripcion,
                'duracion': inc.duracion,
                'categoria_id': inc.id_categoria
            })
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"error": f"Error obteniendo incidencias: {str(e)}"}), 500

@incidencia_bp.route('/incidencias', methods=['POST'])
@cross_origin()
def crear_incidencia():
    try:
        data = request.get_json()
        descripcion = data.get('descripcion')
        categoria_id = data.get('categoria_id')
        duracion = data.get('duracion', 0)
        
        if not descripcion or not categoria_id:
            return jsonify({"error": "Descripción y categoría son requeridos"}), 400
            
        # verificar que existe la categoría
        if not Categoria.query.get(categoria_id):
            return jsonify({"error": "Categoría no encontrada"}), 404
            
        nueva_incidencia = Incidencia(
            descripcion=descripcion,
            id_categoria=categoria_id,
            duracion=duracion
        )
        db.session.add(nueva_incidencia)
        db.session.commit()
        
        return jsonify({"message": "Incidencia creada correctamente"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error creando incidencia: {str(e)}"}), 500

@incidencia_bp.route('/incidencias/<int:id>', methods=['PUT'])
@cross_origin()
def actualizar_incidencia(id):
    try:
        incidencia = Incidencia.query.get(id)
        if not incidencia:
            return jsonify({"error": "Incidencia no encontrada"}), 404
            
        data = request.get_json()
        descripcion = data.get('descripcion')
        categoria_id = data.get('categoria_id')
        duracion = data.get('duracion', 0)
        
        if not descripcion or not categoria_id:
            return jsonify({"error": "Descripción y categoría son requeridos"}), 400
            
        # verificar que existe la categoría
        if not Categoria.query.get(categoria_id):
            return jsonify({"error": "Categoría no encontrada"}), 404
            
        incidencia.descripcion = descripcion
        incidencia.id_categoria = categoria_id
        incidencia.duracion = duracion
        db.session.commit()
        
        return jsonify({"message": "Incidencia actualizada correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error actualizando incidencia: {str(e)}"}), 500

@incidencia_bp.route('/incidencias/<int:id>', methods=['DELETE'])
@cross_origin()
def eliminar_incidencia(id):
    try:
        incidencia = Incidencia.query.get(id)
        if not incidencia:
            return jsonify({"error": "Incidencia no encontrada"}), 404
            
        # verificar si tiene sorteos asociados
        if incidencia.sorteos:
            return jsonify({"error": "No se puede eliminar: tiene sorteos asociados"}), 409
            
        db.session.delete(incidencia)
        db.session.commit()
        
        return jsonify({"message": "Incidencia eliminada correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error eliminando incidencia: {str(e)}"}), 500
