/*
 * feat(ui): add login and signup form handling
 * Implemented login.ts to manage authentication flows
 * Added tab switching logic between Login and Sign Up forms
 * Captured DOM references for forms, tabs, and error messages
 * Prepared event listeners for login and signup submission
 * Configured JWT storage in localStorage after successful auth
 * Redirects users to role-specific dashboards (interviewer/candidate)
 * Displays error feedback when authentication fails

*/

const loginForm = document.getElementById("login-form") as HTMLFormElement;
const signupForm = document.getElementById("signup-form") as HTMLFormElement;

const tabLogin = document.getElementById("tab-login") as HTMLButtonElement;
const tabSignup = document.getElementById("tab-signup") as HTMLButtonElement;

const authError = document.getElementById("auth-error") as HTMLParagraphElement;

/* Tab switching */

tabLogin.addEventListener("click", () => {
	tabLogin.classList.add("active");
	tabSignup.classList.remove("active");

	loginForm.classList.remove("hidden");
	signupForm.classList.add("hidden");

	authError.classList.add("hidden");
});

tabSignup.addEventListener("click", () => {
	tabSignup.classList.add("active");
	tabLogin.classList.remove("active");

	signupForm.classList.remove("hidden");
	loginForm.classList.add("hidden");

	authError.classList.add("hidden");
});

/* Helpers */
function showError(message: string): void {
	authError.textContent = message;
	authError.classList.remove("hidden");
}

function setLoading(
	button: HTMLButtonElement,
	spinner: HTMLElement,
	text: HTMLElement,
	loading: boolean,
): void {
	button.disabled = loading;
	spinner.classList.toggle("hidden", !loading);
	text.style.opacity = loading ? "0" : "1";
}

function redirectByRole(role: string): void {
	localStorage.setItem("user_role", role);

	if (role === "interviewer") {
		window.location.href = "/public/interviewer.html";
	} else if (role === "candidate") {
		window.location.href = "/public/candidate.html";
	} else {
		window.location.href = "/";
	}
}

/* Login */
loginForm.addEventListener("submit", async (event) => {
	event.preventDefault();
	authError.classList.add("hidden");

	const button = document.getElementById("login-btn") as HTMLButtonElement;

	const spinner = document.getElementById("login-spinner") as HTMLElement;

	const text = document.getElementById("login-btn-text") as HTMLElement;

	const email = (
		document.getElementById("login-email") as HTMLInputElement
	).value.trim();

	const password = (
		document.getElementById("login-password") as HTMLInputElement
	).value;

	const role = (
		document.querySelector(
			'input[name="login-role"]:checked',
		) as HTMLInputElement | null
	)?.value;

	if (!role) {
		showError("Please select a role");
		return;
	}

	setLoading(button, spinner, text, true);

	try {
		const response = await fetch("/api/auth/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email,
				password,
				role,
			}),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || "Login failed");
		}

		// Backend returns { token, role }
		localStorage.setItem("access_token", data.token);

		redirectByRole(data.role);
	} catch (error: unknown) {
		showError(error instanceof Error ? error.message : "Login failed");
	} finally {
		setLoading(button, spinner, text, false);
	}
});

/* Signup */
signupForm.addEventListener("submit", async (event) => {
	event.preventDefault();
	authError.classList.add("hidden");

	const button = document.getElementById("signup-btn") as HTMLButtonElement;

	const spinner = document.getElementById("signup-spinner") as HTMLElement;

	const text = document.getElementById("signup-btn-text") as HTMLElement;

	const email = (
		document.getElementById("signup-email") as HTMLInputElement
	).value.trim();

	const password = (
		document.getElementById("signup-password") as HTMLInputElement
	).value;

	const role = (
		document.querySelector(
			'input[name="signup-role"]:checked',
		) as HTMLInputElement | null
	)?.value;

	if (!role) {
		showError("Please select a role");
		return;
	}

	setLoading(button, spinner, text, true);

	try {
		const response = await fetch("/api/auth/signup", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email,
				password,
				role,
			}),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || "Signup failed");
		}

		// Backend returns { token, role }
		localStorage.setItem("access_token", data.token);

		redirectByRole(data.role);
	} catch (error: unknown) {
		showError(error instanceof Error ? error.message : "Signup failed");
	} finally {
		setLoading(button, spinner, text, false);
	}
});
