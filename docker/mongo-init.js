// Runs automatically ONCE, the very first time the mongo container starts
// with an empty data volume (standard Mongo docker image behavior for
// anything placed in /docker-entrypoint-initdb.d/). It just makes sure the
// "ma-creation" database exists by writing a marker collection -- the actual
// root user is already created by MONGO_INITDB_ROOT_USERNAME/PASSWORD in
// docker-compose.yml, which is the user our backend connects as (with
// authSource=admin, as set in MONGODB_URI).
db = db.getSiblingDB('ma-creation')
db.createCollection('_init')