const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3001;

// ===============================
// MySQL Connection
// ===============================

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password:process.env.DB_PASSWORD,
    database: "waste_segregation"
});

// Test MySQL connection
db.connect((err) => {

    if (err) {
        console.log(
            "MySQL connection failed:",
            err.message
        );
    } else {
        console.log(
            "MySQL connected successfully! 🌱"
        );
    }

});


// ===============================
// REGISTER USER
// ===============================

app.post("/register", (req, res) => {

    const {
        name,
        email,
        password
    } = req.body;

    const sql = `
        INSERT INTO users
        (name, email, password)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [name, email, password],
        (err, result) => {

            if (err) {

                console.log(
                    "Registration error:",
                    err.message
                );

                return res.status(500).json({
                    message: "Registration failed"
                });
            }

            res.json({
                message:
                    "User registered successfully! 🌱"
            });

        }
    );

});


// ===============================
// LOGIN USER
// ===============================

app.post("/login", (req, res) => {

    const {
        email,
        password
    } = req.body;

    const sql = `
        SELECT *
        FROM users
        WHERE email = ?
        AND password = ?
    `;

    db.query(
        sql,
        [email, password],
        (err, results) => {

            if (err) {

                console.log(
                    "Login error:",
                    err.message
                );

                return res.status(500).json({
                    message: "Login failed"
                });
            }

            if (results.length === 0) {

                return res.status(401).json({
                    message:
                        "Invalid email or password"
                });
            }

            res.json({
                message: "Login successful! 🌱",
                user: results[0]
            });

        }
    );

});


// ===============================
// SUBMIT WASTE REPORT
// ===============================

app.post("/reports", (req, res) => {

    const {
        report_id,
        user_email,
        waste_type,
        problem_type,
        ward,
        description,
        latitude,
        longitude,
        report_date
    } = req.body;

    const sql = `
        INSERT INTO reports
        (
            report_id,
            user_email,
            waste_type,
            problem_type,
            ward,
            description,
            latitude,
            longitude,
            report_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            report_id,
            user_email,
            waste_type,
            problem_type,
            ward,
            description,
            latitude,
            longitude,
            report_date
        ],
        (err, result) => {

            if (err) {

                console.log(
                    "Report error:",
                    err.message
                );

                return res.status(500).json({
                    message:
                        "Report submission failed"
                });
            }

            res.json({
                message:
                    "Waste report submitted successfully! 🌱"
            });

        }
    );

});


// ===============================
// GET REPORTS
// ===============================

app.get("/reports", (req, res) => {

    const email = req.query.email;
    const ward = req.query.ward;

    let sql;
    let values = [];

    // User reports by email
    if (email) {

        sql = `
            SELECT *
            FROM reports
            WHERE user_email = ?
            ORDER BY id DESC
        `;

        values = [email];

    }

    // Reports by ward
    else if (ward) {

        sql = `
            SELECT *
            FROM reports
            WHERE ward = ?
            ORDER BY id DESC
        `;

        values = [ward];

    }

    // All reports
    else {

        sql = `
            SELECT *
            FROM reports
            ORDER BY id DESC
        `;

    }

    db.query(
        sql,
        values,
        (err, results) => {

            if (err) {

                console.log(
                    "Fetch reports error:",
                    err.message
                );

                return res.status(500).json({
                    message:
                        "Unable to fetch reports"
                });
            }

            res.json(results);

        }
    );

});


// ===============================
// UPDATE REPORT STATUS
// ===============================

app.put("/reports/:reportId/status", (req, res) => {

    const reportId = req.params.reportId;
    const { status } = req.body;

    const allowedStatuses = [
        "Pending",
        "Assigned",
        "In Progress",
        "Resolved",
        "Rejected"
    ];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            message: "Invalid status"
        });
    }

    // First get the report details
    const getReportSql = `
        SELECT user_email, status, points_awarded
        FROM reports
        WHERE report_id = ?
        LIMIT 1
    `;

    db.query(
        getReportSql,
        [reportId],
        (err, results) => {

            if (err) {
                console.log(
                    "Report lookup error:",
                    err.message
                );

                return res.status(500).json({
                    message: "Unable to find report"
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Report not found"
                });
            }

            const report = results[0];

            // Update report status
            const updateSql = `
                UPDATE reports
                SET status = ?
                WHERE report_id = ?
            `;

            db.query(
                updateSql,
                [status, reportId],
                (err, result) => {

                    if (err) {
                        console.log(
                            "Status update error:",
                            err.message
                        );

                        return res.status(500).json({
                            message:
                                "Unable to update status"
                        });
                    }

                    // Give 20 points only when report
                    // becomes Resolved for the first time
                    if (
                        status === "Resolved" &&
                        report.points_awarded === 0 &&
                        report.user_email
                    ) {

                        const addPointsSql = `
                            UPDATE users
                            SET points = points + 20
                            WHERE email = ?
                        `;

                        db.query(
                            addPointsSql,
                            [report.user_email],
                            (err) => {

                                if (err) {
                                    console.log(
                                        "Points update error:",
                                        err.message
                                    );

                                    return res.status(500).json({
                                        message:
                                            "Report resolved, but points could not be updated"
                                    });
                                }

                                const markPointsSql = `
                                    UPDATE reports
                                    SET points_awarded = 1
                                    WHERE report_id = ?
                                `;

                                db.query(
                                    markPointsSql,
                                    [reportId],
                                    (err) => {

                                        if (err) {
                                            console.log(
                                                "Points tracking error:",
                                                err.message
                                            );

                                            return res.status(500).json({
                                                message:
                                                    "Report resolved, but points tracking failed"
                                            });
                                        }

                                        res.json({
                                            message:
                                                "Report resolved and 20 points awarded! 🌱"
                                        });

                                    }
                                );

                            }
                        );

                    } else {

                        res.json({
                            message:
                                "Report status updated successfully! 🌱"
                        });

                    }

                }
            );

        }
    );

});

// ===============================
// HOME ROUTE
// ===============================

app.get("/", (req, res) => {

    res.send(
        "CleanCity Backend is Running! 🌱"
    );

});


// ===============================
// START SERVER
// ===============================
// ==========================================
// WASTE MANAGEMENT - COLLECTION ACTIVITIES
// ==========================================

// Get collection activities
app.get("/collection-activities", (req, res) => {

    const sql = `
        SELECT *
        FROM collection_activities
        ORDER BY id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.log(
                "Collection activities error:",
                err.message
            );

            return res.status(500).json({
                message:
                    "Unable to load collection activities"
            });
        }

        res.json(results);
    });
});


// Add a collection activity
app.post("/collection-activities", (req, res) => {

    const {
        vehicle_name,
        route,
        location,
        status,
        ward
    } = req.body;

    const sql = `
        INSERT INTO collection_activities
        (
            vehicle_name,
            route,
            location,
            status,
            ward
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            vehicle_name,
            route,
            location,
            status || "Collection Pending",
            ward
        ],
        (err, result) => {

            if (err) {

                console.log(
                    "Collection insert error:",
                    err.message
                );

                return res.status(500).json({
                    message:
                        "Unable to add collection activity"
                });
            }

            res.json({
                message:
                    "Collection activity added successfully! 🌱"
            });
        }
    );
});


// Update collection activity status
app.put(
    "/collection-activities/:id/status",
    (req, res) => {

        const id = req.params.id;
        const { status } = req.body;

        const allowedStatuses = [
            "Collection Pending",
            "On Route",
            "Completed"
        ];

        if (!allowedStatuses.includes(status)) {

            return res.status(400).json({
                message:
                    "Invalid collection status"
            });
        }

        const sql = `
            UPDATE collection_activities
            SET status = ?
            WHERE id = ?
        `;

        db.query(
            sql,
            [status, id],
            (err, result) => {

                if (err) {

                    console.log(
                        "Collection status error:",
                        err.message
                    );

                    return res.status(500).json({
                        message:
                            "Unable to update collection status"
                    });
                }

                if (result.affectedRows === 0) {

                    return res.status(404).json({
                        message:
                            "Collection activity not found"
                    });
                }

                res.json({
                    message:
                        "Collection status updated successfully! 🌱"
                });
            }
        );
    }
);
// =====================================================
// NEARBY WASTE SERVICES
// =====================================================
app.get("/nearby-services", (req, res) => {

    const { location } = req.query;

    if (!location || location.trim() === "") {

        return res.status(400).json({
            message: "Location is required"
        });

    }

    const searchLocation = `%${location.trim()}%`;

    const sql = `
        SELECT
            id,
            name,
            service_type,
            location,
            latitude,
            longitude,
            status
        FROM waste_services
        WHERE LOWER(location) LIKE LOWER(?)
        AND LOWER(status) = 'available'
        ORDER BY name ASC
    `;

    db.query(
        sql,
        [searchLocation],
        (err, results) => {

            if (err) {

                console.error(
                    "Nearby services database error:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Failed to load nearby services"
                });

            }

            res.json(results);

        }
    );

});
// GET VERIFIED DUSTBINS BY CITY
app.get("/dustbins", (req, res) => {

    const city = req.query.city;

    if (!city || city.trim() === "") {
        return res.status(400).json({
            message: "City is required"
        });
    }

    const sql = `
        SELECT
            id,
            name,
            location,
            status,
            latitude,
            longitude,
            updated_at
        FROM dustbins
        WHERE LOWER(location) LIKE LOWER(?)
        ORDER BY name ASC
    `;

    const searchCity = `%${city.trim()}%`;

    db.query(sql, [searchCity], (err, results) => {

        if (err) {
            console.error("Dustbin database error:", err);

            return res.status(500).json({
                message: "Failed to load dustbins"
            });
        }

        res.json(results);
    });
});
// Learn page search
app.post("/learn-search", (req, res) => {

    const question = (req.body.question || "").toLowerCase();

    let answer = "";

    if (
        question.includes("wet waste") ||
        question.includes("biodegradable")
    ) {
        answer =
            "Wet or biodegradable waste includes food scraps, vegetable peels, fruit waste and leaves. It can usually be composted.";
    }

    else if (
        question.includes("dry waste") ||
        question.includes("non biodegradable")
    ) {
        answer =
            "Dry waste includes materials such as paper, plastic, glass and metals. These should be kept separate and sent for recycling where possible.";
    }

    else if (question.includes("plastic")) {
        answer =
            "Plastic waste should be reduced, reused and recycled whenever possible. Avoid throwing plastic into wet waste.";
    }

    else if (
        question.includes("e-waste") ||
        question.includes("electronic waste")
    ) {
        answer =
            "E-waste includes old phones, computers, batteries and electronic devices. It should be given to an authorised e-waste collection or recycling facility.";
    }

    else if (question.includes("hazardous")) {
        answer =
            "Hazardous waste can include chemicals, paints and certain medical materials. It should be handled separately and disposed of through appropriate collection systems.";
    }

    else if (
        question.includes("segregat") ||
        question.includes("separate waste")
    ) {
        answer =
            "Waste segregation means separating different types of waste at the place where it is generated. This makes recycling, composting and safe disposal easier.";
    }

    else if (
        question.includes("recycle") ||
        question.includes("recycling")
    ) {
        answer =
            "Recycling converts suitable waste materials such as paper, plastic, glass and metals into materials that can be used again.";
    }

    else if (
        question.includes("compost") ||
        question.includes("composting")
    ) {
        answer =
            "Composting is the natural decomposition of biodegradable waste such as food scraps and leaves to produce compost that can be used for plants and soil.";
    }

    else if (
        question.includes("reduce waste") ||
        question.includes("reduce waste")
    ) {
        answer =
            "You can reduce waste by avoiding unnecessary products, using reusable items, repairing things when possible and choosing products with less packaging.";
    }

    else {
        answer =
            "Please try asking about wet waste, dry waste, plastic, e-waste, hazardous waste, segregation, recycling, composting or reducing waste.";
    }

    res.json({
        answer: answer
    });
});
app.get("/dustbins", (req, res) => {

    const sql = `
        SELECT
            id,
            name,
            location,
            latitude,
            longitude,
            status,
            updated_at
        FROM dustbins
        ORDER BY updated_at DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error("Dustbin database error:", err);

            return res.status(500).json({
                message: "Failed to load dustbin information"
            });
        }

        res.json(results);
    });
});
// GET WASTE COLLECTION CENTRES BY CITY
app.get("/collection-centres", (req, res) => {

    const { name, location, waste } = req.query;

    let sql = `
        SELECT
            id,
            name,
            location,
            address,
            phone,
            email,
            opening_time,
            closing_time,
            waste_types,
            latitude,
            longitude,
            status
        FROM waste_collection_centres
        WHERE 1 = 1
    `;

    const values = [];

    // Center name OR location
    if (name && location) {

        sql += `
            AND (
                LOWER(name) LIKE LOWER(?)
                OR LOWER(location) LIKE LOWER(?)
            )
        `;

        values.push(`%${name}%`);
        values.push(`%${location}%`);

    } else if (name) {

        sql += ` AND LOWER(name) LIKE LOWER(?)`;
        values.push(`%${name}%`);

    } else if (location) {

        sql += ` AND LOWER(location) LIKE LOWER(?)`;
        values.push(`%${location}%`);
    }

    // Waste type filter
    if (waste) {

        sql += `
            AND LOWER(waste_types) LIKE LOWER(?)
        `;

        values.push(`%${waste}%`);
    }

    sql += ` ORDER BY name ASC`;

    db.query(sql, values, (err, results) => {

        if (err) {

            console.error(
                "Collection centre database error:",
                err
            );

            return res.status(500).json({
                message: "Failed to load collection centres"
            });
        }

        res.json(results);
    });
});
app.get("/collection-vehicles", (req, res) => {

    const location = req.query.location;

    if (!location || location.trim() === "") {
        return res.status(400).json({
            message: "Location is required"
        });
    }

    const searchLocation = `%${location.trim()}%`;

    const sql = `
        SELECT
            id,
            vehicle_name,
            vehicle_number,
            route,
            location,
            status,
            ward,
            latitude,
            longitude,
            collection_time
        FROM collection_activities
        WHERE LOWER(location) LIKE LOWER(?)
           OR LOWER(route) LIKE LOWER(?)
           OR LOWER(ward) LIKE LOWER(?)
        ORDER BY id DESC
    `;

    db.query(
        sql,
        [searchLocation, searchLocation, searchLocation],
        (err, results) => {

            if (err) {
                console.error(
                    "Collection vehicle database error:",
                    err
                );

                return res.status(500).json({
                    message: "Failed to load collection vehicles"
                });
            }

            res.json(results);
        }
    );
});
// ==========================================
// ADD COLLECTION VEHICLE
// ==========================================

app.post("/collection-vehicles", (req, res) => {

    const {
        vehicle_name,
        vehicle_number,
        route,
        location,
        status,
        ward,
        latitude,
        longitude,
        collection_time
    } = req.body;

    if (
        !vehicle_name ||
        !vehicle_number ||
        !route ||
        !location ||
        !status ||
        !ward ||
        !collection_time
    ) {
        return res.status(400).json({
            message: "Please fill all required fields"
        });
    }

    const sql = `
        INSERT INTO collection_activities
        (
            vehicle_name,
            vehicle_number,
            route,
            location,
            status,
            ward,
            latitude,
            longitude,
            collection_time
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            vehicle_name,
            vehicle_number,
            route,
            location,
            status,
            ward,
            latitude || null,
            longitude || null,
            collection_time
        ],
        (err, result) => {

            if (err) {
                console.error("Vehicle insert error:", err);

                return res.status(500).json({
                    message: "Failed to add vehicle"
                });
            }

            res.json({
                message: "Vehicle added successfully",
                id: result.insertId
            });
        }
    );
});


// ==========================================
// GET COLLECTION VEHICLES
// ==========================================

app.get("/collection-vehicles", (req, res) => {

    const location = req.query.location;

    if (!location || location.trim() === "") {
        return res.status(400).json({
            message: "Location is required"
        });
    }

    const searchLocation = `%${location.trim()}%`;

    const sql = `
        SELECT
            id,
            vehicle_name,
            vehicle_number,
            route,
            location,
            status,
            ward,
            latitude,
            longitude,
            collection_time
        FROM collection_activities
        WHERE LOWER(location) LIKE LOWER(?)
           OR LOWER(route) LIKE LOWER(?)
           OR LOWER(ward) LIKE LOWER(?)
        ORDER BY id DESC
    `;

    db.query(
        sql,
        [
            searchLocation,
            searchLocation,
            searchLocation
        ],
        (err, results) => {

            if (err) {
                console.error("Vehicle database error:", err);

                return res.status(500).json({
                    message: "Failed to load vehicles"
                });
            }

            res.json(results);
        }
    );
});
// ==========================================
// GET ALL COLLECTION VEHICLES
// ==========================================

app.get("/all-collection-vehicles", (req, res) => {

    const sql = `
        SELECT
            id,
            vehicle_name,
            vehicle_number,
            route,
            location,
            status,
            ward,
            latitude,
            longitude,
            collection_time
        FROM collection_activities
        ORDER BY id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.error("Vehicle database error:", err);

            return res.status(500).json({
                message: "Failed to load vehicles"
            });
        }

        res.json(results);

    });

});
// GET CLEANLINESS POINTS FOR A USER

app.get("/users/points", (req, res) => {

    const email = req.query.email;

    if (!email || email.trim() === "") {
        return res.status(400).json({
            message: "Email is required"
        });
    }

    const sql = `
        SELECT points
        FROM users
        WHERE email = ?
        LIMIT 1
    `;

    db.query(sql, [email.trim()], (err, results) => {

        if (err) {
            console.error("Points database error:", err);

            return res.status(500).json({
                message: "Failed to load points"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            points: results[0].points
        });

    });

});
// GET NOTIFICATIONS FOR A USER

app.get("/notifications", (req, res) => {

    const email = req.query.email;

    if (!email || email.trim() === "") {
        return res.status(400).json({
            message: "Email is required"
        });
    }

    const sql = `
        SELECT
            report_id,
            waste_type,
            problem_type,
            status,
            report_date
        FROM reports
        WHERE user_email = ?
        ORDER BY report_date DESC
    `;

    db.query(
        sql,
        [email.trim()],
        (err, results) => {

            if (err) {
                console.error(
                    "Notification database error:",
                    err.message
                );

                return res.status(500).json({
                    message: "Failed to load notifications"
                });
            }

            res.json(results);

        }
    );

});
app.get("/collection-schedule", (req, res) => {

    const ward = req.query.ward;

    if (!ward || ward.trim() === "") {
        return res.status(400).json({
            message: "Ward is required"
        });
    }

    const sql = `
        SELECT
            vehicle_name,
            vehicle_number,
            route,
            location,
            status,
            ward,
            collection_time
        FROM collection_activities
        WHERE LOWER(ward) = LOWER(?)
          AND collection_time IS NOT NULL
          AND TRIM(collection_time) <> ''
        ORDER BY id DESC
        LIMIT 1
    `;

    db.query(
        sql,
        [ward.trim()],
        (err, results) => {

            if (err) {
                console.error(
                    "Collection schedule error:",
                    err.message
                );

                return res.status(500).json({
                    message:
                        "Failed to load collection schedule"
                });
            }

            if (results.length === 0) {
                return res.json({
                    available: false
                });
            }

            res.json({
                available: true,
                schedule: results[0]
            });

        }
    );

});
app.post("/authority-login", (req, res) => {

    const {
        authority_type,
        username,
        password
    } = req.body;

    if (!authority_type || !username || !password) {
        return res.status(400).json({
            message: "Please enter all login details"
        });
    }

    const sql = `
        SELECT
            id,
            authority_type,
            username
        FROM authority_users
        WHERE authority_type = ?
          AND username = ?
          AND password = ?
        LIMIT 1
    `;

    db.query(
        sql,
        [
            authority_type,
            username.trim(),
            password
        ],
        (err, results) => {

            if (err) {
                console.error(
                    "Authority login error:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Authority login failed"
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    message:
                        "Invalid authority login details"
                });
            }

            res.json({
                message:
                    "Authority login successful",
                authority: results[0]
            });

        }
    );

});
app.get("/all-reports", (req, res) => {

    const sql = `
        SELECT
            id,
            report_id,
            user_email,
            waste_type,
            problem_type,
            description,
            latitude,
            longitude,
            report_date,
            status,
            ward
        FROM reports
        ORDER BY report_date DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error("All reports error:", err);

            return res.status(500).json({
                message: "Failed to load reports"
            });
        }

        res.json(results);
    });

});
app.listen(PORT, () => {

    console.log(
        `CleanCity backend running at http://localhost:${PORT}`
    );

});