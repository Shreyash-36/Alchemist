/* ============================================================
   ALCHEMIST.PY — LEVEL 23: THE BROKEN NAVIGATOR
   (filter + map + lambda)
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

// Task: filter odd numbers, square remaining even numbers
// Input:  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
// Even:   [2, 4, 6, 8, 10]
// Squared:[4, 16, 36, 64, 100]
var EXPECTED_OUTPUT = "[4, 16, 36, 64, 100]";

// Dialogue script: speaker is "cat", "unicorn", or "nerd"
// changeBgAfter: true → background switches AFTER that line is clicked past
var DIALOGUE_SCRIPT = [
    { speaker: "unicorn", text: "Thank you for saving me back there! I owe you everything!" },
    { speaker: "cat",     text: "Don't mention it, Lumina! But tell me, how did you end up in this terrible place?" },
    { speaker: "unicorn", text: "The Alchemist... he trapped me here! He's my enemy too!" },
    { speaker: "unicorn", text: "He stole the Fragment Crystal from my homeland. Without it, I can never leave this wasteland!" },
    { speaker: "cat",     text: "The Fragment Crystal?! That's what I'm searching for too!" },
    { speaker: "unicorn", text: "Then our paths are intertwined! Together we must find it and escape this cursed place!", changeBgAfter: true },
    { speaker: "cat",     text: "Wait... do you hear that? Someone is crying!" },
    { speaker: "cat",     text: "Over there! There's someone by those ruins!" },
    { speaker: "nerd",    text: "*sobbing* My navigator... it's completely broken! I'll never find my way home!" },
    { speaker: "cat",     text: "Hey there! Don't cry! What happened to your navigator?" },
    { speaker: "nerd",    text: "The lava surge fried its circuits! It needs a filter-map recalibration spell to work again!" },
    { speaker: "nerd",    text: "The navigator needs the list [1,2,3,4,5,6,7,8,9,10] processed — filter out odd numbers, then square the even ones!" },
    { speaker: "unicorn", text: "We can help! Right?" },
    { speaker: "cat",     text: "Of course! I'll use filter(), map(), and lambda to fix it!" },
    { speaker: "nerd",    text: "Oh thank you! Use filter() to keep only even numbers, then map() to square them! Print the result as a list!" },
    { speaker: "cat",     text: "Leave it to me! Click on me to open the repair spell!" }
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
var navHud = document.getElementById('nav-hud');
var navInfo = document.getElementById('nav-info');
var navStatus = document.getElementById('nav-status');
var catSprite = document.getElementById('the-cat-lvl23');
var unicornSprite = document.getElementById('the-unicorn-lvl23');
var catDialogue = document.getElementById('dialogue-box-cat');
var catTypewriter = document.getElementById('typewriter-text-cat');
var unicornDialogue = document.getElementById('dialogue-box-unicorn');
var unicornTypewriter = document.getElementById('typewriter-text-unicorn');
var nerdBubble = document.getElementById('nerd-bubble');
var nerdBubbleText = document.getElementById('nerd-bubble-text');
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

    // Show unicorn first (she speaks first) & start dialogue
    setTimeout(function () {
        unicornSprite.style.display = 'block';
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
        completeLevelCh3(23);
        showLevelLoadingCh3('lvl24.html', 'Loading Level 24...');
    });

    // Click dialogue & nerd bubble to advance
    catDialogue.addEventListener('click', advanceDialogue);
    unicornDialogue.addEventListener('click', advanceDialogue);
    nerdBubble.addEventListener('click', advanceDialogue);

    // Start particle animation loop
    animateParticles();
});


// ============================================================
// DIALOGUE (Triple-speaker: Cat, Unicorn, Nerd)
// ============================================================
function hideAllSpeakers() {
    catDialogue.style.display = 'none';
    unicornDialogue.style.display = 'none';
    hideNerdBubble();
    catSprite.style.display = 'none';
    unicornSprite.style.display = 'none';
}

function showDialogue(index) {
    if (index >= DIALOGUE_SCRIPT.length) {
        // All dialogue done — show only cat + HUD
        hideAllSpeakers();
        catSprite.style.display = 'block';
        navHud.classList.add('visible');
        return;
    }

    dialogueIndex = index;
    isTyping = true;

    var line = DIALOGUE_SCRIPT[index];

    if (line.speaker === "nerd") {
        // Show nerd bubble, hide cat & unicorn sprites + dialogues
        hideAllSpeakers();
        showNerdBubble(line.text);
    } else if (line.speaker === "unicorn") {
        // Show unicorn sprite + dialogue, hide cat sprite + dialogue + nerd
        hideAllSpeakers();
        unicornSprite.style.display = 'block';
        unicornDialogue.style.display = 'block';
        unicornTypewriter.innerHTML = '';
        typewriteText(unicornTypewriter, line.text, 'unicorn');
    } else {
        // Show cat sprite + dialogue, hide unicorn sprite + dialogue + nerd
        hideAllSpeakers();
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
    if (speaker === 'nerd') {
        prompt.style.cssText = 'margin-top:8px;color:#1d4ed8;text-align:center;font-size:5px;animation:prompt-blink 1s steps(1) infinite;';
    }
    element.appendChild(prompt);
}

// Nerd bubble helpers (wizard-style from lvl12)
function showNerdBubble(message) {
    nerdBubbleText.innerHTML = '';
    nerdBubble.classList.remove('visible', 'pop');
    void nerdBubble.offsetWidth;
    nerdBubble.classList.add('visible', 'pop');

    var ci = 0;
    (function type() {
        if (ci < message.length) {
            nerdBubbleText.innerHTML += message.charAt(ci);
            ci++;
            typingTimeout = setTimeout(type, 30);
        } else {
            isTyping = false;
            addPromptTo(nerdBubbleText, 'nerd');
        }
    })();
}

function hideNerdBubble() {
    nerdBubble.classList.remove('visible', 'pop');
}

function advanceDialogue() {
    if (isTyping) {
        clearTimeout(typingTimeout);
        isTyping = false;
        var line = DIALOGUE_SCRIPT[dialogueIndex];
        if (line.speaker === "nerd") {
            nerdBubbleText.textContent = line.text;
            addPromptTo(nerdBubbleText, 'nerd');
        } else if (line.speaker === "unicorn") {
            unicornTypewriter.textContent = line.text;
            addPromptTo(unicornTypewriter, 'unicorn');
        } else {
            catTypewriter.textContent = line.text;
            addPromptTo(catTypewriter, 'cat');
        }
        return;
    }

    // Check if bg should change AFTER this line
    var currentLine = DIALOGUE_SCRIPT[dialogueIndex];
    if (currentLine.changeBgAfter && !bgSwitched) {
        bgSwitched = true;
        roomBg.classList.add('scene2');
    }

    dialogueIndex++;
    if (dialogueIndex < DIALOGUE_SCRIPT.length) {
        showDialogue(dialogueIndex);
    } else {
        // Dialogue finished — show only cat for grimoire
        hideAllSpeakers();
        catSprite.style.display = 'block';
        navHud.classList.add('visible');
    }
}

// ============================================================
// GRIMOIRE
// ============================================================
function openGrimoire() {
    if (puzzleSolved) return;

    spellTaskText.textContent = 'Given nums = [1,2,3,4,5,6,7,8,9,10], use filter() with a lambda to keep only even numbers, then use map() with a lambda to square them. Print the result as a list.';
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
                outputText.textContent = "❌ input() doesn't work here!\n\n💡 Hardcode the list:\nnums = [1,2,3,4,5,6,7,8,9,10]";
            } else {
                outputText.textContent = result;
            }
            outputText.className = 'error';
            shakeGrimoire();
            return;
        }

        // Normalize: strip whitespace around commas
        var trimmed = result.trim().replace(/\s*,\s*/g, ', ');

        if (trimmed === EXPECTED_OUTPUT) {
            outputText.textContent = 'Output:\n' + result.trim() + '\n\n🧭 CORRECT! The navigator hums back to life!';
            outputText.className = 'success';
            puzzleSolved = true;

            setTimeout(function () {
                closeGrimoire();
                triggerVictory();
            }, 1200);
        } else {
            var hint = 'Expected: [4, 16, 36, 64, 100]\n\n';
            hint += 'Step 1: filter(lambda x: x%2==0, nums)\n';
            hint += '  → keeps even: [2,4,6,8,10]\n';
            hint += 'Step 2: map(lambda x: x**2, evens)\n';
            hint += '  → squares: [4,16,36,64,100]\n\n';
            hint += '💡 print(list(map(..., filter(...))))';
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
    navInfo.textContent = 'OUTPUT: [4, 16, 36, 64, 100]';
    navInfo.style.color = '#4ade80';
    navInfo.style.textShadow = '0 0 12px rgba(74, 222, 128, 0.5)';
    navStatus.textContent = '✓ FIXED!';
    navStatus.classList.add('fixed');

    emitParticles(70);

    // Nerd thanks them
    showNerdBubble("It works! IT WORKS! Thank you so much! I can go home now! You're amazing! ✨🧭");
    isTyping = false;

    setTimeout(function () {
        hideNerdBubble();
        catDialogue.style.display = 'block';
        catSprite.style.display = 'block';
        catTypewriter.innerHTML = '';
        var msg = "Safe travels, friend! filter(), map(), and lambda saved the day! 🧭✨";
        var ci = 0;
        (function t() {
            if (ci < msg.length) {
                catTypewriter.innerHTML += msg.charAt(ci++);
                setTimeout(t, 25);
            }
        })();
    }, 3000);

    setTimeout(function () {
        catDialogue.style.display = 'none';
        hideNerdBubble();
        showSuccessScreen();
    }, 6000);
}

function showSuccessScreen() {
    successStats.innerHTML =
        'INPUT: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]<br>' +
        'EVEN FILTER: [2, 4, 6, 8, 10]<br>' +
        'SQUARED: [4, 16, 36, 64, 100]<br>' +
        'NAVIGATOR: REPAIRED 🧭<br>' +
        'ATTEMPTS: ' + attemptsCount + '<br>' +
        'NERD: SAFELY HEADING HOME ✨';
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
            color: ['59,130,246', '239,68,68', '251,146,60', '147,197,253', '192,132,252', '74,222,128'][Math.floor(Math.random() * 6)]
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

        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        particleCtx.fillStyle = 'rgba(' + p.color + ',' + (p.life * 0.15) + ')';
        particleCtx.fill();
    }

    requestAnimationFrame(animateParticles);
}
