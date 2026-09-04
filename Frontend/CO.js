
"use strict";

document.addEventListener("DOMContentLoaded", () => {

    console.log("CO.js loaded successfully");

    // =========================================
    // API
    // =========================================

    const API_URL =
        "http://localhost:5000/api/companies";

    const USER_PROFILE_API_URL =
        "http://localhost:5000/api/user-profile";

    const APPLICATION_API_URL =
        "http://localhost:5000/api/applications";


    // =========================================
    // HTML ELEMENTS
    // =========================================

    const companyContainer =
        document.getElementById("companyContainer");

    const companyName =
        document.getElementById("companyName");

    const companyIndustry =
        document.getElementById("companyIndustry");

    const companyAbout =
        document.getElementById("companyAbout");

    const industry =
        document.getElementById("industry");

    const location =
        document.getElementById("location");

    const companyLogo =
        document.getElementById("companyLogo");

    const websiteLink =
        document.getElementById("websiteLink");

    const searchCompany =
        document.getElementById("searchCompany");

    const followBtn =
        document.getElementById("followBtn");

    const applyBtn =
        document.getElementById("applyBtn");

    const applicationMessage =
        document.getElementById(
            "applicationMessage"
        );


    // =========================================
    // COMPANY DATA
    // =========================================

    let companies = [];

    let selectedCompany = null;


    // =========================================
    // AUTHENTICATION
    // =========================================

    function getAuthToken() {

        return localStorage.getItem(
            "authToken"
        );

    }


    function getLoggedInUserId() {

        const userId =
            Number(
                localStorage.getItem(
                    "userId"
                )
            );


        if (
            !Number.isInteger(userId) ||
            userId <= 0
        ) {

            return null;

        }


        return userId;

    }


    // =========================================
    // GET COMPANY INITIAL
    // =========================================

    function getCompanyInitial(
        company
    ) {

        const name =
            company?.company_name ||
            "C";


        return name
            .charAt(0)
            .toUpperCase();

    }


    // =========================================
    // ESCAPE HTML
    // =========================================

    function escapeHTML(
        value
    ) {

        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    // =========================================
    // CREATE LOGO FALLBACK
    // =========================================

    function createLogoFallback(
        company,
        className
    ) {

        const fallback =
            document.createElement(
                "div"
            );


        fallback.className =
            className;


        fallback.textContent =
            getCompanyInitial(
                company
            );


        fallback.setAttribute(
            "aria-label",
            `${company?.company_name || "Company"} logo`
        );


        return fallback;

    }


    // =========================================
    // GET LOGO URL FROM DATABASE
    // =========================================

    function getLogo(
        company
    ) {

        if (
            company &&
            typeof company.logo ===
                "string" &&
            company.logo.trim() !== ""
        ) {

            return company.logo.trim();

        }


        return null;

    }


    // =========================================
    // APPLICATION MESSAGE
    // =========================================

    function showApplicationMessage(
        message,
        success = true
    ) {

        if (!applicationMessage) {

            alert(message);

            return;

        }


        applicationMessage.textContent =
            message;


        applicationMessage.style.display =
            "block";


        applicationMessage.style.marginTop =
            "15px";


        applicationMessage.style.padding =
            "12px 15px";


        applicationMessage.style.borderRadius =
            "10px";


        applicationMessage.style.fontSize =
            "14px";


        if (success) {

            applicationMessage.style.background =
                "#dcfce7";

            applicationMessage.style.color =
                "#166534";

            applicationMessage.style.border =
                "1px solid #86efac";

        } else {

            applicationMessage.style.background =
                "#fee2e2";

            applicationMessage.style.color =
                "#991b1b";

            applicationMessage.style.border =
                "1px solid #fca5a5";

        }

    }


    // =========================================
    // GET SELECTED JOB ID
    // =========================================
    /*
     * The company page can receive a job ID in
     * one of three ways:
     *
     * 1. window.selectedJobId
     * 2. localStorage.selectedJobId
     * 3. URL ?jobId=123
     */

    function getSelectedJobId() {

        // --------------------------------------
        // Option 1:
        // window.selectedJobId
        // --------------------------------------

        const windowJobId =
            Number(
                window.selectedJobId
            );


        if (
            Number.isInteger(
                windowJobId
            ) &&
            windowJobId > 0
        ) {

            return windowJobId;

        }


        // --------------------------------------
        // Option 2:
        // localStorage
        // --------------------------------------

        const storedJobId =
            Number(
                localStorage.getItem(
                    "selectedJobId"
                )
            );


        if (
            Number.isInteger(
                storedJobId
            ) &&
            storedJobId > 0
        ) {

            return storedJobId;

        }


        // --------------------------------------
        // Option 3:
        // URL parameter
        // --------------------------------------

        const params =
            new URLSearchParams(
                window.location.search
            );


        const urlJobId =
            Number(
                params.get(
                    "jobId"
                )
            );


        if (
            Number.isInteger(
                urlJobId
            ) &&
            urlJobId > 0
        ) {

            return urlJobId;

        }


        return null;

    }


    // =========================================
    // FETCH CURRENT USER PROFILE
    // =========================================

    async function getCurrentUserProfile() {

        const token =
            getAuthToken();


        const userId =
            getLoggedInUserId();


        // --------------------------------------
        // Check authentication
        // --------------------------------------

        if (!token) {

            throw new Error(
                "Please login before applying."
            );

        }


        if (!userId) {

            throw new Error(
                "User ID not found. Please login again."
            );

        }


        // --------------------------------------
        // Request candidate profile
        // --------------------------------------

        const response =
            await fetch(
                `${USER_PROFILE_API_URL}/${userId}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        // --------------------------------------
        // Session expired
        // --------------------------------------

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            localStorage.removeItem(
                "authToken"
            );

            localStorage.removeItem(
                "userId"
            );

            localStorage.removeItem(
                "username"
            );

            localStorage.removeItem(
                "loginEmail"
            );


            throw new Error(
                "Your login session has expired. Please login again."
            );

        }


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        let data;


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        } else {

            data =
                await response.text();

        }


        if (!response.ok) {

            throw new Error(

                typeof data ===
                    "object"

                    ? (
                        data.message ||
                        data.error ||
                        "Unable to load your profile."
                    )

                    : (
                        data ||
                        "Unable to load your profile."
                    )

            );

        }


        const profile =
            data?.profile ||
            data;


        if (!profile) {

            throw new Error(
                "Candidate profile was not found."
            );

        }


        return profile;

    }


    // =========================================
    // APPLY TO COMPANY
    // =========================================

    async function applyToCompany() {

        // --------------------------------------
        // Check selected company
        // --------------------------------------

        if (!selectedCompany) {

            showApplicationMessage(
                "Please select a company first.",
                false
            );

            return;

        }


        // --------------------------------------
        // Check login token
        // --------------------------------------

        const token =
            getAuthToken();


        if (!token) {

            showApplicationMessage(
                "Please login before applying.",
                false
            );


            window.location.href =
                "login.html";


            return;

        }


        // --------------------------------------
        // Disable button
        // --------------------------------------

        if (applyBtn) {

            applyBtn.disabled =
                true;


            applyBtn.dataset.originalHTML =
                applyBtn.innerHTML;


            applyBtn.innerHTML =
                `
                <i class="fas fa-spinner fa-spin"></i>
                Sending Profile...
                `;

        }


        try {

            // =====================================
            // GET CANDIDATE PROFILE
            // =====================================

            const profile =
                await getCurrentUserProfile();


            console.log(
                "Candidate profile:",
                profile
            );


            // =====================================
            // GET JOB ID
            // =====================================

            const jobId =
                getSelectedJobId();


            // =====================================
            // CANDIDATE USER ID
            // =====================================

            const userId =
                getLoggedInUserId();


            // =====================================
            // CREATE APPLICATION DATA
            // =====================================

            const applicationData = {

                /*
                 * Company receiving the application
                 */
                company_id:
                    Number(
                        selectedCompany.id
                    ),


                /*
                 * Specific job.
                 *
                 * Can be null when the company
                 * page is not connected to a job.
                 */
                job_id:
                    jobId,


                /*
                 * Candidate profile.
                 *
                 * The backend should still use
                 * req.user.id from the JWT as the
                 * authoritative user ID.
                 */
                profile: {

                    user_id:
                        profile.user_id ??
                        profile.userId ??
                        profile.id ??
                        userId,


                    name:
                        profile.name ??
                        profile.full_name ??
                        profile.username ??
                        "",


                    headline:
                        profile.headline ??
                        "",


                    tagline:
                        profile.tagline ??
                        "",


                    location:
                        profile.location ??
                        "",


                    connections:
                        profile.connections ??
                        0,


                    followers:
                        profile.followers ??
                        0,


                    about:
                        profile.about ??
                        "",


                    email:
                        profile.email ??
                        "",


                    phone:
                        profile.phone ??
                        "",


                    github:
                        profile.github ??
                        "",


                    linkedin:
                        profile.linkedin ??
                        "",


                    education:
                        profile.education ??
                        "",


                    experience:
                        profile.experience ??
                        "",


                    projects:
                        profile.projects ??
                        "",


                    skills:
                        profile.skills ??
                        "",


                    certifications:
                        profile.certifications ??
                        "",


                    achievements:
                        profile.achievements ??
                        "",


                    achievement_1:
                        profile.achievement_1 ??
                        "",


                    achievement_2:
                        profile.achievement_2 ??
                        "",


                    achievement_3:
                        profile.achievement_3 ??
                        "",


                    achievement_4:
                        profile.achievement_4 ??
                        "",


                    achievement_5:
                        profile.achievement_5 ??
                        "",


                    achievement_6:
                        profile.achievement_6 ??
                        "",


                    profile_pic:
                        profile.profile_pic ??
                        profile.profilePic ??
                        "",


                    banner_image:
                        profile.banner_image ??
                        profile.bannerImage ??
                        ""

                }

            };


            console.log(
                "Application being sent:",
                applicationData
            );


            // =====================================
            // SEND APPLICATION TO NODE.JS
            // =====================================

            const response =
                await fetch(
                    APPLICATION_API_URL,
                    {
                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`

                        },

                        body:
                            JSON.stringify(
                                applicationData
                            )

                    }
                );


            // =====================================
            // READ RESPONSE
            // =====================================

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";


            let data;


            if (
                contentType.includes(
                    "application/json"
                )
            ) {

                data =
                    await response.json();

            } else {

                data =
                    await response.text();

            }


            // =====================================
            // AUTHORIZATION ERROR
            // =====================================

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                localStorage.removeItem(
                    "authToken"
                );

                localStorage.removeItem(
                    "userId"
                );

                localStorage.removeItem(
                    "username"
                );

                localStorage.removeItem(
                    "loginEmail"
                );


                throw new Error(
                    "Your login session has expired. Please login again."
                );

            }


            // =====================================
            // SERVER ERROR
            // =====================================

            if (!response.ok) {

                throw new Error(

                    typeof data ===
                        "object"

                        ? (
                            data.message ||
                            data.error ||
                            "Application submission failed."
                        )

                        : (
                            data ||
                            "Application submission failed."
                        )

                );

            }


            // =====================================
            // SUCCESS
            // =====================================

            console.log(
                "Application submitted:",
                data
            );


            showApplicationMessage(
                data?.message ||
                `Your profile has been sent to ${selectedCompany.company_name}.`,
                true
            );


            // --------------------------------------
            // Change button
            // --------------------------------------

            if (applyBtn) {

                applyBtn.disabled =
                    true;


                applyBtn.classList.add(
                    "applied"
                );


                applyBtn.innerHTML =
                    `
                    <i class="fas fa-check"></i>
                    Applied
                    `;

            }


            // =====================================
            // SAVE UI STATE
            // =====================================

            sessionStorage.setItem(
                "lastApplication",
                JSON.stringify({

                    companyId:
                        selectedCompany.id,

                    companyName:
                        selectedCompany.company_name,

                    jobId:
                        jobId,

                    userId:
                        userId,

                    appliedAt:
                        new Date().toISOString()

                })
            );


        } catch (error) {

            console.error(
                "Application error:",
                error
            );


            showApplicationMessage(
                error.message ||
                "Unable to submit application.",
                false
            );


            // --------------------------------------
            // Restore button
            // --------------------------------------

            if (applyBtn) {

                applyBtn.disabled =
                    false;


                applyBtn.innerHTML =
                    applyBtn.dataset.originalHTML ||
                    `
                    <i class="fas fa-paper-plane"></i>
                    Apply Now
                    `;

            }

        }

    }


    // =========================================
    // SHOW COMPANY DETAILS
    // =========================================

    function showCompany(
        company
    ) {

        if (!company) {

            return;

        }


        // --------------------------------------
        // Store selected company
        // --------------------------------------

        selectedCompany =
            company;


        /*
         * Make the selected company available
         * to other JavaScript code as well.
         */

        window.selectedCompany =
            company;


        window.selectedCompanyId =
            Number(
                company.id
            );


        // =====================================
        // COMPANY NAME
        // =====================================

        if (companyName) {

            companyName.textContent =
                company.company_name ||
                "Company";

        }


        // =====================================
        // INDUSTRY
        // =====================================

        if (companyIndustry) {

            companyIndustry.textContent =
                company.industry ||
                "Industry not available";

        }


        // =====================================
        // ABOUT
        // =====================================

        if (companyAbout) {

            companyAbout.textContent =
                company.about ||
                "No company information available.";

        }


        // =====================================
        // INDUSTRY DETAIL
        // =====================================

        if (industry) {

            industry.textContent =
                company.industry ||
                "Not available";

        }


        // =====================================
        // LOCATION
        // =====================================

        if (location) {

            location.textContent =
                company.location ||
                "Not available";

        }


        // =====================================
        // MAIN COMPANY LOGO
        // =====================================

        const logoUrl =
            getLogo(company);


        const oldFallback =
            document.getElementById(
                "mainLogoFallback"
            );


        if (oldFallback) {

            oldFallback.remove();

        }


        if (logoUrl) {

            if (companyLogo) {

                companyLogo.src =
                    logoUrl;


                companyLogo.alt =
                    `${company.company_name || "Company"} Logo`;


                companyLogo.style.display =
                    "block";


                companyLogo.onload =
                    () => {

                        companyLogo.style.display =
                            "block";

                    };


                companyLogo.onerror =
                    () => {

                        companyLogo.style.display =
                            "none";


                        const fallback =
                            createLogoFallback(
                                company,
                                "company-text-logo main-logo-fallback"
                            );


                        fallback.id =
                            "mainLogoFallback";


                        companyLogo.parentNode.insertBefore(
                            fallback,
                            companyLogo
                        );

                    };

            }

        } else {

            if (companyLogo) {

                companyLogo.style.display =
                    "none";


                const fallback =
                    createLogoFallback(
                        company,
                        "company-text-logo main-logo-fallback"
                    );


                fallback.id =
                    "mainLogoFallback";


                companyLogo.parentNode.insertBefore(
                    fallback,
                    companyLogo
                );

            }

        }


        // =====================================
        // WEBSITE
        // =====================================

        if (
            company.website &&
            String(
                company.website
            ).trim() !== ""
        ) {

            const companyWebsite =
                String(
                    company.website
                ).trim();


            if (websiteLink) {

                websiteLink.href =
                    companyWebsite;


                websiteLink.textContent =
                    "Visit Website";


                websiteLink.target =
                    "_blank";


                websiteLink.rel =
                    "noopener noreferrer";


                websiteLink.style.pointerEvents =
                    "auto";


                websiteLink.style.opacity =
                    "1";

            }

        } else {

            if (websiteLink) {

                websiteLink.removeAttribute(
                    "href"
                );


                websiteLink.textContent =
                    "Website not available";


                websiteLink.style.pointerEvents =
                    "none";


                websiteLink.style.opacity =
                    "0.6";

            }

        }


        // =====================================
        // APPLY BUTTON STATE
        // =====================================

        if (applyBtn) {

            applyBtn.disabled =
                false;


            applyBtn.classList.remove(
                "applied"
            );


            applyBtn.innerHTML =
                `
                <i class="fas fa-paper-plane"></i>
                Apply Now
                `;


            // ----------------------------------
            // Check session state
            // ----------------------------------

            const lastApplication =
                sessionStorage.getItem(
                    "lastApplication"
                );


            if (lastApplication) {

                try {

                    const saved =
                        JSON.parse(
                            lastApplication
                        );


                    const sameCompany =
                        String(
                            saved.companyId
                        ) ===
                        String(
                            company.id
                        );


                    const currentJobId =
                        getSelectedJobId();


                    const sameJob =
                        !currentJobId ||
                        !saved.jobId ||
                        String(
                            saved.jobId
                        ) ===
                        String(
                            currentJobId
                        );


                    if (
                        sameCompany &&
                        sameJob
                    ) {

                        applyBtn.disabled =
                            true;


                        applyBtn.classList.add(
                            "applied"
                        );


                        applyBtn.innerHTML =
                            `
                            <i class="fas fa-check"></i>
                            Applied
                            `;

                    }

                } catch (error) {

                    console.warn(
                        "Could not read application state:",
                        error
                    );

                }

            }

        }

    }


    // =========================================
    // RENDER COMPANY LIST
    // =========================================

    function renderCompanies(
        companyData
    ) {

        if (!companyContainer) {

            return;

        }


        companyContainer.innerHTML =
            "";


        // =====================================
        // NO COMPANIES
        // =====================================

        if (
            !companyData ||
            companyData.length === 0
        ) {

            companyContainer.innerHTML =
                `
                <div class="loading-message">
                    No companies found.
                </div>
                `;

            return;

        }


        // =====================================
        // CREATE COMPANY CARDS
        // =====================================

        companyData.forEach(
            company => {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "company-item";


                card.dataset.companyId =
                    company.id ??
                    "";


                // =================================
                // LOGO URL
                // =================================

                const logoUrl =
                    getLogo(
                        company
                    );


                // =================================
                // CARD HTML
                // =================================

                card.innerHTML =
                    `
                    <div class="company-logo-container">

                        ${
                            logoUrl
                                ? `
                                    <img
                                        src="${escapeHTML(
                                            logoUrl
                                        )}"
                                        alt="${escapeHTML(
                                            company.company_name ||
                                            "Company"
                                        )} Logo"
                                        class="company-list-logo"
                                    >
                                  `
                                : ""
                        }

                    </div>


                    <div class="company-info">

                        <h3>
                            ${escapeHTML(
                                company.company_name ||
                                "Company"
                            )}
                        </h3>


                        <p>
                            ${escapeHTML(
                                company.industry ||
                                "Industry not available"
                            )}
                        </p>

                    </div>
                    `;


                // =================================
                // CARD LOGO
                // =================================

                const logoContainer =
                    card.querySelector(
                        ".company-logo-container"
                    );


                const image =
                    card.querySelector(
                        ".company-list-logo"
                    );


                if (image) {

                    image.onload =
                        () => {

                            image.style.display =
                                "block";

                        };


                    image.onerror =
                        () => {

                            image.remove();


                            const fallback =
                                createLogoFallback(
                                    company,
                                    "company-text-logo company-list-fallback"
                                );


                            logoContainer.appendChild(
                                fallback
                            );

                        };

                } else {

                    const fallback =
                        createLogoFallback(
                            company,
                            "company-text-logo company-list-fallback"
                        );


                    logoContainer.appendChild(
                        fallback
                    );

                }


                // =================================
                // CARD CLICK
                // =================================

                card.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".company-item"
                            )
                            .forEach(
                                item => {

                                    item.classList.remove(
                                        "active"
                                    );

                                }
                            );


                        card.classList.add(
                            "active"
                        );


                        showCompany(
                            company
                        );

                    }
                );


                // =================================
                // ADD CARD
                // =================================

                companyContainer.appendChild(
                    card
                );

            }
        );

    }


    // =========================================
    // LOAD COMPANIES FROM NODE.JS API
    // =========================================

    async function loadCompanies() {

        console.log(
            "Calling API:",
            API_URL
        );


        if (companyContainer) {

            companyContainer.innerHTML =
                `
                <div class="loading-message">
                    Loading companies...
                </div>
                `;

        }


        try {

            const response =
                await fetch(
                    API_URL
                );


            console.log(
                "API response status:",
                response.status
            );


            if (!response.ok) {

                throw new Error(
                    `API returned status ${response.status}`
                );

            }


            const data =
                await response.json();


            console.log(
                "Data received from API:",
                data
            );


            if (!Array.isArray(data)) {

                throw new Error(
                    "API did not return an array of companies."
                );

            }


            // =====================================
            // SAVE COMPANY DATA
            // =====================================

            companies =
                data;


            // =====================================
            // RENDER COMPANY LIST
            // =====================================

            renderCompanies(
                companies
            );


            // =====================================
            // SELECT FIRST COMPANY
            // =====================================

            if (
                companies.length > 0
            ) {

                showCompany(
                    companies[0]
                );


                const firstCard =
                    document.querySelector(
                        ".company-item"
                    );


                if (firstCard) {

                    firstCard.classList.add(
                        "active"
                    );

                }

            }

        } catch (error) {

            console.error(
                "API FETCH ERROR:",
                error
            );


            if (companyContainer) {

                companyContainer.innerHTML =
                    `
                    <div class="loading-message">

                        Error loading companies.

                        <br>
                        <br>

                        Please make sure the Node.js server
                        is running on port 5000.

                    </div>
                    `;

            }

        }

    }


    // =========================================
    // COMPANY SEARCH
    // =========================================

    if (searchCompany) {

        searchCompany.addEventListener(
            "input",
            function () {

                const searchText =
                    this.value
                        .trim()
                        .toLowerCase();


                // =================================
                // FILTER COMPANIES
                // =================================

                const filtered =
                    companies.filter(
                        company => {

                            const name =
                                (
                                    company.company_name ||
                                    ""
                                )
                                .toLowerCase();


                            const companyIndustry =
                                (
                                    company.industry ||
                                    ""
                                )
                                .toLowerCase();


                            const companyLocation =
                                (
                                    company.location ||
                                    ""
                                )
                                .toLowerCase();


                            return (

                                name.includes(
                                    searchText
                                )

                                ||

                                companyIndustry.includes(
                                    searchText
                                )

                                ||

                                companyLocation.includes(
                                    searchText
                                )

                            );

                        }
                    );


                // =================================
                // RENDER RESULTS
                // =================================

                renderCompanies(
                    filtered
                );


                // =================================
                // SHOW FIRST SEARCH RESULT
                // =================================

                if (
                    filtered.length > 0
                ) {

                    showCompany(
                        filtered[0]
                    );


                    const firstCard =
                        document.querySelector(
                            ".company-item"
                        );


                    if (firstCard) {

                        firstCard.classList.add(
                            "active"
                        );

                    }

                } else {

                    selectedCompany =
                        null;


                    if (applyBtn) {

                        applyBtn.disabled =
                            true;


                        applyBtn.innerHTML =
                            `
                            <i class="fas fa-paper-plane"></i>
                            Apply Now
                            `;

                    }

                }

            }
        );

    }


    // =========================================
    // APPLY BUTTON EVENT
    // =========================================

    if (applyBtn) {

        applyBtn.addEventListener(
            "click",
            async event => {

                event.preventDefault();

                event.stopPropagation();


                await applyToCompany();

            }
        );

    }


    // =========================================
    // FOLLOW BUTTON
    // =========================================

    if (followBtn) {

        followBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();


                if (!selectedCompany) {

                    showApplicationMessage(
                        "Please select a company first.",
                        false
                    );

                    return;

                }


                const following =
                    followBtn.dataset.following ===
                    "true";


                if (!following) {

                    followBtn.dataset.following =
                        "true";


                    followBtn.textContent =
                        "Following";


                    followBtn.classList.add(
                        "following"
                    );

                } else {

                    followBtn.dataset.following =
                        "false";


                    followBtn.textContent =
                        "Follow Company";


                    followBtn.classList.remove(
                        "following"
                    );

                }

            }
        );

    }


    // =========================================
    // START
    // =========================================

    loadCompanies();

});

