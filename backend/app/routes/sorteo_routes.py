from flask import Blueprint, request, jsonify
from app.models.sorteo import Sorteo
from app.models.grupo import Grupo
from app.models.incidencia import Incidencia
from app.models.categoria import Categoria
from app.models.comentario import Comentario
from app.models.alumno import Alumno  # Asegúrate de tener este modelo
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
            fecha_str = s.fecha.strftime("%d/%m/%Y")
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