import * as preprocess from "../middleware/preprocess.js";

import * as postprocess from "../middleware/postprocess.js";

import * as validate from "../auth/validate.js";

import { GLOBAL } from "../config/globals.js";

import * as search from "../services/search.js";

import express from "express";

import * as admin from "../services/admin.js";

import * as database from "../services/database.js";

import jwt from "jsonwebtoken";

const router = express.Router();


router.post('/users/', preprocess.preprocessAdminFetchPatients, async (req, res) => {

    const dataFields = {
        password: String(req.body.password).trim(),
        staff: req.body.staff,
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
        console.error(e.message);

        return res.status(500).json(GLOBAL.ERROR_OBJECT);
    }
});

router.post('/appointments/', preprocess.preprocessAdminFetchAppointments, async (req, res) => {

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

        return res.status(500).json(GLOBAL.ERROR_OBJECT);
    }
});

router.post('/add_new_doctor/', preprocess.preprocessAdminCreateDoctor, async (req, res) => {
    let dataFields = {
        name: String(req.body.name).trim(),
        specialty: validate.validateSpecialty(req.body.specialty),
        authID: validate.validateAuthId(req.body.auth_id),
        gender: validate.validateGender(req.body.gender),
        adminPassword: String(req.body.admin_password).trim(),
        passwordHash: null
    };

    const postprocessResults = postprocess.postprocessAdminCreateDoctor(dataFields);

    if (postprocessResults.status !== 200)
        return res.status(postprocessResults.status).json(postprocessResults);

    try {
        dataFields.passwordHash = await validate.hashPassword(req.body.password);

        if (dataFields.passwordHash === null)
            return res.status(400).json({
                status: 400,
                message: `Passwords must be longer than ${GLOBAL.PASSWORD_MIN_LENGTH} characters`
            });

        const userExists = await search.isAvailable(dataFields.authID, true);

        if (userExists.status !== 200)
            return res.status(userExists.status).json(userExists);

        const insertDoctor = await database.insertNewUser(dataFields, true);

        if (insertDoctor.status !== 201)
            return res.status(insertDoctor.status).json(insertDoctor);

        const payload = {
            id: insertDoctor.id,
            authId: dataFields.authID
        }

        insertDoctor.token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });

        return res.status(200).json(insertDoctor);


    } catch (e) {
        console.error(e.message);

        return res.status(500).json(GLOBAL.ERROR_OBJECT);
    }
});

router.post('/remove_doctor/', preprocess.preprocessAdminDeleteDoctor, async (req, res) => {
    try {
        const dataFields = {
            password: String(req.body.password).trim(),
            doctorId: String(req.body.id)
        };

        const postprocessResults = postprocess.postprocessAdminRemoveDoctor(dataFields);

        if (postprocessResults.status !== 200)
            return res.status(postprocessResults.status).json(postprocessResults);


        const deleteDoctor = await admin.removeDoctorAsAdmin(dataFields);

        return res.status(deleteDoctor.status).json(deleteDoctor);
    }
    catch (e) {
        console.error(e.message);

        return res.status(500).json(GLOBAL.ERROR_OBJECT);
    }
})

export { router };