'use strict';

const request = require('supertest');
const mocha = require('mocha');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const describe = mocha.describe;
const before = mocha.before;
const it = mocha.it;
const app = require('../src/app')(db);
const buildSchemas = require('../src/schemas');

describe('API tests', () => {
    before((done) => {
        db.serialize((err) => {
            if (err) {
                return done(err);
            }

            buildSchemas(db);

            done();
        });
    });

    describe('GET /health', async () => {
        it('should return health', (done) => {
            request(app)
                .get('/health')
                .expect('Content-Type', /text/)
                .expect(200, done);
        });
    });

    describe('POST /rides', async () => {
        let rides = {
            'start_lat': 10,
            'start_long': 12,
            'end_lat': 11,
            'end_long': 12,
            'rider_name': 'diko1',
            'driver_name': 'john wick',
            'driver_vehicle': 'motorcycle'
        };

        it('success add rides api', (done) => {
            request(app)
                .post('/rides')
                .send(rides)
                .expect('Content-Type', /json/)
                .expect(200, done);

        });

    });

    describe('GET /rides', async () => {
        it('Success get all rides without query parameter', (done) => {
            request(app)
                .get('/rides')
                .expect('Content-Type', /json/)
                .expect(200, done);
        });

        it('Success get all rides with query parameter', (done) => {
            request(app)
                .get('/rides?page=1&limit=2')
                .expect('Content-Type', /json/)
                .expect(200, done);
        });

        it('Server error when get all rides with missing query parameter', (done) => {
            request(app)
                .get('/rides?page=1&limit=')
                .expect('Content-Type', /json/)
                .expect(200, done);
        });

        it('Rider not found', (done) => {
            request(app)
                .get('/rides/2')
                .expect('Content-Type', /json/)
                .expect(
                    {
                        'error_code': 'RIDES_NOT_FOUND_ERROR',
                        'message': 'Could not find any rides'
                    }, done);
        });

    });


});