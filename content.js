console.log("Content Script: Injected and running...");

let isPaused = false;
let isStopped = false;
let wpm = 200; // Default words per minute
let timerBox, wpmLabel;

// Function to count words in the given text
function countWordsInText(text) {
    const words = text.match(/\w+('\w+)?/g);
    return words ? words.length : 0;
}

// Function to check if an element is visible in the viewport
function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
}

// Function to calculate visible words
function calculateVisibleWords() {
    console.log("Calculating visible words...");
    const elements = document.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
    let totalWordCount = 0;

    elements.forEach((element) => {
        if (isElementVisible(element)) {
            totalWordCount += countWordsInText(element.innerText || element.textContent);
        }
    });

    console.log("Total visible words:", totalWordCount);
    return totalWordCount;
}

// Function to create the UI elements (control box and timer box)
function createUIElements(stopScrolling) {
    // Control Box (WPM Adjuster & Stop Button)
    let controlBox = document.getElementById("scrollControlBox");
    if (!controlBox) {
        controlBox = document.createElement("div");
        controlBox.id = "scrollControlBox";
        controlBox.style.position = "fixed";
        controlBox.style.bottom = "10px";
        controlBox.style.right = "10px";
        controlBox.style.backgroundColor = "black";
        controlBox.style.color = "white";
        controlBox.style.padding = "8px";
        controlBox.style.borderRadius = "6px";
        controlBox.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
        controlBox.style.fontSize = "14px";
        controlBox.style.textAlign = "center";
        controlBox.style.zIndex = "10000";

        // WPM Display & Adjust Buttons
        wpmLabel = document.createElement("div");
        wpmLabel.innerText = `WPM: ${wpm}`;
        controlBox.appendChild(wpmLabel);

        let increaseBtn = document.createElement("button");
        increaseBtn.innerText = "+";
        increaseBtn.style.margin = "2px";
        increaseBtn.style.cursor = "pointer";
        increaseBtn.onclick = () => adjustWPM(5);

        let decreaseBtn = document.createElement("button");
        decreaseBtn.innerText = "-";
        decreaseBtn.style.margin = "2px";
        decreaseBtn.style.cursor = "pointer";
        decreaseBtn.onclick = () => adjustWPM(-5);

        let stopBtn = document.createElement("button");
        stopBtn.innerText = "Stop";
        stopBtn.style.display = "block";
        stopBtn.style.margin = "5px auto";
        stopBtn.style.cursor = "pointer";
        stopBtn.onclick = stopScrolling; // Now properly referenced

        controlBox.appendChild(increaseBtn);
        controlBox.appendChild(decreaseBtn);
        controlBox.appendChild(stopBtn);

        document.body.appendChild(controlBox);
    }

    // Timer Box (Top Center for Countdown & Pause Message)
    timerBox = document.getElementById("scrollTimerBox");
    if (!timerBox) {
        timerBox = document.createElement("div");
        timerBox.id = "scrollTimerBox";
        timerBox.style.position = "fixed";
        timerBox.style.top = "10px";
        timerBox.style.left = "50%";
        timerBox.style.transform = "translateX(-50%)";
        timerBox.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        timerBox.style.color = "white";
        timerBox.style.padding = "10px";
        timerBox.style.borderRadius = "8px";
        timerBox.style.fontSize = "16px";
        timerBox.style.fontWeight = "bold";
        timerBox.style.zIndex = "10000";
        timerBox.style.display = "none";

        document.body.appendChild(timerBox);
    }
}

// Function to adjust WPM dynamically
function adjustWPM(change) {
    wpm += change;
    wpmLabel.innerText = `WPM: ${wpm}`;
    console.log("New WPM:", wpm);
}

// Function to smoothly scroll the page
function smoothScroll() {
    window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
}

// Function to calculate scrolling time
function calculateScrollMovements(totalWordCount, wpm) {
    const readingTimeInSeconds = (totalWordCount / wpm) * 60;
    const visibleHeight = window.innerHeight;
    const fullPageHeight = document.documentElement.scrollHeight;
    const scrollMovements = Math.ceil(fullPageHeight / visibleHeight);
    const scrollTimePerMovement = readingTimeInSeconds / scrollMovements;

    console.log("Scroll movements:", scrollMovements);
    console.log("Time per scroll movement:", scrollTimePerMovement);

    return { scrollMovements, scrollTimePerMovement };
}

// Function to start scrolling with countdown notifications
function simulateScrolling(scrollMovements, scrollTimePerMovement) {
    let scrollCount = 0;
    isPaused = false;
    isStopped = false;

    function stopScrolling() {
        isStopped = true;
        timerBox.style.display = "none";
        console.log("Scrolling stopped.");
    }

    createUIElements(stopScrolling); // Pass stopScrolling to UI elements

    console.log("Starting scroll simulation...");

    function startCountdown(callback) {
        let countdown = 4;
        timerBox.style.display = "block";

        function updateCountdown() {
            if (isPaused || isStopped) return;
            timerBox.innerText = `Next scroll in ${countdown}...`;
            if (countdown > 0) {
                countdown--;
                setTimeout(updateCountdown, 1000);
            } else {
                timerBox.style.display = "none";
                callback(); // Scroll after countdown
            }
        }
        updateCountdown();
    }

    function scrollLoop() {
        if (isStopped || scrollCount >= scrollMovements) {
            timerBox.style.display = "none";
            console.log("Scrolling completed or stopped.");
            return;
        }

        if (!isPaused) {
            startCountdown(() => {
                smoothScroll();
                scrollCount++;
                console.log("Scrolled:", scrollCount, "out of", scrollMovements);
                setTimeout(scrollLoop, scrollTimePerMovement * 1000);
            });
        }
    }

    scrollLoop(); // Start scrolling

    // Pause/Resume scrolling
    window.addEventListener("keydown", (event) => {
        if (event.key === 'p' || event.key === 'P') {
            event.preventDefault();
            isPaused = !isPaused;
            if (isPaused) {
                timerBox.innerText = "Page is paused. Press 'P' to play";
                timerBox.style.display = "block";
                console.log("Paused scrolling.");
            } else {
                timerBox.style.display = "none";
                console.log("Resumed scrolling.");
                scrollLoop();
            }
        }
    });
}

// Listen for messages from popup.js to start scrolling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startScrolling") {
        console.log("Message received: startScrolling");
        const totalWordCount = calculateVisibleWords();

        const { scrollMovements, scrollTimePerMovement } = calculateScrollMovements(totalWordCount, wpm);
        simulateScrolling(scrollMovements, scrollTimePerMovement);
    }
});
