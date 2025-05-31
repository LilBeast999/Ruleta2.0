from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from app.models.grupo import Grupo
from app.models.alumno import Alumno
from app.models.proyecto import Proyecto
from app import db

grupo_bp = Blueprint('grupo', __name__)

@grupo_bp.route('/grupos', methods=['GET'])
@cross_origin()
def obtener_grupos():
    try:
        grupos = Grupo.query.all()
        resultado = []
        for grupo in grupos:
            # obtener nombres de proyectos de forma segura
            proyecto1_nombre = None
            proyecto2_nombre = None
            
            if grupo.id_proyecto1:
                try:
                    proyecto1 = Proyecto.query.get(grupo.id_proyecto1)
                    proyecto1_nombre = proyecto1.nombre if proyecto1 else None
                except:
                    proyecto1_nombre = None
                    
            if grupo.id_proyecto2:
                try:
                    proyecto2 = Proyecto.query.get(grupo.id_proyecto2)
                    proyecto2_nombre = proyecto2.nombre if proyecto2 else None
                except:
                    proyecto2_nombre = None
            
            resultado.append({
                'id': grupo.id,
                'nombre': grupo.nombre,
                'id_proyecto1': grupo.id_proyecto1,
                'id_proyecto2': grupo.id_proyecto2,
                'proyecto1_nombre': proyecto1_nombre,
                'proyecto2_nombre': proyecto2_nombre
            })
        return jsonify(resultado), 200
    except Exception as e:
        print(f"Error en obtener_grupos: {str(e)}")
        return jsonify({"error": f"Error obteniendo grupos: {str(e)}"}), 500

@grupo_bp.route('/grupo/<int:id>', methods=['GET'])
@cross_origin()
def obtener_grupo_con_alumnos(id):
    try:
        grupo = Grupo.query.get(id)
        if not grupo:
            return jsonify({"error": "Grupo no encontrado"}), 404
            
        alumnos = Alumno.query.filter_by(id_grupo=id).all()
        
        resultado = {
            'id': grupo.id,
            'nombre': grupo.nombre,
            'alumnos': [{
                'id': alumno.id,
                'nombre': alumno.nombre,
                'apellido': alumno.apellido
            } for alumno in alumnos]
        }
        return jsonify(resultado), 200
    except Exception as e:
        print(f"Error en obtener_grupo_con_alumnos: {str(e)}")
        return jsonify({"error": f"Error obteniendo grupo: {str(e)}"}), 500

@grupo_bp.route('/grupos', methods=['POST'])
@cross_origin()
def crear_grupo():
    try:
        data = request.get_json()
        nombre = data.get('nombre')
        
        if not nombre:
            return jsonify({"error": "El nombre es requerido"}), 400
            
        # verificar si ya existe
        if Grupo.query.filter_by(nombre=nombre).first():
            return jsonify({"error": "Ya existe un grupo con ese nombre"}), 409
            
        nuevo_grupo = Grupo(nombre=nombre)
        db.session.add(nuevo_grupo)
        db.session.commit()
        
        return jsonify({"message": "Grupo creado correctamente"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error creando grupo: {str(e)}"}), 500

@grupo_bp.route('/grupos/<int:id>', methods=['PUT'])
@cross_origin()
def actualizar_grupo(id):
    try:
        grupo = Grupo.query.get(id)
        if not grupo:
            return jsonify({"error": "Grupo no encontrado"}), 404
            
        data = request.get_json()
        nombre = data.get('nombre')
        
        if not nombre:
            return jsonify({"error": "El nombre es requerido"}), 400
            
        # verificar nombre único (excluyendo el actual)
        existing = Grupo.query.filter(Grupo.nombre == nombre, Grupo.id != id).first()
        if existing:
            return jsonify({"error": "Ya existe un grupo con ese nombre"}), 409
            
        grupo.nombre = nombre
        db.session.commit()
        
        return jsonify({"message": "Grupo actualizado correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error actualizando grupo: {str(e)}"}), 500

@grupo_bp.route('/grupos/<int:id>', methods=['DELETE'])
@cross_origin()
def eliminar_grupo(id):
    try:
        grupo = Grupo.query.get(id)
        if not grupo:
            return jsonify({"error": "Grupo no encontrado"}), 404
            
        # verificar si tiene alumnos asociados de forma más segura
        try:
            alumnos_relacionados = Alumno.query.filter_by(id_grupo=id).all()
            if alumnos_relacionados:
                return jsonify({"error": "No se puede eliminar: tiene alumnos asociados"}), 409
        except Exception as check_error:
            print(f"Error verificando alumnos: {check_error}")
            
        # verificar si tiene sorteos asociados de forma más segura  
        try:
            if hasattr(grupo, 'sorteos') and grupo.sorteos:
                return jsonify({"error": "No se puede eliminar: tiene sorteos asociados"}), 409
        except Exception as check_error:
            print(f"Error verificando sorteos: {check_error}")
            
        db.session.delete(grupo)
        db.session.commit()
        
        return jsonify({"message": "Grupo eliminado correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error eliminando grupo: {str(e)}")
        return jsonify({"error": f"Error eliminando grupo: {str(e)}"}), 500



