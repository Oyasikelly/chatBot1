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
	if (file.type.startsWith("image/")) {
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
	} else {
		alert(
			"❌ Document uploads are not yet supported. Only images or text allowed."
		);
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
		const rawText =
			data?.candidates?.[0].content?.parts?.[0]?.text ||
			"🤖 I couldn't understand the image.";
		const html = marked.parse(rawText); // Convert markdown to HTML
		const apiResponseText = DOMPurify.sanitize(html); // Sanitize for safety

		// remove animation
		thinkingDiv.remove();
		displayBotResponse(apiResponseText);

		// Save user and bot messages to local storage
		// After inserting user message into DOM
		saveUserMessage(userInput.value.trim(), selectedFile.src || null);

		// After inserting bot message into DOM
		saveBotMessage(apiResponseText);

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

// Handle when user send their message to the bot
userPrompt.addEventListener("submit", function (e) {
	e.preventDefault();
	if (userInput.value !== "") {
		chatContainer.scrollTop = chatContainer.scrollHeight;
		if (selectFile.value !== "") {
		}
		const user = `
		${
			selectFile.value !== ""
				? `<div class="userImg">
					<img src="${selectedFile.src}" alt="userImg" />
				</div>`
				: ""
		}
                <div class="userMessage">
                    <p class="wrapUserText">${userInput.value}</p>
                </div>
     `;
		chatContainer.insertAdjacentHTML("beforeend", user);

		const userData = userInput.value.trim();

		// ✅ Save to localStorage
		saveUserMessage(
			userData,
			selectFile.value !== "" ? selectedFile.src : null
		);
		generateBotResponse(userData);
		displayBotResponse();

		userInput.value = "";
	}
});

// Getting the fetch data from the API Call
function getApiResponseText(response) {
	displayBotResponse(response);
}

// When bot is fetching data, it begins to load.
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

// Handle bot response after fetching data
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

//Handling chat History

let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

// After user sends a message
function saveUserMessage(message, imageSrc = null) {
	const trimmedMessage = message.trim();
	const validImage = imageSrc && !imageSrc.includes("index.html");

	// Only save if there's a real message or a valid image
	if (!trimmedMessage && !validImage) return;

	chatHistory.push({
		role: "user",
		message: trimmedMessage,
		image: validImage ? imageSrc : null,
	});
	localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
}

// After bot responds
function saveBotMessage(message) {
	chatHistory.push({
		role: "bot",
		message,
	});
	localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
}

// Load chat history on page load
function restoreChatFromStorage() {
	const storedChat = JSON.parse(localStorage.getItem("chatHistory")) || [];
	storedChat.forEach((entry) => {
		if (entry.role === "user") {
			const user = `
		${
			entry.image
				? `<div class="userImg"><img src="${entry.image}" alt="userImg" /></div>`
				: ""
		}
		<div class="userMessage">
			<p class="wrapUserText">${entry.message}</p>
		</div>
	`;
			chatContainer.insertAdjacentHTML("beforeend", user);
		} else if (entry.role === "bot") {
			const bot = `
				<div class="botMessage">
					<div class="resultContainer">
						<div class="botlogo">🤖</div>
						<div class="botResult">
							${entry.message}
						</div>
					</div>		
				</div>
			`;
			chatContainer.insertAdjacentHTML("beforeend", bot);
		}
	});
	chatContainer.scrollTop = chatContainer.scrollHeight;
}
restoreChatFromStorage();
// Clear History
document.querySelector("#New-Chat").addEventListener("click", () => {
	// localStorage.removeItem("chatHistory");
	chatContainer.innerHTML = "";
});
//Get chat history
document.querySelector("#ChatHistory").addEventListener("click", () => {
	restoreChatFromStorage();
});
