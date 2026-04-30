import { GLOBAL } from "../config/globals.js";
import jwt from "jsonwebtoken";

function preprocessRegistration(req, res, next) {
    if (!req.body.name || req.body.name === "" || !/^[A-Za-z]+$/.test(req.body.name) || !req.body.age || !req.body.number || !req.body.gov_id || !req.body.gender || !req.body.password || !req.body.lat || !req.body.lng) {
        return res.status(400).json({
            status: 400,
            message: "Missing data-fields. Please check your data"
        });
    }

    next();
}

function preprocessBooking(req, res, next) {
    if (!req.user.id || !req.body.date || !req.body.time || !req.body.type) {
        return res.status(400).json({
            status: 400,
            message: "Missing data-fields. Please check your data"
        });
    }

    next();
}

function preprocessFetchUsers(req, res, next) {
    if (!req.body.auth_id || !req.body.password || req.body.staff === null || req.body.staff === undefined) {
        return res.status(400).json({
            status: 400,
            message: "Missing credentials"
        });
    }

    next();
}

function preprocessAdminFetchPatients(req, res, next) {
    if (!req.body.id || !req.body.password || req.body.staff === undefined || req.body.staff === null) {
        return res.status(400).json({
            status: 400,
            message: "Missing credentials"
        });
    }

    next();
}

function preprocessAdminFetchAppointments(req, res, next) {
    if (req.body.patient_id === undefined || req.body.patient_id === null ||
        req.body.appointment_id === undefined || req.body.appointment_id === null  || !req.body.password) {
        return res.status(400).json({
            status: 400,
            message: "Missing credentials"
        });
    }

    next();
}

function preprocessVerifyToken(req, res, next) {
    const header = req.headers['authorization'];

    const token = !header ? null : header.split(' ')[GLOBAL.TOKEN_INDEX];

    if (!token)
        return res.status(401).json({
            status: 401,
            message: "Missing token credentials"
        });

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);

        next();
    }
    catch (e) {
        return res.status(403).json({
            status: 403,
            message: "Invalid or expired token"
        });
    }
}

function preprocessCancel(req, res, next) {
    if (!req.body.appointment_id || !req.user.id)
        return res.status(400).json({
            status: 400,
            message: "Missing credentials"
        });

    next();
}

function preprocessAdminCreateDoctor(req, res, next){
    if (!req.body.name || req.body.name === "" || !/^[A-Za-z '-]+$/.test(req.body.name)|| !req.body.specialty ||
        !req.body.auth_id || !req.body.password || !req.body.admin_password || !req.body.gender){
        return res.status(400).json({
            status: 400,
            message: "Missing data-fields. Please check your data"
        });
    }

    next();
}

function preprocessUpdateAppointment(req, res, next){
    if (!req.params.appointmentID)
        return res.status(400).json({
            status: 400,
            message: "Missing data-fields. Please check your data"
        });

    next();
}

function preprocessAdminDeleteDoctor(req, res, next){
    if (!req.body.password || !req.body.id)
        return res.status(400).json({
            status: 400,
            message: "Missing data-fields. Please check your data"
        });

    next();
}

export {
    preprocessRegistration, preprocessBooking, preprocessFetchUsers, preprocessAdminFetchPatients,
    preprocessAdminFetchAppointments, preprocessVerifyToken, preprocessCancel, preprocessAdminCreateDoctor,
    preprocessUpdateAppointment, preprocessAdminDeleteDoctor
}