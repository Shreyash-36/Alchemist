/* ALCHEMIST.PY — LEVEL 8: THE HUNGRY CAT */

// Generate three random milk amounts (between 10 and 99)
var milkA = Math.floor(Math.random() * 90) + 10;
var milkB = Math.floor(Math.random() * 90) + 10;
var milkC = Math.floor(Math.random() * 90) + 10;

// Make sure they are all different
while (milkB === milkA) milkB = Math.floor(Math.random() * 90) + 10;
while (milkC === milkA || milkC === milkB) milkC = Math.floor(Math.random() * 90) + 10;

var CORRECT_MAX = Math.max(milkA, milkB, milkC);

var DIALOGUE = [
    "Meow... my stomach is growling...",
    "I can smell milk! There are three containers here.",
    "But they're all opaque — I can't see inside!",
    "Luckily, the amount of milk is printed on each container.",
    "Container A has " + milkA + " ml, Container B has " + milkB + " ml, and Container C has " + milkC + " ml.",
    "I need to figure out which one has the MOST milk!",
    "Write Python code to find the maximum of three numbers: " + milkA + ", " + milkB + ", " + milkC,
    "Click on me to open the spell book..."
];

var dialogueIdx = 0, isTyping = false, pyReady = false, solved = false, typingTimer = null;
var particles = [];
var attemptsCount = 0;

// DOM
var roomBg = document.getElementById('room-bg');
var cat = document.getElementById('the-cat-lvl8');
var dBox = document.getElementById('dialogue-box');
var twText = document.getElementById('typewriter-text-lvl8');
var grimoire = document.getElementById('grimoire-overlay');
var taskText = document.getElementById('spell-task-text');
var codeIn = document.getElementById('code-input');
var lineNums = document.getElementById('line-numbers');
var outText = document.getElementById('output-text');
var milkHud = document.getElementById('milk-hud');
var valA = document.getElementById('val-a');
var valB = document.getElementById('val-b');
var valC = document.getElementById('val-c');
var vesselA = document.getElementById('vessel-a');
var vesselB = document.getElementById('vessel-b');
var vesselC = document.getElementById('vessel-c');
var label1 = document.getElementById('label-1');
var label2 = document.getElementById('label-2');
var label3 = document.getElementById('label-3');
var vesselsContainer = document.getElementById('vessels-container');
var vessel1 = document.getElementById('vessel-1');
var vessel2 = document.getElementById('vessel-2');
var vessel3 = document.getElementById('vessel-3');
var successScreen = document.getElementById('success-screen');
var successStats = document.getElementById('success-stats');
var pCanvas = document.getElementById('spell-particles');
var pCtx = pCanvas.getContext('2d');

// Init
document.addEventListener('DOMContentLoaded', function () {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    initPython().then(function () { pyReady = true; }).catch(function (e) {
        console.error("Pyodide failed:", e);
    });

    // Set vessel labels
    label1.textContent = milkA;
    label2.textContent = milkB;
    label3.textContent = milkC;

    setTimeout(function () {
        cat.style.display = 'block';
        cat.classList.add('hungry');
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
        showLevelLoading('lvl9.html', 'Loading Level 9...');
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
        milkHud.classList.add('visible');
        valA.textContent = milkA + ' ml';
        valB.textContent = milkB + ' ml';
        valC.textContent = milkC + ' ml';
        vesselsContainer.classList.add('visible');
        return;
    }
    dialogueIdx = idx; isTyping = true;
    twText.innerHTML = '';
    var text = DIALOGUE[idx], ci = 0;
    (function t() {
        if (ci < text.length) { twText.innerHTML += text.charAt(ci++); typingTimer = setTimeout(t, 35); }
        else { isTyping = false; addPrompt(); }
    })();
}

function addPrompt() {
    var p = document.createElement('div');
    p.className = 'click-prompt'; p.textContent = '▼ CLICK TO CONTINUE ▼';
    twText.appendChild(p);
}

function advanceDialogue() {
    if (isTyping) {
        clearTimeout(typingTimer); isTyping = false; twText.textContent = DIALOGUE[dialogueIdx]; addPrompt(); return;
    }
    dialogueIdx++;
    if (dialogueIdx < DIALOGUE.length) showDialogue(dialogueIdx);
    else {
        milkHud.classList.add('visible');
        valA.textContent = milkA + ' ml';
        valB.textContent = milkB + ' ml';
        valC.textContent = milkC + ' ml';
        vesselsContainer.classList.add('visible');
        dBox.style.display = 'none';
    }
}

// Grimoire
function openGrimoire() {
    if (solved) return;
    taskText.textContent = "Three containers have " + milkA + ", " + milkB + ", and " + milkC + " ml of milk. Write Python code to calculate and print the maximum of these three numbers. Hint: use max() or if-else.";
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

    attemptsCount++;
    outText.textContent = "🔮 Finding the maximum..."; outText.className = '';

    evaluatePython(code).then(function (result) {
        if (result.indexOf('Error:') === 0) {
            if (result.indexOf('input') !== -1) {
                outText.textContent = "❌ input() doesn't work in browser!\n\n💡 Use the values directly:\na = " + milkA + "\nb = " + milkB + "\nc = " + milkC + "\nprint(max(a, b, c))";
            } else {
                outText.textContent = "❌ Spell Error!\n" + result;
            }
            outText.className = 'error';
            shakeGrimoire();
            return;
        }

        var trimmed = result.trim();
        var lines = trimmed.split('\n');
        var lastLine = lines[lines.length - 1].trim();
        var userAnswer = parseInt(lastLine);

        if (isNaN(userAnswer)) {
            outText.textContent = "Output:\n" + trimmed + "\n\n⚠️ Your code must print a NUMBER.\n💡 Hint: print(max(" + milkA + ", " + milkB + ", " + milkC + "))";
            outText.className = 'error';
            shakeGrimoire();
            return;
        }

        if (userAnswer === CORRECT_MAX) {
            // SUCCESS!
            outText.textContent = "Output:\n" + trimmed + "\n\n✨ CORRECT! The maximum is " + CORRECT_MAX + " ml!";
            outText.className = 'success';
            solved = true;

            setTimeout(function () {
                closeGrimoire();
                revealWinner();
            }, 1800);
        } else {
            outText.textContent = "Output:\n" + trimmed + "\n\n❌ That's not the maximum!\nThe three values are: " + milkA + ", " + milkB + ", " + milkC + "\n\n💡 Hint: print(max(" + milkA + ", " + milkB + ", " + milkC + "))";
            outText.className = 'error';
            shakeGrimoire();
        }
    });
}

// Reveal winning vessel
function revealWinner() {
    emitParticles(40);
    cat.classList.remove('hungry');

    // Highlight winning vessel in HUD
    if (CORRECT_MAX === milkA) vesselA.classList.add('winner');
    if (CORRECT_MAX === milkB) vesselB.classList.add('winner');
    if (CORRECT_MAX === milkC) vesselC.classList.add('winner');

    // Highlight winning vessel on screen
    if (CORRECT_MAX === milkA) vessel1.classList.add('winner');
    if (CORRECT_MAX === milkB) vessel2.classList.add('winner');
    if (CORRECT_MAX === milkC) vessel3.classList.add('winner');

    // Show dialogue
    dBox.style.display = 'block';
    twText.innerHTML = ''; isTyping = true;
    var msg = "The container with " + CORRECT_MAX + " ml has the most milk! Time to drink up! 🥛";
    var ci = 0;
    (function t() {
        if (ci < msg.length) { twText.innerHTML += msg.charAt(ci++); setTimeout(t, 25); }
        else { isTyping = false; }
    })();

    setTimeout(function () { emitParticles(40); }, 1000);

    // Victory
    setTimeout(function () {
        dBox.style.display = 'none';
        triggerVictory();
    }, 3500);
}

function triggerVictory() {
    successStats.innerHTML =
        'CONTAINER A: ' + milkA + ' ml<br>' +
        'CONTAINER B: ' + milkB + ' ml<br>' +
        'CONTAINER C: ' + milkC + ' ml<br>' +
        'MAXIMUM: ' + CORRECT_MAX + ' ml ✓<br>' +
        'ATTEMPTS: ' + attemptsCount;
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
            color: ['230,126,34','243,156,18','211,84,0','241,196,15','46,204,113','255,215,0'][Math.floor(Math.random() * 6)]
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
