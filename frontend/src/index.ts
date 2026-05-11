import { renderForm } from "./components/JobForm";
import { renderQuestions } from "./components/QuestionsList";

const app = document.getElementById("app")!;

renderForm(app, async (jobTitle: string) => {
  const resultsDiv = document.getElementById("results")!;
  resultsDiv.innerHTML = "Thinking...";

  try {
    const res = await fetch(`http://localhost:3000/questions?title=${encodeURIComponent(jobTitle)}`);
    const data = await res.json();
    renderQuestions(resultsDiv, data.questions);
  } catch (err) {
    resultsDiv.innerHTML = "Error fetching questions.";
  }
});

