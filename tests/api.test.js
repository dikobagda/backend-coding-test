'use strict';

const request = require('supertest');
const mocha = require('mocha');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const describe = mocha.describe;
const before = mocha.before;
const it = mocha.it;
const have = mocha.have;
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

    describe('GET /rides', ()=>{
        it('get all rides', (done) => {
            request(app)
                .get('/rides')
                .expect('Content-Type', /json/)
                .expect(200, done);
        });
    });

    describe('POST /rides', () => {
        it('add rides api', (done) => {
            request(app)
            .post('/rides')
            .send({ "start_lat": 1, 'start_long': 2, "end_lat": 3, "end_long": 4, "rider_name": "diko", "driver_name": "bagda", "driver_vehicle": "motorcycle" })
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                const startLatitude = Number(res.body.start_lat);
                const startLongitude = Number(res.body.start_long);
                const endLatitude = Number(res.body.end_lat);
                const endLongitude = Number(res.body.end_long);
                const riderName = res.body.rider_name;
                const driverName = res.body.driver_name;
                const driverVehicle = res.body.driver_vehicle;

                if (err) done(err);
                    if (startLatitude < -90 || startLatitude > 90 || startLongitude < -180 || startLongitude > 180) {
                        
                    }

                    if (endLatitude < -90 || endLatitude > 90 || endLongitude < -180 || endLongitude > 180) {
                       
                    }
            
                    if (typeof riderName !== 'string' || riderName.length < 1) {
                        
                    }
            
                    if (typeof driverName !== 'string' || driverName.length < 1) {
                        
                    }
            
                    if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
                       
                    }
                    var values = [res.body.start_lat, res.body.start_long, res.body.end_lat, res.body.end_long, res.body.rider_name, res.body.driver_name, res.body.driver_vehicle];
            
                    db.run('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)', values, function (err) {
                        if (err) {
                            
                        }
    
                        db.all('SELECT * FROM Rides WHERE rideID = ?', this.lastID, function (err, rows) {
                            if (err) {
                               
                            }
    
                            // res.send(rows);
                        });
                    });
                });
                
              done();
        });
        
    });
    
    describe('GET /health', () => {
        it('should return health', (done) => {
            request(app)
                .get('/health')
                .expect('Content-Type', /text/)
                .expect(200, done);
        });
    });
});