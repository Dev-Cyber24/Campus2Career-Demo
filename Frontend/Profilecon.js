
// =========================================
// CAMPUS2CAREER USER PROFILE JAVASCRIPT
// JWT AUTHENTICATED + PUBLIC VIEW MODE
// BACKEND CONTROLLED CONNECTIONS / RATING / GRADE
// =========================================


// =========================================
// API
// =========================================

const API_BASE_URL = "http://localhost:5000/api";

const MY_PROFILE_API =
    `${API_BASE_URL}/my-profile`;

const PUBLIC_PROFILE_API =
    `${API_BASE_URL}/user-profile`;


// =========================================
// JWT STORAGE KEY
// =========================================

const TOKEN_KEY = "authToken";
const USER_ID_KEY = "userId";


// =========================================
// EDIT MODE
// =========================================

let editMode = false;


// =========================================
// PROFILE MODE
// =========================================
//
// profile.html
//      -> own profile
//
// profile.html?viewUserId=8
//      -> public profile of user 8
//
// =========================================

const urlParams =
    new URLSearchParams(window.location.search);

const viewedUserIdParam =
    urlParams.get("viewUserId");


// =========================================
// LOGGED-IN USER ID
// =========================================

const loggedInUserId =
    Number(
        localStorage.getItem(USER_ID_KEY)
    );


// =========================================
// DETERMINE DISPLAYED PROFILE
// =========================================

let userId = null;
let isOwnProfile = true;


// -----------------------------------------
// OTHER USER PROFILE
// -----------------------------------------

if (
    viewedUserIdParam &&
    Number.isInteger(Number(viewedUserIdParam)) &&
    Number(viewedUserIdParam) > 0
) {
    userId = Number(viewedUserIdParam);

    isOwnProfile =
        Number.isInteger(loggedInUserId) &&
        loggedInUserId > 0 &&
        userId === loggedInUserId;
} else {

    // -------------------------------------
    // OWN PROFILE
    // -------------------------------------

    if (
        Number.isInteger(loggedInUserId) &&
        loggedInUserId > 0
    ) {
        userId = loggedInUserId;
    }

    isOwnProfile = true;
}


// =========================================
// LOGGING
// =========================================

console.log(
    "Logged-in user ID:",
    loggedInUserId
);

console.log(
    "Requested profile ID:",
    viewedUserIdParam
);

console.log(
    "Displayed profile ID:",
    userId
);

console.log(
    "Own profile:",
    isOwnProfile
);


// =========================================
// FIELD CONFIGURATION
// =========================================
//
// IMPORTANT:
// connections, rating and grade are intentionally
// NOT included in the editable fields.
//
// They are read from the backend only.
//
// Required HTML IDs:
//
// view-connections
// view-rating
// view-grade
//
// =========================================

const fields = [

    {
        view: "view-name",
        edit: "edit-name",
        key: "name"
    },

    {
        view: "view-headline",
        edit: "edit-headline",
        key: "headline"
    },

    {
        view: "view-tagline",
        edit: "edit-tagline",
        key: "tagline"
    },

    {
        view: "view-location",
        edit: "edit-location",
        key: "location"
    },

    {
        view: "view-about",
        edit: "edit-about",
        key: "about"
    },

    {
        view: "view-email",
        edit: "edit-email",
        key: "email"
    },

    {
        view: "view-phone",
        edit: "edit-phone",
        key: "phone"
    },

    {
        view: "view-github",
        edit: "edit-github",
        key: "github"
    },

    {
        view: "view-linkedin",
        edit: "edit-linkedin",
        key: "linkedin"
    },

    {
        view: "view-education",
        edit: "edit-education",
        key: "education"
    },

    {
        view: "view-experience",
        edit: "edit-experience",
        key: "experience"
    },

    {
        view: "view-projects",
        edit: "edit-projects",
        key: "projects"
    },

    {
        view: "view-skills",
        edit: "edit-skills",
        key: "skills"
    },

    {
        view: "view-certifications",
        edit: "edit-certifications",
        key: "certifications"
    },

    {
        view: "view-achievements",
        edit: "edit-achievements",
        key: "achievements"
    }
];


// =========================================
// BACKEND CONTROLLED PROFILE FIELDS
// =========================================
//
// These fields can NEVER be edited from the
// profile page.
//
// Backend remains the source of truth.
//
// =========================================

const backendControlledFields = {
    connections: [
        "connections",
        "connection_count",
        "connectionCount"
    ],

    rating: [
        "test_rating",
        "testRating",
        "rating",
        "overall_rating",
        "overallRating"
    ],

    grade: [
        "grade",
        "test_grade",
        "testGrade",
        "overall_grade",
        "overallGrade"
    ],

    score: [
        "test_score",
        "testScore",
        "readiness_score",
        "readinessScore",
        "percentage"
    ]
};


// =========================================
// GET FIRST AVAILABLE VALUE
// =========================================

function getFirstAvailableValue(
    object,
    possibleKeys
) {
    if (!object || typeof object !== "object") {
        return null;
    }

    for (const key of possibleKeys) {

        if (
            Object.prototype.hasOwnProperty.call(
                object,
                key
            )
        ) {
            const value = object[key];

            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {
                return value;
            }
        }
    }

    return null;
}


// =========================================
// FORMAT CONNECTION COUNT
// =========================================

function formatConnections(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "0";
    }

    const numericValue =
        Number(value);

    if (
        Number.isFinite(numericValue)
    ) {
        return numericValue.toLocaleString();
    }

    return String(value);
}


// =========================================
// FORMAT TEST RATING
// =========================================

function formatRating(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "Not Rated";
    }

    const numericValue =
        Number(value);

    if (
        Number.isFinite(numericValue)
    ) {

        return numericValue
            .toFixed(
                Number.isInteger(numericValue)
                    ? 0
                    : 1
            );
    }

    return String(value);
}


// =========================================
// FORMAT GRADE
// =========================================

function formatGrade(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "Not Available";
    }

    return String(value);
}


function getBackendValue(profile, possibleKeys) {
    if (!profile || !Array.isArray(possibleKeys)) {
        return undefined;
    }

    for (const key of possibleKeys) {
        if (
            Object.prototype.hasOwnProperty.call(profile, key) &&
            profile[key] !== undefined &&
            profile[key] !== null &&
            profile[key] !== ""
        ) {
            return profile[key];
        }
    }

    return undefined;
}

// =========================================
// UPDATE BACKEND CONTROLLED STATS
// =========================================

function updateBackendControlledStats(profile) {
    if (!profile) return;

    // -----------------------------
    // CONNECTIONS
    // -----------------------------
    const connectionsValue = getBackendValue(
        profile,
        backendControlledFields.connections
    );

    if (connectionsValue !== undefined && connectionsValue !== null) {
        const connectionElements = [
            document.getElementById("view-connections"),
            document.getElementById("connections-count")
        ];

        connectionElements.forEach(element => {
            if (element) {
               element.textContent =
                formatConnections(connectionsValue);
            }
        });
    }

    // -----------------------------
    // INDUSTRY READINESS SCORE
    // -----------------------------
    const scoreValue = getBackendValue(
        profile,
        backendControlledFields.score
    );

    const scoreElement = document.getElementById("view-test-score");

    if (scoreElement) {
        if (
            scoreValue !== undefined &&
            scoreValue !== null &&
            scoreValue !== ""
        ) {
            const score = Number(scoreValue);

            if (Number.isFinite(score)) {
                scoreElement.textContent =
                    `${Number(score.toFixed(2))}%`;
            } else {
                scoreElement.textContent = "Not tested";
            }
        } else {
            scoreElement.textContent = "Not tested";
        }
    }

    // -----------------------------
    // GRADE
    // -----------------------------
    const gradeValue = getBackendValue(
        profile,
        backendControlledFields.grade
    );

    const gradeElement = document.getElementById("view-grade");

    if (gradeElement) {
        gradeElement.textContent =
            gradeValue !== undefined &&
            gradeValue !== null &&
            gradeValue !== ""
                ? String(gradeValue)
                : "Not tested";
    }

    // -----------------------------
    // RATING
    // -----------------------------
    const ratingValue = getBackendValue(
        profile,
        backendControlledFields.rating
    );

    const ratingElement = document.getElementById("view-rating");

    if (ratingElement) {
        const rating = Number(ratingValue);

        if (
            ratingValue !== undefined &&
            ratingValue !== null &&
            ratingValue !== "" &&
            Number.isFinite(rating)
        ) {
            ratingElement.textContent =
                `${rating.toFixed(1)} / 5`;
        } else {
            ratingElement.textContent = "Not tested";
        }
    }
}

// =========================================
// AUTHENTICATED FETCH
// =========================================

async function authenticatedFetch(
    url,
    options = {}
) {

    const token =
        getAuthToken();

    if (!token) {

        throw new Error(
            "You are not logged in."
        );
    }

    const headers = {
        ...(options.headers || {}),

        "Accept":
            "application/json",

        "Authorization":
            `Bearer ${token}`
    };

    return fetch(
        url,
        {
            ...options,
            headers
        }
    );
}


// =========================================
// HANDLE AUTH ERROR
// =========================================

function handleAuthenticationError(
    status
) {

    if (
        status === 401 ||
        status === 403
    ) {

        localStorage.removeItem(
            TOKEN_KEY
        );

        localStorage.removeItem(
            USER_ID_KEY
        );

        alert(
            "Your login session has expired. Please log in again."
        );

        window.location.href =
            "login.html";

        return true;
    }

    return false;
}


// =========================================
// UPDATE PROFILE PREVIEW
// =========================================

function updateProfile() {

    fields.forEach(
        field => {

            const view =
                document.getElementById(
                    field.view
                );

            const edit =
                document.getElementById(
                    field.edit
                );

            if (
                !view ||
                !edit
            ) {
                return;
            }

            const value =
                edit.value.trim();

            if (value !== "") {

                view.textContent =
                    value;
            }
        }
    );


    // -------------------------------------
    // Always restore backend values
    // -------------------------------------

    if (currentProfile) {

        updateBackendControlledStats(
            currentProfile
        );
    }


    updateProfileCompletion();
}


// =========================================
// LOAD INDUSTRY READINESS SCORE
// =========================================

async function loadIndustryReadinessScore() {

    const scoreElement =
        document.getElementById("view-industry-readiness");

    const percentageElement =
        document.getElementById("view-industry-percentage");

    const progressElement =
        document.getElementById("industry-readiness-progress");

    if (!scoreElement) {
        console.warn(
            "view-industry-readiness element not found."
        );

        return;
    }

    try {

        const response =
            await authenticatedFetch(
                `${API_BASE_URL}/industry-readiness/latest`,
                {
                    method: "GET"
                }
            );

        // Authentication error
        if (
            handleAuthenticationError(
                response.status
            )
        ) {
            return;
        }

        const result =
            await readResponse(response);

        if (!response.ok) {

            throw new Error(
                result.message ||
                `Server returned HTTP ${response.status}`
            );
        }

        // -----------------------------------------
        // NO TEST TAKEN
        // -----------------------------------------

        if (!result.hasScore) {

            scoreElement.textContent =
                "Not Tested";

            if (percentageElement) {
                percentageElement.textContent =
                    "No assessment completed";
            }

            if (progressElement) {
                progressElement.style.width =
                    "0%";
            }

            return;
        }

        // -----------------------------------------
        // SCORE
        // -----------------------------------------

        const score =
            Number(result.score);

        const total =
            Number(result.totalQuestions);

        const percentage =
            Number(result.percentage);

        scoreElement.textContent =
            `${score}/${total}`;

        if (percentageElement) {

            percentageElement.textContent =
                `${percentage.toFixed(0)}%`;
        }

        if (progressElement) {

            progressElement.style.width =
                `${percentage}%`;
        }

        console.log(
            "Industry Readiness:",
            {
                score,
                total,
                percentage
            }
        );

    } catch (error) {

        console.error(
            "INDUSTRY READINESS ERROR:",
            error
        );

        scoreElement.textContent =
            "Unavailable";
    }
}


// =========================================
// CONFIGURE PROFILE ACCESS
// =========================================

function configureProfileAccess() {

    const editButton =
        document.getElementById(
            "toggleEditBtn"
        );

    const saveButton =
        document.getElementById(
            "saveBtn"
        );

    const editInputs =
        document.querySelectorAll(
            ".edit-input"
        );


    // =====================================
    // OTHER PERSON
    // =====================================

    if (!isOwnProfile) {

        editMode = false;


        // Hide edit button

        if (editButton) {

            editButton.style.display =
                "none";
        }


        // Hide save button

        if (saveButton) {

            saveButton.style.display =
                "none";
        }


        // Hide all regular editable inputs

        editInputs.forEach(
            input => {

                input.style.display =
                    "none";

                input.disabled = true;
            }
        );


        // Hide all upload inputs

        document
            .querySelectorAll(
                "#profilePicInput, #bannerUpload, .achievement-upload"
            )
            .forEach(
                input => {

                    input.style.display =
                        "none";

                    input.disabled =
                        true;
                }
            );


        // Hide upload section completely

        const uploadSection =
            document.getElementById(
                "profileUploadControls"
            );

        if (uploadSection) {

            uploadSection.classList.remove(
                "show-profile-uploads"
            );

            uploadSection.style.display =
                "none";
        }


        console.log(
            "Profile is in VIEW-ONLY mode."
        );

        return;
    }


    // =====================================
    // OWN PROFILE
    // =====================================

    if (editButton) {

        editButton.style.display =
            "block";
    }


    editInputs.forEach(
        input => {

            // Do not allow backend controlled fields
            // to become editable.

            if (
                input.id === "edit-connections" ||
                input.id === "edit-followers" ||
                input.id === "edit-rating" ||
                input.id === "edit-grade"
            ) {

                input.style.display =
                    "none";

                input.disabled =
                    true;

                return;
            }

            input.disabled =
                !editMode;

            input.style.display =
                editMode
                    ? "block"
                    : "none";
        }
    );


    // -------------------------------------
    // Make sure backend-controlled fields
    // never have editable inputs
    // -------------------------------------

    document
        .querySelectorAll(
            "#edit-connections, #edit-followers, #edit-rating, #edit-grade"
        )
        .forEach(
            element => {

                element.style.display =
                    "none";

                element.disabled =
                    true;
            }
        );
}


// =========================================
// TOGGLE EDIT MODE
// =========================================

function toggleEditMode() {

    // =====================================
    // NEVER EDIT SOMEONE ELSE
    // =====================================

    if (!isOwnProfile) {

        alert(
            "You can only edit your own profile."
        );

        return;
    }


    if (!requireAuthentication()) {
        return;
    }


    editMode =
        !editMode;


    const inputs =
        document.querySelectorAll(
            ".edit-input"
        );


    const saveBtn =
        document.getElementById(
            "saveBtn"
        );


    const editBtn =
        document.getElementById(
            "toggleEditBtn"
        );


    const profilePicInput =
        document.getElementById(
            "profilePicInput"
        );


    const bannerUpload =
        document.getElementById(
            "bannerUpload"
        );


    const uploadSection =
        document.getElementById(
            "profileUploadControls"
        );


    // =====================================
    // EDIT INPUTS
    // =====================================

    inputs.forEach(
        input => {

            // Never expose backend-controlled
            // values for editing.

            if (
                input.id === "edit-connections" ||
                input.id === "edit-followers" ||
                input.id === "edit-rating" ||
                input.id === "edit-grade"
            ) {

                input.style.display =
                    "none";

                input.disabled =
                    true;

                return;
            }


            // Achievement upload inputs are handled
            // separately.

            if (
                input.classList.contains(
                    "achievement-upload"
                )
            ) {
                return;
            }


            input.style.display =
                editMode
                    ? "block"
                    : "none";

            input.disabled =
                !editMode;
        }
    );


    // =====================================
    // SAVE BUTTON
    // =====================================

    if (saveBtn) {

        saveBtn.style.display =
            editMode
                ? "block"
                : "none";
    }


    // =====================================
    // EDIT BUTTON
    // =====================================

    if (editBtn) {

        editBtn.textContent =
            editMode
                ? "Cancel"
                : "Edit Profile";
    }


    // =====================================
    // UPLOAD SECTION
    // =====================================

    if (uploadSection) {

        uploadSection.classList.toggle(
            "show-profile-uploads",
            editMode
        );

        if (editMode) {

            uploadSection.style.display =
                "flex";

        } else {

            uploadSection.style.display =
                "none";
        }
    }


    // =====================================
    // PROFILE PICTURE INPUT
    // =====================================

    if (profilePicInput) {

        profilePicInput.style.display =
            editMode
                ? "block"
                : "none";

        profilePicInput.disabled =
            !editMode;
    }


    // =====================================
    // BANNER INPUT
    // =====================================

    if (bannerUpload) {

        bannerUpload.style.display =
            editMode
                ? "block"
                : "none";

        bannerUpload.disabled =
            !editMode;
    }


    // =====================================
    // ACHIEVEMENT UPLOADS
    // =====================================

    document
        .querySelectorAll(
            ".achievement-upload"
        )
        .forEach(
            input => {

                input.style.display =
                    editMode
                        ? "block"
                        : "none";

                input.disabled =
                    !editMode;
            }
        );


    // =====================================
    // PROFILE PICTURE VIEW
    // =====================================

    const profilePic =
        document.getElementById(
            "profilePic"
        );


    const placeholder =
        document.getElementById(
            "dpPlaceholder"
        );


    if (profilePic) {

        if (editMode) {

            profilePic.style.display =
                "none";

        } else {

            const src =
                profilePic.getAttribute(
                    "src"
                );

            profilePic.style.display =
                src
                    ? "block"
                    : "none";
        }
    }


    if (placeholder) {

        placeholder.style.display =
            editMode
                ? "none"
                : "";
    }


    // =====================================
    // BODY EDITING CLASS
    // =====================================

    document.body.classList.toggle(
        "editing",
        editMode
    );


    // =====================================
    // RESTORE BACKEND VALUES
    // =====================================

    if (currentProfile) {

        updateBackendControlledStats(
            currentProfile
        );
    }
}


// =========================================
// HTML COMPATIBILITY FUNCTION
// =========================================
//
// Your current HTML uses:
//
// onclick="handleProfileEdit()"
//
// This function keeps that working.
//
// =========================================

function handleProfileEdit() {

    toggleEditMode();
}


// =========================================
// COLLECT PROFILE DATA
// =========================================
//
// IMPORTANT:
// Connections
// Rating
// Grade
// Followers
//
// are deliberately NOT included.
//
// The backend must calculate/control them.
//
// =========================================

function collectProfileData() {

    const data = {};


    fields.forEach(
        field => {

            const element =
                document.getElementById(
                    field.edit
                );

            if (!element) {
                return;
            }

            data[field.key] =
                element.value.trim();
        }
    );


    // -------------------------------------
    // Explicitly prevent frontend changes
    // to backend-controlled fields.
    // -------------------------------------

    delete data.connections;
    delete data.followers;
    delete data.rating;
    delete data.grade;


    return data;
}


// =========================================
// EMAIL VALIDATION
// =========================================

function isValidEmail(email) {

    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(email);
}


// =========================================
// PHONE VALIDATION
// =========================================

function isValidPhone(phone) {

    const phoneRegex =
        /^[0-9+\-\s()]{7,20}$/;

    return phoneRegex.test(phone);
}


// =========================================
// READ RESPONSE
// =========================================

async function readResponse(response) {

    const text =
        await response.text();

    console.log(
        "HTTP Status:",
        response.status
    );

    console.log(
        "Server response:",
        text
    );


    if (
        !text ||
        text.trim() === ""
    ) {
        return {};
    }


    try {

        return JSON.parse(text);

    } catch (error) {

        console.error(
            "Invalid JSON:",
            text
        );

        throw new Error(
            "Server returned HTML/text instead of JSON."
        );
    }
}


// =========================================
// GET IMAGE DATA
// =========================================

function getImageData(elementId) {

    const image =
        document.getElementById(
            elementId
        );


    if (!image) {
        return null;
    }


    const src =
        image.getAttribute(
            "src"
        );


    if (
        src &&
        src.startsWith("data:image/")
    ) {
        return src;
    }


    return null;
}


// =========================================
// SAVE PROFILE
// =========================================

async function saveProfile() {

    // =====================================
    // ABSOLUTE OWN-PROFILE CHECK
    // =====================================

    if (!isOwnProfile) {

        alert(
            "You are not allowed to edit this profile."
        );

        return;
    }


    try {

        if (!requireAuthentication()) {
            return;
        }


        // =================================
        // COLLECT DATA
        // =================================

        const data =
            collectProfileData();


        // =================================
        // EMAIL
        // =================================

        if (
            data.email &&
            !isValidEmail(data.email)
        ) {

            alert(
                "Please enter a valid email address."
            );

            return;
        }


        // =================================
        // PHONE
        // =================================

        if (
            data.phone &&
            !isValidPhone(data.phone)
        ) {

            alert(
                "Please enter a valid phone number."
            );

            return;
        }


        // =================================
        // PROFILE IMAGE
        // =================================

        const profilePicData =
            getImageData(
                "profilePic"
            );


        if (profilePicData) {

            data.profilePic =
                profilePicData;
        }


        // =================================
        // BANNER IMAGE
        // =================================

        const bannerData =
            getImageData(
                "bannerImage"
            );


        if (bannerData) {

            data.bannerImage =
                bannerData;
        }


        // =================================
        // ACHIEVEMENT IMAGES
        // =================================

        for (
            let i = 1;
            i <= 6;
            i++
        ) {

            const imageData =
                getImageData(
                    `achievement-img-${i}`
                );


            if (imageData) {

                data[
                    `achievement_${i}`
                ] =
                    imageData;
            }
        }


        // =================================
        // IMPORTANT:
        // DO NOT SEND USER ID
        // =================================

        delete data.userId;
        delete data.id;


        // =================================
        // IMPORTANT:
        // DO NOT SEND BACKEND CONTROLLED
        // FIELDS
        // =================================

        delete data.connections;
        delete data.followers;
        delete data.rating;
        delete data.grade;


        console.log(
            "Saving OWN profile:",
            data
        );


        // =================================
        // SAVE TO API
        // =================================

        const response =
            await authenticatedFetch(
                MY_PROFILE_API,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(data)
                }
            );


        // =================================
        // AUTH ERROR
        // =================================

        if (
            handleAuthenticationError(
                response.status
            )
        ) {
            return;
        }


        // =================================
        // READ SERVER RESPONSE
        // =================================

        const result =
            await readResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                result.error ||
                `Server returned HTTP ${response.status}.`
            );
        }


        // =================================
        // GET PROFILE FROM RESPONSE
        // =================================

        let returnedProfile =
            result.profile ||
            result.data ||
            null;


        // ---------------------------------
        // If backend returns only updated
        // fields, merge them with existing
        // profile.
        // ---------------------------------

        if (
            returnedProfile &&
            typeof returnedProfile === "object"
        ) {

            returnedProfile = {
                ...(currentProfile || {}),
                ...returnedProfile,
                ...data
            };

        } else {

            returnedProfile = {
                ...(currentProfile || {}),
                ...data
            };
        }


        // =================================
        // IMPORTANT:
        // Keep backend controlled values
        // already returned by backend.
        // =================================

        currentProfile =
            returnedProfile;


        // =================================
        // SAVE LOCAL COPY
        // =================================

        localStorage.setItem(
            "userProfile",
            JSON.stringify(
                returnedProfile
            )
        );


        // =================================
        // UPDATE SCREEN
        // =================================

        updateProfile();


        updateBackendControlledStats(
            returnedProfile
        );


        updateProfileCompletion();


        // =================================
        // EXIT EDIT MODE
        // =================================

        if (editMode) {

            toggleEditMode();
        }


        alert(
            "Profile saved successfully!"
        );


        // =================================
        // OPTIONAL SERVER REFRESH
        // =================================
        //
        // This guarantees that Grade,
        // Rating and Connections shown on
        // screen are the latest backend values.
        //
        // =================================

        await refreshBackendControlledStats();


    } catch (error) {

        console.error(
            "SAVE PROFILE ERROR:",
            error
        );


        alert(
            "Unable to save profile.\n\n" +
            error.message
        );
    }
}


// =========================================
// REFRESH BACKEND CONTROLLED STATS
// =========================================

async function refreshBackendControlledStats() {

    if (!requireAuthentication()) {
        return;
    }


    if (!userId) {
        return;
    }


    try {

        let url;


        // ---------------------------------
        // Own profile
        // ---------------------------------

        if (isOwnProfile) {

            url =
                MY_PROFILE_API;

        } else {

            // -----------------------------
            // Public profile
            // -----------------------------

            url =
                `${PUBLIC_PROFILE_API}/${userId}`;
        }


        const response =
            await authenticatedFetch(
                url,
                {
                    method: "GET"
                }
            );


        if (
            handleAuthenticationError(
                response.status
            )
        ) {
            return;
        }


        if (!response.ok) {

            console.warn(
                "Unable to refresh backend statistics."
            );

            return;
        }


        const result =
            await readResponse(
                response
            );


        const profile =
            result.profile ||
            result.data ||
            result;


        if (
            profile &&
            typeof profile === "object"
        ) {

            currentProfile = {
                ...(currentProfile || {}),
                ...profile
            };


            updateBackendControlledStats(
                currentProfile
            );


            console.log(
                "Backend controlled statistics refreshed."
            );
        }

    } catch (error) {

        console.warn(
            "STAT REFRESH ERROR:",
            error
        );
    }
}


// =========================================
// CURRENT PROFILE OBJECT
// =========================================

let currentProfile = null;


// =========================================
// LOAD PROFILE
// =========================================

async function loadProfile() {

    if (!requireAuthentication()) {
        return null;
    }

    // =====================================
    // DETERMINE API
    // =====================================

    let url;

    if (isOwnProfile) {

        // ---------------------------------
        // OWN PROFILE
        // ---------------------------------

        url = MY_PROFILE_API;

    } else {

        // ---------------------------------
        // OTHER USER
        // ---------------------------------

        url = `${PUBLIC_PROFILE_API}/${userId}`;
    }

    console.log(
        "Loading profile from:",
        url
    );

    try {

        const response =
            await authenticatedFetch(
                url,
                {
                    method: "GET"
                }
            );

        // =================================
        // AUTH ERROR
        // =================================

        if (
            handleAuthenticationError(
                response.status
            )
        ) {
            return null;
        }

        // =================================
        // NOT FOUND
        // =================================

        if (
            response.status === 404
        ) {

            if (isOwnProfile) {

                console.log(
                    "No profile exists yet."
                );

                currentProfile = null;

                clearProfileFields();

                updateBackendControlledStats(
                    {}
                );

                configureProfileAccess();

                updateProfileCompletion();

                return null;
            }

            alert(
                "This user profile could not be found."
            );

            return null;
        }

        // =================================
        // READ RESPONSE
        // =================================

        const result =
            await readResponse(
                response
            );

        if (!response.ok) {

            throw new Error(
                result.error ||
                result.message ||
                `Server returned HTTP ${response.status}.`
            );
        }

        // =================================
        // EXTRACT PROFILE
        // =================================

        const profile =
            result.profile ||
            result.data ||
            result;

        if (
            !profile ||
            typeof profile !== "object"
        ) {

            console.warn(
                "No valid profile object returned."
            );

            return null;
        }
        if (
    !profile.profilePic &&
    profile.profile_picture
) {
    profile.profilePic =
        profile.profile_picture;
}

if (
    !profile.bannerImage &&
    profile.banner
) {
    profile.bannerImage =
        profile.banner;
}

if (
    profile.testScore === undefined &&
    profile.test_score !== undefined
) {
    profile.testScore =
        profile.test_score;
}

if (
    profile.testRating === undefined &&
    profile.test_rating !== undefined
) {
    profile.testRating =
        profile.test_rating;
}

        // =================================
        // NORMALIZE BACKEND FIELD NAMES
        // =================================
        //
        // The backend may return:
        //
        // profile_picture
        // banner
        // test_score
        // test_rating
        //
        // while the existing frontend uses:
        //
        // profilePic
        // bannerImage
        //
        // Keep both available so existing
        // profile code continues working.
        // =================================

        if (
            !profile.profilePic &&
            profile.profile_picture
        ) {

            profile.profilePic =
                profile.profile_picture;
        }

        if (
            !profile.bannerImage &&
            profile.banner
        ) {

            profile.bannerImage =
                profile.banner;
        }

        if (
            profile.testScore === undefined &&
            profile.test_score !== undefined
        ) {

            profile.testScore =
                profile.test_score;
        }

        if (
            profile.testRating === undefined &&
            profile.test_rating !== undefined
        ) {

            profile.testRating =
                profile.test_rating;
        }

        // =================================
        // SET CURRENT PROFILE
        // =================================

        currentProfile = profile;

        console.log(
            "Loaded profile:",
            profile
        );

        // =================================
        // FILL VIEW / EDIT FIELDS
        // =================================

        fields.forEach(
            field => {

                const edit =
                    document.getElementById(
                        field.edit
                    );

                const view =
                    document.getElementById(
                        field.view
                    );

                if (!edit) {
                    return;
                }

                const value =
                    profile[field.key];

                if (
                    value !== undefined &&
                    value !== null
                ) {

                    edit.value =
                        String(value);

                    if (view) {

                        view.textContent =
                            String(value);
                    }

                } else {

                    edit.value = "";

                    if (view) {

                        view.textContent = "";
                    }
                }
            }
        );

        // =================================
        // UPDATE BACKEND CONTROLLED STATS
        // =================================

        updateBackendControlledStats(
            profile
        );

        // =================================
        // PROFILE PICTURE
        // =================================

        const profilePicture =
            profile.profilePic ||
            profile.profile_picture;

        if (profilePicture) {

            setProfileImage(
                "profilePic",
                "dpPlaceholder",
                profilePicture
            );

        } else {

            hideProfileImage();
        }

        // =================================
        // BANNER
        // =================================

        const bannerImage =
            profile.bannerImage ||
            profile.banner;

        const banner =
            document.getElementById(
                "bannerImage"
            );

        if (banner) {

            if (bannerImage) {

                banner.src =
                    bannerImage;

                banner.style.display =
                    "block";

            } else {

                banner.removeAttribute(
                    "src"
                );

                banner.style.display =
                    "none";
            }
        }

        // =================================
        // ACHIEVEMENT IMAGES
        // =================================

        for (
            let i = 1;
            i <= 6;
            i++
        ) {

            const image =
                document.getElementById(
                    `achievement-img-${i}`
                );

            const value =
                profile[
                    `achievement_${i}`
                ];

            if (
                image &&
                value
            ) {

                image.src =
                    value;

                image.style.display =
                    "block";

            } else if (image) {

                image.removeAttribute(
                    "src"
                );

                image.style.display =
                    "none";
            }
        }

        // =================================
        // SAVE LOCAL COPY
        // =================================
        //
        // Only save the currently logged-in
        // user's profile.
        // =================================

        if (isOwnProfile) {

            localStorage.setItem(
                "userProfile",
                JSON.stringify(profile)
            );
        }

        // =================================
        // PROFILE ACCESS
        // =================================

        configureProfileAccess();

        // =================================
        // COMPLETION
        // =================================

        updateProfileCompletion();
        return profile;

        // =================================
        // PROFILE TITLE
        // =================================

        updateProfileTitle(
            profile
        );

        // =================================
        // MAKE SURE BACKEND VALUES ARE
        // DISPLAYED AFTER ALL DOM UPDATES
        // =================================

        updateBackendControlledStats(
            profile
        );

        // =================================
        // RETURN PROFILE
        // =================================

        return profile;

    } catch (error) {

        console.error(
            "LOAD PROFILE ERROR:",
            error
        );

        // ---------------------------------
        // ONLY OWN PROFILE MAY USE
        // LOCAL BACKUP
        // ---------------------------------

        if (isOwnProfile) {

            console.warn(
                "Using local profile backup."
            );

            const localProfile =
                loadLocalProfile();

            if (
                localProfile &&
                typeof localProfile === "object"
            ) {

                currentProfile =
                    localProfile;

                updateBackendControlledStats(
                    localProfile
                );

                updateProfileCompletion();

                updateProfileTitle(
                    localProfile
                );

                return localProfile;
            }
        }

        return null;
    }
}

// =========================================
// UPDATE PROFILE TITLE
// =========================================

function updateProfileTitle(profile) {

    if (!profile) {
        return;
    }


    const name =
        profile.name ||
        "Professional Profile";


    document.title =
        `${name} | Campus2Career`;
}


// =========================================
// CLEAR PROFILE FIELDS
// =========================================

function clearProfileFields() {

    fields.forEach(
        field => {

            const edit =
                document.getElementById(
                    field.edit
                );


            if (edit) {

                edit.value =
                    "";
            }


            const view =
                document.getElementById(
                    field.view
                );


            if (view) {

                view.textContent =
                    "";
            }
        }
    );


    // -------------------------------------
    // Clear backend-controlled fields
    // -------------------------------------

    const connectionsView =
        document.getElementById(
            "view-connections"
        );

    if (connectionsView) {

        connectionsView.textContent =
            "0";
    }


    const ratingView =
        document.getElementById(
            "view-rating"
        );

    if (ratingView) {

        ratingView.textContent =
            "Not Rated";
    }


    const gradeView =
        document.getElementById(
            "view-grade"
        );

    if (gradeView) {

        gradeView.textContent =
            "Not Available";
    }


    hideProfileImage();
}


// =========================================
// SET PROFILE IMAGE
// =========================================

function setProfileImage(
    imageId,
    placeholderId,
    source
) {

    const image =
        document.getElementById(
            imageId
        );


    const placeholder =
        document.getElementById(
            placeholderId
        );


    if (image && source) {

        image.src =
            source;

        image.style.display =
            editMode
                ? "none"
                : "block";
    }


    if (placeholder) {

        placeholder.style.display =
            editMode
                ? "none"
                : "flex";
    }
}


// =========================================
// HIDE PROFILE IMAGE
// =========================================

function hideProfileImage() {

    const image =
        document.getElementById(
            "profilePic"
        );


    const placeholder =
        document.getElementById(
            "dpPlaceholder"
        );


    if (image) {

        image.removeAttribute(
            "src"
        );

        image.style.display =
            "none";
    }


    if (placeholder) {

        placeholder.style.display =
            editMode
                ? "none"
                : "flex";
    }
}


// =========================================
// LOCAL PROFILE
// =========================================

function loadLocalProfile() {

    const saved =
        localStorage.getItem(
            "userProfile"
        );


    if (!saved) {

        updateProfileCompletion();

        return;
    }


    try {

        const profile =
            JSON.parse(saved);


        currentProfile =
            profile;


        fields.forEach(
            field => {

                const edit =
                    document.getElementById(
                        field.edit
                    );


                const view =
                    document.getElementById(
                        field.view
                    );


                if (!edit) {
                    return;
                }


                const value =
                    profile[
                        field.key
                    ];


                if (
                    value !== undefined &&
                    value !== null
                ) {

                    edit.value =
                        String(value);


                    if (view) {

                        view.textContent =
                            String(value);
                    }
                }
            }
        );


        // ---------------------------------
        // Restore backend fields from
        // locally saved server response.
        // ---------------------------------

        updateBackendControlledStats(
            profile
        );


        // ---------------------------------
        // Profile image
        // ---------------------------------

        if (profile.profilePic) {

            setProfileImage(
                "profilePic",
                "dpPlaceholder",
                profile.profilePic
            );
        }


        // ---------------------------------
        // Banner
        // ---------------------------------

        if (profile.bannerImage) {

            const banner =
                document.getElementById(
                    "bannerImage"
                );


            if (banner) {

                banner.src =
                    profile.bannerImage;

                banner.style.display =
                    "block";
            }
        }


        // ---------------------------------
        // Achievement images
        // ---------------------------------

        for (
            let i = 1;
            i <= 6;
            i++
        ) {

            const image =
                document.getElementById(
                    `achievement-img-${i}`
                );


            const value =
                profile[
                    `achievement_${i}`
                ];


            if (
                image &&
                value
            ) {

                image.src =
                    value;
            }
        }


        updateProfileCompletion();


    } catch (error) {

        console.error(
            "LOCAL PROFILE ERROR:",
            error
        );
    }
}


// =========================================
// PROFILE PICTURE UPLOAD
// =========================================

function setupProfilePicture() {

    const input =
        document.getElementById(
            "profilePicInput"
        );


    const image =
        document.getElementById(
            "profilePic"
        );


    const placeholder =
        document.getElementById(
            "dpPlaceholder"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "change",
        event => {

            if (
                !isOwnProfile ||
                !editMode
            ) {

                input.value =
                    "";

                return;
            }


            const file =
                event.target.files[0];


            if (!file) {
                return;
            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                alert(
                    "Please select an image file."
                );

                input.value =
                    "";

                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                readerEvent => {

                    if (image) {

                        image.src =
                            readerEvent.target.result;

                        image.style.display =
                            "none";
                    }


                    if (placeholder) {

                        placeholder.style.display =
                            "none";
                    }


                    console.log(
                        "Profile image selected."
                    );
                };


            reader.onerror =
                () => {

                    alert(
                        "Unable to read the selected image."
                    );

                    input.value =
                        "";
                };


            reader.readAsDataURL(
                file
            );
        }
    );
}


// =========================================
// BANNER UPLOAD
// =========================================

function setupBannerUpload() {

    const input =
        document.getElementById(
            "bannerUpload"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "change",
        event => {

            if (
                !isOwnProfile ||
                !editMode
            ) {

                input.value =
                    "";

                return;
            }


            const file =
                event.target.files[0];


            if (!file) {
                return;
            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                alert(
                    "Please select an image file."
                );

                input.value =
                    "";

                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                readerEvent => {

                    const banner =
                        document.getElementById(
                            "bannerImage"
                        );


                    if (banner) {

                        banner.src =
                            readerEvent.target.result;

                        banner.style.display =
                            "block";
                    }


                    console.log(
                        "Banner image selected."
                    );
                };


            reader.onerror =
                () => {

                    alert(
                        "Unable to read the selected banner image."
                    );

                    input.value =
                        "";
                };


            reader.readAsDataURL(
                file
            );
        }
    );
}


// =========================================
// ACHIEVEMENT IMAGE UPLOADS
// =========================================

function setupAchievementUploads() {

    const uploads =
        document.querySelectorAll(
            ".achievement-upload"
        );


    uploads.forEach(
        (
            input,
            index
        ) => {

            input.addEventListener(
                "change",
                event => {

                    if (
                        !isOwnProfile ||
                        !editMode
                    ) {

                        input.value =
                            "";

                        return;
                    }


                    const file =
                        event.target.files[0];


                    if (!file) {
                        return;
                    }


                    if (
                        !file.type.startsWith(
                            "image/"
                        )
                    ) {

                        alert(
                            "Please select an image file."
                        );

                        input.value =
                            "";

                        return;
                    }


                    const reader =
                        new FileReader();


                    reader.onload =
                        readerEvent => {

                            const image =
                                document.getElementById(
                                    `achievement-img-${index + 1}`
                                );


                            if (image) {

                                image.src =
                                    readerEvent.target.result;

                                image.style.display =
                                    "block";
                            }
                        };


                    reader.onerror =
                        () => {

                            alert(
                                "Unable to read the achievement image."
                            );

                            input.value =
                                "";
                        };


                    reader.readAsDataURL(
                        file
                    );
                }
            );
        }
    );
}


// =========================================
// PROFILE COMPLETION
// =========================================
//
// Backend controlled fields are NOT counted
// as editable profile completion fields.
//
// =========================================

function updateProfileCompletion() {

    let completed = 0;


    fields.forEach(
        field => {

            const edit =
                document.getElementById(
                    field.edit
                );


            if (
                edit &&
                edit.value.trim() !== ""
            ) {

                completed++;
            }
        }
    );


    const total =
        fields.length;


    const percentage =
        total > 0
            ? Math.round(
                (
                    completed /
                    total
                ) * 100
            )
            : 0;


    const progress =
        document.getElementById(
            "profileProgress"
        );


    const completionText =
        document.getElementById(
            "profileCompletion"
        );


    if (progress) {

        progress.style.width =
            `${percentage}%`;

        progress.setAttribute(
            "aria-valuenow",
            String(percentage)
        );
    }


    if (completionText) {

        completionText.textContent =
            `${percentage}%`;
    }


    // -------------------------------------
    // Additional IDs/classes if present
    // -------------------------------------

    document
        .querySelectorAll(
            ".profile-completion"
        )
        .forEach(
            element => {

                element.textContent =
                    `${percentage}%`;
            }
        );


    document
        .querySelectorAll(
            ".profile-progress"
        )
        .forEach(
            element => {

                element.style.width =
                    `${percentage}%`;
            }
        );


    console.log(
        `Profile completion: ${percentage}%`
    );
}


// =========================================
// AUTO RESIZE TEXTAREAS
// =========================================

function setupAutoResize() {

    document
        .querySelectorAll(
            "textarea"
        )
        .forEach(
            textarea => {

                // Initial resize

                textarea.style.height =
                    "auto";

                textarea.style.height =
                    `${textarea.scrollHeight}px`;


                textarea.addEventListener(
                    "input",
                    () => {

                        textarea.style.height =
                            "auto";

                        textarea.style.height =
                            `${textarea.scrollHeight}px`;

                        updateProfileCompletion();
                    }
                );
            }
        );
}


// =========================================
// LIVE PROFILE COMPLETION UPDATES
// =========================================

function setupCompletionListeners() {

    document
        .querySelectorAll(
            ".edit-input"
        )
        .forEach(
            input => {

                // Never use backend controlled
                // fields for manual editing.

                if (
                    input.id === "edit-connections" ||
                    input.id === "edit-followers" ||
                    input.id === "edit-rating" ||
                    input.id === "edit-grade"
                ) {
                    return;
                }


                input.addEventListener(
                    "input",
                    updateProfileCompletion
                );

                input.addEventListener(
                    "change",
                    updateProfileCompletion
                );
            }
        );
}


// =========================================
// CANCEL EDIT SAFELY
// =========================================
//
// Re-load backend/local profile before leaving
// edit mode so unsaved changes disappear.
//
// =========================================

async function cancelEditMode() {

    if (!editMode) {
        return;
    }


    editMode =
        false;


    document.body.classList.remove(
        "editing"
    );


    const uploadSection =
        document.getElementById(
            "profileUploadControls"
        );


    if (uploadSection) {

        uploadSection.classList.remove(
            "show-profile-uploads"
        );

        uploadSection.style.display =
            "none";
    }


    const saveBtn =
        document.getElementById(
            "saveBtn"
        );


    if (saveBtn) {

        saveBtn.style.display =
            "none";
    }


    const editBtn =
        document.getElementById(
            "toggleEditBtn"
        );


    if (editBtn) {

        editBtn.textContent =
            "Edit Profile";
    }


    // -------------------------------------
    // Restore most recently loaded profile
    // -------------------------------------

    if (currentProfile) {

        fields.forEach(
            field => {

                const edit =
                    document.getElementById(
                        field.edit
                    );


                const view =
                    document.getElementById(
                        field.view
                    );


                const value =
                    currentProfile[field.key];


                if (edit) {

                    edit.value =
                        value !== undefined &&
                        value !== null
                            ? String(value)
                            : "";
                }


                if (view) {

                    view.textContent =
                        value !== undefined &&
                        value !== null
                            ? String(value)
                            : "";
                }
            }
        );


        // Restore backend statistics

        updateBackendControlledStats(
            currentProfile
        );
    }


    configureProfileAccess();

    hidePendingUploadControls();

    updateProfileCompletion();
}


// =========================================
// HIDE PENDING UPLOAD CONTROLS
// =========================================

function hidePendingUploadControls() {

    const profilePicInput =
        document.getElementById(
            "profilePicInput"
        );


    const bannerUpload =
        document.getElementById(
            "bannerUpload"
        );


    if (profilePicInput) {

        profilePicInput.value =
            "";

        profilePicInput.style.display =
            "none";

        profilePicInput.disabled =
            true;
    }


    if (bannerUpload) {

        bannerUpload.value =
            "";

        bannerUpload.style.display =
            "none";

        bannerUpload.disabled =
            true;
    }


    document
        .querySelectorAll(
            ".achievement-upload"
        )
        .forEach(
            input => {

                input.value =
                    "";

                input.style.display =
                    "none";

                input.disabled =
                    true;
            }
        );


    const uploadSection =
        document.getElementById(
            "profileUploadControls"
        );


    if (uploadSection) {

        uploadSection.classList.remove(
            "show-profile-uploads"
        );

        uploadSection.style.display =
            "none";
    }
}


// =========================================
// IMPROVED EDIT HANDLER
// =========================================
//
// If currently editing:
//      Cancel
//
// Otherwise:
//      Enter edit mode
//
// =========================================

function handleEditButtonClick() {

    if (
        editMode &&
        isOwnProfile
    ) {

        cancelEditMode();

        return;
    }


    toggleEditMode();
}


// =========================================
// KEYBOARD SHORTCUTS
// =========================================

document.addEventListener(
    "keydown",
    event => {

        // ---------------------------------
        // Ctrl + S
        // ---------------------------------

        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "s"
        ) {

            event.preventDefault();


            if (
                editMode &&
                isOwnProfile
            ) {

                saveProfile();
            }
        }


        // ---------------------------------
        // Escape
        // ---------------------------------

        if (
            event.key === "Escape" &&
            editMode
        ) {

            event.preventDefault();

            cancelEditMode();
        }
    }
);


// =========================================
// RESPONSIVE LAYOUT
// =========================================

function handleResponsiveLayout() {

    if (
        window.innerWidth < 768
    ) {

        document.body.classList.add(
            "mobile-layout"
        );

    } else {

        document.body.classList.remove(
            "mobile-layout"
        );
    }
}


// =========================================
// RESPONSIVE EVENT
// =========================================

window.addEventListener(
    "resize",
    handleResponsiveLayout
);


// =========================================
// INITIALIZATION
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "Profile page initializing..."
        );


        // ---------------------------------
        // Start in view mode
        // ---------------------------------

        editMode =
            false;


        // ---------------------------------
        // Hide save button
        // ---------------------------------

        const saveBtn =
            document.getElementById(
                "saveBtn"
            );


        if (saveBtn) {

            saveBtn.style.display =
                "none";
        }


        // ---------------------------------
        // Hide edit inputs
        // ---------------------------------

        const editInputs =
            document.querySelectorAll(
                ".edit-input"
            );


        editInputs.forEach(
            input => {

                // Backend-controlled fields
                // must never be visible.

                if (
                    input.id === "edit-connections" ||
                    input.id === "edit-followers" ||
                    input.id === "edit-rating" ||
                    input.id === "edit-grade"
                ) {

                    input.style.display =
                        "none";

                    input.disabled =
                        true;

                    return;
                }


                // Achievement uploads are handled
                // independently.

                if (
                    input.classList.contains(
                        "achievement-upload"
                    )
                ) {

                    input.style.display =
                        "none";

                    input.disabled =
                        true;

                    return;
                }


                input.style.display =
                    "none";

                input.disabled =
                    true;
            }
        );


        // ---------------------------------
        // Hide upload section
        // ---------------------------------

        const uploadSection =
            document.getElementById(
                "profileUploadControls"
            );


        if (uploadSection) {

            uploadSection.classList.remove(
                "show-profile-uploads"
            );

            uploadSection.style.display =
                "none";
        }


        // ---------------------------------
        // Configure owner/viewer access
        // ---------------------------------

        configureProfileAccess();


        // ---------------------------------
        // Load correct profile
        // ---------------------------------

        await loadProfile();
      

        // ---------------------------------
        // Setup uploads
        // ---------------------------------

        setupProfilePicture();

        setupBannerUpload();

        setupAchievementUploads();


        // ---------------------------------
        // Other functionality
        // ---------------------------------

        setupAutoResize();

        setupCompletionListeners();

        handleResponsiveLayout();


        // ---------------------------------
        // Completion
        // ---------------------------------

        updateProfileCompletion();


        // ---------------------------------
        // Final access configuration
        // ---------------------------------

        configureProfileAccess();


        // ---------------------------------
        // Backend statistics
        // ---------------------------------

        if (currentProfile) {

            updateBackendControlledStats(
                currentProfile
            );
        }


        console.log(
            "Profile page ready."
        );
    }
);


// =========================================
// GLOBAL FUNCTIONS
// =========================================

window.toggleEditMode =
    toggleEditMode;

window.handleProfileEdit =
    handleProfileEdit;

window.handleEditButtonClick =
    handleEditButtonClick;

window.cancelEditMode =
    cancelEditMode;

window.saveProfile =
    saveProfile;

window.loadProfile =
    loadProfile;

window.refreshBackendControlledStats =
    refreshBackendControlledStats;

window.updateBackendControlledStats =
    updateBackendControlledStats;

