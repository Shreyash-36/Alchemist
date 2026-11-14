/* ALCHEMIST.PY — LEVEL 5: THE NUMBERED STAIRCASE */

var STAIR_NUMBERS = [23, 0, -48, 54, -7, 100];
var DIALOGUE = [
    "A grand staircase... each step marked with a number.",
    "Some numbers are positive, some negative, and one is zero.",
    "To climb, you must identify each number correctly.",
    "Use if/elif/else to check: POSITIVE, NEGATIVE, or ZERO.",
    "Click on me when you're ready to check the first step..."
];

var currentStep = 0, dialogueIdx = 0, isTyping = false, pyReady = false, typingTimer = null;
var particles = [];

// DOM
var cat = document.getElementById('the-cat-lvl5');
var dBox = document.getElementById('dialogue-box');
var twText = document.getElementById('typewriter-text-lvl5');
var grimoire = document.getElementById('grimoire-overlay');
var taskText = document.getElementById('spell-task-text');
var codeIn = document.getElementById('code-input');
var lineNums = document.getElementById('line-numbers');
var outText = document.getElementById('output-text');
var stepFill = document.getElementById('step-bar-fill');
var stepPct = document.getElementById('step-percent');
var stepHud = document.getElementById('step-hud');
var stairHud = document.getElementById('stair-hud');
var stairSlots = document.getElementById('stair-slots');
var successScreen = document.getElementById('success-screen');
var successStats = document.getElementById('success-stats');
var pCanvas = document.getElementById('spell-particles');
var pCtx = pCanvas.getContext('2d');

// Cat step positions (bottom %)
var CAT_POSITIONS = [130, 130, 130, 130, 130, 130, 130];

// Init
document.addEventListener('DOMContentLoaded', function () {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    initPython().then(function () { pyReady = true; }).catch(function (e) {
        console.error("Pyodide failed:", e);
    });

    buildStairHud();
    setTimeout(function () {
        cat.style.display = 'block';
        dBox.style.display = 'block';
        showDialogue(0);
    }, 800);

    cat.addEventListener('click', openGrimoire);
    document.getElementById('grimoire-close').addEventListener('click', closeGrimoire);
    document.getElementById('btn-cast-spell').addEventListener('click', castSpell);
    document.getElementById('btn-clear').addEventListener('click', function () {
        codeIn.value = ''; outText.textContent = ''; outText.className = ''; updateLines();
    });
    document.getElementById('btn-continue').addEventListener('click', function () {
        showLevelLoading('lvl6.html', 'Loading Level 6...');
    });

    codeIn.addEventListener('input', updateLines);
    codeIn.addEventListener('scroll', function () { lineNums.scrollTop = codeIn.scrollTop; });
    updateLines();
    dBox.addEventListener('click', advanceDialogue);
    animateParticles();
});

// Dialogue
function showDialogue(idx) {
    if (idx >= DIALOGUE.length) {
        stairHud.classList.add('visible');
        stepHud.classList.add('visible');
        return;
    }
    dialogueIdx = idx; isTyping = true;
    twText.innerHTML = '';
    var text = DIALOGUE[idx], ci = 0;
    (function t() {
        if (ci < text.length) { twText.innerHTML += text.charAt(ci++); typingTimer = setTimeout(t, 35); }
        else { isTyping = false; addClickPrompt(); }
    })();
}

function addClickPrompt() {
    var p = document.createElement('div');
    p.className = 'click-prompt'; p.textContent = '▼ CLICK TO CONTINUE ▼';
    twText.appendChild(p);
}

function advanceDialogue() {
    if (isTyping) {
        clearTimeout(typingTimer); isTyping = false; twText.textContent = DIALOGUE[dialogueIdx]; addClickPrompt(); return;
    }
    dialogueIdx++;
    if (dialogueIdx < DIALOGUE.length) showDialogue(dialogueIdx);
    else { stairHud.classList.add('visible'); stepHud.classList.add('visible'); dBox.style.display = 'none'; }
}

// Stair HUD
function buildStairHud() {
    stairSlots.innerHTML = '';
    for (var i = 0; i < STAIR_NUMBERS.length; i++) {
        var s = document.createElement('div');
        s.className = 'stair-slot ' + (i === 0 ? 'active' : 'pending');
        s.id = 'stair-slot-' + i;
        var icon = document.createElement('span'); icon.className = 'stair-slot-icon';
        icon.textContent = i === 0 ? '➡️' : '🪜';
        var txt = document.createElement('span'); txt.className = 'stair-slot-text';
        txt.textContent = 'Step #' + (i + 1) + ': ' + STAIR_NUMBERS[i] + ' — ???';
        s.appendChild(icon); s.appendChild(txt); stairSlots.appendChild(s);
    }
}

// Grimoire
function openGrimoire() {
    if (currentStep >= STAIR_NUMBERS.length) return;
    var num = STAIR_NUMBERS[currentStep];
    taskText.textContent = "Step #" + (currentStep + 1) + ": Set num = " + num + " then use if/elif/else to check if it is POSITIVE, NEGATIVE, or ZERO. Print the result.";
    codeIn.value = ''; outText.textContent = ''; outText.className = ''; updateLines();
    grimoire.classList.add('open');
    codeIn.focus();
}

function closeGrimoire() { grimoire.classList.remove('open'); }

// Cast spell
function castSpell() {
    if (!pyReady) { outText.textContent = "⏳ Python loading..."; outText.className = 'error'; return; }
    var code = codeIn.value.trim();
    if (!code) { outText.textContent = "✏️ Write your code first!"; outText.className = 'error'; return; }
    outText.textContent = "🔮 Running..."; outText.className = '';
    evaluatePython(code).then(processResult);
}

function processResult(result) {
    var num = STAIR_NUMBERS[currentStep];
    var expected = num > 0 ? 'POSITIVE' : num < 0 ? 'NEGATIVE' : 'ZERO';

    if (result.indexOf('Error:') === 0) {
        if (result.indexOf('input') !== -1) {
            outText.textContent = "❌ input() doesn't work in browser!\n\n💡 Set the number directly:\nnum = " + num + "\nif num > 0:\n    print('POSITIVE')\nelif num < 0:\n    print('NEGATIVE')\nelse:\n    print('ZERO')";
        } else {
            outText.textContent = "❌ Code Error!\n" + result;
        }
        outText.className = 'error'; shakeGrimoire(); return;
    }

    var out = result.trim().toUpperCase();
    var said = out.indexOf('POSITIVE') !== -1 ? 'POSITIVE' : out.indexOf('NEGATIVE') !== -1 ? 'NEGATIVE' : out.indexOf('ZERO') !== -1 ? 'ZERO' : null;

    if (!said) {
        outText.textContent = "Output: " + result + "\n\n⚠️ Must print POSITIVE, NEGATIVE, or ZERO!\n\n💡 Example:\nnum = " + num + "\nif num > 0:\n    print('POSITIVE')\nelif num < 0:\n    print('NEGATIVE')\nelse:\n    print('ZERO')";
        outText.className = 'error'; shakeGrimoire(); return;
    }

    if (said !== expected) {
        outText.textContent = "Output: " + result + "\n\n❌ WRONG! " + num + " is " + expected + ", not " + said + ".";
        outText.className = 'error'; shakeGrimoire(); return;
    }

    // CORRECT
    outText.textContent = "Output: " + result + "\n\n✨ CORRECT! " + num + " is " + expected + "!";
    outText.className = 'success';

    // Update HUD
    var slot = document.getElementById('stair-slot-' + currentStep);
    if (slot) {
        var cls = expected === 'POSITIVE' ? 'positive' : expected === 'NEGATIVE' ? 'negative' : 'zero';
        slot.className = 'stair-slot ' + cls;
        slot.querySelector('.stair-slot-icon').textContent = expected === 'POSITIVE' ? '📈' : expected === 'NEGATIVE' ? '📉' : '⭕';
        slot.querySelector('.stair-slot-text').textContent = 'Step #' + (currentStep + 1) + ': ' + num + ' — ' + expected + ' ✓';
    }

    emitParticles(15);
    currentStep++;

    // Move cat up
    cat.style.bottom = CAT_POSITIONS[currentStep] + 'px';
    cat.style.filter = 'brightness(' + (0.7 + currentStep * 0.05) + ')';

    // Update progress
    var pct = Math.floor((currentStep / STAIR_NUMBERS.length) * 100);
    stepFill.style.width = pct + '%';
    stepPct.textContent = pct + '%';

    // Mark next step active
    if (currentStep < STAIR_NUMBERS.length) {
        var next = document.getElementById('stair-slot-' + currentStep);
        if (next) { next.className = 'stair-slot active'; next.querySelector('.stair-slot-icon').textContent = '➡️'; }
    }

    setTimeout(function () {
        closeGrimoire();
        if (currentStep >= STAIR_NUMBERS.length) {
            setTimeout(triggerVictory, 1000);
        } else {
            showNextPrompt();
        }
    }, 1800);
}

function showNextPrompt() {
    var num = STAIR_NUMBERS[currentStep];
    dBox.style.display = 'block';
    twText.innerHTML = ''; isTyping = true;
    var msg = "Good! Now check step #" + (currentStep + 1) + ": the number is " + num + ". Click me to write code!";
    var ci = 0;
    (function t() {
        if (ci < msg.length) { twText.innerHTML += msg.charAt(ci++); setTimeout(t, 25); }
        else { isTyping = false; }
    })();
    setTimeout(function () { dBox.style.display = 'none'; }, 5000);
}

function triggerVictory() {
    var pos = [], neg = [], zeros = [];
    for (var i = 0; i < STAIR_NUMBERS.length; i++) {
        if (STAIR_NUMBERS[i] > 0) pos.push(STAIR_NUMBERS[i]);
        else if (STAIR_NUMBERS[i] < 0) neg.push(STAIR_NUMBERS[i]);
        else zeros.push(STAIR_NUMBERS[i]);
    }
    successStats.innerHTML = 'STEPS CLIMBED: ' + STAIR_NUMBERS.length + '<br>' +
        'POSITIVE: ' + pos.join(', ') + '<br>' +
        'NEGATIVE: ' + neg.join(', ') + '<br>' +
        'ZERO: ' + zeros.join(', ') + '<br>' +
        'STATUS: TOP REACHED ✓';
    successScreen.classList.add('show');
    emitParticles(120);
}

// Shake
function shakeGrimoire() {
    var c = document.getElementById('grimoire-container');
    c.style.animation = 'none'; c.offsetHeight; c.style.animation = 'shake 0.4s ease';
}
var ss = document.createElement('style');
ss.textContent = '@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}';
document.head.appendChild(ss);

// Line numbers
function updateLines() {
    var n = Math.max(codeIn.value.split('\n').length, 8), s = '';
    for (var i = 1; i <= n; i++) s += i + '\n';
    lineNums.textContent = s;
}

// Particles
function resizeCanvas() { pCanvas.width = window.innerWidth; pCanvas.height = window.innerHeight; }

function emitParticles(count) {
    for (var i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * pCanvas.width, y: pCanvas.height + 10,
            vx: (Math.random() - 0.5) * 3, vy: -(Math.random() * 4 + 2),
            size: Math.random() * 4 + 1, life: 1, decay: Math.random() * 0.015 + 0.005,
            color: ['204,34,34','255,68,68','255,100,100','139,0,0','255,215,0','74,222,128'][Math.floor(Math.random() * 6)]
        });
    }
}

function animateParticles() {
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    particles = particles.filter(function (p) { return p.life > 0; });
    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.02; p.life -= p.decay;
        pCtx.beginPath(); pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        pCtx.fillStyle = 'rgba(' + p.color + ',' + p.life + ')'; pCtx.fill();
        pCtx.beginPath(); pCtx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        pCtx.fillStyle = 'rgba(' + p.color + ',' + (p.life * 0.15) + ')'; pCtx.fill();
    }
    requestAnimationFrame(animateParticles);
}
