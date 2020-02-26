from app import db

class Highscore(db.Model):
    '''model for highscore entry'''
    __tablename__ = 'highscores'
    id = db.Column(db.Integer,
                   primary_key=True)
    username = db.Column(db.String(64),
                         index=False,
                         unique=False,
                         nullable=False)
    score = db.Column(db.Integer,
                      index=False,
                      unique=False,
                      nullable=False)
    time = db.Column(db.DateTime,
                     index=False,
                     unique=False,
                     nullable=False)
    icon = db.Column(db.Integer,
                     index=False,
                     unique=False,
                     nullable=False)

    def __repr__(self):
        return '<Highscore {}>'.format(self.score)
