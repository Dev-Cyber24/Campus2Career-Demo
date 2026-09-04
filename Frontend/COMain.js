
"use strict";

/* =========================================================
   CAMPUS2CAREER COMPANY PORTAL
   PART 1 OF 2

   Updated for:
   - companies + company_profiles storage
   - recruiter-owned company profiles
   - real MySQL company data
   - real applicant analytics
   - recruiter candidate search
========================================================= */

const API_BASE_URL = "http://localhost:5000/api";
const COMPANY_API = `${API_BASE_URL}/company`;
const COMPANY_PROFILE_API = `${COMPANY_API}/my-profile`;
const COMPANY_JOBS_API = `${COMPANY_API}/jobs`;
const COMPANY_APPLICANTS_API = `${COMPANY_API}/applicants`;
const COMPANY_APPLICATION_STATUS_API = `${COMPANY_API}/applications`;
const COMPANY_CANDIDATES_API = `${COMPANY_API}/candidates/search`;
const COMPANY_ANALYTICS_API = `${COMPANY_API}/analytics`;
const USER_PROFILE_API = `${API_BASE_URL}/user-profile`;
const USER_PROFILES_API = `${API_BASE_URL}/user-profiles`;
const TOKEN_KEY = "authToken";

let companyProfile = null;
let jobs = [];
let applicants = [];
let candidateResults = [];
let searchableUserProfiles = [];
let analyticsData = null;
let editingJobId = null;
let currentApplicantId = null;
let selectedCandidateProfile = null;

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", initializeCompanyPortal);

async function initializeCompanyPortal() {
    try {
        if (!getAuthToken()) {
            window.location.href = "login.html";
            return;
        }

        setupNavigation();
        setupJobControls();
        setupApplicantControls();
        setupPipeline();
        setupCandidateSearch();
        setupCompanyProfileControls();
        setupTheme();
        setupHeaderDropdown();
        setupNotifications();
        setupLogout();
        setupGlobalSearch();
        createReadOnlyProfileModal();

        await loadAllCompanyData();
    } catch (error) {
        console.error("Company portal initialization error:", error);
        showToast("Unable to load company portal.");
    }
}

/* =========================================================
   AUTHENTICATION / RESPONSE
========================================================= */

function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY);
}

async function authenticatedFetch(url, options = {}) {
    const token = getAuthToken();

    if (!token) {
        window.location.href = "login.html";
        return null;
    }

    const headers = {
        ...(options.body instanceof FormData
            ? {}
            : {
                "Content-Type": "application/json"
            }),
        ...(options.headers || {}),
        "Authorization": `Bearer ${token}`
    };

    let response;

    try {
        response = await fetch(url, {
            ...options,
            headers
        });
    } catch (error) {
        console.error("Network error:", error);
        throw new Error("Unable to connect to the backend server.");
    }

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        localStorage.removeItem("loginEmail");

        window.location.href = "login.html";
        return null;
    }

    return response;
}

async function parseResponse(response) {
    if (!response) {
        throw new Error("No response received from server.");
    }

    let data = null;

    const contentType =
        response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (!response.ok) {
        const message =
            typeof data === "object"
                ? (
                    data.message ||
                    data.error ||
                    "Server request failed."
                )
                : (
                    data ||
                    "Server request failed."
                );

        throw new Error(message);
    }

    return data;
}

/* =========================================================
   LOAD ALL COMPANY DATA
========================================================= */

async function loadAllCompanyData() {
    try {
        await loadCompanyProfile();
    } catch (error) {
        console.error("Company profile loading failed:", error);
        showToast(error.message);
    }

    try {
        await loadJobs();
    } catch (error) {
        console.error("Jobs loading failed:", error);
        jobs = [];
        showJobsError(error.message);
    }

    try {
        await loadApplicants();
    } catch (error) {
        console.error("Applicants loading failed:", error);
        applicants = [];
        showApplicantsError(error.message);
    }

    try {
        await loadAnalytics();
    } catch (error) {
        console.error("Analytics loading failed:", error);
        analyticsData = null;
    }

    try {
        await loadSearchableUserProfiles();
    } catch (error) {
        console.error(
            "User profile search loading failed:",
            error
        );
        searchableUserProfiles = [];
    }

    renderEverything();
}

/* =========================================================
   COMPANY PROFILE API
========================================================= */

async function loadCompanyProfile() {
    const response =
        await authenticatedFetch(
            COMPANY_PROFILE_API
        );

    const data =
        await parseResponse(response);

    companyProfile =
        normalizeCompanyProfile(
            data?.profile || data
        );

    applyCompanyProfile();
}

/* =========================================================
   NORMALIZE COMPANY PROFILE
   Supports:
   companies + company_profiles
========================================================= */

function normalizeCompanyProfile(data) {
    data = data || {};

    return {
        id:
            data.id ??
            data.company_id ??
            null,

        name:
            data.company_name ??
            data.name ??
            "Company",

        companyName:
            data.company_name ??
            data.name ??
            "Company",

        industry:
            data.industry ??
            "",

        size:
            data.company_size ??
            data.size ??
            "",

        location:
            data.location ??
            data.headquarters ??
            "",

        headquarters:
            data.headquarters ??
            "",

        foundedYear:
            data.founded_year ??
            "",

        companyType:
            data.company_type ??
            "Private",

        status:
            data.status ??
            "Active",

        website:
            data.website ??
            "",

        email:
            data.email ??
            data.contact_email ??
            "",

        phone:
            data.phone ??
            data.contact_phone ??
            "",

        careersEmail:
            data.careers_email ??
            data.careersEmail ??
            data.email ??
            "",

        linkedin:
            data.linkedin ??
            "",

        github:
            data.github ??
            "",

        twitter:
            data.twitter ??
            "",

        about:
            data.about ??
            data.description ??
            "",

        logo:
            data.logo ??
            data.logo_url ??
            "https://via.placeholder.com/200",

        bannerImage:
            data.banner_image ??
            data.banner_url ??
            "",

        mission:
            data.mission ??
            "",

        vision:
            data.vision ??
            "",

        description:
            data.description ??
            data.about ??
            "",

        culture:
            data.culture ??
            "",

        benefits:
            data.benefits ??
            "",

        productsServices:
            data.products_services ??
            "",

        contactPerson:
            data.contact_person ??
            "",

        contactEmail:
            data.contact_email ??
            data.email ??
            "",

        contactPhone:
            data.contact_phone ??
            data.phone ??
            "",

        addressLine1:
            data.address_line1 ??
            "",

        addressLine2:
            data.address_line2 ??
            "",

        city:
            data.city ??
            "",

        state:
            data.state ??
            "",

        country:
            data.country ??
            "",

        postalCode:
            data.postal_code ??
            "",

        employeeCount:
            Number(data.employee_count) || 0
    };
}

/* =========================================================
   APPLY COMPANY PROFILE
========================================================= */

function applyCompanyProfile() {
    if (!companyProfile) {
        return;
    }

    setText(
        "headerCompanyName",
        companyProfile.name
    );

    setText(
        "sidebarCompanyName",
        companyProfile.name
    );

    setText(
        "sidebarCompanyIndustry",
        companyProfile.industry ||
        "Industry not specified"
    );

    setText(
        "sidebarCompanyLocation",
        companyProfile.location ||
        "Location not specified"
    );

    setText(
        "dashboardCompanyName",
        companyProfile.name
    );

    setImage(
        "headerCompanyLogo",
        companyProfile.logo
    );

    setImage(
        "sidebarCompanyLogo",
        companyProfile.logo
    );

    setImage(
        "editorCompanyLogo",
        companyProfile.logo
    );

    setImage(
        "previewCompanyLogo",
        companyProfile.logo
    );

    setInputValue(
        "editCompanyName",
        companyProfile.name
    );

    setInputValue(
        "editIndustry",
        companyProfile.industry
    );

    setInputValue(
        "editCompanySize",
        companyProfile.size
    );

    setInputValue(
        "editLocation",
        companyProfile.location
    );

    setInputValue(
        "editWebsite",
        companyProfile.website
    );

    setInputValue(
        "editEmail",
        companyProfile.email
    );

    setInputValue(
        "editCareersEmail",
        companyProfile.careersEmail
    );

    setInputValue(
        "editLinkedin",
        companyProfile.linkedin
    );

    setInputValue(
        "editAbout",
        companyProfile.about
    );

    setInputValue(
        "editBenefits",
        companyProfile.benefits
    );

    setInputValue(
        "editMission",
        companyProfile.mission
    );

    setInputValue(
        "editVision",
        companyProfile.vision
    );

    setInputValue(
        "editDescription",
        companyProfile.description
    );

    setInputValue(
        "editCulture",
        companyProfile.culture
    );

    setInputValue(
        "editProductsServices",
        companyProfile.productsServices
    );

    setInputValue(
        "editContactPerson",
        companyProfile.contactPerson
    );

    setInputValue(
        "editContactEmail",
        companyProfile.contactEmail
    );

    setInputValue(
        "editContactPhone",
        companyProfile.contactPhone
    );

    setInputValue(
        "editHeadquarters",
        companyProfile.headquarters
    );

    setInputValue(
        "editFoundedYear",
        companyProfile.foundedYear
    );

    setInputValue(
        "editCompanyType",
        companyProfile.companyType
    );

    setInputValue(
        "editEmployeeCount",
        companyProfile.employeeCount
    );

    setInputValue(
        "editAddressLine1",
        companyProfile.addressLine1
    );

    setInputValue(
        "editAddressLine2",
        companyProfile.addressLine2
    );

    setInputValue(
        "editCity",
        companyProfile.city
    );

    setInputValue(
        "editState",
        companyProfile.state
    );

    setInputValue(
        "editCountry",
        companyProfile.country
    );

    setInputValue(
        "editPostalCode",
        companyProfile.postalCode
    );

    setInputValue(
        "editGithub",
        companyProfile.github
    );

    setInputValue(
        "editTwitter",
        companyProfile.twitter
    );

    updateCompanyPreview();
}

/* =========================================================
   SAVE COMPANY PROFILE
========================================================= */

async function saveCompanyProfile() {
    if (!companyProfile) {
        showToast("Company profile is not loaded.");
        return;
    }

    const updatedProfile = {
        company_name:
            getInputValue("editCompanyName").trim(),

        name:
            getInputValue("editCompanyName").trim(),

        industry:
            getInputValue("editIndustry").trim(),

        company_size:
            getInputValue("editCompanySize").trim(),

        size:
            getInputValue("editCompanySize").trim(),

        location:
            getInputValue("editLocation").trim(),

        headquarters:
            getInputValue("editHeadquarters").trim(),

        founded_year:
            getNullableNumber("editFoundedYear"),

        company_type:
            getInputValue("editCompanyType").trim(),

        website:
            getInputValue("editWebsite").trim(),

        email:
            getInputValue("editEmail").trim(),

        phone:
            getInputValue("editContactPhone").trim() ||
            getInputValue("editPhone").trim(),

        careers_email:
            getInputValue("editCareersEmail").trim(),

        linkedin:
            getInputValue("editLinkedin").trim(),

        github:
            getInputValue("editGithub").trim(),

        twitter:
            getInputValue("editTwitter").trim(),

        about:
            getInputValue("editAbout").trim(),

        banner_image:
            companyProfile.bannerImage || "",

        mission:
            getInputValue("editMission").trim(),

        vision:
            getInputValue("editVision").trim(),

        description:
            getInputValue("editDescription").trim() ||
            getInputValue("editAbout").trim(),

        culture:
            getInputValue("editCulture").trim(),

        benefits:
            getInputValue("editBenefits").trim(),

        products_services:
            getInputValue("editProductsServices").trim(),

        contact_person:
            getInputValue("editContactPerson").trim(),

        contact_email:
            getInputValue("editContactEmail").trim() ||
            getInputValue("editEmail").trim(),

        contact_phone:
            getInputValue("editContactPhone").trim(),

        address_line1:
            getInputValue("editAddressLine1").trim(),

        address_line2:
            getInputValue("editAddressLine2").trim(),

        city:
            getInputValue("editCity").trim(),

        state:
            getInputValue("editState").trim(),

        country:
            getInputValue("editCountry").trim(),

        postal_code:
            getInputValue("editPostalCode").trim(),

        employee_count:
            getNullableNumber("editEmployeeCount"),

        logo:
            companyProfile.logo || ""
    };

    if (!updatedProfile.company_name) {
        showToast("Company name is required.");
        return;
    }

    try {
        const response =
            await authenticatedFetch(
                COMPANY_PROFILE_API,
                {
                    method: "PUT",
                    body: JSON.stringify(
                        updatedProfile
                    )
                }
            );

        const data =
            await parseResponse(response);

        if (data?.profile) {
            companyProfile =
                normalizeCompanyProfile(
                    data.profile
                );
        } else {
            await loadCompanyProfile();
        }

        applyCompanyProfile();

        showToast(
            "Company profile saved successfully."
        );

    } catch (error) {
        console.error(
            "Company profile save failed:",
            error
        );

        showToast(
            error.message ||
            "Unable to save company profile."
        );
    }
}

function getNullableNumber(id) {
    const value =
        getInputValue(id).trim();

    if (!value) {
        return null;
    }

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : null;
}

/* =========================================================
   JOBS API
========================================================= */

async function loadJobs() {
    const response =
        await authenticatedFetch(
            COMPANY_JOBS_API
        );

    const data =
        await parseResponse(response);

    const rawJobs =
        Array.isArray(data)
            ? data
            : (
                data?.jobs ||
                []
            );

    jobs =
        rawJobs.map(
            normalizeJob
        );
}

function normalizeJob(data) {
    data = data || {};

    return {
        id:
            data.id ??
            data.job_id ??
            null,

        companyId:
            data.companyId ??
            data.company_id ??
            null,

        title:
            data.title ??
            data.job_title ??
            "",

        type:
            data.job_type ??
            data.type ??
            "Full-time",

        location:
            data.location ??
            "",

        workMode:
            data.work_mode ??
            data.workMode ??
            "On-site",

        experience:
            data.experience_required ??
            data.experience ??
            "",

        salary:
            data.salary ??
            (
                data.salary_min !== undefined ||
                data.salary_max !== undefined
                    ? `${data.salary_min ?? ""} - ${data.salary_max ?? ""}`
                    : ""
            ),

        deadline:
            data.application_deadline ??
            data.deadline ??
            "",

        skills:
            normalizeSkills(
                data.skills ??
                data.required_skills ??
                ""
            ),

        description:
            data.description ??
            "",

        qualifications:
            data.qualifications ??
            "",

        status:
            data.status ??
            "Active",

        createdAt:
            data.created_at ??
            data.createdAt ??
            null,

        applicationsCount:
            Number(
                data.applications_count ??
                data.applicationsCount ??
                data.applicant_count ??
                0
            )
    };
}

function normalizeSkills(value) {
    if (Array.isArray(value)) {
        return value
            .map(
                skill =>
                    String(skill).trim()
            )
            .filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(",")
            .map(
                skill =>
                    skill.trim()
            )
            .filter(Boolean);
    }

    return [];
}

/* =========================================================
   JOB CONTROLS
========================================================= */

function setupJobControls() {
    document
        .getElementById("postJobBtn")
        ?.addEventListener(
            "click",
            openCreateJobModal
        );

    document
        .getElementById("postJobDashboardBtn")
        ?.addEventListener(
            "click",
            openCreateJobModal
        );

    document
        .getElementById("jobForm")
        ?.addEventListener(
            "submit",
            handleJobSubmit
        );

    document
        .getElementById("closeJobModal")
        ?.addEventListener(
            "click",
            closeJobModal
        );

    document
        .getElementById("cancelJobModal")
        ?.addEventListener(
            "click",
            closeJobModal
        );

    document
        .getElementById("jobSearch")
        ?.addEventListener(
            "input",
            renderJobs
        );

    document
        .getElementById("jobTypeFilter")
        ?.addEventListener(
            "change",
            renderJobs
        );

    document
        .getElementById("jobStatusFilter")
        ?.addEventListener(
            "change",
            renderJobs
        );

    document
        .getElementById("jobModal")
        ?.addEventListener(
            "click",
            event => {
                if (
                    event.target.id ===
                    "jobModal"
                ) {
                    closeJobModal();
                }
            }
        );
}

function openCreateJobModal() {
    editingJobId = null;

    clearJobForm();

    setText(
        "jobModalTitle",
        "Post New Opportunity"
    );

    showModal("jobModal");
}

function openEditJobModal(jobId) {
    const job =
        jobs.find(
            item =>
                Number(item.id) ===
                Number(jobId)
        );

    if (!job) {
        showToast("Job not found.");
        return;
    }

    editingJobId =
        Number(jobId);

    setText(
        "jobModalTitle",
        "Edit Opportunity"
    );

    setInputValue(
        "jobId",
        job.id
    );

    setInputValue(
        "jobTitle",
        job.title
    );

    setInputValue(
        "jobType",
        job.type
    );

    setInputValue(
        "jobLocation",
        job.location
    );

    setInputValue(
        "jobWorkMode",
        job.workMode
    );

    setInputValue(
        "jobExperience",
        job.experience
    );

    setInputValue(
        "jobSalary",
        job.salary
    );

    setInputValue(
        "jobDeadline",
        job.deadline
            ? String(job.deadline).substring(
                0,
                10
            )
            : ""
    );

    setInputValue(
        "jobSkills",
        job.skills.join(", ")
    );

    setInputValue(
        "jobDescription",
        job.description
    );

    showModal("jobModal");
}

function clearJobForm() {
    const form =
        document.getElementById(
            "jobForm"
        );

    if (!form) {
        return;
    }

    form.reset();

    setInputValue(
        "jobId",
        ""
    );
}

async function handleJobSubmit(event) {
    event.preventDefault();

    const payload = {
        title:
            getInputValue(
                "jobTitle"
            ).trim(),

        job_type:
            getInputValue(
                "jobType"
            ),

        type:
            getInputValue(
                "jobType"
            ),

        location:
            getInputValue(
                "jobLocation"
            ).trim(),

        work_mode:
            getInputValue(
                "jobWorkMode"
            ),

        workMode:
            getInputValue(
                "jobWorkMode"
            ),

        experience_required:
            getInputValue(
                "jobExperience"
            ).trim(),

        experience:
            getInputValue(
                "jobExperience"
            ).trim(),

        salary:
            getInputValue(
                "jobSalary"
            ).trim(),

        deadline:
            getInputValue(
                "jobDeadline"
            ),

        application_deadline:
            getInputValue(
                "jobDeadline"
            ),

        skills:
            normalizeSkills(
                getInputValue(
                    "jobSkills"
                )
            ),

        description:
            getInputValue(
                "jobDescription"
            ).trim()
    };

    if (!payload.title) {
        showToast(
            "Job title is required."
        );
        return;
    }

    if (!payload.description) {
        showToast(
            "Job description is required."
        );
        return;
    }

    try {
        let response;

        if (editingJobId) {
            response =
                await authenticatedFetch(
                    `${COMPANY_JOBS_API}/${editingJobId}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(
                            payload
                        )
                    }
                );
        } else {
            response =
                await authenticatedFetch(
                    COMPANY_JOBS_API,
                    {
                        method: "POST",
                        body: JSON.stringify(
                            payload
                        )
                    }
                );
        }

        await parseResponse(
            response
        );

        await loadJobs();

        await loadApplicants();

        renderEverything();

        closeJobModal();

        showToast(
            editingJobId
                ? "Job updated successfully."
                : "Job posted successfully."
        );

    } catch (error) {
        console.error(
            "Job save error:",
            error
        );

        showToast(
            error.message
        );
    }
}

async function deleteJob(jobId) {
    const job =
        jobs.find(
            item =>
                Number(item.id) ===
                Number(jobId)
        );

    if (!job) {
        return;
    }

    const confirmed =
        window.confirm(
            `Delete "${job.title}"?`
        );

    if (!confirmed) {
        return;
    }

    try {
        const response =
            await authenticatedFetch(
                `${COMPANY_JOBS_API}/${jobId}`,
                {
                    method: "DELETE"
                }
            );

        await parseResponse(
            response
        );

        await loadJobs();
        await loadApplicants();

        renderEverything();

        showToast(
            "Job deleted successfully."
        );

    } catch (error) {
        console.error(
            "Delete job error:",
            error
        );

        showToast(
            error.message
        );
    }
}

async function toggleJobStatus(jobId) {
    const job =
        jobs.find(
            item =>
                Number(item.id) ===
                Number(jobId)
        );

    if (!job) {
        return;
    }

    const newStatus =
        normalizeStatus(
            job.status
        ) === "Active"
            ? "Closed"
            : "Active";

    try {
        const response =
            await authenticatedFetch(
                `${COMPANY_JOBS_API}/${jobId}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        status:
                            newStatus
                    })
                }
            );

        await parseResponse(
            response
        );

        await loadJobs();

        renderEverything();

        showToast(
            `Job marked as ${newStatus}.`
        );

    } catch (error) {
        console.error(
            "Job status update error:",
            error
        );

        showToast(
            error.message
        );
    }
}

/* =========================================================
   RENDER JOBS
========================================================= */

function renderJobs() {
    const container =
        document.getElementById(
            "jobsGrid"
        );

    if (!container) {
        return;
    }

    const search =
        getInputValue(
            "jobSearch"
        )
            .toLowerCase()
            .trim();

    const typeFilter =
        getInputValue(
            "jobTypeFilter"
        ) || "all";

    const statusFilter =
        getInputValue(
            "jobStatusFilter"
        ) || "all";

    const filtered =
        jobs.filter(
            job => {
                const searchable = [
                    job.title,
                    job.type,
                    job.location,
                    job.workMode,
                    job.experience,
                    job.description,
                    ...job.skills
                ]
                    .join(" ")
                    .toLowerCase();

                const matchesSearch =
                    !search ||
                    searchable.includes(
                        search
                    );

                const matchesType =
                    typeFilter === "all" ||
                    normalizeJobType(
                        job.type
                    ) ===
                    normalizeJobType(
                        typeFilter
                    );

                const matchesStatus =
                    statusFilter === "all" ||
                    normalizeStatus(
                        job.status
                    ) ===
                    normalizeStatus(
                        statusFilter
                    );

                return (
                    matchesSearch &&
                    matchesType &&
                    matchesStatus
                );
            }
        );

    if (!filtered.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">▣</div>
                <h3>No opportunities found</h3>
                <p>
                    There are no jobs matching your current filters.
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML =
        filtered
            .map(createJobCard)
            .join("");
}

function normalizeJobType(value) {
    const text =
        String(value || "")
            .trim()
            .toLowerCase();

    if (text === "full time") {
        return "full-time";
    }

    if (text === "full-time") {
        return "full-time";
    }

    if (text === "part time") {
        return "part-time";
    }

    if (text === "part-time") {
        return "part-time";
    }

    return text;
}

function createJobCard(job) {
    const applicationCount =
        getApplicationCountForJob(
            job.id
        );

    const status =
        normalizeStatus(
            job.status
        );

    const statusClass =
        status === "Active"
            ? "status-active"
            : "status-closed";

    const skillsHTML =
        (job.skills || [])
            .slice(0, 6)
            .map(
                skill =>
                    `
                    <span class="skill-tag">
                        ${escapeHTML(skill)}
                    </span>
                    `
            )
            .join("");

    return `
        <article class="job-card">

            <div class="job-card-top">

                <span class="job-badge">
                    ${escapeHTML(
                        job.type
                    )}
                </span>

                <span
                    class="job-status ${statusClass}"
                >
                    ${escapeHTML(status)}
                </span>

            </div>

            <h3>
                ${escapeHTML(job.title)}
            </h3>

            <p class="job-location">
                📍
                ${escapeHTML(
                    job.location ||
                    "Location not specified"
                )}
            </p>

            <div class="job-details">

                <span class="job-detail">
                    ${escapeHTML(
                        job.workMode
                    )}
                </span>

                <span class="job-detail">
                    ${escapeHTML(
                        job.experience ||
                        "Experience not specified"
                    )}
                </span>

                <span class="job-detail">
                    ${escapeHTML(
                        job.salary ||
                        "Salary not disclosed"
                    )}
                </span>

            </div>

            <div class="job-skills">
                ${skillsHTML}
            </div>

            <p class="job-description">
                ${escapeHTML(
                    truncateText(
                        job.description,
                        150
                    )
                )}
            </p>

            <div class="job-card-footer">

                <span class="job-applications">
                    ${applicationCount}
                    applicant${
                        applicationCount === 1
                            ? ""
                            : "s"
                    }
                </span>

                <div class="job-actions">

                    <button
                        class="job-action-btn"
                        onclick="openEditJobModal(${Number(job.id)})"
                    >
                        Edit
                    </button>

                    <button
                        class="job-action-btn"
                        onclick="toggleJobStatus(${Number(job.id)})"
                    >
                        ${
                            status === "Active"
                                ? "Close"
                                : "Reopen"
                        }
                    </button>

                    <button
                        class="job-action-btn delete"
                        onclick="deleteJob(${Number(job.id)})"
                    >
                        Delete
                    </button>

                </div>

            </div>

        </article>
    `;
}

function getApplicationCountForJob(jobId) {
    return applicants.filter(
        applicant =>
            String(
                applicant.jobId
            ) ===
            String(jobId)
    ).length;
}

/* =========================================================
   APPLICANTS API
========================================================= */

async function loadApplicants() {
    const response =
        await authenticatedFetch(
            COMPANY_APPLICANTS_API
        );

    const data =
        await parseResponse(
            response
        );

    const rawApplicants =
        Array.isArray(data)
            ? data
            : (
                data?.applicants ||
                []
            );

    applicants =
        rawApplicants.map(
            normalizeApplicant
        );
}

function normalizeApplicant(data) {
    data = data || {};

    return {
        id:
            data.id ??
            data.application_id ??
            null,

        userId:
            data.userId ??
            data.user_id ??
            null,

        jobId:
            data.jobId ??
            data.job_id ??
            null,

        name:
            data.name ??
            data.full_name ??
            data.username ??
            "Candidate",

        headline:
            data.headline ??
            data.tagline ??
            data.designation ??
            "",

        email:
            data.email ??
            "",

        phone:
            data.phone ??
            "",

        location:
            data.location ??
            "",

        education:
            data.education ??
            "",

        experience:
            data.experience ??
            "",

        skills:
            normalizeSkills(
                data.skills
            ),

        projects:
            data.projects ??
            "",

        certifications:
            data.certifications ??
            "",

        achievements:
            data.achievements ??
            "",

        resume:
            data.resume ??
            data.resume_url ??
            "#",

        profilePic:
            data.profilePic ??
            data.profile_pic ??
            data.avatar ??
            "https://via.placeholder.com/100",

        avatar:
            data.profilePic ??
            data.profile_pic ??
            data.avatar ??
            "https://via.placeholder.com/100",

        coverLetter:
            data.coverLetter ??
            data.cover_letter ??
            "",

        jobTitle:
            data.jobTitle ??
            data.job_title ??
            "",

        appliedAt:
            data.appliedAt ??
            data.applied_at ??
            data.created_at ??
            null,

        status:
            data.status ??
            "Pending"
    };
}

/* =========================================================
   APPLICANT CONTROLS
========================================================= */

function setupApplicantControls() {
    document
        .getElementById(
            "applicantSearch"
        )
        ?.addEventListener(
            "input",
            renderApplicants
        );

    document
        .getElementById(
            "applicantStatusFilter"
        )
        ?.addEventListener(
            "change",
            renderApplicants
        );

    document
        .getElementById(
            "applicantJobFilter"
        )
        ?.addEventListener(
            "change",
            renderApplicants
        );

    document
        .getElementById(
            "viewApplicantsDashboardBtn"
        )
        ?.addEventListener(
            "click",
            () =>
                openSection(
                    "applicantsSection"
                )
        );

    document
        .getElementById(
            "closeApplicantModal"
        )
        ?.addEventListener(
            "click",
            closeApplicantModal
        );

    document
        .getElementById(
            "applicantModal"
        )
        ?.addEventListener(
            "click",
            event => {
                if (
                    event.target.id ===
                    "applicantModal"
                ) {
                    closeApplicantModal();
                }
            }
        );
}

function populateApplicantJobFilter() {
    const select =
        document.getElementById(
            "applicantJobFilter"
        );

    if (!select) {
        return;
    }

    const previous =
        select.value;

    select.innerHTML = `
        <option value="all">
            All Jobs
        </option>

        ${jobs
            .map(
                job =>
                    `
                    <option value="${escapeAttribute(job.id)}">
                        ${escapeHTML(job.title)}
                    </option>
                    `
            )
            .join("")}
    `;

    const valid =
        [...select.options]
            .some(
                option =>
                    option.value ===
                    previous
            );

    if (valid) {
        select.value =
            previous;
    }
}

/* =========================================================
   RENDER APPLICANTS
========================================================= */

function renderApplicants() {
    const tbody =
        document.getElementById(
            "applicantTableBody"
        );

    if (!tbody) {
        return;
    }

    const search =
        getInputValue(
            "applicantSearch"
        )
            .toLowerCase()
            .trim();

    const statusFilter =
        getInputValue(
            "applicantStatusFilter"
        ) || "all";

    const jobFilter =
        getInputValue(
            "applicantJobFilter"
        ) || "all";

    const filtered =
        applicants.filter(
            applicant => {
                const searchable = [
                    applicant.name,
                    applicant.headline,
                    applicant.email,
                    applicant.location,
                    applicant.jobTitle,
                    applicant.education,
                    applicant.experience,
                    ...(applicant.skills || [])
                ]
                    .join(" ")
                    .toLowerCase();

                const matchesSearch =
                    !search ||
                    searchable.includes(
                        search
                    );

                const matchesStatus =
                    statusFilter === "all" ||
                    normalizeStatus(
                        applicant.status
                    ) ===
                    normalizeStatus(
                        statusFilter
                    );

                const matchesJob =
                    jobFilter === "all" ||
                    String(
                        applicant.jobId
                    ) ===
                    String(
                        jobFilter
                    );

                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesJob
                );
            }
        );

    if (!filtered.length) {
        tbody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:40px;
                        color:var(--muted);
                    "
                >
                    No applicants found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML =
        filtered
            .map(createApplicantRow)
            .join("");
}

function createApplicantRow(applicant) {
    return `
        <tr>

            <td>

                <div class="table-candidate">

                    <img
                        src="${escapeAttribute(
                            applicant.avatar
                        )}"
                        alt=""
                    >

                    <div class="table-candidate-info">

                        <strong>
                            ${escapeHTML(
                                applicant.name
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                applicant.headline ||
                                "Candidate"
                            )}
                        </span>

                    </div>

                </div>

            </td>

            <td>
                ${escapeHTML(
                    applicant.jobTitle ||
                    "—"
                )}
            </td>

            <td>
                ${escapeHTML(
                    applicant.experience ||
                    "—"
                )}
            </td>

            <td>
                ${formatDate(
                    applicant.appliedAt
                )}
            </td>

            <td>

                <select
                    class="status-select"
                    onchange="updateApplicantStatus(
                        ${Number(applicant.id)},
                        this.value
                    )"
                >
                    ${renderStatusOptions(
                        applicant.status
                    )}
                </select>

            </td>

            <td>

                <button
                    class="view-candidate-btn"
                    onclick="openApplicantDetails(
                        ${Number(applicant.id)}
                    )"
                >
                    View
                </button>

            </td>

        </tr>
    `;
}

/* =========================================================
   UPDATE APPLICANT STATUS
========================================================= */

async function updateApplicantStatus(
    applicationId,
    newStatus
) {
    const applicant =
        applicants.find(
            item =>
                Number(item.id) ===
                Number(applicationId)
        );

    if (!applicant) {
        return;
    }

    try {
        const response =
            await authenticatedFetch(
                `${COMPANY_APPLICATION_STATUS_API}/${applicationId}/status`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        status:
                            newStatus
                    })
                }
            );

        await parseResponse(
            response
        );

        await loadApplicants();
        await loadAnalytics();

        renderEverything();

        showToast(
            `${applicant.name} moved to ${newStatus}.`
        );

    } catch (error) {
        console.error(
            "Applicant status update error:",
            error
        );

        showToast(
            error.message
        );
    }
}

/* =========================================================
   APPLICANT DETAILS
========================================================= */

async function openApplicantDetails(
    applicantId
) {
    currentApplicantId =
        Number(
            applicantId
        );

    try {
        const cachedApplicant =
            applicants.find(
                item =>
                    Number(item.id) ===
                    Number(applicantId)
            );

        if (cachedApplicant) {
            renderApplicantDetails(
                cachedApplicant
            );

            showModal(
                "applicantModal"
            );
        }

        const response =
            await authenticatedFetch(
                `${COMPANY_APPLICANTS_API}/${applicantId}`
            );

        const data =
            await parseResponse(
                response
            );

        const candidate =
            normalizeApplicant(
                data?.applicant ||
                data
            );

        renderApplicantDetails(
            candidate
        );

        showModal(
            "applicantModal"
        );

    } catch (error) {
        console.error(
            "Applicant details error:",
            error
        );

        if (
            !document
                .getElementById(
                    "applicantModal"
                )
                ?.classList.contains(
                    "show"
                )
        ) {
            showToast(
                error.message
            );
        }
    }
}

/* =========================================================
   APPLICANT DETAILS RENDER
========================================================= */

function renderApplicantDetails(
    applicant
) {
    const container =
        document.getElementById(
            "applicantDetails"
        );

    if (!container) {
        return;
    }

    const skillsHTML =
        (applicant.skills || [])
            .map(
                skill =>
                    `
                    <span class="skill-tag">
                        ${escapeHTML(skill)}
                    </span>
                    `
            )
            .join("");

    container.innerHTML = `
        <div class="applicant-profile-header">

            <img
                src="${escapeAttribute(
                    applicant.avatar
                )}"
                alt=""
            >

            <div>

                <h2>
                    ${escapeHTML(
                        applicant.name
                    )}
                </h2>

                <p>
                    ${escapeHTML(
                        applicant.headline ||
                        "Candidate"
                    )}
                </p>

                <p>
                    📍
                    ${escapeHTML(
                        applicant.location ||
                        "Location not specified"
                    )}
                </p>

            </div>

            <div class="applicant-status-box">

                <span class="
                    mini-status
                    ${getStatusClass(
                        applicant.status
                    )}
                ">
                    ${escapeHTML(
                        applicant.status
                    )}
                </span>

            </div>

        </div>

        <div class="applicant-details-grid">

            <div class="detail-box">
                <label>Email</label>

                <strong>
                    ${escapeHTML(
                        applicant.email ||
                        "Not provided"
                    )}
                </strong>
            </div>

            <div class="detail-box">
                <label>Phone</label>

                <strong>
                    ${escapeHTML(
                        applicant.phone ||
                        "Not provided"
                    )}
                </strong>
            </div>

            <div class="detail-box">
                <label>Education</label>

                <strong>
                    ${escapeHTML(
                        applicant.education ||
                        "Not provided"
                    )}
                </strong>
            </div>

            <div class="detail-box">
                <label>Experience</label>

                <strong>
                    ${escapeHTML(
                        applicant.experience ||
                        "Not provided"
                    )}
                </strong>
            </div>

            <div class="detail-box full">
                <label>Applied For</label>

                <strong>
                    ${escapeHTML(
                        applicant.jobTitle ||
                        "Not specified"
                    )}
                </strong>
            </div>

            <div class="detail-box full">
                <label>Applied Date</label>

                <strong>
                    ${formatDate(
                        applicant.appliedAt
                    )}
                </strong>
            </div>

            <div class="detail-box full">
                <label>Skills</label>

                <div class="candidate-skills">
                    ${
                        skillsHTML ||
                        `<p>No skills listed.</p>`
                    }
                </div>
            </div>

            <div class="detail-box full">
                <label>Projects</label>

                <p>
                    ${escapeHTML(
                        applicant.projects ||
                        "No projects listed."
                    )}
                </p>
            </div>

            <div class="detail-box full">
                <label>Certifications</label>

                <p>
                    ${escapeHTML(
                        applicant.certifications ||
                        "No certifications listed."
                    )}
                </p>
            </div>

            <div class="detail-box full">
                <label>Achievements</label>

                <p>
                    ${escapeHTML(
                        applicant.achievements ||
                        "No achievements listed."
                    )}
                </p>
            </div>

            <div class="detail-box full">
                <label>Cover Letter</label>

                <p>
                    ${escapeHTML(
                        applicant.coverLetter ||
                        "No cover letter provided."
                    )}
                </p>
            </div>

        </div>

        <div class="modal-actions">

            ${
                applicant.resume &&
                applicant.resume !== "#"
                    ? `
                        <a
                            href="${escapeAttribute(
                                applicant.resume
                            )}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="secondary-button"
                        >
                            View Resume
                        </a>
                    `
                    : ""
            }

            <select
                class="status-select"
                id="applicantModalStatus"
                onchange="
                    updateApplicantStatusFromModal(
                        ${Number(applicant.id)},
                        this.value
                    )
                "
            >
                ${renderStatusOptions(
                    applicant.status
                )}
            </select>

            <button
                class="primary-button"
                onclick="
                    closeApplicantModal();
                    openSection('pipelineSection');
                "
            >
                Hiring Pipeline
            </button>

        </div>
    `;
}

async function updateApplicantStatusFromModal(
    applicantId,
    status
) {
    await updateApplicantStatus(
        applicantId,
        status
    );

    const applicant =
        applicants.find(
            item =>
                Number(item.id) ===
                Number(applicantId)
        );

    if (applicant) {
        renderApplicantDetails(
            applicant
        );
    }
}

/* =========================================================
   PIPELINE
========================================================= */

function setupPipeline() {
    /* Pipeline uses the real applications table. */
}

function renderPipeline() {
    const pending =
        applicants.filter(
            applicant =>
                [
                    "Pending",
                    "Reviewed"
                ].includes(
                    normalizeStatus(
                        applicant.status
                    )
                )
        );

    const shortlisted =
        applicants.filter(
            applicant =>
                normalizeStatus(
                    applicant.status
                ) === "Shortlisted"
        );

    const interview =
        applicants.filter(
            applicant =>
                normalizeStatus(
                    applicant.status
                ) === "Interview"
        );

    const selected =
        applicants.filter(
            applicant =>
                normalizeStatus(
                    applicant.status
                ) === "Selected"
        );

    renderPipelineColumn(
        "pendingPipeline",
        pending,
        "pendingPipelineCount"
    );

    renderPipelineColumn(
        "shortlistedPipeline",
        shortlisted,
        "shortlistedPipelineCount"
    );

    renderPipelineColumn(
        "interviewPipeline",
        interview,
        "interviewPipelineCount"
    );

    renderPipelineColumn(
        "selectedPipeline",
        selected,
        "selectedPipelineCount"
    );

    setText(
        "overviewPending",
        pending.length
    );

    setText(
        "overviewShortlisted",
        shortlisted.length
    );

    setText(
        "overviewInterview",
        interview.length
    );

    setText(
        "overviewSelected",
        selected.length
    );
}

function renderPipelineColumn(
    containerId,
    items,
    countId
) {
    const container =
        document.getElementById(
            containerId
        );

    if (!container) {
        return;
    }

    setText(
        countId,
        items.length
    );

    if (!items.length) {
        container.innerHTML = `
            <div
                style="
                    padding:25px 10px;
                    text-align:center;
                    color:var(--muted);
                    font-size:9px;
                "
            >
                No candidates
            </div>
        `;

        return;
    }

    container.innerHTML =
        items
            .map(
                applicant =>
                    `
                    <div class="pipeline-card">

                        <div class="pipeline-card-top">

                            <img
                                src="${escapeAttribute(
                                    applicant.avatar
                                )}"
                                alt=""
                            >

                            <strong>
                                ${escapeHTML(
                                    applicant.name
                                )}
                            </strong>

                        </div>

                        <div class="pipeline-card-job">
                            ${escapeHTML(
                                applicant.jobTitle ||
                                "Application"
                            )}
                        </div>

                        <button
                            class="pipeline-card-action"
                            onclick="
                                openApplicantDetails(
                                    ${Number(applicant.id)}
                                )
                            "
                        >
                            View Candidate
                        </button>

                    </div>
                    `
            )
            .join("");
}

/* =========================================================
   CANDIDATE SEARCH
========================================================= */

function setupCandidateSearch() {
    const input =
        document.getElementById(
            "candidateSearchInput"
        );

    const location =
        document.getElementById(
            "candidateLocationFilter"
        );

    const experience =
        document.getElementById(
            "candidateExperienceFilter"
        );

    let timer;

    function triggerSearch() {
        clearTimeout(timer);

        timer =
            setTimeout(
                searchCandidates,
                350
            );
    }

    input?.addEventListener(
        "input",
        triggerSearch
    );

    location?.addEventListener(
        "change",
        triggerSearch
    );

    experience?.addEventListener(
        "change",
        triggerSearch
    );
}


/* =========================================================
   CANDIDATE SEARCH
========================================================= */

async function searchCandidates() {

    const query =
        getInputValue(
            "candidateSearchInput"
        ).trim();

    const location =
        getInputValue(
            "candidateLocationFilter"
        );

    const experience =
        getInputValue(
            "candidateExperienceFilter"
        );

    if (
        !query &&
        (
            location === "all" ||
            !location
        ) &&
        (
            experience === "all" ||
            !experience
        )
    ) {
        candidateResults = [];

        renderCandidateSearch();

        return;
    }

    try {

        const params =
            new URLSearchParams();

        if (query) {
            params.set(
                "q",
                query
            );
        }

        if (
            location &&
            location !== "all"
        ) {
            params.set(
                "location",
                location
            );
        }

        if (
            experience &&
            experience !== "all"
        ) {
            params.set(
                "experience",
                experience
            );
        }

        const response =
            await authenticatedFetch(
                `${COMPANY_CANDIDATES_API}?${params.toString()}`
            );

        const data =
            await parseResponse(
                response
            );

        const rawCandidates =
            Array.isArray(data)
                ? data
                : (
                    data?.candidates ||
                    []
                );

        candidateResults =
            rawCandidates.map(
                normalizeCandidate
            );

        renderCandidateSearch();

    } catch (error) {

        console.error(
            "Candidate search error:",
            error
        );

        candidateResults = [];

        const container =
            document.getElementById(
                "candidateSearchResults"
            );

        if (container) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-icon">
                        ⚠
                    </div>

                    <h3>
                        Search failed
                    </h3>

                    <p>
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                </div>
            `;
        }
    }
}

function normalizeCandidate(
    data
) {

    data =
        data || {};

    return {

        id:
            data.id ??
            data.user_id ??
            null,

        userId:
            data.userId ??
            data.user_id ??
            null,

        name:
            data.name ??
            data.full_name ??
            data.username ??
            "Candidate",

        headline:
            data.headline ??
            data.tagline ??
            "",

        location:
            data.location ??
            "",

        experience:
            parseExperience(
                data.experience
            ),

        education:
            data.education ??
            "",

        skills:
            normalizeSkills(
                data.skills
            ),

        profilePic:
            data.profilePic ??
            data.profile_pic ??
            data.avatar ??
            "https://via.placeholder.com/100",

        email:
            data.email ??
            "",

        phone:
            data.phone ??
            ""
    };
}

function parseExperience(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }

    const match =
        String(value)
            .match(
                /[\d.]+/
            );

    if (!match) {
        return 0;
    }

    return Number(
        match[0]
    );
}

/* =========================================================
   RENDER CANDIDATE SEARCH
========================================================= */

function renderCandidateSearch() {

    const container =
        document.getElementById(
            "candidateSearchResults"
        );

    if (!container) {
        return;
    }

    const query =
        getInputValue(
            "candidateSearchInput"
        ).trim();

    const location =
        getInputValue(
            "candidateLocationFilter"
        );

    const experience =
        getInputValue(
            "candidateExperienceFilter"
        );

    const hasFilter =
        query ||
        (
            location &&
            location !== "all"
        ) ||
        (
            experience &&
            experience !== "all"
        );

    if (!hasFilter) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    ⌕
                </div>

                <h3>
                    Search for candidates
                </h3>

                <p>
                    Enter a name, skill, education or use the filters above.
                </p>

            </div>
        `;

        return;
    }

    if (!candidateResults.length) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    ⌕
                </div>

                <h3>
                    No candidates found
                </h3>

                <p>
                    Try changing your search criteria.
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML =
        candidateResults
            .map(
                createCandidateCard
            )
            .join("");
}

function createCandidateCard(
    candidate
) {

    const skillsHTML =
        (candidate.skills || [])
            .slice(
                0,
                7
            )
            .map(
                skill =>
                    `
                    <span class="skill-tag">
                        ${escapeHTML(
                            skill
                        )}
                    </span>
                    `
            )
            .join("");

    const candidateId =
        Number(
            candidate.userId ||
            candidate.id
        );

    return `
        <div
            class="candidate-card"
            data-user-id="${escapeAttribute(
                candidateId
            )}"
        >

            <div class="candidate-card-header">

                <img
                    src="${escapeAttribute(
                        candidate.profilePic
                    )}"
                    alt=""
                    onerror="
                        this.src='https://via.placeholder.com/100';
                    "
                >

                <div>

                    <strong>
                        ${escapeHTML(
                            candidate.name
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            candidate.headline ||
                            "Candidate"
                        )}
                    </span>

                </div>

            </div>

            <div class="candidate-meta">

                <span>
                    📍
                    ${escapeHTML(
                        candidate.location ||
                        "Location not specified"
                    )}
                </span>

                <span>
                    ${
                        Number(
                            candidate.experience
                        ) > 0
                            ? `${escapeHTML(
                                candidate.experience
                            )} years`
                            : "Fresher"
                    }
                </span>

                <span>
                    ${escapeHTML(
                        candidate.education ||
                        "Education not specified"
                    )}
                </span>

            </div>

            <div class="candidate-skills">

                ${
                    skillsHTML ||
                    `<span
                        style="
                            color:var(--muted);
                            font-size:9px;
                        "
                    >
                        No skills listed.
                    </span>`
                }

            </div>

            <button
                type="button"
                onclick="
                    openPublicCandidateProfile(
                        ${candidateId}
                    )
                "
            >
                View Candidate
            </button>

        </div>
    `;
}

/* =========================================================
   PUBLIC CANDIDATE PROFILE
========================================================= */

async function openPublicCandidateProfile(
    userId
) {

    const numericId =
        Number(
            userId
        );

    if (
        !Number.isInteger(
            numericId
        ) ||
        numericId <= 0
    ) {

        showToast(
            "Candidate profile ID is unavailable."
        );

        return;
    }

    try {

        showReadOnlyProfileLoading();

        const response =
            await authenticatedFetch(
                `${USER_PROFILE_API}/${numericId}`
            );

        const data =
            await parseResponse(
                response
            );

        const profile =
            normalizeUserProfile(
                data?.profile ||
                data
            );

        selectedCandidateProfile =
            profile;

        renderReadOnlyCandidateProfile(
            profile
        );

        showReadOnlyProfileModal();

    } catch (error) {

        console.error(
            "Candidate profile loading error:",
            error
        );

        showToast(
            error.message ||
            "Unable to load candidate profile."
        );
    }
}

/* =========================================================
   NORMALIZE USER PROFILE
========================================================= */

function normalizeUserProfile(
    data
) {

    data =
        data || {};

    return {

        id:
            data.id ??
            data.userId ??
            data.user_id ??
            null,

        userId:
            data.userId ??
            data.user_id ??
            data.id ??
            null,

        name:
            data.name ??
            data.full_name ??
            data.username ??
            "Candidate",

        headline:
            data.headline ??
            "",

        tagline:
            data.tagline ??
            "",

        location:
            data.location ??
            "",

        connections:
            Number(
                data.connections
            ) || 0,

        followers:
            Number(
                data.followers
            ) || 0,

        about:
            data.about ??
            "",

        email:
            data.email ??
            "",

        phone:
            data.phone ??
            "",

        github:
            data.github ??
            "",

        linkedin:
            data.linkedin ??
            "",

        education:
            data.education ??
            "",

        experience:
            data.experience ??
            "",

        projects:
            data.projects ??
            "",

        skills:
            normalizeSkills(
                data.skills
            ),

        certifications:
            data.certifications ??
            "",

        achievements:
            data.achievements ??
            "",

        profilePic:
            data.profilePic ??
            data.profile_pic ??
            data.avatar ??
            "https://via.placeholder.com/120",

        bannerImage:
            data.bannerImage ??
            data.banner_image ??
            "",

        achievement_1:
            data.achievement_1 ??
            "",

        achievement_2:
            data.achievement_2 ??
            "",

        achievement_3:
            data.achievement_3 ??
            "",

        achievement_4:
            data.achievement_4 ??
            "",

        achievement_5:
            data.achievement_5 ??
            "",

        achievement_6:
            data.achievement_6 ??
            ""
    };
}

/* =========================================================
   CREATE READ-ONLY PROFILE MODAL
========================================================= */

function createReadOnlyProfileModal() {

    if (
        document.getElementById(
            "companyCandidateProfileModal"
        )
    ) {
        return;
    }

    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "companyCandidateProfileModal";

    modal.innerHTML = `
        <div
            class="company-profile-preview-backdrop"
            id="companyProfilePreviewBackdrop"
        >

            <div
                class="company-profile-preview-card"
                role="dialog"
                aria-modal="true"
                aria-label="Candidate profile"
            >

                <button
                    type="button"
                    class="company-profile-preview-close"
                    id="companyProfilePreviewClose"
                    aria-label="Close profile"
                >
                    ×
                </button>

                <div
                    id="companyCandidateProfileContent"
                >
                    Loading candidate profile...
                </div>

            </div>

        </div>
    `;

    document.body.appendChild(
        modal
    );

    injectReadOnlyProfileModalStyles();

    document
        .getElementById(
            "companyProfilePreviewClose"
        )
        ?.addEventListener(
            "click",
            closeReadOnlyProfileModal
        );

    document
        .getElementById(
            "companyProfilePreviewBackdrop"
        )
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target.id ===
                    "companyProfilePreviewBackdrop"
                ) {

                    closeReadOnlyProfileModal();
                }
            }
        );

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeReadOnlyProfileModal();
            }
        }
    );
}

/* =========================================================
   READ-ONLY PROFILE STYLES
========================================================= */

function injectReadOnlyProfileModalStyles() {

    if (
        document.getElementById(
            "companyReadOnlyProfileStyles"
        )
    ) {
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "companyReadOnlyProfileStyles";

    style.textContent = `
        #companyCandidateProfileModal {
            display:none;
        }

        #companyCandidateProfileModal.is-open {
            display:block;
        }

        .company-profile-preview-backdrop {
            position:fixed;
            inset:0;
            z-index:99999;
            background:rgba(15,23,42,.72);
            backdrop-filter:blur(5px);
            padding:20px;
            overflow:auto;
        }

        .company-profile-preview-card {
            width:min(940px,100%);
            margin:25px auto;
            background:var(--card,#ffffff);
            color:var(--text,#1f2937);
            border-radius:20px;
            box-shadow:0 25px 70px rgba(0,0,0,.30);
            overflow:hidden;
            position:relative;
        }

        .company-profile-preview-close {
            position:absolute;
            top:14px;
            right:14px;
            width:38px;
            height:38px;
            border:0;
            border-radius:50%;
            background:rgba(15,23,42,.08);
            color:inherit;
            font-size:24px;
            cursor:pointer;
            z-index:5;
        }

        .company-profile-preview-close:hover {
            background:rgba(15,23,42,.14);
        }

        .readonly-cover {
            height:190px;
            background:
                linear-gradient(
                    135deg,
                    #0A66C2,
                    #004182
                );
            overflow:hidden;
        }

        .readonly-cover img {
            width:100%;
            height:100%;
            object-fit:cover;
            display:block;
        }

        .readonly-profile-main {
            padding:0 30px 30px;
        }

        .readonly-profile-top {
            display:flex;
            gap:20px;
            align-items:flex-end;
            margin-top:-58px;
            position:relative;
        }

        .readonly-profile-avatar {
            width:120px;
            height:120px;
            border-radius:50%;
            border:5px solid white;
            object-fit:cover;
            background:#e5e7eb;
            box-shadow:0 8px 25px rgba(0,0,0,.18);
        }

        .readonly-profile-title {
            padding-bottom:10px;
        }

        .readonly-profile-title h2 {
            margin:0;
            font-size:28px;
            line-height:1.15;
        }

        .readonly-profile-title p {
            margin:6px 0 0;
            color:var(--muted,#6b7280);
            font-size:14px;
        }

        .readonly-location {
            margin-top:4px !important;
        }

        .readonly-stat-row {
            display:flex;
            gap:25px;
            flex-wrap:wrap;
            margin:24px 0;
            padding:15px 0;
            border-top:1px solid var(--border,#e5e7eb);
            border-bottom:1px solid var(--border,#e5e7eb);
        }

        .readonly-stat {
            display:flex;
            gap:6px;
            align-items:baseline;
        }

        .readonly-stat strong {
            font-size:17px;
        }

        .readonly-stat span {
            color:var(--muted,#6b7280);
            font-size:12px;
        }

        .readonly-section {
            border:1px solid var(--border,#e5e7eb);
            border-radius:14px;
            padding:18px;
            margin-top:15px;
        }

        .readonly-section h3 {
            margin:0 0 12px;
            font-size:16px;
        }

        .readonly-section p {
            margin:0;
            white-space:pre-wrap;
            line-height:1.65;
            color:var(--text,#1f2937);
        }

        .readonly-grid {
            display:grid;
            grid-template-columns:repeat(2,minmax(0,1fr));
            gap:14px;
        }

        .readonly-field {
            padding:12px;
            border-radius:10px;
            background:rgba(148,163,184,.08);
        }

        .readonly-field label {
            display:block;
            font-size:11px;
            color:var(--muted,#6b7280);
            margin-bottom:5px;
        }

        .readonly-field strong {
            display:block;
            font-size:14px;
            word-break:break-word;
        }

        .readonly-skills {
            display:flex;
            flex-wrap:wrap;
            gap:7px;
        }

        .readonly-skill {
            padding:7px 10px;
            border-radius:999px;
            background:rgba(10,102,194,.10);
            color:#0A66C2;
            font-size:11px;
            font-weight:600;
        }

        .readonly-links {
            display:flex;
            flex-wrap:wrap;
            gap:10px;
        }

        .readonly-link {
            display:inline-flex;
            align-items:center;
            padding:9px 12px;
            border-radius:9px;
            text-decoration:none;
            border:1px solid var(--border,#e5e7eb);
            color:inherit;
            font-size:12px;
            font-weight:600;
        }

        .readonly-link:hover {
            border-color:#0A66C2;
            color:#0A66C2;
        }

        .readonly-mode-label {
            margin-left:auto;
            padding:7px 11px;
            border-radius:999px;
            background:#eff6ff;
            color:#0A66C2;
            font-size:11px;
            font-weight:700;
        }

        body.dark-mode .company-profile-preview-card {
            background:#111827;
            color:#f9fafb;
        }

        body.dark-mode .readonly-profile-avatar {
            border-color:#111827;
        }

        body.dark-mode .readonly-section {
            border-color:#374151;
        }

        body.dark-mode .readonly-stat-row {
            border-color:#374151;
        }

        body.dark-mode .readonly-field {
            background:rgba(255,255,255,.05);
        }

        @media (max-width:700px) {

            .readonly-profile-top {
                align-items:center;
                flex-direction:column;
                text-align:center;
            }

            .readonly-profile-title {
                padding-bottom:0;
            }

            .readonly-grid {
                grid-template-columns:1fr;
            }

            .readonly-profile-main {
                padding:0 17px 22px;
            }

            .readonly-mode-label {
                margin-left:0;
            }
        }
    `;

    document.head.appendChild(
        style
    );
}

/* =========================================================
   READ-ONLY PROFILE LOADING
========================================================= */

function showReadOnlyProfileLoading() {

    createReadOnlyProfileModal();

    const container =
        document.getElementById(
            "companyCandidateProfileContent"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div
            style="
                padding:50px;
                text-align:center;
                color:var(--muted);
            "
        >

            <div
                style="
                    font-size:32px;
                    margin-bottom:10px;
                "
            >
                ◌
            </div>

            <strong>
                Loading candidate profile...
            </strong>

            <p
                style="
                    margin-top:6px;
                    font-size:12px;
                "
            >
                Fetching the latest profile information from the database.
            </p>

        </div>
    `;

    showReadOnlyProfileModal();
}

function showReadOnlyProfileModal() {

    createReadOnlyProfileModal();

    document
        .getElementById(
            "companyCandidateProfileModal"
        )
        ?.classList.add(
            "is-open"
        );

    document.body.style.overflow =
        "hidden";
}

function closeReadOnlyProfileModal() {

    document
        .getElementById(
            "companyCandidateProfileModal"
        )
        ?.classList.remove(
            "is-open"
        );

    document.body.style.overflow =
        "";
}

/* =========================================================
   RENDER READ-ONLY USER PROFILE
========================================================= */

function renderReadOnlyCandidateProfile(
    profile
) {

    const container =
        document.getElementById(
            "companyCandidateProfileContent"
        );

    if (!container) {
        return;
    }

    const skillsHTML =
        (profile.skills || [])
            .map(
                skill =>
                    `
                    <span class="readonly-skill">
                        ${escapeHTML(skill)}
                    </span>
                    `
            )
            .join("");

    const achievementList = [
        profile.achievement_1,
        profile.achievement_2,
        profile.achievement_3,
        profile.achievement_4,
        profile.achievement_5,
        profile.achievement_6
    ]
        .filter(
            value =>
                value &&
                String(value).trim()
        );

    const achievementsHTML =
        achievementList.length
            ? achievementList
                .map(
                    achievement =>
                        `
                        <p style="margin-top:8px;">
                            ${escapeHTML(
                                achievement
                            )}
                        </p>
                        `
                )
                .join("")
            : `
                <p>
                    ${
                        profile.achievements
                            ? escapeHTML(
                                profile.achievements
                            )
                            : "No achievements listed."
                    }
                </p>
            `;

    const banner =
        profile.bannerImage;

    const avatar =
        profile.profilePic ||
        "https://via.placeholder.com/120";

    container.innerHTML = `
        <div class="readonly-cover">
            ${
                banner
                    ? `
                        <img
                            src="${escapeAttribute(
                                banner
                            )}"
                            alt=""
                            onerror="
                                this.style.display='none';
                            "
                        >
                    `
                    : ""
            }
        </div>

        <div class="readonly-profile-main">

            <div class="readonly-profile-top">

                <img
                    class="readonly-profile-avatar"
                    src="${escapeAttribute(
                        avatar
                    )}"
                    alt="${escapeAttribute(
                        profile.name
                    )}"
                    onerror="
                        this.src='https://via.placeholder.com/120';
                    "
                >

                <div class="readonly-profile-title">

                    <h2>
                        ${escapeHTML(
                            profile.name
                        )}
                    </h2>

                    <p>
                        ${escapeHTML(
                            profile.headline ||
                            "Professional"
                        )}
                    </p>

                    ${
                        profile.tagline
                            ? `
                                <p>
                                    ${escapeHTML(
                                        profile.tagline
                                    )}
                                </p>
                            `
                            : ""
                    }

                    <p class="readonly-location">
                        📍
                        ${escapeHTML(
                            profile.location ||
                            "Location not specified"
                        )}
                    </p>

                </div>

                <span class="readonly-mode-label">
                    Recruiter View · Read Only
                </span>

            </div>

            <div class="readonly-stat-row">

                <div class="readonly-stat">

                    <strong>
                        ${Number(
                            profile.connections
                        )}
                    </strong>

                    <span>
                        Connections
                    </span>

                </div>

                <div class="readonly-stat">

                    <strong>
                        ${Number(
                            profile.followers
                        )}
                    </strong>

                    <span>
                        Followers
                    </span>

                </div>

            </div>

            <div class="readonly-section">

                <h3>
                    About
                </h3>

                <p>
                    ${escapeHTML(
                        profile.about ||
                        "No professional summary provided."
                    )}
                </p>

            </div>

            <div class="readonly-section">

                <h3>
                    Contact Information
                </h3>

                <div class="readonly-grid">

                    <div class="readonly-field">

                        <label>
                            Email
                        </label>

                        <strong>
                            ${escapeHTML(
                                profile.email ||
                                "Not provided"
                            )}
                        </strong>

                    </div>

                    <div class="readonly-field">

                        <label>
                            Phone
                        </label>

                        <strong>
                            ${escapeHTML(
                                profile.phone ||
                                "Not provided"
                            )}
                        </strong>

                    </div>

                </div>

            </div>

            <div class="readonly-section">

                <h3>
                    Education
                </h3>

                <p>
                    ${escapeHTML(
                        profile.education ||
                        "No education details provided."
                    )}
                </p>

            </div>

            <div class="readonly-section">

                <h3>
                    Experience
                </h3>

                <p>
                    ${escapeHTML(
                        profile.experience ||
                        "No experience details provided."
                    )}
                </p>

            </div>

            <div class="readonly-section">

                <h3>
                    Skills
                </h3>

                <div class="readonly-skills">

                    ${
                        skillsHTML ||
                        `<span style="color:var(--muted);font-size:12px;">
                            No skills listed.
                        </span>`
                    }

                </div>

            </div>

            <div class="readonly-section">

                <h3>
                    Projects
                </h3>

                <p>
                    ${escapeHTML(
                        profile.projects ||
                        "No projects listed."
                    )}
                </p>

            </div>

            <div class="readonly-section">

                <h3>
                    Certifications
                </h3>

                <p>
                    ${escapeHTML(
                        profile.certifications ||
                        "No certifications listed."
                    )}
                </p>

            </div>

            <div class="readonly-section">

                <h3>
                    Achievements
                </h3>

                ${achievementsHTML}

            </div>

            ${
                profile.github ||
                profile.linkedin
                    ? `
                        <div class="readonly-section">

                            <h3>
                                Professional Links
                            </h3>

                            <div class="readonly-links">

                                ${
                                    profile.linkedin
                                        ? `
                                            <a
                                                href="${escapeAttribute(
                                                    ensureUrl(
                                                        profile.linkedin
                                                    )
                                                )}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="readonly-link"
                                            >
                                                LinkedIn
                                            </a>
                                        `
                                        : ""
                                }

                                ${
                                    profile.github
                                        ? `
                                            <a
                                                href="${escapeAttribute(
                                                    ensureUrl(
                                                        profile.github
                                                    )
                                                )}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="readonly-link"
                                            >
                                                GitHub
                                            </a>
                                        `
                                        : ""
                                }

                            </div>

                        </div>
                    `
                    : ""
            }

        </div>
    `;
}

/* =========================================================
   LOAD SEARCHABLE USER PROFILES
========================================================= */

async function loadSearchableUserProfiles() {

    const response =
        await authenticatedFetch(
            USER_PROFILES_API
        );

    if (!response) {
        return;
    }

    const data =
        await parseResponse(
            response
        );

    const rawProfiles =
        Array.isArray(data)
            ? data
            : (
                data?.profiles ||
                data?.users ||
                data?.people ||
                []
            );

    searchableUserProfiles =
        rawProfiles.map(
            normalizeUserProfile
        );

    console.log(
        "Searchable user profiles loaded:",
        searchableUserProfiles.length
    );
}

/* =========================================================
   GLOBAL SEARCH
========================================================= */

function setupGlobalSearch() {

    const search =
        document.getElementById(
            "globalSearch"
        );

    if (!search) {
        return;
    }

    createGlobalSearchResults();

    let timer = null;

    search.addEventListener(
        "input",
        () => {

            clearTimeout(
                timer
            );

            const query =
                search.value.trim();

            if (!query) {
                hideGlobalSearchResults();
                return;
            }

            timer =
                setTimeout(
                    () => {
                        performCompanyGlobalSearch(
                            query
                        );
                    },
                    180
                );
        }
    );

    search.addEventListener(
        "focus",
        () => {

            const query =
                search.value.trim();

            if (query) {
                performCompanyGlobalSearch(
                    query
                );
            }
        }
    );

    search.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                const firstResult =
                    document.querySelector(
                        "#companyGlobalSearchResults .company-search-result"
                    );

                if (firstResult) {

                    firstResult.click();

                } else if (
                    search.value.trim()
                ) {

                    openSection(
                        "candidateSearchSection"
                    );

                    const candidateSearch =
                        document.getElementById(
                            "candidateSearchInput"
                        );

                    if (candidateSearch) {

                        candidateSearch.value =
                            search.value.trim();

                        searchCandidates();
                    }
                }
            }
        }
    );

    document.addEventListener(
        "click",
        event => {

            const wrapper =
                search.closest(
                    ".header-search-wrapper"
                ) ||
                search.closest(
                    ".search-box"
                ) ||
                search.parentElement;

            const panel =
                document.getElementById(
                    "companyGlobalSearchResults"
                );

            if (
                panel &&
                !panel.contains(
                    event.target
                ) &&
                wrapper &&
                !wrapper.contains(
                    event.target
                )
            ) {

                hideGlobalSearchResults();
            }
        }
    );
}

/* =========================================================
   CREATE GLOBAL SEARCH RESULTS
========================================================= */

function createGlobalSearchResults() {

    if (
        document.getElementById(
            "companyGlobalSearchResults"
        )
    ) {
        return;
    }

    const search =
        document.getElementById(
            "globalSearch"
        );

    if (!search) {
        return;
    }

    const wrapper =
        search.closest(
            ".header-search-wrapper"
        ) ||
        search.closest(
            ".search-box"
        ) ||
        search.parentElement;

    if (!wrapper) {
        return;
    }

    wrapper.style.position =
        "relative";

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "companyGlobalSearchResults";

    panel.style.cssText = `
        position:absolute;
        top:calc(100% + 8px);
        left:0;
        right:0;
        max-height:460px;
        overflow-y:auto;
        display:none;
        background:var(--card,#fff);
        border:1px solid var(--border,#e5e7eb);
        border-radius:14px;
        box-shadow:0 18px 50px rgba(0,0,0,.18);
        z-index:99999;
    `;

    wrapper.appendChild(
        panel
    );
}

/* =========================================================
   GLOBAL COMPANY SEARCH
========================================================= */

function performCompanyGlobalSearch(
    query
) {

    const normalizedQuery =
        String(query)
            .toLowerCase()
            .trim();

    if (!normalizedQuery) {
        hideGlobalSearchResults();
        return;
    }

    const results =
        searchableUserProfiles
            .filter(
                profile => {

                    const searchable = [
                        profile.name,
                        profile.headline,
                        profile.tagline,
                        profile.location,
                        profile.education,
                        profile.experience,
                        profile.projects,
                        profile.certifications,
                        profile.achievements,
                        ...(profile.skills || [])
                    ]
                        .join(" ")
                        .toLowerCase();

                    return searchable.includes(
                        normalizedQuery
                    );
                }
            )
            .slice(
                0,
                10
            );

    renderGlobalUserSearchResults(
        results,
        query
    );
}

function renderGlobalUserSearchResults(
    results,
    query
) {

    const panel =
        document.getElementById(
            "companyGlobalSearchResults"
        );

    if (!panel) {
        return;
    }

    panel.innerHTML =
        "";

    if (!results.length) {

        panel.innerHTML = `
            <div
                style="
                    padding:20px;
                    text-align:center;
                    color:var(--muted,#6b7280);
                "
            >

                <div
                    style="
                        font-size:25px;
                        margin-bottom:8px;
                    "
                >
                    ⌕
                </div>

                <strong>
                    No user profiles found
                </strong>

                <p
                    style="
                        margin:5px 0 0;
                        font-size:11px;
                    "
                >
                    No candidate profile matches
                    "${escapeHTML(query)}".
                </p>

            </div>
        `;

        panel.style.display =
            "block";

        return;
    }

    const heading =
        document.createElement(
            "div"
        );

    heading.textContent =
        "Candidates";

    heading.style.cssText = `
        padding:11px 14px 7px;
        font-size:11px;
        font-weight:800;
        text-transform:uppercase;
        letter-spacing:.05em;
        color:#0A66C2;
        border-bottom:1px solid
            var(--border,#e5e7eb);
    `;

    panel.appendChild(
        heading
    );

    results.forEach(
        profile => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "company-search-result";

            row.style.cssText = `
                display:flex;
                gap:11px;
                align-items:center;
                padding:11px 14px;
                cursor:pointer;
                border-bottom:1px solid
                    var(--border,#f1f5f9);
            `;

            const profilePic =
                profile.profilePic ||
                "https://via.placeholder.com/50";

            row.innerHTML = `
                <img
                    src="${escapeAttribute(
                        profilePic
                    )}"
                    alt=""
                    style="
                        width:44px;
                        height:44px;
                        border-radius:50%;
                        object-fit:cover;
                        flex:0 0 44px;
                        background:#e5e7eb;
                    "
                    onerror="
                        this.src='https://via.placeholder.com/50';
                    "
                >

                <div
                    style="
                        min-width:0;
                        flex:1;
                    "
                >

                    <div
                        style="
                            font-size:13px;
                            font-weight:700;
                            color:var(--text,#1f2937);
                            white-space:nowrap;
                            overflow:hidden;
                            text-overflow:ellipsis;
                        "
                    >
                        ${escapeHTML(
                            profile.name
                        )}
                    </div>

                    <div
                        style="
                            font-size:11px;
                            color:var(--muted,#6b7280);
                            white-space:nowrap;
                            overflow:hidden;
                            text-overflow:ellipsis;
                            margin-top:2px;
                        "
                    >
                        ${escapeHTML(
                            profile.headline ||
                            "Professional"
                        )}
                    </div>

                    <div
                        style="
                            font-size:10px;
                            color:var(--muted,#9ca3af);
                            margin-top:2px;
                        "
                    >
                        ${
                            profile.location
                                ? `📍 ${escapeHTML(
                                    profile.location
                                )}`
                                : ""
                        }
                    </div>

                </div>

                <span
                    style="
                        font-size:10px;
                        color:#0A66C2;
                        font-weight:700;
                    "
                >
                    View
                </span>
            `;

            row.addEventListener(
                "mouseenter",
                () => {
                    row.style.background =
                        "rgba(10,102,194,.06)";
                }
            );

            row.addEventListener(
                "mouseleave",
                () => {
                    row.style.background =
                        "";
                }
            );

            row.addEventListener(
                "click",
                () => {

                    hideGlobalSearchResults();

                    const searchInput =
                        document.getElementById(
                            "globalSearch"
                        );

                    if (searchInput) {
                        searchInput.value =
                            profile.name;
                    }

                    openPublicCandidateProfile(
                        profile.userId ||
                        profile.id
                    );
                }
            );

            panel.appendChild(
                row
            );
        }
    );

    panel.style.display =
        "block";
}

function hideGlobalSearchResults() {

    document
        .getElementById(
            "companyGlobalSearchResults"
        )
        ?.style.setProperty(
            "display",
            "none"
        );
}

/* =========================================================
   ANALYTICS API
========================================================= */

async function loadAnalytics() {

    const response =
        await authenticatedFetch(
            COMPANY_ANALYTICS_API
        );

    const data =
        await parseResponse(
            response
        );

    analyticsData =
        data?.analytics ||
        data ||
        null;
}

/* =========================================================
   REAL-LIFE ANALYTICS CALCULATIONS
========================================================= */

function calculateRecruitmentMetrics() {

    const totalApplications =
        applicants.length;

    const pending =
        applicants.filter(
            applicant =>
                normalizeStatus(
                    applicant.status
                ) === "Pending"
        ).length;

    const reviewed =
        applicants.filter(
            applicant =>
                normalizeStatus(
                    applicant.status
                ) === "Reviewed"
        ).length;

    const shortlisted =
        applicants.filter(
            applicant =>
                normalizeStatus(
                    applicant.status
                ) === "Shortlisted"
        ).length;

    const interviews =
        applicants.filter(
            applicant =>
                normalizeStatus(
                    applicant.status
                ) === "Interview"
        ).length;

    const selected =
        applicants.filter(
            applicant =>
                normalizeStatus(
                    applicant.status
                ) === "Selected"
        ).length;

    const rejected =
        applicants.filter(
            applicant =>
                normalizeStatus(
                    applicant.status
                ) === "Rejected"
        ).length;

    const activeShortlistPool =
        shortlisted +
        interviews +
        selected;

    const shortlistRate =
        calculatePercentage(
            activeShortlistPool,
            totalApplications
        );

    const interviewRate =
        calculatePercentage(
            interviews,
            totalApplications
        );

    const selectionRate =
        calculatePercentage(
            selected,
            totalApplications
        );

    const rejectionRate =
        calculatePercentage(
            rejected,
            totalApplications
        );

    const pendingRate =
        calculatePercentage(
            pending,
            totalApplications
        );

    return {

        totalApplications,

        pending,

        reviewed,

        shortlisted,

        interviews,

        selected,

        rejected,

        shortlistRate,

        interviewRate,

        selectionRate,

        rejectionRate,

        pendingRate
    };
}

function calculatePercentage(
    numerator,
    denominator
) {

    const top =
        Number(
            numerator
        ) || 0;

    const bottom =
        Number(
            denominator
        ) || 0;

    if (bottom <= 0) {
        return 0;
    }

    return Math.round(
        (
            top /
            bottom
        ) *
        100
    );
}

/* =========================================================
   ANALYTICS RENDERING
========================================================= */

function renderAnalytics() {

    const metrics =
        calculateRecruitmentMetrics();

    const activeJobs =
        jobs.filter(
            job =>
                normalizeStatus(
                    job.status
                ) === "Active"
        ).length;

    setText(
        "analyticsApplications",
        metrics.totalApplications
    );

    setText(
        "analyticsShortlistRate",
        `${metrics.shortlistRate}%`
    );

    setText(
        "analyticsSelectionRate",
        `${metrics.selectionRate}%`
    );

    setText(
        "analyticsOpenJobs",
        activeJobs
    );

    setText(
        "analyticsInterviewRate",
        `${metrics.interviewRate}%`
    );

    setText(
        "analyticsRejectionRate",
        `${metrics.rejectionRate}%`
    );

    setText(
        "analyticsPendingRate",
        `${metrics.pendingRate}%`
    );

    setText(
        "analyticsPendingApplications",
        metrics.pending
    );

    setText(
        "analyticsReviewedApplications",
        metrics.reviewed
    );

    setText(
        "analyticsInterviews",
        metrics.interviews
    );

    setText(
        "analyticsRejected",
        metrics.rejected
    );

    renderApplicationsByJob();

    renderAnalyticsFunnel();
}

/* =========================================================
   APPLICATIONS BY JOB
========================================================= */

function renderApplicationsByJob() {

    const container =
        document.getElementById(
            "applicationsByJob"
        );

    if (!container) {
        return;
    }

    const counts =
        jobs.map(
            job => {

                const count =
                    applicants.filter(
                        applicant =>
                            String(
                                applicant.jobId
                            ) ===
                            String(
                                job.id
                            )
                    ).length;

                return {
                    title:
                        job.title,
                    count
                };
            }
        )
        .filter(
            item =>
                item.count > 0
        )
        .sort(
            (a, b) =>
                b.count -
                a.count
        );

    renderJobChart(
        container,
        counts
    );
}

function renderJobChart(
    container,
    data
) {

    if (!data.length) {

        container.innerHTML = `
            <div class="empty-state">

                <p>
                    No application data available.
                </p>

            </div>
        `;

        return;
    }

    const highest =
        Math.max(
            1,
            ...data.map(
                item =>
                    Number(
                        item.count
                    )
            )
        );

    container.innerHTML =
        data
            .map(
                item => {

                    const ratio =
                        Number(
                            item.count
                        ) /
                        highest;

                    const width =
                        Math.max(
                            5,
                            ratio * 100
                        );

                    return `
                        <div class="chart-item">

                            <div class="chart-label">

                                <span>
                                    ${escapeHTML(
                                        item.title
                                    )}
                                </span>

                                <strong>
                                    ${Number(
                                        item.count
                                    )}
                                </strong>

                            </div>

                            <div class="chart-bar">

                                <div
                                    class="chart-fill"
                                    style="
                                        width:${width}%;
                                    "
                                ></div>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}

/* =========================================================
   ANALYTICS FUNNEL
========================================================= */

function renderAnalyticsFunnel() {

    const container =
        document.getElementById(
            "analyticsFunnel"
        );

    if (!container) {
        return;
    }

    const statuses = [
        "Pending",
        "Reviewed",
        "Shortlisted",
        "Interview",
        "Selected",
        "Rejected"
    ];

    const total =
        applicants.length;

    container.innerHTML =
        statuses
            .map(
                status => {

                    const count =
                        applicants.filter(
                            applicant =>
                                normalizeStatus(
                                    applicant.status
                                ) ===
                                status
                        ).length;

                    const percentage =
                        calculatePercentage(
                            count,
                            total
                        );

                    return `
                        <div class="funnel-item">

                            <span>
                                ${status}
                            </span>

                            <strong>
                                ${count}

                                <small
                                    style="
                                        margin-left:5px;
                                        color:var(--muted);
                                    "
                                >
                                    (${percentage}%)
                                </small>

                            </strong>

                        </div>
                    `;
                }
            )
            .join("");
}

/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboardJobs() {

    const container =
        document.getElementById(
            "dashboardJobs"
        );

    if (!container) {
        return;
    }

    const activeJobs =
        jobs
            .filter(
                job =>
                    normalizeStatus(
                        job.status
                    ) ===
                    "Active"
            )
            .slice(
                0,
                5
            );

    if (!activeJobs.length) {

        container.innerHTML = `
            <div class="empty-state">

                <h3>
                    No active jobs
                </h3>

                <p>
                    Post an opportunity to start hiring.
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML =
        activeJobs
            .map(
                job => {

                    const applicationCount =
                        getApplicationCountForJob(
                            job.id
                        );

                    return `
                        <div class="dashboard-job-item">

                            <div class="dashboard-job-info">

                                <strong>
                                    ${escapeHTML(
                                        job.title
                                    )}
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        job.type
                                    )}
                                    ·
                                    ${escapeHTML(
                                        job.location ||
                                        "Location not specified"
                                    )}
                                </span>

                            </div>

                            <div class="dashboard-job-applications">

                                <strong>
                                    ${applicationCount}
                                </strong>

                                <span>
                                    applicants
                                </span>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}

function renderDashboardApplicants() {

    const container =
        document.getElementById(
            "dashboardApplicants"
        );

    if (!container) {
        return;
    }

    const recent =
        [...applicants]
            .sort(
                (
                    a,
                    b
                ) =>
                    new Date(
                        b.appliedAt ||
                        0
                    ) -
                    new Date(
                        a.appliedAt ||
                        0
                    )
            )
            .slice(
                0,
                5
            );

    if (!recent.length) {

        container.innerHTML = `
            <div class="empty-state">

                <h3>
                    No applicants yet
                </h3>

                <p>
                    Applications will appear here.
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML =
        recent
            .map(
                applicant =>
                    `
                    <div class="dashboard-applicant-item">

                        <img
                            class="applicant-avatar"
                            src="${escapeAttribute(
                                applicant.avatar
                            )}"
                            alt=""
                        >

                        <div class="dashboard-applicant-info">

                            <strong>
                                ${escapeHTML(
                                    applicant.name
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    applicant.jobTitle ||
                                    "Application"
                                )}
                            </span>

                        </div>

                        <span
                            class="
                                mini-status
                                ${getStatusClass(
                                    applicant.status
                                )}
                            "
                        >
                            ${escapeHTML(
                                applicant.status
                            )}
                        </span>

                    </div>
                    `
            )
            .join("");
}

/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

function updateDashboardStats() {

    const activeJobs =
        jobs.filter(
            job =>
                normalizeStatus(
                    job.status
                ) ===
                "Active"
        ).length;

    const totalApplicants =
        applicants.length;

    const shortlisted =
        applicants.filter(
            applicant =>
                normalizeStatus(
                    applicant.status
                ) ===
                "Shortlisted"
        ).length;

    const selected =
        applicants.filter(
            applicant =>
                normalizeStatus(
                    applicant.status
                ) ===
                "Selected"
        ).length;

    setText(
        "activeJobsCount",
        activeJobs
    );

    setText(
        "totalApplicantsCount",
        totalApplicants
    );

    setText(
        "shortlistedCount",
        shortlisted
    );

    setText(
        "selectedCount",
        selected
    );

    setText(
        "sidebarJobCount",
        activeJobs
    );

    setText(
        "sidebarApplicantCount",
        totalApplicants
    );

    setText(
        "sidebarApplicationsCount",
        totalApplicants
    );

    setText(
        "sidebarSelectedCount",
        selected
    );
}

/* =========================================================
   COMPLETE PAGE RENDER
========================================================= */

function renderEverything() {

    applyCompanyProfile();

    renderJobs();

    populateApplicantJobFilter();

    renderApplicants();

    renderPipeline();

    renderDashboardJobs();

    renderDashboardApplicants();

    updateDashboardStats();

    renderCandidateSearch();

    renderAnalytics();
}

/* =========================================================
   COMPANY PROFILE FORM CONTROLS
========================================================= */

function setupCompanyProfileControls() {

    const fields = [

        "editCompanyName",
        "editIndustry",
        "editCompanySize",
        "editLocation",
        "editWebsite",
        "editEmail",
        "editCareersEmail",
        "editLinkedin",
        "editAbout",
        "editBenefits",

        "editMission",
        "editVision",
        "editDescription",
        "editCulture",
        "editProductsServices",
        "editContactPerson",
        "editContactEmail",
        "editContactPhone",
        "editHeadquarters",
        "editFoundedYear",
        "editCompanyType",
        "editEmployeeCount",
        "editAddressLine1",
        "editAddressLine2",
        "editCity",
        "editState",
        "editCountry",
        "editPostalCode",
        "editGithub",
        "editTwitter"
    ];

    fields.forEach(
        id => {

            document
                .getElementById(id)
                ?.addEventListener(
                    "input",
                    updateCompanyPreview
                );

            document
                .getElementById(id)
                ?.addEventListener(
                    "change",
                    updateCompanyPreview
                );
        }
    );

    document
        .getElementById(
            "companyLogoUpload"
        )
        ?.addEventListener(
            "change",
            handleLogoUpload
        );

    document
        .getElementById(
            "saveCompanyBtn"
        )
        ?.addEventListener(
            "click",
            saveCompanyProfile
        );
}

/* =========================================================
   COMPANY LOGO
========================================================= */

function handleLogoUpload(
    event
) {

    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }

    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        showToast(
            "Please select an image file."
        );

        event.target.value =
            "";

        return;
    }

    const maxSize =
        2 * 1024 * 1024;

    if (
        file.size >
        maxSize
    ) {

        showToast(
            "Please select an image smaller than 2 MB."
        );

        event.target.value =
            "";

        return;
    }

    const reader =
        new FileReader();

    reader.onload = () => {

        const image =
            reader.result;

        companyProfile.logo =
            image;

        setImage(
            "editorCompanyLogo",
            image
        );

        setImage(
            "previewCompanyLogo",
            image
        );

        setImage(
            "headerCompanyLogo",
            image
        );

        setImage(
            "sidebarCompanyLogo",
            image
        );

        showToast(
            "Logo selected. Click Save Company Profile to store it."
        );
    };

    reader.onerror = () => {

        showToast(
            "Unable to read the selected image."
        );
    };

    reader.readAsDataURL(
        file
    );
}

/* =========================================================
   PROFILE PREVIEW
========================================================= */

function updateCompanyPreview() {

    const name =
        getInputValue(
            "editCompanyName"
        ) ||
        "Your Company";

    const industry =
        getInputValue(
            "editIndustry"
        ) ||
        "Technology";

    const location =
        getInputValue(
            "editLocation"
        ) ||
        "Location not specified";

    const about =
        getInputValue(
            "editAbout"
        ) ||
        "Tell candidates about your company.";

    setText(
        "previewCompanyName",
        name
    );

    setText(
        "previewIndustry",
        industry
    );

    setText(
        "previewLocation",
        location
    );

    setText(
        "previewAbout",
        about
    );
}

/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(
            ".sidebar-link"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const sectionId =
                            button.dataset.section;

                        openSection(
                            sectionId
                        );
                    }
                );
            }
        );

    document
        .querySelectorAll(
            "[data-open-section]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openSection(
                            button.dataset.openSection
                        );
                    }
                );
            }
        );
}

function openSection(
    sectionId
) {

    document
        .querySelectorAll(
            ".portal-section"
        )
        .forEach(
            section => {

                section.classList.remove(
                    "active-section"
                );
            }
        );

    const section =
        document.getElementById(
            sectionId
        );

    if (!section) {
        return;
    }

    section.classList.add(
        "active-section"
    );

    document
        .querySelectorAll(
            ".sidebar-link"
        )
        .forEach(
            link => {

                link.classList.toggle(
                    "active",
                    link.dataset.section ===
                    sectionId
                );
            }
        );

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (
        window.innerWidth <=
        850
    ) {

        document
            .querySelector(
                ".sidebar"
            )
            ?.classList.remove(
                "mobile-open"
            );
    }
}

/* =========================================================
   HEADER DROPDOWN
========================================================= */

function setupHeaderDropdown() {

    const profile =
        document.getElementById(
            "headerCompanyProfile"
        );

    const dropdown =
        document.getElementById(
            "headerDropdown"
        );

    profile?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            dropdown?.classList.toggle(
                "open"
            );
        }
    );

    document.addEventListener(
        "click",
        () => {

            dropdown?.classList.remove(
                "open"
            );
        }
    );

    dropdown
        ?.querySelectorAll(
            "button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        const action =
                            button.dataset.action;

                        dropdown.classList.remove(
                            "open"
                        );

                        if (
                            action ===
                            "company-profile"
                        ) {

                            openSection(
                                "companyProfileSection"
                            );
                        }

                        if (
                            action ===
                            "settings"
                        ) {

                            openSection(
                                "settingsSection"
                            );
                        }

                        if (
                            action ===
                            "logout"
                        ) {

                            logoutCompany();
                        }
                    }
                );
            }
        );
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

function setupNotifications() {

    const button =
        document.getElementById(
            "notificationBtn"
        );

    const panel =
        document.getElementById(
            "notificationPanel"
        );

    const close =
        document.getElementById(
            "closeNotificationPanel"
        );

    button?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            panel?.classList.toggle(
                "show"
            );
        }
    );

    close?.addEventListener(
        "click",
        () => {

            panel?.classList.remove(
                "show"
            );
        }
    );
}

/* =========================================================
   THEME
========================================================= */

function setupTheme() {

    const button =
        document.getElementById(
            "themeToggle"
        );

    const savedTheme =
        localStorage.getItem(
            "companyTheme"
        );

    if (
        savedTheme ===
        "dark"
    ) {

        document.body.classList.add(
            "dark-mode"
        );

        if (button) {
            button.textContent =
                "☀";
        }
    }

    button?.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "dark-mode"
            );

            const dark =
                document.body.classList.contains(
                    "dark-mode"
                );

            localStorage.setItem(
                "companyTheme",
                dark
                    ? "dark"
                    : "light"
            );

            button.textContent =
                dark
                    ? "☀"
                    : "☾";
        }
    );
}

/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    document
        .getElementById(
            "logoutSidebarBtn"
        )
        ?.addEventListener(
            "click",
            logoutCompany
        );

    document
        .getElementById(
            "logoutSettingsBtn"
        )
        ?.addEventListener(
            "click",
            logoutCompany
        );
}

function logoutCompany() {

    const confirmed =
        window.confirm(
            "Are you sure you want to logout?"
        );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem(
        TOKEN_KEY
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

    localStorage.removeItem(
        "companyUser"
    );

    window.location.href =
        "login.html";
}

/* =========================================================
   MODALS
========================================================= */

function showModal(
    id
) {

    document
        .getElementById(
            id
        )
        ?.classList.add(
            "show"
        );
}

function closeJobModal() {

    document
        .getElementById(
            "jobModal"
        )
        ?.classList.remove(
            "show"
        );
}

function closeApplicantModal() {

    currentApplicantId =
        null;

    document
        .getElementById(
            "applicantModal"
        )
        ?.classList.remove(
            "show"
        );
}

/* =========================================================
   ERROR STATES
========================================================= */

function showJobsError(
    message
) {

    const container =
        document.getElementById(
            "jobsGrid"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="empty-state">

            <div class="empty-icon">
                ⚠
            </div>

            <h3>
                Unable to load jobs
            </h3>

            <p>
                ${escapeHTML(
                    message
                )}
            </p>

        </div>
    `;
}

function showApplicantsError(
    message
) {

    const tbody =
        document.getElementById(
            "applicantTableBody"
        );

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>

            <td
                colspan="6"
                style="
                    text-align:center;
                    padding:40px;
                    color:var(--danger);
                "
            >
                ${escapeHTML(
                    message
                )}
            </td>

        </tr>
    `;
}

/* =========================================================
   STATUS HELPERS
========================================================= */

function normalizeStatus(
    value
) {

    const status =
        String(
            value ??
            ""
        )
            .trim();

    if (!status) {
        return "Pending";
    }

    return (
        status.charAt(0).toUpperCase() +
        status.slice(1).toLowerCase()
    );
}

function renderStatusOptions(
    currentStatus
) {

    const statuses = [
        "Pending",
        "Reviewed",
        "Shortlisted",
        "Interview",
        "Selected",
        "Rejected"
    ];

    const normalized =
        normalizeStatus(
            currentStatus
        );

    return statuses
        .map(
            status =>
                `
                <option
                    value="${status}"
                    ${
                        status ===
                        normalized
                            ? "selected"
                            : ""
                    }
                >
                    ${status}
                </option>
                `
        )
        .join("");
}

function getStatusClass(
    status
) {

    const normalized =
        normalizeStatus(
            status
        );

    switch (
        normalized
    ) {

        case "Rejected":
            return "status-closed";

        case "Selected":
            return "status-active";

        case "Shortlisted":
        case "Interview":
            return "job-badge";

        default:
            return "status-active";
    }
}

/* =========================================================
   URL HELPER
========================================================= */

function ensureUrl(
    value
) {

    const text =
        String(
            value ||
            ""
        ).trim();

    if (!text) {
        return "";
    }

    if (
        /^https?:\/\//i.test(
            text
        )
    ) {
        return text;
    }

    return `https://${text}`;
}

/* =========================================================
   UTILITY FUNCTIONS
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );

    if (element) {
        element.textContent =
            value ??
            "";
    }
}

function setImage(
    id,
    src
) {

    const element =
        document.getElementById(
            id
        );

    if (
        element &&
        src
    ) {

        element.src =
            src;
    }
}

function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );

    if (element) {
        element.value =
            value ??
            "";
    }
}

function getInputValue(
    id
) {

    return (
        document.getElementById(
            id
        )?.value ||
        ""
    );
}

function truncateText(
    text,
    maxLength
) {

    const value =
        String(
            text ??
            ""
        );

    if (
        value.length <=
        maxLength
    ) {
        return value;
    }

    return (
        value.substring(
            0,
            maxLength
        ) +
        "..."
    );
}

function formatDate(
    date
) {

    if (!date) {
        return "—";
    }

    const parsed =
        new Date(
            date
        );

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return String(
            date
        );
    }

    return parsed.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

function escapeHTML(
    value
) {

    return String(
        value ??
        ""
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

function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );
}

/* =========================================================
   TOAST
========================================================= */

function showToast(
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );

    const messageElement =
        document.getElementById(
            "toastMessage"
        );

    if (
        !toast ||
        !messageElement
    ) {
        return;
    }

    messageElement.textContent =
        message;

    toast.classList.add(
        "show"
    );

    clearTimeout(
        showToast.timeout
    );

    showToast.timeout =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );
}

/* =========================================================
   GLOBAL FUNCTION EXPORTS
========================================================= */

window.openCreateJobModal =
    openCreateJobModal;

window.openEditJobModal =
    openEditJobModal;

window.deleteJob =
    deleteJob;

window.toggleJobStatus =
    toggleJobStatus;

window.updateApplicantStatus =
    updateApplicantStatus;

window.updateApplicantStatusFromModal =
    updateApplicantStatusFromModal;

window.openApplicantDetails =
    openApplicantDetails;

window.closeApplicantModal =
    closeApplicantModal;

window.openPublicCandidateProfile =
    openPublicCandidateProfile;

window.closeReadOnlyProfileModal =
    closeReadOnlyProfileModal;

