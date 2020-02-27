from flask import Flask, render_template, request, make_response
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime as dt
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
db = SQLAlchemy(app)

from models import *

@app.route('/', methods=['GET'])
def index():
    return render_template('script.html')


@app.route('/testScript', methods=['GET', 'POST'])
def testScript():
    if request.method == 'GET':
        return render_template('testScript.html')

    else:
        username = request.form.get('user') or 'anonymous'
        score = request.form.get('score')
        icon = request.form.get('icon')
        print(username, score)
        if username and score:
            new_score = Highscore(username=username,
                                   score=score,
                                   time=dt.now(),
                                   icon=icon)
            db.session.add(new_score)
            db.session.commit()
            #return make_response(f"{new_score} successfully created!")
        return render_template('testScript.html')


if __name__ == '__main__':
    app.run(debug=True)
