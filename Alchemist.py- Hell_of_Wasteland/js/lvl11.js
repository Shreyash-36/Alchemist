/* ============================================================
   ALCHEMIST.PY — LEVEL 11: THE WHISPERING WALLS
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

// Name sets — pick a random set each playthrough
var NAME_SETS = [
    ["Luna", "Forest", "Shadow"],
    ["River", "Storm", "Blaze"],
    ["Crystal", "Ember", "Night"],
    ["Maple", "Frost", "Sage"],
    ["Willow", "Thorn", "Raven"]
];

var setIdx = Math.floor(Math.random() * NAME_SETS.length);
var NAMES = NAME_SETS[setIdx];

// Build the expected reversed output
var EXPECTED = [];
for (var e = 0; e < NAMES.length; e++) {
    EXPECTED.push(NAMES[e].split('').reverse().join(''));
}

var DIALOGUE_LINES = [
    "I've made it past the mansion... but this forest feels alive!",
    "Every tree here is whispering... and they're all saying names!",
    "Wait — the names on the trees are written BACKWARDS!",
    "The trees say: " + NAMES[0] + ", " + NAMES[1] + ", and " + NAMES[2] + ".",
    "I need to reverse each name to speak the counter-spell.",
    "If I reverse them correctly, the forest path will open!",
    "Write Python code to reverse each name and print the results.",
    "Click on me when you're ready to cast the reversal spell..."
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
var nameHud = document.getElementById('name-hud');
var nameList = document.getElementById('name-list');
var catSprite = document.getElementById('the-cat-lvl11');
var dialogueBox = document.getElementById('dialogue-box');
var typewriterText = document.getElementById('typewriter-text-lvl11');
var grimoireOverlay = document.getElementById('grimoire-overlay');
var grimoireClose = document.getElementById('grimoire-close');
var spellTaskText = document.getElementById('spell-task-text');
var codeInput = document.getElementById('code-input');
var lineNumbers = document.getElementById('line-numbers');
var outputText = document.getElementById('output-text');
var btnCastSpell = document.getElementById('btn-cast-spell');
var btnClear = document.getElementById('btn-clear');
var videoOverlay = document.getElementById('video-overlay');
var victoryVideo = document.getElementById('victory-video');
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

    // Build name HUD tags
    for (var i = 0; i < NAMES.length; i++) {
        var tag = document.createElement('span');
        tag.className = 'name-tag';
        tag.id = 'name-tag-' + i;
        tag.textContent = NAMES[i];
        nameList.appendChild(tag);
    }

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

    // Continue button → save progress & go to next level via map
    btnContinue.addEventListener('click', function () {
        completeLevelCh2(11);
        showLevelLoadingCh2('lvl12.html', 'Loading Level 12...');
    });

    // Victory video ended → show success screen
    victoryVideo.addEventListener('ended', function () {
        videoOverlay.style.display = 'none';
        showSuccessScreen();
    });

    // Click dialogue to advance
    dialogueBox.addEventListener('click', advanceDialogue);

    // Start particle animation loop
    animateParticles();

    // Add forest glow to background
    roomBg.classList.add('forest-glow');
});



// ============================================================
// DIALOGUE
// ============================================================
function showDialogue(index) {
    if (index >= DIALOGUE_LINES.length) {
        nameHud.classList.add('visible');
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
        nameHud.classList.add('visible');
        dialogueBox.style.display = 'none';
    }
}

// ============================================================
// GRIMOIRE
// ============================================================
function openGrimoire() {
    if (puzzleSolved) return;

    spellTaskText.textContent = 'Reverse each name: ' + NAMES.join(', ') + '. Print each reversed name on a separate line.';
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
    outputText.textContent = 'Whispering the reversal spell...';
    outputText.className = '';

    evaluatePython(code).then(function (result) {
        if (result.indexOf('Error:') === 0) {
            if (result.indexOf('input') !== -1) {
                outputText.textContent = "❌ input() doesn't work here!\n\n💡 Use the names directly:\nnames = " + JSON.stringify(NAMES) + "\nfor name in names:\n    print(name[::-1])";
            } else {
                outputText.textContent = result;
            }
            outputText.className = 'error';
            shakeGrimoire();
            return;
        }

        var trimmed = result.trim();
        var lines = trimmed.split('\n');

        // Clean up lines
        var userResults = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.length > 0) {
                userResults.push(line);
            }
        }

        // Check if all expected reversals are present
        var allCorrect = userResults.length >= EXPECTED.length;
        if (allCorrect) {
            for (var j = 0; j < EXPECTED.length; j++) {
                if (userResults[j] !== EXPECTED[j]) {
                    allCorrect = false;
                    break;
                }
            }
        }

        if (allCorrect) {
            outputText.textContent = 'Output:\n' + trimmed + '\n\n✨ CORRECT! The forest whispers back!';
            outputText.className = 'success';
            puzzleSolved = true;

            setTimeout(function () {
                closeGrimoire();
                triggerVictory();
            }, 1200);
        } else {
            var hint = 'Expected:\n';
            for (var k = 0; k < NAMES.length; k++) {
                hint += NAMES[k] + ' → ' + EXPECTED[k] + '\n';
            }
            outputText.textContent = 'Output:\n' + trimmed + '\n\n❌ Not quite!\n' + hint + '\n💡 Try: name[::-1] to reverse a string';
            outputText.className = 'error';
            shakeGrimoire();
        }
    });
}

// ============================================================
// VICTORY SEQUENCE
// ============================================================
function triggerVictory() {
    // Mark name tags as solved
    for (var i = 0; i < NAMES.length; i++) {
        var tag = document.getElementById('name-tag-' + i);
        if (tag) {
            tag.textContent = EXPECTED[i] + ' ✓';
            tag.classList.add('solved');
        }
    }

    emitParticles(50);

    // Show victory dialogue
    dialogueBox.style.display = 'block';
    typewriterText.innerHTML = '';
    isTyping = true;
    var msg = "The trees whisper back! The names are reversed, and the ancient path reveals itself!";
    var ci = 0;
    (function t() {
        if (ci < msg.length) {
            typewriterText.innerHTML += msg.charAt(ci++);
            setTimeout(t, 25);
        } else {
            isTyping = false;
        }
    })();

    // After dialogue, play victory video
    setTimeout(function () {
        dialogueBox.style.display = 'none';
        playVictoryVideo();
    }, 3500);
}

function playVictoryVideo() {
    videoOverlay.style.display = 'flex';
    victoryVideo.currentTime = 0;
    victoryVideo.play();
}

function showSuccessScreen() {
    successStats.innerHTML =
        'NAMES: ' + NAMES.join(', ') + '<br>' +
        'REVERSED: ' + EXPECTED.join(', ') + '<br>' +
        'ATTEMPTS: ' + attemptsCount + '<br>' +
        'STATUS: PATH OPENED! 🌿';
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
            color: ['46,204,113', '74,222,128', '39,174,96', '88,214,141', '34,153,84', '255,215,0'][Math.floor(Math.random() * 6)]
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
