import { db } from "../config/db_init.js";

function insertNewPatient(dataFields){
    return new Promise((resolve) => {
        const insertSql = `INSERT INTO patients (patient_name,
                                                     patient_gender,
                                                     patient_number,
                                                     patient_age,
                                                     patient_gov_id,
                                                     password_hash)
                               VALUES (?, ?, ?, ?, ?, ?)`;

        db.run(insertSql, [dataFields.name,
            dataFields.gender,
            dataFields.number,
            dataFields.age,
            dataFields.govId,
            dataFields.passwordHash], function (err) {

            if (err){
                console.error(err.message);

                if (err.message.includes('UNIQUE constraint failed')){
                    return resolve ({
                        status: 409,
                        message: "User already number already exists"
                    });
                }

                return resolve ({
                    status: 500,
                    message: "Internal server error"
                });
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

function insertBooking(dataFields, scheduledTime){
    const insertSql = `INSERT INTO appointments (  appointment_date,
                                                            appointment_time,
                                                            appointment_type,
                                                            patient_id,
                                                            appointment_name) values (?, ?, ?, ?, ?)`;

    return new Promise(resolve => {
        db.run(insertSql, [dataFields.date, scheduledTime, dataFields.type, dataFields.id, dataFields.clinic], function (err) {
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
}

function deleteUser(dataFields){
    return new Promise(resolve => {
        const delSql = `DELETE FROM patients WHERE (patient_gov_id = ?)`;

        db.run(delSql, [dataFields.govId], function (err){
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

function cancelAppointment(dataFields){
    return new Promise(resolve => {
        const delSql = dataFields.deleteAll ?
            `DELETE FROM appointments WHERE (patient_id = ?)` :
            `DELETE FROM appointments WHERE (appointment_id = ?) AND (patient_id = ?)`;

        const params = dataFields.deleteAll ?
            [dataFields.patientId] : [dataFields.appointmentId, dataFields.patientId];

        const errorMessage = dataFields.deleteAll ?
            `No appointments found for patient with ID ${dataFields.patientId}` :
            `No appointment with ID ${dataFields.appointmentId} found for patient with ID ${dataFields.patientId}`;

        db.run(delSql, params, function (err){
            if (err) {
                console.error(err.message);

                return resolve({
                    status: 500,
                    message: "Internal server error"
                });
            }

            if (!this.changes){
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


export {insertNewPatient, insertBooking, deleteUser, cancelAppointment}