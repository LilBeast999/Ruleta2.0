from app import create_app, db
from sqlalchemy import text

def clear_all_sorteos():
    """Función de utilidad para limpiar todos los sorteos"""
    app = create_app()
    
    with app.app_context():
        try:
            # Contar registros antes de eliminar
            comentarios_count = db.session.execute(text("SELECT COUNT(*) FROM comentario")).scalar()
            sorteos_count = db.session.execute(text("SELECT COUNT(*) FROM sorteo")).scalar()
            
            print(f"Eliminando {comentarios_count} comentarios y {sorteos_count} sorteos...")
            
            # Eliminar datos
            db.session.execute(text("DELETE FROM comentario"))
            db.session.execute(text("DELETE FROM sorteo"))
            
            # Reiniciar secuencias
            db.session.execute(text("ALTER SEQUENCE sorteo_id_seq RESTART WITH 1"))
            db.session.execute(text("ALTER SEQUENCE comentario_id_seq RESTART WITH 1"))
            
            db.session.commit()
            print("✅ Todos los sorteos eliminados correctamente")
            
            return True
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error: {e}")
            return False

if __name__ == "__main__":
    clear_all_sorteos()
