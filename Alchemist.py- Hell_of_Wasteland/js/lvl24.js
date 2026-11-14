/* ============================================================
   ALCHEMIST.PY — LEVEL 24: THE HELLFIRE SHOP
   (Dictionary Filtering — Below Average Price)
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

// Shop items dictionary
// {"Sword": 150, "Shield": 80, "Potion": 40, "Armor": 200, "Ring": 30, "Boots": 100}
// Average = (150+80+40+200+30+100)/6 = 600/6 = 100
// Below average (<100): Shield:80, Potion:40, Ring:30

var EXPECTED_OUTPUT = "{'Shield': 80, 'Potion': 40, 'Ring': 30}";

// Four speakers: "cat", "unicorn", "nerd", "magus"
// changeBgAfter: true → switch background AFTER that line
var DIALOGUE_SCRIPT = [
    { speaker: "nerd",    text: "Wait! Before you go, take this treasure as a reward for fixing my navigator!" },
    { speaker: "cat",     text: "Treasure?! That's so kind of you!" },
    { speaker: "unicorn", text: "Thank you! We really need supplies for the journey ahead." },
    { speaker: "nerd",    text: "Be careful out there... Lucifer's domain lies beyond this wasteland." },
    { speaker: "cat",     text: "Lucifer?! The Hell King?!" },
    { speaker: "nerd",    text: "Yes! You'll need strong potions and equipment to stand a chance. There's a shop nearby — the Hellfire Shop!", changeBgAfter: true },
    { speaker: "cat",     text: "There it is! Let's go check it out, Lumina!" },
    { speaker: "magus",   text: "Welcome, travelers! I am the Magus of the Hellfire Shop! Looking to buy?" },
    { speaker: "unicorn", text: "We need potions and gear to fight Lucifer!" },
    { speaker: "magus",   text: "Ah, brave ones! Here are my wares and prices — but choose wisely, your treasure is limited!" },
    { speaker: "magus",   text: "Sword: 150, Shield: 80, Potion: 40, Armor: 200, Ring: 30, Boots: 100 gold." },
    { speaker: "cat",     text: "We can't afford everything... we need to figure out which items are below the average price!" },
    { speaker: "magus",   text: "Smart thinking! Filter the dictionary to find items priced below the average of all prices. Print the result!" },
    { speaker: "cat",     text: "Alright! I'll cast a price filter spell! Click on me!" }
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
var shopHud = document.getElementById('shop-hud');
var shopInfo = document.getElementById('shop-info');
var shopStatus = document.getElementById('shop-status');
var catSprite = document.getElementById('the-cat-lvl24');
var unicornSprite = document.getElementById('the-unicorn-lvl24');
var catDialogue = document.getElementById('dialogue-box-cat');
var catTypewriter = document.getElementById('typewriter-text-cat');
var unicornDialogue = document.getElementById('dialogue-box-unicorn');
var unicornTypewriter = document.getElementById('typewriter-text-unicorn');
var nerdBubble = document.getElementById('nerd-bubble');
var nerdBubbleText = document.getElementById('nerd-bubble-text');
var magusBubble = document.getElementById('magus-bubble');
var magusBubbleText = document.getElementById('magus-bubble-text');
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

    // First speaker is nerd (bubble), no sprite needed initially
    setTimeout(function () {
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
        completeLevelCh3(24);
        showLevelLoadingCh3('lvl25.html', 'Loading Level 25...');
    });

    catDialogue.addEventListener('click', advanceDialogue);
    unicornDialogue.addEventListener('click', advanceDialogue);
    nerdBubble.addEventListener('click', advanceDialogue);
    magusBubble.addEventListener('click', advanceDialogue);

    animateParticles();
});


// ============================================================
// DIALOGUE (Four speakers: Cat, Unicorn, Nerd, Magus)
// ============================================================
function hideAllSpeakers() {
    catDialogue.style.display = 'none';
    unicornDialogue.style.display = 'none';
    hideBubble(nerdBubble);
    hideBubble(magusBubble);
    catSprite.style.display = 'none';
    unicornSprite.style.display = 'none';
}

function showDialogue(index) {
    if (index >= DIALOGUE_SCRIPT.length) {
        hideAllSpeakers();
        catSprite.style.display = 'block';
        shopHud.classList.add('visible');
        return;
    }

    dialogueIndex = index;
    isTyping = true;
    var line = DIALOGUE_SCRIPT[index];

    if (line.speaker === "nerd") {
        hideAllSpeakers();
        showBubble(nerdBubble, nerdBubbleText, line.text, 'nerd');
    } else if (line.speaker === "magus") {
        hideAllSpeakers();
        showBubble(magusBubble, magusBubbleText, line.text, 'magus');
    } else if (line.speaker === "unicorn") {
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
    if (speaker === 'nerd') {
        prompt.style.cssText = 'margin-top:8px;color:#1d4ed8;text-align:center;font-size:5px;animation:prompt-blink 1s steps(1) infinite;';
    } else if (speaker === 'magus') {
        prompt.style.cssText = 'margin-top:8px;color:#f59e0b;text-align:center;font-size:5px;animation:prompt-blink 1s steps(1) infinite;';
    }
    element.appendChild(prompt);
}

function showBubble(bubble, textEl, message, speaker) {
    textEl.innerHTML = '';
    bubble.classList.remove('visible', 'pop');
    void bubble.offsetWidth;
    bubble.classList.add('visible', 'pop');

    var ci = 0;
    (function type() {
        if (ci < message.length) {
            textEl.innerHTML += message.charAt(ci);
            ci++;
            typingTimeout = setTimeout(type, 30);
        } else {
            isTyping = false;
            addPromptTo(textEl, speaker);
        }
    })();
}

function hideBubble(bubble) {
    bubble.classList.remove('visible', 'pop');
}

function advanceDialogue() {
    if (isTyping) {
        clearTimeout(typingTimeout);
        isTyping = false;
        var line = DIALOGUE_SCRIPT[dialogueIndex];
        if (line.speaker === "nerd") {
            nerdBubbleText.textContent = line.text;
            addPromptTo(nerdBubbleText, 'nerd');
        } else if (line.speaker === "magus") {
            magusBubbleText.textContent = line.text;
            addPromptTo(magusBubbleText, 'magus');
        } else if (line.speaker === "unicorn") {
            unicornTypewriter.textContent = line.text;
            addPromptTo(unicornTypewriter, 'unicorn');
        } else {
            catTypewriter.textContent = line.text;
            addPromptTo(catTypewriter, 'cat');
        }
        return;
    }

    var currentLine = DIALOGUE_SCRIPT[dialogueIndex];
    if (currentLine.changeBgAfter && !bgSwitched) {
        bgSwitched = true;
        roomBg.classList.add('scene2');
    }

    dialogueIndex++;
    if (dialogueIndex < DIALOGUE_SCRIPT.length) {
        showDialogue(dialogueIndex);
    } else {
        hideAllSpeakers();
        catSprite.style.display = 'block';
        shopHud.classList.add('visible');
    }
}

// ============================================================
// GRIMOIRE
// ============================================================
function openGrimoire() {
    if (puzzleSolved) return;

    spellTaskText.textContent = 'Given items = {"Sword": 150, "Shield": 80, "Potion": 40, "Armor": 200, "Ring": 30, "Boots": 100}, filter out all items whose prices are below the average price. Print the resulting dictionary.';
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
                outputText.textContent = "\u274c input() doesn't work here!\n\n\ud83d\udca1 Hardcode the dictionary:\nitems = {\"Sword\": 150, ...}";
            } else {
                outputText.textContent = result;
            }
            outputText.className = 'error';
            shakeGrimoire();
            return;
        }

        // Normalize the output for comparison
        var trimmed = result.trim().replace(/\s*:\s*/g, ': ').replace(/\s*,\s*/g, ', ');

        // Validate: must contain the 3 items below average (Shield:80, Potion:40, Ring:30)
        // and NOT contain above-average items
        var hasShield = trimmed.indexOf("'Shield': 80") !== -1;
        var hasPotion = trimmed.indexOf("'Potion': 40") !== -1;
        var hasRing   = trimmed.indexOf("'Ring': 30") !== -1;
        var hasSword  = trimmed.indexOf("'Sword'") !== -1;
        var hasArmor  = trimmed.indexOf("'Armor'") !== -1;
        var hasBoots  = trimmed.indexOf("'Boots'") !== -1;

        if (hasShield && hasPotion && hasRing && !hasSword && !hasArmor && !hasBoots) {
            outputText.textContent = 'Output:\n' + result.trim() + '\n\n\ud83d\udcb0 CORRECT! These are the affordable items!';
            outputText.className = 'success';
            puzzleSolved = true;

            setTimeout(function () {
                closeGrimoire();
                triggerVictory();
            }, 1200);
        } else {
            var hint = "Expected: {'Shield': 80, 'Potion': 40, 'Ring': 30}\n\n";
            hint += 'Average = (150+80+40+200+30+100)/6 = 100\n';
            hint += 'Items below 100: Shield(80), Potion(40), Ring(30)\n\n';
            hint += '\ud83d\udca1 avg = sum(items.values()) / len(items)\n';
            hint += 'Use dict comprehension: {k:v for k,v in items.items() if v < avg}';
            outputText.textContent = 'Output:\n' + result.trim() + '\n\n\u274c Not quite!\n' + hint;
            outputText.className = 'error';
            shakeGrimoire();
        }
    });
}

// ============================================================
// VICTORY
// ============================================================
function triggerVictory() {
    shopInfo.textContent = 'AFFORDABLE: Shield, Potion, Ring';
    shopInfo.style.color = '#4ade80';
    shopInfo.style.textShadow = '0 0 12px rgba(74,222,128,0.5)';
    shopStatus.textContent = '\u2713 PURCHASED!';
    shopStatus.classList.add('done');

    emitParticles(70);

    // Magus farewell
    showBubble(magusBubble, magusBubbleText, "Excellent choices! The Shield, Potion, and Ring will serve you well against Lucifer! Good luck! \ud83d\udcb0", 'magus');
    isTyping = false;

    setTimeout(function () {
        hideBubble(magusBubble);
        catDialogue.style.display = 'block';
        catSprite.style.display = 'block';
        catTypewriter.innerHTML = '';
        var msg = "We got what we need! Time to prepare for the battle against Lucifer! \u2694\ufe0f\ud83d\udd25";
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
        hideBubble(magusBubble);
        showSuccessScreen();
    }, 6000);
}

function showSuccessScreen() {
    successStats.innerHTML =
        'SHOP: Hellfire Shop<br>' +
        'AVERAGE PRICE: 100 gold<br>' +
        'AFFORDABLE: Shield(80), Potion(40), Ring(30)<br>' +
        'TREASURE: WELL SPENT \ud83d\udcb0<br>' +
        'ATTEMPTS: ' + attemptsCount + '<br>' +
        'NEXT: PREPARE FOR LUCIFER \u2694\ufe0f';
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
            color: ['245,158,11', '251,146,60', '253,230,138', '239,68,68', '74,222,128', '192,132,252'][Math.floor(Math.random() * 6)]
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
