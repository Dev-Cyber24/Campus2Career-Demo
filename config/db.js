


// =========================================
// CAMPUS2CAREER MYSQL DATABASE CONNECTION
// =========================================

const mysql =
    require("mysql2");

const dotenv =
    require("dotenv");


// Load .env

dotenv.config();


// =========================================
// MYSQL CONNECTION POOL
// =========================================

const pool =
    mysql.createPool({

        host:
            process.env.DB_HOST ||
            "localhost",

        user:
            process.env.DB_USER ||
            "root",

        password:
            process.env.DB_PASSWORD ||
            "",

        database:
            process.env.DB_NAME ||
            "campus2career",

        port:
            Number(
                process.env.DB_PORT
            ) || 3306,

        waitForConnections:
            true,

        connectionLimit:
            10,

        queueLimit:
            0

    });


// =========================================
// TEST DATABASE CONNECTION
// =========================================

pool.getConnection(
    (err, connection) => {

        if (err) {

            console.error(
                "MySQL Connection Failed:",
                err.message
            );

            return;

        }


        console.log(
            "Connected to MySQL Database"
        );


        connection.release();

    }
);


// =========================================
// EXPORT
// =========================================

module.exports =
    pool;

