import { db } from "../config/db_init.js";

import { GLOBAL } from "../config/globals.js";

import { encrypt, decrypt } from "../auth/encryption_utils.js";

function insertNewUser(dataFields, staff) {
    return new Promise((resolve) => {
        const insertSql = staff ? `INSERT INTO doctors (doctor_name,
                                                        doctor_specialty,
                                                        doctor_auth_id,
                                                        doctor_gender,
                                                        password_hash,
                                                        assigned_patients)
                                VALUES (?, ?, ?, ?, ?, ?)`

            : `INSERT INTO patients (patient_name,
                                                     patient_gender,
                                                     patient_number,
                                                     patient_age,
                                                     patient_gov_id,
                                                     password_hash,
                                                     location_string)
                               VALUES (?, ?, ?, ?, ?, ?, ?)`;

        const params = staff ? [
            dataFields.name,
            dataFields.specialty,
            dataFields.authID,
            dataFields.gender,
            dataFields.passwordHash,
            GLOBAL.INITIAL_ASSIGNED_PATIENTS
        ] : [
            dataFields.name,
            dataFields.gender,
            dataFields.number,
            dataFields.age,
            dataFields.govId,
            dataFields.passwordHash,
            dataFields.locationEncrypted];

        db.run(insertSql, params, function (err) {

            if (err) {
                console.error(err.message);

                if (err.message.includes('UNIQUE constraint failed')) {
                    return resolve({
                        status: 409,
                        message: "User with this number already exists"
                    });
                }

                return resolve(GLOBAL.ERROR_OBJECT);
            }

            return resolve(
                {
                    status: 201,
                    message: `user with id ${this.lastID} has been successfully added`,
                    id: this.lastID
                }
            );
        });
    });
}

function insertBooking(dataFields, scheduledTime) {
    const insertSql = `INSERT INTO appointments (  appointment_date,
                                                            appointment_time,
                                                            appointment_type,
                                                            patient_id,
                                                            appointment_name,
                                                            doctor_id,
                                                            status) 
                                    values (?, ?, ?, ?, ?, ?, ?)`;

    const UpdateSql = `UPDATE doctors SET assigned_patients = assigned_patients + 1 WHERE doctor_id = ?`;

    return new Promise(resolve => {
        db.run(insertSql, [dataFields.date, scheduledTime, dataFields.type, dataFields.id,
        dataFields.clinic, dataFields.doctorID, GLOBAL.APPOINTMENT_NOT_DONE], function (err) {
            if (err) {
                console.error(err.message);

                return resolve(GLOBAL.ERROR_OBJECT);
            }

            db.run(UpdateSql, [dataFields.doctorID], function (err) {
                if (err) {
                    console.error(err.message);

                    return resolve({
                        status: 500,
                        message: "Internal server error"
                    });
                }

                return resolve({
                    status: 201,
                    message: `Appointment successfully booked at ${scheduledTime}`,
                    appointmentID: this.lastID
                });
            });
        });
    });
}

function deleteUser(dataFields) {
    return new Promise(resolve => {
        const delSql = `DELETE FROM patients WHERE (patient_gov_id = ?)`;

        db.run(delSql, [dataFields.authId], function (err) {
            if (err) {
                console.error(err.message);

                return resolve({
                    status: 500,
                    message: "Internal server error"
                });
            }

            if (!this.changes)
                return resolve({
                    status: 404,
                    message: "User already deleted"
                });

            return resolve({
                status: 204,
                message: "user deleted successfully"
            });
        });
    });
}

function cancelAppointment(dataFields) {
    return new Promise(resolve => {
        const delSql = dataFields.deleteAll ?
            `DELETE FROM appointments WHERE (patient_id = ?)` :
            `DELETE FROM appointments WHERE (appointment_id = ?) AND (patient_id = ?)`;

        const params = dataFields.deleteAll ?
            [dataFields.patientId] : [dataFields.appointmentId, dataFields.patientId];

        const errorMessage = dataFields.deleteAll ?
            `No appointments found for patient with ID ${dataFields.patientId}` :
            `No appointment with ID ${dataFields.appointmentId} found for patient with ID ${dataFields.patientId}`;

        db.run(delSql, params, function (err) {
            if (err) {
                console.error(err.message);

                return resolve(GLOBAL.ERROR_OBJECT);
            }

            if (!this.changes) {
                return resolve({
                    status: 404,
                    message: errorMessage
                });
            }

            return resolve({
                status: 200,
                message: "appointment deleted successfully"
            });
        })
    });
}

function updateAppointmentStatus(appointmentID, doctorID) {
    return new Promise(resolve => {
        const updateSql = `UPDATE appointments SET status = 1 - status WHERE (appointment_id = ? AND doctor_id = ?)`;

        db.run(updateSql, [appointmentID, doctorID], function (err) {
            if (err) {
                console.error(err);

                return resolve(GLOBAL.ERROR_OBJECT);
            }

            if (!this.changes)
                return resolve({
                    status: 404,
                    message: "No available appointments to update"
                });

            return resolve({ status: 204 })
        });
    });
}

function pushReport(dataFields) {
    return new Promise(resolve => {
        const updateSql = `UPDATE appointments SET clinical_results = ? WHERE (appointment_id = ? AND doctor_id = ?)`;

        const encrypted = encrypt({
            reportType: dataFields.reportType,
            reportBody: dataFields.reportBody
        });


        db.run(updateSql, [encrypted, dataFields.appointmentId, dataFields.doctorID], function (err) {
            if (err) {
                console.error(err.message);

                return resolve(GLOBAL.ERROR_OBJECT);
            }

            if (!this.changes) {
                return resolve({
                    status: 404,
                    message: "couldn't update appointment"
                });
            }

            return resolve({ status: 204 });
        })
    });
}

function patientGetReport(dataFields) {
    return new Promise(resolve => {
        const searchSql = `SELECT clinical_results FROM appointments WHERE (patient_id = ? AND appointment_id = ?)`;

        db.get(searchSql, [dataFields.patientId, dataFields.appointmentId], (err, row) => {
            if (err) {
                console.error(err.message);

                return resolve(GLOBAL.ERROR_OBJECT);
            }

            if (!row || !row.clinical_results) {
                return resolve({
                    status: 400,
                    message: "no report found"
                });
            }

            const decryptedData = decrypt(row.clinical_results);

            return resolve({
                status: 200,
                data: decryptedData
            })
        })
    });
}

export { insertNewUser, insertBooking, deleteUser, cancelAppointment, updateAppointmentStatus, pushReport, patientGetReport }