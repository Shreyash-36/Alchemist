/* ============================================================
   ALCHEMIST.PY — LEVEL 16: CAVE COLLAPSE
   (Sort Letters by ASCII Value)
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

var WORD = "speed";

// Sort by ASCII: s=115, p=112, e=101, e=101, d=100 → "deeps"
var SORTED_WORD = WORD.split('').sort().join('');

// ASCII breakdown for dialogue
var ASCII_INFO = [];
for (var a = 0; a < WORD.length; a++) {
    ASCII_INFO.push("'" + WORD[a] + "'=" + WORD.charCodeAt(a));
}
var ASCII_DISPLAY = ASCII_INFO.join(', ');

var DIALOGUE_LINES = [
    "I got the coins but... RUMBLE!! The cave is COLLAPSING!",
    "Rocks are falling everywhere! I need to find the escape route!",
    "There's a magical door ahead, but it needs a password to open!",
    "The inscription says: sort the letters of \"" + WORD + "\" by their ASCII values!",
    "ASCII values: " + ASCII_DISPLAY,
    "I need to arrange them in ascending order and print the result!",
    "That would give me: \"" + SORTED_WORD + "\"!",
    "HURRY! The ceiling is about to come down! Click on me!"
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
var escapeHud = document.getElementById('escape-hud');
var escapeWord = document.getElementById('escape-word');
var escapeStatus = document.getElementById('escape-status');
var catSprite = document.getElementById('the-cat-lvl16');
var dialogueBox = document.getElementById('dialogue-box');
var typewriterText = document.getElementById('typewriter-text-lvl16');
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
    escapeWord.textContent = '"' + WORD + '"';

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
        completeLevelCh2(16);
        showLevelLoadingCh2('lvl17.html', 'Loading Level 17...');
    });

    // Click dialogue to advance
    dialogueBox.addEventListener('click', advanceDialogue);

    // Start particle animation loop
    animateParticles();

    // Add cave collapse effects
    roomBg.classList.add('cave-shake', 'cave-rumble');
});



// ============================================================
// DIALOGUE
// ============================================================
function showDialogue(index) {
    if (index >= DIALOGUE_LINES.length) {
        escapeHud.classList.add('visible');
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
        escapeHud.classList.add('visible');
        dialogueBox.style.display = 'none';
    }
}

// ============================================================
// GRIMOIRE
// ============================================================
function openGrimoire() {
    if (puzzleSolved) return;

    spellTaskText.textContent = 'Sort the letters of "' + WORD + '" in ascending order by ASCII value and print the result as a single string.';
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
    outputText.textContent = 'Casting the sorting spell...';
    outputText.className = '';

    evaluatePython(code).then(function (result) {
        if (result.indexOf('Error:') === 0) {
            if (result.indexOf('input') !== -1) {
                outputText.textContent = "❌ input() doesn't work here!\n\n💡 Use the word directly:\nword = \"" + WORD + "\"\nprint(\"\".join(sorted(word)))";
            } else {
                outputText.textContent = result;
            }
            outputText.className = 'error';
            shakeGrimoire();
            return;
        }

        var trimmed = result.trim();

        if (trimmed === SORTED_WORD) {
            outputText.textContent = 'Output:\n' + trimmed + '\n\n✨ CORRECT! The escape door is opening!';
            outputText.className = 'success';
            puzzleSolved = true;

            setTimeout(function () {
                closeGrimoire();
                triggerVictory();
            }, 1200);
        } else {
            var hint = 'Expected: "' + SORTED_WORD + '"\n\n';
            hint += 'ASCII values:\n' + ASCII_DISPLAY + '\n';
            hint += 'Ascending order: ' + WORD.split('').sort().map(function(c) { return "'" + c + "'(" + c.charCodeAt(0) + ")"; }).join(' < ');
            outputText.textContent = 'Output:\n' + trimmed + '\n\n❌ Not quite!\n' + hint + '\n\n💡 Try: print("".join(sorted("' + WORD + '")))';
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
    escapeWord.textContent = '"' + SORTED_WORD + '"';
    escapeWord.style.color = '#4ade80';
    escapeWord.style.textShadow = '0 0 12px rgba(74, 222, 128, 0.5)';
    escapeStatus.textContent = '✓ ESCAPED!';
    escapeStatus.classList.add('escaped');
    catSprite.style.filter = 'brightness(1)';

    // Stop the shaking — cave stabilizes
    roomBg.classList.remove('cave-shake');

    emitParticles(60);

    // Show victory dialogue
    dialogueBox.style.display = 'block';
    typewriterText.innerHTML = '';
    isTyping = true;
    var msg = "\"" + SORTED_WORD + "\"! The door opened! I made it out just in time — the whole cave collapsed behind me! 🏃💨";
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
    }, 3800);
}

function showSuccessScreen() {
    successStats.innerHTML =
        'WORD: "' + WORD + '"<br>' +
        'SORTED: "' + SORTED_WORD + '"<br>' +
        'ATTEMPTS: ' + attemptsCount + '<br>' +
        'STATUS: CAVE ESCAPED! 🏃💨';
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
            color: ['249,115,22', '251,191,36', '234,88,12', '194,65,12', '255,215,0', '251,146,60'][Math.floor(Math.random() * 6)]
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
