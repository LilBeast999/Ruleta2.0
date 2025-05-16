from flask import Blueprint
from app.models.comentario import Comentario
from app import db

comentario_bp = Blueprint('comentario', __name__)