import pandas as pd
from flask import Blueprint, request, jsonify
from app.models.categoria import Categoria
from app.models.incidencia import Incidencia
from app.models.grupo import Grupo
from app.models.alumno import Alumno
from app.models.proyecto import Proyecto
from app import db
import logging
from sqlalchemy import text

excel_bp = Blueprint('excel', __name__)

@excel_bp.route('/upload_excel_incidencias', methods=['POST'])
def upload_excel_incidencias():
    print("files received:", list(request.files.keys()))
    if 'file' not in request.files:
        return jsonify({"error": "no file provided"}), 400

    file = request.files['file']
    if file.filename == "":
        return jsonify({"error": "no file selected"}), 400

    try:
        # reiniciar secuencias (si es necesario)
        try:
            with db.engine.connect() as conn:
                result = conn.execute(text("SELECT MAX(id) FROM categoria"))
                max_cat_id = result.scalar() or 0
                conn.execute(text(f"ALTER SEQUENCE categoria_id_seq RESTART WITH {max_cat_id + 1}"))
                
                result = conn.execute(text("SELECT MAX(id) FROM incidencia"))
                max_inc_id = result.scalar() or 0
                conn.execute(text(f"ALTER SEQUENCE incidencia_id_seq RESTART WITH {max_inc_id + 1}"))
                
                conn.commit()
                print(f"secuencias reiniciadas: categoria={max_cat_id + 1}, incidencia={max_inc_id + 1}")
        except Exception as seq_error:
            print("error reiniciando secuencias:", str(seq_error))
        
        df = pd.read_excel(file)
        df.columns = df.columns.str.lower().str.strip()
        print("columnas leídas:", df.columns.tolist())

        if 'categorias' not in df.columns or 'subcategorias' not in df.columns:
            return jsonify({"error": "el excel debe contener columnas 'categorias' y 'subcategorias'."}), 400

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
                # gestionar la categoría
                categoria = Categoria.query.filter_by(nombre=categoria_nombre).first()
                if not categoria:
                    categoria = Categoria(nombre=categoria_nombre)
                    db.session.add(categoria)
                    db.session.commit()
                    print(f"categoría creada: {categoria_nombre}, id: {categoria.id}")
                    stats["categorias_creadas"] += 1
                else:
                    print(f"categoría existente: {categoria_nombre}, id: {categoria.id}")
                    stats["categorias_existentes"] += 1

                categoria_id = categoria.id

                # gestionar la incidencia (subcategoría)
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
                    print(f"incidencia creada: {subcategoria} para categoría id: {categoria_id}")
                    stats["incidencias_creadas"] += 1
                else:
                    print(f"incidencia existente: {subcategoria} para categoría id: {categoria_id}")
                    stats["incidencias_existentes"] += 1
            except Exception as row_error:
                db.session.rollback()
                error_msg = f"error en fila {index+1}: {str(row_error)}"
                stats["errores"].append(error_msg)
                logging.error(error_msg, exc_info=True)
                
        if stats["errores"]:
            return jsonify({"message": "excel procesado con algunos errores", "stats": stats}), 207
        else:
            return jsonify({"message": "excel procesado exitosamente", "stats": stats}), 200

    except Exception as e:
        db.session.rollback()
        logging.error(f"error procesando excel: {str(e)}", exc_info=True)
        return jsonify({"error": f"error procesando excel: {str(e)}"}), 500


@excel_bp.route('/upload_excel_grupos_alumnos', methods=['POST'])
def upload_excel_grupos_alumnos():
    print("files received:", list(request.files.keys()))
    if 'file' not in request.files:
        return jsonify({"error": "no file provided"}), 400

    file = request.files['file']
    if file.filename == "":
        return jsonify({"error": "no file selected"}), 400

    try:
        # reiniciar secuencias para grupo, alumno y proyecto
        try:
            with db.engine.connect() as conn:
                tables = ['grupo', 'alumno', 'proyecto']
                for table in tables:
                    result = conn.execute(text(f"SELECT MAX(id) FROM {table}"))
                    max_id = result.scalar() or 0
                    conn.execute(text(f"ALTER SEQUENCE {table}_id_seq RESTART WITH {max_id + 1}"))
                conn.commit()
                print("secuencias reiniciadas correctamente")
        except Exception as seq_error:
            print("error reiniciando secuencias:", str(seq_error))

        df = pd.read_excel(file)
        print("columnas leídas:", df.columns.tolist())

        required_columns = ['Grupo']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return jsonify({"error": f"faltan columnas requeridas: {', '.join(missing_columns)}"}), 400

        integrantes_columns = [col for col in df.columns if 'Integrante' in col]
        if not integrantes_columns:
            return jsonify({"error": "el excel debe contener al menos una columna 'Integrante'"}), 400

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
                
                # proyecto 1
                if 'Proyecto1' in df.columns and pd.notna(row['Proyecto1']):
                    nombre_proyecto1 = str(row['Proyecto1']).strip()
                    if nombre_proyecto1:
                        proyecto1 = Proyecto.query.filter_by(nombre=nombre_proyecto1).first()
                        if not proyecto1:
                            proyecto1 = Proyecto(nombre=nombre_proyecto1)
                            db.session.add(proyecto1)
                            db.session.commit()
                            print(f"proyecto1 creado: {nombre_proyecto1}, id: {proyecto1.id}")
                            stats["proyectos_creados"] += 1
                        else:
                            print(f"proyecto1 existente: {nombre_proyecto1}, id: {proyecto1.id}")
                            stats["proyectos_existentes"] += 1
                        proyecto1_id = proyecto1.id
                
                # proyecto 2
                if 'Proyecto2' in df.columns and pd.notna(row['Proyecto2']):
                    nombre_proyecto2 = str(row['Proyecto2']).strip()
                    if nombre_proyecto2:
                        proyecto2 = Proyecto.query.filter_by(nombre=nombre_proyecto2).first()
                        if not proyecto2:
                            proyecto2 = Proyecto(nombre=nombre_proyecto2)
                            db.session.add(proyecto2)
                            db.session.commit()
                            print(f"proyecto2 creado: {nombre_proyecto2}, id: {proyecto2.id}")
                            stats["proyectos_creados"] += 1
                        else:
                            print(f"proyecto2 existente: {nombre_proyecto2}, id: {proyecto2.id}")
                            stats["proyectos_existentes"] += 1
                        proyecto2_id = proyecto2.id

                # gestionar grupo
                grupo = Grupo.query.filter_by(nombre=nombre_grupo).first()
                if not grupo:
                    grupo = Grupo(
                        nombre=nombre_grupo,
                        id_proyecto1=proyecto1_id,
                        id_proyecto2=proyecto2_id
                    )
                    db.session.add(grupo)
                    db.session.commit()
                    print(f"grupo creado: {nombre_grupo}, id: {grupo.id}")
                    stats["grupos_creados"] += 1
                else:
                    if proyecto1_id and grupo.id_proyecto1 != proyecto1_id:
                        grupo.id_proyecto1 = proyecto1_id
                    if proyecto2_id and grupo.id_proyecto2 != proyecto2_id:
                        grupo.id_proyecto2 = proyecto2_id
                    db.session.commit()
                    print(f"grupo actualizado: {nombre_grupo}, id: {grupo.id}")
                    stats["grupos_existentes"] += 1

                grupo_id = grupo.id
                # gestionar alumnos por columna de integrante
                for col in integrantes_columns:
                    nombre_completo = str(row[col]).strip()
                    if not nombre_completo or nombre_completo.lower() == 'nan':
                        continue
                    partes = nombre_completo.split()
                    if len(partes) >= 2:
                        nombre = partes[0]
                        apellido = ' '.join(partes[1:])
                    else:
                        nombre = nombre_completo
                        apellido = ""
                    
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
                        print(f"alumno creado: {nombre} {apellido}, matrícula: {matricula_temp}")
                        stats["alumnos_creados"] += 1
                    except Exception as alumno_error:
                        db.session.rollback()
                        error_msg = f"error al crear alumno '{nombre} {apellido}': {str(alumno_error)}"
                        stats["errores"].append(error_msg)
                        logging.error(error_msg)
            except Exception as row_error:
                db.session.rollback()
                error_msg = f"error en fila {index+1} (grupo: {row.get('Grupo', 'n/a')}): {str(row_error)}"
                stats["errores"].append(error_msg)
                logging.error(error_msg, exc_info=True)
                
        if stats["errores"]:
            return jsonify({"message": "excel procesado con algunos errores", "stats": stats}), 207
        else:
            return jsonify({"message": "excel procesado exitosamente", "stats": stats}), 200
    except Exception as e:
        db.session.rollback()
        logging.error(f"error procesando excel: {str(e)}", exc_info=True)
        return jsonify({"error": f"error procesando excel: {str(e)}"}), 500