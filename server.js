// ======================================================
// CAMPUS2CAREER SERVER.JS
// PART 1 OF 2
// ======================================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const db = require("./config/db");




// ======================================================
// APP CONFIGURATION
// ======================================================

const app = express();

const PORT =
    Number(process.env.PORT) || 5000;

const JWT_SECRET =
    process.env.JWT_SECRET ||
    "campus2career_dev_secret_change_this";


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
    cors()
);

app.use(
    express.json({
        limit: "25mb"
    })
);


// ======================================================
// REQUEST LOGGER
// ======================================================

app.use(
    (req, res, next) => {

        console.log(
            `${new Date().toISOString()} ${req.method} ${req.originalUrl}`
        );

        next();

    }
);


// ======================================================
// DATABASE HELPER
// ======================================================

function query(
    sql,
    params = [],
    callback
) {

    db.query(
        sql,
        params,
        callback
    );

}


// ======================================================
// CLEAN STRING
// ======================================================

function clean(
    value
) {

    return typeof value === "string"
        ? value.trim()
        : "";

}


// ======================================================
// JWT AUTHENTICATION
// ======================================================

function authenticateToken(
    req,
    res,
    next
) {

    const header =
        req.headers.authorization;


    if (
        !header ||
        !header.startsWith("Bearer ")
    ) {

        return res.status(401).json({

            success:
                false,

            error:
                "Authentication required. Please log in."

        });

    }


    const token =
        header
            .substring(7)
            .trim();


    if (!token) {

        return res.status(401).json({

            success:
                false,

            error:
                "Authentication token is missing."

        });

    }


    jwt.verify(
        token,
        JWT_SECRET,
        (err, decoded) => {

            if (err) {

                return res.status(401).json({

                    success:
                        false,

                    error:
                        "Invalid or expired authentication token."

                });

            }


            const userId =
                Number(
                    decoded.userId
                );


            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {

                return res.status(401).json({

                    success:
                        false,

                    error:
                        "Invalid authentication token."

                });

            }


            /*
             * Company accounts include:
             *
             * decoded.companyId
             * decoded.accountType = "company"
             *
             * Normal user accounts will not have
             * these values, so they remain null/user.
             */

            const companyId =
                decoded.companyId
                    ? Number(decoded.companyId)
                    : null;


            if (
                companyId !== null &&
                (
                    !Number.isInteger(companyId) ||
                    companyId <= 0
                )
            ) {

                return res.status(401).json({

                    success:
                        false,

                    error:
                        "Invalid company authentication token."

                });

            }


            req.user = {

                id:
                    userId,

                username:
                    decoded.username || "",

                email:
                    decoded.email || "",

                companyId:
                    companyId,

                accountType:
                    decoded.accountType || "user"

            };


            next();

        }
    );

}


// ======================================================
// OPTIONAL JWT
// ======================================================
//
// Allows public APIs such as posts to work even
// when a token is not provided.
//
// ======================================================

function optionalAuth(
    req,
    res,
    next
) {

    const header =
        req.headers.authorization;


    if (
        !header ||
        !header.startsWith("Bearer ")
    ) {

        return next();

    }


    const token =
        header
            .substring(7)
            .trim();


    if (!token) {

        return next();

    }


    jwt.verify(
        token,
        JWT_SECRET,
        (err, decoded) => {

            if (!err) {

                const userId =
                    Number(
                        decoded.userId
                    );


                if (
                    Number.isInteger(userId) &&
                    userId > 0
                ) {

                    req.user = {

                        id:
                            userId,

                        username:
                            decoded.username || "",

                        email:
                            decoded.email || ""

                    };

                }

            }


            next();

        }
    );

}


// ======================================================
// TEST API
// ======================================================

app.get(
    "/api/test",
    (req, res) => {

        res.json({

            success:
                true,

            message:
                "Campus2Career API is working."

        });

    }
);


// ======================================================
// SIGNUP
// ======================================================

app.post(
    "/api/signup",
    async (req, res) => {

        try {

            const fullname =
                clean(
                    req.body.fullname
                );


            const email =
                clean(
                    req.body.email
                )
                    .toLowerCase();


            const password =
                String(
                    req.body.password || ""
                );


            if (
                !fullname ||
                !email ||
                !password
            ) {

                return res.status(400).json({

                    success:
                        false,

                    error:
                        "All fields are required."

                });

            }


            if (
                fullname.length < 3
            ) {

                return res.status(400).json({

                    success:
                        false,

                    error:
                        "Full name must contain at least 3 characters."

                });

            }


            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    .test(email)
            ) {

                return res.status(400).json({

                    success:
                        false,

                    error:
                        "Invalid email format."

                });

            }


            if (
                password.length < 8
            ) {

                return res.status(400).json({

                    success:
                        false,

                    error:
                        "Password must be at least 8 characters long."

                });

            }


            query(
                `
                    SELECT id
                    FROM users
                    WHERE email = ?
                    LIMIT 1
                `,
                [email],
                async (
                    checkErr,
                    rows
                ) => {

                    if (checkErr) {

                        console.error(
                            "Signup check error:",
                            checkErr
                        );


                        return res.status(500).json({

                            success:
                                false,

                            error:
                                "Database error while checking email."

                        });

                    }


                    if (
                        rows.length > 0
                    ) {

                        return res.status(409).json({

                            success:
                                false,

                            error:
                                "Email is already registered."

                        });

                    }


                    try {

                        const hash =
                            await bcrypt.hash(
                                password,
                                10
                            );


                        query(
                            `
                                INSERT INTO users
                                (
                                    username,
                                    email,
                                    password
                                )
                                VALUES (?, ?, ?)
                            `,
                            [
                                fullname,
                                email,
                                hash
                            ],
                            (
                                insertErr,
                                result
                            ) => {

                                if (insertErr) {

                                    console.error(
                                        "Signup insert error:",
                                        insertErr
                                    );


                                    return res.status(500).json({

                                        success:
                                            false,

                                        error:
                                            "Unable to create account."

                                    });

                                }


                                return res.status(201).json({

                                    success:
                                        true,

                                    message:
                                        "Account created successfully.",

                                    userId:
                                        result.insertId

                                });

                            }
                        );


                    } catch (hashError) {

                        console.error(
                            "Password hashing error:",
                            hashError
                        );


                        return res.status(500).json({

                            success:
                                false,

                            error:
                                "Unable to securely process password."

                        });

                    }

                }
            );


        } catch (error) {

            console.error(
                "Signup error:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                error:
                    "Unable to create account."

            });

        }

    }
);


// ======================================================
// LOGIN + JWT
// ======================================================

app.post(
    "/api/login",
    (req, res) => {

        const email =
            clean(
                req.body.email
            )
                .toLowerCase();


        const password =
            String(
                req.body.password || ""
            );


        if (
            !email ||
            !password
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Email and password are required."

            });

        }


        query(
            `
                SELECT
                    id,
                    username,
                    email,
                    password
                FROM users
                WHERE email = ?
                LIMIT 1
            `,
            [email],
            async (
                err,
                rows
            ) => {

                if (err) {

                    console.error(
                        "Login database error:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            "Database error."

                    });

                }


                if (
                    rows.length === 0
                ) {

                    return res.status(401).json({

                        success:
                            false,

                        error:
                            "Invalid email or password."

                    });

                }


                const user =
                    rows[0];


                try {

                    const passwordMatch =
                        await bcrypt.compare(
                            password,
                            user.password
                        );


                    if (!passwordMatch) {

                        return res.status(401).json({

                            success:
                                false,

                            error:
                                "Invalid email or password."

                        });

                    }


                    const token =
                        jwt.sign(

                            {

                                userId:
                                    user.id,

                                username:
                                    user.username,

                                email:
                                    user.email

                            },

                            JWT_SECRET,

                            {
                                expiresIn:
                                    "7d"
                            }

                        );


                    return res.json({

                        success:
                            true,

                        message:
                            "Login successful.",

                        userId:
                            user.id,

                        username:
                            user.username,

                        email:
                            user.email,

                        token:
                            token

                    });


                } catch (authError) {

                    console.error(
                        "Login authentication error:",
                        authError
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            "Unable to verify credentials."

                    });

                }

            }
        );

    }
);


// ======================================================
// COMPANY SIGNUP
// ======================================================

app.post("/api/company/signup", async (req, res) => {

    const companyName =
        clean(req.body.company_name);

    const gmail =
        clean(req.body.gmail)
            .toLowerCase();

    const password =
        String(req.body.password || "");


    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!companyName || !gmail || !password) {

        return res.status(400).json({
            success: false,
            error: "Company name, Gmail ID and password are required."
        });

    }


    // Only Gmail accounts

    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(gmail)) {

        return res.status(400).json({
            success: false,
            error: "Please use a valid Gmail ID."
        });

    }


    if (password.length < 8) {

        return res.status(400).json({
            success: false,
            error: "Password must contain at least 8 characters."
        });

    }


    try {

        // ------------------------------------------------
        // CHECK DUPLICATE GMAIL
        // ------------------------------------------------

        query(
            `
            SELECT id
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [gmail],
            async (err, userRows) => {

                if (err) {

                    console.error(
                        "COMPANY SIGNUP USER CHECK ERROR:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        error: "Database error."
                    });

                }


                if (userRows.length > 0) {

                    return res.status(409).json({
                        success: false,
                        error: "This Gmail ID is already registered."
                    });

                }


                // ----------------------------------------
                // CHECK DUPLICATE COMPANY NAME
                // ----------------------------------------

                query(
                    `
                    SELECT id
                    FROM companies
                    WHERE LOWER(company_name) = LOWER(?)
                    LIMIT 1
                    `,
                    [companyName],
                    async (companyErr, companyRows) => {

                        if (companyErr) {

                            console.error(
                                "COMPANY SIGNUP COMPANY CHECK ERROR:",
                                companyErr
                            );

                            return res.status(500).json({
                                success: false,
                                error: "Database error."
                            });

                        }


                        if (companyRows.length > 0) {

                            return res.status(409).json({
                                success: false,
                                error: "This company name is already registered."
                            });

                        }


                        // --------------------------------
                        // HASH PASSWORD
                        // --------------------------------

                        let hashedPassword;

                        try {

                            hashedPassword =
                                await bcrypt.hash(
                                    password,
                                    10
                                );

                        } catch (hashError) {

                            console.error(
                                "COMPANY PASSWORD HASH ERROR:",
                                hashError
                            );

                            return res.status(500).json({
                                success: false,
                                error: "Unable to secure the password."
                            });

                        }


                        // --------------------------------
                        // CREATE USER
                        // --------------------------------

                        query(
                            `
                            INSERT INTO users
                            (
                                username,
                                email,
                                password,
                                created_at
                            )
                            VALUES (?, ?, ?, NOW())
                            `,
                            [
                                companyName,
                                gmail,
                                hashedPassword
                            ],
                            (insertUserErr, userResult) => {

                                if (insertUserErr) {

                                    console.error(
                                        "COMPANY USER CREATE ERROR:",
                                        insertUserErr
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        error: "Unable to create company account."
                                    });

                                }


                                const userId =
                                    userResult.insertId;


                                // --------------------------------
                                // CREATE COMPANY
                                // --------------------------------

                                query(
                                    `
                                    INSERT INTO companies
                                    (
                                        owner_user_id,
                                        company_name,
                                        email
                                    )
                                    VALUES (?, ?, ?)
                                    `,
                                    [
                                        userId,
                                        companyName,
                                        gmail
                                    ],
                                    (insertCompanyErr, companyResult) => {

                                        if (insertCompanyErr) {

                                            console.error(
                                                "COMPANY CREATE ERROR:",
                                                insertCompanyErr
                                            );


                                            // --------------------------------
                                            // ROLLBACK USER IF COMPANY FAILS
                                            // --------------------------------

                                            query(
                                                `
                                                DELETE FROM users
                                                WHERE id = ?
                                                `,
                                                [userId],
                                                () => {}
                                            );


                                            return res.status(500).json({
                                                success: false,
                                                error: "Unable to create company profile."
                                            });

                                        }


                                        return res.status(201).json({

                                            success: true,

                                            message:
                                                "Company account created successfully.",

                                            userId: userId,

                                            companyId:
                                                companyResult.insertId,

                                            companyName:
                                                companyName,

                                            gmail:
                                                gmail
                                        });

                                    }
                                );

                            }
                        );

                    }
                );

            }
        );

    } catch (error) {

        console.error(
            "COMPANY SIGNUP ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Internal server error."
        });

    }

});


// ======================================================
// COMPANY SIGNIN
// ======================================================

app.post("/api/company/signin", (req, res) => {

    const gmail =
        clean(req.body.gmail)
            .toLowerCase();

    const password =
        String(req.body.password || "");


    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!gmail || !password) {

        return res.status(400).json({
            success: false,
            error: "Gmail ID and password are required."
        });

    }


    query(
        `
        SELECT
            u.id,
            u.username,
            u.email,
            u.password,

            c.id AS company_id,
            c.company_name,
            c.logo,
            c.about,
            c.industry,
            c.website,
            c.location

        FROM users u

        INNER JOIN companies c
            ON c.owner_user_id = u.id

        WHERE LOWER(u.email) = LOWER(?)

        LIMIT 1
        `,
        [gmail],
        async (err, rows) => {

            if (err) {

                console.error(
                    "COMPANY SIGNIN DATABASE ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    error: "Database error."
                });

            }


            if (rows.length === 0) {

                return res.status(401).json({
                    success: false,
                    error: "Invalid company Gmail ID or password."
                });

            }


            const companyUser =
                rows[0];


            try {

                // --------------------------------------
                // CHECK PASSWORD
                // --------------------------------------

                const match =
                    await bcrypt.compare(
                        password,
                        companyUser.password
                    );


                if (!match) {

                    return res.status(401).json({
                        success: false,
                        error: "Invalid company Gmail ID or password."
                    });

                }


                // --------------------------------------
                // CREATE JWT
                // --------------------------------------

                const token =
                    jwt.sign(
                        {
                            userId:
                                companyUser.id,

                            username:
                                companyUser.username,

                            email:
                                companyUser.email,

                            companyId:
                                companyUser.company_id,

                            accountType:
                                "company"
                        },
                        JWT_SECRET,
                        {
                            expiresIn: "7d"
                        }
                    );


                // --------------------------------------
                // RESPONSE
                // --------------------------------------

                return res.json({

                    success: true,

                    message:
                        "Company login successful.",

                    token: token,

                    userId:
                        companyUser.id,

                    email:
                        companyUser.email,

                    companyId:
                        companyUser.company_id,

                    company: {

                        id:
                            companyUser.company_id,

                        company_name:
                            companyUser.company_name,

                        logo:
                            companyUser.logo,

                        about:
                            companyUser.about,

                        industry:
                            companyUser.industry,

                        website:
                            companyUser.website,

                        location:
                            companyUser.location

                    }

                });

            } catch (authError) {

                console.error(
                    "COMPANY SIGNIN AUTH ERROR:",
                    authError
                );

                return res.status(500).json({
                    success: false,
                    error: "Unable to verify company credentials."
                });

            }

        }
    );

});

// ======================================================
// INSTITUTION SIGNUP
// ======================================================

app.post("/api/institution/signup", async (req, res) => {

    const institutionName =
        clean(
            req.body.institution_name ??
            req.body.institutionName
        );

    const institutionType =
        clean(
            req.body.institution_type ??
            req.body.institutionType
        );

    const email =
        clean(
            req.body.email ??
            req.body.gmail
        ).toLowerCase();

    const phone =
        clean(
            req.body.phone
        );

    const website =
        clean(
            req.body.website
        );

    const address =
        clean(
            req.body.address
        );

    const city =
        clean(
            req.body.city
        );

    const state =
        clean(
            req.body.state
        );

    const country =
        clean(
            req.body.country
        ) ||
        "India";

    const description =
        clean(
            req.body.description
        );

    const password =
        String(
            req.body.password || ""
        );


    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (
        !institutionName ||
        !institutionType ||
        !email ||
        !password
    ) {

        return res.status(400).json({

            success: false,

            error:
                "Institution name, institution type, email and password are required."

        });

    }


    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {

        return res.status(400).json({

            success: false,

            error:
                "Please enter a valid email address."

        });

    }


    if (
        password.length < 8
    ) {

        return res.status(400).json({

            success: false,

            error:
                "Password must contain at least 8 characters."

        });

    }


    try {

        // ------------------------------------------------
        // CHECK DUPLICATE EMAIL
        // ------------------------------------------------

        query(
            `
                SELECT id
                FROM users
                WHERE LOWER(email) = LOWER(?)
                LIMIT 1
            `,
            [
                email
            ],
            async (
                userCheckError,
                userRows
            ) => {

                if (userCheckError) {

                    console.error(
                        "INSTITUTION SIGNUP USER CHECK ERROR:",
                        userCheckError
                    );

                    return res.status(500).json({

                        success: false,

                        error:
                            "Database error."

                    });

                }


                if (
                    userRows.length > 0
                ) {

                    return res.status(409).json({

                        success: false,

                        error:
                            "This email is already registered."

                    });

                }


                // ----------------------------------------
                // CHECK DUPLICATE INSTITUTION NAME
                // ----------------------------------------

                query(
                    `
                        SELECT id
                        FROM institutions
                        WHERE LOWER(institution_name)
                              = LOWER(?)
                        LIMIT 1
                    `,
                    [
                        institutionName
                    ],
                    async (
                        institutionCheckError,
                        institutionRows
                    ) => {

                        if (institutionCheckError) {

                            console.error(
                                "INSTITUTION NAME CHECK ERROR:",
                                institutionCheckError
                            );

                            return res.status(500).json({

                                success: false,

                                error:
                                    "Database error."

                            });

                        }


                        if (
                            institutionRows.length > 0
                        ) {

                            return res.status(409).json({

                                success: false,

                                error:
                                    "This institution is already registered."

                            });

                        }


                        // --------------------------------
                        // HASH PASSWORD
                        // --------------------------------

                        let hashedPassword;

                        try {

                            hashedPassword =
                                await bcrypt.hash(
                                    password,
                                    10
                                );

                        } catch (hashError) {

                            console.error(
                                "INSTITUTION PASSWORD HASH ERROR:",
                                hashError
                            );

                            return res.status(500).json({

                                success: false,

                                error:
                                    "Unable to secure the password."

                            });

                        }


                        // --------------------------------
                        // CREATE USER ACCOUNT
                        // --------------------------------

                        query(
                            `
                                INSERT INTO users
                                (
                                    username,
                                    email,
                                    password,
                                    created_at
                                )
                                VALUES
                                (?, ?, ?, NOW())
                            `,
                            [
                                institutionName,
                                email,
                                hashedPassword
                            ],
                            (
                                insertUserError,
                                userResult
                            ) => {

                                if (insertUserError) {

                                    console.error(
                                        "INSTITUTION USER CREATE ERROR:",
                                        insertUserError
                                    );

                                    return res.status(500).json({

                                        success: false,

                                        error:
                                            "Unable to create institution account."

                                    });

                                }


                                const userId =
                                    userResult.insertId;


                                // --------------------------------
                                // CREATE INSTITUTION
                                // --------------------------------

                                query(
                                    `
                                        INSERT INTO institutions
                                        (
                                            owner_user_id,
                                            institution_name,
                                            institution_type,
                                            email,
                                            phone,
                                            website,
                                            address,
                                            city,
                                            state,
                                            country,
                                            description,
                                            created_at
                                        )
                                        VALUES
                                        (
                                            ?, ?, ?, ?, ?, ?, ?,
                                            ?, ?, ?, ?, NOW()
                                        )
                                    `,
                                    [
                                        userId,
                                        institutionName,
                                        institutionType,
                                        email,
                                        phone || null,
                                        website || null,
                                        address || null,
                                        city || null,
                                        state || null,
                                        country,
                                        description || null
                                    ],
                                    (
                                        insertInstitutionError,
                                        institutionResult
                                    ) => {

                                        if (
                                            insertInstitutionError
                                        ) {

                                            console.error(
                                                "INSTITUTION CREATE ERROR:",
                                                insertInstitutionError
                                            );


                                            // --------------------------------
                                            // REMOVE USER IF INSTITUTION FAILS
                                            // --------------------------------

                                            query(
                                                `
                                                    DELETE FROM users
                                                    WHERE id = ?
                                                `,
                                                [
                                                    userId
                                                ],
                                                () => {}
                                            );


                                            return res.status(500).json({

                                                success: false,

                                                error:
                                                    "Unable to create institution profile."

                                            });

                                        }


                                        return res.status(201).json({

                                            success: true,

                                            message:
                                                "Institution account created successfully.",

                                            userId:
                                                userId,

                                            institutionId:
                                                institutionResult.insertId,

                                            institutionName:
                                                institutionName,

                                            email:
                                                email

                                        });

                                    }
                                );

                            }
                        );

                    }
                );

            }
        );

    } catch (error) {

        console.error(
            "INSTITUTION SIGNUP ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            error:
                "Internal server error."

        });

    }

});

// ======================================================
// INSTITUTION SIGNIN
// ======================================================

app.post("/api/institution/signin", (req, res) => {

    const email =
        clean(
            req.body.email ??
            req.body.gmail
        ).toLowerCase();

    const password =
        String(
            req.body.password || ""
        );


    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (
        !email ||
        !password
    ) {

        return res.status(400).json({

            success: false,

            error:
                "Email and password are required."

        });

    }


    query(
        `
            SELECT

                u.id,
                u.username,
                u.email,
                u.password,

                i.id AS institution_id,
                i.institution_name,
                i.institution_type,
                i.phone,
                i.website,
                i.address,
                i.city,
                i.state,
                i.country,
                i.description

            FROM users u

            INNER JOIN institutions i
                ON i.owner_user_id = u.id

            WHERE LOWER(u.email) = LOWER(?)

            LIMIT 1
        `,
        [
            email
        ],
        async (
            err,
            rows
        ) => {

            if (err) {

                console.error(
                    "INSTITUTION SIGNIN DATABASE ERROR:",
                    err
                );

                return res.status(500).json({

                    success: false,

                    error:
                        "Database error."

                });

            }


            if (
                rows.length === 0
            ) {

                return res.status(401).json({

                    success: false,

                    error:
                        "Invalid institution email or password."

                });

            }


            const institutionUser =
                rows[0];


            try {

                // --------------------------------------
                // CHECK PASSWORD
                // --------------------------------------

                const match =
                    await bcrypt.compare(
                        password,
                        institutionUser.password
                    );


                if (!match) {

                    return res.status(401).json({

                        success: false,

                        error:
                            "Invalid institution email or password."

                    });

                }


                // --------------------------------------
                // CREATE JWT
                // --------------------------------------

                const token =
                    jwt.sign(
                        {
                            userId:
                                institutionUser.id,

                            username:
                                institutionUser.username,

                            email:
                                institutionUser.email,

                            institutionId:
                                institutionUser.institution_id,

                            accountType:
                                "institution"
                        },

                        JWT_SECRET,

                        {
                            expiresIn:
                                "7d"
                        }
                    );


                // --------------------------------------
                // RESPONSE
                // --------------------------------------

                return res.json({

                    success: true,

                    message:
                        "Institution login successful.",

                    token:
                        token,

                    userId:
                        institutionUser.id,

                    email:
                        institutionUser.email,

                    institutionId:
                        institutionUser.institution_id,

                    institution: {

                        id:
                            institutionUser.institution_id,

                        institution_name:
                            institutionUser.institution_name,

                        institution_type:
                            institutionUser.institution_type,

                        phone:
                            institutionUser.phone,

                        website:
                            institutionUser.website,

                        address:
                            institutionUser.address,

                        city:
                            institutionUser.city,

                        state:
                            institutionUser.state,

                        country:
                            institutionUser.country,

                        description:
                            institutionUser.description

                    }

                });

            } catch (authError) {

                console.error(
                    "INSTITUTION SIGNIN AUTH ERROR:",
                    authError
                );

                return res.status(500).json({

                    success: false,

                    error:
                        "Unable to verify credentials."

                });

            }

        }
    );

});


// ======================================================
// COMPANIES - GET ALL
// ======================================================

app.get(
    "/api/companies",
    (req, res) => {

        query(
            `
                SELECT
                    id,
                    company_name,
                    logo,
                    about,
                    industry,
                    website,
                    email,
                    location
                FROM companies
                ORDER BY id DESC
            `,
            [],
            (
                err,
                rows
            ) => {

                if (err) {

                    console.error(
                        "GET COMPANIES ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                return res.json(
                    rows
                );

            }
        );

    }
);


// ======================================================
// COMPANY PROFILE - GET ONE
// ======================================================

app.get(
    "/api/company-profile/:id",
    (req, res) => {

        const companyId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(companyId) ||
            companyId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Invalid company ID."

            });

        }


        query(
            `
                SELECT
                    id,
                    company_name AS companyName,
                    logo,
                    about,
                    industry,
                    website,
                    email,
                    location
                FROM companies
                WHERE id = ?
                LIMIT 1
            `,
            [
                companyId
            ],
            (
                err,
                rows
            ) => {

                if (err) {

                    console.error(
                        "GET COMPANY PROFILE ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                if (
                    rows.length === 0
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "Company not found."

                    });

                }


                return res.json({

                    success:
                        true,

                    profile:
                        rows[0]

                });

            }
        );

    }
);


// ======================================================
// CREATE COMPANY PROFILE
// ======================================================

app.post(
    "/api/company-profile",
    (req, res) => {

        const values = [

            clean(
                req.body.companyName
            ),

            clean(
                req.body.logo
            ),

            clean(
                req.body.about
            ),

            clean(
                req.body.industry
            ),

            clean(
                req.body.website
            ),

            clean(
                req.body.email
            ),

            clean(
                req.body.location
            )

        ];


        if (!values[0]) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Company name is required."

            });

        }


        query(
            `
                INSERT INTO companies
                (
                    company_name,
                    logo,
                    about,
                    industry,
                    website,
                    email,
                    location
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            values,
            (
                err,
                result
            ) => {

                if (err) {

                    console.error(
                        "CREATE COMPANY ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                return res.status(201).json({

                    success:
                        true,

                    message:
                        "Company profile saved successfully.",

                    id:
                        result.insertId

                });

            }
        );

    }
);


// ======================================================
// UPDATE COMPANY PROFILE
// ======================================================

app.put(
    "/api/company-profile/:id",
    (req, res) => {

        const companyId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(companyId) ||
            companyId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Invalid company ID."

            });

        }


        const values = [

            clean(
                req.body.companyName
            ),

            clean(
                req.body.logo
            ),

            clean(
                req.body.about
            ),

            clean(
                req.body.industry
            ),

            clean(
                req.body.website
            ),

            clean(
                req.body.email
            ),

            clean(
                req.body.location
            ),

            companyId

        ];


        if (!values[0]) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Company name is required."

            });

        }


        query(
            `
                UPDATE companies
                SET
                    company_name = ?,
                    logo = ?,
                    about = ?,
                    industry = ?,
                    website = ?,
                    email = ?,
                    location = ?
                WHERE id = ?
            `,
            values,
            (
                err,
                result
            ) => {

                if (err) {

                    console.error(
                        "UPDATE COMPANY ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "Company not found."

                    });

                }


                return res.json({

                    success:
                        true,

                    message:
                        "Company profile updated successfully.",

                    id:
                        companyId

                });

            }
        );

    }
);


// ======================================================
// PUBLIC USER PROFILE
// ======================================================

// ======================================================
// PUBLIC USER PROFILE
// ======================================================

app.get(
    "/api/user-profile/:userId",
    (req, res) => {

        const userId =
            Number(
                req.params.userId
            );

        if (
            !Number.isInteger(userId) ||
            userId <= 0
        ) {

            return res.status(400).json({
                success: false,
                error: "Invalid user ID."
            });

        }

        query(
            `
                SELECT

                    up.id,
                    up.user_id AS userId,

                    COALESCE(
                        NULLIF(up.name, ''),
                        u.username
                    ) AS name,

                    up.headline,
                    up.tagline,
                    up.location,

                    up.connections,
                    up.followers,

                    up.about,

                    up.email,
                    up.phone,

                    up.github,
                    up.linkedin,

                    up.education,
                    up.experience,
                    up.projects,
                    up.skills,
                    up.certifications,
                    up.achievements,

                    up.profile_pic AS profilePic,
                    up.banner_image AS bannerImage,

                    up.achievement_1,
                    up.achievement_2,
                    up.achievement_3,
                    up.achievement_4,
                    up.achievement_5,
                    up.achievement_6,

                    (
                        SELECT irt.score
                        FROM industry_readiness_tests irt
                        WHERE irt.user_id = up.user_id
                          AND irt.completed = TRUE
                        ORDER BY irt.id DESC
                        LIMIT 1
                    ) AS readiness_score,

                    (
                        SELECT irt.percentage
                        FROM industry_readiness_tests irt
                        WHERE irt.user_id = up.user_id
                          AND irt.completed = TRUE
                        ORDER BY irt.id DESC
                        LIMIT 1
                    ) AS test_score,

                    (
                        SELECT irt.grade
                        FROM industry_readiness_tests irt
                        WHERE irt.user_id = up.user_id
                          AND irt.completed = TRUE
                        ORDER BY irt.id DESC
                        LIMIT 1
                    ) AS grade,

                    (
                        SELECT irt.test_rating
                        FROM industry_readiness_tests irt
                        WHERE irt.user_id = up.user_id
                          AND irt.completed = TRUE
                        ORDER BY irt.id DESC
                        LIMIT 1
                    ) AS test_rating,

                    (
                        SELECT irt.completed_at
                        FROM industry_readiness_tests irt
                        WHERE irt.user_id = up.user_id
                          AND irt.completed = TRUE
                        ORDER BY irt.id DESC
                        LIMIT 1
                    ) AS readiness_completed_at,

                    up.created_at,
                    up.updated_at

                FROM user_profiles up

                INNER JOIN users u
                    ON u.id = up.user_id

                WHERE up.user_id = ?

                LIMIT 1
            `,
            [
                userId
            ],
            (
                err,
                rows
            ) => {

                if (err) {

                    console.error(
                        "GET PUBLIC PROFILE ERROR:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        error: err.message
                    });

                }

                if (
                    rows.length === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        error: "User profile not found."
                    });

                }

                const profile =
                    rows[0];

                // -----------------------------------------
                // NUMERIC VALUES
                // -----------------------------------------

                profile.connections =
                    profile.connections !== null &&
                    profile.connections !== undefined
                        ? Number(profile.connections)
                        : 0;

                profile.followers =
                    profile.followers !== null &&
                    profile.followers !== undefined
                        ? Number(profile.followers)
                        : 0;

                profile.readiness_score =
                    profile.readiness_score !== null &&
                    profile.readiness_score !== undefined
                        ? Number(profile.readiness_score)
                        : null;

                profile.test_score =
                    profile.test_score !== null &&
                    profile.test_score !== undefined
                        ? Number(profile.test_score)
                        : null;

                profile.test_rating =
                    profile.test_rating !== null &&
                    profile.test_rating !== undefined
                        ? Number(profile.test_rating)
                        : null;

                return res.json({
                    success: true,
                    profile: profile
                });

            }
        );

    }
);


// ======================================================
// GET OTHER USER PROFILES
// ======================================================

app.get(
    "/api/user-profiles",
    authenticateToken,
    (req, res) => {

        const currentUserId =
            req.user.id;

        query(
            `
                SELECT

                    up.id,
                    up.user_id AS userId,

                    COALESCE(
                        NULLIF(up.name, ''),
                        u.username
                    ) AS name,

                    up.headline,
                    up.tagline,
                    up.location,

                    up.connections,
                    up.followers,

                    up.about,

                    up.email,
                    up.phone,

                    up.github,
                    up.linkedin,

                    up.education,
                    up.experience,
                    up.projects,
                    up.skills,
                    up.certifications,
                    up.achievements,

                    up.profile_pic AS profilePic,
                    up.banner_image AS bannerImage,

                    up.achievement_1,
                    up.achievement_2,
                    up.achievement_3,
                    up.achievement_4,
                    up.achievement_5,
                    up.achievement_6,

                    (
                        SELECT irt.score
                        FROM industry_readiness_tests irt
                        WHERE irt.user_id = up.user_id
                          AND irt.completed = TRUE
                        ORDER BY irt.id DESC
                        LIMIT 1
                    ) AS readiness_score,

                    (
                        SELECT irt.percentage
                        FROM industry_readiness_tests irt
                        WHERE irt.user_id = up.user_id
                          AND irt.completed = TRUE
                        ORDER BY irt.id DESC
                        LIMIT 1
                    ) AS test_score,

                    (
                        SELECT irt.grade
                        FROM industry_readiness_tests irt
                        WHERE irt.user_id = up.user_id
                          AND irt.completed = TRUE
                        ORDER BY irt.id DESC
                        LIMIT 1
                    ) AS grade,

                    (
                        SELECT irt.test_rating
                        FROM industry_readiness_tests irt
                        WHERE irt.user_id = up.user_id
                          AND irt.completed = TRUE
                        ORDER BY irt.id DESC
                        LIMIT 1
                    ) AS test_rating,

                    (
                        SELECT irt.completed_at
                        FROM industry_readiness_tests irt
                        WHERE irt.user_id = up.user_id
                          AND irt.completed = TRUE
                        ORDER BY irt.id DESC
                        LIMIT 1
                    ) AS readiness_completed_at,

                    up.created_at,
                    up.updated_at

                FROM user_profiles up

                INNER JOIN users u
                    ON u.id = up.user_id

                WHERE up.user_id <> ?

                ORDER BY
                    up.updated_at DESC,
                    up.id DESC
            `,
            [
                currentUserId
            ],
            (
                err,
                rows
            ) => {

                if (err) {

                    console.error(
                        "GET USER PROFILES ERROR:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        error: err.message
                    });

                }

                // -----------------------------------------
                // CONVERT NUMERIC VALUES FOR EVERY USER
                // -----------------------------------------

                rows.forEach(
                    profile => {

                        profile.connections =
                            profile.connections !== null &&
                            profile.connections !== undefined
                                ? Number(profile.connections)
                                : 0;

                        profile.followers =
                            profile.followers !== null &&
                            profile.followers !== undefined
                                ? Number(profile.followers)
                                : 0;

                        profile.readiness_score =
                            profile.readiness_score !== null &&
                            profile.readiness_score !== undefined
                                ? Number(profile.readiness_score)
                                : null;

                        profile.test_score =
                            profile.test_score !== null &&
                            profile.test_score !== undefined
                                ? Number(profile.test_score)
                                : null;

                        profile.test_rating =
                            profile.test_rating !== null &&
                            profile.test_rating !== undefined
                                ? Number(profile.test_rating)
                                : null;

                    }
                );

                return res.json({
                    success: true,
                    users: rows
                });

            }
        );

    }
);


// ======================================================
// GET MY PROFILE
// ======================================================

app.get(
    "/api/my-profile",
    authenticateToken,
    (req, res) => {

        const userId =
            req.user.id;

        query(
            `
                SELECT

                    up.id,
                    up.user_id AS userId,

                    COALESCE(
                        NULLIF(up.name, ''),
                        u.username
                    ) AS name,

                    up.headline,
                    up.tagline,
                    up.location,

                    up.connections,
                    up.followers,

                    up.about,

                    up.email,
                    up.phone,

                    up.github,
                    up.linkedin,

                    up.education,
                    up.experience,
                    up.projects,
                    up.skills,
                    up.certifications,
                    up.achievements,

                    up.profile_pic AS profilePic,
                    up.banner_image AS bannerImage,

                    up.achievement_1,
                    up.achievement_2,
                    up.achievement_3,
                    up.achievement_4,
                    up.achievement_5,
                    up.achievement_6,

                    (
                        SELECT irt.score
                        FROM industry_readiness_tests irt
                        WHERE irt.user_id = up.user_id
                          AND irt.completed = TRUE
                        ORDER BY irt.id DESC
                        LIMIT 1
                    ) AS readiness_score,

                    (
                        SELECT irt.percentage
                        FROM industry_readiness_tests irt
                        WHERE irt.user_id = up.user_id
                          AND irt.completed = TRUE
                        ORDER BY irt.id DESC
                        LIMIT 1
                    ) AS test_score,

                    (
                        SELECT irt.grade
                        FROM industry_readiness_tests irt
                        WHERE irt.user_id = up.user_id
                          AND irt.completed = TRUE
                        ORDER BY irt.id DESC
                        LIMIT 1
                    ) AS grade,

                    (
                        SELECT irt.test_rating
                        FROM industry_readiness_tests irt
                        WHERE irt.user_id = up.user_id
                          AND irt.completed = TRUE
                        ORDER BY irt.id DESC
                        LIMIT 1
                    ) AS test_rating,

                    (
                        SELECT irt.completed_at
                        FROM industry_readiness_tests irt
                        WHERE irt.user_id = up.user_id
                          AND irt.completed = TRUE
                        ORDER BY irt.id DESC
                        LIMIT 1
                    ) AS readiness_completed_at,

                    up.created_at,
                    up.updated_at

                FROM user_profiles up

                INNER JOIN users u
                    ON u.id = up.user_id

                WHERE up.user_id = ?

                LIMIT 1
            `,
            [
                userId
            ],
            (
                err,
                rows
            ) => {

                if (err) {

                    console.error(
                        "GET MY PROFILE ERROR:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        error: err.message
                    });

                }

                if (
                    rows.length === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        error: "User profile not found."
                    });

                }

                const profile =
                    rows[0];

                // -----------------------------------------
                // CONVERT NUMERIC VALUES
                // -----------------------------------------

                profile.connections =
                    profile.connections !== null &&
                    profile.connections !== undefined
                        ? Number(profile.connections)
                        : 0;

                profile.followers =
                    profile.followers !== null &&
                    profile.followers !== undefined
                        ? Number(profile.followers)
                        : 0;

                profile.readiness_score =
                    profile.readiness_score !== null &&
                    profile.readiness_score !== undefined
                        ? Number(profile.readiness_score)
                        : null;

                profile.test_score =
                    profile.test_score !== null &&
                    profile.test_score !== undefined
                        ? Number(profile.test_score)
                        : null;

                profile.test_rating =
                    profile.test_rating !== null &&
                    profile.test_rating !== undefined
                        ? Number(profile.test_rating)
                        : null;

                return res.json({
                    success: true,
                    profile: profile
                });

            }
        );

    }
);


// ======================================================
// SAVE MY PROFILE
// ======================================================

app.put(
    "/api/my-profile",
    authenticateToken,
    (req, res) => {

        const userId =
            req.user.id;

        // ==================================================
        // IMPORTANT
        // Connections, followers, score, grade and rating
        // are NOT accepted from the frontend.
        //
        // Connections/followers already stored in MySQL
        // remain unchanged during profile editing.
        // Industry Readiness is controlled separately.
        // ==================================================

        const name =
            clean(req.body.name);

        const headline =
            clean(req.body.headline);

        const tagline =
            clean(req.body.tagline);

        const location =
            clean(req.body.location);

        const about =
            clean(req.body.about);

        const email =
            clean(req.body.email);

        const phone =
            clean(req.body.phone);

        const github =
            clean(req.body.github);

        const linkedin =
            clean(req.body.linkedin);

        const education =
            clean(req.body.education);

        const experience =
            clean(req.body.experience);

        const projects =
            clean(req.body.projects);

        const skills =
            clean(req.body.skills);

        const certifications =
            clean(req.body.certifications);

        const achievements =
            clean(req.body.achievements);

        const profilePic =
            req.body.profilePic ||
            req.body.profile_picture ||
            null;

        const bannerImage =
            req.body.bannerImage ||
            req.body.banner_image ||
            null;

        const achievement1 =
            req.body.achievement_1 ||
            null;

        const achievement2 =
            req.body.achievement_2 ||
            null;

        const achievement3 =
            req.body.achievement_3 ||
            null;

        const achievement4 =
            req.body.achievement_4 ||
            null;

        const achievement5 =
            req.body.achievement_5 ||
            null;

        const achievement6 =
            req.body.achievement_6 ||
            null;


        // ==================================================
        // CHECK WHETHER PROFILE EXISTS
        // ==================================================

        query(
            `
                SELECT id
                FROM user_profiles
                WHERE user_id = ?
                LIMIT 1
            `,
            [
                userId
            ],
            (
                checkErr,
                rows
            ) => {

                if (checkErr) {

                    console.error(
                        "PROFILE CHECK ERROR:",
                        checkErr
                    );

                    return res.status(500).json({
                        success: false,
                        error: checkErr.message
                    });

                }


                // ==================================================
                // UPDATE EXISTING PROFILE
                // ==================================================

                if (
                    rows.length > 0
                ) {

                    const profileId =
                        rows[0].id;

                    query(
                        `
                            UPDATE user_profiles

                            SET

                                name = ?,
                                headline = ?,
                                tagline = ?,
                                location = ?,

                                about = ?,

                                email = ?,
                                phone = ?,

                                github = ?,
                                linkedin = ?,

                                education = ?,
                                experience = ?,
                                projects = ?,
                                skills = ?,
                                certifications = ?,
                                achievements = ?,

                                profile_pic = ?,
                                banner_image = ?,

                                achievement_1 = ?,
                                achievement_2 = ?,
                                achievement_3 = ?,
                                achievement_4 = ?,
                                achievement_5 = ?,
                                achievement_6 = ?

                            WHERE user_id = ?
                        `,
                        [
                            name,
                            headline,
                            tagline,
                            location,

                            about,

                            email,
                            phone,

                            github,
                            linkedin,

                            education,
                            experience,
                            projects,
                            skills,
                            certifications,
                            achievements,

                            profilePic,
                            bannerImage,

                            achievement1,
                            achievement2,
                            achievement3,
                            achievement4,
                            achievement5,
                            achievement6,

                            userId
                        ],
                        (
                            err,
                            result
                        ) => {

                            if (err) {

                                console.error(
                                    "PROFILE UPDATE ERROR:",
                                    err
                                );

                                return res.status(500).json({
                                    success: false,
                                    error: err.message
                                });

                            }

                            // -----------------------------------------
                            // RETURN THE COMPLETE UPDATED PROFILE
                            // -----------------------------------------

                            query(
                                `
                                    SELECT

                                        up.id,
                                        up.user_id AS userId,

                                        COALESCE(
                                            NULLIF(up.name, ''),
                                            u.username
                                        ) AS name,

                                        up.headline,
                                        up.tagline,
                                        up.location,

                                        up.connections,
                                        up.followers,

                                        up.about,

                                        up.email,
                                        up.phone,

                                        up.github,
                                        up.linkedin,

                                        up.education,
                                        up.experience,
                                        up.projects,
                                        up.skills,
                                        up.certifications,
                                        up.achievements,

                                        up.profile_pic AS profilePic,
                                        up.banner_image AS bannerImage,

                                        up.achievement_1,
                                        up.achievement_2,
                                        up.achievement_3,
                                        up.achievement_4,
                                        up.achievement_5,
                                        up.achievement_6,

                                        (
                                            SELECT irt.score
                                            FROM industry_readiness_tests irt
                                            WHERE irt.user_id = up.user_id
                                              AND irt.completed = TRUE
                                            ORDER BY irt.id DESC
                                            LIMIT 1
                                        ) AS readiness_score,

                                        (
                                            SELECT irt.percentage
                                            FROM industry_readiness_tests irt
                                            WHERE irt.user_id = up.user_id
                                              AND irt.completed = TRUE
                                            ORDER BY irt.id DESC
                                            LIMIT 1
                                        ) AS test_score,

                                        (
                                            SELECT irt.grade
                                            FROM industry_readiness_tests irt
                                            WHERE irt.user_id = up.user_id
                                              AND irt.completed = TRUE
                                            ORDER BY irt.id DESC
                                            LIMIT 1
                                        ) AS grade,

                                        (
                                            SELECT irt.test_rating
                                            FROM industry_readiness_tests irt
                                            WHERE irt.user_id = up.user_id
                                              AND irt.completed = TRUE
                                            ORDER BY irt.id DESC
                                            LIMIT 1
                                        ) AS test_rating,

                                        (
                                            SELECT irt.completed_at
                                            FROM industry_readiness_tests irt
                                            WHERE irt.user_id = up.user_id
                                              AND irt.completed = TRUE
                                            ORDER BY irt.id DESC
                                            LIMIT 1
                                        ) AS readiness_completed_at,

                                        up.created_at,
                                        up.updated_at

                                    FROM user_profiles up

                                    INNER JOIN users u
                                        ON u.id = up.user_id

                                    WHERE up.user_id = ?

                                    LIMIT 1
                                `,
                                [
                                    userId
                                ],
                                (
                                    profileErr,
                                    profileRows
                                ) => {

                                    if (profileErr) {

                                        console.error(
                                            "UPDATED PROFILE FETCH ERROR:",
                                            profileErr
                                        );

                                        return res.json({
                                            success: true,
                                            message:
                                                "Profile updated successfully.",
                                            id: profileId,
                                            userId: userId
                                        });
                                    }

                                    const profile =
                                        profileRows[0];

                                    profile.connections =
                                        profile.connections !== null &&
                                        profile.connections !== undefined
                                            ? Number(profile.connections)
                                            : 0;

                                    profile.followers =
                                        profile.followers !== null &&
                                        profile.followers !== undefined
                                            ? Number(profile.followers)
                                            : 0;

                                    profile.readiness_score =
                                        profile.readiness_score !== null &&
                                        profile.readiness_score !== undefined
                                            ? Number(profile.readiness_score)
                                            : null;

                                    profile.test_score =
                                        profile.test_score !== null &&
                                        profile.test_score !== undefined
                                            ? Number(profile.test_score)
                                            : null;

                                    profile.test_rating =
                                        profile.test_rating !== null &&
                                        profile.test_rating !== undefined
                                            ? Number(profile.test_rating)
                                            : null;

                                    return res.json({
                                        success: true,
                                        message:
                                            "Profile updated successfully.",
                                        id: profileId,
                                        userId: userId,
                                        profile: profile
                                    });

                                }
                            );

                        }
                    );

                    return;
                }


                // ==================================================
                // CREATE NEW PROFILE
                // ==================================================

                query(
                    `
                        INSERT INTO user_profiles
                        (
                            user_id,

                            name,
                            headline,
                            tagline,
                            location,

                            connections,
                            followers,

                            about,

                            email,
                            phone,

                            github,
                            linkedin,

                            education,
                            experience,
                            projects,
                            skills,
                            certifications,
                            achievements,

                            profile_pic,
                            banner_image,

                            achievement_1,
                            achievement_2,
                            achievement_3,
                            achievement_4,
                            achievement_5,
                            achievement_6
                        )

                        VALUES
                        (
                            ?,

                            ?, ?, ?, ?,

                            0, 0,

                            ?,

                            ?, ?,

                            ?, ?,

                            ?, ?, ?, ?, ?, ?,

                            ?, ?,

                            ?, ?, ?, ?, ?, ?
                        )
                    `,
                    [
                        userId,

                        name,
                        headline,
                        tagline,
                        location,

                        about,

                        email,
                        phone,

                        github,
                        linkedin,

                        education,
                        experience,
                        projects,
                        skills,
                        certifications,
                        achievements,

                        profilePic,
                        bannerImage,

                        achievement1,
                        achievement2,
                        achievement3,
                        achievement4,
                        achievement5,
                        achievement6
                    ],
                    (
                        err,
                        result
                    ) => {

                        if (err) {

                            console.error(
                                "PROFILE INSERT ERROR:",
                                err
                            );

                            return res.status(500).json({
                                success: false,
                                error: err.message
                            });

                        }

                        // -----------------------------------------
                        // RETURN NEW PROFILE
                        // -----------------------------------------

                        query(
                            `
                                SELECT

                                    up.id,
                                    up.user_id AS userId,

                                    COALESCE(
                                        NULLIF(up.name, ''),
                                        u.username
                                    ) AS name,

                                    up.headline,
                                    up.tagline,
                                    up.location,

                                    up.connections,
                                    up.followers,

                                    up.about,

                                    up.email,
                                    up.phone,

                                    up.github,
                                    up.linkedin,

                                    up.education,
                                    up.experience,
                                    up.projects,
                                    up.skills,
                                    up.certifications,
                                    up.achievements,

                                    up.profile_pic AS profilePic,
                                    up.banner_image AS bannerImage,

                                    up.achievement_1,
                                    up.achievement_2,
                                    up.achievement_3,
                                    up.achievement_4,
                                    up.achievement_5,
                                    up.achievement_6,

                                    (
                                        SELECT irt.score
                                        FROM industry_readiness_tests irt
                                        WHERE irt.user_id = up.user_id
                                          AND irt.completed = TRUE
                                        ORDER BY irt.id DESC
                                        LIMIT 1
                                    ) AS readiness_score,

                                    (
                                        SELECT irt.percentage
                                        FROM industry_readiness_tests irt
                                        WHERE irt.user_id = up.user_id
                                          AND irt.completed = TRUE
                                        ORDER BY irt.id DESC
                                        LIMIT 1
                                    ) AS test_score,

                                    (
                                        SELECT irt.grade
                                        FROM industry_readiness_tests irt
                                        WHERE irt.user_id = up.user_id
                                          AND irt.completed = TRUE
                                        ORDER BY irt.id DESC
                                        LIMIT 1
                                    ) AS grade,

                                    (
                                        SELECT irt.test_rating
                                        FROM industry_readiness_tests irt
                                        WHERE irt.user_id = up.user_id
                                          AND irt.completed = TRUE
                                        ORDER BY irt.id DESC
                                        LIMIT 1
                                    ) AS test_rating,

                                    (
                                        SELECT irt.completed_at
                                        FROM industry_readiness_tests irt
                                        WHERE irt.user_id = up.user_id
                                          AND irt.completed = TRUE
                                        ORDER BY irt.id DESC
                                        LIMIT 1
                                    ) AS readiness_completed_at,

                                    up.created_at,
                                    up.updated_at

                                FROM user_profiles up

                                INNER JOIN users u
                                    ON u.id = up.user_id

                                WHERE up.user_id = ?

                                LIMIT 1
                            `,
                            [
                                userId
                            ],
                            (
                                profileErr,
                                profileRows
                            ) => {

                                if (profileErr) {

                                    console.error(
                                        "NEW PROFILE FETCH ERROR:",
                                        profileErr
                                    );

                                    return res.status(201).json({
                                        success: true,
                                        message:
                                            "Profile created successfully.",
                                        id: result.insertId,
                                        userId: userId
                                    });

                                }

                                const profile =
                                    profileRows[0];

                                profile.connections =
                                    profile.connections !== null &&
                                    profile.connections !== undefined
                                        ? Number(profile.connections)
                                        : 0;

                                profile.followers =
                                    profile.followers !== null &&
                                    profile.followers !== undefined
                                        ? Number(profile.followers)
                                        : 0;

                                profile.readiness_score = null;
                                profile.test_score = null;
                                profile.test_rating = null;

                                return res.status(201).json({
                                    success: true,
                                    message:
                                        "Profile created successfully.",
                                    id: result.insertId,
                                    userId: userId,
                                    profile: profile
                                });

                            }
                        );

                    }
                );

            }
        );

    }
);


// ======================================================
// LEGACY PROFILE SAVE
// ======================================================
//
// Kept for compatibility with older frontend code.
// It also does NOT modify connections/followers.
// ======================================================

app.post(
    "/api/profile",
    authenticateToken,
    (req, res) => {

        const userId =
            req.user.id;

        const profileData = {

            name:
                clean(
                    req.body.name
                ),

            headline:
                clean(
                    req.body.headline
                ),

            tagline:
                clean(
                    req.body.tagline
                ),

            location:
                clean(
                    req.body.location
                ),

            about:
                clean(
                    req.body.about
                ),

            email:
                clean(
                    req.body.email
                ),

            phone:
                clean(
                    req.body.phone
                ),

            github:
                clean(
                    req.body.github
                ),

            linkedin:
                clean(
                    req.body.linkedin
                ),

            education:
                clean(
                    req.body.education
                ),

            experience:
                clean(
                    req.body.experience
                ),

            projects:
                clean(
                    req.body.projects
                ),

            skills:
                clean(
                    req.body.skills
                ),

            certifications:
                clean(
                    req.body.certifications
                ),

            achievements:
                clean(
                    req.body.achievements
                ),

            profile_pic:
                clean(
                    req.body.profile_pic ??
                    req.body.profilePic
                ),

            banner_image:
                clean(
                    req.body.banner_image ??
                    req.body.bannerImage
                )

        };


        query(
            `
                SELECT id
                FROM user_profiles
                WHERE user_id = ?
                LIMIT 1
            `,
            [
                userId
            ],
            (
                checkError,
                rows
            ) => {

                if (checkError) {

                    console.error(
                        "LEGACY PROFILE CHECK ERROR:",
                        checkError
                    );

                    return res.status(500).json({
                        success: false,
                        error: checkError.message
                    });

                }


                // ==================================================
                // UPDATE EXISTING PROFILE
                // ==================================================

                if (
                    rows.length > 0
                ) {

                    query(
                        `
                            UPDATE user_profiles

                            SET

                                name = ?,
                                headline = ?,
                                tagline = ?,
                                location = ?,

                                about = ?,

                                email = ?,
                                phone = ?,

                                github = ?,
                                linkedin = ?,

                                education = ?,
                                experience = ?,
                                projects = ?,
                                skills = ?,
                                certifications = ?,
                                achievements = ?,

                                profile_pic = ?,
                                banner_image = ?

                            WHERE user_id = ?
                        `,
                        [
                            profileData.name,
                            profileData.headline,
                            profileData.tagline,
                            profileData.location,

                            profileData.about,

                            profileData.email,
                            profileData.phone,

                            profileData.github,
                            profileData.linkedin,

                            profileData.education,
                            profileData.experience,
                            profileData.projects,
                            profileData.skills,
                            profileData.certifications,
                            profileData.achievements,

                            profileData.profile_pic,
                            profileData.banner_image,

                            userId
                        ],
                        (
                            updateError,
                            result
                        ) => {

                            if (updateError) {

                                console.error(
                                    "LEGACY PROFILE UPDATE ERROR:",
                                    updateError
                                );

                                return res.status(500).json({
                                    success: false,
                                    error: updateError.message
                                });

                            }

                            return res.json({
                                success: true,
                                message:
                                    "Profile updated successfully.",
                                profileId:
                                    rows[0].id,
                                affectedRows:
                                    result.affectedRows
                            });

                        }
                    );

                    return;
                }


                // ==================================================
                // CREATE NEW PROFILE
                // ==================================================

                query(
                    `
                        INSERT INTO user_profiles
                        (
                            user_id,
                            name,
                            headline,
                            tagline,
                            location,

                            connections,
                            followers,

                            about,

                            email,
                            phone,

                            github,
                            linkedin,

                            education,
                            experience,
                            projects,
                            skills,
                            certifications,
                            achievements,

                            profile_pic,
                            banner_image
                        )

                        VALUES
                        (
                            ?,
                            ?, ?, ?, ?,

                            0, 0,

                            ?,

                            ?, ?,

                            ?, ?,

                            ?, ?, ?, ?, ?, ?,

                            ?, ?
                        )
                    `,
                    [
                        userId,

                        profileData.name,
                        profileData.headline,
                        profileData.tagline,
                        profileData.location,

                        profileData.about,

                        profileData.email,
                        profileData.phone,

                        profileData.github,
                        profileData.linkedin,

                        profileData.education,
                        profileData.experience,
                        profileData.projects,
                        profileData.skills,
                        profileData.certifications,
                        profileData.achievements,

                        profileData.profile_pic,
                        profileData.banner_image
                    ],
                    (
                        insertError,
                        result
                    ) => {

                        if (insertError) {

                            console.error(
                                "LEGACY PROFILE INSERT ERROR:",
                                insertError
                            );

                            return res.status(500).json({
                                success: false,
                                error:
                                    insertError.message
                            });

                        }

                        return res.status(201).json({
                            success: true,
                            message:
                                "Profile created successfully.",
                            profileId:
                                result.insertId,
                            userId:
                                userId
                        });

                    }
                );

            }
        );

    }
);


// ======================================================
// JOBS - GET ALL
// ======================================================

app.get(
    "/api/jobs",
    optionalAuth,
    (req, res) => {

        query(
            `
                SELECT

                    j.id,
                    j.company_id AS companyId,
                    j.title,
                    j.description,
                    j.job_type AS jobType,
                    j.location,
                    j.work_mode AS workMode,
                    j.experience_required AS experienceRequired,
                    j.salary_min AS salaryMin,
                    j.salary_max AS salaryMax,
                    j.salary_currency AS salaryCurrency,
                    j.skills,
                    j.qualifications,
                    j.application_deadline AS applicationDeadline,
                    j.status,
                    j.created_at AS createdAt,
                    j.updated_at AS updatedAt,

                    c.company_name AS companyName,
                    c.logo AS companyLogo

                FROM jobs j

                INNER JOIN companies c
                    ON c.id = j.company_id

                ORDER BY
                    j.created_at DESC,
                    j.id DESC
            `,
            [],
            (
                err,
                rows
            ) => {

                if (err) {

                    console.error(
                        "GET JOBS ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                return res.json({

                    success:
                        true,

                    jobs:
                        rows

                });

            }
        );

    }
);


// ======================================================
// JOB - GET ONE
// ======================================================

app.get(
    "/api/jobs/:id",
    optionalAuth,
    (req, res) => {

        const jobId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(jobId) ||
            jobId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Invalid job ID."

            });

        }


        query(
            `
                SELECT

                    j.id,
                    j.company_id AS companyId,
                    j.title,
                    j.description,
                    j.job_type AS jobType,
                    j.location,
                    j.work_mode AS workMode,
                    j.experience_required AS experienceRequired,
                    j.salary_min AS salaryMin,
                    j.salary_max AS salaryMax,
                    j.salary_currency AS salaryCurrency,
                    j.skills,
                    j.qualifications,
                    j.application_deadline AS applicationDeadline,
                    j.status,
                    j.created_at AS createdAt,
                    j.updated_at AS updatedAt,

                    c.company_name AS companyName,
                    c.logo AS companyLogo

                FROM jobs j

                INNER JOIN companies c
                    ON c.id = j.company_id

                WHERE j.id = ?

                LIMIT 1
            `,
            [
                jobId
            ],
            (
                err,
                rows
            ) => {

                if (err) {

                    console.error(
                        "GET JOB ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                if (
                    rows.length === 0
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "Job not found."

                    });

                }


                return res.json({

                    success:
                        true,

                    job:
                        rows[0]

                });

            }
        );

    }
);


// ======================================================
// COMPANY JOBS - GET ALL
// ======================================================

app.get(
    "/api/company/jobs",
    authenticateToken,
    (req, res) => {

        query(
            `
                SELECT

                    j.id,
                    j.company_id AS companyId,
                    j.title,
                    j.description,
                    j.job_type AS jobType,
                    j.location,
                    j.work_mode AS workMode,
                    j.experience_required AS experienceRequired,
                    j.salary_min AS salaryMin,
                    j.salary_max AS salaryMax,
                    j.salary_currency AS salaryCurrency,
                    j.skills,
                    j.qualifications,
                    j.application_deadline AS applicationDeadline,
                    j.status,
                    j.created_at AS createdAt,
                    j.updated_at AS updatedAt,

                    c.company_name AS companyName,
                    c.logo AS companyLogo

                FROM jobs j

                INNER JOIN companies c
                    ON c.id = j.company_id

                WHERE c.owner_user_id = ?

                ORDER BY
                    j.created_at DESC,
                    j.id DESC
            `,
            [
                req.user.id
            ],
            (
                err,
                rows
            ) => {

                if (err) {

                    console.error(
                        "GET COMPANY JOBS ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                return res.json({

                    success:
                        true,

                    jobs:
                        rows

                });

            }
        );

    }
);


// ======================================================
// CREATE COMPANY JOB
// ======================================================

app.post(
    "/api/company/jobs",
    authenticateToken,
    (req, res) => {

        const companyId =
            Number(
                req.body.company_id ??
                req.body.companyId
            );


        if (
            !Number.isInteger(companyId) ||
            companyId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Valid company ID is required."

            });

        }


        query(
            `
                SELECT id
                FROM companies
                WHERE id = ?
                  AND owner_user_id = ?
                LIMIT 1
            `,
            [
                companyId,
                req.user.id
            ],
            (
                ownerError,
                ownerRows
            ) => {

                if (ownerError) {

                    return res.status(500).json({

                        success:
                            false,

                        error:
                            ownerError.message

                    });

                }


                if (
                    ownerRows.length === 0
                ) {

                    return res.status(403).json({

                        success:
                            false,

                        error:
                            "You do not have permission to create jobs for this company."

                    });

                }


                const title =
                    clean(
                        req.body.title
                    );


                const description =
                    clean(
                        req.body.description
                    );


                const jobType =
                    clean(
                        req.body.job_type ??
                        req.body.jobType
                    );


                const location =
                    clean(
                        req.body.location
                    );


                const workMode =
                    clean(
                        req.body.work_mode ??
                        req.body.workMode
                    );


                const experienceRequired =
                    clean(
                        req.body.experience_required ??
                        req.body.experienceRequired
                    );


                const salaryMin =
                    req.body.salary_min ??
                    req.body.salaryMin ??
                    null;


                const salaryMax =
                    req.body.salary_max ??
                    req.body.salaryMax ??
                    null;


                const salaryCurrency =
                    clean(
                        req.body.salary_currency ??
                        req.body.salaryCurrency
                    ) || "INR";


                const skills =
                    clean(
                        req.body.skills
                    );


                const qualifications =
                    clean(
                        req.body.qualifications
                    );


                const applicationDeadline =
                    clean(
                        req.body.application_deadline ??
                        req.body.applicationDeadline
                    ) || null;


                const status =
                    clean(
                        req.body.status
                    ) || "Active";


                if (!title) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Job title is required."

                    });

                }


                query(
                    `
                        INSERT INTO jobs
                        (
                            company_id,
                            title,
                            description,
                            job_type,
                            location,
                            work_mode,
                            experience_required,
                            salary_min,
                            salary_max,
                            salary_currency,
                            skills,
                            qualifications,
                            application_deadline,
                            status,
                            created_at,
                            updated_at
                        )
                        VALUES
                        (
                            ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, NOW(), NOW()
                        )
                    `,
                    [
                        companyId,
                        title,
                        description,
                        jobType,
                        location,
                        workMode,
                        experienceRequired,
                        salaryMin,
                        salaryMax,
                        salaryCurrency,
                        skills,
                        qualifications,
                        applicationDeadline,
                        status
                    ],
                    (
                        insertError,
                        result
                    ) => {

                        if (insertError) {

                            console.error(
                                "CREATE JOB ERROR:",
                                insertError
                            );


                            return res.status(500).json({

                                success:
                                    false,

                                error:
                                    insertError.message

                            });

                        }


                        return res.status(201).json({

                            success:
                                true,

                            message:
                                "Job created successfully.",

                            jobId:
                                result.insertId

                        });

                    }
                );

            }
        );

    }
);


// ======================================================
// UPDATE COMPANY JOB
// ======================================================

app.put(
    "/api/company/jobs/:id",
    authenticateToken,
    (req, res) => {

        const jobId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(jobId) ||
            jobId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Invalid job ID."

            });

        }


        const title =
            clean(
                req.body.title
            );


        if (!title) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Job title is required."

            });

        }


        query(
            `
                UPDATE jobs j

                INNER JOIN companies c
                    ON c.id = j.company_id

                SET

                    j.title = ?,
                    j.description = ?,
                    j.job_type = ?,
                    j.location = ?,
                    j.work_mode = ?,
                    j.experience_required = ?,
                    j.salary_min = ?,
                    j.salary_max = ?,
                    j.salary_currency = ?,
                    j.skills = ?,
                    j.qualifications = ?,
                    j.application_deadline = ?,
                    j.status = ?,
                    j.updated_at = NOW()

                WHERE j.id = ?
                  AND c.owner_user_id = ?
            `,
            [
                title,

                clean(
                    req.body.description
                ),

                clean(
                    req.body.job_type ??
                    req.body.jobType
                ),

                clean(
                    req.body.location
                ),

                clean(
                    req.body.work_mode ??
                    req.body.workMode
                ),

                clean(
                    req.body.experience_required ??
                    req.body.experienceRequired
                ),

                req.body.salary_min ??
                req.body.salaryMin ??
                null,

                req.body.salary_max ??
                req.body.salaryMax ??
                null,

                clean(
                    req.body.salary_currency ??
                    req.body.salaryCurrency
                ) || "INR",

                clean(
                    req.body.skills
                ),

                clean(
                    req.body.qualifications
                ),

                clean(
                    req.body.application_deadline ??
                    req.body.applicationDeadline
                ) || null,

                clean(
                    req.body.status
                ) || "Active",

                jobId,
                req.user.id

            ],
            (
                err,
                result
            ) => {

                if (err) {

                    console.error(
                        "UPDATE JOB ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "Job not found or you do not have permission to update it."

                    });

                }


                return res.json({

                    success:
                        true,

                    message:
                        "Job updated successfully."

                });

            }
        );

    }
);


// ======================================================
// DELETE COMPANY JOB
// ======================================================

app.delete(
    "/api/company/jobs/:id",
    authenticateToken,
    (req, res) => {

        const jobId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(jobId) ||
            jobId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Invalid job ID."

            });

        }


        query(
            `
                DELETE j
                FROM jobs j

                INNER JOIN companies c
                    ON c.id = j.company_id

                WHERE j.id = ?
                  AND c.owner_user_id = ?
            `,
            [
                jobId,
                req.user.id
            ],
            (
                err,
                result
            ) => {

                if (err) {

                    console.error(
                        "DELETE JOB ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "Job not found or you do not have permission to delete it."

                    });

                }


                return res.json({

                    success:
                        true,

                    message:
                        "Job deleted successfully."

                });

            }
        );

    }
);


// ======================================================
// JOB APPLICATION
// ======================================================
//
// Candidate -> Apply Now -> POST /api/applications
//
// The candidate identity is always taken from the JWT
// (req.user.id). The user_id sent by the browser is never
// trusted as the authoritative identity.
//
// The profile supplied by the frontend is supplemental.
// The recruiter can always retrieve the latest candidate
// profile from user_profiles using applications.user_id.
//
// ======================================================

app.post(
    "/api/applications",
    authenticateToken,
    (req, res) => {

        const userId =
            req.user.id;


        const companyId =
            Number(
                req.body.company_id ??
                req.body.companyId
            );


        const jobId =
            Number(
                req.body.job_id ??
                req.body.jobId
            );


        const profile =
            req.body.profile || {};


        const resumeUrl =
            clean(
                req.body.resume_url ??
                req.body.resumeUrl ??
                profile.resume_url ??
                profile.resumeUrl
            ) || null;


        const coverLetter =
            clean(
                req.body.cover_letter ??
                req.body.coverLetter ??
                profile.cover_letter ??
                profile.coverLetter
            ) || null;


        if (
            !Number.isInteger(companyId) ||
            companyId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Valid company ID is required."

            });

        }


        if (
            !Number.isInteger(jobId) ||
            jobId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Valid job ID is required. Please apply from a specific job."

            });

        }


        query(
            `
                SELECT
                    j.id,
                    j.company_id,
                    j.title,
                    j.status,
                    j.application_deadline
                FROM jobs j
                WHERE j.id = ?
                  AND j.company_id = ?
                LIMIT 1
            `,
            [
                jobId,
                companyId
            ],
            (
                jobError,
                jobRows
            ) => {

                if (jobError) {

                    console.error(
                        "APPLICATION JOB CHECK ERROR:",
                        jobError
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            jobError.message

                    });

                }


                if (
                    jobRows.length === 0
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "Job not found for this company."

                    });

                }


                const job =
                    jobRows[0];


                if (
                    job.status &&
                    String(
                        job.status
                    ).toLowerCase() !==
                    "active"
                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "This job is no longer accepting applications."

                    });

                }


                if (
                    job.application_deadline
                ) {

                    const deadline =
                        new Date(
                            job.application_deadline
                        );


                    if (
                        !Number.isNaN(
                            deadline.getTime()
                        ) &&
                        deadline.getTime() <
                        Date.now()
                    ) {

                        return res.status(400).json({

                            success:
                                false,

                            error:
                                "The application deadline for this job has passed."

                        });

                    }

                }


                query(
                    `
                        SELECT
                            id,
                            username,
                            email
                        FROM users
                        WHERE id = ?
                        LIMIT 1
                    `,
                    [
                        userId
                    ],
                    (
                        userError,
                        userRows
                    ) => {

                        if (userError) {

                            console.error(
                                "APPLICATION USER CHECK ERROR:",
                                userError
                            );


                            return res.status(500).json({

                                success:
                                    false,

                                error:
                                    userError.message

                            });

                        }


                        if (
                            userRows.length === 0
                        ) {

                            return res.status(404).json({

                                success:
                                    false,

                                error:
                                    "Authenticated user was not found."

                            });

                        }


                        query(
                            `
                                SELECT
                                    id,
                                    status
                                FROM applications
                                WHERE job_id = ?
                                  AND user_id = ?
                                LIMIT 1
                            `,
                            [
                                jobId,
                                userId
                            ],
                            (
                                duplicateError,
                                existingRows
                            ) => {

                                if (duplicateError) {

                                    console.error(
                                        "APPLICATION DUPLICATE CHECK ERROR:",
                                        duplicateError
                                    );


                                    return res.status(500).json({

                                        success:
                                            false,

                                        error:
                                            duplicateError.message

                                    });

                                }


                                if (
                                    existingRows.length > 0
                                ) {

                                    return res.status(409).json({

                                        success:
                                            false,

                                        error:
                                            "You have already applied for this job.",

                                        applicationId:
                                            existingRows[0].id,

                                        status:
                                            existingRows[0].status

                                    });

                                }


                                query(
                                    `
                                        INSERT INTO applications
                                        (
                                            job_id,
                                            user_id,
                                            resume_url,
                                            cover_letter,
                                            status,
                                            applied_at
                                        )
                                        VALUES
                                        (
                                            ?, ?, ?, ?, 'Pending', NOW()
                                        )
                                    `,
                                    [
                                        jobId,
                                        userId,
                                        resumeUrl,
                                        coverLetter
                                    ],
                                    (
                                        insertError,
                                        result
                                    ) => {

                                        if (insertError) {

                                            console.error(
                                                "APPLICATION INSERT ERROR:",
                                                insertError
                                            );


                                            return res.status(500).json({

                                                success:
                                                    false,

                                                error:
                                                    insertError.message

                                            });

                                        }


                                        return res.status(201).json({

                                            success:
                                                true,

                                            message:
                                                "Application submitted successfully.",

                                            applicationId:
                                                result.insertId,

                                            userId:
                                                userId,

                                            companyId:
                                                companyId,

                                            jobId:
                                                jobId,

                                            status:
                                                "Pending"

                                        });

                                    }
                                );

                            }
                        );

                    }
                );

            }
        );

    }
);


// ======================================================
// COMPANY APPLICANTS - GET ALL
// ======================================================
//
// Returns applications for jobs belonging to the company
// owned by the authenticated recruiter.
//
// This endpoint is also useful to the existing company
// portal JS, which expects /api/company/applicants.
// ======================================================

app.get(
    "/api/company/applicants",
    authenticateToken,
    (req, res) => {

        const recruiterUserId =
            req.user.id;

        query(
            `
                SELECT
                    a.id,
                    a.user_id AS userId,
                    a.job_id AS jobId,
                    a.resume_url AS resume,
                    a.cover_letter AS coverLetter,
                    a.status,
                    a.applied_at AS appliedAt,
                    a.reviewed_at,
                    a.recruiter_notes,
                    j.title AS jobTitle,
                    c.id AS companyId,
                    c.company_name AS companyName,
                    COALESCE(
                        NULLIF(up.name, ''),
                        u.username
                    ) AS name,
                    up.headline,
                    up.tagline,
                    up.email,
                    up.phone,
                    up.location,
                    up.education,
                    up.experience,
                    up.skills,
                    up.projects,
                    up.certifications,
                    up.achievements,
                    up.profile_pic AS profilePic,
                    up.banner_image AS bannerImage,
                    up.github,
                    up.linkedin,
                    up.about
                FROM applications a
                INNER JOIN jobs j
                    ON j.id = a.job_id
                INNER JOIN companies c
                    ON c.id = j.company_id
                INNER JOIN users owner
                    ON owner.id = c.owner_user_id
                INNER JOIN users u
                    ON u.id = a.user_id
                LEFT JOIN user_profiles up
                    ON up.user_id = a.user_id
                WHERE c.owner_user_id = ?
                ORDER BY a.applied_at DESC, a.id DESC
            `,
            [
                recruiterUserId
            ],
            (
                err,
                rows
            ) => {

                if (err) {

                    console.error(
                        "GET COMPANY APPLICANTS ERROR:",
                        err
                    );

                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                return res.json({

                    success:
                        true,

                    applicants:
                        rows

                });

            }
        );

    }
);


// ======================================================
// COMPANY APPLICANT - GET ONE
// ======================================================

app.get(
    "/api/company/applicants/:id",
    authenticateToken,
    (req, res) => {

        const applicationId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(applicationId) ||
            applicationId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Invalid application ID."

            });

        }


        query(
            `
                SELECT
                    a.id,
                    a.user_id AS userId,
                    a.job_id AS jobId,
                    a.resume_url AS resume,
                    a.cover_letter AS coverLetter,
                    a.status,
                    a.applied_at AS appliedAt,
                    a.reviewed_at,
                    a.recruiter_notes,
                    j.title AS jobTitle,
                    c.id AS companyId,
                    c.company_name AS companyName,
                    COALESCE(
                        NULLIF(up.name, ''),
                        u.username
                    ) AS name,
                    up.headline,
                    up.tagline,
                    up.email,
                    up.phone,
                    up.location,
                    up.education,
                    up.experience,
                    up.skills,
                    up.projects,
                    up.certifications,
                    up.achievements,
                    up.profile_pic AS profilePic,
                    up.banner_image AS bannerImage,
                    up.github,
                    up.linkedin,
                    up.about
                FROM applications a
                INNER JOIN jobs j
                    ON j.id = a.job_id
                INNER JOIN companies c
                    ON c.id = j.company_id
                INNER JOIN users owner
                    ON owner.id = c.owner_user_id
                INNER JOIN users u
                    ON u.id = a.user_id
                LEFT JOIN user_profiles up
                    ON up.user_id = a.user_id
                WHERE a.id = ?
                  AND c.owner_user_id = ?
                LIMIT 1
            `,
            [
                applicationId,
                req.user.id
            ],
            (
                err,
                rows
            ) => {

                if (err) {

                    console.error(
                        "GET COMPANY APPLICANT ERROR:",
                        err
                    );

                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                if (!rows.length) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "Application not found."

                    });

                }


                return res.json({

                    success:
                        true,

                    applicant:
                        rows[0]

                });

            }
        );

    }
);


// ======================================================
// COMPANY APPLICATION STATUS UPDATE
// ======================================================

app.put(
    "/api/company/applications/:id/status",
    authenticateToken,
    (req, res) => {

        const applicationId =
            Number(
                req.params.id
            );

        const newStatus =
            clean(
                req.body.status
            );

        const allowedStatuses = [
            "Pending",
            "Reviewed",
            "Shortlisted",
            "Interview",
            "Selected",
            "Rejected"
        ];


        if (
            !Number.isInteger(applicationId) ||
            applicationId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Invalid application ID."

            });

        }


        if (
            !allowedStatuses.includes(
                newStatus
            )
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    `Invalid application status. Allowed values: ${allowedStatuses.join(", ")}.`

            });

        }


        query(
            `
                UPDATE applications a
                INNER JOIN jobs j
                    ON j.id = a.job_id
                INNER JOIN companies c
                    ON c.id = j.company_id
                SET
                    a.status = ?,
                    a.reviewed_at = CASE
                        WHEN ? IN ('Reviewed', 'Shortlisted', 'Interview', 'Selected', 'Rejected')
                            THEN NOW()
                        ELSE a.reviewed_at
                    END,
                    a.updated_at = NOW()
                WHERE a.id = ?
                  AND c.owner_user_id = ?
            `,
            [
                newStatus,
                newStatus,
                applicationId,
                req.user.id
            ],
            (
                err,
                result
            ) => {

                if (err) {

                    console.error(
                        "UPDATE APPLICATION STATUS ERROR:",
                        err
                    );

                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "Application not found or you do not own this company."

                    });

                }


                return res.json({

                    success:
                        true,

                    message:
                        `Application status updated to ${newStatus}.`,

                    applicationId:
                        applicationId,

                    status:
                        newStatus

                });

            }
        );

    }
);


// ======================================================
// COURSES - GET ALL
// ======================================================

app.get(
    "/api/courses",
    (req, res) => {

        query(
            `
                SELECT
                    id,
                    course_name,
                    field,
                    description,
                    institution,
                    level,
                    mode,
                    duration,
                    course_url,
                    created_at,
                    updated_at
                FROM courses
                ORDER BY id DESC
            `,
            [],
            (
                err,
                rows
            ) => {

                if (err) {

                    console.error(
                        "GET COURSES ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                return res.json(
                    rows
                );

            }
        );

    }
);


// ======================================================
// COURSE - GET ONE
// ======================================================

app.get(
    "/api/courses/:id",
    (req, res) => {

        const courseId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(courseId) ||
            courseId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Invalid course ID."

            });

        }


        query(
            `
                SELECT
                    id,
                    course_name,
                    field,
                    description,
                    institution,
                    level,
                    mode,
                    duration,
                    course_url,
                    created_at,
                    updated_at
                FROM courses
                WHERE id = ?
                LIMIT 1
            `,
            [
                courseId
            ],
            (
                err,
                rows
            ) => {

                if (err) {

                    console.error(
                        "GET COURSE ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                if (
                    rows.length === 0
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "Course not found."

                    });

                }


                return res.json({

                    success:
                        true,

                    course:
                        rows[0]

                });

            }
        );

    }
);


// ======================================================
// CREATE COURSE
// ======================================================

app.post(
    "/api/courses",
    authenticateToken,
    (req, res) => {

        const courseName =
            clean(
                req.body.course_name
            );


        const field =
            clean(
                req.body.field
            );


        const description =
            clean(
                req.body.description
            );


        const institution =
            clean(
                req.body.institution
            );


        const level =
            clean(
                req.body.level
            );


        const mode =
            clean(
                req.body.mode
            );


        const duration =
            clean(
                req.body.duration
            );


        const courseUrl =
            clean(
                req.body.course_url
            );


        if (!courseName) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Course name is required."

            });

        }


        if (!field) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Course field is required."

            });

        }


        query(
            `
                INSERT INTO courses
                (
                    course_name,
                    field,
                    description,
                    institution,
                    level,
                    mode,
                    duration,
                    course_url,
                    created_at,
                    updated_at
                )
                VALUES
                (
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, NOW(), NOW()
                )
            `,
            [
                courseName,
                field,
                description,
                institution,
                level,
                mode,
                duration,
                courseUrl
            ],
            (
                err,
                result
            ) => {

                if (err) {

                    console.error(
                        "CREATE COURSE ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                return res.status(201).json({

                    success:
                        true,

                    message:
                        "Course created successfully.",

                    courseId:
                        result.insertId

                });

            }
        );

    }
);


// ======================================================
// UPDATE COURSE
// ======================================================

app.put(
    "/api/courses/:id",
    authenticateToken,
    (req, res) => {

        const courseId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(courseId) ||
            courseId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Invalid course ID."

            });

        }


        const courseName =
            clean(
                req.body.course_name
            );


        const field =
            clean(
                req.body.field
            );


        const description =
            clean(
                req.body.description
            );


        const institution =
            clean(
                req.body.institution
            );


        const level =
            clean(
                req.body.level
            );


        const mode =
            clean(
                req.body.mode
            );


        const duration =
            clean(
                req.body.duration
            );


        const courseUrl =
            clean(
                req.body.course_url
            );


        if (!courseName) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Course name is required."

            });

        }


        query(
            `
                UPDATE courses
                SET

                    course_name = ?,
                    field = ?,
                    description = ?,
                    institution = ?,
                    level = ?,
                    mode = ?,
                    duration = ?,
                    course_url = ?,
                    updated_at = NOW()

                WHERE id = ?
            `,
            [
                courseName,
                field,
                description,
                institution,
                level,
                mode,
                duration,
                courseUrl,
                courseId
            ],
            (
                err,
                result
            ) => {

                if (err) {

                    console.error(
                        "UPDATE COURSE ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "Course not found."

                    });

                }


                return res.json({

                    success:
                        true,

                    message:
                        "Course updated successfully."

                });

            }
        );

    }
);


// ======================================================
// DELETE COURSE
// ======================================================

app.delete(
    "/api/courses/:id",
    authenticateToken,
    (req, res) => {

        const courseId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(courseId) ||
            courseId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Invalid course ID."

            });

        }


        query(
            `
                DELETE FROM courses
                WHERE id = ?
            `,
            [
                courseId
            ],
            (
                err,
                result
            ) => {

                if (err) {

                    console.error(
                        "DELETE COURSE ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "Course not found."

                    });

                }


                return res.json({

                    success:
                        true,

                    message:
                        "Course deleted successfully."

                });

            }
        );

    }
);

// ======================================================
// POSTS - GET ALL
// ======================================================

app.get(
    "/api/posts",
    optionalAuth,
    (req, res) => {

        const currentUserId =
            req.user?.id || 0;


        query(
            `
                SELECT

                    p.id,

                    p.user_id AS userId,

                    p.content,

                    p.image_url,
                    p.video_url,

                    p.created_at,

                    COALESCE(
                        NULLIF(up.name, ''),
                        u.username
                    ) AS name,

                    u.username,

                    up.profile_pic AS profilePic,

                    (
                        SELECT COUNT(*)
                        FROM post_likes pl
                        WHERE pl.post_id = p.id
                    ) AS likes_count,

                    (
                        SELECT COUNT(*)
                        FROM post_shares ps
                        WHERE ps.post_id = p.id
                    ) AS shares_count,

                    (
                        SELECT COUNT(*)
                        FROM comments c
                        WHERE c.post_id = p.id
                    ) AS comments_count,

                    CASE

                        WHEN
                            ? > 0

                            AND EXISTS
                            (
                                SELECT 1
                                FROM post_likes mypl

                                WHERE
                                    mypl.post_id = p.id

                                    AND mypl.user_id = ?
                            )

                        THEN 1

                        ELSE 0

                    END AS liked_by_current_user

                FROM posts p

                LEFT JOIN users u
                    ON u.id = p.user_id

                LEFT JOIN user_profiles up
                    ON up.user_id = p.user_id

                ORDER BY
                    p.created_at DESC,
                    p.id DESC
            `,
            [
                currentUserId,
                currentUserId
            ],
            (
                err,
                rows
            ) => {

                if (err) {

                    console.error(
                        "GET POSTS ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                return res.json({

                    success:
                        true,

                    posts:
                        rows

                });

            }
        );

    }
);


// ======================================================
// GET SINGLE POST
// ======================================================

app.get(
    "/api/posts/:id",
    optionalAuth,
    (req, res) => {

        const postId =
            Number(
                req.params.id
            );


        const currentUserId =
            req.user?.id || 0;


        if (
            !Number.isInteger(postId) ||
            postId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Invalid post ID."

            });

        }


        query(
            `
                SELECT

                    p.id,

                    p.user_id AS userId,

                    p.content,

                    p.image_url,
                    p.video_url,

                    p.created_at,

                    COALESCE(
                        NULLIF(up.name, ''),
                        u.username
                    ) AS name,

                    u.username,

                    up.profile_pic AS profilePic,

                    (
                        SELECT COUNT(*)
                        FROM post_likes pl
                        WHERE pl.post_id = p.id
                    ) AS likes_count,

                    (
                        SELECT COUNT(*)
                        FROM post_shares ps
                        WHERE ps.post_id = p.id
                    ) AS shares_count,

                    (
                        SELECT COUNT(*)
                        FROM comments c
                        WHERE c.post_id = p.id
                    ) AS comments_count,

                    CASE

                        WHEN
                            ? > 0

                            AND EXISTS
                            (
                                SELECT 1
                                FROM post_likes mypl

                                WHERE
                                    mypl.post_id = p.id

                                    AND mypl.user_id = ?
                            )

                        THEN 1

                        ELSE 0

                    END AS liked_by_current_user

                FROM posts p

                LEFT JOIN users u
                    ON u.id = p.user_id

                LEFT JOIN user_profiles up
                    ON up.user_id = p.user_id

                WHERE p.id = ?

                LIMIT 1
            `,
            [
                currentUserId,
                currentUserId,
                postId
            ],
            (
                err,
                rows
            ) => {

                if (err) {

                    console.error(
                        "GET SINGLE POST ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                if (
                    rows.length === 0
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "Post not found."

                    });

                }


                return res.json({

                    success:
                        true,

                    post:
                        rows[0]

                });

            }
        );

    }
);


// ======================================================
// CREATE POST
// ======================================================

// =========================================
// CREATE POST
// POST /api/posts
// =========================================

app.post(
    "/api/posts",
    authenticateToken,
    (req, res) => {

        // =====================================
        // GET LOGGED-IN USER ID FROM JWT
        // =====================================

        const userId =
            Number(
                req.user?.id ??
                req.user?.userId
            );


        // =====================================
        // VALIDATE USER ID
        // =====================================

        if (
            !Number.isInteger(userId) ||
            userId <= 0
        ) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "Invalid authenticated user."
            });
        }


        // =====================================
        // GET POST CONTENT
        // =====================================

        const content =
            clean(
                req.body.content
            );


        // =====================================
        // GET IMAGE URL
        // =====================================

        const imageUrl =
            clean(
                req.body.image_url ??
                req.body.imageUrl
            ) || null;


        // =====================================
        // GET VIDEO URL
        // =====================================

        const videoUrl =
            clean(
                req.body.video_url ??
                req.body.videoUrl
            ) || null;


        // =====================================
        // VALIDATE POST
        // =====================================

        if (
            !content &&
            !imageUrl &&
            !videoUrl
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Post content or media is required."
            });
        }


        // =====================================
        // CONTENT LENGTH
        // =====================================

        if (
            content.length > 500
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Post content cannot exceed 500 characters."
            });
        }


        // =====================================
        // INSERT POST
        // =====================================

        query(
            `
                INSERT INTO posts
                (
                    user_id,
                    content,
                    image_url,
                    video_url,
                    created_at
                )
                VALUES
                (
                    ?, ?, ?, ?, NOW()
                )
            `,
            [
                userId,
                content || null,
                imageUrl,
                videoUrl
            ],
            (
                err,
                result
            ) => {

                if (err) {

                    console.error(
                        "CREATE POST ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message
                    });
                }


                // =================================
                // SUCCESS
                // =================================

                return res.status(201).json({

                    success:
                        true,

                    message:
                        "Post created successfully.",

                    postId:
                        result.insertId,

                    user_id:
                        userId
                });

            }
        );
    }
);
// ======================================================
// DELETE POST
// ======================================================


// ======================================================
// UNLIKE POST
// ======================================================

app.delete(
    "/api/posts/:id/like",
    authenticateToken,
    (req, res) => {

        const postId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(postId) ||
            postId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Invalid post ID."

            });

        }


        query(
            `
                DELETE FROM post_likes
                WHERE post_id = ?
                  AND user_id = ?
            `,
            [
                postId,
                req.user.id
            ],
            (
                err,
                result
            ) => {

                if (err) {

                    console.error(
                        "UNLIKE POST ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                query(
                    `
                        SELECT
                            COUNT(*) AS count
                        FROM post_likes
                        WHERE post_id = ?
                    `,
                    [
                        postId
                    ],
                    (
                        countError,
                        countRows
                    ) => {

                        if (countError) {

                            return res.json({

                                success:
                                    true,

                                liked:
                                    false,

                                likes_count:
                                    0,

                                removed:
                                    result.affectedRows > 0

                            });

                        }


                        return res.json({

                            success:
                                true,

                            liked:
                                false,

                            likes_count:
                                Number(
                                    countRows[0].count
                                ),

                            removed:
                                result.affectedRows > 0

                        });

                    }
                );

            }
        );

    }
);


// ======================================================
// CHECK WHETHER CURRENT USER LIKED POST
// ======================================================

app.get(
    "/api/posts/:id/like",
    authenticateToken,
    (req, res) => {

        const postId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(postId) ||
            postId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Invalid post ID."

            });

        }


        query(
            `
                SELECT
                    id
                FROM post_likes
                WHERE post_id = ?
                  AND user_id = ?
                LIMIT 1
            `,
            [
                postId,
                req.user.id
            ],
            (
                err,
                rows
            ) => {

                if (err) {

                    console.error(
                        "CHECK POST LIKE ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                return res.json({

                    success:
                        true,

                    liked:
                        rows.length > 0

                });

            }
        );

    }
);


// ======================================================
// SHARE POST
// ======================================================

app.post(
    "/api/posts/:id/share",
    authenticateToken,
    (req, res) => {

        const postId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(postId) ||
            postId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Invalid post ID."

            });

        }


        query(
            `
                SELECT
                    id
                FROM posts
                WHERE id = ?
                LIMIT 1
            `,
            [
                postId
            ],
            (
                postError,
                postRows
            ) => {

                if (postError) {

                    console.error(
                        "SHARE POST LOOKUP ERROR:",
                        postError
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            postError.message

                    });

                }


                if (
                    postRows.length === 0
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "Post not found."

                    });

                }


                query(
                    `
                        INSERT INTO post_shares
                        (
                            post_id,
                            user_id,
                            created_at
                        )
                        VALUES
                        (
                            ?, ?, NOW()
                        )
                    `,
                    [
                        postId,
                        req.user.id
                    ],
                    (
                        shareError,
                        result
                    ) => {

                        if (shareError) {

                            console.error(
                                "SHARE POST ERROR:",
                                shareError
                            );


                            return res.status(500).json({

                                success:
                                    false,

                                error:
                                    shareError.message

                            });

                        }


                        query(
                            `
                                SELECT
                                    COUNT(*) AS count
                                FROM post_shares
                                WHERE post_id = ?
                            `,
                            [
                                postId
                            ],
                            (
                                countError,
                                countRows
                            ) => {

                                if (countError) {

                                    return res.status(201).json({

                                        success:
                                            true,

                                        message:
                                            "Post shared successfully.",

                                        shareId:
                                            result.insertId,

                                        shares_count:
                                            0

                                    });

                                }


                                return res.status(201).json({

                                    success:
                                        true,

                                    message:
                                        "Post shared successfully.",

                                    shareId:
                                        result.insertId,

                                    shares_count:
                                        Number(
                                            countRows[0].count
                                        )

                                });

                            }
                        );

                    }
                );

            }
        );

    }
);


// ======================================================
// GET POST COMMENTS
// ======================================================

app.get(
    "/api/posts/:id/comments",
    optionalAuth,
    (req, res) => {

        const postId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(postId) ||
            postId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Invalid post ID."

            });

        }


        query(
            `
                SELECT

                    c.id,

                    c.post_id AS postId,

                    c.user_id AS userId,

                    c.content,

                    c.created_at AS createdAt,

                    COALESCE(
                        NULLIF(up.name, ''),
                        u.username
                    ) AS name,

                    u.username,

                    up.profile_pic AS profilePic,

                    up.headline AS headline

                FROM comments c

                LEFT JOIN users u
                    ON u.id = c.user_id

                LEFT JOIN user_profiles up
                    ON up.user_id = c.user_id

                WHERE c.post_id = ?

                ORDER BY
                    c.created_at ASC,
                    c.id ASC
            `,
            [
                postId
            ],
            (
                err,
                rows
            ) => {

                if (err) {

                    console.error(
                        "GET COMMENTS ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                return res.json({

                    success:
                        true,

                    comments:
                        rows

                });

            }
        );

    }
);


// ======================================================
// CREATE POST COMMENT
// ======================================================

app.post(
    "/api/posts/:id/comments",
    authenticateToken,
    (req, res) => {

        const postId =
            Number(
                req.params.id
            );


        const content =
            clean(
                req.body.content ??
                req.body.comment
            );


        if (
            !Number.isInteger(postId) ||
            postId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Invalid post ID."

            });

        }


        if (!content) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Comment cannot be empty."

            });

        }


        if (
            content.length > 1000
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Comment cannot exceed 1000 characters."

            });

        }


        query(
            `
                SELECT
                    id
                FROM posts
                WHERE id = ?
                LIMIT 1
            `,
            [
                postId
            ],
            (
                postError,
                postRows
            ) => {

                if (postError) {

                    console.error(
                        "COMMENT POST LOOKUP ERROR:",
                        postError
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            postError.message

                    });

                }


                if (
                    postRows.length === 0
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "Post not found."

                    });

                }


                query(
                    `
                        INSERT INTO comments
                        (
                            post_id,
                            user_id,
                            content,
                            created_at
                        )
                        VALUES
                        (
                            ?, ?, ?, NOW()
                        )
                    `,
                    [
                        postId,
                        req.user.id,
                        content
                    ],
                    (
                        err,
                        result
                    ) => {

                        if (err) {

                            console.error(
                                "CREATE COMMENT ERROR:",
                                err
                            );


                            return res.status(500).json({

                                success:
                                    false,

                                error:
                                    err.message

                            });

                        }


                        return res.status(201).json({

                            success:
                                true,

                            message:
                                "Comment added successfully.",

                            commentId:
                                result.insertId,

                            postId:
                                postId,

                            userId:
                                req.user.id,

                            content:
                                content

                        });

                    }
                );

            }
        );

    }
);


// ======================================================
// DELETE MY COMMENT
// ======================================================

app.delete(
    "/api/posts/:postId/comments/:commentId",
    authenticateToken,
    (req, res) => {

        const postId =
            Number(
                req.params.postId
            );


        const commentId =
            Number(
                req.params.commentId
            );


        if (
            !Number.isInteger(postId) ||
            postId <= 0 ||
            !Number.isInteger(commentId) ||
            commentId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Invalid post or comment ID."

            });

        }


        query(
            `
                DELETE FROM comments
                WHERE id = ?
                  AND post_id = ?
                  AND user_id = ?
            `,
            [
                commentId,
                postId,
                req.user.id
            ],
            (
                err,
                result
            ) => {

                if (err) {

                    console.error(
                        "DELETE COMMENT ERROR:",
                        err
                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            err.message

                    });

                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "Comment not found or you do not have permission to delete it."

                    });

                }


                return res.json({

                    success:
                        true,

                    message:
                        "Comment deleted successfully."

                });

            }
        );

    }
);

// =========================================================
// GEMINI AI CHATBOT
// =========================================================

app.post("/api/ai-chat", async (req, res) => {
    try {
        const { message } = req.body;

        console.log("\n================ AI CHAT ================");
        console.log("User message:", message);
        console.log(
            "API key loaded:",
            process.env.GEMINI_API_KEY ? "YES" : "NO"
        );

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter a message."
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                message: "GEMINI_API_KEY is not loaded from .env"
            });
        }

      const url =
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": process.env.GEMINI_API_KEY
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: message.trim()
                            }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();

        console.log("Gemini status:", response.status);
        console.log("Gemini response:");
        console.log(JSON.stringify(data, null, 2));

        if (!response.ok) {
           console.error("GEMINI ERROR STATUS:", response.status);
    console.error("GEMINI ERROR BODY:", JSON.stringify(data, null, 2));

    return res.status(500).json({
        success: false,
        message: data?.error?.message || "Gemini API request failed",
        geminiStatus: response.status,
        geminiError: data?.error || data
            });
        }

        const reply = data?.candidates?.[0]?.content?.parts
            ?.map(part => part?.text || "")
            .join("")
            .trim();

        if (!reply) {
            return res.status(502).json({
                success: false,
                message: "Gemini returned an empty response.",
                geminiResponse: data
            });
        }

        console.log("AI reply:", reply);
        console.log("========================================\n");

        return res.json({
            success: true,
            reply
        });

    } catch (error) {
        console.error("\nAI SERVER ERROR:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message || "Server error while contacting Gemini"
        });
    }
});

// =========================================================
// INDUSTRY READINESS TEST - START
// =========================================================

app.post(
    "/api/industry-readiness/start",
    authenticateToken,
    async (req, res) => {

        // IMPORTANT:
        // This is the SAME user ID from the login JWT.
        const userId = req.user.id;

        console.log(
            "========================================"
        );

        console.log(
            "INDUSTRY READINESS TEST START"
        );

        console.log(
            "Authenticated User ID:",
            userId
        );

        console.log(
            "========================================"
        );

        try {

            // -----------------------------------------
            // GET THIS USER'S HEADLINE + TAGLINE
            // -----------------------------------------

            query(
                `
                SELECT
                    headline,
                    tagline
                FROM user_profiles
                WHERE user_id = ?
                LIMIT 1
                `,
                [userId],
                async (
                    profileError,
                    profileResults
                ) => {

                    if (profileError) {

                        console.error(
                            "PROFILE QUERY ERROR:",
                            profileError
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Failed to load user profile.",
                            error:
                                profileError.message
                        });
                    }

                    if (
                        profileResults.length === 0
                    ) {

                        return res.status(404).json({
                            success: false,
                            message:
                                "User profile not found."
                        });
                    }

                    // -----------------------------------------
                    // PREFER HEADLINE
                    // FALL BACK TO TAGLINE
                    // -----------------------------------------

                    const headline =
                        clean(
                            profileResults[0].headline
                        );

                    const tagline =
                        clean(
                            profileResults[0].tagline
                        );

                    const professionalTagline =
                        headline ||
                        tagline;

                    console.log(
                        "Headline:",
                        headline
                    );

                    console.log(
                        "Tagline:",
                        tagline
                    );

                    console.log(
                        "Text used for AI:",
                        professionalTagline
                    );

                    if (
                        !professionalTagline
                    ) {

                        return res.status(400).json({
                            success: false,
                            message:
                                "Please add a professional headline to your profile before taking the test."
                        });
                    }

                    // -----------------------------------------
                    // GEMINI PROMPT
                    // -----------------------------------------

                    const prompt = `
You are an Industry Readiness Assessment Generator
for Campus2Career.

The candidate's professional career headline is:

"${professionalTagline}"

Generate EXACTLY 20 multiple-choice questions to
evaluate the candidate's industry readiness.

Requirements:

- Exactly 20 questions
- Exactly 4 options per question
- Exactly 1 correct answer
- Questions must be relevant to the candidate's career headline
- Focus on practical industry readiness
- Include practical scenarios and problem-solving
- Include technical and workplace questions when relevant
- Suitable for an early-career professional
- No duplicate questions
- No explanations
- Return ONLY valid JSON

Format:

{
    "questions": [
        {
            "question": "Question text",
            "options": [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
            ],
            "correctAnswer": 0
        }
    ]
}

correctAnswer:
0 = Option A
1 = Option B
2 = Option C
3 = Option D
`;

                    try {

                        // -----------------------------------------
                        // GEMINI
                        // -----------------------------------------

                        const geminiResponse =
                            await fetch(
                                "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
                                {
                                    method: "POST",

                                    headers: {
                                        "Content-Type":
                                            "application/json",

                                        "x-goog-api-key":
                                            process.env.GEMINI_API_KEY
                                    },

                                    body:
                                        JSON.stringify({
                                            contents: [
                                                {
                                                    role:
                                                        "user",

                                                    parts: [
                                                        {
                                                            text:
                                                                prompt
                                                        }
                                                    ]
                                                }
                                            ]
                                        })
                                }
                            );

                        const geminiData =
                            await geminiResponse.json();

                        console.log(
                            "Gemini Status:",
                            geminiResponse.status
                        );

                        if (
                            !geminiResponse.ok
                        ) {

                            console.error(
                                "Gemini ERROR:",
                                JSON.stringify(
                                    geminiData,
                                    null,
                                    2
                                )
                            );

                            return res.status(500).json({
                                success: false,
                                message:
                                    geminiData?.error?.message ||
                                    "Gemini failed to generate the test."
                            });
                        }

                        // -----------------------------------------
                        // GET TEXT
                        // -----------------------------------------

                        let aiText =
                            geminiData
                                ?.candidates?.[0]
                                ?.content?.parts
                                ?.map(
                                    part =>
                                        part?.text || ""
                                )
                                .join("")
                                .trim();

                        if (!aiText) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Gemini returned no questions."
                            });
                        }

                        // -----------------------------------------
                        // REMOVE MARKDOWN FENCES
                        // -----------------------------------------

                        aiText =
                            aiText
                                .replace(
                                    /^```json\s*/i,
                                    ""
                                )
                                .replace(
                                    /^```\s*/i,
                                    ""
                                )
                                .replace(
                                    /\s*```$/i,
                                    ""
                                )
                                .trim();

                        // -----------------------------------------
                        // PARSE JSON
                        // -----------------------------------------

                        let testData;

                        try {

                            testData =
                                JSON.parse(
                                    aiText
                                );

                        } catch (parseError) {

                            console.error(
                                "Gemini JSON Parse Error:",
                                parseError
                            );

                            console.error(
                                "Gemini Output:",
                                aiText
                            );

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Gemini returned invalid question data."
                            });
                        }

                        // -----------------------------------------
                        // EXACTLY 20
                        // -----------------------------------------

                        if (
                            !testData.questions ||
                            !Array.isArray(
                                testData.questions
                            ) ||
                            testData.questions.length !== 20
                        ) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Gemini did not generate exactly 20 questions."
                            });
                        }

                        // -----------------------------------------
                        // VALIDATE QUESTIONS
                        // -----------------------------------------

                        for (
                            const question
                            of testData.questions
                        ) {

                            if (
                                !question.question ||
                                !Array.isArray(
                                    question.options
                                ) ||
                                question.options.length !== 4 ||
                                !Number.isInteger(
                                    question.correctAnswer
                                ) ||
                                question.correctAnswer < 0 ||
                                question.correctAnswer > 3
                            ) {

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Invalid question format returned by Gemini."
                                });
                            }
                        }

                        // -----------------------------------------
                        // ANSWER KEY
                        // -----------------------------------------

                        const answerKey =
                            testData.questions.map(
                                question =>
                                    question.correctAnswer
                            );

                        // -----------------------------------------
                        // SEND QUESTIONS WITHOUT ANSWERS
                        // -----------------------------------------

                        const frontendQuestions =
                            testData.questions.map(
                                question => ({
                                    question:
                                        question.question,

                                    options:
                                        question.options
                                })
                            );

                        // -----------------------------------------
                        // SAVE TEST
                        // -----------------------------------------

                        query(
                            `
                            INSERT INTO industry_readiness_tests
                            (
                                user_id,
                                tagline,
                                questions,
                                answers,
                                score,
                                total_questions,
                                percentage,
                                grade,
                                test_rating,
                                completed
                            )
                            VALUES
                            (
                                ?,
                                ?,
                                ?,
                                ?,
                                0,
                                20,
                                0.00,
                                NULL,
                                NULL,
                                FALSE
                            )
                            `,
                            [
                                userId,

                                professionalTagline,

                                JSON.stringify(
                                    testData.questions
                                ),

                                JSON.stringify(
                                    answerKey
                                )
                            ],
                            (
                                insertError,
                                insertResult
                            ) => {

                                if (
                                    insertError
                                ) {

                                    console.error(
                                        "TEST INSERT ERROR:",
                                        insertError
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            "Failed to save Industry Readiness Test.",
                                        error:
                                            insertError.message
                                    });
                                }

                                console.log(
                                    "Industry Test ID:",
                                    insertResult.insertId
                                );

                                console.log(
                                    "Industry Test User ID:",
                                    userId
                                );

                                return res.json({

                                    success:
                                        true,

                                    userId:
                                        userId,

                                    testId:
                                        insertResult.insertId,

                                    professionalTagline:
                                        professionalTagline,

                                    totalQuestions:
                                        20,

                                    questions:
                                        frontendQuestions
                                });
                            }
                        );

                    } catch (
                        geminiError
                    ) {

                        console.error(
                            "GEMINI REQUEST ERROR:",
                            geminiError
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                geminiError.message ||
                                "Unable to contact Gemini."
                        });
                    }
                }
            );

        } catch (
            error
        ) {

            console.error(
                "INDUSTRY TEST START ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Unable to start Industry Readiness Test."
            });
        }
    }
);



app.post(
    "/api/industry-readiness/submit",
    authenticateToken,
    (req, res) => {

        const userId = req.user.id;

        const {
            testId,
            answers
        } = req.body;

        console.log(
            "Submitting test:",
            testId,
            "for user:",
            userId
        );

        if (!testId || !Array.isArray(answers)) {

            return res.status(400).json({
                success: false,
                message:
                    "Test ID and answers are required"
            });
        }

        if (answers.length !== 20) {

            return res.status(400).json({
                success: false,
                message:
                    "Exactly 20 answers are required"
            });
        }

        // -----------------------------------------
        // GET TEST
        // -----------------------------------------

        db.query(
            `
            SELECT
                id,
                user_id,
                answers,
                completed
            FROM industry_readiness_tests
            WHERE id = ?
            AND user_id = ?
            LIMIT 1
            `,
            [
                testId,
                userId
            ],
            (error, results) => {

                if (error) {

                    console.error(
                        "Test lookup error:",
                        error
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Failed to retrieve test"
                    });
                }

                if (!results.length) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Test does not belong to this user"
                    });
                }

                const test = results[0];

                if (test.completed) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "This test has already been submitted"
                    });
                }

                // -----------------------------------------
                // GET ANSWER KEY
                // -----------------------------------------

                let correctAnswers;

                try {

                    correctAnswers =
                        typeof test.answers === "string"
                            ? JSON.parse(test.answers)
                            : test.answers;

                } catch (parseError) {

                    console.error(
                        "Answer JSON error:",
                        parseError
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Invalid answer data"
                    });
                }

                // -----------------------------------------
                // CALCULATE SCORE
                // -----------------------------------------

                let score = 0;

for (let i = 0; i < 20; i++) {

    const userAnswer =
        Number(answers[i]);

    const correctAnswer =
        Number(correctAnswers[i]);

    if (
        Number.isInteger(userAnswer) &&
        userAnswer === correctAnswer
    ) {
        score++;
    }
}

const percentage =
    Number(
        ((score / 20) * 100).toFixed(2)
    );

let grade;
let testRating;

if (percentage >= 90) {

    grade = "A+";
    testRating = 5.0;

} else if (percentage >= 80) {

    grade = "A";
    testRating = 4.5;

} else if (percentage >= 70) {

    grade = "B";
    testRating = 4.0;

} else if (percentage >= 60) {

    grade = "C";
    testRating = 3.0;

} else if (percentage >= 50) {

    grade = "D";
    testRating = 2.0;

} else {

    grade = "F";
    testRating = 1.0;
}
                // -----------------------------------------
                // SAVE RESULT
                // -----------------------------------------

                db.query(
                    `
                    UPDATE industry_readiness_tests
                    SET
                     answers=?,
                        score=?,
                    percentage=?,
                     grade=?,
                     test_rating=?,
                     completed=TRUE,
                     completed_at=NOW()
                    WHERE id=? AND user_id=?
                    `,
                    [
                        JSON.stringify(answers),
                        score,
                        percentage,
                        grade,
                        testRating,
                        testId,
                        userId
                    ],
                    updateError => {

                        if (updateError) {

                            console.error(
                                "Result update error:",
                                updateError
                            );

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Failed to save result"
                            });
                        }

                        console.log(
                            `User ${userId} scored ${score}/20`
                        );

                        return res.json({
                            success: true,
                            userId,
                            testId,
                            score,
                            totalQuestions: 20,
                            percentage,
                             grade,
                            testRating
                        });
                    }
                );
            }
        );
    }
);


app.get(
    "/api/industry-readiness/latest",
    authenticateToken,
    (req, res) => {

        const userId = req.user.id;

        db.query(
            `
            SELECT
                id,
                user_id,
                score,
                total_questions,
                percentage,
                grade,
                test_rating,
                completed_at
                FROM industry_readiness_tests
                WHERE user_id=? AND completed=TRUE
                ORDER BY id DESC
                LIMIT 1
            `,
            [userId],
            (error, results) => {

                if (error) {

                    console.error(
                        "Score retrieval error:",
                        error
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Failed to load readiness score"
                    });
                }

                if (!results.length) {

                    return res.json({
                        success: true,
                        hasScore: false,
                        userId: userId
                    });
                }

                const result = results[0];

                return res.json({
                    success: true,
                    hasScore: true,

                    userId: userId,

                    score: result.score,

                    totalQuestions:
                        result.total_questions,

                    percentage:
                        Number(result.percentage),

                        

                    completedAt:
                        result.completed_at,

                        grade: result.grade,
                        testRating: Number(result.test_rating)
                });
            }
        );
    }
);



// =========================================================
// INDUSTRY READINESS TEST - START
// =========================================================


// ======================================================
// DELETE OWN POST
// ======================================================

app.delete(
    "/api/posts/:id",
    authenticateToken,
    (req, res) => {

        const postId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(postId) ||
            postId <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "Invalid post ID."

            });

        }


        query(
            `
                SELECT
                    user_id

                FROM posts

                WHERE id = ?

                LIMIT 1
            `,
            [
                postId
            ],
            (
                findErr,
                rows
            ) => {

                if (findErr) {

                    return res.status(500).json({

                        success:
                            false,

                        error:
                            findErr.message

                    });

                }


                if (
                    rows.length === 0
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "Post not found."

                    });

                }


                if (
                    Number(
                        rows[0].user_id
                    ) !==
                    Number(
                        req.user.id
                    )
                ) {

                    return res.status(403).json({

                        success:
                            false,

                        error:
                            "You can only delete your own posts."

                    });

                }


                query(
                    `
                        DELETE FROM post_likes
                        WHERE post_id = ?
                    `,
                    [
                        postId
                    ],
                    (
                        likeErr
                    ) => {

                        if (likeErr) {

                            return res.status(500).json({

                                success:
                                    false,

                                error:
                                    likeErr.message

                            });

                        }


                        query(
                            `
                                DELETE FROM post_shares
                                WHERE post_id = ?
                            `,
                            [
                                postId
                            ],
                            (
                                shareErr
                            ) => {

                                if (shareErr) {

                                    return res.status(500).json({

                                        success:
                                            false,

                                        error:
                                            shareErr.message

                                    });

                                }


                                query(
                                    `
                                        DELETE FROM comments
                                        WHERE post_id = ?
                                    `,
                                    [
                                        postId
                                    ],
                                    (
                                        commentErr
                                    ) => {

                                        if (commentErr) {

                                            return res.status(500).json({

                                                success:
                                                    false,

                                                error:
                                                    commentErr.message

                                            });

                                        }


                                        query(
                                            `
                                                DELETE FROM posts

                                                WHERE
                                                    id = ?

                                                    AND user_id = ?
                                            `,
                                            [
                                                postId,
                                                req.user.id
                                            ],
                                            (
                                                err,
                                                result
                                            ) => {

                                                if (err) {

                                                    return res.status(500).json({

                                                        success:
                                                            false,

                                                        error:
                                                            err.message

                                                    });

                                                }


                                                if (
                                                    result.affectedRows === 0
                                                ) {

                                                    return res.status(403).json({

                                                        success:
                                                            false,

                                                        error:
                                                            "You can only delete your own posts."

                                                    });

                                                }


                                                return res.json({

                                                    success:
                                                        true,

                                                    message:
                                                        "Post deleted successfully.",

                                                    id:
                                                        postId

                                                });

                                            }
                                        );

                                    }
                                );

                            }
                        );

                    }
                );

            }
        );

    }
);


// ======================================================

// ======================================================
// UNKNOWN ROUTE
// ======================================================

app.use(
    (req, res) => {

        console.error(
            "Route not found:",
            req.method,
            req.originalUrl
        );

        return res.status(404).json({

            success: false,

            error:
                `Route not found: ${req.method} ${req.originalUrl}`

        });

    }
);


// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use(
    (err, req, res, next) => {

        console.error(
            "Unhandled server error:",
            err
        );

        return res.status(500).json({

            success: false,

            error:
                "Internal server error."

        });

    }
);


// ======================================================
// START SERVER
// ======================================================

app.listen(
    PORT,
    () => {

        console.log(
            "========================================="
        );

        console.log(
            `Campus2Career server running on port ${PORT}`
        );

        console.log(
            "JWT authentication enabled"
        );

        console.log(
            "User profiles enabled"
        );

        console.log(
            "Company API enabled"
        );

        console.log(
            "Courses API enabled"
        );

        console.log(
            "Posts API enabled"
        );

        console.log(
            "Likes API enabled"
        );

        console.log(
            "Shares API enabled"
        );

        console.log(
            "Comments API enabled"
        );

        console.log(
            "========================================="
        );

    }
);

