from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from app.models.alumno import Alumno
from app.models.grupo import Grupo
from app import db

alumno_bp = Blueprint('alumno', __name__)

@alumno_bp.route('/alumnos', methods=['GET'])
@cross_origin()
def obtener_alumnos():
    try:
        # usar query más simple para evitar errores de join
        alumnos = Alumno.query.all()
        
        resultado = []
        for alumno in alumnos:
            # obtener grupo de forma segura
            grupo_nombre = None
            if alumno.id_grupo:
                try:
                    grupo = Grupo.query.get(alumno.id_grupo)
                    grupo_nombre = grupo.nombre if grupo else None
                except:
                    grupo_nombre = None
            
            resultado.append({
                'id': alumno.id,
                'nombre': alumno.nombre,
                'apellido': alumno.apellido,
                'grupo_id': alumno.id_grupo,
                'grupo_nombre': grupo_nombre
            })
        return jsonify(resultado), 200
    except Exception as e:
        print(f"Error en obtener_alumnos: {str(e)}")
        return jsonify({"error": f"Error obteniendo alumnos: {str(e)}"}), 500

@alumno_bp.route('/alumnos', methods=['POST'])
@cross_origin()
def crear_alumno():
    try:
        data = request.get_json()
        nombre = data.get('nombre')
        apellido = data.get('apellido')
        grupo_id = data.get('grupo_id')
        
        if not all([nombre, apellido]):
            return jsonify({"error": "Nombre y apellido son requeridos"}), 400
            
        # verificar que existe el grupo si se proporciona
        if grupo_id and not Grupo.query.get(grupo_id):
            return jsonify({"error": "Grupo no encontrado"}), 404
            
        # generar matrícula automática interna
        import time
        timestamp = int(time.time() * 1000) % 10000
        matricula_auto = f"{nombre[:3]}{apellido[:3]}{timestamp}".upper()
            
        nuevo_alumno = Alumno(
            nombre=nombre,
            apellido=apellido,
            matricula=matricula_auto,
            id_grupo=grupo_id if grupo_id else None
        )
        db.session.add(nuevo_alumno)
        db.session.commit()
        
        return jsonify({"message": "Alumno creado correctamente"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error creando alumno: {str(e)}"}), 500

@alumno_bp.route('/alumnos/<int:id>', methods=['PUT'])
@cross_origin()
def actualizar_alumno(id):
    try:
        alumno = Alumno.query.get(id)
        if not alumno:
            return jsonify({"error": "Alumno no encontrado"}), 404
            
        data = request.get_json()
        nombre = data.get('nombre')
        apellido = data.get('apellido')
        grupo_id = data.get('grupo_id')
        
        if not all([nombre, apellido]):
            return jsonify({"error": "Nombre y apellido son requeridos"}), 400
            
        # verificar que existe el grupo si se proporciona
        if grupo_id and not Grupo.query.get(grupo_id):
            return jsonify({"error": "Grupo no encontrado"}), 404
            
        alumno.nombre = nombre
        alumno.apellido = apellido
        alumno.id_grupo = grupo_id if grupo_id else None
        db.session.commit()
        
        return jsonify({"message": "Alumno actualizado correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error actualizando alumno: {str(e)}"}), 500

@alumno_bp.route('/alumnos/<int:id>', methods=['DELETE'])
@cross_origin()
def eliminar_alumno(id):
    try:
        alumno = Alumno.query.get(id)
        if not alumno:
            return jsonify({"error": "Alumno no encontrado"}), 404
            
        # verificar si tiene sorteos asociados de forma más segura
        try:
            if hasattr(alumno, 'sorteos') and alumno.sorteos:
                return jsonify({"error": "No se puede eliminar: tiene sorteos asociados"}), 409
        except Exception as check_error:
            print(f"Error verificando sorteos del alumno: {check_error}")
            
        db.session.delete(alumno)
        db.session.commit()
        
        return jsonify({"message": "Alumno eliminado correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error eliminando alumno: {str(e)}")
        return jsonify({"error": f"Error eliminando alumno: {str(e)}"}), 500
