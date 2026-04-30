import * as preprocess from "../middleware/preprocess.js";

import * as search from "../services/search.js";

import * as postprocess from "../middleware/postprocess.js";

import * as database from "../services/database.js";

import * as validate from "../auth/validate.js"

import express from "express";

import { GLOBAL } from "../config/globals.js";

const router = express.Router();

router.get("/patients/", preprocess.preprocessVerifyToken, async (req, res)=>{
    try{
        const appointedAppointments = await search.doctorFetchAppointments(req.user.id);

        return res.status(appointedAppointments.status).json(appointedAppointments);
    }
    catch (e){
        console.error(e.message);

        return res.status(500).json(GLOBAL.ERROR_OBJECT);
    }
});


router.patch("/updateappointment/:appointmentID", preprocess.preprocessVerifyToken, preprocess.preprocessUpdateAppointment, async (req, res)=>{
    try {
        const postprocessResults = postprocess.postprocessUpdateAppointment(req.params.appointmentID);

        if (postprocessResults.status !== 200)
            return res.status(postprocessResults.status).json(postprocessResults);

        const statusUpdate = await database.updateAppointmentStatus(parseInt(req.params.appointmentID), req.user.id);

        return res.status(statusUpdate.status).json(statusUpdate);
    }

    catch (e) {
        console.error(e.message)

        return res.status(500).json(GLOBAL.ERROR_OBJECT);
    }
});

router.patch("/sendreport/", preprocess.preprocessVerifyToken, async (req, res)=>{
    try{
        const dataFields = {
            appointmentId: parseInt(req.body.appointment_id),
            reportType: validate.validateReportType(req.body.type),
            reportBody: String(req.body.report).trim(),
            doctorID: req.user.id
        };

        const postprocessResults = postprocess.postprocessReport(dataFields);

        if (postprocessResults.status !== 200)
            return res.status(postprocessResults.status).json(postprocessResults);

        const pushReport = await database.pushReport(dataFields);

        return res.status(pushReport.status).json(pushReport);
    }

    catch (e){
        console.error(e.message);

        return res.status(500).json(GLOBAL.ERROR_OBJECT)
    }
});

export {router}