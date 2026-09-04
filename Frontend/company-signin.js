const API_BASE_URL = "http://localhost:5000/api";


// =========================================================
// ELEMENTS
// =========================================================

const signinForm =
    document.getElementById("companySigninForm");

const gmailInput =
    document.getElementById("gmail");

const passwordInput =
    document.getElementById("password");

const togglePassword =
    document.getElementById("togglePassword");

const signinBtn =
    document.getElementById("signinBtn");

const signinMessage =
    document.getElementById("signinMessage");

const gmailError =
    document.getElementById("gmailError");

const passwordError =
    document.getElementById("passwordError");


// =========================================================
// SHOW / HIDE PASSWORD
// =========================================================

togglePassword.addEventListener("click", () => {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.textContent =
            "Hide";

    } else {

        passwordInput.type = "password";

        togglePassword.textContent =
            "Show";
    }

});


// =========================================================
// GMAIL VALIDATION
// =========================================================

function isValidGmail(email) {

    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i
        .test(email);

}


// =========================================================
// MESSAGE
// =========================================================

function showMessage(message, type) {

    signinMessage.textContent =
        message;

    signinMessage.className =
        `signin-message ${type}`;

    signinMessage.style.display =
        "block";
}


function clearMessage() {

    signinMessage.textContent =
        "";

    signinMessage.style.display =
        "none";

    signinMessage.className =
        "signin-message";
}


// =========================================================
// CLEAR ERRORS
// =========================================================

function clearErrors() {

    gmailError.textContent =
        "";

    passwordError.textContent =
        "";
}


// =========================================================
// SIGN IN
// =========================================================

signinForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        clearErrors();

        clearMessage();


        // -----------------------------------------
        // GET VALUES
        // -----------------------------------------

        const gmail =
            gmailInput.value
                .trim()
                .toLowerCase();

        const password =
            passwordInput.value;


        // -----------------------------------------
        // VALIDATION
        // -----------------------------------------

        let valid = true;


        if (!isValidGmail(gmail)) {

            gmailError.textContent =
                "Please enter a valid Gmail ID.";

            valid = false;
        }


        if (!password) {

            passwordError.textContent =
                "Please enter your password.";

            valid = false;
        }


        if (!valid) {

            return;
        }


        // -----------------------------------------
        // BUTTON
        // -----------------------------------------

        signinBtn.disabled =
            true;

        signinBtn.textContent =
            "Signing In...";


        try {

            // -------------------------------------
            // CALL BACKEND
            // -------------------------------------

            const response =
                await fetch(
                    `${API_BASE_URL}/company/signin`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            gmail: gmail,

                            password: password

                        })
                    }
                );


            // -------------------------------------
            // RESPONSE
            // -------------------------------------

            const data =
                await response.json();


            // -------------------------------------
            // LOGIN FAILED
            // -------------------------------------

            if (!response.ok) {

                showMessage(
                    data.error ||
                    data.message ||
                    "Invalid company credentials.",
                    "error"
                );

                return;
            }


            // -------------------------------------
            // GET TOKEN
            // -------------------------------------

            const token =
                data.token ||
                data.accessToken;


            if (!token) {

                showMessage(
                    "Login succeeded, but the server did not return an authentication token.",
                    "error"
                );

                return;
            }


            // -------------------------------------
            // STORE COMPANY SESSION
            // -------------------------------------

            localStorage.setItem(
                "companyAuthToken",
                token
            );


            // Company ID

            if (data.company?.id) {

                localStorage.setItem(
                    "companyId",
                    data.company.id
                );

            } else if (data.company_id) {

                localStorage.setItem(
                    "companyId",
                    data.company_id
                );

            }


            // Company name

            if (data.company?.company_name) {

                localStorage.setItem(
                    "companyName",
                    data.company.company_name
                );

            } else if (data.company_name) {

                localStorage.setItem(
                    "companyName",
                    data.company_name
                );

            }


            // Gmail

            localStorage.setItem(
                "companyGmail",
                gmail
            );


            // -------------------------------------
            // SUCCESS MESSAGE
            // -------------------------------------

            showMessage(
                "Login successful. Redirecting to Company Portal...",
                "success"
            );


            // -------------------------------------
            // REDIRECT
            // -------------------------------------

            setTimeout(() => {

                window.location.href =
                    "COMAIN.html";

            }, 1000);


        } catch (error) {

            console.error(
                "Company signin error:",
                error
            );


            showMessage(
                "Unable to connect to the server. Please make sure the Campus2Career backend is running on port 5000.",
                "error"
            );


        } finally {

            signinBtn.disabled =
                false;

            signinBtn.textContent =
                "Sign In";

        }

    }
);