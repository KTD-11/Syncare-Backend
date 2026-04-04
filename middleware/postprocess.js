function postprocessRegistration(dataFields){
    if (dataFields.name === "" || dataFields.number === "" ){
        return  {
            status: 400,
            message: "Empty data-fields. Please check your data"
        };
    }

    if (dataFields.age === null){
        return {
            status: 400,
            message: "User provided invalid age"
        };
    }

    if (dataFields.gender === null){
        return {
            status: 400,
            message: "Invalid gender provided; required (M or F)"
        };
    }

    if (dataFields.govId === null){
        return {
            status: 400,
            message: "Invalid government ID provided"
        };
    }

    return { status: 200 };
}

function postprocessBooking(dataFields){
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

    return { status: 200 };
}

function postprocessCancel(req){
    if (isNaN(req.appointmentID)) {
        if (!(String(req.appointmentID) === '*'))
            return{
                status: 400,
                message: "invalid appointment ID"
            };

        req.all = true;

        return { status: 200 }
    }

    if (isNaN(req.patientId)){
        return{
            status: 400,
            message: "invalid patient ID"
        };
    }

    req.all = false;
    return {status: 200};
}

function postprocessAdminFetchUsers(dataFields){
    if (!dataFields.id)
        return {
            status: 400,
            message: "Missing credentials"
        };

    return {status: 200};
}

function postprocessAdminFetchAppointments(dataFields){
    if (!dataFields.patientId || !dataFields.appointmentId)
        return {
            status: 400,
            message: "Missing credentials"
        };

    return {status: 200};
}

export { postprocessRegistration, postprocessBooking, postprocessCancel, postprocessAdminFetchUsers, postprocessAdminFetchAppointments}