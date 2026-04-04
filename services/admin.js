import {db} from "../config/db_init.js";
import {GLOBAL} from "../config/globals.js";
import bcrypt from "bcrypt";

function fetchUsersAsAdmin(dataFields){
    return new Promise(async resolve => {
        const match = await bcrypt.compare(dataFields.password, process.env.ADMIN_PASSWORD);

        if (!match)
            return resolve({
                status: 401,
                message: "Invalid credentials"
            });

        if (isNaN(dataFields.id)){
            return resolve({
                status: 400,
                message: "Invalid ID"
            });
        }

        const searchSql = dataFields.id  === GLOBAL.GET_EVERYONE_INDEX?
            `SELECT * FROM patients` :
            `SELECT * FROM patients WHERE patient_id = ?`;

        const params = dataFields.id === GLOBAL.GET_EVERYONE_INDEX ?
            [] : [dataFields.id];

        db.all(searchSql, params, (err, rows)=>{
            if (err){
                console.error(err.message);

                return resolve({
                    status: 500,
                    message: "Internal server error"
                });
            }

            if (rows.length === 0){
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

function fetchAppointmentsAsAdmin(dataFields){
    return new Promise(async resolve => {
        const match = await bcrypt.compare(dataFields.password, process.env.ADMIN_PASSWORD);

        if (!match)
            return resolve({
                status: 401,
                message: "Invalid credentials"
            });

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
            dataFields.appointmentId !== GLOBAL.NONE){
            searchSql =  `SELECT * FROM appointments WHERE appointment_id = ?`;
            params = [dataFields.appointmentId];
        }

        else if (dataFields.appointmentId === GLOBAL.GET_EVERYONE_INDEX ||
            dataFields.patientId === GLOBAL.GET_EVERYONE_INDEX) {
            searchSql =  `SELECT * FROM appointments`;
            params = [];
        }

        else if (dataFields.patientId !== GLOBAL.NONE){
            searchSql =  `SELECT * FROM appointments WHERE patient_id = ?`;
            params = [dataFields.patientId];
        }

        else{
            return resolve({
                status: 404,
                message: "No patient or appointment was selected"
            });
        }

        db.all(searchSql, params, (err, rows)=>{
            if (err){
                console.error(err.message);

                return resolve({
                    status: 500,
                    message: "Internal server error"
                });
            }

            if (rows.length === 0){
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

export { fetchUsersAsAdmin, fetchAppointmentsAsAdmin }