/* ============================================================
   ALCHEMIST.PY — LEVEL 20: THE STATUE OF SIRIS
   (Palindrome Check — Find the Real Fragment)
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

// Three fragments on the statue — only the palindrome is real
var FRAGMENTS = ["MADAM", "CRYSTAL", "ARCANE"];
var PALINDROME_WORD = "MADAM";
var EXPECTED_OUTPUT = "MADAM";

var DIALOGUE_LINES = [
    "I made it inside the Castle of Heartwood Sapphire!",
    "There it is — the statue of SIRIS, the Iris of the Woods!",
    "Three crystal fragments are embedded in the statue... green, blue, and red!",
    "Each fragment has a word engraved on it...",
    "The green one says \"MADAM\", the blue says \"CRYSTAL\", the red says \"ARCANE\".",
    "Wait... I remember what the wizard said!",
    "\"Only ONE fragment is real — the one with a PALINDROME printed on it!\"",
    "A palindrome reads the same forwards and backwards...",
    "I need to check each word and find which one is the palindrome! Click on me!"
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
var fragmentHud = document.getElementById('fragment-hud');
var fragmentWords = document.getElementById('fragment-words');
var fragmentStatus = document.getElementById('fragment-status');
var catSprite = document.getElementById('the-cat-lvl20');
var dialogueBox = document.getElementById('dialogue-box');
var typewriterText = document.getElementById('typewriter-text-lvl20');
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

    // Set HUD
    fragmentWords.textContent = '💚 ' + FRAGMENTS[0] + '  💙 ' + FRAGMENTS[1] + '  ❤️ ' + FRAGMENTS[2];

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
        completeLevelCh2(20);
        showLevelLoadingCh2('map2.html', 'Returning to the Map...');
    });

    // Click dialogue to advance
    dialogueBox.addEventListener('click', advanceDialogue);

    // Start particle animation loop
    animateParticles();
});




// ============================================================
// DIALOGUE
// ============================================================
function showDialogue(index) {
    if (index >= DIALOGUE_LINES.length) {
        fragmentHud.classList.add('visible');
        return;
    }

    dialogueIndex = index;
    isTyping = true;
    typewriterText.innerHTML = '';

    var message = DIALOGUE_LINES[index];
    var characterIndex = 0;

    (function type() {
        if (characterIndex < message.length) {
            typewriterText.innerHTML += message.charAt(characterIndex);
            characterIndex++;
            typingTimeout = setTimeout(type, 35);
        } else {
            isTyping = false;
            addDialoguePrompt();
        }
    })();
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
        typewriterText.textContent = DIALOGUE_LINES[dialogueIndex];
        addDialoguePrompt();
        return;
    }

    dialogueIndex++;
    if (dialogueIndex < DIALOGUE_LINES.length) {
        showDialogue(dialogueIndex);
    } else {
        fragmentHud.classList.add('visible');
        dialogueBox.style.display = 'none';
    }
}

// ============================================================
// GRIMOIRE
// ============================================================
function openGrimoire() {
    if (puzzleSolved) return;

    spellTaskText.textContent = 'Given the words ' + JSON.stringify(FRAGMENTS) + ', check each word to find the palindrome (reads same forwards and backwards). Print only the palindrome word.';
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
    outputText.textContent = 'Examining the fragments...';
    outputText.className = '';

    evaluatePython(code).then(function (result) {
        if (result.indexOf('Error:') === 0) {
            if (result.indexOf('input') !== -1) {
                outputText.textContent = "❌ input() doesn't work here!\n\n💡 Use the words directly:\nwords = " + JSON.stringify(FRAGMENTS) + "\nfor word in words:\n    if word == word[::-1]:\n        print(word)";
            } else {
                outputText.textContent = result;
            }
            outputText.className = 'error';
            shakeGrimoire();
            return;
        }

        var trimmed = result.trim().toUpperCase();

        if (trimmed === EXPECTED_OUTPUT) {
            outputText.textContent = 'Output:\n' + result.trim() + '\n\n✨ CORRECT! The green fragment is the REAL one!';
            outputText.className = 'success';
            puzzleSolved = true;

            setTimeout(function () {
                closeGrimoire();
                triggerVictory();
            }, 1200);
        } else {
            var hint = 'Expected: "' + EXPECTED_OUTPUT + '"\n\n';
            hint += 'A palindrome reads the same forwards\n';
            hint += 'and backwards:\n';
            hint += '• MADAM → reversed = MADAM ✓\n';
            hint += '• CRYSTAL → reversed = LATSYRC ✗\n';
            hint += '• ARCANE → reversed = ENACRA ✗\n\n';
            hint += '💡 Reverse a string: word[::-1]';
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
    fragmentWords.textContent = '💚 MADAM ← PALINDROME!';
    fragmentWords.style.color = '#4ade80';
    fragmentWords.style.textShadow = '0 0 12px rgba(74, 222, 128, 0.5)';
    fragmentStatus.textContent = '✓ FOUND!';
    fragmentStatus.classList.add('found');

    emitParticles(70);

    // Show victory dialogue
    dialogueBox.style.display = 'block';
    typewriterText.innerHTML = '';
    isTyping = true;
    var msg = "\"MADAM\" — it's a palindrome! The green fragment is glowing! I've found the FIRST fragment of the Crystal Compiler! 💎✨";
    var ci = 0;
    (function t() {
        if (ci < msg.length) {
            typewriterText.innerHTML += msg.charAt(ci++);
            setTimeout(t, 25);
        } else {
            isTyping = false;
        }
    })();

    setTimeout(function () {
        dialogueBox.style.display = 'none';
        showSuccessScreen();
    }, 4000);
}

function showSuccessScreen() {
    successStats.innerHTML =
        'FRAGMENTS: ' + FRAGMENTS.join(', ') + '<br>' +
        'PALINDROME: ' + PALINDROME_WORD + '<br>' +
        'CRYSTAL COMPILER: 1/5 FRAGMENTS<br>' +
        'ATTEMPTS: ' + attemptsCount + '<br>' +
        'STATUS: FRAGMENT COLLECTED! 💎';
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
            color: ['34,211,238', '103,232,249', '165,243,252', '8,145,178', '6,182,212', '74,222,128'][Math.floor(Math.random() * 6)]
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
