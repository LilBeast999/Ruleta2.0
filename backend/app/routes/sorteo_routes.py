from flask import Blueprint, request, jsonify
from app.models.sorteo import Sorteo
from app.models.grupo import Grupo
from app.models.incidencia import Incidencia
from app.models.categoria import Categoria
from app.models.comentario import Comentario
from app.models.alumno import Alumno
from app.models.profesor import Profesor
from app import db
from datetime import datetime, date
from sqlalchemy import text

sorteo_bp = Blueprint('sorteo', __name__)

@sorteo_bp.route('/sorteo', methods=['POST'])
def crear_sorteo():
    data = request.get_json()

    id_grupo = data.get('id_grupo')
    fecha_str = data.get('fecha')
    id_profesor = data.get('id_profesor')
    id_incidencia = data.get('id_incidencia')
    id_alumno = data.get('id_alumno')
    
    # Datos opcionales para el comentario
    comentario_desc = data.get('comentario')
    comentario_fecha_str = data.get('comentario_fecha')
    
    if not all([id_grupo, fecha_str, id_profesor, id_incidencia]):
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    # validación: si no existe el profesor con el id enviado, se usa o crea un profesor dummy
    profesor = Profesor.query.get(id_profesor)
    if not profesor:
        dummy = Profesor.query.filter_by(rut="dummy").first()
        if dummy:
            id_profesor = dummy.id
        else:
            dummy_profesor = Profesor(
                rut="dummy",
                password="dummy",
                nombre="Dummy",
                apellido="Professor",
                codigo_recuperacion="dummy"
            )
            db.session.add(dummy_profesor)
            db.session.flush()
            id_profesor = dummy_profesor.id

    try:
        # Usar fecha actual sin zona horaria
        ahora = datetime.now()
        
        nuevo_sorteo = Sorteo(
            id_grupo=id_grupo,
            fecha=ahora,
            id_profesor=id_profesor,
            id_incidencia=id_incidencia,
            id_alumno=id_alumno
        )
        db.session.add(nuevo_sorteo)
        db.session.flush()

        # si se envía comentario, usar también fecha actual
        if comentario_desc:
            comentario_fecha = datetime.now()
            
            nuevo_comentario = Comentario(
                descripcion=comentario_desc,
                fecha=comentario_fecha,
                id_sorteo=nuevo_sorteo.id
            )
            db.session.add(nuevo_comentario)

        db.session.commit()
        return jsonify({"message": "Sorteo creado exitosamente"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al crear el sorteo: {e}"}), 500

@sorteo_bp.route('/sorteos', methods=['GET'])
def obtener_sorteos():
    try:
        # Se reciben los parámetros opcionales
        fecha_inicio_str = request.args.get('fecha_inicio')
        fecha_termino_str = request.args.get('fecha_termino')
        grupo_nombre = request.args.get('grupo')

        # Se definen filtros dinámicos
        filtros = []
        if fecha_inicio_str:
            try:
                fecha_inicio = datetime.fromisoformat(fecha_inicio_str)
                filtros.append(Sorteo.fecha >= fecha_inicio)
            except Exception as e:
                return jsonify({"error": f"Formato de fecha_inicio inválido: {e}"}), 400
        if fecha_termino_str:
            try:
                fecha_termino = datetime.fromisoformat(fecha_termino_str)
                filtros.append(Sorteo.fecha <= fecha_termino)
            except Exception as e:
                return jsonify({"error": f"Formato de fecha_termino inválido: {e}"}), 400
        if grupo_nombre:
            # Se usa % para búsquedas parciales
            filtros.append(Grupo.nombre.ilike(f"%{grupo_nombre}%"))

        # Se arma la query con los joins y un outerjoin con Alumno
        query = db.session.query(
            Sorteo,
            Grupo,
            Incidencia,
            Categoria,
            Comentario,
            Alumno
        ).join(
            Grupo, Sorteo.id_grupo == Grupo.id
        ).join(
            Incidencia, Sorteo.id_incidencia == Incidencia.id
        ).join(
            Categoria, Incidencia.id_categoria == Categoria.id
        ).outerjoin(
            Comentario, Comentario.id_sorteo == Sorteo.id
        ).outerjoin(
            Alumno, Sorteo.id_alumno == Alumno.id
        )

        if filtros:
            query = query.filter(*filtros)

        registros = query.all()
        resultado = []
        for registro in registros:
            s, grupo, incidencia, categoria, comentario, alumno = registro
            comentario_texto = comentario.descripcion if comentario else ""
            
            # Formatear fecha como string directamente sin zona horaria
            fecha_formateada = s.fecha.strftime("%Y-%m-%d %H:%M:%S")
            
            # Se agrega el alumno solo si existe
            alumno_data = {
                "id": alumno.id,
                "nombre": alumno.nombre,
                "apellido": alumno.apellido
            } if alumno else None

            resultado.append({
                "id": s.id,
                "grupo": grupo.nombre,
                "tipoIncidente": categoria.nombre,
                "incidente": incidencia.descripcion,
                "fecha": fecha_formateada,
                "comentario": comentario_texto,
                "expandido": False,
                "alumno": alumno_data
            })
        return jsonify(resultado), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al obtener sorteos: {e}"}), 500

@sorteo_bp.route('/sorteo/<int:id>', methods=['GET'])
def obtener_sorteo_por_id(id):
    try:
        sorteo = Sorteo.query.get(id)
        if not sorteo:
            return jsonify({"error": "Sorteo no encontrado"}), 404

        resultado = {
            "id": sorteo.id,
            "fecha": sorteo.fecha.strftime("%Y-%m-%d %H:%M:%S"),
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

@sorteo_bp.route('/sorteos/hoy', methods=['GET'])
def obtener_sorteos_hoy():
    """Obtiene todos los sorteos realizados hoy agrupados por grupo"""
    try:
        # Usar fecha actual del servidor para determinar "hoy"
        hoy = date.today()
        
        # Crear rangos de tiempo para el día actual
        inicio_dia = datetime.combine(hoy, datetime.min.time())
        fin_dia = datetime.combine(hoy, datetime.max.time())
        
        # Consultar sorteos de hoy con información del grupo
        sorteos_hoy = db.session.query(
            Sorteo.id_grupo,
            Grupo.nombre.label('grupo_nombre'),
            db.func.count(Sorteo.id).label('cantidad_sorteos'),
            db.func.max(Sorteo.fecha).label('ultimo_sorteo')
        ).join(
            Grupo, Sorteo.id_grupo == Grupo.id
        ).filter(
            Sorteo.fecha >= inicio_dia,
            Sorteo.fecha <= fin_dia
        ).group_by(
            Sorteo.id_grupo, Grupo.nombre
        ).all()
        
        resultado = []
        for sorteo in sorteos_hoy:
            # Formatear fecha como string
            ultimo_sorteo_str = None
            if sorteo.ultimo_sorteo:
                ultimo_sorteo_str = sorteo.ultimo_sorteo.strftime("%Y-%m-%d %H:%M:%S")
            
            resultado.append({
                'id_grupo': sorteo.id_grupo,
                'grupo_nombre': sorteo.grupo_nombre,
                'cantidad_sorteos': sorteo.cantidad_sorteos,
                'ultimo_sorteo': ultimo_sorteo_str
            })
        
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"error": f"Error obteniendo sorteos de hoy: {str(e)}"}), 500

@sorteo_bp.route('/sorteos/clear-all', methods=['DELETE'])
def eliminar_todos_sorteos():
    """Elimina todos los sorteos y comentarios de la base de datos"""
    try:
        # Eliminar en orden de dependencias
        comentarios_eliminados = Comentario.query.count()
        if comentarios_eliminados > 0:
            db.session.execute(text("DELETE FROM comentario"))
        
        sorteos_eliminados = Sorteo.query.count()
        if sorteos_eliminados > 0:
            db.session.execute(text("DELETE FROM sorteo"))
        
        # Reiniciar secuencias de IDs
        try:
            db.session.execute(text("ALTER SEQUENCE sorteo_id_seq RESTART WITH 1"))
            db.session.execute(text("ALTER SEQUENCE comentario_id_seq RESTART WITH 1"))
        except Exception as seq_error:
            print(f"Advertencia al reiniciar secuencias: {seq_error}")
        
        db.session.commit()
        
        return jsonify({
            "message": "Todos los sorteos eliminados correctamente",
            "stats": {
                "sorteos_eliminados": sorteos_eliminados,
                "comentarios_eliminados": comentarios_eliminados
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error eliminando sorteos: {str(e)}"}), 500