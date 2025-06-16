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
import pytz

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
        # Manejo mejorado de fechas con zona horaria de Chile
        chile_tz = pytz.timezone('America/Santiago')
        
        # Si no se proporciona fecha, usar la actual
        if not fecha_str:
            fecha = datetime.now(chile_tz)
        else:
            try:
                # Intentar parsear la fecha ISO
                if fecha_str.endswith('Z'):
                    fecha_str = fecha_str[:-1] + '+00:00'
                
                fecha_utc = datetime.fromisoformat(fecha_str.replace('Z', '+00:00'))
                if fecha_utc.tzinfo is None:
                    # Si no tiene zona horaria, asumir que es hora local de Chile
                    fecha = chile_tz.localize(fecha_utc)
                else:
                    # Convertir a zona horaria de Chile
                    fecha = fecha_utc.astimezone(chile_tz)
                    
            except (ValueError, TypeError) as e:
                # Usar fecha actual como fallback
                fecha = datetime.now(chile_tz)
        
        # Convertir a UTC para almacenar en base de datos
        fecha_utc = fecha.astimezone(pytz.UTC)
        
        nuevo_sorteo = Sorteo(
            id_grupo=id_grupo,
            fecha=fecha_utc.replace(tzinfo=None),  # Almacenar como naive UTC
            id_profesor=id_profesor,
            id_incidencia=id_incidencia,
            id_alumno=id_alumno
        )
        db.session.add(nuevo_sorteo)
        db.session.flush()

        # si se envía comentario, se crea su registro asociado
        if comentario_desc and comentario_fecha_str:
            try:
                # Procesar fecha del comentario de la misma manera
                if not comentario_fecha_str:
                    comentario_fecha = datetime.now(chile_tz)
                else:
                    if comentario_fecha_str.endswith('Z'):
                        comentario_fecha_str = comentario_fecha_str[:-1] + '+00:00'
                    
                    comentario_fecha_utc = datetime.fromisoformat(comentario_fecha_str.replace('Z', '+00:00'))
                    if comentario_fecha_utc.tzinfo is None:
                        comentario_fecha = chile_tz.localize(comentario_fecha_utc)
                    else:
                        comentario_fecha = comentario_fecha_utc.astimezone(chile_tz)
                
                comentario_fecha_utc = comentario_fecha.astimezone(pytz.UTC)
                
            except Exception as e:
                comentario_fecha_utc = datetime.now(pytz.UTC)
            
            nuevo_comentario = Comentario(
                descripcion=comentario_desc,
                fecha=comentario_fecha_utc.replace(tzinfo=None),
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
            fecha_str = s.fecha.isoformat()
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
                "fecha": fecha_str,
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

@sorteo_bp.route('/sorteos/hoy', methods=['GET'])
def obtener_sorteos_hoy():
    """Obtiene todos los sorteos realizados hoy agrupados por grupo"""
    try:
        # Usar zona horaria de Chile para determinar "hoy"
        chile_tz = pytz.timezone('America/Santiago')
        ahora_chile = datetime.now(chile_tz)
        hoy_chile = ahora_chile.date()
        
        # Convertir a UTC para consultar la base de datos
        inicio_dia_chile = chile_tz.localize(datetime.combine(hoy_chile, datetime.min.time()))
        fin_dia_chile = chile_tz.localize(datetime.combine(hoy_chile, datetime.max.time()))
        
        inicio_dia_utc = inicio_dia_chile.astimezone(pytz.UTC).replace(tzinfo=None)
        fin_dia_utc = fin_dia_chile.astimezone(pytz.UTC).replace(tzinfo=None)
        
        # Consultar sorteos de hoy con información del grupo
        sorteos_hoy = db.session.query(
            Sorteo.id_grupo,
            Grupo.nombre.label('grupo_nombre'),
            db.func.count(Sorteo.id).label('cantidad_sorteos'),
            db.func.max(Sorteo.fecha).label('ultimo_sorteo')
        ).join(
            Grupo, Sorteo.id_grupo == Grupo.id
        ).filter(
            Sorteo.fecha >= inicio_dia_utc,
            Sorteo.fecha <= fin_dia_utc
        ).group_by(
            Sorteo.id_grupo, Grupo.nombre
        ).all()
        
        resultado = []
        for sorteo in sorteos_hoy:
            # Convertir la fecha del último sorteo de UTC a hora de Chile
            ultimo_sorteo_utc = sorteo.ultimo_sorteo
            if ultimo_sorteo_utc:
                ultimo_sorteo_utc = pytz.UTC.localize(ultimo_sorteo_utc)
                ultimo_sorteo_chile = ultimo_sorteo_utc.astimezone(chile_tz)
                ultimo_sorteo_iso = ultimo_sorteo_chile.isoformat()
            else:
                ultimo_sorteo_iso = None
            
            resultado.append({
                'id_grupo': sorteo.id_grupo,
                'grupo_nombre': sorteo.grupo_nombre,
                'cantidad_sorteos': sorteo.cantidad_sorteos,
                'ultimo_sorteo': ultimo_sorteo_iso
            })
        
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"error": f"Error obteniendo sorteos de hoy: {str(e)}"}), 500