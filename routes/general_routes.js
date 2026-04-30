import * as preprocess from "../middleware/preprocess.js";

import * as search from "../services/search.js";

import jwt from "jsonwebtoken";

import express from "express";

import { GLOBAL } from "../config/globals.js";

const router = express.Router();

router.post('/signin/', preprocess.preprocessFetchUsers, async (req, res) => {

    const authTokens = {
        authId: String(req.body.auth_id),
        password: String(req.body.password).trim()
    };

    try {
        const searchResults = await search.db_search(authTokens.authId, authTokens.password, false, req.body.staff);

        if (searchResults.status !== 200)
            return res.status(searchResults.status).json(searchResults);

        const payload = {
            id: req.body.staff ? searchResults.data.doctor_id : searchResults.data.patient_id,
            authId: authTokens.authId
        };

        searchResults.token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });

        return res.status(searchResults.status).json(searchResults);
    }

    catch (err) {
        console.error(err.message);

        return res.status(500).json(GLOBAL.ERROR_OBJECT);
    }
});

export { router };
