from flask import Blueprint
from app.models.sorteo import Sorteo
from app import db

sorteo_bp = Blueprint('sorteo', __name__)