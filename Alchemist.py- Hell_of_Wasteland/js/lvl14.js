/* ============================================================
   ALCHEMIST.PY — LEVEL 14: THE DRAGON'S HOARD
   (Prime Number Detection — 3 Coins)
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

// Pools of primes and non-primes
var PRIMES = [7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43];
var NON_PRIMES = [9, 15, 21, 25, 27, 33, 35, 39, 49, 51];

// Shuffle helper
function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
}

// Pick 3 coins: guaranteed mix — at least 1 prime and 1 non-prime
var shuffledPrimes = shuffleArray(PRIMES);
var shuffledNonPrimes = shuffleArray(NON_PRIMES);

// Build 3 coins with random arrangement
var COINS = shuffleArray([
    { num: shuffledPrimes[0], isPrime: true },
    { num: shuffledNonPrimes[0], isPrime: false },
    // Third coin is random prime or non-prime
    Math.random() < 0.5
        ? { num: shuffledPrimes[1], isPrime: true }
        : { num: shuffledNonPrimes[1], isPrime: false }
]);

// Build expected output — one line per coin, in order
var EXPECTED_LINES = [];
for (var c = 0; c < COINS.length; c++) {
    EXPECTED_LINES.push(COINS[c].isPrime ? "Prime" : "Not Prime");
}
var EXPECTED_OUTPUT = EXPECTED_LINES.join('\n');

// Coin numbers as text
var COIN_DISPLAY = COINS[0].num + ", " + COINS[1].num + ", " + COINS[2].num;

var DIALOGUE_LINES = [
    "I made it inside the cave... and there's TREASURE everywhere!",
    "But wait... there's a DRAGON sleeping right on top of the gold!",
    "I need to be extremely quiet... one wrong move and it wakes up!",
    "I can see coins scattered around with numbers printed on them...",
    "The wizard said I need the SPECIAL coins — the ones with PRIME numbers!",
    "I found three coins: " + COIN_DISPLAY + "!",
    "I need to check EACH one — is it prime or not?",
    "For each coin, print \"Prime\" if it's prime, or \"Not Prime\" if it's not.",
    "Check them in order: first " + COINS[0].num + ", then " + COINS[1].num + ", then " + COINS[2].num + ".",
    "Quietly now... click on me to cast the detection spell..."
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
var coinHud = document.getElementById('coin-hud');
var coinEls = [
    document.getElementById('coin-1'),
    document.getElementById('coin-2'),
    document.getElementById('coin-3')
];
var coinStatus = document.getElementById('coin-status');
var catSprite = document.getElementById('the-cat-lvl14');
var dialogueBox = document.getElementById('dialogue-box');
var typewriterText = document.getElementById('typewriter-text-lvl14');
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

    // Set HUD coin numbers
    for (var i = 0; i < 3; i++) {
        coinEls[i].textContent = COINS[i].num;
    }

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
        completeLevelCh2(14);
        showLevelLoadingCh2('lvl15.html', 'Loading Level 15...');
    });

    // Click dialogue to advance
    dialogueBox.addEventListener('click', advanceDialogue);

    // Start particle animation loop
    animateParticles();

    // Add dragon breathing glow
    roomBg.classList.add('dragon-glow');
});



// ============================================================
// DIALOGUE
// ============================================================
function showDialogue(index) {
    if (index >= DIALOGUE_LINES.length) {
        coinHud.classList.add('visible');
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
        coinHud.classList.add('visible');
        dialogueBox.style.display = 'none';
    }
}

// ============================================================
// GRIMOIRE
// ============================================================
function openGrimoire() {
    if (puzzleSolved) return;

    spellTaskText.textContent = 'For each coin (' + COIN_DISPLAY + '), check if it is prime. Print "Prime" or "Not Prime" for each, one per line, in order.';
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
    outputText.textContent = 'Silently checking the coins...';
    outputText.className = '';

    evaluatePython(code).then(function (result) {
        if (result.indexOf('Error:') === 0) {
            if (result.indexOf('input') !== -1) {
                outputText.textContent = "❌ input() doesn't work here!\n\n💡 Use the numbers directly:\ncoins = [" + COINS[0].num + ", " + COINS[1].num + ", " + COINS[2].num + "]";
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
            var l = userLines[i].trim();
            if (l.length > 0) normalizedUser.push(l);
        }

        var allCorrect = normalizedUser.length === EXPECTED_LINES.length;
        if (allCorrect) {
            for (var k = 0; k < EXPECTED_LINES.length; k++) {
                if (normalizedUser[k] !== EXPECTED_LINES[k]) {
                    allCorrect = false;
                    break;
                }
            }
        }

        if (allCorrect) {
            outputText.textContent = 'Output:\n' + trimmed + '\n\n✨ CORRECT! All three coins identified!';
            outputText.className = 'success';
            puzzleSolved = true;

            setTimeout(function () {
                closeGrimoire();
                triggerVictory();
            }, 1200);
        } else {
            // Build hint showing expected vs got
            var hint = 'Expected (one per line):\n';
            for (var h = 0; h < COINS.length; h++) {
                hint += COINS[h].num + ' → ' + EXPECTED_LINES[h] + '\n';
            }
            outputText.textContent = 'Output:\n' + trimmed + '\n\n❌ Not quite!\n' + hint + '\n💡 Print "Prime" or "Not Prime" for each coin in order.';
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
    coinStatus.textContent = '✓ IDENTIFIED';
    coinStatus.classList.add('found');
    catSprite.style.filter = 'brightness(1)';

    emitParticles(60);

    // Count how many primes
    var primeCount = 0;
    var primeNums = [];
    for (var i = 0; i < COINS.length; i++) {
        if (COINS[i].isPrime) {
            primeCount++;
            primeNums.push(COINS[i].num);
        }
    }

    // Show victory dialogue
    dialogueBox.style.display = 'block';
    typewriterText.innerHTML = '';
    isTyping = true;
    var msg;
    if (primeCount > 0) {
        msg = "Got them! The prime coins are " + primeNums.join(" and ") + "! Snatching them silently! 🪙✨";
    } else {
        msg = "None of these are prime! I need to keep looking for the special coins! 🪙";
    }
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
    }, 3500);
}

function showSuccessScreen() {
    var lines = '';
    for (var i = 0; i < COINS.length; i++) {
        lines += 'COIN ' + COINS[i].num + ': ' + EXPECTED_LINES[i] + '<br>';
    }
    successStats.innerHTML =
        lines +
        'ATTEMPTS: ' + attemptsCount + '<br>' +
        'DRAGON: STILL SLEEPING! 🐉💤';
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
            color: ['220,38,38', '251,191,36', '248,113,113', '153,27,27', '255,215,0', '192,132,252'][Math.floor(Math.random() * 6)]
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
