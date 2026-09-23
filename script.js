// ================= BASE JAVASCRIPT YANG DIWAJIBKAN =================
const ALL_SUFFIXES = ["って", "んで", "いて", "いで", "して", "て"];
let currentQuestion = null;
let correctSuffix = "";
// Tambahan variabel state
let quizPool = [];
let totalQuestions = 0;
let currentQuestionNumber = 0;
let score = 0;

function stripTags(html) {
	let doc = new DOMParser().parseFromString(html, "text/html");
	return doc.body.textContent || "";
}

function extractSuffix(teFormHTML) {
	const plainText = stripTags(teFormHTML);
	for (let suffix of ["って", "んで", "いて", "いで", "して"]) {
		if (plainText.endsWith(suffix)) return suffix;
	}
	return "て";
}

function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

function loadQuestion() {
	if (currentQuestionNumber >= totalQuestions) {
		showResultScreen();
		return;
	}
	currentQuestionNumber++;
	document.getElementById("question-counter").innerText =
		`Soal ${currentQuestionNumber} / ${totalQuestions}`;

	// Gunakan quizPool (data yang dipilih user di setup) bukan dataKosakata langsung
	const randomIndex = Math.floor(Math.random() * quizPool.length);
	currentQuestion = quizPool[randomIndex];

	correctSuffix = extractSuffix(currentQuestion.て.form);

	let options = [correctSuffix];
	let availableWrong = ALL_SUFFIXES.filter((s) => s !== correctSuffix);
	availableWrong = shuffleArray(availableWrong);

	for (let i = 0; i < 3; i++) {
		options.push(availableWrong[i]);
	}
	options = shuffleArray(options);

	document.getElementById("question-text").innerHTML =
		currentQuestion.ます.form;

	const optionsContainer = document.getElementById("options-container");
	optionsContainer.innerHTML = "";

	options.forEach((opt) => {
		const btn = document.createElement("button");
		// Class tailwind dari instruksi (dimodifikasi sedikit untuk UI konsisten)
		btn.className =
			"btn-option w-full py-4 px-6 bg-white border-2 border-gray-200 rounded-xl text-2xl font-bold text-gray-700 hover:bg-blue-50 hover:border-blue-300 flex justify-start items-center shadow-sm transition-colors duration-200 jp-text";
		btn.innerHTML = `<span class="text-gray-400 mr-2 text-xl font-sans">...</span> ${opt}`;
		btn.setAttribute("data-value", opt);
		btn.onclick = () => handleAnswer(opt, btn);
		optionsContainer.appendChild(btn);
	});

	const answerText = document.getElementById("answer-text");
	answerText.style.opacity = "0";
	answerText.innerHTML = "";

	const explanationArea = document.getElementById("explanation-area");
	explanationArea.classList.add("hidden");

	document.getElementById("next-btn").classList.add("hidden");
	document.getElementById("waiting-overlay").classList.remove("hidden");
}

function handleAnswer(selected, clickedBtn) {
	const isCorrect = selected === correctSuffix;
	const allBtns = document.querySelectorAll(".btn-option");

	allBtns.forEach((btn) => (btn.disabled = true));

	if (isCorrect) {
		clickedBtn.classList.add(
			"bg-green-100",
			"border-green-400",
			"text-green-800",
		);
		score++;
	} else {
		clickedBtn.classList.add("bg-red-100", "border-red-400", "text-red-800");
		allBtns.forEach((btn) => {
			if (btn.getAttribute("data-value") === correctSuffix) {
				btn.classList.add("bg-green-100", "border-green-400", "text-green-800");
			}
		});
	}

	const answerText = document.getElementById("answer-text");
	answerText.innerHTML = `<div class="text-6xl font-bold jp-text text-blue-600 transition-opacity duration-300">${currentQuestion.て.form}</div> <p class="text-gray-600 font-medium italic">${currentQuestion.arti[1]}</p>`;
	answerText.style.opacity = "1";

	document.getElementById("example-jp").innerHTML = currentQuestion.て.ruby;
	document.getElementById("example-id").innerText = currentQuestion.て.id;

	const explanationArea = document.getElementById("explanation-area");
	explanationArea.classList.remove("hidden");

	document.getElementById("next-btn").classList.remove("hidden");
	document.getElementById("waiting-overlay").classList.add("hidden");
}

// ================= LOGIKA UI DAN SETUP TAMBAHAN =================

const screens = {
	setup: document.getElementById("setup-screen"),
	quiz: document.getElementById("quiz-screen"),
	result: document.getElementById("result-screen"),
};

function switchScreen(screenName) {
	Object.values(screens).forEach((s) => {
		s.classList.add("screen-hidden");
		s.classList.remove("flex");
	});
	screens[screenName].classList.remove("screen-hidden");
	screens[screenName].classList.add("flex");
}

function initSetup() {
	const vocabChecklist = document.getElementById("vocab-checklist");
	vocabChecklist.innerHTML = "";

	dataKosakata.forEach((item, index) => {
		const label = document.createElement("label");
		label.className =
			"flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 bg-white group";
		label.innerHTML = `
                    <div class="relative">
                        <input type="checkbox" class="sr-only custom-checkbox vocab-cb" value="${index}" checked>
                        <div class="w-5 h-5 border-2 border-gray-300 rounded bg-white flex justify-center items-center">
                            <svg class="w-3 h-3 text-white hidden pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    <span class="ml-3 text-gray-700 font-medium jp-text text-lg">${item.kosakata[1]} <span class="text-sm text-gray-400 font-sans ml-1">(${item.arti[1]})</span></span>
                `;
		vocabChecklist.appendChild(label);
	});

	// Handle Select All
	const selectAllCb = document.getElementById("select-all");
	selectAllCb.addEventListener("change", (e) => {
		const checkboxes = document.querySelectorAll(".vocab-cb");
		checkboxes.forEach((cb) => (cb.checked = e.target.checked));
	});

	vocabChecklist.addEventListener("change", (e) => {
		if (e.target.classList.contains("vocab-cb")) {
			const checkboxes = document.querySelectorAll(".vocab-cb");
			const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
			selectAllCb.checked = allChecked;
		}
	});
}

function startQuiz() {
	const checkboxes = document.querySelectorAll(".vocab-cb:checked");
	const numInput = parseInt(document.getElementById("num-questions").value, 10);

	if (checkboxes.length === 0 || isNaN(numInput) || numInput < 1) {
		document.getElementById("setup-error").classList.remove("hidden");
		return;
	}
	document.getElementById("setup-error").classList.add("hidden");

	quizPool = Array.from(checkboxes).map(
		(cb) => dataKosakata[parseInt(cb.value, 10)],
	);
	totalQuestions = numInput;
	currentQuestionNumber = 0;
	score = 0;

	switchScreen("quiz");
	loadQuestion();
}

function showResultScreen() {
	document.getElementById("final-score").innerText = score;
	document.getElementById("final-total").innerText = totalQuestions;

	// Adjust text color based on score
	const scoreContainer = document.getElementById("final-score").parentElement;
	const percentage = score / totalQuestions;
	if (percentage >= 0.8) {
		scoreContainer.className = "text-6xl font-black text-green-500";
	} else if (percentage >= 0.5) {
		scoreContainer.className = "text-6xl font-black text-blue-500";
	} else {
		scoreContainer.className = "text-6xl font-black text-red-500";
	}

	switchScreen("result");
}

// Event Listeners
document.getElementById("start-btn").addEventListener("click", startQuiz);
document.getElementById("next-btn").addEventListener("click", loadQuestion);
document.getElementById("restart-btn").addEventListener("click", () => {
	switchScreen("setup");
});

// Initialize App
window.onload = () => {
	initSetup();
};
