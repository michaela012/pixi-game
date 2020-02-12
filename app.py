from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
db = SQLAlchemy(app)

@app.route('/', methods=['GET'])
def index():
    return render_template('script.html')

if __name__ == '__main__':
    app.run(debug=True)