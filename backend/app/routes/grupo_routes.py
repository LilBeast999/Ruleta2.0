from flask import Blueprint
from app.models.grupo import Grupo
from app import db

grupo_bp = Blueprint('grupo', __name__)