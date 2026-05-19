/**
 * main.ts
 *
 * Frontend entry point for Interviewer.ai.
 * Runs entirely in the browser — no framework, vanilla TypeScript only.
 *
 * Responsibilities:
 * - Handles form submission and input validation
 * - Calls POST /api/generate-questions on the Express backend
 * - Tracks and displays real-time API latency using performance.now()
 * - Updates the status bar (title + description) based on request state
 * - Renders 3 AI-generated question cards into the bento grid
 * - Handles copy-to-clipboard on question card click
 * - Manages loading state (spinner, disabled button) during fetch
 *
 * DOM elements expected in index.html:
 * - #question-form       — the submit form
 * - #job-title           — job title text input
 * - #submit-btn          — generate button
 * - #status-title        — status bar heading
 * - #status-desc         — status bar description
 * - #latency             — latency display element
 * - #q1, #q2, #q3        — question card containers
 *
 * @author  Uteh.A
 * @version 1.0.0
 */

// Vanilla TypeScript Interviewer logic
document.addEventListener("DOMContentLoaded", () => {
	const form = document.getElementById("question-form") as HTMLFormElement;
	const input = document.getElementById("job-title") as HTMLInputElement;
	const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
	const btnText = submitBtn.querySelector(".btn-text") as HTMLElement;
	const loader = submitBtn.querySelector(".loader") as HTMLElement;

	// Status elements
	const statusTitle = document.getElementById("status-title") as HTMLElement;
	const statusDesc = document.getElementById("status-desc") as HTMLElement;
	const latencyEl = document.getElementById("latency") as HTMLElement;

	// Questions containers
	const qCards = [
		document.getElementById("q1"),
		document.getElementById("q2"),
		document.getElementById("q3"),
	] as HTMLElement[];

	const qTexts = [
		document.getElementById("q1-text"),
		document.getElementById("q2-text"),
		document.getElementById("q3-text"),
	] as HTMLElement[];

	// Toast
	const toast = document.getElementById("toast") as HTMLElement;

	const showToast = (message: string) => {
		toast.textContent = message;
		toast.classList.remove("hidden");
		setTimeout(() => toast.classList.add("hidden"), 2000);
	};

	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		const jobTitle = input.value.trim();
		if (!jobTitle) return;

		// Get active difficulty tier
		const activeTierBtn = document.querySelector(
			".tier-btn.active",
		) as HTMLElement;
		const difficultyTier = activeTierBtn
			? activeTierBtn.textContent?.trim()
			: "Standard";

		// Start Loading State
		setLoading(true);
		const startTime = performance.now();

		try {
			const response = await fetch("/api/generate-questions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ jobTitle, difficultyTier }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to generate questions");
			}

			// Update UI
			updateQuestions(data.questions || []);

			const endTime = performance.now();
			latencyEl.textContent = `Latency: ${Math.round(endTime - startTime)}ms`;

			statusTitle.textContent = "Analysis Complete";
			statusDesc.textContent = `Synthesized 3 ${difficultyTier.toLowerCase()} questions for ${jobTitle}.`;
		} catch (error: any) {
			console.error(error);
			statusTitle.textContent = "Error";
			statusDesc.textContent = error.message;
		} finally {
			setLoading(false);
		}
	});

	const setLoading = (loading: boolean) => {
		if (loading) {
			submitBtn.disabled = true;
			btnText.classList.add("hidden");
			loader.classList.remove("hidden");
			statusTitle.textContent = "Synthesizing...";
			statusDesc.textContent =
				"Our AI is crafting custom questions based on your input.";
		} else {
			submitBtn.disabled = false;
			btnText.classList.remove("hidden");
			loader.classList.add("hidden");
		}
	};

	const updateQuestions = (questions: string[]) => {
		questions.forEach((q, i) => {
			if (qCards[i] && qTexts[i]) {
				qTexts[i].textContent = `"${q}"`;
				qCards[i].classList.add("active");

				// Add click-to-copy
				qCards[i].onclick = () => {
					navigator.clipboard.writeText(q);
					showToast("Copied to clipboard");
				};
			}
		});
	};

	// Difficulty Tier Button Logic (Visual only)
	const tierBtns = document.querySelectorAll(".tier-btn");
	tierBtns.forEach((btn) => {
		btn.addEventListener("click", () => {
			tierBtns.forEach((b) => b.classList.remove("active"));
			btn.classList.add("active");
		});
	});
});
