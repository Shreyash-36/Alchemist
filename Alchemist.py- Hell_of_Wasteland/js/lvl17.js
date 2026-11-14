/* ============================================================
   ALCHEMIST.PY — LEVEL 17: THE WIZARD'S RIDDLE
   (Guess the Wizard's Age — Math Riddle)
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

// Riddle math:
// - Odd number between 500 and 1000
// - Less than cube of largest 1-digit number: 9^3 = 729
// - Greater than factorial of (smallest prime × 2nd odd number): 2×3 = 6, 6! = 720
// Valid answers: 721, 723, 725, 727

var WIZARD_AGE = 727;
var EXPECTED_OUTPUT = "727";

// 2-way dialogue (cat + wizard)
var DIALOGUE_SCRIPT = [
    { speaker: "cat",    text: "I'm back! Here are the gold coins, just like you asked!" },
    { speaker: "wizard", text: "Wonderful! You actually survived the cave AND the dragon? Impressive, little one!" },
    { speaker: "cat",    text: "It wasn't easy! Now please, I'm STARVING! Can I have that grilled fish?!" },
    { speaker: "wizard", text: "Ha! A deal is a deal. Here you go — the finest enchanted fish in the realm!" },
    { speaker: "cat",    text: "*munch munch* ...This is the BEST fish I've ever had! Thank you!" },
    { speaker: "wizard", text: "Now that you're fed... I have something important to tell you." },
    { speaker: "cat",    text: "Something important? What is it?" },
    { speaker: "wizard", text: "There exists a legendary artifact — the CRYSTAL COMPILER. Shattered into 5 fragments." },
    { speaker: "wizard", text: "The first fragment is hidden in the Castle of Heartwood Sapphire." },
    { speaker: "cat",    text: "A Crystal Compiler? That sounds powerful! Where is this castle?" },
    { speaker: "wizard", text: "I can give you the map... but first you must solve MY RIDDLE!" },
    { speaker: "cat",    text: "A riddle? Alright, bring it on, old wizard!" },
    { speaker: "wizard", text: "Guess my age! It is an ODD number between 500 and 1000." },
    { speaker: "wizard", text: "My age is LESS than the cube of the largest single-digit number..." },
    { speaker: "wizard", text: "...and GREATER than the factorial of the product of the smallest prime and the 2nd odd number." },
    { speaker: "wizard", text: "And here's the final clue — my age is the LARGEST such odd number! Print it!" },
    { speaker: "cat",    text: "That's a tricky one! I'll need loops and conditions for this... Click on me!" }
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

// ============================================================
// DOM REFS
// ============================================================
var roomBg = document.getElementById('room-bg');
var riddleHud = document.getElementById('riddle-hud');
var riddleHint = document.getElementById('riddle-hint');
var riddleStatus = document.getElementById('riddle-status');
var catSprite = document.getElementById('the-cat-lvl17');
var dialogueBox = document.getElementById('dialogue-box');
var speakerLabel = document.getElementById('speaker-label');
var typewriterText = document.getElementById('typewriter-text-lvl17');
var wizardBubble = document.getElementById('wizard-bubble');
var wizardBubbleText = document.getElementById('wizard-bubble-text');
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
        completeLevelCh2(17);
        showLevelLoadingCh2('lvl18.html', 'Loading Level 18...');
    });

    // Click dialogue to advance (both cat box and wizard bubble)
    dialogueBox.addEventListener('click', advanceDialogue);
    wizardBubble.addEventListener('click', advanceDialogue);

    // Start particle animation loop
    animateParticles();
});



// ============================================================
// DIALOGUE (Dual speaker system — cat + wizard)
// ============================================================
function showDialogue(index) {
    if (index >= DIALOGUE_SCRIPT.length) {
        dialogueBox.style.display = 'none';
        hideWizardBubble();
        riddleHud.classList.add('visible');
        return;
    }

    dialogueIndex = index;
    isTyping = true;

    var line = DIALOGUE_SCRIPT[index];

    if (line.speaker === "wizard") {
        dialogueBox.style.display = 'none';
        showWizardBubble(line.text);
    } else {
        hideWizardBubble();
        dialogueBox.style.display = 'block';
        speakerLabel.textContent = 'The Cat';
        typewriterText.innerHTML = '';
        typewriteCatDialogue(line.text);
    }
}

function typewriteCatDialogue(message) {
    var ci = 0;
    typewriterText.innerHTML = '';
    (function type() {
        if (ci < message.length) {
            typewriterText.innerHTML += message.charAt(ci);
            ci++;
            typingTimeout = setTimeout(type, 30);
        } else {
            isTyping = false;
            addDialoguePrompt();
        }
    })();
}

function showWizardBubble(message) {
    wizardBubbleText.innerHTML = '';
    wizardBubble.classList.remove('visible', 'pop');
    void wizardBubble.offsetWidth;
    wizardBubble.classList.add('visible', 'pop');

    var ci = 0;
    (function type() {
        if (ci < message.length) {
            wizardBubbleText.innerHTML += message.charAt(ci);
            ci++;
            typingTimeout = setTimeout(type, 30);
        } else {
            isTyping = false;
            var prompt = document.createElement('div');
            prompt.style.cssText = 'margin-top:8px;color:#7c3aed;text-align:center;font-size:5px;animation:prompt-blink 1s steps(1) infinite;';
            prompt.textContent = '▼ CLICK TO CONTINUE ▼';
            wizardBubbleText.appendChild(prompt);
        }
    })();
}

function hideWizardBubble() {
    wizardBubble.classList.remove('visible', 'pop');
}

function addDialoguePrompt() {
    var prompt = document.createElement('div');
    prompt.className = 'click-prompt';
    prompt.textContent = '▼ CLICK TO CONTINUE ▼';
    typewriterText.appendChild(prompt);
}

function advanceDialogue() {
    if (isTyping) {
        clearTimeout(typingTimeout);
        isTyping = false;
        var line = DIALOGUE_SCRIPT[dialogueIndex];
        if (line.speaker === "wizard") {
            wizardBubbleText.textContent = line.text;
            var prompt = document.createElement('div');
            prompt.style.cssText = 'margin-top:8px;color:#7c3aed;text-align:center;font-size:5px;animation:prompt-blink 1s steps(1) infinite;';
            prompt.textContent = '▼ CLICK TO CONTINUE ▼';
            wizardBubbleText.appendChild(prompt);
        } else {
            typewriterText.textContent = line.text;
            addDialoguePrompt();
        }
        return;
    }

    dialogueIndex++;
    if (dialogueIndex < DIALOGUE_SCRIPT.length) {
        showDialogue(dialogueIndex);
    } else {
        dialogueBox.style.display = 'none';
        hideWizardBubble();
        riddleHud.classList.add('visible');
    }
}

// ============================================================
// GRIMOIRE
// ============================================================
function openGrimoire() {
    if (puzzleSolved) return;

    spellTaskText.textContent = 'Find the LARGEST odd number between 500 and 1000 that is less than cube of greatest single digit number and greater than factorial of product of first two smallest prime numbers. Print it.';
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
    outputText.textContent = 'Computing the wizard\'s possible ages...';
    outputText.className = '';

    evaluatePython(code).then(function (result) {
        if (result.indexOf('Error:') === 0) {
            if (result.indexOf('input') !== -1) {
                outputText.textContent = "❌ input() doesn't work here!\n\n💡 Compute the values directly:\nimport math\nupper = 9 ** 3\nlower = math.factorial(6)";
            } else {
                outputText.textContent = result;
            }
            outputText.className = 'error';
            shakeGrimoire();
            return;
        }

        var trimmed = result.trim();

        // Check against the single correct answer
        var allCorrect = (trimmed === String(WIZARD_AGE));

        if (allCorrect) {
            outputText.textContent = 'Output:\n' + trimmed + '\n\n✨ CORRECT! The wizard nods approvingly!';
            outputText.className = 'success';
            puzzleSolved = true;

            setTimeout(function () {
                closeGrimoire();
                triggerVictory();
            }, 1200);
        } else {
            var hint = 'Expected answer: ' + WIZARD_AGE + '\n\n';
            hint += 'Clues:\n';
            hint += '• 9³ = 729 (upper limit)\n';
            hint += '• 2 × 3 = 6, 6! = 720 (lower limit)\n';
            hint += '• LARGEST odd number between 720 and 729';
            outputText.textContent = 'Output:\n' + trimmed + '\n\n❌ Not quite!\n' + hint;
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
    riddleHint.textContent = '727';
    riddleHint.style.color = '#4ade80';
    riddleHint.style.textShadow = '0 0 12px rgba(74, 222, 128, 0.5)';
    riddleStatus.textContent = '✓ SOLVED!';
    riddleStatus.classList.add('solved');

    emitParticles(60);

    // Show wizard victory bubble
    showWizardBubble("Magnificent! You solved my riddle! Here is the map to the Castle of Heartwood Sapphire. The first Fragment of the Crystal Compiler awaits you there! 🗺️✨");
    isTyping = false; // Skip waiting for typing

    setTimeout(function () {
        hideWizardBubble();
        showSuccessScreen();
    }, 4000);
}

function showSuccessScreen() {
    successStats.innerHTML =
        'WIZARD\'S AGE: 727<br>' +
        'UPPER BOUND: 9³ = 729<br>' +
        'LOWER BOUND: 6! = 720<br>' +
        'ATTEMPTS: ' + attemptsCount + '<br>' +
        'NEXT: CASTLE OF HEARTWOOD SAPPHIRE 🏰';
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
            color: ['168,85,247', '192,132,252', '233,213,255', '124,58,237', '139,92,246', '251,191,36'][Math.floor(Math.random() * 6)]
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
