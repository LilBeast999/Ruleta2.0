from flask import Blueprint
from app.models.proyecto import Proyecto  # forzamos la importación

proyecto_bp = Blueprint('proyecto', __name__)

@proyecto_bp.route('/dummy_proyecto')
def dummy_proyecto():
    # Esta ruta existe solo para garantizar que el modelo Proyecto se importe,
    # a la vez que se evita modificar la importación central de __init__.py.
    return "Proyecto cargado"