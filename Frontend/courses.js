
// =========================================
// CAMPUS2CAREER COURSES JAVASCRIPT
// Fetches courses from Node.js + MySQL
// =========================================


// =========================================
// API
// =========================================

const COURSES_API =
    "http://localhost:5000/api/courses";


// =========================================
// GLOBAL COURSES
// =========================================

let allCourses = [];


// =========================================
// PAGE INITIALIZATION
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadCourses();

        setupFilters();

    }
);


// =========================================
// GET COURSES FROM BACKEND
// =========================================

async function loadCourses() {

    const courseGrid =
        document.getElementById(
            "courseGrid"
        );

    const courseCount =
        document.getElementById(
            "courseCount"
        );


    if (courseGrid) {

        courseGrid.innerHTML = `
            <div class="loading">
                Loading courses...
            </div>
        `;

    }


    try {

        console.log(
            "Fetching courses from:",
            COURSES_API
        );


        const response =
            await fetch(
                COURSES_API,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        // -----------------------------------------
        // Read response as text first
        // -----------------------------------------
        //
        // This makes errors such as:
        // <!DOCTYPE html> is not valid JSON
        // easier to diagnose.
        // -----------------------------------------

        const responseText =
            await response.text();


        console.log(
            "Courses API status:",
            response.status
        );


        console.log(
            "Courses API response:",
            responseText
        );


        let data = {};


        if (
            responseText &&
            responseText.trim() !== ""
        ) {

            try {

                data =
                    JSON.parse(
                        responseText
                    );

            } catch (error) {

                console.error(
                    "Invalid JSON received from courses API:",
                    responseText
                );


                throw new Error(
                    "The courses server returned HTML/text instead of JSON."
                );

            }

        }


        // -----------------------------------------
        // Handle HTTP errors
        // -----------------------------------------

        if (!response.ok) {

            throw new Error(

                data.error ||
                data.message ||
                `Server returned HTTP ${response.status}.`

            );

        }


        // -----------------------------------------
        // Accept either response format
        // -----------------------------------------
        //
        // Format 1:
        // [
        //    {...},
        //    {...}
        // ]
        //
        // Format 2:
        // {
        //    success: true,
        //    courses: [...]
        // }
        // -----------------------------------------

        if (
            Array.isArray(data)
        ) {

            allCourses =
                data;

        } else if (
            Array.isArray(
                data.courses
            )
        ) {

            allCourses =
                data.courses;

        } else {

            allCourses =
                [];

        }


        console.log(
            "Courses successfully loaded:",
            allCourses
        );


        // -----------------------------------------
        // Build filter options from database data
        // -----------------------------------------

        populateFieldFilter();

        populateLevelFilter();

        populateModeFilter();


        // -----------------------------------------
        // Display courses
        // -----------------------------------------

        applyFilters();


    } catch (error) {

        console.error(
            "COURSES LOAD ERROR:",
            error
        );


        if (courseGrid) {

            courseGrid.innerHTML = `

                <div class="no-results">

                    <h3>
                        Unable to load courses
                    </h3>

                    <p>
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                    <br>

                    <button
                        type="button"
                        onclick="loadCourses()"
                        class="reset-btn"
                    >
                        Try Again
                    </button>

                </div>

            `;

        }


        if (courseCount) {

            courseCount.textContent =
                "Unable to load courses.";

        }

    }

}


// =========================================
// FILTER SETUP
// =========================================

function setupFilters() {

    const courseSearch =
        document.getElementById(
            "courseSearch"
        );


    const fieldFilter =
        document.getElementById(
            "fieldFilter"
        );


    const levelFilter =
        document.getElementById(
            "levelFilter"
        );


    const modeFilter =
        document.getElementById(
            "modeFilter"
        );


    const resetFilters =
        document.getElementById(
            "resetFilters"
        );


    // -----------------------------------------
    // Search
    // -----------------------------------------

    if (courseSearch) {

        courseSearch.addEventListener(
            "input",
            applyFilters
        );

    }


    // -----------------------------------------
    // Field
    // -----------------------------------------

    if (fieldFilter) {

        fieldFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    // -----------------------------------------
    // Level
    // -----------------------------------------

    if (levelFilter) {

        levelFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    // -----------------------------------------
    // Mode
    // -----------------------------------------

    if (modeFilter) {

        modeFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    // -----------------------------------------
    // Reset
    // -----------------------------------------

    if (resetFilters) {

        resetFilters.addEventListener(
            "click",
            () => {

                if (courseSearch) {

                    courseSearch.value =
                        "";

                }


                if (fieldFilter) {

                    fieldFilter.value =
                        "";

                }


                if (levelFilter) {

                    levelFilter.value =
                        "";

                }


                if (modeFilter) {

                    modeFilter.value =
                        "";

                }


                applyFilters();

            }
        );

    }

}


// =========================================
// POPULATE FIELD FILTER
// =========================================

function populateFieldFilter() {

    const fieldFilter =
        document.getElementById(
            "fieldFilter"
        );


    if (!fieldFilter) {

        return;

    }


    const previousValue =
        fieldFilter.value;


    const fields =
        [
            ...new Set(

                allCourses

                    .map(
                        course =>
                            course.field
                    )

                    .filter(
                        field =>
                            field &&
                            String(
                                field
                            ).trim() !== ""
                    )

                    .map(
                        field =>
                            String(
                                field
                            ).trim()
                    )

            )
        ]
        .sort(
            (a, b) =>
                a.localeCompare(b)
        );


    fieldFilter.innerHTML = `

        <option value="">
            All Fields
        </option>

    `;


    fields.forEach(
        field => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                field;


            option.textContent =
                field;


            fieldFilter.appendChild(
                option
            );

        }
    );


    if (
        fields.includes(
            previousValue
        )
    ) {

        fieldFilter.value =
            previousValue;

    }

}


// =========================================
// POPULATE LEVEL FILTER
// =========================================

function populateLevelFilter() {

    const levelFilter =
        document.getElementById(
            "levelFilter"
        );


    if (!levelFilter) {

        return;

    }


    const previousValue =
        levelFilter.value;


    const levels =
        [
            ...new Set(

                allCourses

                    .map(
                        course =>
                            course.level
                    )

                    .filter(
                        level =>
                            level &&
                            String(
                                level
                            ).trim() !== ""
                    )

                    .map(
                        level =>
                            String(
                                level
                            ).trim()
                    )

            )
        ]
        .sort(
            (a, b) =>
                a.localeCompare(b)
        );


    levelFilter.innerHTML = `

        <option value="">
            All Levels
        </option>

    `;


    levels.forEach(
        level => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                level;


            option.textContent =
                level;


            levelFilter.appendChild(
                option
            );

        }
    );


    if (
        levels.includes(
            previousValue
        )
    ) {

        levelFilter.value =
            previousValue;

    }

}


// =========================================
// POPULATE MODE FILTER
// =========================================

function populateModeFilter() {

    const modeFilter =
        document.getElementById(
            "modeFilter"
        );


    if (!modeFilter) {

        return;

    }


    const previousValue =
        modeFilter.value;


    const modes =
        [
            ...new Set(

                allCourses

                    .map(
                        course =>
                            course.mode
                    )

                    .filter(
                        mode =>
                            mode &&
                            String(
                                mode
                            ).trim() !== ""
                    )

                    .map(
                        mode =>
                            String(
                                mode
                            ).trim()
                    )

            )
        ]
        .sort(
            (a, b) =>
                a.localeCompare(b)
        );


    modeFilter.innerHTML = `

        <option value="">
            All Modes
        </option>

    `;


    modes.forEach(
        mode => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                mode;


            option.textContent =
                mode;


            modeFilter.appendChild(
                option
            );

        }
    );


    if (
        modes.includes(
            previousValue
        )
    ) {

        modeFilter.value =
            previousValue;

    }

}


// =========================================
// APPLY FILTERS
// =========================================

function applyFilters() {

    const courseSearch =
        document.getElementById(
            "courseSearch"
        );


    const fieldFilter =
        document.getElementById(
            "fieldFilter"
        );


    const levelFilter =
        document.getElementById(
            "levelFilter"
        );


    const modeFilter =
        document.getElementById(
            "modeFilter"
        );


    const searchValue =
        courseSearch
            ? courseSearch.value
                .trim()
                .toLowerCase()
            : "";


    const selectedField =
        fieldFilter
            ? fieldFilter.value
            : "";


    const selectedLevel =
        levelFilter
            ? levelFilter.value
            : "";


    const selectedMode =
        modeFilter
            ? modeFilter.value
            : "";


    const filteredCourses =
        allCourses.filter(
            course => {

                const courseName =
                    String(
                        course.course_name ||
                        course.courseName ||
                        ""
                    )
                    .toLowerCase();


                const description =
                    String(
                        course.description ||
                        ""
                    )
                    .toLowerCase();


                const field =
                    String(
                        course.field ||
                        ""
                    );


                const level =
                    String(
                        course.level ||
                        ""
                    );


                const mode =
                    String(
                        course.mode ||
                        ""
                    );


                // Search matches course
                // name or description.

                const searchMatch =
                    !searchValue ||
                    courseName.includes(
                        searchValue
                    ) ||
                    description.includes(
                        searchValue
                    );


                // Field filter

                const fieldMatch =
                    !selectedField ||
                    field === selectedField;


                // Level filter

                const levelMatch =
                    !selectedLevel ||
                    level === selectedLevel;


                // Mode filter

                const modeMatch =
                    !selectedMode ||
                    mode === selectedMode;


                return (

                    searchMatch &&

                    fieldMatch &&

                    levelMatch &&

                    modeMatch

                );

            }
        );


    renderCourses(
        filteredCourses
    );

}


// =========================================
// RENDER COURSES
// =========================================

function renderCourses(
    courseData
) {

    const courseGrid =
        document.getElementById(
            "courseGrid"
        );


    const courseCount =
        document.getElementById(
            "courseCount"
        );


    if (!courseGrid) {

        return;

    }


    courseGrid.innerHTML =
        "";


    if (
        !courseData ||
        courseData.length === 0
    ) {

        courseGrid.innerHTML = `

            <div class="no-results">

                <h3>
                    No courses found
                </h3>

                <p>
                    Try changing your search
                    or filter options.
                </p>

            </div>

        `;


        if (courseCount) {

            courseCount.textContent =
                "0 courses found";

        }


        return;

    }


    if (courseCount) {

        courseCount.textContent =

            `${courseData.length} ${
                courseData.length === 1
                    ? "course"
                    : "courses"
            } found`;

    }


    courseData.forEach(
        course => {

            const card =
                createCourseCard(
                    course
                );


            courseGrid.appendChild(
                card
            );

        }
    );

}


// =========================================
// CREATE COURSE CARD
// =========================================

function createCourseCard(
    course
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "course-card";


    const courseId =
        course.id ||
        "";


    const courseName =
        course.course_name ||
        course.courseName ||
        "Untitled Course";


    const field =
        course.field ||
        "General";


    const description =
        course.description ||
        "No description available.";


    const institution =
        course.institution ||
        course.provider ||
        "Institution not specified";


    const level =
        course.level ||
        "Not specified";


    const mode =
        course.mode ||
        "Not specified";


    const duration =
        course.duration ||
        "Not specified";


    const courseUrl =
        course.course_url ||
        course.courseUrl ||
        course.url ||
        "";


    card.dataset.courseId =
        String(
            courseId
        );


    // -----------------------------------------
    // Course link
    // -----------------------------------------

    let buttonHTML =
        "";


    if (
        courseUrl &&
        courseUrl !== "#"
    ) {

        buttonHTML = `

            <a
                class="view-course-btn"
                href="${escapeHTML(courseUrl)}"
                target="_blank"
                rel="noopener noreferrer"
            >
                View Course
            </a>

        `;

    } else {

        buttonHTML = `

            <button
                type="button"
                class="view-course-btn"
                disabled
                style="opacity:0.6; cursor:not-allowed;"
            >
                Course Link Unavailable
            </button>

        `;

    }


    card.innerHTML = `

        <div class="course-top">

            <span class="course-field">

                ${escapeHTML(field)}

            </span>


            <h3>

                ${escapeHTML(courseName)}

            </h3>

        </div>


        <div class="course-body">

            <p class="course-description">

                ${escapeHTML(description)}

            </p>


            <div class="institution">

                ${escapeHTML(institution)}

            </div>


            <div class="course-details">

                <div class="detail">

                    <span>
                        Level
                    </span>

                    <strong>
                        ${escapeHTML(level)}
                    </strong>

                </div>


                <div class="detail">

                    <span>
                        Mode
                    </span>

                    <strong>
                        ${escapeHTML(mode)}
                    </strong>

                </div>


                <div class="detail">

                    <span>
                        Duration
                    </span>

                    <strong>
                        ${escapeHTML(duration)}
                    </strong>

                </div>


                <div class="detail">

                    <span>
                        Course ID
                    </span>

                    <strong>
                        ${escapeHTML(
                            String(
                                courseId || "-"
                            )
                        )}
                    </strong>

                </div>

            </div>


            ${buttonHTML}

        </div>

    `;


    return card;

}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}


// =========================================
// GLOBAL ACCESS
// =========================================

window.loadCourses =
    loadCourses;

window.applyCourseFilters =
    applyFilters;

