
// =========================================
// CAMPUS2CAREER LOGIN JAVASCRIPT
// JWT AUTHENTICATION
// =========================================

console.log("Backend.js loaded");


// =========================================
// API URL
// =========================================

const API_URL =
    "http://localhost:5000/api/login";


// =========================================
// STORAGE KEYS
// =========================================

const TOKEN_KEY =
    "authToken";

const USER_ID_KEY =
    "userId";

const USERNAME_KEY =
    "username";

const EMAIL_KEY =
    "loginEmail";


// =========================================
// MAIN PORTAL PAGE
// =========================================
//
// Change this filename if your main portal
// is named differently.
// =========================================

const MAIN_PORTAL =
    "MainPortal.html";


// =========================================
// PAGE INITIALIZATION
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const loginForm =
            document.getElementById(
                "loginForm"
            );

        const signInBtn =
            document.getElementById(
                "signinBtn"
            );


        // =====================================
        // CHECK HTML
        // =====================================

        if (!loginForm) {

            console.error(
                "ERROR: loginForm was not found."
            );

            return;

        }


        if (!signInBtn) {

            console.error(
                "ERROR: signinBtn was not found."
            );

            return;

        }


        // =====================================
        // LOGIN SUBMISSION
        // =====================================

        loginForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                // ---------------------------------
                // Get input fields
                // ---------------------------------

                const emailElement =
                    document.getElementById(
                        "email"
                    );

                const passwordElement =
                    document.getElementById(
                        "password"
                    );


                if (
                    !emailElement ||
                    !passwordElement
                ) {

                    showMessage(
                        "Login fields are missing.",
                        "red"
                    );

                    return;

                }


                // ---------------------------------
                // Read values
                // ---------------------------------

                const email =
                    emailElement.value
                        .trim()
                        .toLowerCase();

                const password =
                    passwordElement.value;


                // ---------------------------------
                // Clear previous message
                // ---------------------------------

                showMessage(
                    "",
                    "red"
                );


                // =================================
                // EMAIL VALIDATION
                // =================================

                const emailPattern =
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


                if (email === "") {

                    showMessage(
                        "Email is required.",
                        "red"
                    );

                    return;

                }


                if (
                    !emailPattern.test(
                        email
                    )
                ) {

                    showMessage(
                        "Please enter a valid email address.",
                        "red"
                    );

                    return;

                }


                // =================================
                // PASSWORD VALIDATION
                // =================================

                if (password === "") {

                    showMessage(
                        "Password is required.",
                        "red"
                    );

                    return;

                }


                if (password.length < 8) {

                    showMessage(
                        "Password must be at least 8 characters long.",
                        "red"
                    );

                    return;

                }


                // =================================
                // DISABLE LOGIN BUTTON
                // =================================

                signInBtn.disabled =
                    true;

                signInBtn.textContent =
                    "Signing In...";


                showMessage(
                    "Checking your credentials...",
                    "#2563eb"
                );


                try {

                    // =================================
                    // SEND LOGIN REQUEST
                    // =================================

                    console.log(
                        "Sending login request to:",
                        API_URL
                    );


                    const response =
                        await fetch(
                            API_URL,
                            {
                                method: "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Accept":
                                        "application/json"

                                },

                                body:
                                    JSON.stringify({

                                        email:
                                            email,

                                        password:
                                            password

                                    })

                            }
                        );


                    // =================================
                    // READ SERVER RESPONSE
                    // =================================

                    const responseText =
                        await response.text();


                    console.log(
                        "HTTP status:",
                        response.status
                    );


                    console.log(
                        "Server response:",
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

                        } catch (jsonError) {

                            console.error(
                                "Invalid JSON from server:",
                                responseText
                            );


                            throw new Error(
                                "The server returned HTML/text instead of JSON."
                            );

                        }

                    }


                    // =================================
                    // HANDLE SERVER ERROR
                    // =================================

                    if (!response.ok) {

                        throw new Error(

                            data.error ||

                            data.detail ||

                            "Invalid email or password."

                        );

                    }


                    // =================================
                    // VERIFY JWT TOKEN
                    // =================================

                    if (
                        !data.token ||
                        typeof data.token !==
                        "string" ||
                        data.token.trim() === ""
                    ) {

                        throw new Error(
                            "Login succeeded, but the server did not return an authentication token."
                        );

                    }


                    // =================================
                    // VERIFY USER ID
                    // =================================

                    if (
                        data.userId ===
                        undefined ||
                        data.userId ===
                        null
                    ) {

                        throw new Error(
                            "Login succeeded, but the server did not return a user ID."
                        );

                    }


                    // =================================
                    // CLEAR OLD LOGIN INFORMATION
                    // =================================

                    localStorage.removeItem(
                        TOKEN_KEY
                    );

                    localStorage.removeItem(
                        USER_ID_KEY
                    );

                    localStorage.removeItem(
                        USERNAME_KEY
                    );

                    localStorage.removeItem(
                        EMAIL_KEY
                    );


                    // =================================
                    // STORE JWT
                    // =================================

                    localStorage.setItem(
                        TOKEN_KEY,
                        data.token
                    );


                    // =================================
                    // STORE USER ID
                    // =================================

                    localStorage.setItem(
                        USER_ID_KEY,
                        String(
                            data.userId
                        )
                    );


                    // =================================
                    // STORE USERNAME
                    // =================================

                    if (
                        data.username
                    ) {

                        localStorage.setItem(
                            USERNAME_KEY,
                            data.username
                        );

                    }


                    // =================================
                    // STORE EMAIL
                    // =================================

                    localStorage.setItem(
                        EMAIL_KEY,
                        data.email ||
                        email
                    );


                    // =================================
                    // VERIFY STORAGE
                    // =================================

                    const savedToken =
                        localStorage.getItem(
                            TOKEN_KEY
                        );


                    if (
                        !savedToken
                    ) {

                        throw new Error(
                            "The authentication token could not be stored."
                        );

                    }


                    console.log(
                        "JWT stored successfully."
                    );


                    console.log(
                        "Logged-in user ID:",
                        data.userId
                    );


                    console.log(
                        "Username:",
                        data.username
                    );


                    // =================================
                    // SUCCESS MESSAGE
                    // =================================

                    showMessage(
                        "✅ Login successful! Redirecting...",
                        "green"
                    );


                    // =================================
                    // REDIRECT TO MAIN PORTAL
                    // =================================
                    //
                    // The JWT remains in localStorage
                    // so the main portal can fetch the
                    // logged-in user's data.
                    //
                    // =================================

                    setTimeout(
                        function () {

                            window.location.href =
                                MAIN_PORTAL;

                        },
                        1000
                    );


                } catch (error) {

                    console.error(
                        "LOGIN ERROR:",
                        error
                    );


                    showMessage(
                        "❌ " +
                        error.message,
                        "red"
                    );


                    // ---------------------------------
                    // Enable login button again
                    // ---------------------------------

                    signInBtn.disabled =
                        false;

                    signInBtn.textContent =
                        "Sign In";

                }

            }
        );

    }
);


// =========================================
// SHOW MESSAGE
// =========================================

function showMessage(
    text,
    color
) {

    const message =
        document.getElementById(
            "message"
        );


    if (!message) {

        console.log(
            text
        );

        return;

    }


    message.textContent =
        text;


    message.style.color =
        color;

}

