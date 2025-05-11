from flask import Blueprint, jsonify
from app.models.categoria import Categoria
from app import db

categoria_bp = Blueprint('categoria', __name__)