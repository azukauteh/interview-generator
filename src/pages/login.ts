/**
 * Authentication page logic.
 *
 * Handles:
 * - Login
 * - Signup
 * - Tab switching
 * - JWT storage
 * - Role-based redirects
 * - Authentication errors
 */

const loginForm = document.getElementById("login-form") as HTMLFormElement;
const signupForm = document.getElementById("signup-form") as HTMLFormElement;

const tabLogin = document.getElementById("tab-login") as HTMLButtonElement;
const tabSignup = document.getElementById("tab-signup") as HTMLButtonElement;

const authError = document.getElementById("auth-error") as HTMLParagraphElement;

/**
 * Switch to login form.
 */
tabLogin.addEventListener("click", () => {
	tabLogin.classList.add("active");
	tabSignup.classList.remove("active");

	loginForm.classList.remove("hidden");
	signupForm.classList.add("hidden");

	authError.classList.add("hidden");
});

/**
 * Switch to signup form.
 */
tabSignup.addEventListener("click", () => {
	tabSignup.classList.add("active");
	tabLogin.classList.remove("active");

	signupForm.classList.remove("hidden");
	loginForm.classList.add("hidden");

	authError.classList.add("hidden");
});

/**
 * Display authentication error.
 */
function showError(message: string): void {
	authError.textContent = message;
	authError.classList.remove("hidden");
}

/**
 * Toggle button loading state.
 */
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

/**
 * Store authentication data and redirect
 * the user to the appropriate dashboard.
 */
function redirectByRole(token: string, role: string): void {
	localStorage.setItem("access_token", token);
	localStorage.setItem("user_role", role);

	console.log("Authentication successful");
	console.log("Role:", role);
	console.log("Token stored:", Boolean(localStorage.getItem("access_token")));

	switch (role) {
		case "interviewer":
			window.location.href = "/interviewer";
			break;

		case "candidate":
			window.location.href = "/candidate";
			break;

		default:
			throw new Error(`Unknown user role: ${role}`);
	}
}

/**
 * Login.
 */
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
		showError("Please select a role.");
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

		console.log("Login response:", {
			status: response.status,
			data,
		});

		if (!response.ok) {
			throw new Error(data.error || "Login failed.");
		}

		if (!data.token || !data.role) {
			throw new Error("Invalid authentication response from server.");
		}

		redirectByRole(data.token, data.role);
	} catch (error: unknown) {
		console.error("Login error:", error);

		showError(
			error instanceof Error
				? error.message
				: "Unable to login. Please try again.",
		);
	} finally {
		setLoading(button, spinner, text, false);
	}
});

/**
 * Signup.
 */
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
		showError("Please select a role.");
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

		console.log("Signup response:", {
			status: response.status,
			data,
		});

		if (!response.ok) {
			throw new Error(data.error || "Signup failed.");
		}

		if (!data.token || !data.role) {
			throw new Error("Invalid authentication response from server.");
		}

		redirectByRole(data.token, data.role);
	} catch (error: unknown) {
		console.error("Signup error:", error);

		showError(
			error instanceof Error
				? error.message
				: "Unable to create account. Please try again.",
		);
	} finally {
		setLoading(button, spinner, text, false);
	}
});
