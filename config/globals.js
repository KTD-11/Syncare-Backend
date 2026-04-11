const GLOBAL = {
    MAXIMUM_AGE: 200,
    ZERO_INDEX_SHIFT: 1,
    GOV_ID_LENGTH: 14,
    GOV_ID_PREFIXES: [2, 3],
    GOV_ID_GENDER_IDENTIFIER_INDEX: 12,
    PASSWORD_MIN_LENGTH: 10,
    SALT_ROUNDS: 10,
    HASH_DUMMY: "$2a$10$0/e5X26tjOnXqirSwlbDM.lkMPD5YqS5VotXnfH/ZZvck4ZWlR17m", // LOL
    DATE_INDEX: {
        DAY: 0,
        MONTH: 1,
        YEAR: 2
    },
    TIME_INDEX:{
        HOUR: 0,
        MINUTE: 1
    },
    SLOT_LENGTH: 15,
    MINUTES_TO_HOURS: 60,
    SCHEDULED_TIME_DELIMETER: '|',
    AVG_CLINIC_WAITING_TIME: {
        "Adult General Medicine": 30,
        "General Surgery": 15,
        "Women's Health": 30,
        "Children's Health": 15,
        "Heart Clinic": 30,
        "Eye Clinic": 15,
        "Bones and Joints": 15,
        "Brain and Nerves": 30,
        "Skin Clinic": 30,
        "Cancer Care": 30,
        "Ear, Nose, and Throat": 15
    },
    AVAILABLE_CLINICS: [
        "Adult General Medicine",
        "General Surgery",
        "Women's Health",
        "Children's Health",
        "Heart Clinic",
        "Eye Clinic",
        "Bones and Joints",
        "Brain and Nerves",
        "Skin Clinic",
        "Cancer Care",
        "Ear, Nose, and Throat"
    ],
    GET_EVERYONE_INDEX: -1,
    NONE: 0,
    TOKEN_INDEX: 1
}

export { GLOBAL }
