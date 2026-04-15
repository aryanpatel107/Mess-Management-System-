import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from extensions import mail
from dotenv import load_dotenv

from config import Config
from models import db, User
from routes import api


def create_app():
    load_dotenv()

    app = Flask(__name__)
    app.config.from_object(Config)

    # 📁 Upload Folder Setup
    upload_folder = os.path.join(os.getcwd(), "uploads")
    os.makedirs(upload_folder, exist_ok=True)
    app.config["UPLOAD_FOLDER"] = upload_folder
    app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

    # 🔥 CLEAN CORS (NO DUPLICATION)
    CORS(
        app,
        resources={r"/api/*": {"origins": "http://localhost:5173"}},
        supports_credentials=True
    )

    # 🔧 INIT EXTENSIONS
    db.init_app(app)
    jwt = JWTManager(app)
    mail.init_app(app)

    # 🔥 REGISTER ROUTES
    app.register_blueprint(api, url_prefix="/api")

    # 🔥 ROOT CHECK
    @app.route("/")
    def home():
        return jsonify({
            "status": "running",
            "service": "mess-backend"
        })

    # 🔥 SERVE UPLOADS
    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    # 🔥 HANDLE JWT ERRORS (VERY IMPORTANT)
    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        return jsonify({"error": "Missing token"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(callback):
        return jsonify({"error": "Invalid token"}), 401

    # 🔥 CREATE DB + ADMIN
    with app.app_context():
        db.create_all()
        seed_admin()

    return app


# 🔥 ADMIN AUTO CREATE
def seed_admin():
    try:
        if not User.query.filter_by(email="admin@mess.com").first():
            admin = User(
                name="Admin",
                email="admin@mess.com",
                role="Admin",
                contact="9999999999",
                room_no="A-101"
            )
            admin.set_password("Admin@123")

            db.session.add(admin)
            db.session.commit()

            print("✅ Admin created: admin@mess.com / Admin@123")

    except Exception as e:
        print("ADMIN SEED ERROR:", e)


# 🔥 RUN APP
app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)