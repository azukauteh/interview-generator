/*
 
feat(ui): add interviewer dashboard script with JWT guard

- Implemented interviewer.ts to handle question generation flow
- Added JWT auth guard: redirects to login if token missing
- Cached DOM references for form, inputs, buttons, status, latency, toast, and logout
- Prepared arrays for question text placeholders to support dynamic rendering
- Added logout handler to clear access_token and redirect to login
- Sets up foundation for generating and displaying interviewer questions with tier selection
*/

// Auth guard
const token = localStorage.getItem("access_token");
if (!token) window.location.href = "/";

// DOM refs
const form = document.getElementById("question-form") as HTMLFormElement;
const jobInput = document.getElementById("job-title") as HTMLInputElement;
const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
const btnText = submitBtn.querySelector(".btn-text") as HTMLElement;
const loader = submitBtn.querySelector(".loader") as HTMLElement;
const statusTitle = document.getElementById("status-title") as HTMLElement;
const statusDesc = document.getElementById("status-desc") as HTMLElement;
const latencyEl = document.getElementById("latency") as HTMLElement;
const toast = document.getElementById("toast") as HTMLElement;
const logoutBtn = document.getElementById("logout-btn") as HTMLButtonElement;

const qTexts = [
	document.getElementById("q1-text") as HTMLElement,
	document.getElementById("q2-text") as HTMLElement,
	document.getElementById("q3-text") as HTMLElement,
];

// Difficulty tier
let activeTier = "Standard";
document.querySelectorAll<HTMLButtonElement>(".tier-btn").forEach((btn) => {
	btn.addEventListener("click", () => {
		document.querySelectorAll(".tier-btn");
		for (const b of document.querySelectorAll(".tier-btn"))
			b.classList.remove("active");
		btn.classList.add("active");
		activeTier = btn.dataset.tier ?? "Standard";
	});
});

// Logout
logoutBtn.addEventListener("click", () => {
	localStorage.removeItem("access_token");
	localStorage.removeItem("user_role");
	window.location.href = "/";
});

// Copy to clipboard
document.querySelectorAll(".card-q").forEach((card, i) => {
	card.addEventListener("click", () => {
		const text = qTexts[i]?.textContent ?? "";
		if (text === "---") return;
		navigator.clipboard.writeText(text).then(() => {
			toast.textContent = "Copied to clipboard";
			toast.classList.remove("hidden");
			setTimeout(() => toast.classList.add("hidden"), 2000);
		});
	});
});

function setLoading(loading: boolean) {
	submitBtn.disabled = loading;
	btnText.style.opacity = loading ? "0" : "1";
	loader.classList.toggle("hidden", !loading);
}

// Form submit
form.addEventListener("submit", async (e) => {
	e.preventDefault();
	const jobTitle = jobInput.value.trim();
	if (!jobTitle) return;

	setLoading(true);
	statusTitle.textContent = "Synthesizing…";
	statusDesc.textContent = `Generating questions for "${jobTitle}"…`;
	qTexts.forEach((el) => {
		el.textContent = "---";
	});

	const t0 = performance.now();

	try {
		const res = await fetch("/api/interviewer/questions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ jobTitle, difficultyTier: activeTier }),
		});

		const data = await res.json();
		if (!res.ok) throw new Error(data.error || "Failed to generate questions");

		const ms = Math.round(performance.now() - t0);
		latencyEl.textContent = `System Latency: ${ms}ms`;
		statusTitle.textContent = "Analysis Complete";
		statusDesc.textContent = `3 questions generated for "${jobTitle}"`;

		data.questions.slice(0, 3).forEach((q: string, i: number) => {
			qTexts[i].textContent = q;
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Unknown error";
		statusTitle.textContent = "Error";
		statusDesc.textContent = message;
	} finally {
		setLoading(false);
	}
});
