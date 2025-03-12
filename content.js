console.log("Content Script: Injected and running...");

// Function to count words in the given text
function countWordsInText(text) {
    const words = text.match(/\w+('\w+)?/g);
    return words ? words.length : 0;
}

// Function to check if an element is visible in the viewport
function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
    );
}

// Function to calculate visible words
function calculateVisibleWords() {
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

// Function to create a notification box for pause & countdown
function createNotificationBox() {
    let notification = document.getElementById("scrollNotification");
    if (!notification) {
        notification = document.createElement("div");
        notification.id = "scrollNotification";
        notification.style.position = "fixed";
        notification.style.top = "10px";
        notification.style.left = "50%";
        notification.style.transform = "translateX(-50%)";
        notification.style.backgroundColor = "black";
        notification.style.color = "white";
        notification.style.padding = "10px 15px";
        notification.style.borderRadius = "8px";
        notification.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
        notification.style.fontSize = "16px";
        notification.style.fontWeight = "bold";
        notification.style.zIndex = "10000";
        notification.style.display = "none";
        document.body.appendChild(notification);
    }
    return notification;
}

// Function to smoothly scroll the page
function smoothScroll() {
    window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
}

// Function to calculate scrolling time
function calculateScrollMovements(totalWordCount, wpm) {
    const wordsPerMinute = wpm || 200;
    const readingTimeInSeconds = (totalWordCount / wordsPerMinute) * 60;
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
    let isPaused = false;
    let isStopped = false;
    let notificationBox = createNotificationBox();
    const countdownTime = 4; // Countdown before scrolling

    console.log("Starting scroll simulation...");

    function startCountdown(callback) {
        let countdown = countdownTime;
        notificationBox.style.display = "block";

        function updateCountdown() {
            if (isPaused || isStopped) return;
            notificationBox.innerText = `Scrolling in ${countdown}...`;
            if (countdown > 0) {
                countdown--;
                setTimeout(updateCountdown, 1000);
            } else {
                notificationBox.style.display = "none";
                callback(); // Scroll after countdown
            }
        }
        updateCountdown();
    }

    function scrollLoop() {
        if (isStopped || scrollCount >= scrollMovements) {
            notificationBox.style.display = "none";
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

    // Pause/Resume scrolling but only if NOT stopped
    window.addEventListener("keydown", (event) => {
        if (event.key === 'p' || event.key === 'P') {
            event.preventDefault();
            if (isStopped) {
                console.log("Scrolling already stopped. Ignoring pause.");
                return; // Do nothing if stopped
            }
            isPaused = !isPaused;
            if (isPaused) {
                notificationBox.innerText = "Scrolling is paused. Press 'P' to resume.";
                notificationBox.style.display = "block";
                console.log("Paused scrolling.");
            } else {
                notificationBox.style.display = "none";
                console.log("Resumed scrolling.");
                scrollLoop();
            }
        }
    });

    // Stop scrolling if the user manually scrolls
    window.addEventListener("wheel", () => {
        if (!isStopped) {
            isStopped = true;
            isPaused = false; // Prevent pause after stopping
            notificationBox.style.display = "none"; // Hide notification
            console.log("Scrolling stopped by user.");
        }
    });
}

// Listen for messages from popup.js to start scrolling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startScrolling") {
        console.log("Message received: startScrolling");
        const wpm = message.wpm;
        const totalWordCount = calculateVisibleWords();

        const { scrollMovements, scrollTimePerMovement } = calculateScrollMovements(totalWordCount, wpm);
        simulateScrolling(scrollMovements, scrollTimePerMovement);
    }
});
