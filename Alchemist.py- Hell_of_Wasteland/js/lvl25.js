/* ============================================================
   ALCHEMIST.PY — LEVEL 25: THE FULL INVENTORY
   (Dynamic Dictionary Update)
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

// inventory = {"Shield": 1, "Potion": 3, "Ring": 1}
// new_items = [("Potion", 2), ("Sword", 1), ("Boots", 2), ("Shield", 1)]
// Result: {"Shield": 2, "Potion": 5, "Ring": 1, "Sword": 1, "Boots": 2}

var EXPECTED_PAIRS = {
    "Shield": 2,
    "Potion": 5,
    "Ring": 1,
    "Sword": 1,
    "Boots": 2
};

// Dialogue script: "cat" or "unicorn"
var DIALOGUE_SCRIPT = [
    { speaker: "cat",     text: "Phew! We got everything from the shop. But wait... my inventory is completely full!" },
    { speaker: "unicorn", text: "That's a problem! You can't carry all of this and fight Lucifer at the same time." },
    { speaker: "cat",     text: "I need to reorganise everything... merge the new items with my existing inventory." },
    { speaker: "unicorn", text: "Hey... I can help! Why don't you give me the 1st Fragment Crystal? I can carry it in MY inventory!" },
    { speaker: "cat",     text: "The Fragment Crystal?! I... I don't know, Lumina. That crystal is incredibly precious..." },
    { speaker: "unicorn", text: "I understand your hesitation. But think about it — we're a team now!" },
    { speaker: "unicorn", text: "I was trapped here by the same Alchemist. We share the same enemy, the same goal!" },
    { speaker: "cat",     text: "You're right... we've been through so much together already." },
    { speaker: "unicorn", text: "I promise on my horn — I will protect it with my life! Trust me!" },
    { speaker: "cat",     text: "...Okay. I trust you, Lumina. Here — take the 1st Fragment Crystal. Guard it well!" },
    { speaker: "unicorn", text: "Thank you for trusting me! I won't let you down! Now let's fix that inventory!" },
    { speaker: "cat",     text: "Right! I need to merge my current items with the new ones I just bought." },
    { speaker: "unicorn", text: "Your current inventory is: Shield:1, Potion:3, Ring:1" },
    { speaker: "unicorn", text: "And the new items are: Potion:2, Sword:1, Boots:2, Shield:1" },
    { speaker: "cat",     text: "I need to update quantities for existing items and add new ones! Click on me to cast the spell!" }
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
var invHud = document.getElementById('inv-hud');
var invInfo = document.getElementById('inv-info');
var invStatus = document.getElementById('inv-status');
var catSprite = document.getElementById('the-cat-lvl25');
var unicornSprite = document.getElementById('the-unicorn-lvl25');
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

    initPython().then(function () {
        pyodideReady = true;
    }).catch(function (e) {
        console.error("Pyodide failed to load:", e);
    });

    // Cat speaks first
    setTimeout(function () {
        catSprite.style.display = 'block';
        showDialogue(0);
    }, 800);

    catSprite.addEventListener('click', openGrimoire);

    grimoireClose.addEventListener('click', closeGrimoire);
    btnCastSpell.addEventListener('click', castSpell);
    btnClear.addEventListener('click', function () {
        codeInput.value = '';
        outputText.textContent = '';
        outputText.className = '';
        updateLineNumbers();
    });

    codeInput.addEventListener('input', updateLineNumbers);
    codeInput.addEventListener('scroll', syncScroll);
    updateLineNumbers();

    btnContinue.addEventListener('click', function () {
        completeLevelCh3(25);
        showLevelLoadingCh3('lvl26.html', 'Loading Level 26...');
    });

    catDialogue.addEventListener('click', advanceDialogue);
    unicornDialogue.addEventListener('click', advanceDialogue);

    animateParticles();
});


// ============================================================
// DIALOGUE (Dual-speaker: Cat & Unicorn)
// ============================================================
function hideAllSpeakers() {
    catDialogue.style.display = 'none';
    unicornDialogue.style.display = 'none';
    catSprite.style.display = 'none';
    unicornSprite.style.display = 'none';
}

function showDialogue(index) {
    if (index >= DIALOGUE_SCRIPT.length) {
        hideAllSpeakers();
        catSprite.style.display = 'block';
        invHud.classList.add('visible');
        return;
    }

    dialogueIndex = index;
    isTyping = true;
    var line = DIALOGUE_SCRIPT[index];

    if (line.speaker === "unicorn") {
        hideAllSpeakers();
        unicornSprite.style.display = 'block';
        unicornDialogue.style.display = 'block';
        unicornTypewriter.innerHTML = '';
        typewriteText(unicornTypewriter, line.text, 'unicorn');
    } else {
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
    prompt.textContent = '\u25bc CLICK TO CONTINUE \u25bc';
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

    dialogueIndex++;
    if (dialogueIndex < DIALOGUE_SCRIPT.length) {
        showDialogue(dialogueIndex);
    } else {
        hideAllSpeakers();
        catSprite.style.display = 'block';
        invHud.classList.add('visible');
    }
}

// ============================================================
// GRIMOIRE
// ============================================================
function openGrimoire() {
    if (puzzleSolved) return;

    spellTaskText.textContent = 'Given inventory = {"Shield": 1, "Potion": 3, "Ring": 1} and new_items = [("Potion", 2), ("Sword", 1), ("Boots", 2), ("Shield", 1)], update the inventory by adding quantities for existing items and adding new items. Print the updated dictionary.';
    codeInput.value = '';
    outputText.textContent = '';
    outputText.className = '';
    updateLineNumbers();
    grimoireOverlay.classList.add('open');
    setTimeout(function () { codeInput.focus(); }, 250);
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
                outputText.textContent = "\u274c input() doesn't work here!\n\n\ud83d\udca1 Hardcode the data:\ninventory = {\"Shield\": 1, ...}";
            } else {
                outputText.textContent = result;
            }
            outputText.className = 'error';
            shakeGrimoire();
            return;
        }

        // Validate: check all expected key-value pairs exist
        var trimmed = result.trim();
        var allCorrect = true;
        var keys = Object.keys(EXPECTED_PAIRS);

        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            var v = EXPECTED_PAIRS[k];
            // Check for 'Key': Value pattern in output
            var pattern1 = "'" + k + "': " + v;
            var pattern2 = '"' + k + '": ' + v;
            if (trimmed.indexOf(pattern1) === -1 && trimmed.indexOf(pattern2) === -1) {
                allCorrect = false;
                break;
            }
        }

        // Also check no extra unexpected items
        var unexpectedItems = ["Helmet", "Cape", "Wand"];
        for (var j = 0; j < unexpectedItems.length; j++) {
            if (trimmed.indexOf(unexpectedItems[j]) !== -1) {
                allCorrect = false;
                break;
            }
        }

        if (allCorrect) {
            outputText.textContent = 'Output:\n' + trimmed + '\n\n\ud83d\udce6 CORRECT! Inventory successfully merged!';
            outputText.className = 'success';
            puzzleSolved = true;

            setTimeout(function () {
                closeGrimoire();
                triggerVictory();
            }, 1200);
        } else {
            var hint = "Expected: {'Shield': 2, 'Potion': 5, 'Ring': 1, 'Sword': 1, 'Boots': 2}\n\n";
            hint += 'Original: Shield:1, Potion:3, Ring:1\n';
            hint += 'New:      Potion+2, Sword+1, Boots+2, Shield+1\n\n';
            hint += '\ud83d\udca1 Loop through new_items:\n';
            hint += 'for item, qty in new_items:\n';
            hint += '    if item in inventory:\n';
            hint += '        inventory[item] += qty\n';
            hint += '    else:\n';
            hint += '        inventory[item] = qty';
            outputText.textContent = 'Output:\n' + trimmed + '\n\n\u274c Not quite!\n' + hint;
            outputText.className = 'error';
            shakeGrimoire();
        }
    });
}

// ============================================================
// VICTORY
// ============================================================
function triggerVictory() {
    invInfo.textContent = 'MERGED: 5 ITEMS';
    invInfo.style.color = '#4ade80';
    invInfo.style.textShadow = '0 0 12px rgba(74,222,128,0.5)';
    invStatus.textContent = '\u2713 UPDATED!';
    invStatus.classList.add('done');

    emitParticles(70);

    // Unicorn thanks
    hideAllSpeakers();
    unicornSprite.style.display = 'block';
    unicornDialogue.style.display = 'block';
    unicornTypewriter.innerHTML = '';
    isTyping = true;
    var msg1 = "The inventory is all set! And don't worry — the 1st Fragment is safe with me! \ud83e\udd84\u2728";
    var ci1 = 0;
    (function t1() {
        if (ci1 < msg1.length) {
            unicornTypewriter.innerHTML += msg1.charAt(ci1++);
            setTimeout(t1, 25);
        } else { isTyping = false; }
    })();

    setTimeout(function () {
        hideAllSpeakers();
        catSprite.style.display = 'block';
        catDialogue.style.display = 'block';
        catTypewriter.innerHTML = '';
        var msg2 = "Good! Now we're fully equipped! Let's continue our quest and face whatever comes next! \u2694\ufe0f\ud83d\udd25";
        var ci2 = 0;
        (function t2() {
            if (ci2 < msg2.length) {
                catTypewriter.innerHTML += msg2.charAt(ci2++);
                setTimeout(t2, 25);
            }
        })();
    }, 3000);

    setTimeout(function () {
        hideAllSpeakers();
        showSuccessScreen();
    }, 6000);
}

function showSuccessScreen() {
    successStats.innerHTML =
        'ORIGINAL: Shield:1, Potion:3, Ring:1<br>' +
        'NEW ITEMS: Potion+2, Sword+1, Boots+2, Shield+1<br>' +
        'MERGED: Shield:2, Potion:5, Ring:1, Sword:1, Boots:2<br>' +
        '1ST FRAGMENT: Given to Lumina \ud83e\udd84<br>' +
        'TRUST: ESTABLISHED \u2728<br>' +
        'ATTEMPTS: ' + attemptsCount;
    successScreen.classList.add('show');
    emitParticles(80);
}

// ============================================================
// EDITOR
// ============================================================
function updateLineNumbers() {
    var lines = codeInput.value.split('\n').length;
    var count = Math.max(lines, 8);
    var numbers = '';
    for (var i = 1; i <= count; i++) numbers += i + '\n';
    lineNumbers.textContent = numbers;
}

function syncScroll() { lineNumbers.scrollTop = codeInput.scrollTop; }

// ============================================================
// VISUAL EFFECTS
// ============================================================
function resizeCanvas() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
}

function shakeGrimoire() {
    var c = document.getElementById('grimoire-container');
    c.classList.remove('shake');
    void c.offsetWidth;
    c.classList.add('shake');
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
            color: ['239,68,68', '251,146,60', '192,132,252', '147,51,234', '233,213,255', '74,222,128'][Math.floor(Math.random() * 6)]
        });
    }
}

function animateParticles() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    particles = particles.filter(function (p) { return p.life > 0; });
    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.02; p.life -= p.decay;
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
