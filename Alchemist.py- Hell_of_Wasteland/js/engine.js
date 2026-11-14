// --- GLOBAL ENGINE ---
let pyodide;

// Initialize Python
async function initPython() {
    pyodide = await loadPyodide();
    // This tells Python where to send "print" statements (to our JS console/variable)
    await pyodide.runPythonAsync(`
        import sys
        import io
        sys.stdout = io.StringIO()
    `);
    console.log("Python Alchemist is ready.");
}

// Function to run and capture output
async function evaluatePython(code) {
    try {
        // Clear previous output
        await pyodide.runPythonAsync("sys.stdout.truncate(0); sys.stdout.seek(0)");
        
        // Execute user code
        await pyodide.runPythonAsync(code);
        
        // Return whatever was printed to the console
        return pyodide.runPython("sys.stdout.getvalue()").trim();
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

// The Typewriter: Used by all levels for dialogue
function startTypewriter(message, targetElement, speed = 40, callback = null) {
    if (!message || !targetElement) return; 
    targetElement.innerHTML = "";
    let characterIndex = 0;

    function type() {
        if (characterIndex < message.length) {
            targetElement.innerHTML += message.charAt(characterIndex);
            characterIndex++;
            setTimeout(type, speed);
        } else if (callback) {
            callback();
        }
    }
    type(); 
}

// Utility to trigger the 'Enter' key logic via button click
function setupSubmitButton(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(buttonId);
    if (!btn || !input) return;

    btn.addEventListener('click', () => {
        const event = new KeyboardEvent('keypress', { key: 'Enter' });
        input.dispatchEvent(event);
    });
}

// ── LEVEL PROGRESS (localStorage) ──
function completeLevel(levelNum) {
    try {
        var saved = localStorage.getItem("alchemist_progress");
        var progress = saved ? JSON.parse(saved) : { completed: [] };
        if (progress.completed.indexOf(levelNum) === -1) {
            progress.completed.push(levelNum);
            localStorage.setItem("alchemist_progress", JSON.stringify(progress));
        }
    } catch (e) {
        console.error("Could not save progress:", e);
    }
}

function getLevelProgress(nextHref) {
    const levelMatch = String(nextHref).match(/lvl(\d+)\.html/i);
    const level = levelMatch ? Math.max(1, Math.min(10, Number(levelMatch[1]))) : 1;
    const percent = Math.round((level / 10) * 100);
    return { level, percent };
}

function showLevelLoading(nextHref, message = "Loading next level...") {
    if (!nextHref) return;

    // Mark the current level as completed
    var progress = getLevelProgress(nextHref);
    var currentLevel = progress.level - 1;
    if (currentLevel >= 1 && currentLevel <= 10) {
        completeLevel(currentLevel);
    }
    let overlay = document.getElementById("level-loading-screen");
    if (!overlay) {
        const style = document.createElement("style");
        style.id = "level-loading-style";
        style.textContent = `
            #level-loading-screen {
                position: fixed;
                inset: 0;
                z-index: 99999;
                display: grid;
                align-items: end;
                justify-items: center;
                padding: 0 24px 58px;
                background:
                    linear-gradient(180deg, rgba(0, 10, 18, 0.08), rgba(0, 5, 10, 0.7) 64%, rgba(0, 0, 0, 0.92)),
                    url('../assets/loading/mansion-loading.jpeg') center/cover no-repeat;
                color: #f4d58d;
                font-family: 'Press Start 2P', cursive;
                text-align: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 260ms ease;
            }

            #level-loading-screen.visible {
                opacity: 1;
                pointer-events: auto;
            }

            #level-loading-screen::before {
                content: '';
                position: absolute;
                inset: 0;
                background:
                    radial-gradient(circle at 50% 34%, rgba(207, 255, 232, 0.24), transparent 24%),
                    radial-gradient(circle at 72% 62%, rgba(255, 182, 74, 0.16), transparent 20%);
                pointer-events: none;
            }

            #level-loading-screen .loading-content {
                position: relative;
                width: min(720px, 92vw);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
            }

            #level-loading-screen .loading-title {
                font-size: 14px;
                line-height: 2;
                color: #fff3b0;
                text-shadow: 3px 3px 0 #05080a, 0 0 18px rgba(255, 210, 97, 0.65);
                text-transform: uppercase;
            }

            #level-loading-screen .loading-progress-meta {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                color: #d8fbff;
                font-size: 8px;
                line-height: 1.8;
                text-shadow: 2px 2px 0 #031018, 0 0 12px rgba(121, 224, 255, 0.65);
            }

            #level-loading-screen .loading-progress-track {
                width: 100%;
                height: 18px;
                border: 2px solid rgba(223, 255, 243, 0.85);
                background: rgba(2, 10, 16, 0.74);
                box-shadow: 0 0 18px rgba(112, 255, 226, 0.35), inset 0 0 14px rgba(0, 0, 0, 0.7);
                overflow: hidden;
            }

            #level-loading-screen .loading-progress-fill {
                width: 0%;
                height: 100%;
                background: linear-gradient(90deg, #2cf5d2, #f5d56b, #ff8e3d);
                box-shadow: 0 0 18px rgba(245, 213, 107, 0.75);
                transition: width 700ms ease;
            }

            #level-loading-screen .loading-subtitle {
                color: #c9e5ef;
                font-size: 7px;
                line-height: 2;
                text-shadow: 2px 2px 0 #031018;
            }

            @media (max-width: 700px) {
                #level-loading-screen {
                    padding: 0 16px 42px;
                }

                #level-loading-screen .loading-title {
                    font-size: 10px;
                }

                #level-loading-screen .loading-progress-meta {
                    font-size: 6px;
                }
            }
        `;
        document.head.appendChild(style);

        overlay = document.createElement("div");
        overlay.id = "level-loading-screen";
        overlay.setAttribute("role", "status");
        overlay.setAttribute("aria-live", "polite");
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-title"></div>
                <div class="loading-progress-meta">
                    <span class="loading-level"></span>
                    <span class="loading-percent"></span>
                </div>
                <div class="loading-progress-track">
                    <div class="loading-progress-fill"></div>
                </div>
                <div class="loading-subtitle">Preparing the next chamber...</div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    overlay.querySelector(".loading-title").textContent = message;
    overlay.querySelector(".loading-level").textContent = "LEVEL " + String(progress.level).padStart(2, "0") + " / 10";
    overlay.querySelector(".loading-percent").textContent = progress.percent + "%";
    overlay.querySelector(".loading-progress-fill").style.width = progress.percent + "%";
    overlay.classList.add("visible");

    setTimeout(() => {
        window.location.href = nextHref;
    }, 1300);
}

window.showLevelLoading = showLevelLoading;

// ── CHAPTER 2 LEVEL PROGRESS (localStorage) ──
function completeLevelCh2(levelNum) {
    try {
        var saved = localStorage.getItem("alchemist_progress_ch2");
        var progress = saved ? JSON.parse(saved) : { completed: [] };
        if (progress.completed.indexOf(levelNum) === -1) {
            progress.completed.push(levelNum);
            localStorage.setItem("alchemist_progress_ch2", JSON.stringify(progress));
        }
    } catch (e) {
        console.error("Could not save ch2 progress:", e);
    }
}

// Background images per level transition (keyed by NEXT level number)
var CH2_LOADING_IMAGES = {
    12: '../assets/Loading part 2/The Forest.webp',
    13: '../assets/Loading part 2/The Forest.webp',
    14: '../assets/Loading part 2/KristyGlas on Twitter.jpg',
    15: '../assets/Loading part 2/KristyGlas on Twitter.jpg',
    16: '../assets/Loading part 2/KristyGlas on Twitter.jpg',
    17: '../assets/Loading part 2/Pixel Art Forest Bar Nestled among Trees, Ai Generated Stock Photo - Image of retro, drawing_ 356300166.jpg',
    18: '../assets/Loading part 2/download (3).jpg',
    19: '../assets/Loading part 2/Gemini_Generated_Image_8r13fh8r13fh8r13.png',
    20: '../assets/Loading part 2/download (1).gif'
};

// Default fallback image
var CH2_LOADING_FALLBACK = '../assets/Loading part 2/The Forest.webp';

function getLevelProgressCh2(nextHref) {
    var levelMatch = String(nextHref).match(/lvl(\d+)\.html/i);
    var level = levelMatch ? Number(levelMatch[1]) : 11;
    var total = 10; // levels 11-20 = 10 levels
    var done = Math.max(0, level - 11);
    var percent = Math.round((done / total) * 100);
    return { level: level, percent: percent };
}

function showLevelLoadingCh2(nextHref, message) {
    if (!nextHref) return;

    var progress = getLevelProgressCh2(nextHref);
    var bgImage = CH2_LOADING_IMAGES[progress.level] || CH2_LOADING_FALLBACK;

    var overlay = document.getElementById("level-loading-screen-ch2");
    if (!overlay) {
        var style = document.createElement("style");
        style.id = "level-loading-style-ch2";
        style.textContent = '\
            #level-loading-screen-ch2 {\
                position: fixed;\
                inset: 0;\
                z-index: 99999;\
                display: grid;\
                align-items: end;\
                justify-items: center;\
                padding: 0 24px 58px;\
                color: #a5f3fc;\
                font-family: "Press Start 2P", cursive;\
                text-align: center;\
                opacity: 0;\
                pointer-events: none;\
                transition: opacity 360ms ease;\
            }\
            #level-loading-screen-ch2 .ch2-loading-bg {\
                position: absolute;\
                inset: 0;\
                background-size: cover;\
                background-position: center;\
                background-repeat: no-repeat;\
                z-index: 0;\
            }\
            #level-loading-screen-ch2 .ch2-loading-overlay {\
                position: absolute;\
                inset: 0;\
                background: linear-gradient(180deg, rgba(0,10,18,0.10), rgba(0,5,10,0.72) 64%, rgba(0,0,0,0.94));\
                z-index: 1;\
            }\
            #level-loading-screen-ch2.visible {\
                opacity: 1;\
                pointer-events: auto;\
            }\
            #level-loading-screen-ch2 .loading-content {\
                position: relative;\
                z-index: 2;\
                width: min(720px, 92vw);\
                display: flex;\
                flex-direction: column;\
                align-items: center;\
                gap: 16px;\
            }\
            #level-loading-screen-ch2 .loading-title {\
                font-size: 14px;\
                line-height: 2;\
                color: #e0f2fe;\
                text-shadow: 3px 3px 0 #05080a, 0 0 18px rgba(103,232,249,0.65);\
                text-transform: uppercase;\
            }\
            #level-loading-screen-ch2 .loading-progress-meta {\
                width: 100%;\
                display: flex;\
                align-items: center;\
                justify-content: space-between;\
                gap: 12px;\
                color: #d8fbff;\
                font-size: 8px;\
                line-height: 1.8;\
                text-shadow: 2px 2px 0 #031018, 0 0 12px rgba(103,232,249,0.65);\
            }\
            #level-loading-screen-ch2 .loading-progress-track {\
                width: 100%;\
                height: 18px;\
                border: 2px solid rgba(165,243,252,0.85);\
                background: rgba(2,10,16,0.74);\
                box-shadow: 0 0 18px rgba(34,211,238,0.35), inset 0 0 14px rgba(0,0,0,0.7);\
                overflow: hidden;\
            }\
            #level-loading-screen-ch2 .loading-progress-fill {\
                width: 0%;\
                height: 100%;\
                background: linear-gradient(90deg, #22d3ee, #67e8f9, #a78bfa);\
                box-shadow: 0 0 18px rgba(34,211,238,0.75);\
                transition: width 700ms ease;\
            }\
            #level-loading-screen-ch2 .loading-subtitle {\
                color: #94a3b8;\
                font-size: 7px;\
                line-height: 2;\
                text-shadow: 2px 2px 0 #031018;\
            }\
            @media (max-width: 700px) {\
                #level-loading-screen-ch2 { padding: 0 16px 42px; }\
                #level-loading-screen-ch2 .loading-title { font-size: 10px; }\
                #level-loading-screen-ch2 .loading-progress-meta { font-size: 6px; }\
            }\
        ';
        document.head.appendChild(style);

        overlay = document.createElement("div");
        overlay.id = "level-loading-screen-ch2";
        overlay.setAttribute("role", "status");
        overlay.setAttribute("aria-live", "polite");
        overlay.innerHTML = '\
            <div class="ch2-loading-bg"></div>\
            <div class="ch2-loading-overlay"></div>\
            <div class="loading-content">\
                <div class="loading-title"></div>\
                <div class="loading-progress-meta">\
                    <span class="loading-level"></span>\
                    <span class="loading-percent"></span>\
                </div>\
                <div class="loading-progress-track">\
                    <div class="loading-progress-fill"></div>\
                </div>\
                <div class="loading-subtitle">Preparing the next chapter...</div>\
            </div>\
        ';
        document.body.appendChild(overlay);
    }

    // Set background image
    overlay.querySelector(".ch2-loading-bg").style.backgroundImage = 'url("' + bgImage + '")';
    overlay.querySelector(".loading-title").textContent = message;
    overlay.querySelector(".loading-level").textContent = "LEVEL " + String(progress.level).padStart(2, "0") + " / 20";
    overlay.querySelector(".loading-percent").textContent = progress.percent + "%";
    overlay.querySelector(".loading-progress-fill").style.width = progress.percent + "%";
    overlay.classList.add("visible");

    setTimeout(function () {
        window.location.href = nextHref;
    }, 2800);
}

window.showLevelLoadingCh2 = showLevelLoadingCh2;
window.completeLevelCh2 = completeLevelCh2;

// ── CHAPTER 3 LEVEL PROGRESS (localStorage) ──
function completeLevelCh3(levelNum) {
    try {
        var saved = localStorage.getItem("alchemist_progress_ch3");
        var progress = saved ? JSON.parse(saved) : { completed: [] };
        if (progress.completed.indexOf(levelNum) === -1) {
            progress.completed.push(levelNum);
            localStorage.setItem("alchemist_progress_ch3", JSON.stringify(progress));
        }
    } catch (e) {
        console.error("Could not save ch3 progress:", e);
    }
}

// Background images per level transition (keyed by NEXT level number)
// 1-2.png = between 21-22, so next level 22 shows 1-2.png
// 7-9.png = between 27-29, so next levels 28 AND 29 show 7-9.png
var CH3_LOADING_IMAGES = {
    22: '../assets/Loading part 3/1-2.png',
    23: '../assets/Loading part 3/2-3.png',
    24: '../assets/Loading part 3/3-4.png',
    25: '../assets/Loading part 3/4-5.png',
    26: '../assets/Loading part 3/5-6.png',
    27: '../assets/Loading part 3/6-7.png',
    28: '../assets/Loading part 3/7-9.png',
    29: '../assets/Loading part 3/7-9.png',
    30: '../assets/Loading part 3/7-9.png'
};

// Default fallback image
var CH3_LOADING_FALLBACK = '../assets/Loading part 3/1-2.png';

function getLevelProgressCh3(nextHref) {
    var levelMatch = String(nextHref).match(/lvl(\d+)\.html/i);
    var level = levelMatch ? Number(levelMatch[1]) : 21;
    var total = 10; // levels 21-30 = 10 levels
    var done = Math.max(0, level - 21);
    var percent = Math.round((done / total) * 100);
    return { level: level, percent: percent };
}

function showLevelLoadingCh3(nextHref, message) {
    if (!nextHref) return;

    var progress = getLevelProgressCh3(nextHref);
    var bgImage = CH3_LOADING_IMAGES[progress.level] || CH3_LOADING_FALLBACK;

    var overlay = document.getElementById("level-loading-screen-ch3");
    if (!overlay) {
        var style = document.createElement("style");
        style.id = "level-loading-style-ch3";
        style.textContent = '\
            #level-loading-screen-ch3 {\
                position: fixed;\
                inset: 0;\
                z-index: 99999;\
                display: grid;\
                align-items: end;\
                justify-items: center;\
                padding: 0 24px 58px;\
                color: #fca5a5;\
                font-family: "Press Start 2P", cursive;\
                text-align: center;\
                opacity: 0;\
                pointer-events: none;\
                transition: opacity 360ms ease;\
            }\
            #level-loading-screen-ch3 .ch3-loading-bg {\
                position: absolute;\
                inset: 0;\
                background-size: cover;\
                background-position: center;\
                background-repeat: no-repeat;\
                z-index: 0;\
            }\
            #level-loading-screen-ch3 .ch3-loading-overlay {\
                position: absolute;\
                inset: 0;\
                background: linear-gradient(180deg, rgba(10,0,5,0.10), rgba(8,0,3,0.72) 64%, rgba(0,0,0,0.94));\
                z-index: 1;\
            }\
            #level-loading-screen-ch3.visible {\
                opacity: 1;\
                pointer-events: auto;\
            }\
            #level-loading-screen-ch3 .loading-content {\
                position: relative;\
                z-index: 2;\
                width: min(720px, 92vw);\
                display: flex;\
                flex-direction: column;\
                align-items: center;\
                gap: 16px;\
            }\
            #level-loading-screen-ch3 .loading-title {\
                font-size: 14px;\
                line-height: 2;\
                color: #fecaca;\
                text-shadow: 3px 3px 0 #0a0005, 0 0 18px rgba(239,68,68,0.65);\
                text-transform: uppercase;\
            }\
            #level-loading-screen-ch3 .loading-progress-meta {\
                width: 100%;\
                display: flex;\
                align-items: center;\
                justify-content: space-between;\
                gap: 12px;\
                color: #fecdd3;\
                font-size: 8px;\
                line-height: 1.8;\
                text-shadow: 2px 2px 0 #0a0005, 0 0 12px rgba(239,68,68,0.65);\
            }\
            #level-loading-screen-ch3 .loading-progress-track {\
                width: 100%;\
                height: 18px;\
                border: 2px solid rgba(254,202,202,0.85);\
                background: rgba(10,0,5,0.74);\
                box-shadow: 0 0 18px rgba(239,68,68,0.35), inset 0 0 14px rgba(0,0,0,0.7);\
                overflow: hidden;\
            }\
            #level-loading-screen-ch3 .loading-progress-fill {\
                width: 0%;\
                height: 100%;\
                background: linear-gradient(90deg, #dc2626, #ef4444, #f97316);\
                box-shadow: 0 0 18px rgba(239,68,68,0.75);\
                transition: width 700ms ease;\
            }\
            #level-loading-screen-ch3 .loading-subtitle {\
                color: #94a3b8;\
                font-size: 7px;\
                line-height: 2;\
                text-shadow: 2px 2px 0 #0a0005;\
            }\
            @media (max-width: 700px) {\
                #level-loading-screen-ch3 { padding: 0 16px 42px; }\
                #level-loading-screen-ch3 .loading-title { font-size: 10px; }\
                #level-loading-screen-ch3 .loading-progress-meta { font-size: 6px; }\
            }\
        ';
        document.head.appendChild(style);

        overlay = document.createElement("div");
        overlay.id = "level-loading-screen-ch3";
        overlay.setAttribute("role", "status");
        overlay.setAttribute("aria-live", "polite");
        overlay.innerHTML = '\
            <div class="ch3-loading-bg"></div>\
            <div class="ch3-loading-overlay"></div>\
            <div class="loading-content">\
                <div class="loading-title"></div>\
                <div class="loading-progress-meta">\
                    <span class="loading-level"></span>\
                    <span class="loading-percent"></span>\
                </div>\
                <div class="loading-progress-track">\
                    <div class="loading-progress-fill"></div>\
                </div>\
                <div class="loading-subtitle">Descending deeper into Hell...</div>\
            </div>\
        ';
        document.body.appendChild(overlay);
    }

    // Set background image
    overlay.querySelector(".ch3-loading-bg").style.backgroundImage = 'url("' + bgImage + '")';
    overlay.querySelector(".loading-title").textContent = message;
    overlay.querySelector(".loading-level").textContent = "LEVEL " + String(progress.level).padStart(2, "0") + " / 30";
    overlay.querySelector(".loading-percent").textContent = progress.percent + "%";
    overlay.querySelector(".loading-progress-fill").style.width = progress.percent + "%";
    overlay.classList.add("visible");

    setTimeout(function () {
        window.location.href = nextHref;
    }, 2800);
}

window.showLevelLoadingCh3 = showLevelLoadingCh3;
window.completeLevelCh3 = completeLevelCh3;
