import express from "express";

import 'dotenv/config';

import jwt from 'jsonwebtoken';

import cors from 'cors';

import { GLOBAL } from "./config/globals.js";

import { schedule } from "./auth/c_runner.js";

import * as search from "./services/search.js";

import * as validate from "./auth/validate.js";

import * as preprocess from "./middleware/preprocess.js"

import * as postprocess from "./middleware/postprocess.js"

import * as database from "./services/database.js";

import * as admin from "./services/admin.js";

import * as encrypt from "./auth/encryption_utils.js";

//initializing the express server
const app = express();

app.use(cors());

app.use(express.json());

app.post('/signup/', preprocess.preprocessRegistration, async (req, res) => {
    //sanitizing the input data
    const gender = validate.validateGender(req.body.gender);

    const dataFields = {
        name: String(req.body.name).trim(),
        age: validate.validateAge(req.body.age),
        gender: gender,
        number: validate.validateNumber(req.body.number),
        govId: validate.validateGovID(String(req.body.gov_id), gender),
        location: validate.validateLocation(req.body.lat, req.body.lng),
        locationEncrypted: null,
        passwordHash: null
    };

    //checking for empty data-fields
    const postprocess_results = postprocess.postprocessRegistration(dataFields);

    if (postprocess_results.status !== 200)
        return res.status(postprocess_results.status).json(postprocess_results);

    try {
        dataFields.passwordHash = await validate.hashPassword(req.body.password);

        if (dataFields.passwordHash === null) {
            return res.status(400).json({
                status: 400,
                message: `Passwords must be longer than ${GLOBAL.PASSWORD_MIN_LENGTH} characters`
            });
        }

        const searchResult = await search.isAvailable(dataFields.govId);

        //checking if a user with the same gov_id already exists
        if (searchResult.status !== 200) {
            return res.status(searchResult.status).json(searchResult);
        }

        dataFields.locationEncrypted = encrypt.encryptLocation(dataFields.location);

        const insertUser = await database.insertNewPatient(dataFields);

        if (insertUser.status !== 201)
            return res.status(insertUser.status).json(insertUser);

        const payload = {
            id: insertUser.id,
            govID: dataFields.govId
        };

        insertUser.token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });

        return res.status(insertUser.status).json(insertUser);
    }

    catch (err) {
        console.error(err.message);

        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }
});

app.post('/signin/', preprocess.preprocessFetchPatients, async (req, res) => {

    const authTokens = {
        govId: String(req.body.gov_id),
        password: String(req.body.password).trim()
    };

    try {
        const searchResults = await search.db_search(authTokens.govId, authTokens.password, true);

        if (searchResults.status !== 200)
            return res.status(searchResults.status).json(searchResults);

        const payload = {
            id: searchResults.data.patient_id,
            govID: authTokens.govId
        };

        searchResults.token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });

        return res.status(searchResults.status).json(searchResults);
    }

    catch (err) {
        console.error(err.message);

        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }
});

app.post('/book/', preprocess.preprocessVerifyToken, preprocess.preprocessBooking, async (req, res) => {

    let dataFields = {
        id: req.user.id,
        date: validate.validateDate(req.body.date),
        time: validate.validateTime(req.body.time),
        type: validate.validateType(req.body.type),
        clinic: String(req.body.type).trim()
    }

    const postprocess_results = postprocess.postprocessBooking(dataFields);

    if (postprocess_results.status !== 200)
        return res.status(postprocess_results.status).json(postprocess_results);

    try {
        if (!await search.userExists(req.user.govID))
            return res.status(404).json({
                status: 404,
                message: "User not found"
            });

        const scheduledAppointments = await search.booked_appointment_search(dataFields.date);

        if (scheduledAppointments.status !== 200)
            return res.status(scheduledAppointments.status).json(scheduledAppointments);

        const appointmentSchedule = await schedule([...scheduledAppointments.data, dataFields.time], String(dataFields.type));

        if (appointmentSchedule.status !== 200)
            return res.status(appointmentSchedule.status).json(appointmentSchedule);

        const timeParts = appointmentSchedule.data.split(GLOBAL.SCHEDULED_TIME_DELIMETER);
        const scheduledTime = timeParts[timeParts.length - GLOBAL.ZERO_INDEX_SHIFT];

        const insertBooking = await database.insertBooking(dataFields, scheduledTime);

        return res.status(insertBooking.status).json(insertBooking);
    }

    catch (err) {
        console.error(err.message);

        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }
});

app.get('/appointments/', preprocess.preprocessVerifyToken, async (req, res) => {
    try {
        const appointments = await search.appointmentSearch(req.user.id);

        return res.status(appointments.status).json(appointments);
    }

    catch (err) {
        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }
});

app.delete('/remove/', preprocess.preprocessVerifyToken, async (req, res) => {

    const dataFields = {
        govId: req.user.govID,
        id: req.user.id
    }

    try {
        const deleteResult = await database.deleteUser(dataFields);

        return res.status(deleteResult.status).json(deleteResult);
    }

    catch (err) {
        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }
});

app.post('/admin/users/', preprocess.preprocessAdminFetchPatients, async (req, res) => {

    const dataFields = {
        password: String(req.body.password).trim(),
        id: parseInt(req.body.id)
    }

    const postprocess_results = postprocess.postprocessAdminFetchUsers(dataFields);

    if (postprocess_results.status !== 200)
        return res.status(postprocess_results.status).json(postprocess_results);

    try {
        const patientData = await admin.fetchUsersAsAdmin(dataFields);

        return res.status(patientData.status).json(patientData);
    }

    catch (e) {
        console.error(e);

        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }
});

app.post('/admin/appointments/', preprocess.preprocessAdminFetchAppointments, async (req, res) => {

    const dataFields = {
        password: String(req.body.password).trim(),
        patientId: parseInt(req.body.patient_id),
        appointmentId: parseInt(req.body.appointment_id)
    }

    const postprocess_results = postprocess.postprocessAdminFetchAppointments(dataFields);

    if (postprocess_results.status !== 200)
        return res.status(postprocess_results.status).json(postprocess_results);

    try {
        const appointments = await admin.fetchAppointmentsAsAdmin(dataFields);

        return res.status(appointments.status).json(appointments);
    }

    catch (err) {
        console.error(err.message);

        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }
});

app.post('/cancel/', preprocess.preprocessVerifyToken, preprocess.preprocessCancel, async (req, res) => {
    const postprocess_results = postprocess.postprocessCancel(req);

    if (postprocess_results.status !== 200)
        return res.status(postprocess_results.status).json(postprocess_results);

    let dataFields = {
        patientId: req.user.id,
        deleteAll: req.all
    }

    dataFields.appointmentId = dataFields.deleteAll ? null : parseInt(req.body.appointment_id);

    try {
        const delete_result = await database.cancelAppointment(dataFields);

        return res.status(delete_result.status).json(delete_result);
    }

    catch (err) {
        console.error(err.message);

        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`);
    }
);
