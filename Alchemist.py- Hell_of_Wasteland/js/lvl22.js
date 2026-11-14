/* ============================================================
   ALCHEMIST.PY — LEVEL 22: THE CLIFF RESCUE
   (Matrix Spiral Order — Save the Unicorn)
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

// The 3×3 matrix and its clockwise spiral
// Matrix:  1 2 3
//          4 5 6
//          7 8 9
// Spiral:  1 2 3 6 9 8 7 4 5

var EXPECTED_OUTPUT = "1 2 3 6 9 8 7 4 5";

// Dialogue script: speaker is "cat" or "unicorn"
// Scene 1: background image 1 (demon wasteland)
// After line with changeBg: true → switch to background image 2 (unicorn + cliff)
var DIALOGUE_SCRIPT = [
    { speaker: "cat",     text: "This place is very dangerous and filled with powerful demons..." },
    { speaker: "cat",     text: "I need to stay alert... every shadow could be a threat." },
    { speaker: "unicorn", text: "HELPPP!!! Someone please help me!!!", changeBgAfter: true },
    { speaker: "cat",     text: "That voice! Someone's in trouble!" },
    { speaker: "cat",     text: "I'm running towards the edge of the cliff... I can see someone!" },
    { speaker: "cat",     text: "It's a UNICORN! She's surrounded by demons at the edge of the cliff!" },
    { speaker: "unicorn", text: "Please! These demons have me cornered! I can't escape!" },
    { speaker: "cat",     text: "Hold on! I'll save you!" },
    { speaker: "unicorn", text: "Be careful! They're incredibly strong! You'll need a powerful spell!" },
    { speaker: "cat",     text: "I need a Matrix Beam spell! If I spiral through a 3×3 matrix, I can create a devastating attack!" },
    { speaker: "cat",     text: "The matrix is: [[1,2,3],[4,5,6],[7,8,9]]" },
    { speaker: "cat",     text: "I need to print it in clockwise spiral order to unleash the beam!" },
    { speaker: "unicorn", text: "Hurry! They're getting closer! I believe in you!" },
    { speaker: "cat",     text: "Stand back! Click on me to cast the Matrix Beam!" }
];

// ============================================================
// STATE
// ============================================================
var dialogueIndex = 0;
var typingTimeout = null;
var isTyping = false;
var pyodideReady = false;
var particles = [];
var puzzleSolved = false;
var attemptsCount = 0;
var bgSwitched = false;

// ============================================================
// DOM REFS
// ============================================================
var roomBg = document.getElementById('room-bg');
var matrixHud = document.getElementById('matrix-hud');
var matrixStatus = document.getElementById('matrix-status');
var catSprite = document.getElementById('the-cat-lvl22');
var unicornSprite = document.getElementById('the-unicorn-lvl22');
var catDialogue = document.getElementById('dialogue-box-cat');
var catTypewriter = document.getElementById('typewriter-text-cat');
var unicornDialogue = document.getElementById('dialogue-box-unicorn');
var unicornTypewriter = document.getElementById('typewriter-text-unicorn');
var grimoireOverlay = document.getElementById('grimoire-overlay');
var grimoireClose = document.getElementById('grimoire-close');
var spellTaskText = document.getElementById('spell-task-text');
var codeInput = document.getElementById('code-input');
var lineNumbers = document.getElementById('line-numbers');
var outputText = document.getElementById('output-text');
var btnCastSpell = document.getElementById('btn-cast-spell');
var btnClear = document.getElementById('btn-clear');
var successScreen = document.getElementById('success-screen');
var successStats = document.getElementById('success-stats');
var btnContinue = document.getElementById('btn-continue');
var particleCanvas = document.getElementById('spell-particles');
var particleCtx = particleCanvas.getContext('2d');

// ============================================================
// INITIALIZE
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Init Pyodide
    initPython().then(function () {
        pyodideReady = true;
    }).catch(function (e) {
        console.error("Pyodide failed to load:", e);
    });

    // Show cat & start dialogue
    setTimeout(function () {
        catSprite.style.display = 'block';
        showDialogue(0);
    }, 800);

    // Cat click → open grimoire
    catSprite.addEventListener('click', openGrimoire);

    // Grimoire controls
    grimoireClose.addEventListener('click', closeGrimoire);
    btnCastSpell.addEventListener('click', castSpell);
    btnClear.addEventListener('click', function () {
        codeInput.value = '';
        outputText.textContent = '';
        outputText.className = '';
        updateLineNumbers();
    });

    // Line numbers
    codeInput.addEventListener('input', updateLineNumbers);
    codeInput.addEventListener('scroll', syncScroll);
    updateLineNumbers();

    // Continue button
    btnContinue.addEventListener('click', function () {
        completeLevelCh3(22);
        showLevelLoadingCh3('lvl23.html', 'Loading Level 23...');
    });

    // Click dialogue to advance
    catDialogue.addEventListener('click', advanceDialogue);
    unicornDialogue.addEventListener('click', advanceDialogue);

    // Start particle animation loop
    animateParticles();
});


// ============================================================
// DIALOGUE (Dual-speaker system: Cat & Unicorn)
// ============================================================
function showDialogue(index) {
    if (index >= DIALOGUE_SCRIPT.length) {
        // All dialogue done — hide both dialogues, show only cat + HUD
        catDialogue.style.display = 'none';
        unicornDialogue.style.display = 'none';
        catSprite.style.display = 'block';
        unicornSprite.style.display = 'none';
        matrixHud.classList.add('visible');
        return;
    }

    dialogueIndex = index;
    isTyping = true;

    var line = DIALOGUE_SCRIPT[index];

    if (line.speaker === "unicorn") {
        // Show unicorn sprite + dialogue, hide cat sprite + dialogue
        catSprite.style.display = 'none';
        catDialogue.style.display = 'none';
        unicornSprite.style.display = 'block';
        unicornDialogue.style.display = 'block';
        unicornTypewriter.innerHTML = '';
        typewriteText(unicornTypewriter, line.text, 'unicorn');
    } else {
        // Show cat sprite + dialogue, hide unicorn sprite + dialogue
        unicornSprite.style.display = 'none';
        unicornDialogue.style.display = 'none';
        catSprite.style.display = 'block';
        catDialogue.style.display = 'block';
        catTypewriter.innerHTML = '';
        typewriteText(catTypewriter, line.text, 'cat');
    }
}

function typewriteText(element, message, speaker) {
    var ci = 0;
    element.innerHTML = '';
    (function type() {
        if (ci < message.length) {
            element.innerHTML += message.charAt(ci);
            ci++;
            typingTimeout = setTimeout(type, 30);
        } else {
            isTyping = false;
            addPromptTo(element, speaker);
        }
    })();
}

function addPromptTo(element, speaker) {
    var prompt = document.createElement('div');
    prompt.className = 'click-prompt';
    prompt.textContent = '▼ CLICK TO CONTINUE ▼';
    element.appendChild(prompt);
}

function advanceDialogue() {
    if (isTyping) {
        clearTimeout(typingTimeout);
        isTyping = false;
        var line = DIALOGUE_SCRIPT[dialogueIndex];
        if (line.speaker === "unicorn") {
            unicornTypewriter.textContent = line.text;
            addPromptTo(unicornTypewriter, 'unicorn');
        } else {
            catTypewriter.textContent = line.text;
            addPromptTo(catTypewriter, 'cat');
        }
        return;
    }

    // Check if the current line should trigger bg change AFTER it finishes
    var currentLine = DIALOGUE_SCRIPT[dialogueIndex];
    if (currentLine.changeBgAfter && !bgSwitched) {
        bgSwitched = true;
        roomBg.classList.add('scene2');
    }

    dialogueIndex++;
    if (dialogueIndex < DIALOGUE_SCRIPT.length) {
        showDialogue(dialogueIndex);
    } else {
        // Dialogue finished — show only cat for grimoire access
        catDialogue.style.display = 'none';
        unicornDialogue.style.display = 'none';
        catSprite.style.display = 'block';
        unicornSprite.style.display = 'none';
        matrixHud.classList.add('visible');
    }
}

// ============================================================
// GRIMOIRE
// ============================================================
function openGrimoire() {
    if (puzzleSolved) return;

    spellTaskText.textContent = 'Print the 3×3 matrix [[1,2,3],[4,5,6],[7,8,9]] in clockwise spiral order. Print all numbers on a single line separated by spaces. Do NOT use any external libraries.';
    codeInput.value = '';
    outputText.textContent = '';
    outputText.className = '';
    updateLineNumbers();
    grimoireOverlay.classList.add('open');
    setTimeout(function () {
        codeInput.focus();
    }, 250);
}

function closeGrimoire() {
    grimoireOverlay.classList.remove('open');
}

function castSpell() {
    if (!pyodideReady) {
        outputText.textContent = 'Python is still loading...';
        outputText.className = 'error';
        return;
    }

    var code = codeInput.value.trim();
    if (!code) {
        outputText.textContent = 'Write some Python first.';
        outputText.className = 'error';
        return;
    }

    attemptsCount++;
    outputText.textContent = 'Casting the spell...';
    outputText.className = '';

    evaluatePython(code).then(function (result) {
        if (result.indexOf('Error:') === 0) {
            if (result.indexOf('input') !== -1) {
                outputText.textContent = "❌ input() doesn't work here!\n\n💡 Hardcode the matrix:\nmatrix = [[1,2,3],[4,5,6],[7,8,9]]";
            } else {
                outputText.textContent = result;
            }
            outputText.className = 'error';
            shakeGrimoire();
            return;
        }

        // Normalize output
        var trimmed = result.trim().replace(/\r\n/g, '\n').replace(/\n/g, ' ').replace(/ +/g, ' ');

        if (trimmed === EXPECTED_OUTPUT) {
            outputText.textContent = 'Output:\n' + result.trim() + '\n\n🌀 CORRECT! The Matrix Beam blasts the demons away!';
            outputText.className = 'success';
            puzzleSolved = true;

            setTimeout(function () {
                closeGrimoire();
                triggerVictory();
            }, 1200);
        } else {
            var hint = 'Expected: 1 2 3 6 9 8 7 4 5\n\n';
            hint += 'Clockwise spiral of:\n';
            hint += '  1 2 3\n';
            hint += '  4 5 6\n';
            hint += '  7 8 9\n\n';
            hint += '→ Right across top: 1 2 3\n';
            hint += '→ Down right side: 6 9\n';
            hint += '→ Left across bottom: 8 7\n';
            hint += '→ Up left side: 4\n';
            hint += '→ Center: 5';
            outputText.textContent = 'Output:\n' + result.trim() + '\n\n❌ Not quite!\n' + hint;
            outputText.className = 'error';
            shakeGrimoire();
        }
    });
}

// ============================================================
// VICTORY SEQUENCE
// ============================================================
function triggerVictory() {
    // Update HUD
    matrixStatus.textContent = '✓ SPIRAL COMPLETE!';
    matrixStatus.classList.add('solved');

    emitParticles(70);

    // Show dual victory dialogue
    unicornDialogue.style.display = 'block';
    catDialogue.style.display = 'none';
    unicornTypewriter.innerHTML = '';
    isTyping = true;
    var msg1 = "You saved me! Thank you so much! I'm Lumina — and I owe you my life! 🦄✨";
    var ci1 = 0;
    (function t1() {
        if (ci1 < msg1.length) {
            unicornTypewriter.innerHTML += msg1.charAt(ci1++);
            setTimeout(t1, 25);
        } else {
            isTyping = false;
        }
    })();

    setTimeout(function () {
        unicornDialogue.style.display = 'none';
        catDialogue.style.display = 'block';
        catTypewriter.innerHTML = '';
        isTyping = true;
        var msg2 = "Don't mention it, Lumina! Together we'll be unstoppable! Let's keep moving! ⚔️🔥";
        var ci2 = 0;
        (function t2() {
            if (ci2 < msg2.length) {
                catTypewriter.innerHTML += msg2.charAt(ci2++);
                setTimeout(t2, 25);
            } else {
                isTyping = false;
            }
        })();
    }, 3000);

    setTimeout(function () {
        catDialogue.style.display = 'none';
        unicornDialogue.style.display = 'none';
        showSuccessScreen();
    }, 6000);
}

function showSuccessScreen() {
    successStats.innerHTML =
        'SPIRAL ORDER: 1 2 3 6 9 8 7 4 5<br>' +
        'MATRIX: 3×3<br>' +
        'UNICORN: RESCUED! 🦄<br>' +
        'DEMONS: OBLITERATED 🔥<br>' +
        'ATTEMPTS: ' + attemptsCount + '<br>' +
        'NEW ALLY: LUMINA THE UNICORN ✨';
    successScreen.classList.add('show');
    emitParticles(80);
}

// ============================================================
// EDITOR UTILITIES
// ============================================================
function updateLineNumbers() {
    var lines = codeInput.value.split('\n').length;
    var count = Math.max(lines, 8);
    var numbers = '';
    for (var i = 1; i <= count; i++) {
        numbers += i + '\n';
    }
    lineNumbers.textContent = numbers;
}

function syncScroll() {
    lineNumbers.scrollTop = codeInput.scrollTop;
}

// ============================================================
// VISUAL EFFECTS
// ============================================================
function resizeCanvas() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
}

function shakeGrimoire() {
    var container = document.getElementById('grimoire-container');
    container.classList.remove('shake');
    void container.offsetWidth;
    container.classList.add('shake');
}

function emitParticles(count) {
    for (var i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * particleCanvas.width,
            y: particleCanvas.height + 10,
            vx: (Math.random() - 0.5) * 3,
            vy: -(Math.random() * 4 + 2),
            life: 1,
            decay: Math.random() * 0.015 + 0.005,
            size: Math.random() * 4 + 1,
            color: ['239,68,68', '251,146,60', '192,132,252', '147,51,234', '233,213,255', '249,115,22'][Math.floor(Math.random() * 6)]
        });
    }
}

function animateParticles() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    particles = particles.filter(function (p) { return p.life > 0; });

    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02;
        p.life -= p.decay;

        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        particleCtx.fillStyle = 'rgba(' + p.color + ',' + p.life + ')';
        particleCtx.fill();

        // Glow
        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        particleCtx.fillStyle = 'rgba(' + p.color + ',' + (p.life * 0.15) + ')';
        particleCtx.fill();
    }

    requestAnimationFrame(animateParticles);
}
