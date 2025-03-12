console.log("Content Script: Injected and running...");

let isPaused = false;
let isStopped = false;
let scrollCount = 0;
let totalScrollSteps = 0;
let timePerStep = 0;

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

// Function to smoothly scroll the page
function smoothScroll() {
    window.scrollBy({ top: window.innerHeight / 2, behavior: "smooth" });
}

// Function to calculate scrolling time based on WPM
function calculateScrollTiming(totalWords, wpm) {
    const readingTimeInSeconds = (totalWords / wpm) * 60;
    const scrollSteps = Math.ceil(document.documentElement.scrollHeight / (window.innerHeight / 2));
    const timePerStep = (readingTimeInSeconds / scrollSteps) * 1000; // Convert to ms

    console.log(`Scroll Steps: ${scrollSteps}, Time Per Step: ${timePerStep.toFixed(2)}ms`);
    return { scrollSteps, timePerStep };
}

// Function to create the floating WPM control box
function createControlBox(updateWPM, pauseScrolling, resumeScrolling, stopScrolling) {
    let controlBox = document.getElementById("scrollControlBox");
    if (!controlBox) {
        controlBox = document.createElement("div");
        controlBox.id = "scrollControlBox";
        controlBox.style.position = "fixed";
        controlBox.style.bottom = "15px";
        controlBox.style.right = "15px";
        controlBox.style.backgroundColor = "#333";
        controlBox.style.color = "white";
        controlBox.style.padding = "8px";
        controlBox.style.borderRadius = "8px";
        controlBox.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
        controlBox.style.display = "flex";
        controlBox.style.alignItems = "center";
        controlBox.style.gap = "5px";
        controlBox.style.fontSize = "14px";
        controlBox.style.fontWeight = "bold";
        controlBox.style.zIndex = "10000";

        // WPM Display
        const wpmLabel = document.createElement("span");
        wpmLabel.id = "wpmValue";
        wpmLabel.innerText = "WPM: 200";

        // Timer Display
        const timerLabel = document.createElement("span");
        timerLabel.id = "timerLabel";
        timerLabel.innerText = "Time: 0s";

        // Decrease WPM Button
        const decreaseBtn = document.createElement("button");
        decreaseBtn.innerText = "−";
        decreaseBtn.style.cssText = "background:#555;color:white;border:none;padding:4px 6px;cursor:pointer;border-radius:5px;";
        decreaseBtn.onclick = () => updateWPM(-5);

        // Increase WPM Button
        const increaseBtn = document.createElement("button");
        increaseBtn.innerText = "+";
        increaseBtn.style.cssText = "background:#555;color:white;border:none;padding:4px 6px;cursor:pointer;border-radius:5px;";
        increaseBtn.onclick = () => updateWPM(5);

        // Pause Button
        const pauseBtn = document.createElement("button");
        pauseBtn.innerText = "Pause";
        pauseBtn.style.cssText = "background:#f0ad4e;color:white;border:none;padding:4px 8px;cursor:pointer;border-radius:5px;";
        pauseBtn.onclick = pauseScrolling;

        // Resume Button
        const resumeBtn = document.createElement("button");
        resumeBtn.innerText = "Resume";
        resumeBtn.style.cssText = "background:#5cb85c;color:white;border:none;padding:4px 8px;cursor:pointer;border-radius:5px;";
        resumeBtn.onclick = resumeScrolling;

        // Stop Button
        const stopBtn = document.createElement("button");
        stopBtn.innerText = "Stop";
        stopBtn.style.cssText = "background:#d9534f;color:white;border:none;padding:4px 8px;cursor:pointer;border-radius:5px;";
        stopBtn.onclick = stopScrolling;

        // Add elements to control box
        controlBox.append(decreaseBtn, wpmLabel, increaseBtn, pauseBtn, resumeBtn, stopBtn, timerLabel);
        document.body.appendChild(controlBox);

        return { controlBox, wpmLabel, timerLabel };
    }
    return { controlBox, wpmLabel: document.getElementById("wpmValue"), timerLabel: document.getElementById("timerLabel") };
}

// Function to start scrolling with WPM control
function simulateScrolling(scrollSteps, timePerStep) {
    scrollCount = 0;
    totalScrollSteps = scrollSteps;
    isPaused = false;
    isStopped = false;

    let wpm = 200;

    // Function to update WPM dynamically
    function updateWPM(change) {
        const newWPM = wpm + change;
        if (newWPM >= 50 && newWPM <= 1000) {
            wpm = newWPM;
            wpmLabel.innerText = `WPM: ${wpm}`;

            // Recalculate scroll timing with new WPM
            const totalWords = calculateVisibleWords();
            const timing = calculateScrollTiming(totalWords, wpm);
            timePerStep = timing.timePerStep;
        }
    }

    // Function to pause scrolling
    function pauseScrolling() {
        isPaused = true;
        console.log("Scrolling paused.");
    }

    // Function to resume scrolling
    function resumeScrolling() {
        if (isPaused) {
            isPaused = false;
            console.log("Scrolling resumed.");
            scrollLoop();
        }
    }

    // Function to stop scrolling
    function stopScrolling() {
        isStopped = true;
        controlBox.remove();
        console.log("Scrolling manually stopped.");
    }

    // Create control box and store references
    const { controlBox, wpmLabel, timerLabel } = createControlBox(updateWPM, pauseScrolling, resumeScrolling, stopScrolling);

    // Scrolling function
    function scrollLoop() {
        if (isStopped || scrollCount >= totalScrollSteps) {
            controlBox.remove();
            console.log("Scrolling completed or stopped.");
            return;
        }

        if (!isPaused) {
            smoothScroll();
            scrollCount++;
            timerLabel.innerText = `Time: ${((totalScrollSteps - scrollCount) * timePerStep / 1000).toFixed(1)}s`;

            console.log(`Scrolled ${scrollCount} out of ${totalScrollSteps}`);
        }

        setTimeout(scrollLoop, timePerStep);
    }

    scrollLoop();
}

// Listen for messages from popup.js to start scrolling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startScrolling") {
        const totalWords = calculateVisibleWords();
        const { scrollSteps, timePerStep } = calculateScrollTiming(totalWords, message.wpm);
        simulateScrolling(scrollSteps, timePerStep);
    }
});
