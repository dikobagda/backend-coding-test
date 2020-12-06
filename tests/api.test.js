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
        let complete_data_rides = {
            'start_lat': 10,
            'start_long': 12,
            'end_lat': 11,
            'end_long': 12,
            'rider_name': 'diko1',
            'driver_name': 'john wick',
            'driver_vehicle': 'motorcycle'
        };

        let outofrange_start_lat_start_long = {
            'start_lat': -91,
            'start_long': 181,
            'end_lat': 11,
            'end_long': 12,
            'rider_name': 'diko1',
            'driver_name': 'john wick',
            'driver_vehicle': 'motorcycle'
        };

        let outofrange_end_lat_end_long = {
            'start_lat': 1,
            'start_long': 2,
            'end_lat': -91,
            'end_long': 181,
            'rider_name': 'diko1',
            'driver_name': 'john wick',
            'driver_vehicle': 'motorcycle'
        };

        let rider_name_empty = {
            'start_lat': 1,
            'start_long': 2,
            'end_lat': 1,
            'end_long': 2,
            'rider_name': '',
            'driver_name': 'john wick',
            'driver_vehicle': 'motorcycle'
        };


        it('success add rides api', (done) => {
            request(app)
                .post('/rides')
                .send(complete_data_rides)
                .expect('Content-Type', /json/)
                .expect(200, done);

        });

        it('validation test : Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively', (done) => {
            request(app)
                .post('/rides')
                .send(outofrange_start_lat_start_long)
                .expect('Content-Type', /json/)
                .expect({
                    error_code: 'VALIDATION_ERROR',
                    message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
                }, done);

        });

        it('validation test : End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively', (done) => {
            request(app)
                .post('/rides')
                .send(outofrange_end_lat_end_long)
                .expect('Content-Type', /json/)
                .expect(
                    {
                        error_code: 'VALIDATION_ERROR',
                        message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
                    }, done);

        });

        it('validation test : Rider name must be a non empty string', (done) => {
            request(app)
                .post('/rides')
                .send(rider_name_empty)
                .expect('Content-Type', /json/)
                .expect(
                    {
                        error_code: 'VALIDATION_ERROR',
                        message: 'Rider name must be a non empty string'
                    }, done);

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