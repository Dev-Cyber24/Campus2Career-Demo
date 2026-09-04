
// =========================================
// CAMPUS2CAREER SIGNUP JAVASCRIPT
// =========================================


// =========================================
// API
// =========================================

const API_URL = "http://localhost:5000/api/signup";


// =========================================
// PAGE LOAD
// =========================================

document.addEventListener("DOMContentLoaded", () => {

    const signupForm =
        document.getElementById("signupForm");

    const signupBtn =
        document.getElementById("signupBtn");

    const message =
        document.getElementById("message");


    // -----------------------------------------
    // Check required elements
    // -----------------------------------------

    if (!signupForm) {

        console.error(
            "signupForm was not found."
        );

        return;
    }


    // =========================================
    // FORM SUBMISSION
    // =========================================

    signupForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            // -------------------------------------
            // Get values
            // -------------------------------------

            const fullnameElement =
                document.getElementById("fullname") ||
                document.getElementById("fullName");

            const emailElement =
                document.getElementById("email");

            const passwordElement =
                document.getElementById("password");

            const confirmPasswordElement =
                document.getElementById("confirmPassword");


            if (
                !fullnameElement ||
                !emailElement ||
                !passwordElement
            ) {

                showMessage(
                    "❌ Required form fields are missing.",
                    "red"
                );

                return;
            }


            const fullname =
                fullnameElement.value.trim();

            const email =
                emailElement.value.trim();

            const password =
                passwordElement.value;

            const confirmPassword =
                confirmPasswordElement
                    ? confirmPasswordElement.value
                    : "";


            // =====================================
            // VALIDATION
            // =====================================


            // -------------------------------------
            // Full name
            // -------------------------------------

            if (!fullname) {

                showMessage(
                    "❌ Full Name is required.",
                    "red"
                );

                return;

            }


            if (fullname.length < 3) {

                showMessage(
                    "❌ Full Name must contain at least 3 characters.",
                    "red"
                );

                return;

            }


            // -------------------------------------
            // Email
            // -------------------------------------

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (!email) {

                showMessage(
                    "❌ Email is required.",
                    "red"
                );

                return;

            }


            if (!emailPattern.test(email)) {

                showMessage(
                    "❌ Invalid email format.",
                    "red"
                );

                return;

            }


            // -------------------------------------
            // Password
            // -------------------------------------

            if (!password) {

                showMessage(
                    "❌ Password is required.",
                    "red"
                );

                return;

            }


            if (password.length < 8) {

                showMessage(
                    "❌ Password must be at least 8 characters long.",
                    "red"
                );

                return;

            }


            // Strong password:
            // uppercase
            // lowercase
            // number
            // special character

            const strongPassword =
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;


            if (
                !strongPassword.test(password)
            ) {

                showMessage(
                    "❌ Password must contain uppercase, lowercase, number, and special character.",
                    "red"
                );

                return;

            }


            // -------------------------------------
            // Confirm password
            // -------------------------------------

            if (
                confirmPasswordElement &&
                !confirmPassword
            ) {

                showMessage(
                    "❌ Please confirm your password.",
                    "red"
                );

                return;

            }


            if (
                confirmPasswordElement &&
                password !== confirmPassword
            ) {

                showMessage(
                    "❌ Passwords do not match.",
                    "red"
                );

                return;

            }


            // =====================================
            // DISABLE BUTTON
            // =====================================

            if (signupBtn) {

                signupBtn.disabled =
                    true;

                signupBtn.textContent =
                    "Creating Account...";

            }


            showMessage(
                "Creating your account...",
                "#2563eb"
            );


            try {

                // =================================
                // SEND TO NODE.JS
                // =================================

                console.log(
                    "Sending signup request to:",
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
                                    fullname,
                                    email,
                                    password
                                })
                        }
                    );


                // =================================
                // READ RESPONSE
                // =================================

                const responseText =
                    await response.text();


                console.log(
                    "Signup response:",
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
                            "Invalid JSON from server:",
                            responseText
                        );

                        throw new Error(
                            "Server returned HTML/text instead of JSON."
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
                        `Signup failed. Server returned HTTP ${response.status}.`
                    );

                }


                // =================================
                // STORE USER ID
                // =================================
                //
                // This is important for the profile
                // page to identify the registered user.
                //
                // DO NOT store the password.
                // =================================

                if (
                    data.userId !== undefined &&
                    data.userId !== null
                ) {

                    localStorage.setItem(
                        "userId",
                        String(data.userId)
                    );

                    console.log(
                        "User ID saved:",
                        data.userId
                    );

                }


                // =================================
                // SUCCESS
                // =================================

                showMessage(
                    "✅ Account created successfully! Redirecting to login...",
                    "green"
                );


                // Clear form

                signupForm.reset();


                // =================================
                // 1 SECOND REDIRECT
                // =================================

                setTimeout(
                    () => {

                        window.location.href =
                            "login.html";

                    },
                    1000
                );


            } catch (error) {

                console.error(
                    "SIGNUP ERROR:",
                    error
                );


                showMessage(
                    "❌ " + error.message,
                    "red"
                );


                // Enable button again

                if (signupBtn) {

                    signupBtn.disabled =
                        false;

                    signupBtn.textContent =
                        "Sign Up";

                }

            }

        }
    );


    // =========================================
    // LIVE PREVIEW / VALIDATION
    // =========================================

    const passwordInput =
        document.getElementById("password");


    const confirmPasswordInput =
        document.getElementById("confirmPassword");


    if (
        passwordInput &&
        confirmPasswordInput
    ) {

        confirmPasswordInput.addEventListener(
            "input",
            () => {

                if (
                    confirmPasswordInput.value === ""
                ) {

                    return;

                }


                if (
                    passwordInput.value !==
                    confirmPasswordInput.value
                ) {

                    showMessage(
                        "❌ Passwords do not match.",
                        "red"
                    );

                } else {

                    showMessage(
                        "✅ Passwords match.",
                        "green"
                    );

                }

            }
        );

    }

});


// =========================================
// DISPLAY MESSAGE
// =========================================

function showMessage(
    text,
    color
) {

    const message =
        document.getElementById("message");


    if (!message) {

        console.log(text);

        return;
    }


    message.style.color =
        color;

    message.textContent =
        text;

}

