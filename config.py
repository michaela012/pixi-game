from os import environ


class Config:
    """Set Flask configuration vars from .env file."""

    # General
    #TESTING = environ.get('TESTING')
    #FLASK_DEBUG = environ.get('FLASK_DEBUG')
    SECRET_KEY = environ.get('SECRET_KEY') or "secretString"

    # Database
    SQLALCHEMY_DATABASE_URI = "postgres://stgkcvbpqacrzp:63b35b4f77c42c661aa2f9bdf515f69fa4f6282c4451bf4d8d66a0a7c29d50f1@ec2-54-210-128-153.compute-1.amazonaws.com:5432/d6po7mk68cc9ur"
    SQLALCHEMY_TRACK_MODIFICATIONS = False