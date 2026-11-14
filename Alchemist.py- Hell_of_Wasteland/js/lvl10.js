/* ALCHEMIST.PY — LEVEL 10: THE TIME DOORS */

// Date sets: each set has 2 invalid + 1 valid date
var DATE_SETS = [
    { dates: ['31/02/2024', '15/06/2024', '31/04/2024'], valid: 1 },
    { dates: ['29/02/2023', '25/12/2024', '31/09/2024'], valid: 1 },
    { dates: ['30/02/2024', '31/11/2024', '14/08/2024'], valid: 2 },
    { dates: ['32/01/2024', '29/02/2024', '31/06/2024'], valid: 1 },
    { dates: ['15/13/2024', '10/10/2024', '29/02/2025'], valid: 1 },
    { dates: ['00/05/2024', '31/04/2024', '28/02/2023'], valid: 2 }
];

// Pick a random date set
var setIdx = Math.floor(Math.random() * DATE_SETS.length);
var currentSet = DATE_SETS[setIdx];
var dates = currentSet.dates;
var validIdx = currentSet.valid; // 0-indexed
var validDate = dates[validIdx];

var DIALOGUE = [
    "This is it... the final room of the mansion!",
    "Three doors stand before me, each glowing with time magic.",
    "Each door teleports to a different timeline...",
    "But only ONE has a VALID date — the others lead to nowhere!",
    "Door A: " + dates[0] + "  |  Door B: " + dates[1] + "  |  Door C: " + dates[2],
    "I need to check which date is actually real!",
    "Write Python code to validate dates (DD/MM/YYYY format).",
    "Print 'Valid' for real dates & 'Invalid' for impossible ones.",
    "Click on me to open the validation spell..."
];

var dialogueIdx = 0, isTyping = false, pyReady = false, solved = false, typingTimer = null;
var particles = [];
var attemptsCount = 0;

// DOM
var roomBg = document.getElementById('room-bg');
var treeBg = document.getElementById('tree-bg');
var cat = document.getElementById('the-cat-lvl10');
var dBox = document.getElementById('dialogue-box');
var twText = document.getElementById('typewriter-text-lvl10');
var grimoire = document.getElementById('grimoire-overlay');
var taskText = document.getElementById('spell-task-text');
var codeIn = document.getElementById('code-input');
var lineNums = document.getElementById('line-numbers');
var outText = document.getElementById('output-text');
var dateHud = document.getElementById('date-hud');
var dateA = document.getElementById('date-a');
var dateB = document.getElementById('date-b');
var dateC = document.getElementById('date-c');
var doorA = document.getElementById('door-a');
var doorB = document.getElementById('door-b');
var doorC = document.getElementById('door-c');
var doorDate1 = document.getElementById('door-date-1');
var doorDate2 = document.getElementById('door-date-2');
var doorDate3 = document.getElementById('door-date-3');
var doorsContainer = document.getElementById('doors-container');
var door1 = document.getElementById('door-1');
var door2 = document.getElementById('door-2');
var door3 = document.getElementById('door-3');
var portalWrapper = document.getElementById('portal-wrapper');
var successScreen = document.getElementById('success-screen');
var successStats = document.getElementById('success-stats');
var pCanvas = document.getElementById('spell-particles');
var pCtx = pCanvas.getContext('2d');

// Init
document.addEventListener('DOMContentLoaded', function () {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Add white flash div
    var flash = document.createElement('div');
    flash.id = 'white-flash';
    document.body.appendChild(flash);

    initPython().then(function () { pyReady = true; }).catch(function (e) {
        console.error("Pyodide failed:", e);
    });

    // Set door date labels
    doorDate1.textContent = dates[0];
    doorDate2.textContent = dates[1];
    doorDate3.textContent = dates[2];

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
        completeLevel(10);
        showLevelLoading('map.html', 'Returning to the Map...');
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
        dateHud.classList.add('visible');
        dateA.textContent = dates[0];
        dateB.textContent = dates[1];
        dateC.textContent = dates[2];
        doorsContainer.classList.add('visible');
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
        dateHud.classList.add('visible');
        dateA.textContent = dates[0];
        dateB.textContent = dates[1];
        dateC.textContent = dates[2];
        doorsContainer.classList.add('visible');
        dBox.style.display = 'none';
    }
}

// Grimoire
function openGrimoire() {
    if (solved) return;
    taskText.textContent = "Three doors show dates: " + dates[0] + ", " + dates[1] + ", " + dates[2] + " (DD/MM/YYYY). Write Python code to check each date and print 'Valid' or 'Invalid' for each. Hint: check days per month!";
    codeIn.value = ''; outText.textContent = ''; outText.className = ''; updateLines();
    grimoire.classList.add('open');
    codeIn.focus();
}

function closeGrimoire() { grimoire.classList.remove('open'); }

// Build expected output
function getExpectedOutput() {
    var results = [];
    for (var i = 0; i < dates.length; i++) {
        if (i === validIdx) results.push('Valid');
        else results.push('Invalid');
    }
    return results;
}

// Cast spell
function castSpell() {
    if (!pyReady) { outText.textContent = "⏳ Python loading..."; outText.className = 'error'; return; }
    var code = codeIn.value.trim();
    if (!code) { outText.textContent = "✏️ Write your code first!"; outText.className = 'error'; return; }

    attemptsCount++;
    outText.textContent = "🔮 Validating dates..."; outText.className = '';

    evaluatePython(code).then(function (result) {
        if (result.indexOf('Error:') === 0) {
            if (result.indexOf('input') !== -1) {
                outText.textContent = "❌ input() doesn't work in browser!\n\n💡 Use the dates directly:\ndates = ['" + dates.join("', '") + "']\nfor d in dates:\n    ...check validity...";
            } else {
                outText.textContent = "❌ Spell Error!\n" + result;
            }
            outText.className = 'error';
            shakeGrimoire();
            return;
        }

        var trimmed = result.trim();
        var lines = trimmed.split('\n');
        var expected = getExpectedOutput();

        // Check if output contains Valid/Invalid for each date
        var foundValid = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim().toLowerCase();
            if (line.indexOf('valid') !== -1 && line.indexOf('invalid') === -1) {
                foundValid.push('Valid');
            } else if (line.indexOf('invalid') !== -1) {
                foundValid.push('Invalid');
            }
        }

        // Check correctness
        var allCorrect = foundValid.length >= 3;
        if (allCorrect) {
            for (var j = 0; j < 3; j++) {
                if (foundValid[j] !== expected[j]) {
                    allCorrect = false;
                    break;
                }
            }
        }

        if (allCorrect) {
            outText.textContent = "Output:\n" + trimmed + "\n\n✨ CORRECT! The valid date is " + validDate + "!";
            outText.className = 'success';
            solved = true;

            setTimeout(function () {
                closeGrimoire();
                revealDoors();
            }, 1800);
        } else {
            var hint = "Expected output:\n";
            for (var k = 0; k < dates.length; k++) {
                hint += dates[k] + " → " + expected[k] + "\n";
            }
            outText.textContent = "Output:\n" + trimmed + "\n\n❌ Not quite right!\n" + hint + "\n💡 Check days in each month.\nFeb=28/29, Apr/Jun/Sep/Nov=30, rest=31";
            outText.className = 'error';
            shakeGrimoire();
        }
    });
}

// Reveal valid/invalid doors
function revealDoors() {
    emitParticles(40);
    var doorEls = [door1, door2, door3];
    var hudEls = [doorA, doorB, doorC];

    for (var i = 0; i < 3; i++) {
        if (i === validIdx) {
            doorEls[i].classList.add('valid');
            hudEls[i].classList.add('valid');
        } else {
            doorEls[i].classList.add('invalid');
            hudEls[i].classList.add('invalid');
        }
    }

    // Show message
    dBox.style.display = 'block';
    twText.innerHTML = ''; isTyping = true;
    var msg = "The valid door glows green! " + validDate + " is the real date! Time to escape!";
    var ci = 0;
    (function t() {
        if (ci < msg.length) { twText.innerHTML += msg.charAt(ci++); setTimeout(t, 25); }
        else { isTyping = false; }
    })();

    // Transition to tree scene
    setTimeout(function () {
        dBox.style.display = 'none';
        transitionToTree();
    }, 3500);
}

// Transition: doors → tree with portal
function transitionToTree() {
    // Fade out doors scene
    roomBg.style.opacity = '0';
    doorsContainer.style.opacity = '0';
    dateHud.style.opacity = '0';

    // Fade in tree scene
    setTimeout(function () {
        treeBg.classList.add('visible');
        emitParticles(60);

        // Show portal under tree
        setTimeout(function () {
            portalWrapper.classList.add('visible');
            // Play portal video
            var portalVideo = document.getElementById('portal-video');
            if (portalVideo) portalVideo.play();
            emitParticles(40);

            // Cat walks to portal
            dBox.style.display = 'block';
            twText.innerHTML = ''; isTyping = true;
            var msg = "A portal! This is my way out... here I go!";
            var ci = 0;
            (function t() {
                if (ci < msg.length) { twText.innerHTML += msg.charAt(ci++); setTimeout(t, 25); }
                else { isTyping = false; }
            })();

            setTimeout(function () {
                dBox.style.display = 'none';
                cat.classList.add('walk-to-portal');

                // Cat enters portal
                setTimeout(function () {
                    cat.classList.add('enter-portal');
                    portalWrapper.classList.add('expanding');
                    emitParticles(100);

                    // White flash
                    setTimeout(function () {
                        document.getElementById('white-flash').classList.add('flash');

                        // Victory
                        setTimeout(function () {
                            document.getElementById('white-flash').classList.remove('flash');
                            triggerVictory();
                        }, 1500);
                    }, 2000);
                }, 2500);
            }, 2500);
        }, 1500);
    }, 2000);
}

function triggerVictory() {
    successStats.innerHTML =
        'DATES CHECKED: ' + dates.join(', ') + '<br>' +
        'VALID DATE: ' + validDate + ' ✓<br>' +
        'PORTAL: ACTIVATED<br>' +
        'ATTEMPTS: ' + attemptsCount + '<br>' +
        'STATUS: ESCAPED! 🐱';
    successScreen.classList.add('show');
    emitParticles(150);
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
            color: ['52,152,219','93,173,226','155,89,182','46,204,113','41,128,185','255,215,0'][Math.floor(Math.random() * 6)]
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
