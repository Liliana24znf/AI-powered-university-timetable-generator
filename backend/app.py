import os
import sys
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from routes.grupe_routes import grupe_bp
from routes.sali_routes import sali_bp
from routes.profesori_routes import profesori_bp
from routes.reguli_routes import reguli_bp
from routes.orar_routes import orar_bp
from routes.auth_routes import auth_bp
from routes.generator_routes import generator_bp
from dotenv import load_dotenv
load_dotenv()


from flask import Flask, render_template, jsonify, request
from openai import OpenAI
from flask_cors import CORS
import os




client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
app.register_blueprint(grupe_bp)
app.register_blueprint(sali_bp)
app.register_blueprint(profesori_bp)
app.register_blueprint(reguli_bp)
app.register_blueprint(orar_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(generator_bp)


@app.route('/')
def home():
    return render_template("index.html")



if __name__ == '__main__':
    app.run(debug=True)

