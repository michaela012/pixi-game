from flask import Flask, render_template, request, make_response
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime as dt
from models import db, Highscore
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
db = SQLAlchemy(app)

@app.route('/', methods=['GET'])
def index():
    return render_template('script.html')

@app.route('/test', methods=['GET'])
def create_score_entry():
    username = request.args.get('user')
    score = request.args.get('email')
    if username and score:
        new_score = Highscore(username=username,
                               score=score,
                               time=dt.now(),
                               icon=1)
        db.session.add(new_score)
        db.session.commit()
    return make_response(f"{new_score} successfully created!")


if __name__ == '__main__':
    app.run(debug=True)
