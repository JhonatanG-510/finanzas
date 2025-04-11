
import os
from flask import Flask, render_template, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
app = Flask(__name__, static_url_path='')
app.secret_key = os.environ.get("SESSION_SECRET", "finanzas_personales_secret_key")

# configure the database