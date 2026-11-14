/* ============================================================
   ALCHEMIST.PY — LEVEL 3: THE LEVER GATE
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

// The 6 lever numbers (randomly assigned to levers)
var LEVER_NUMBERS = [1, 2, 3, 4, 5, 6];

// Dialogue lines shown at the start
var DIALOGUE_LINES = [
    "A gate... sealed with ancient mechanisms.",
    "Six levers stand before us, each marked with a number.",
    "Only the EVEN-numbered levers must be flipped to unlock the gate.",
    "But how do we know which are even and which are odd?",
    "Use if/else with the modulo operator (%) to check each lever one by one.",
    "if num % 2 == 0 means EVEN. else means ODD.",
    "Click on me when you are ready to check the first lever..."
];

// Gate background images for different states
var GATE_IMAGES = {
    evenFlipped: '../assets/Level3/gate_levers_down.jpg',
    gateOpen: '../assets/Level3/gate_levers_down.jpg'
};

// ============================================================
// STATE
// ============================================================
var currentLeverIndex = 0;   // which lever we're checking now (0–5)
var dialogueIndex = 0;
var typingTimeout = null;
var canAdvance = true;
var isTyping = false;
var pyodideReady = false;
var particles = [];
var gateOpened = false;
var progressPercent = 0;

// ============================================================
// DOM REFS
// ============================================================
var gateImage = document.getElementById('gate-image');
var progressBarFill = document.getElementById('progress-bar-fill');
var progressPercEl = document.getElementById('progress-percent');
var progressHud = document.getElementById('progress-hud');
var leverHud = document.getElementById('lever-hud');
var leverSlotsEl = document.getElementById('lever-slots');
var catSprite = document.getElementById('the-cat-lvl3');
var dialogueBox = document.getElementById('dialogue-box');
var typewriterText = document.getElementById('typewriter-text-lvl3');
var grimoireOverlay = document.getElementById('grimoire-overlay');
var grimoireClose = document.getElementById('grimoire-close');
var spellTaskText = document.getElementById('spell-task-text');
var leverNumbersRow = document.getElementById('lever-numbers-row');
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
// SHUFFLE LEVER NUMBERS
// ============================================================
function shuffleArray(arr) {
    var i, j, temp;
    for (i = arr.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr;
}

// ============================================================
// INITIALIZE
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Shuffle lever numbers for random order
    LEVER_NUMBERS = shuffleArray(LEVER_NUMBERS.slice());

    // Init Pyodide
    initPython().then(function () {
        pyodideReady = true;
    }).catch(function (e) {
        console.error("Pyodide failed to load:", e);
    });

    // Build lever HUD and lever display in editor
    buildLeverHud();
    buildLeverDisplay();

    // Show cat & start dialogue after short delay
    setTimeout(function () {
        catSprite.style.display = 'block';
        dialogueBox.style.display = 'block';
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
        showLevelLoading('lvl4.html', 'Loading Level 4...');
    });

    // Click dialogue to advance
    dialogueBox.addEventListener('click', advanceDialogue);

    // Start particle animation loop
    animateParticles();

    // Add torch flicker to gate image
    gateImage.classList.add('torch-flicker');
});

// ============================================================
// DIALOGUE SYSTEM
// ============================================================
function showDialogue(index) {
    if (index >= DIALOGUE_LINES.length) {
        // All dialogue done — show HUD elements
        leverHud.classList.add('visible');
        progressHud.classList.add('visible');
        return;
    }

    dialogueIndex = index;
    isTyping = true;

    typewriterText.innerHTML = '';
    var text = DIALOGUE_LINES[index];
    var charIdx = 0;

    function typeChar() {
        if (charIdx < text.length) {
            typewriterText.innerHTML += text.charAt(charIdx);
            charIdx++;
            typingTimeout = setTimeout(typeChar, 35);
        } else {
            isTyping = false;
            var prompt = document.createElement('div');
            prompt.className = 'click-prompt';
            prompt.textContent = '▼ CLICK TO CONTINUE ▼';
            typewriterText.appendChild(prompt);
        }
    }

    typeChar();
}

function advanceDialogue() {
    if (isTyping) {
        clearTimeout(typingTimeout);
        isTyping = false;
        typewriterText.textContent = DIALOGUE_LINES[dialogueIndex];
        var prompt = document.createElement('div');
        prompt.className = 'click-prompt';
        prompt.textContent = '▼ CLICK TO CONTINUE ▼';
        typewriterText.appendChild(prompt);
        return;
    }

    dialogueIndex++;
    if (dialogueIndex < DIALOGUE_LINES.length) {
        showDialogue(dialogueIndex);
    } else {
        leverHud.classList.add('visible');
        progressHud.classList.add('visible');
        dialogueBox.style.display = 'none';
    }
}

// ============================================================
// LEVER HUD (Right side panel)
// ============================================================
function buildLeverHud() {
    leverSlotsEl.innerHTML = '';
    for (var i = 0; i < LEVER_NUMBERS.length; i++) {
        var num = LEVER_NUMBERS[i];
        var slot = document.createElement('div');
        slot.className = 'lever-slot ' + (i === 0 ? 'active' : 'pending');
        slot.id = 'lever-slot-' + num;

        var icon = document.createElement('span');
        icon.className = 'lever-slot-icon';
        icon.textContent = (i === 0) ? '➡️' : '🔩';

        var text = document.createElement('span');
        text.className = 'lever-slot-text';
        text.textContent = 'Lever #' + num + ' — ???';

        slot.appendChild(icon);
        slot.appendChild(text);
        leverSlotsEl.appendChild(slot);
    }
}

// Lever numbers row inside the grimoire
function buildLeverDisplay() {
    leverNumbersRow.innerHTML = '';
    for (var i = 0; i < LEVER_NUMBERS.length; i++) {
        var badge = document.createElement('div');
        badge.className = 'lever-num-badge';
        badge.id = 'lever-badge-' + LEVER_NUMBERS[i];
        badge.textContent = LEVER_NUMBERS[i];
        leverNumbersRow.appendChild(badge);
    }
}

// ============================================================
// GRIMOIRE (Code Editor)
// ============================================================
function openGrimoire() {
    if (gateOpened) return;
    if (currentLeverIndex >= LEVER_NUMBERS.length) return;

    var currentNum = LEVER_NUMBERS[currentLeverIndex];
    spellTaskText.textContent = "Lever #" + currentNum + ": Set num = " + currentNum + " then use if/else to check if it is EVEN or ODD. Print 'EVEN' or 'ODD'.";
    codeInput.value = '';
    outputText.textContent = '';
    outputText.className = '';
    updateLineNumbers();

    grimoireOverlay.classList.add('open');
    codeInput.focus();
}

function closeGrimoire() {
    grimoireOverlay.classList.remove('open');
}

// ============================================================
// CAST SPELL (Run Python Code) — one lever at a time
// ============================================================
function castSpell() {
    if (!pyodideReady) {
        outputText.textContent = "⏳ Python is still loading... please wait.";
        outputText.className = 'error';
        return;
    }

    var code = codeInput.value.trim();
    if (!code) {
        outputText.textContent = "✏️ Write your code first!";
        outputText.className = 'error';
        return;
    }

    outputText.textContent = "🔮 Running code...";
    outputText.className = '';

    // Run the Python code via Pyodide
    evaluatePython(code).then(function (result) {
        processOutput(result);
    });
}

function processOutput(result) {
    var currentNum = LEVER_NUMBERS[currentLeverIndex];
    var isEven = (currentNum % 2 === 0);

    // Check for errors
    if (result.indexOf('Error:') === 0) {
        if (result.indexOf('I/O error') !== -1 || result.indexOf('input') !== -1) {
            outputText.textContent = "❌ input() does not work in the browser!\n\n" +
                "💡 Set the number directly:\n\n" +
                "num = " + currentNum + "\n" +
                "if num % 2 == 0:\n" +
                "    print('EVEN')\n" +
                "else:\n" +
                "    print('ODD')";
        } else {
            outputText.textContent = "❌ Code Failed!\n" + result;
        }
        outputText.className = 'error';
        shakeGrimoire();
        return;
    }

    // Check the output for EVEN or ODD
    var output = result.trim().toUpperCase();
    var userSaidEven = (output.indexOf('EVEN') !== -1);
    var userSaidOdd = (output.indexOf('ODD') !== -1);

    // Must print either EVEN or ODD
    if (!userSaidEven && !userSaidOdd) {
        outputText.textContent = "Output: " + result + "\n\n⚠️ Your code must print 'EVEN' or 'ODD'!\n" +
            "💡 Hint: Use if/else with num % 2 == 0\n\n" +
            "num = " + currentNum + "\n" +
            "if num % 2 == 0:\n" +
            "    print('EVEN')\n" +
            "else:\n" +
            "    print('ODD')";
        outputText.className = 'error';
        shakeGrimoire();
        return;
    }

    // Check correctness
    var correct = false;
    if (isEven && userSaidEven) correct = true;
    if (!isEven && userSaidOdd) correct = true;

    if (!correct) {
        outputText.textContent = "Output: " + result + "\n\n❌ WRONG! " + currentNum + " is " + (isEven ? "EVEN" : "ODD") + ", not " + (isEven ? "ODD" : "EVEN") + ".\n" +
            "Remember: if num % 2 == 0 → EVEN, else → ODD";
        outputText.className = 'error';
        shakeGrimoire();
        return;
    }

    // CORRECT!
    var label = isEven ? "EVEN" : "ODD";
    outputText.textContent = "Output: " + result + "\n\n✨ CORRECT! Lever #" + currentNum + " is " + label + "!";
    outputText.className = 'success';

    // Update lever HUD
    var slot = document.getElementById('lever-slot-' + currentNum);
    var badge = document.getElementById('lever-badge-' + currentNum);

    if (slot) {
        if (isEven) {
            slot.className = 'lever-slot even-flipped';
            slot.querySelector('.lever-slot-icon').textContent = '✅';
            slot.querySelector('.lever-slot-text').textContent = 'Lever #' + currentNum + ' — EVEN ✓ FLIP!';
        } else {
            slot.className = 'lever-slot odd-locked';
            slot.querySelector('.lever-slot-icon').textContent = '🔒';
            slot.querySelector('.lever-slot-text').textContent = 'Lever #' + currentNum + ' — ODD ✗ LOCKED';
        }
    }

    if (badge) {
        badge.className = isEven ? 'lever-num-badge even-done' : 'lever-num-badge odd-done';
    }

    // Update progress
    emitSpellParticles(15);
    currentLeverIndex++;
    progressPercent = Math.floor((currentLeverIndex / LEVER_NUMBERS.length) * 100);
    updateProgress();

    // Mark next lever as active in HUD
    if (currentLeverIndex < LEVER_NUMBERS.length) {
        var nextNum = LEVER_NUMBERS[currentLeverIndex];
        var nextSlot = document.getElementById('lever-slot-' + nextNum);
        if (nextSlot) {
            nextSlot.className = 'lever-slot active';
            nextSlot.querySelector('.lever-slot-icon').textContent = '➡️';
        }
    }

    // Close grimoire after a pause, then move to next lever or finish
    setTimeout(function () {
        closeGrimoire();

        if (currentLeverIndex >= LEVER_NUMBERS.length) {
            // All levers checked — flip even ones and open gate
            setTimeout(function () {
                flipEvenLevers();
            }, 800);
        } else {
            // Prompt for next lever
            showNextLeverPrompt();
        }
    }, 1800);
}

// ============================================================
// NEXT LEVER PROMPT
// ============================================================
function showNextLeverPrompt() {
    var nextNum = LEVER_NUMBERS[currentLeverIndex];
    dialogueBox.style.display = 'block';
    typewriterText.innerHTML = '';
    isTyping = true;

    var msg = "Good! Now check Lever #" + nextNum + ". Is " + nextNum + " even or odd? Click me to write the code!";
    var charIdx = 0;

    function typeChar() {
        if (charIdx < msg.length) {
            typewriterText.innerHTML += msg.charAt(charIdx);
            charIdx++;
            setTimeout(typeChar, 25);
        } else {
            isTyping = false;
        }
    }
    typeChar();

    setTimeout(function () {
        dialogueBox.style.display = 'none';
    }, 5000);
}

// ============================================================
// FLIP EVEN LEVERS & OPEN GATE
// ============================================================
function flipEvenLevers() {
    // Change gate image to show even levers flipped
    gateImage.style.backgroundImage = "url('" + GATE_IMAGES.evenFlipped + "')";
    emitSpellParticles(30);

    // Show dialogue about flipping
    dialogueBox.style.display = 'block';
    typewriterText.innerHTML = '';
    isTyping = true;

    var msg = "The even-numbered levers (" + getEvenNumbers().join(', ') + ") have been flipped! The gate mechanism rumbles...";
    var charIdx = 0;

    function typeChar() {
        if (charIdx < msg.length) {
            typewriterText.innerHTML += msg.charAt(charIdx);
            charIdx++;
            setTimeout(typeChar, 25);
        } else {
            isTyping = false;
        }
    }
    typeChar();

    // After a pause, open the gate
    setTimeout(function () {
        openGate();
    }, 3500);
}

function getEvenNumbers() {
    var evens = [];
    for (var i = 0; i < LEVER_NUMBERS.length; i++) {
        if (LEVER_NUMBERS[i] % 2 === 0) {
            evens.push(LEVER_NUMBERS[i]);
        }
    }
    evens.sort(function (a, b) { return a - b; });
    return evens;
}

function getOddNumbers() {
    var odds = [];
    for (var i = 0; i < LEVER_NUMBERS.length; i++) {
        if (LEVER_NUMBERS[i] % 2 !== 0) {
            odds.push(LEVER_NUMBERS[i]);
        }
    }
    odds.sort(function (a, b) { return a - b; });
    return odds;
}

function openGate() {
    gateOpened = true;

    // Change to open gate image
    gateImage.style.backgroundImage = "url('" + GATE_IMAGES.gateOpen + "')";

    // Big particle burst
    emitSpellParticles(80);

    // Update cat
    catSprite.style.filter = 'brightness(1)';

    // Hide dialogue
    dialogueBox.style.display = 'none';

    // Show success screen after a moment
    setTimeout(triggerVictory, 1500);
}

// ============================================================
// PROGRESS BAR
// ============================================================
function updateProgress() {
    var clamped = Math.min(progressPercent, 100);
    progressBarFill.style.width = clamped + '%';
    progressPercEl.textContent = clamped + '%';
}

// ============================================================
// VICTORY
// ============================================================
function triggerVictory() {
    var evens = getEvenNumbers();
    var odds = getOddNumbers();

    successStats.innerHTML =
        'LEVERS CHECKED: ' + LEVER_NUMBERS.length + '<br>' +
        'EVEN (flipped): ' + evens.join(', ') + '<br>' +
        'ODD (locked): ' + odds.join(', ') + '<br>' +
        'GATE STATUS: OPEN ✓';

    successScreen.classList.add('show');

    // Big particle burst
    emitSpellParticles(120);
}

// ============================================================
// GRIMOIRE SHAKE EFFECT
// ============================================================
function shakeGrimoire() {
    var container = document.getElementById('grimoire-container');
    container.style.animation = 'none';
    container.offsetHeight; // Trigger reflow
    container.style.animation = 'shake 0.4s ease';
}

// Add shake keyframes dynamically
var shakeStyle = document.createElement('style');
shakeStyle.textContent =
    '@keyframes shake {' +
    '0%, 100% { transform: translateX(0); }' +
    '20% { transform: translateX(-8px); }' +
    '40% { transform: translateX(8px); }' +
    '60% { transform: translateX(-5px); }' +
    '80% { transform: translateX(5px); }' +
    '}';
document.head.appendChild(shakeStyle);

// ============================================================
// LINE NUMBERS
// ============================================================
function updateLineNumbers() {
    var lines = codeInput.value.split('\n');
    var nums = '';
    var count = Math.max(lines.length, 8);
    for (var i = 1; i <= count; i++) {
        nums += i + '\n';
    }
    lineNumbers.textContent = nums;
}

function syncScroll() {
    lineNumbers.scrollTop = codeInput.scrollTop;
}

// ============================================================
// PARTICLE SYSTEM
// ============================================================
function resizeCanvas() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
}

function emitSpellParticles(count) {
    for (var i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * particleCanvas.width,
            y: particleCanvas.height + 10,
            vx: (Math.random() - 0.5) * 3,
            vy: -(Math.random() * 4 + 2),
            size: Math.random() * 4 + 1,
            life: 1,
            decay: Math.random() * 0.015 + 0.005,
            color: getRandomSpellColor()
        });
    }
}

function getRandomSpellColor() {
    var colors = [
        '192, 129, 61',    // Bronze
        '218, 165, 32',    // Goldenrod
        '255, 215, 0',     // Gold
        '139, 69, 19',     // Saddle brown
        '74, 222, 128',    // Green (for even)
        '255, 165, 0'      // Orange
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function animateParticles() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

    var alive = [];
    for (var i = 0; i < particles.length; i++) {
        if (particles[i].life > 0) {
            alive.push(particles[i]);
        }
    }
    particles = alive;

    for (var j = 0; j < particles.length; j++) {
        var p = particles[j];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02;
        p.life -= p.decay;

        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        particleCtx.fillStyle = 'rgba(' + p.color + ', ' + p.life + ')';
        particleCtx.fill();

        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        particleCtx.fillStyle = 'rgba(' + p.color + ', ' + (p.life * 0.15) + ')';
        particleCtx.fill();
    }

    // Ambient floating particles
    if (progressPercent > 0 && Math.random() < progressPercent / 250) {
        particles.push({
            x: Math.random() * particleCanvas.width,
            y: Math.random() * particleCanvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -(Math.random() * 0.5 + 0.2),
            size: Math.random() * 2 + 0.5,
            life: 0.6,
            decay: 0.005,
            color: '218, 165, 32'
        });
    }

    requestAnimationFrame(animateParticles);
}
