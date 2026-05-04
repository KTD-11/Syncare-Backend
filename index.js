import express from "express";

import 'dotenv/config';

import cors from 'cors';

import * as patientRouter from "./routes/patient_routes.js";

import * as adminRouter from "./routes/admin_routes.js";

import * as generalRouter from "./routes/general_routes.js";

import * as doctorRouter from "./routes/doctors_routes.js"

const app = express();

app.use(cors());

app.use(express.json());

app.use("/patient", patientRouter.router);

app.use("/admin", adminRouter.router);

app.use("/doctor", doctorRouter.router);

app.use("/", generalRouter.router);

app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`);
    }
);
