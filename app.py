from flask import Flask, render_template, request, make_response
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime as dt
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
db = SQLAlchemy(app)

from models import *

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        username = request.form.get('user') or 'anonymous'
        score = request.form.get('score')
        icon = request.form.get('icon')
        if username and score:
            new_score = Highscore(username=username,
                                  score=score,
                                  time=dt.now(),
                                  icon=icon)
            db.session.add(new_score)
            db.session.commit()

    top_ten = Highscore.query.order_by(Highscore.score.desc()).limit(10).all()
    return render_template('script.html', topScores=top_ten)


if __name__ == '__main__':
    app.run(debug=True)
