// Auth guard
const token = localStorage.getItem("access_token");
if (!token) window.location.href = "/";

// Greeting
const userGreeting = document.getElementById("user-greeting") as HTMLElement;
const userEmail = localStorage.getItem("user_email");
if (userEmail) {
	const displayName = userEmail
		.split("@")[0]
		.replace(/[._-]/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase());
	userGreeting.textContent = `Welcome, ${displayName}`;
	userGreeting.setAttribute(
		"data-initial",
		displayName.charAt(0).toUpperCase(),
	);
}

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
const refreshBtn = document.getElementById("refresh-btn") as HTMLButtonElement;

const qTexts = [
	document.getElementById("q1-text") as HTMLElement,
	document.getElementById("q2-text") as HTMLElement,
	document.getElementById("q3-text") as HTMLElement,
];

const emptyState = document.getElementById("empty-state") as HTMLElement;
const qCards = [
	document.getElementById("q1") as HTMLElement,
	document.getElementById("q2") as HTMLElement,
	document.getElementById("q3") as HTMLElement,
];

// helper functions Emptystate
function showEmptyState() {
	emptyState.classList.remove("hidden");
	for (const card of qCards) card.classList.add("hidden");
	refreshBtn.classList.add("hidden");
}

function showCards() {
	emptyState.classList.add("hidden");
	for (const card of qCards) card.classList.remove("hidden");
	refreshBtn.classList.remove("hidden");
}

// Page load: no questions generated yet, show the empty state until the
// first successful request populates qCards.
showEmptyState();

// Difficulty tier
let activeLevel = "Entry";
document
	.querySelectorAll<HTMLButtonElement>(".level-select .tier-btn")
	.forEach((btn) => {
		btn.addEventListener("click", () => {
			document.querySelectorAll(".level-select .tier-btn");
			for (const b of document.querySelectorAll(".level-select .tier-btn"))
				b.classList.remove("active");
			btn.classList.add("active");
			activeLevel = btn.dataset.level ?? "Entry";
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
		if (!text.trim()) return;
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
	refreshBtn.disabled = loading;
}

// Core generation call, shared by the form submit and the "Generate
// Another" button — both just need a job title and tier, the rest of
// the request/render lifecycle is identical either way.
async function generateQuestions(jobTitle: string, level: string) {
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
			body: JSON.stringify({ jobTitle, level }),
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

		// Questions successfully populated — reveal the cards.
		showCards();
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Unknown error";
		statusTitle.textContent = "Error";
		statusDesc.textContent = message;

		// No valid questions to show on failure — revert to empty state
		// rather than leaving stale "---" placeholders visible.
		showEmptyState();
	} finally {
		setLoading(false);
	}
}

// Form submit
form.addEventListener("submit", async (e) => {
	e.preventDefault();
	const jobTitle = jobInput.value.trim();
	if (!jobTitle) return;
	await generateQuestions(jobTitle, activeLevel);
});

// "Generate Another" — reuses whatever job title is currently in the
// input, no retyping needed. Only becomes visible once a successful
// generation has happened (see showCards/showEmptyState above).
refreshBtn.addEventListener("click", async () => {
	const jobTitle = jobInput.value.trim();
	if (!jobTitle) return;
	await generateQuestions(jobTitle, activeLevel);
});
