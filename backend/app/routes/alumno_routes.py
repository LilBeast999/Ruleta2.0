from flask import Blueprint
from app.models.alumno import Alumno
from app import db

alumno_bp = Blueprint('alumno', __name__)
