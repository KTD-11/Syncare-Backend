import { GLOBAL } from "../config/globals.js";

function postprocessRegistration(dataFields) {
    if (dataFields.name === "" || dataFields.number === "") {
        return {
            status: 400,
            message: "Empty data-fields. Please check your data"
        };
    }

    if (dataFields.age === null) {
        return {
            status: 400,
            message: "User provided invalid age"
        };
    }

    if (dataFields.gender === null) {
        return {
            status: 400,
            message: "Invalid gender provided; required (M or F)"
        };
    }

    if (dataFields.govId === null) {
        return {
            status: 400,
            message: "Invalid government ID provided"
        };
    }

    if (dataFields.location === null) {
        return {
            status: 400,
            message: "Invalid location"
        };
    }

    return { status: 200 };
}

function postprocessBooking(dataFields) {
    if (isNaN(dataFields.id))
        return {
            status: 400,
            message: "Invalid ID"
        };


    if (dataFields.date === null)
        return {
            status: 400,
            message: "Invalid date"
        };

    if (dataFields.time === null)
        return {
            status: 400,
            message: "Invalid time"
        };

    if (dataFields.password === "")
        return {
            status: 400,
            message: "Invalid credentials"
        };

    let correctClinic = false;
    GLOBAL.AVAILABLE_CLINICS.forEach(clinic => {
        if (clinic === dataFields.clinic)
            correctClinic = true;
    });

    if (!correctClinic)
        return {
            status: 400,
            message: "Invalid clinic"
        };

    return { status: 200 };
}

function postprocessCancel(req) {
    if (isNaN(parseInt(req.body.appointment_id))) {
        if (!(String(req.body.appointment_id) === '*'))
            return {
                status: 400,
                message: "invalid appointment ID"
            };

        req.all = true;

        return { status: 200 }
    }

    req.all = false;
    return { status: 200 };
}

function postprocessAdminFetchUsers(dataFields) {
    if (!dataFields.id || !dataFields.password)
        return {
            status: 400,
            message: "Missing credentials"
        };

    return { status: 200 };
}

function postprocessAdminFetchAppointments(dataFields) {
    if (isNaN(dataFields.patientId) || isNaN(dataFields.appointmentId) || !dataFields.password)
        return {
            status: 400,
            message: "Missing credentials"
        };

    return { status: 200 };
}

function postprocessAdminCreateDoctor(dataFields) {
    if (dataFields.name === null)
        return {
            status: 400,
            message: "invalid name"
        };

    if (dataFields.authID === null)
        return {
            status: 400,
            message: "invalid auth id"
        };

    if (dataFields.specialty === null)
        return {
            status: 400,
            message: "invalid specialty"
        };

    if (dataFields.gender === null)
        return {
            status: 400,
            message: "Invalid gender provided; required (M or F)"
        };

    return { status: 200 };
}

function postprocessUpdateAppointment(appointmentID) {
    if (isNaN(parseInt(appointmentID)))
        return {
            status: 400,
            message: "Invalid appointment ID"
        }

    return { status: 200 }
}

function postprocessReport(dataFields) {
    if (dataFields.type === null)
        return {
            status: 400,
            message: "Invalid report type"
        }

    if (dataFields.reportBody === "" || !dataFields.reportBody)
        return {
            status: 400,
            message: "Invalid report body"
        }

    if (isNaN(dataFields.appointmentId) || dataFields.appointmentId < 0)
        return {
            status: 400,
            message: "Invalid appointment ID"
        }

    return { status: 200 }
}

function postprocessPatientGetReport(dataFields) {
    if (isNaN(dataFields.patientId))
        return {
            status: 400,
            message: "Invalid patient id"
        };

    if (isNaN(dataFields.appointmentId))
        return {
            status: 400,
            message: "Invalid appointment id"
        };

    return { status: 200 }
}

function postprocessAdminRemoveDoctor(dataFields) {
    if (!dataFields.password)
        return {
            status: 400,
            message: "Missing Admin password"
        };

    if (!dataFields.id)
        return {
            status: 400,
            message: "Missing doctor id"
        };

    return { status: 200 }
}

export {
    postprocessRegistration, postprocessBooking, postprocessCancel,
    postprocessAdminFetchUsers, postprocessAdminFetchAppointments, postprocessAdminCreateDoctor,
    postprocessUpdateAppointment, postprocessReport, postprocessPatientGetReport, postprocessAdminRemoveDoctor
}