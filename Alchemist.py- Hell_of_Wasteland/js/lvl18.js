/* ============================================================
   ALCHEMIST.PY — LEVEL 18: THE RIVER OF ARRAYS
   (String Slicing — Build the Path)
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

var RIVER_STRING = "River of Shivers";
var EXPECTED_RESULT = "rivers";

// Indexing breakdown:
// R=0 i=1 v=2 e=3 r=4  =5 o=6 f=7  =8 S=9 h=10 i=11 v=12 e=13 r=14 s=15
// "River" = [0:5], .lower() = "river"
// "s" = [-1] or [15]
// "river" + "s" = "rivers"

var DIALOGUE_LINES = [
    "I'm on my way to the Castle of Heartwood Sapphire!",
    "But wait... there's a massive river blocking the path!",
    "The sign reads: \"River of Arrays — Only those who can SLICE may cross!\"",
    "The water is deep and magical... I can't swim across!",
    "If I slice the right word from these waters, a path will appear!",
    "I need to slice \"River of Shivers\" to make the word \"rivers\"!",
    "Slicing, lowercase... I can do this! Click on me to begin!"
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
var roomBgVictory = document.getElementById('room-bg-victory');
var riverHud = document.getElementById('river-hud');
var riverWord = document.getElementById('river-word');
var riverStatus = document.getElementById('river-status');
var catSprite = document.getElementById('the-cat-lvl18');
var dialogueBox = document.getElementById('dialogue-box');
var typewriterText = document.getElementById('typewriter-text-lvl18');
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
    riverWord.textContent = '"' + RIVER_STRING + '"';

    // Add water shimmer
    roomBg.classList.add('water-shimmer');

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
        completeLevelCh2(18);
        showLevelLoadingCh2('lvl19.html', 'Loading Level 19...');
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
        riverHud.classList.add('visible');
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
        riverHud.classList.add('visible');
        dialogueBox.style.display = 'none';
    }
}

// ============================================================
// GRIMOIRE
// ============================================================
function openGrimoire() {
    if (puzzleSolved) return;

    spellTaskText.textContent = 'Slice the string "River of Shivers" so the output is "rivers" (all lowercase). Print the result.';
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
    outputText.textContent = 'Casting the slicing spell...';
    outputText.className = '';

    evaluatePython(code).then(function (result) {
        if (result.indexOf('Error:') === 0) {
            if (result.indexOf('input') !== -1) {
                outputText.textContent = "❌ input() doesn't work here!\n\n💡 Use the string directly:\ns = \"River of Shivers\"\nprint(s[:5].lower() + s[-1])";
            } else {
                outputText.textContent = result;
            }
            outputText.className = 'error';
            shakeGrimoire();
            return;
        }

        var trimmed = result.trim();

        if (trimmed === EXPECTED_RESULT) {
            outputText.textContent = 'Output:\n' + trimmed + '\n\n✨ CORRECT! The waters are parting!';
            outputText.className = 'success';
            puzzleSolved = true;

            setTimeout(function () {
                closeGrimoire();
                triggerVictory();
            }, 1200);
        } else {
            var hint = 'Expected: "' + EXPECTED_RESULT + '"\n\n';
            hint += 'String: "River of Shivers"\n';
            hint += 'Indexes: R=0, i=1, v=2, e=3, r=4\n';
            hint += '         s=15 (last character)\n\n';
            hint += '💡 Think about:\n';
            hint += '• s[:5] gives "River"\n';
            hint += '• .lower() converts to lowercase\n';
            hint += '• s[-1] gives the last char "s"';
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
    riverWord.textContent = '"rivers"';
    riverWord.style.color = '#4ade80';
    riverWord.style.textShadow = '0 0 12px rgba(74, 222, 128, 0.5)';
    riverStatus.textContent = '✓ CROSSED!';
    riverStatus.classList.add('crossed');

    // Cross-fade to parted-water image
    roomBgVictory.classList.add('visible');
    roomBg.style.opacity = '0';

    emitParticles(60);

    // Show victory dialogue
    dialogueBox.style.display = 'block';
    typewriterText.innerHTML = '';
    isTyping = true;
    var msg = "\"rivers\"! The waters are parting! A path is forming through the river! 🌊✨ Time to cross!";
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
        'STRING: "River of Shivers"<br>' +
        'SLICED: "rivers"<br>' +
        'ATTEMPTS: ' + attemptsCount + '<br>' +
        'STATUS: RIVER CROSSED! 🌊✨';
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
            color: ['6,182,212', '34,211,238', '103,232,249', '165,243,252', '8,145,178', '56,189,248'][Math.floor(Math.random() * 6)]
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
