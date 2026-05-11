export function renderQuestions(container: HTMLElement, questions: string[]) {
  if (!questions || questions.length === 0) {
    container.innerHTML = "<p>No questions generated.</p>";
    return;
  }

  const list = document.createElement("ul");
  questions.forEach((q) => {
    const li = document.createElement("li");
    li.textContent = q;
    list.appendChild(li);
  });

  container.innerHTML = "<h3>Interview Questions:</h3>";
  container.appendChild(list);
}

