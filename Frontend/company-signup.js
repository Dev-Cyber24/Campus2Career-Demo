const API_BASE_URL = "http://localhost:5000/api";


// ============================================
// ELEMENTS
// ============================================

const signupForm =
    document.getElementById("companySignupForm");

const companyNameInput =
    document.getElementById("companyName");

const gmailInput =
    document.getElementById("gmail");

const passwordInput =
    document.getElementById("password");

const togglePassword =
    document.getElementById("togglePassword");

const signupBtn =
    document.getElementById("signupBtn");

const signupMessage =
    document.getElementById("signupMessage");

const companyNameError =
    document.getElementById("companyNameError");

const gmailError =
    document.getElementById("gmailError");

const passwordError =
    document.getElementById("passwordError");


// ============================================
// SHOW / HIDE PASSWORD
// ============================================

togglePassword.addEventListener("click", () => {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.textContent = "Hide";

    } else {

        passwordInput.type = "password";

        togglePassword.textContent = "Show";

    }

});


// ============================================
// MESSAGE FUNCTION
// ============================================

function showMessage(message, type) {

    signupMessage.textContent = message;

    signupMessage.className =
        `signup-message ${type}`;

    signupMessage.style.display = "block";

}


function clearMessage() {

    signupMessage.style.display = "none";

    signupMessage.textContent = "";

    signupMessage.className =
        "signup-message";

}


// ============================================
// VALIDATE GMAIL
// ============================================

function isValidGmail(email) {

    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email);

}


// ============================================
// VALIDATE PASSWORD
// ============================================

function isValidPassword(password) {

    return password.length >= 8;

}


// ============================================
// CLEAR FIELD ERRORS
// ============================================

function clearFieldErrors() {

    companyNameError.textContent = "";

    gmailError.textContent = "";

    passwordError.textContent = "";

}


// ============================================
// FORM SUBMIT
// ============================================

signupForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        clearMessage();

        clearFieldErrors();


        // ------------------------------------
        // GET VALUES
        // ------------------------------------

        const companyName =
            companyNameInput.value.trim();

        const gmail =
            gmailInput.value.trim().toLowerCase();

        const password =
            passwordInput.value;


        // ------------------------------------
        // VALIDATION
        // ------------------------------------

        let valid = true;


        if (companyName.length < 2) {

            companyNameError.textContent =
                "Please enter a valid company name.";

            valid = false;

        }


        if (!isValidGmail(gmail)) {

            gmailError.textContent =
                "Please enter a valid Gmail ID.";

            valid = false;

        }


        if (!isValidPassword(password)) {

            passwordError.textContent =
                "Password must contain at least 8 characters.";

            valid = false;

        }


        if (!valid) {

            return;

        }


        // ------------------------------------
        // DISABLE BUTTON
        // ------------------------------------

        signupBtn.disabled = true;

        signupBtn.textContent =
            "Creating Account...";


        try {

            // --------------------------------
            // SEND TO BACKEND
            // --------------------------------

            const response = await fetch(
                `${API_BASE_URL}/company/signup`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        company_name: companyName,

                        gmail: gmail,

                        password: password

                    })

                }
            );


            // --------------------------------
            // READ RESPONSE
            // --------------------------------

            const data =
                await response.json();


            // --------------------------------
            // BACKEND ERROR
            // --------------------------------

            if (!response.ok) {

                showMessage(
                    data.error ||
                    data.message ||
                    "Company registration failed.",
                    "error"
                );

                return;

            }


            // --------------------------------
            // SUCCESS
            // --------------------------------

            showMessage(
                "Company account created successfully. Redirecting to Company Sign In...",
                "success"
            );


            // --------------------------------
            // OPTIONAL TOKEN CLEAR
            // --------------------------------

            localStorage.removeItem("companyAuthToken");


            // --------------------------------
            // REDIRECT TO SIGN IN
            // --------------------------------

            setTimeout(() => {

                window.location.href =
                    "company-signin.html";

            }, 1500);


        } catch (error) {

            console.error(
                "Company signup error:",
                error
            );


            showMessage(
                "Unable to connect to the server. Please make sure the Campus2Career backend is running on port 5000.",
                "error"
            );


        } finally {

            signupBtn.disabled = false;

            signupBtn.textContent =
                "Create Company Account";

        }

    }
);