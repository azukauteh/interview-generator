export function renderForm(container: HTMLElement, onSubmit: (jobTitle: string) => void) {
  const form = document.createElement("form");
  const input = document.createElement("input");
  const button = document.createElement("button");

  input.type = "text";
  input.placeholder = "Enter job title (e.g. Customer Success Manager)";
  input.required = true;

  button.type = "submit";
  button.textContent = "Generate Questions";

  form.appendChild(input);
  form.appendChild(button);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    onSubmit(input.value.trim());
  });

  container.appendChild(form);
}

