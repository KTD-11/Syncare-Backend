import bcrypt from "bcrypt";

import { GLOBAL } from "../config/globals.js";

function validateAge(age){
    const ageInt = parseInt(age);

    if (isNaN(ageInt) || ageInt > GLOBAL.MAXIMUM_AGE || ageInt < 0)
        return null;

    return ageInt;
}

function validateGender(gender){
    const normalizedGender = String(gender).toUpperCase();

    if (normalizedGender !== "M" && normalizedGender !== "F")
        return null

    return normalizedGender;
}

function validateGovID(govID, gender){
    if (gender === null){
        return null;
    }

    if (GLOBAL.GOV_ID_LENGTH !== String(govID).length) {
        return null;
    }

    if (parseInt(govID[0]) !== GLOBAL.GOV_ID_PREFIXES[0] && parseInt(govID[0]) !== GLOBAL.GOV_ID_PREFIXES[1]){
        return null;
    }

    if ((gender === 'F' && String(govID)[GLOBAL.GOV_ID_GENDER_IDENTIFIER_INDEX] % 2 !== 0) ||
        (gender === 'M' && String(govID)[GLOBAL.GOV_ID_GENDER_IDENTIFIER_INDEX] % 2 === 0)){
        return null;
    }

    return govID.trim();
}

function validateDate(date){
    const currentDate = new Date();

    let normalizedDate = String(date).split('/');

    const day = parseInt(normalizedDate[GLOBAL.DATE_INDEX.DAY]);
    const month = parseInt(normalizedDate[GLOBAL.DATE_INDEX.MONTH]);
    const year = parseInt(normalizedDate[GLOBAL.DATE_INDEX.YEAR]);

    if (isNaN(day) || isNaN(month) || isNaN(year))
        return null;

    if (day > 31 || day <= 0)
        return null;

    if (month > 12 || month <= 0)
        return null;

    if (year < currentDate.getFullYear())
        return null;

    const appointmentDate = new Date(year, month - GLOBAL.ZERO_INDEX_SHIFT, day);

    if (appointmentDate.getMonth() !== month - GLOBAL.ZERO_INDEX_SHIFT)
        return null;

    if (appointmentDate <= currentDate)
        return null

    return String(date);
}

function validateTime(time){
    const normalizedTime = String(time).split(':');

    const hours = parseInt(normalizedTime[GLOBAL.TIME_INDEX.HOUR]);
    const minutes = parseInt(normalizedTime[GLOBAL.TIME_INDEX.MINUTE]);

    if (isNaN(hours) || isNaN(minutes))
        return null;

    if (hours > 23 || hours < 0)
        return null

    if (minutes >= 60 || minutes < 0)
        return null;

    const stringHours = String(hours).padStart(2, '0');
    const stringMinutes = String(minutes).padStart(2, '0');

    return `${stringHours}:${stringMinutes}`;
}

function validateType(type){
    const normalizedType = GLOBAL.AVG_CLINIC_WAITING_TIME[type];

    if (normalizedType === undefined)
        return null;

    return normalizedType;
}

async function hashPassword(password){
    if (password.length < GLOBAL.PASSWORD_MIN_LENGTH){
        return null;
    }

    return await bcrypt.hash(password, GLOBAL.SALT_ROUNDS);
}


export {validateAge, validateGender, validateGovID, hashPassword, validateDate, validateTime, validateType}