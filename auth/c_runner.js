import { execFile } from "node:child_process";

import * as path from "node:path"

import * as validate from './validate.js';

import { GLOBAL } from "../config/globals.js";

const enginePath = path.join(import.meta.dirname, 'main')

async function schedule(scheduledTimes, scheduleDuration) {
    return new Promise(resolve => {
        const durationInt = parseInt(scheduleDuration);
        let dateError = false;

        if (isNaN(durationInt))
            return resolve({
                status: 400,
                message: "Invalid time"
            });

        if (durationInt % GLOBAL.SLOT_LENGTH !== 0 || durationInt > 60 || durationInt <= 0)
            return resolve({
                status: 400,
                message: "Invalid duration"
            });

        scheduledTimes.forEach(time => {
            if (validate.validateTime(time) === null)
                dateError = true;
        });

        if (dateError)
            return resolve({
                status: 400,
                message: "Invalid Time"
            });

        const args = [...scheduledTimes, scheduleDuration];

        execFile(enginePath, args, (error, stdout, stderr) => {
            if (error) {
                console.error("Engine Error:", stderr);
                return resolve({
                    status: 500,
                    message: "Scheduling engine failed to process the request; day may be fully booked."
                });
            }

            console.log(stdout.trim());

            return resolve({
                status: 200,
                data: stdout.trim()
            });
        });
    });
}

export { schedule }