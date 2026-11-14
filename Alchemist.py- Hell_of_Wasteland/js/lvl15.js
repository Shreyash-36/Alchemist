/* ============================================================
   ALCHEMIST.PY — LEVEL 15: THE DRAGON BATTLE
   (Star Pattern Spell)
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

// Random number of rows for the star pattern (4–6)
var STAR_ROWS = Math.floor(Math.random() * 3) + 4;

// Build expected output — right-angled triangle
var EXPECTED_LINES = [];
for (var r = 1; r <= STAR_ROWS; r++) {
    var line = '';
    for (var s = 0; s < r; s++) {
        line += '*';
    }
    EXPECTED_LINES.push(line);
}
var EXPECTED_OUTPUT = EXPECTED_LINES.join('\n');

// Preview of the pattern for dialogue
var PATTERN_PREVIEW = EXPECTED_LINES.join('  →  ');

var DIALOGUE_LINES = [
    "Oh no... I stepped on a coin! The sound echoed through the cave!",
    "The dragon's eyes just OPENED! It sees me!",
    "ROAAAAR!! It's breathing FIRE straight at me!!",
    "I need to cast a spell NOW or I'm toast — literally!",
    "The star pattern spell! It's the most powerful combat spell I know!",
    "I need to print a star triangle with " + STAR_ROWS + " rows!",
    "Row 1: *, Row 2: **, Row 3: *** ... up to " + STAR_ROWS + " stars!",
    "HURRY! Click on me to cast the spell before it attacks again!"
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
var battleHud = document.getElementById('battle-hud');
var battleRows = document.getElementById('battle-rows');
var battleStatus = document.getElementById('battle-status');
var catSprite = document.getElementById('the-cat-lvl15');
var dialogueBox = document.getElementById('dialogue-box');
var typewriterText = document.getElementById('typewriter-text-lvl15');
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
    battleRows.textContent = STAR_ROWS + ' ROWS';

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
        completeLevelCh2(15);
        showLevelLoadingCh2('lvl16.html', 'Loading Level 16...');
    });

    // Click dialogue to advance
    dialogueBox.addEventListener('click', advanceDialogue);

    // Start particle animation loop
    animateParticles();

    // Add fire breathing glow
    roomBg.classList.add('fire-glow');
});



// ============================================================
// DIALOGUE
// ============================================================
function showDialogue(index) {
    if (index >= DIALOGUE_LINES.length) {
        battleHud.classList.add('visible');
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
        battleHud.classList.add('visible');
        dialogueBox.style.display = 'none';
    }
}

// ============================================================
// GRIMOIRE
// ============================================================
function openGrimoire() {
    if (puzzleSolved) return;

    spellTaskText.textContent = 'Print a right-angled star triangle with ' + STAR_ROWS + ' rows. Row 1 has 1 star, row 2 has 2 stars, ..., row ' + STAR_ROWS + ' has ' + STAR_ROWS + ' stars. Use "*" (asterisk).';
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
    outputText.textContent = 'Channeling the star spell...';
    outputText.className = '';

    evaluatePython(code).then(function (result) {
        if (result.indexOf('Error:') === 0) {
            if (result.indexOf('input') !== -1) {
                outputText.textContent = "❌ input() doesn't work here!\n\n💡 Use the number directly:\nn = " + STAR_ROWS + "\nfor i in range(1, n+1):\n    print(\"*\" * i)";
            } else {
                outputText.textContent = result;
            }
            outputText.className = 'error';
            shakeGrimoire();
            return;
        }

        var trimmed = result.trim();

        // Normalize — compare line by line
        var userLines = trimmed.split('\n');
        var normalizedUser = [];
        for (var i = 0; i < userLines.length; i++) {
            var l = userLines[i].trimEnd(); // keep leading spaces? no — right-angled left-align
            if (l.length > 0) normalizedUser.push(l);
        }

        var allCorrect = normalizedUser.length === EXPECTED_LINES.length;
        if (allCorrect) {
            for (var k = 0; k < EXPECTED_LINES.length; k++) {
                if (normalizedUser[k].replace(/\s/g, '') !== EXPECTED_LINES[k]) {
                    allCorrect = false;
                    break;
                }
            }
        }

        if (allCorrect) {
            outputText.textContent = 'Output:\n' + trimmed + '\n\n✨ DIRECT HIT! The dragon is going down!';
            outputText.className = 'success';
            puzzleSolved = true;

            setTimeout(function () {
                closeGrimoire();
                triggerVictory();
            }, 1200);
        } else {
            var hint = 'Expected pattern (' + STAR_ROWS + ' rows):\n';
            for (var h = 0; h < EXPECTED_LINES.length; h++) {
                hint += EXPECTED_LINES[h] + '\n';
            }
            outputText.textContent = 'Output:\n' + trimmed + '\n\n❌ The spell fizzled!\n' + hint + '\n💡 Use: print("*" * i) inside a loop';
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
    battleStatus.textContent = '✓ DEFEATED';
    battleStatus.classList.add('defeated');
    catSprite.style.filter = 'brightness(1)';

    emitParticles(80);

    // Fade background to defeated dragon image
    roomBg.style.opacity = '0';
    roomBgVictory.classList.add('visible');

    // Show victory dialogue
    dialogueBox.style.display = 'block';
    typewriterText.innerHTML = '';
    isTyping = true;
    var msg = "The star spell HITS! The dragon crashes back down onto the treasure! Time to grab the coins and GET OUT! ⭐🐉";
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
        'SPELL: ' + STAR_ROWS + '-ROW STAR PATTERN<br>' +
        'ATTEMPTS: ' + attemptsCount + '<br>' +
        'DRAGON: DEFEATED! ⭐🐉';
    successScreen.classList.add('show');
    emitParticles(100);
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
            color: ['239,68,68', '251,191,36', '249,115,22', '234,179,8', '255,215,0', '248,113,113'][Math.floor(Math.random() * 6)]
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
