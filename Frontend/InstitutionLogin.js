// =========================================
// CAMPUS2CAREER
// INSTITUTION LOGIN JAVASCRIPT
// =========================================

const API_BASE_URL =
    "http://localhost:5000/api";

const LOGIN_API =
    `${API_BASE_URL}/institution/signin`;

const TOKEN_KEY =
    "institutionAuthToken";

const INSTITUTION_KEY =
    "institutionData";


// =========================================
// ELEMENTS
// =========================================

const form =
    document.getElementById(
        "institutionLoginForm"
    );

const email =
    document.getElementById(
        "email"
    );

const password =
    document.getElementById(
        "password"
    );

const loginBtn =
    document.getElementById(
        "loginBtn"
    );

const message =
    document.getElementById(
        "message"
    );

const togglePassword =
    document.getElementById(
        "togglePassword"
    );


// =========================================
// SHOW MESSAGE
// =========================================

function showMessage(
    text,
    type = "error"
) {

    if (!message) {
        return;
    }

    message.textContent =
        text;

    message.className =
        `message show ${type}`;
}


// =========================================
// TOGGLE PASSWORD
// =========================================

if (togglePassword) {

    togglePassword.addEventListener(
        "click",
        () => {

            const isPassword =
                password.type ===
                "password";

            password.type =
                isPassword
                    ? "text"
                    : "password";

            togglePassword.textContent =
                isPassword
                    ? "Hide"
                    : "Show";
        }
    );
}


// =========================================
// LOGIN
// =========================================

if (form) {

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (message) {

                message.className =
                    "message";

                message.textContent =
                    "";

            }


            const emailValue =
                email.value
                    .trim()
                    .toLowerCase();

            const passwordValue =
                password.value;


            // ---------------------------------
            // VALIDATION
            // ---------------------------------

            if (
                !emailValue ||
                !passwordValue
            ) {

                showMessage(
                    "Please enter your email and password."
                );

                return;
            }


            // ---------------------------------
            // DISABLE BUTTON
            // ---------------------------------

            loginBtn.disabled =
                true;

            loginBtn.textContent =
                "Signing In...";


            try {

                // ---------------------------------
                // API REQUEST
                // ---------------------------------

                const response =
                    await fetch(
                        LOGIN_API,
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
                                JSON.stringify({

                                    email:
                                        emailValue,

                                    password:
                                        passwordValue

                                })

                        }
                    );


                // ---------------------------------
                // READ RESPONSE
                // ---------------------------------

                const result =
                    await response.json();


                // ---------------------------------
                // ERROR RESPONSE
                // ---------------------------------

                if (!response.ok) {

                    throw new Error(
                        result.error ||
                        result.message ||
                        "Login failed."
                    );

                }


                // ---------------------------------
                // CHECK TOKEN
                // ---------------------------------

                if (!result.token) {

                    throw new Error(
                        "Login succeeded but no authentication token was returned."
                    );

                }


                // ---------------------------------
                // STORE JWT
                // ---------------------------------

                localStorage.setItem(
                    TOKEN_KEY,
                    result.token
                );


                // ---------------------------------
                // STORE USER ID
                // ---------------------------------

                if (
                    result.userId
                ) {

                    localStorage.setItem(
                        "institutionUserId",
                        String(
                            result.userId
                        )
                    );

                }


                // ---------------------------------
                // STORE INSTITUTION DATA
                // ---------------------------------

                if (
                    result.institution
                ) {

                    localStorage.setItem(
                        INSTITUTION_KEY,
                        JSON.stringify(
                            result.institution
                        )
                    );

                }


                // ---------------------------------
                // STORE INSTITUTION ID
                // ---------------------------------

                if (
                    result.institutionId
                ) {

                    localStorage.setItem(
                        "institutionId",
                        String(
                            result.institutionId
                        )
                    );

                }


                // ---------------------------------
                // SUCCESS MESSAGE
                // ---------------------------------

                showMessage(
                    "Login successful. Opening Course Profile...",
                    "success"
                );


                // ---------------------------------
                // REDIRECT
                // ---------------------------------

                setTimeout(
                    () => {

                        window.location.href =
                            "CourseProfile.html";

                    },
                    700
                );


            } catch (error) {

                console.error(
                    "Institution login error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to login."
                );


            } finally {

                loginBtn.disabled =
                    false;

                loginBtn.textContent =
                    "Sign In";

            }

        }
    );

}