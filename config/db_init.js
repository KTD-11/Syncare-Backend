import sqlite3 from 'sqlite3';

const sql3 = sqlite3.verbose();

const db = new sql3.Database('./main.db', (err) => {
    if (err) return console.error(err.message);
    console.log("Connected to SQLite");

    db.run("PRAGMA foreign_keys = ON;"); //insuring that sqlite doesn't toss out the foreign key rule
});

//initializing the main table
db.run(`CREATE TABLE IF NOT EXISTS patients(
        patient_id INTEGER PRIMARY KEY,
        patient_name TEXT NOT NULL,
        patient_gender TEXT NOT NULL,
        patient_number TEXT NOT NULL UNIQUE,
        patient_age INTEGER NOT NULL,
        patient_gov_id TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        location_string TEXT NOT NULL UNIQUE
    )`, [], (err)=>{

    if (err)
        return console.error(err.message);

    console.log("patients TABLE created");
});

//initializing the appointment table
db.run(`CREATE TABLE IF NOT EXISTS appointments(
        appointment_id INTEGER PRIMARY KEY,
        appointment_date TEXT NOT NULL,
        appointment_time TEXT NOT NULL,
        appointment_type TEXT NOT NULL,
        patient_id INTEGER NOT NULL,
        appointment_name TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
        UNIQUE(appointment_date, appointment_time)
    )`, [], (err) => {

    if (err) return console.error(err.message);

    console.log("Appointments TABLE created");
});

export { db };