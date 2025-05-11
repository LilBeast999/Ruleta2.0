from flask import Blueprint
from app.models.incidencia import Incidencia
from app import db

incidencia_bp = Blueprint('incidencia', __name__)