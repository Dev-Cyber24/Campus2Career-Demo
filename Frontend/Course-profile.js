
// =========================================
// CAMPUS2CAREER COURSE FORM JAVASCRIPT
// =========================================


// =========================================
// API
// =========================================

const COURSES_API =
    "http://localhost:5000/api/courses";


// =========================================
// ELEMENTS
// =========================================

const courseForm =
    document.getElementById(
        "courseForm"
    );

const saveCourseBtn =
    document.getElementById(
        "saveCourseBtn"
    );

const message =
    document.getElementById(
        "message"
    );


// =========================================
// FORM FIELDS
// =========================================

const courseName =
    document.getElementById(
        "courseName"
    );

const field =
    document.getElementById(
        "field"
    );

const institution =
    document.getElementById(
        "institution"
    );

const description =
    document.getElementById(
        "description"
    );

const level =
    document.getElementById(
        "level"
    );

const mode =
    document.getElementById(
        "mode"
    );

const duration =
    document.getElementById(
        "duration"
    );

const courseUrl =
    document.getElementById(
        "courseUrl"
    );


// =========================================
// PREVIEW ELEMENTS
// =========================================

const previewName =
    document.getElementById(
        "previewName"
    );

const previewField =
    document.getElementById(
        "previewField"
    );

const previewDescription =
    document.getElementById(
        "previewDescription"
    );

const previewInstitution =
    document.getElementById(
        "previewInstitution"
    );

const previewLevel =
    document.getElementById(
        "previewLevel"
    );

const previewMode =
    document.getElementById(
        "previewMode"
    );

const previewDuration =
    document.getElementById(
        "previewDuration"
    );

const previewLink =
    document.getElementById(
        "previewLink"
    );


// =========================================
// SHOW MESSAGE
// =========================================

function showMessage(
    text,
    color
) {

    if (!message) {
        return;
    }


    message.textContent =
        text;


    message.style.color =
        color;

}


// =========================================
// UPDATE LIVE PREVIEW
// =========================================

function updatePreview() {

    if (previewName) {

        previewName.textContent =
            courseName.value.trim() ||
            "Course Name";

    }


    if (previewField) {

        previewField.textContent =
            field.value.trim() ||
            "Course Field";

    }


    if (previewDescription) {

        previewDescription.textContent =
            description.value.trim() ||
            "Course description will appear here.";

    }


    if (previewInstitution) {

        previewInstitution.textContent =
            institution.value.trim() ||
            "Institution not specified";

    }


    if (previewLevel) {

        previewLevel.textContent =
            level.value ||
            "Not specified";

    }


    if (previewMode) {

        previewMode.textContent =
            mode.value ||
            "Not specified";

    }


    if (previewDuration) {

        previewDuration.textContent =
            duration.value.trim() ||
            "Not specified";

    }


    // =====================================
    // COURSE LINK
    // =====================================

    if (previewLink) {

        const url =
            courseUrl.value.trim();


        if (url !== "") {

            previewLink.href =
                url;

            previewLink.style.display =
                "block";

        } else {

            previewLink.removeAttribute(
                "href"
            );

            previewLink.style.display =
                "none";

        }

    }

}


// =========================================
// GET COURSE DATA
// =========================================

function getCourseData() {

    return {

        course_name:
            courseName.value.trim(),

        field:
            field.value.trim(),

        description:
            description.value.trim(),

        institution:
            institution.value.trim(),

        level:
            level.value,

        mode:
            mode.value,

        duration:
            duration.value.trim(),

        course_url:
            courseUrl.value.trim()

    };

}


// =========================================
// VALIDATE COURSE
// =========================================

function validateCourse(
    data
) {

    if (!data.course_name) {

        showMessage(
            "Course name is required.",
            "red"
        );

        courseName.focus();

        return false;

    }


    if (!data.field) {

        showMessage(
            "Course field is required.",
            "red"
        );

        field.focus();

        return false;

    }


    if (data.course_url) {

        try {

            new URL(
                data.course_url
            );

        } catch {

            showMessage(
                "Please enter a valid course URL.",
                "red"
            );

            courseUrl.focus();

            return false;

        }

    }


    return true;

}


// =========================================
// SAVE COURSE
// =========================================

async function saveCourse() {

    const data =
        getCourseData();


    console.log(
        "Course data:",
        data
    );


    // =====================================
    // VALIDATION
    // =====================================

    if (
        !validateCourse(
            data
        )
    ) {

        return;

    }


    // =====================================
    // DISABLE BUTTON
    // =====================================

    if (saveCourseBtn) {

        saveCourseBtn.disabled =
            true;

        saveCourseBtn.textContent =
            "Saving Course...";

    }


    showMessage(
        "Saving course...",
        "#0a66c2"
    );


    try {

        // =================================
        // SEND TO NODE.JS
        // =================================

        const response =
            await fetch(
                COURSES_API,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            data
                        )

                }
            );


        // =================================
        // READ RESPONSE
        // =================================

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


        let result =
            {};


        if (
            responseText &&
            responseText.trim() !== ""
        ) {

            try {

                result =
                    JSON.parse(
                        responseText
                    );

            } catch {

                throw new Error(
                    "The server returned HTML/text instead of JSON."
                );

            }

        }


        // =================================
        // SERVER ERROR
        // =================================

        if (!response.ok) {

            throw new Error(

                result.error ||

                `Server returned HTTP ${response.status}.`

            );

        }


        // =================================
        // SUCCESS
        // =================================

        console.log(
            "Course saved successfully:",
            result
        );


        showMessage(
            "✅ Course saved successfully!",
            "green"
        );


        // ---------------------------------
        // Save ID locally
        // ---------------------------------

        if (
            result.id
        ) {

            localStorage.setItem(
                "lastCourseId",
                String(
                    result.id
                )
            );

        }


        // ---------------------------------
        // Reset form
        // ---------------------------------

        courseForm.reset();


        updatePreview();


    } catch (error) {

        console.error(
            "SAVE COURSE ERROR:",
            error
        );


        showMessage(
            "❌ " + error.message,
            "red"
        );


    } finally {

        if (saveCourseBtn) {

            saveCourseBtn.disabled =
                false;

            saveCourseBtn.textContent =
                "Save Course";

        }

    }

}


// =========================================
// FORM SUBMISSION
// =========================================

if (courseForm) {

    courseForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            saveCourse();

        }
    );

}


// =========================================
// LIVE PREVIEW LISTENERS
// =========================================

const previewFields = [

    courseName,

    field,

    institution,

    description,

    level,

    mode,

    duration,

    courseUrl

];


previewFields.forEach(
    element => {

        if (element) {

            element.addEventListener(
                "input",
                updatePreview
            );


            element.addEventListener(
                "change",
                updatePreview
            );

        }

    }
);


// =========================================
// INITIAL PREVIEW
// =========================================

updatePreview();


// =========================================
// GLOBAL ACCESS
// =========================================

window.saveCourse =
    saveCourse;

window.updateCoursePreview =
    updatePreview;

