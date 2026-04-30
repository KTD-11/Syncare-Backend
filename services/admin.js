import { db } from "../config/db_init.js";
import { GLOBAL } from "../config/globals.js";
import bcrypt from "bcrypt";

async function fetchUsersAsAdmin(dataFields) {
    try {

        const match = await bcrypt.compare(dataFields.password, process.env.ADMIN_PASSWORD);

        if (!match)
            return {
                status: 401,
                message: "Invalid credentials"
            };

        return new Promise( resolve => {


            if (isNaN(dataFields.id)) {
                return resolve({
                    status: 400,
                    message: "Invalid ID"
                });
            }

            let searchSql = dataFields.staff ? `SELECT * FROM doctors` : `SELECT * FROM patients`;
            const allFlag = dataFields.id === GLOBAL.GET_EVERYONE_INDEX ?
                `` : dataFields.staff ?
                    ` WHERE doctor_id = ?` : `WHERE patient_id = ?`;

            searchSql += allFlag;

            const params = dataFields.id === GLOBAL.GET_EVERYONE_INDEX ?
                [] : [dataFields.id];

            db.all(searchSql, params, (err, rows) => {
                if (err) {
                    console.error(err.message);

                    return resolve(GLOBAL.ERROR_OBJECT);
                }

                if (rows.length === 0) {
                    return resolve({
                        status: 404,
                        message: "No users found in the database"
                    });
                }

                return resolve({
                    status: 200,
                    data: rows
                });
            });
        });
    }

    catch (e){
        console.error(e.message)

        return GLOBAL.ERROR_OBJECT;
    }
}

async function fetchAppointmentsAsAdmin(dataFields) {
    try {

        const match = await bcrypt.compare(dataFields.password, process.env.ADMIN_PASSWORD);

        if (!match)
            return{
                status: 401,
                message: "Invalid credentials"
            };

        return new Promise(resolve => {

            if (isNaN(dataFields.patientId) || isNaN(dataFields.appointmentId)) {
                return resolve({
                    status: 400,
                    message: "Invalid ID"
                });
            }

            let searchSql;
            let params;

            if (!isNaN(dataFields.appointmentId) &&
                dataFields.appointmentId !== GLOBAL.GET_EVERYONE_INDEX &&
                dataFields.appointmentId !== GLOBAL.NONE) {
                searchSql = `SELECT * FROM appointments WHERE appointment_id = ?`;
                params = [dataFields.appointmentId];
            } else if (dataFields.appointmentId === GLOBAL.GET_EVERYONE_INDEX ||
                dataFields.patientId === GLOBAL.GET_EVERYONE_INDEX) {
                searchSql = `SELECT * FROM appointments`;
                params = [];
            } else if (dataFields.patientId !== GLOBAL.NONE) {
                searchSql = `SELECT * FROM appointments WHERE patient_id = ?`;
                params = [dataFields.patientId];
            } else {
                return resolve({
                    status: 404,
                    message: "No patient or appointment was selected"
                });
            }

            db.all(searchSql, params, (err, rows) => {
                if (err) {
                    console.error(err.message);

                    return resolve(GLOBAL.ERROR_OBJECT);
                }

                if (rows.length === 0) {
                    return resolve({
                        status: 404,
                        message: "No appointments were found"
                    });
                }

                return resolve({
                    status: 200,
                    data: rows
                });
            });
        });
    }
    catch (e) {
        console.error(e.message);

        return GLOBAL.ERROR_OBJECT;
    }
}

async function removeDoctorAsAdmin(dataFields) {
    try {
        const match = await bcrypt.compare(dataFields.password, process.env.ADMIN_PASSWORD);

        if (!match) {
            return {
                status: 401,
                message: "Invalid credentials"
            };
        }

        return new Promise(resolve => {
            const updateOrphansSql = `UPDATE appointments SET doctor_id = NULL WHERE doctor_id = ?`;

            const deleteSql = `DELETE FROM doctors WHERE doctor_id = ?`;

            db.run(updateOrphansSql, [dataFields.doctorId], function (err) {
                if (err) {
                    console.error(err.message);
                    return resolve(GLOBAL.ERROR_OBJECT);
                }

                db.run(deleteSql, [dataFields.doctorId], function (deleteErr) {
                    if (deleteErr) {
                        console.error("Failed to delete doctor:", deleteErr.message);
                        return resolve(GLOBAL.ERROR_OBJECT);
                    }

                    if (!this.changes) {
                        return resolve({
                            status: 404,
                            message: "Doctor not found or already deleted"
                        });
                    }

                    return resolve({
                        status: 200,
                        message: "Doctor deleted and assigned patients sent back to queue"
                    });
                });
            });
        });
    } catch (error) {
        console.error("Admin Auth Error:", error.message);
        return GLOBAL.ERROR_OBJECT;
    }
}

export { fetchUsersAsAdmin, fetchAppointmentsAsAdmin, removeDoctorAsAdmin }