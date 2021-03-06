'use strict';

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const winston = require('winston');
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'info.log' }),
    ],
});

module.exports = (db) => {
    app.get('/health', async (_, res) => res.send('Healthy'));

    app.post('/rides', jsonParser, async (req, res) => {
        const startLatitude = Number(req.body.start_lat);
        const startLongitude = Number(req.body.start_long);
        const endLatitude = Number(req.body.end_lat);
        const endLongitude = Number(req.body.end_long);
        const riderName = req.body.rider_name;
        const driverName = req.body.driver_name;
        const driverVehicle = req.body.driver_vehicle;

        if (startLatitude < -90 || startLatitude > 90 || startLongitude < -180 || startLongitude > 180) {
            logger.log({
                level: 'info',
                message: {
                    error_code: 'VALIDATION_ERROR',
                    message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
                }
            });
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
            });
        }

        if (endLatitude < -90 || endLatitude > 90 || endLongitude < -180 || endLongitude > 180) {
            logger.log({
                level: 'info',
                message: {
                    error_code: 'VALIDATION_ERROR',
                    message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
                }
            });
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
            });
        }

        if (typeof riderName !== 'string' || riderName.length < 1) {
            logger.log({
                level: 'info',
                message: {
                    error_code: 'VALIDATION_ERROR',
                    message: 'Rider name must be a non empty string'
                }
            });
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }

        if (typeof driverName !== 'string' || driverName.length < 1) {
            logger.log({
                level: 'info',
                message: {
                    error_code: 'VALIDATION_ERROR',
                    message: 'Rider name must be a non empty string'
                }
            });
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }

        if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
            logger.log({
                level: 'info',
                message: {
                    error_code: 'VALIDATION_ERROR',
                    message: 'Rider name must be a non empty string'
                }
            });
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }

        var values = [req.body.start_lat, req.body.start_long, req.body.end_lat, req.body.end_long, req.body.rider_name, req.body.driver_name, req.body.driver_vehicle];

        await db.run('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)', values, async function (err) {
            if (err) {
                logger.log({
                    level: 'info',
                    message: {
                        error_code: 'SERVER_ERROR',
                        message: 'Unknown error'
                    }
                });
                return res.send({
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown error'
                });
            }

            await db.all('SELECT * FROM Rides WHERE rideID = ?', this.lastID, async function (err, rows) {
                if (err) {
                    logger.log({
                        level: 'info',
                        message: {
                            error_code: 'SERVER_ERROR',
                            message: 'Unknown error'
                        }
                    });
                    return res.send({
                        error_code: 'SERVER_ERROR',
                        message: 'Unknown error'
                    });
                }

                res.send(rows);
            });
        });
    });

    app.get('/rides', async (req, res) => {
        let page = req.query.page;
        let limit = req.query.limit;
        let startIndex = 0;
        logger.log({
            level: 'info',
            message: {
                message: '💚💚💚 start request api rides 💚💚💚'
            }
        });
        if (typeof page != 'undefined' && typeof limit != 'undefined') {
            startIndex = (page - 1) * limit;
        } else {
            logger.log({
                level: 'info',
                message: {
                    message: 'Get all records'
                }
            });
            startIndex = 0;
            // for better query, limit set to default 1000 records
            limit = 1000;
        }


        await db.all(`SELECT * FROM Rides ORDER BY rideID ASC limit '${limit}' OFFSET '${startIndex}'`, async function (err, rows) {
            if (err) {
                logger.log({
                    level: 'info',
                    message: {
                        error_code: 'SERVER_ERROR',
                        message: 'Unknown error'
                    }
                });
                return res.send({
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown error'
                });
            }

            if (rows.length === 0) {
                logger.log({
                    level: 'info',
                    message: {
                        error_code: 'RIDES_NOT_FOUND_ERROR',
                        message: 'Could not find any rides'
                    }
                });
                return res.send({
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides'
                });
            }

            res.send(rows);
        });
        logger.log({
            level: 'info',
            message: {
                message: '💚💚💚 successfully request api rides 💚💚💚'
            }
        });
    });

    app.get('/rides/:id', async (req, res) => {
        await db.all(`SELECT * FROM Rides WHERE rideID='${req.params.id}'`, async function (err, rows) {
            if (err) {
                logger.log({
                    level: 'info',
                    message: {
                        error_code: 'SERVER_ERROR',
                        message: 'Unknown error'
                    }
                });
                return res.send({
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown error'
                });
            }

            if (rows.length === 0) {
                logger.log({
                    level: 'info',
                    message: {
                        error_code: 'RIDES_NOT_FOUND_ERROR',
                        message: 'Could not find any rides'
                    }
                });
                return res.send({
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides'
                });
            }

            res.send(rows);
        });
    });

    return app;
};
