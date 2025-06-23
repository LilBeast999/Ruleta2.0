import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv
from sqlalchemy import text


db = SQLAlchemy()
migrate = Migrate()

def create_app():
    load_dotenv()

    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Configuración de base de datos con fallback a SQLite
    DATABASE_URL = os.getenv("DATABASE_URL")
    if DATABASE_URL:
        print("Usando base de datos externa (NeonDB)")
        app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
    else:
        print("Usando SQLite local para desarrollo")
        # SQLite local - se crea automáticamente
        sqlite_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'ruleta.db')
        app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{sqlite_path}"
    
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    migrate.init_app(app, db)

    # Importar modelos para que SQLAlchemy los reconozca
    from app.models import alumno, categoria, comentario, grupo, incidencia, profesor, proyecto, sorteo

    with app.app_context():
        try:
            with db.engine.connect() as connection:
                connection.execute(text("SELECT 1"))
                print("base de datos conectada exitosamente")
                
                # Si es SQLite y no existe la estructura, crearla
                if not DATABASE_URL:
                    # Verificar si las tablas existen
                    inspector = db.inspect(db.engine)
                    tables = inspector.get_table_names()
                    
                    if not tables:
                        print("Creando estructura de base de datos...")
                        db.create_all()
                        print("Estructura de base de datos creada exitosamente")
                    else:
                        print("Estructura de base de datos ya existe")
                        
        except Exception as e:
            if DATABASE_URL:
                raise Exception(f"No se pudo conectar a la base de datos: {e}")
            else:
                print(f"Error de conexión: {e}")
                print("Creando nueva base de datos SQLite...")
                db.create_all()
                print("Base de datos SQLite creada exitosamente")

    # registrar blueprints existentes
    from app.routes.profesor_routes import profesor_bp
    from app.routes.sorteo_routes import sorteo_bp
    from app.routes.excel_routes import excel_bp
    
    # registrar nuevos blueprints para CRUD
    from app.routes.categoria_routes import categoria_bp
    from app.routes.incidencia_routes import incidencia_bp
    from app.routes.grupo_routes import grupo_bp
    from app.routes.alumno_routes import alumno_bp
    
    app.register_blueprint(profesor_bp)
    app.register_blueprint(sorteo_bp)
    app.register_blueprint(excel_bp)
    app.register_blueprint(categoria_bp)
    app.register_blueprint(incidencia_bp)
    app.register_blueprint(grupo_bp)
    app.register_blueprint(alumno_bp)

    @app.route('/')
    def home():
        return "¡Hola Mundo desde Flask con estructura modular!"

    return app