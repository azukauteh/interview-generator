/*
feat(ui): add candidate prep page script with JWT guard

- Implemented candidate.ts to handle question + answer generation
- Added JWT auth guard: redirects to login if token missing
- Cached DOM references for form, inputs, buttons, status, latency, and logout
- Prepared arrays for question text, answer text, and answer blocks
- Added logout handler to clear access_token and redirect to login
- Sets up foundation for dynamic question/answer rendering on candidate page
*/

// Auth guard
const token = localStorage.getItem("access_token");
if (!token) window.location.href = "/";

// DOM refs
const form = document.getElementById("candidate-form") as HTMLFormElement;
const jobInput = document.getElementById("job-role") as HTMLInputElement;
const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
const btnText = submitBtn.querySelector(".btn-text") as HTMLElement;
const loader = submitBtn.querySelector(".loader") as HTMLElement;
const statusTitle = document.getElementById("status-title") as HTMLElement;
const statusDesc = document.getElementById("status-desc") as HTMLElement;
const latencyEl = document.getElementById("latency") as HTMLElement;
const logoutBtn = document.getElementById("logout-btn") as HTMLButtonElement;

const qTexts = [1, 2, 3].map(
	(n) => document.getElementById(`q${n}-text`) as HTMLElement,
);
const aTexts = [1, 2, 3].map(
	(n) => document.getElementById(`a${n}-text`) as HTMLElement,
);
const aBlocks = [1, 2, 3].map(
	(n) => document.getElementById(`a${n}-block`) as HTMLElement,
);

// Logout
logoutBtn.addEventListener("click", () => {
	localStorage.removeItem("access_token");
	localStorage.removeItem("user_role");
	window.location.href = "/";
});

function setLoading(loading: boolean) {
	submitBtn.disabled = loading;
	btnText.style.opacity = loading ? "0" : "1";
	loader.classList.toggle("hidden", !loading);
}

// Form submit
form.addEventListener("submit", async (e) => {
	e.preventDefault();
	const jobRole = jobInput.value.trim();
	if (!jobRole) return;

	setLoading(true);
	statusTitle.textContent = "Preparing…";
	statusDesc.textContent = `Generating questions and answers for "${jobRole}"…`;
	qTexts.forEach((el) => {
		el.textContent = "---";
	});
	aTexts.forEach((el) => {
		el.textContent = "";
	});
	for (const el of aBlocks) el.classList.add("hidden");

	const t0 = performance.now();

	try {
		const res = await fetch("/api/candidate/questions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ jobRole }),
		});

		const data = await res.json();
		if (!res.ok) throw new Error(data.error || "Failed to generate questions");

		const ms = Math.round(performance.now() - t0);
		latencyEl.textContent = `System Latency: ${ms}ms`;
		statusTitle.textContent = "Ready to Practice";
		statusDesc.textContent = `3 questions prepared for "${jobRole}"`;

		data.questions.slice(0, 3).forEach((q: string, i: number) => {
			qTexts[i].textContent = q;
		});

		data.answers.slice(0, 3).forEach((a: string, i: number) => {
			aTexts[i].textContent = a;
			aBlocks[i].classList.remove("hidden");
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Unknown error";
		statusTitle.textContent = "Error";
		statusDesc.textContent = message;
	} finally {
		setLoading(false);
	}
});
