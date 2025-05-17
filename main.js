const mobileMenu = document.querySelector(".header-menu");
const menuIcon = document.querySelector(".mobile-menue");

menuIcon.addEventListener("click", () => {
	mobileMenu.classList.add("slideIn");
});

mobileMenu.addEventListener("click", () => {
	mobileMenu.classList.remove("slideIn");
});

const selectFile = document.querySelector("#fileInput");
const selectedFile = document.querySelector("#previewFile");

const userFile = {
	message: null,
	file: {
		data: null,
		mime_type: null,
	},
};
selectFile.addEventListener("change", function () {
	const file = this.files[0];
	if (file) {
		const reader = new FileReader();
		reader.onload = (e) => {
			const base64Data = e.target.result.split(",")[1];
			selectedFile.src = e.target.result;
			userFile.file = {
				data: base64Data,
				mime_type: file.type,
			};

			console.log(userFile);
		};
		reader.readAsDataURL(file);
	}
});

const userMessage = document.querySelector(".userMessage");
const userInput = document.getElementById("userInput");
const userPrompt = document.querySelector(".userPrompt");
const chatContainer = document.querySelector(".chat-container");
const searchingAnimation = document.querySelector(".searchingAnimation");
let loading;
const count = chatContainer.querySelectorAll("div").length;

// API setup
const GEMINI_API_KEY = "AIzaSyABFtyCYAg2VNvAF7QxlOfufCByEOPblu0";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const generateBotResponse = async (userData) => {
	const thinkingDiv = Thinking(); // insert animation and keep reference
	try {
		const response = await fetch(API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				contents: [
					{
						parts: [
							{
								text: userData,
							},
							...(userFile.file.data ? [{ inline_data: userFile.file }] : []),
						],
					},
				],
			}),
		});

		if (!response.ok) {
			throw new Error("Network response was not ok");
		}

		const data = await response.json();
		const apiResponseText = data?.candidates?.[0].content?.parts?.[0]?.text
			?.replace(/\*\*(.*?)\*\*/g, "$1")
			.trim();

		// remove animation
		thinkingDiv.remove();
		displayBotResponse(
			apiResponseText || "🤖 I couldn't understand the image."
		);

		// Reset file after submission
		userFile.file = { data: null, mime_type: null };
		selectFile.value = "";
		selectedFile.src = ""; // clears preview
	} catch (error) {
		console.error("Error:", error);
		thinkingDiv.remove();
		displayBotResponse("❌ Sorry, an error occurred. Please try again.");
	}
};

userPrompt.addEventListener("submit", function (e) {
	e.preventDefault();
	// console.log(chatContainer.querySelectorAll("div").length);
	if (userInput.value !== "") {
		chatContainer.scrollTop = chatContainer.scrollHeight;
		// userData(userInput, chatContainer);
		const user = `
		<div class="userImg" ><img  src= "${selectedFile.src}" alt="userImg" /></div>
                <div class="userMessage">
                    <p class="wrapUserText">${userInput.value}</p>
                </div>
     `;
		chatContainer.insertAdjacentHTML("beforeend", user);

		const userData = userInput.value.trim();

		generateBotResponse(userData);
		displayBotResponse();

		userInput.value = "";
	}
});

function getApiResponseText(response) {
	displayBotResponse(response);
}

// function userData(userInput, chatContainer) {}
function Thinking() {
	const thinkingHTML = `
		<div class="botsearching">
			<div class="searchingAnimation">
				<div></div>
				<div></div>
				<div></div>
				<div></div>
			</div>
		</div>
	`;

	chatContainer.insertAdjacentHTML("beforeend", thinkingHTML);
	const lastInserted = chatContainer.querySelector(".botsearching:last-child");
	return lastInserted; // return the inserted DOM node so it can be removed later
}

function displayBotResponse(response) {
	if (response !== undefined) {
		const bot = `
		<div class="botMessage">
		<div class="resultContainer">
		<div class="botlogo">🤖</div>
		<div class="botResult">
		${response}
		</div>
		</div>		
		</div>
		`;
		chatContainer.insertAdjacentHTML("beforeend", bot);
		chatContainer.scrollTop = chatContainer.scrollHeight;
	}
}
