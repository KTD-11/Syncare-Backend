import { db } from "../config/db_init.js";
import bcrypt from "bcrypt";
import { GLOBAL } from "../config/globals.js";
import * as encrypt from "../auth/encryption_utils.js";

function db_search(id, password, govIdSearchFlag, staff) {
    const sql = staff ?
        "SELECT * FROM doctors WHERE doctor_auth_id = ?"
        : govIdSearchFlag ?
            "SELECT * FROM patients WHERE patient_gov_id = ?"
            : "SELECT * FROM patients WHERE patient_id = ?";

    return new Promise((resolve) => {
        db.get(sql, [id], async (err, row) => {
            if (err) {
                console.error(err.message);

                return resolve(GLOBAL.ERROR_OBJECT);
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

                return resolve(GLOBAL.ERROR_OBJECT);
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

                return resolve(GLOBAL.ERROR_OBJECT);
            }

            return resolve({
                status: 200,
                data: rows.map(row => row.appointment_time)
            });
        })
    });
}

function isAvailable(Id, staff) {
    const sql = staff ? "SELECT * FROM doctors WHERE doctor_auth_id = ?" :  "SELECT * FROM patients WHERE patient_gov_id = ?";

    return new Promise(resolve => {
        db.get(sql, [Id], (err, row) => {
            if (err) {
                console.error(err);

                return resolve(GLOBAL.ERROR_OBJECT);
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

function getPatientLocationString(patientID){
    return new Promise(resolve => {
       const searchSql = `SELECT location_string FROM patients WHERE patient_id = ?`;

       db.get(searchSql, [patientID], (err, row)=>{
           if (err)
               return resolve(GLOBAL.ERROR_OBJECT);

           //no need to check for !row since by now this function is to be triggered after the
           //patient had already been verified

           return resolve({
               status: 200,
               data: row.location_string
           });
       })
    });
}

function appointmentSearch(patientID) {
    return new Promise ( async resolveOuter => {

        const fetchAppointment = new Promise(resolveInner => {
            const searchSql = `SELECT appointment_id, appointment_date, appointment_time, appointment_type, appointment_name FROM
                                      appointments WHERE (patient_id = ?)`;

            db.all(searchSql, [patientID], (err, rows) => {
                if (err) {
                    console.error(err.message);

                    return resolveInner({
                        status: 500,
                        message: "Internal server error"
                    });
                }

                if (rows.length === 0) {
                    return resolveInner({
                        status: 404,
                        message: "Not found"
                    });
                }

                return resolveInner({
                    status: 200,
                    data: rows,
                });
            });
        });

        const [locationString, appointments] =
            await Promise.all([getPatientLocationString(patientID), fetchAppointment]);

        if (locationString.status === 500) {
            console.error("Failed to fetch location_string");
            return resolveOuter(locationString);
        }

        if (appointments.status !== 200)
            return resolveOuter(appointments)

        appointments.data.forEach(appointment => {
            delete appointment.appointment_type;
        });

        return resolveOuter({
            status: 200,
            data: appointments.data,
            location: encrypt.decrypt(locationString.data)
        });
    });
}

async function userExists(ID, staff) {
    const result = await isAvailable(ID, staff);
    return result.status === 409;
}

async function availableDoctor(specialty){
    return new Promise(resolve => {
        const searchSql = `SELECT * FROM doctors
                              WHERE doctor_specialty = ?
                              ORDER BY assigned_patients ASC
                              LIMIT 1`;

        db.all(searchSql,[specialty], (err, rows)=>{
            if (err) {
                console.error(err.message)
                return resolve(GLOBAL.ERROR_OBJECT);
            }

            if (rows.length === 0)
                return resolve({
                    status: 404,
                    message: "No doctors are available for this specialty at this moment"
                });

            return resolve({
                status: 200,
                data: rows[GLOBAL.FIRST_AVAILABLE_DOCTOR]
            });
        })
    });
}
function doctorFetchAppointments(id){
    return new Promise(resolve => {
        const searchSql = `
            SELECT
                a.*,
                p.patient_name,
                p.patient_gender,
                p.patient_number,
                p.patient_age
            FROM appointments a
                     LEFT JOIN patients p ON a.patient_id = p.patient_id
            WHERE (a.doctor_id = ? AND a.status = 0)
        `;

        db.all(searchSql, [id], (err, rows) => {
            if (err) {
                console.error(err.message)
                return resolve(GLOBAL.ERROR_OBJECT);
            }

            if (rows.length === 0) {
                return resolve({
                    status: 404,
                    message: "No appointed patients found"
                });
            }

            return resolve({
                status: 200,
                data: rows
            });
        });
    });
}


export { db_search, booked_appointment_search, isAvailable, appointmentSearch, userExists,
        availableDoctor, doctorFetchAppointments}