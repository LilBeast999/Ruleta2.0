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

    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise Exception("No se encontró DATABASE_URL en el archivo .env")

    app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    migrate.init_app(app, db)

    with app.app_context():
        try:
            with db.engine.connect() as connection:
                connection.execute(text("SELECT 1"))
                print("base de datos conectada exitosamente")
        except Exception as e:
            raise Exception(f"No se pudo conectar a la base de datos: {e}")

    # importar y registrar rutas
    from app.routes.alumno_routes import alumno_bp
    app.register_blueprint(alumno_bp)
    from app.routes.categoria_routes import categoria_bp
    app.register_blueprint(categoria_bp)
    from app.routes.comentario_routes import comentario_bp
    app.register_blueprint(comentario_bp)
    from app.routes.grupo_routes import grupo_bp
    app.register_blueprint(grupo_bp)
    from app.routes.profesor_routes import profesor_bp
    app.register_blueprint(profesor_bp)
    from app.routes.incidencia_routes import incidencia_bp
    app.register_blueprint(incidencia_bp)
    from app.routes.sorteo_routes import sorteo_bp
    app.register_blueprint(sorteo_bp)

    @app.route('/')
    def home():
        return "¡Hola Mundo desde Flask con estructura modular!"

    return app
