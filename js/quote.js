document.addEventListener("DOMContentLoaded", function () {
    const displayQuote = document.querySelector(".display__quote");
    const displayAuthor = document.querySelector(".display__author");
    const body = document.body;

    // Dark mode toggle
    const switchInput = document.querySelector(".switch input");
    if (switchInput) {
        switchInput.addEventListener("change", function (e) {
            if (e.target.checked) {
                body.style.backgroundColor = "black";
                displayQuote.style.color = "white";
            } else {
                body.style.backgroundColor = "white";
                displayQuote.style.color = "black";
            }
        });
    }

    // Add quote modal
    const headerTitle = document.querySelector(".header__title");
    const modal = document.querySelector(".modal");
    const modalClose = document.querySelector(".modal__close");
    const modalBody = document.querySelector(".modal__body");

    if (headerTitle && modal) {
        headerTitle.addEventListener("click", function () {
            modalBody.classList.remove("annimate_disappear");
            modal.classList.add("modal-appear");
            modalBody.classList.add("annimate_appear");
            modalBody.style.opacity = 1;
        });
    }
    function closeModal() {
        modalBody.classList.remove("modal-appear");
        modalBody.classList.add("annimate_disappear");
        setTimeout(() => {
            modal.classList.remove("modal-appear");
            modalBody.style.opacity = 0;
        }, 500);
    }

    if (modalClose && modalBody) {
        modalClose.addEventListener("click", closeModal);
    }

    // Add quote to database
    const addButton = document.querySelector(".input__add");
    if (addButton) {
        addButton.addEventListener("click", function () {
            const contentInput = document.querySelector("input[name*='inputContent']");
            const authorInput = document.querySelector("input[name='inputAuthor']");

            if (contentInput && contentInput.value.trim() !== "") {
                const content = contentInput.value.trim();
                const author = authorInput ? authorInput.value.trim() : "";

                fetch("../api/quotes.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ content, author }),
                })
                    .then((response) => response.text())
                    .then((responseText) => {
                        alert(responseText);
                        contentInput.value = "";
                        if (authorInput) authorInput.value = "";
                        closeModal();
                    })
                    .catch((error) => {
                        console.error("Error adding quote:", error);
                        alert("Failed to add quote.");
                    });
            }
        });
    }

    // Quick add quote
    const quickAddButton = document.querySelector(".input__quick-add");
    if (quickAddButton) {
        quickAddButton.addEventListener("click", function () {
            const contentInput = document.querySelector("input[name*='inputContent']");
            const authorInput = document.querySelector("input[name='inputAuthor']");

            if (contentInput && displayQuote) {
                contentInput.value = displayQuote.textContent.replace(/"/g, "");
            }
            if (authorInput && displayAuthor) {
                authorInput.value = displayAuthor.textContent.replace(/- /, "");
            }
        });
    }


    // load quotes of the day
    if(quotes != undefined){
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        displayQuote.textContent = quote.content.replace(/\"/g, "");
        displayAuthor.textContent = "- " + quote.author.trim();
    }
});