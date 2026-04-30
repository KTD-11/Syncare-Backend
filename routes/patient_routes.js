import * as preprocess from "../middleware/preprocess.js";

import * as postprocess from "../middleware/postprocess.js";

import * as validate from "../auth/validate.js";

import { GLOBAL } from "../config/globals.js";

import * as search from "../services/search.js";

import express from "express";

const router = express.Router();

import jwt from "jsonwebtoken";

import * as database from "../services/database.js";

import { schedule } from "../auth/c_runner.js";

import { encrypt } from "../auth/encryption_utils.js";

router.post('/book/', preprocess.preprocessVerifyToken, preprocess.preprocessBooking, async (req, res) => {

    let dataFields = {
        id: req.user.id,
        date: validate.validateDate(req.body.date),
        time: validate.validateTime(req.body.time),
        type: validate.validateType(req.body.type),
        clinic: validate.validateSpecialty(req.body.type)
    }

    const postprocess_results = postprocess.postprocessBooking(dataFields);

    if (postprocess_results.status !== 200)
        return res.status(postprocess_results.status).json(postprocess_results);

    try {
        if (!await search.userExists(req.user.authId, false))
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

        const availableDoctors = await search.availableDoctor(dataFields.clinic);

        if (availableDoctors.status !== 200)
            return res.status(availableDoctors.status).json(availableDoctors);

        dataFields.doctorID = availableDoctors.data.doctor_id;

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

router.get('/appointments/', preprocess.preprocessVerifyToken, async (req, res) => {
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

router.delete('/remove/', preprocess.preprocessVerifyToken, async (req, res) => {

    const dataFields = {
        authId: req.user.authId,
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

router.post('/cancel/', preprocess.preprocessVerifyToken, preprocess.preprocessCancel, async (req, res) => {
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

router.post('/signup/', preprocess.preprocessRegistration, async (req, res) => {
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

        const searchResult = await search.isAvailable(dataFields.govId, false);

        //checking if a user with the same gov_id already exists
        if (searchResult.status !== 200) {
            return res.status(searchResult.status).json(searchResult);
        }

        dataFields.locationEncrypted = encrypt(dataFields.location);

        const insertUser = await database.insertNewUser(dataFields, false);

        if (insertUser.status !== 201)
            return res.status(insertUser.status).json(insertUser);

        const payload = {
            id: insertUser.id,
            authId: dataFields.govId
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

router.get("/report/:appointmentID", preprocess.preprocessVerifyToken, async (req, res) => {
    try {
        const dataFields = {
            appointmentId: parseInt(req.params.appointmentID),
            patientId: parseInt(req.user.id)
        };

        const postprocessResults = postprocess.postprocessPatientGetReport(dataFields);

        if (postprocessResults.status !== 200)
            return res.status(postprocessResults.status).json(postprocessResults);

        const decryptedData = await database.patientGetReport(dataFields);

        return res.status(decryptedData.status).json(decryptedData);
    }

    catch (e) {
        console.error(e.message);

        return res.status(500).json(GLOBAL.ERROR_OBJECT);
    }
});

export { router };