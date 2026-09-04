// =========================================
// CAMPUS2CAREER
// INSTITUTION REGISTRATION JAVASCRIPT
// =========================================

const API_BASE_URL =
    "http://localhost:5000/api";

const REGISTER_API =
    `${API_BASE_URL}/institution/signup`;

const TOKEN_KEY =
    "institutionAuthToken";

const INSTITUTION_KEY =
    "institutionData";


// =========================================
// ELEMENTS
// =========================================

const form =
    document.getElementById(
        "institutionRegistrationForm"
    );

const registerBtn =
    document.getElementById(
        "registerBtn"
    );

const message =
    document.getElementById(
        "message"
    );

const password =
    document.getElementById(
        "password"
    );

const confirmPassword =
    document.getElementById(
        "confirmPassword"
    );

const togglePassword =
    document.getElementById(
        "togglePassword"
    );

const passwordMatch =
    document.getElementById(
        "passwordMatch"
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
// HIDE MESSAGE
// =========================================

function hideMessage() {

    if (!message) {
        return;
    }

    message.textContent =
        "";

    message.className =
        "message";
}


// =========================================
// PASSWORD RULES
// =========================================

function validatePasswordRules() {

    const value =
        password.value;

    const lengthRule =
        document.getElementById(
            "ruleLength"
        );

    const upperRule =
        document.getElementById(
            "ruleUpper"
        );

    const lowerRule =
        document.getElementById(
            "ruleLower"
        );

    const numberRule =
        document.getElementById(
            "ruleNumber"
        );


    const lengthValid =
        value.length >= 8;

    const upperValid =
        /[A-Z]/.test(value);

    const lowerValid =
        /[a-z]/.test(value);

    const numberValid =
        /[0-9]/.test(value);


    if (lengthRule) {

        lengthRule.classList.toggle(
            "valid",
            lengthValid
        );

    }


    if (upperRule) {

        upperRule.classList.toggle(
            "valid",
            upperValid
        );

    }


    if (lowerRule) {

        lowerRule.classList.toggle(
            "valid",
            lowerValid
        );

    }


    if (numberRule) {

        numberRule.classList.toggle(
            "valid",
            numberValid
        );

    }


    return (
        lengthValid &&
        upperValid &&
        lowerValid &&
        numberValid
    );
}


// =========================================
// PASSWORD MATCH
// =========================================

function validatePasswordMatch() {

    const first =
        password.value;

    const second =
        confirmPassword.value;


    if (!second) {

        if (passwordMatch) {

            passwordMatch.textContent =
                "";

            passwordMatch.className =
                "password-match";

        }

        return false;
    }


    if (first === second) {

        if (passwordMatch) {

            passwordMatch.textContent =
                "Passwords match.";

            passwordMatch.className =
                "password-match success";

        }

        return true;
    }


    if (passwordMatch) {

        passwordMatch.textContent =
            "Passwords do not match.";

        passwordMatch.className =
            "password-match error";

    }

    return false;
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
// LIVE PASSWORD VALIDATION
// =========================================

if (password) {

    password.addEventListener(
        "input",
        () => {

            validatePasswordRules();

            if (
                confirmPassword &&
                confirmPassword.value
            ) {

                validatePasswordMatch();

            }

        }
    );

}


if (confirmPassword) {

    confirmPassword.addEventListener(
        "input",
        validatePasswordMatch
    );

}


// =========================================
// FORM SUBMISSION
// =========================================

if (form) {

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            hideMessage();


            // ---------------------------------
            // PASSWORD VALIDATION
            // ---------------------------------

            const passwordValid =
                validatePasswordRules();

            const passwordMatches =
                validatePasswordMatch();


            if (!passwordValid) {

                showMessage(
                    "Please create a stronger password."
                );

                if (password) {
                    password.focus();
                }

                return;
            }


            if (!passwordMatches) {

                showMessage(
                    "Please make sure both passwords match."
                );

                if (confirmPassword) {
                    confirmPassword.focus();
                }

                return;
            }


            // ---------------------------------
            // COLLECT FORM
            // ---------------------------------

            const formData =
                new FormData(form);


            const data = {

                institutionName:
                    formData.get(
                        "institutionName"
                    ),

                institutionType:
                    formData.get(
                        "institutionType"
                    ),

                email:
                    formData.get(
                        "email"
                    ),

                phone:
                    formData.get(
                        "phone"
                    ),

                website:
                    formData.get(
                        "website"
                    ),

                address:
                    formData.get(
                        "address"
                    ),

                city:
                    formData.get(
                        "city"
                    ),

                state:
                    formData.get(
                        "state"
                    ),

                country:
                    formData.get(
                        "country"
                    ),

                description:
                    formData.get(
                        "description"
                    ),

                password:
                    formData.get(
                        "password"
                    ),

                confirmPassword:
                    formData.get(
                        "confirmPassword"
                    )

            };


            // ---------------------------------
            // BUTTON STATE
            // ---------------------------------

            if (registerBtn) {

                registerBtn.disabled =
                    true;

                registerBtn.textContent =
                    "Creating Account...";

            }


            try {

                // ---------------------------------
                // API REQUEST
                // ---------------------------------

                const response =
                    await fetch(
                        REGISTER_API,
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


                // ---------------------------------
                // READ RESPONSE
                // ---------------------------------

                const result =
                    await response.json();


                // ---------------------------------
                // CHECK RESPONSE
                // ---------------------------------

                if (!response.ok) {

                    throw new Error(
                        result.error ||
                        result.message ||
                        "Registration failed."
                    );

                }


                // ---------------------------------
                // STORE TOKEN IF RETURNED
                // ---------------------------------

                if (
                    result.token
                ) {

                    localStorage.setItem(
                        TOKEN_KEY,
                        result.token
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
                    "Institution registered successfully. Redirecting to login...",
                    "success"
                );


                // ---------------------------------
                // REDIRECT TO LOGIN
                // ---------------------------------

                setTimeout(
                    () => {

                        window.location.href =
                            "InstitutionLogin.html";

                    },
                    1000
                );


            } catch (error) {

                console.error(
                    "Institution registration error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to register institution."
                );


            } finally {

                if (registerBtn) {

                    registerBtn.disabled =
                        false;

                    registerBtn.textContent =
                        "Create Institution Account";

                }

            }

        }
    );

}