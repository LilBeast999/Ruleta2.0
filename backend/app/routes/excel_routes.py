import pandas as pd
from flask import Blueprint, request, jsonify
from app.models.categoria import Categoria
from app.models.incidencia import Incidencia
from app.models.grupo import Grupo
from app.models.alumno import Alumno
from app.models.proyecto import Proyecto
from app.models.sorteo import Sorteo
from app.models.comentario import Comentario
from app import db
from sqlalchemy import text

excel_bp = Blueprint('excel', __name__)

def clear_incidencias_data():
    """elimina todos los datos de incidencias y sus dependencias"""
    try:
        # eliminar datos en orden de dependencias
        comentarios_count = Comentario.query.count()
        if comentarios_count > 0:
            db.session.execute(text("DELETE FROM comentario"))
        
        sorteos_count = Sorteo.query.count()
        if sorteos_count > 0:
            db.session.execute(text("DELETE FROM sorteo"))
        
        incidencias_count = Incidencia.query.count()
        if incidencias_count > 0:
            db.session.execute(text("DELETE FROM incidencia"))
        
        categorias_count = Categoria.query.count()
        if categorias_count > 0:
            db.session.execute(text("DELETE FROM categoria"))
        
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        return False

def clear_grupos_alumnos_data():
    """elimina todos los datos de grupos, alumnos y proyectos"""
    try:
        # eliminar datos en orden de dependencias
        comentarios_count = Comentario.query.count()
        if comentarios_count > 0:
            db.session.execute(text("DELETE FROM comentario"))
        
        sorteos_count = Sorteo.query.count()
        if sorteos_count > 0:
            db.session.execute(text("DELETE FROM sorteo"))
        
        alumnos_count = Alumno.query.count()
        if alumnos_count > 0:
            db.session.execute(text("DELETE FROM alumno"))
        
        grupos_count = Grupo.query.count()
        if grupos_count > 0:
            db.session.execute(text("DELETE FROM grupo"))
        
        proyectos_count = Proyecto.query.count()
        if proyectos_count > 0:
            db.session.execute(text("DELETE FROM proyecto"))
        
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        return False

@excel_bp.route('/upload_excel_incidencias', methods=['POST'])
def upload_excel_incidencias():
    if 'file' not in request.files:
        return jsonify({"error": "archivo no proporcionado"}), 400

    file = request.files['file']
    if file.filename == "":
        return jsonify({"error": "archivo no seleccionado"}), 400

    # verificar si hay que limpiar datos
    clear_data = request.form.get('clearData', 'false').lower() == 'true'

    try:
        # limpiar datos si se solicita
        if clear_data:
            if not clear_incidencias_data():
                return jsonify({"error": "error al limpiar datos"}), 500

        # reiniciar secuencias de ids
        try:
            with db.engine.connect() as conn:
                result = conn.execute(text("SELECT MAX(id) FROM categoria"))
                max_cat_id = result.scalar() or 0
                conn.execute(text(f"ALTER SEQUENCE categoria_id_seq RESTART WITH {max_cat_id + 1}"))
                
                result = conn.execute(text("SELECT MAX(id) FROM incidencia"))
                max_inc_id = result.scalar() or 0
                conn.execute(text(f"ALTER SEQUENCE incidencia_id_seq RESTART WITH {max_inc_id + 1}"))
                
                conn.commit()
        except Exception as seq_error:
            pass
        
        df = pd.read_excel(file)
        df.columns = df.columns.str.lower().str.strip()

        # validar que sea archivo de incidencias
        required_columns = ['categorias', 'subcategorias']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        # detectar si es archivo incorrecto
        alumnos_columns = ['grupo', 'integrante', 'proyecto']
        if any(col.lower() in [c.lower() for c in df.columns] for col in alumnos_columns):
            return jsonify({
                "error": "archivo incorrecto: parece ser de alumnos, usa el endpoint correcto"
            }), 400
        
        if missing_columns:
            available_columns = df.columns.tolist()
            return jsonify({
                "error": f"faltan columnas: {', '.join(missing_columns)}. disponibles: {', '.join(available_columns)}"
            }), 400

        stats = {
            "categorias_creadas": 0,
            "categorias_existentes": 0,
            "incidencias_creadas": 0,
            "incidencias_existentes": 0,
            "errores": []
        }

        for index, row in df.iterrows():
            categoria_nombre = str(row['categorias']).strip()
            subcategoria = str(row['subcategorias']).strip()
            if not categoria_nombre or not subcategoria:
                continue

            try:
                # crear o buscar categoría
                categoria = Categoria.query.filter_by(nombre=categoria_nombre).first()
                if not categoria:
                    categoria = Categoria(nombre=categoria_nombre)
                    db.session.add(categoria)
                    db.session.commit()
                    stats["categorias_creadas"] += 1
                else:
                    stats["categorias_existentes"] += 1

                categoria_id = categoria.id

                # crear o buscar incidencia
                incidencia_existente = Incidencia.query.filter_by(
                    id_categoria=categoria_id,
                    descripcion=subcategoria
                ).first()
                
                if not incidencia_existente:
                    incidencia = Incidencia(
                        id_categoria=categoria_id,
                        duracion=0,
                        descripcion=subcategoria
                    )
                    db.session.add(incidencia)
                    db.session.commit()
                    stats["incidencias_creadas"] += 1
                else:
                    stats["incidencias_existentes"] += 1
            except Exception as row_error:
                db.session.rollback()
                error_msg = f"error en fila {index+1}: {str(row_error)}"
                stats["errores"].append(error_msg)
                
        if stats["errores"]:
            return jsonify({"message": "excel procesado con errores", "stats": stats}), 207
        else:
            return jsonify({"message": "excel procesado correctamente", "stats": stats}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"error procesando excel: {str(e)}"}), 500


@excel_bp.route('/upload_excel_grupos_alumnos', methods=['POST'])
def upload_excel_grupos_alumnos():
    if 'file' not in request.files:
        return jsonify({"error": "archivo no proporcionado"}), 400

    file = request.files['file']
    if file.filename == "":
        return jsonify({"error": "archivo no seleccionado"}), 400

    # verificar si hay que limpiar datos
    clear_data = request.form.get('clearData', 'false').lower() == 'true'
    print(f"limpiar datos: {clear_data}")

    try:
        # limpiar datos si se solicita
        if clear_data:
            if not clear_grupos_alumnos_data():
                return jsonify({"error": "error al limpiar datos"}), 500

        # reiniciar secuencias de ids
        try:
            with db.engine.connect() as conn:
                tables = ['grupo', 'alumno', 'proyecto']
                for table in tables:
                    result = conn.execute(text(f"SELECT MAX(id) FROM {table}"))
                    max_id = result.scalar() or 0
                    conn.execute(text(f"ALTER SEQUENCE {table}_id_seq RESTART WITH {max_id + 1}"))
                conn.commit()
        except Exception as seq_error:
            print("error reiniciando secuencias:", str(seq_error))
        
        df = pd.read_excel(file)
        df.columns = df.columns.str.strip()
        print("columnas:", df.columns.tolist())

        # validar que sea archivo de grupos/alumnos
        incidencias_columns = ['categorias', 'subcategorias']
        if any(col.lower() in [c.lower() for c in df.columns] for col in incidencias_columns):
            return jsonify({
                "error": "archivo incorrecto: parece ser de incidencias, usa el endpoint correcto"
            }), 400

        required_columns = ['Grupo']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return jsonify({"error": f"faltan columnas: {', '.join(missing_columns)}"}), 400

        integrantes_columns = [col for col in df.columns if 'Integrante' in col]
        if not integrantes_columns:
            return jsonify({"error": "debe contener al menos una columna 'Integrante'"}), 400

        stats = {
            "grupos_creados": 0,
            "grupos_existentes": 0,
            "proyectos_creados": 0,
            "proyectos_existentes": 0,
            "alumnos_creados": 0,
            "errores": []
        }

        for index, row in df.iterrows():
            try:
                nombre_grupo = str(row['Grupo']).strip()
                if not nombre_grupo:
                    continue

                proyecto1_id = None
                proyecto2_id = None
                
                # procesar proyecto 1
                if 'Proyecto1' in df.columns and pd.notna(row['Proyecto1']):
                    nombre_proyecto1 = str(row['Proyecto1']).strip()
                    if nombre_proyecto1:
                        proyecto1 = Proyecto.query.filter_by(nombre=nombre_proyecto1).first()
                        if not proyecto1:
                            proyecto1 = Proyecto(nombre=nombre_proyecto1)
                            db.session.add(proyecto1)
                            db.session.commit()
                            stats["proyectos_creados"] += 1
                        else:
                            stats["proyectos_existentes"] += 1
                        proyecto1_id = proyecto1.id
                
                # procesar proyecto 2
                if 'Proyecto2' in df.columns and pd.notna(row['Proyecto2']):
                    nombre_proyecto2 = str(row['Proyecto2']).strip()
                    if nombre_proyecto2:
                        proyecto2 = Proyecto.query.filter_by(nombre=nombre_proyecto2).first()
                        if not proyecto2:
                            proyecto2 = Proyecto(nombre=nombre_proyecto2)
                            db.session.add(proyecto2)
                            db.session.commit()
                            stats["proyectos_creados"] += 1
                        else:
                            stats["proyectos_existentes"] += 1
                        proyecto2_id = proyecto2.id

                # crear o actualizar grupo
                grupo = Grupo.query.filter_by(nombre=nombre_grupo).first()
                if not grupo:
                    grupo = Grupo(
                        nombre=nombre_grupo,
                        id_proyecto1=proyecto1_id,
                        id_proyecto2=proyecto2_id
                    )
                    db.session.add(grupo)
                    db.session.commit()
                    stats["grupos_creados"] += 1
                else:
                    # actualizar proyectos si es necesario
                    if proyecto1_id and grupo.id_proyecto1 != proyecto1_id:
                        grupo.id_proyecto1 = proyecto1_id
                    if proyecto2_id and grupo.id_proyecto2 != proyecto2_id:
                        grupo.id_proyecto2 = proyecto2_id
                    db.session.commit()
                    stats["grupos_existentes"] += 1

                grupo_id = grupo.id
                
                # procesar alumnos
                for col in integrantes_columns:
                    nombre_completo = str(row[col]).strip()
                    if not nombre_completo or nombre_completo.lower() == 'nan':
                        continue
                    
                    # separar nombre y apellido
                    partes = nombre_completo.split()
                    if len(partes) >= 2:
                        nombre = partes[0]
                        apellido = ' '.join(partes[1:])
                    else:
                        nombre = nombre_completo
                        apellido = ""
                    
                    # generar matrícula temporal
                    import time
                    timestamp = int(time.time() * 1000) % 10000
                    matricula_temp = f"{nombre[:3]}{apellido[:3]}{index+1}{timestamp}".upper()
                    
                    try:
                        alumno = Alumno(
                            matricula=matricula_temp,
                            nombre=nombre,
                            apellido=apellido,
                            id_grupo=grupo_id
                        )
                        db.session.add(alumno)
                        db.session.commit()
                        stats["alumnos_creados"] += 1
                    except Exception as alumno_error:
                        db.session.rollback()
                        error_msg = f"error creando alumno '{nombre} {apellido}': {str(alumno_error)}"
                        stats["errores"].append(error_msg)
            except Exception as row_error:
                db.session.rollback()
                error_msg = f"error en fila {index+1}: {str(row_error)}"
                stats["errores"].append(error_msg)
                
        if stats["errores"]:
            return jsonify({"message": "excel procesado con errores", "stats": stats}), 207
        else:
            return jsonify({"message": "excel procesado correctamente", "stats": stats}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"error procesando excel: {str(e)}"}), 500