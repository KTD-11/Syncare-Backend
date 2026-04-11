import { db } from "../config/db_init.js";
import bcrypt from "bcrypt";
import { GLOBAL } from "../config/globals.js";

function db_search(id, password, govIdSearchFlag) {
    const sql = govIdSearchFlag ?
        "SELECT * FROM patients WHERE patient_gov_id = ?"
        : "SELECT * FROM patients WHERE patient_id = ?";

    return new Promise((resolve) => {
        db.get(sql, [id], async (err, row) => {
            if (err) {
                console.error(err.message);

                return resolve({
                    status: 500,
                    message: "Internal server error"
                });
            }

            if (!row) {
                try {
                    // timing attack mitigation — discard result
                    const dummy = await bcrypt.compare(password, GLOBAL.HASH_DUMMY);

                    return resolve({
                        status: 401,
                        message: `Invalid Credentials`,
                    });

                } catch (err) {
                    console.error(err.message);

                    return resolve({
                        status: 500,
                        message: "Internal server error"
                    });
                }
            }

            try {
                const compare = await bcrypt.compare(password, row.password_hash);

                if (!compare) {
                    return resolve({
                        status: 401,
                        message: `Invalid Credentials`
                    });
                }

                delete row.password_hash;

                return resolve({
                    status: 200,
                    data: row
                });

            } catch (err) {
                console.error(err.message);

                return resolve({
                    status: 500,
                    message: "Internal server error"
                });
            }
        });
    });
}

function booked_appointment_search(date) {
    return new Promise(resolve => {
        const searchSql = `SELECT appointment_time
                           FROM appointments
                           WHERE (appointment_date = ?)`

        db.all(searchSql, [date], (err, rows) => {
            if (err) {
                console.error(err.message);

                return resolve({
                    status: 500,
                    message: "Internal server error"
                });
            }

            return resolve({
                status: 200,
                data: rows.map(row => row.appointment_time)
            });
        })
    });
}

function isAvailable(govId) {
    const sql = "SELECT * FROM patients WHERE patient_gov_id = ?";

    return new Promise(resolve => {
        db.get(sql, [govId], (err, row) => {
            if (err) {
                console.error(err);

                return resolve({
                    status: 500,
                    message: "Internal server error"
                });
            }

            if (!row) {
                return resolve({
                    status: 200,
                    message: "ID is available"
                });
            }

            return resolve({
                status: 409,
                message: "User was found"
            })
        });
    });
}

function appointmentSearch(patientID) {
    return new Promise(resolve => {
        const searchSql = `SELECT appointment_id, appointment_date, appointment_time, appointment_type, appointment_name FROM
        appointments WHERE (patient_id = ?)`;

        db.all(searchSql, [patientID], (err, rows) => {
            if (err) {
                console.error(err.message);

                return resolve({
                    status: 500,
                    message: "Internal server error"
                });
            }

            if (rows.length === 0) {
                return resolve({
                    status: 404,
                    message: "Not found"
                });
            }

            return resolve({
                status: 200,
                data: rows
            });
        });
    });
}

async function userExists(govID) {
    const result = await isAvailable(govID);
    return result.status === 409;
}

export { db_search, booked_appointment_search, isAvailable, appointmentSearch, userExists }