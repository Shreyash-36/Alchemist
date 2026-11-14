/* ============================================================
   HELP BOX — Shared Logic & Content
   Provides a 📖 help button on every level with:
     • A short hint for the puzzle
     • A brief Python concept explanation
     • A collapsible quick reference
   ============================================================ */

var HELP_DATA = {

    // ── LEVEL 1: The Door Riddle ──
    1: {
        hint: "The riddle describes a common animal. Think about what says 'Meow' and has whiskers!",
        concept: "print() Function",
        theory: "Use print() to display text on screen.\n\nTo print a word:",
        code: 'print("cat")',
        tip: "Put your answer inside quotes!"
    },

    // ── LEVEL 2: The Broken Floor ──
    2: {
        hint: "You need to add three numbers together and print the result. The total must be exactly 100.",
        concept: "Addition & Variables",
        theory: "Use the + operator to add numbers.\nUse print() to show the result.",
        code: 'a = 30\nb = 40\nc = 30\nprint(a + b + c)',
        tip: "You can also do: print(30 + 40 + 30)"
    },

    // ── LEVEL 3: The Lever Gate ──
    3: {
        hint: "Use the modulo operator (%) to check if a number is even or odd. Even numbers give 0 when divided by 2.",
        concept: "if/else & Modulo (%)",
        theory: "The % operator gives the remainder.\nIf num % 2 == 0, the number is EVEN.\nOtherwise, it's ODD.",
        code: 'num = 4\nif num % 2 == 0:\n    print("EVEN")\nelse:\n    print("ODD")',
        tip: "Don't forget the colon : after if and else!"
    },

    // ── LEVEL 4: The Dark Hall ──
    4: {
        hint: "To square a number means to multiply it by itself. Use ** for power.",
        concept: "Exponentiation (**)",
        theory: "Use ** to raise a number to a power.\n3 ** 2 means 3 × 3 = 9.",
        code: 'print(3 ** 2)    # Output: 9\nprint(5 ** 2)    # Output: 25',
        tip: "You can also use: print(3 * 3)"
    },

    // ── LEVEL 5: The Numbered Staircase ──
    5: {
        hint: "Check if the number is greater than 0 (POSITIVE), less than 0 (NEGATIVE), or equal to 0 (ZERO).",
        concept: "if / elif / else",
        theory: "Use elif to check multiple conditions.\nPython checks them top to bottom.",
        code: 'num = 5\nif num > 0:\n    print("POSITIVE")\nelif num < 0:\n    print("NEGATIVE")\nelse:\n    print("ZERO")',
        tip: "elif is short for 'else if'."
    },

    // ── LEVEL 6: The Magic Circle ──
    6: {
        hint: "Use the formula: area = 3.14159 × radius × radius. Store the radius in a variable first.",
        concept: "Math & Variables",
        theory: "Store values in variables, then\nuse math operators to calculate.",
        code: 'r = 5\narea = 3.14159 * r * r\nprint(area)',
        tip: "Use * for multiplication, not ×"
    },

    // ── LEVEL 7: The Reversed Room ──
    7: {
        hint: "Use a for loop with range() to count backwards from 10 to 1.",
        concept: "for Loop & range()",
        theory: "range(start, stop, step) generates\na sequence of numbers.\nrange(10, 0, -1) goes 10, 9, 8 ... 1",
        code: 'for i in range(10, 0, -1):\n    print(i)',
        tip: "The stop value (0) is NOT included."
    },

    // ── LEVEL 8: The Hungry Cat ──
    8: {
        hint: "Use the built-in max() function to find the largest of three numbers.",
        concept: "max() Function",
        theory: "max() returns the largest value.\nYou can pass multiple numbers to it.",
        code: 'a = 30\nb = 50\nc = 20\nprint(max(a, b, c))  # Output: 50',
        tip: "You can also solve this with if/elif/else!"
    },

    // ── LEVEL 9: The Fibonacci Grid ──
    9: {
        hint: "Start with a=0, b=1. In each loop step: print a, then update both values (a becomes b, b becomes a+b).",
        concept: "Loops & Sequences",
        theory: "Fibonacci: each number = sum of\nthe previous two.\n0, 1, 1, 2, 3, 5, 8, 13, 21, 34",
        code: 'a, b = 0, 1\nfor i in range(10):\n    print(a)\n    a, b = b, a + b',
        tip: "a, b = b, a+b swaps both at once!"
    },

    // ── LEVEL 10: The Time Doors ──
    10: {
        hint: "Check each date by splitting DD/MM/YYYY, then verify the day is valid for that month. Feb=28 or 29, some months have 30, others 31.",
        concept: "String Splitting & Logic",
        theory: "Use .split('/') to break a date\nstring into day, month, year.\nThen check if the day is valid.",
        code: 'date = "15/06/2024"\nparts = date.split("/")\nday = int(parts[0])\nmonth = int(parts[1])\nprint(day, month)',
        tip: "Months with 30 days: Apr, Jun, Sep, Nov"
    },

    // ── LEVEL 11: The Whispering Walls ──
    11: {
        hint: "Use Python string slicing with [::-1] to reverse a string. Loop through all the names and print each one reversed.",
        concept: "Lists & String Reversal",
        theory: "Python strings can be reversed\nusing slice notation [::-1].\nUse a for loop to process each name.",
        code: 'name = "Luna"\nprint(name[::-1])  # anuL\n\nnames = ["Luna", "Forest"]\nfor n in names:\n    print(n[::-1])',
        tip: "[::-1] means start:end:step with step -1"
    },

    // ── LEVEL 12: The Enchanted Library ──
    12: {
        hint: "Use the .upper() method on a string to convert all characters to uppercase.",
        concept: "String Methods (.upper())",
        theory: "Python strings have built-in methods.\n.upper() converts all letters to UPPERCASE.\n.lower() converts to lowercase.",
        code: 'text = "hello world"\nprint(text.upper())  # HELLO WORLD\n\nname = "cat"\nprint(name.upper())  # CAT',
        tip: "You can also chain: print(\"hi\".upper())"
    },

    // ── LEVEL 13: The Stone Door ──
    13: {
        hint: "Use a for loop with range(1, 11) to generate each line of the multiplication table. Use an f-string to format the output.",
        concept: "For Loops & f-strings",
        theory: "range(1, 11) gives numbers 1-10.\nf-strings let you embed variables:\nf\"{n} x {i} = {n * i}\"",
        code: 'n = 7\nfor i in range(1, 11):\n    print(f"{n} x {i} = {n * i}")',
    },

    // ── LEVEL 14: The Dragon's Hoard ──
    14: {
        hint: "A prime number is only divisible by 1 and itself. Loop from 2 to n-1 and check if any number divides n evenly using the % (modulo) operator.",
        concept: "Prime Numbers & Modulo Operator",
        theory: "The % operator returns the remainder.\nIf n % i == 0, then n is divisible by i.\nA prime has no divisors other than 1 and itself.\nLoop from 2 to n-1 to check.",
        code: 'n = 17\nis_prime = True\nfor i in range(2, n):\n    if n % i == 0:\n        is_prime = False\n        break\nif is_prime:\n    print("Prime")\nelse:\n    print("Not Prime")',
        tip: "Print exactly \"Prime\" or \"Not Prime\" (capital P and N)"
    },

    // ── LEVEL 15: The Dragon Battle ──
    15: {
        hint: "Use a for loop with range(1, n+1). In each iteration, print '*' multiplied by the loop variable i.",
        concept: "Star Patterns & String Multiplication",
        theory: "In Python, you can repeat strings:\n\"*\" * 3 gives \"***\"\nUse a loop to increase the count each row.",
        code: 'n = 5\nfor i in range(1, n + 1):\n    print("*" * i)\n\n# Output:\n# *\n# **\n# ***\n# ****\n# *****',
        tip: "Each row i has exactly i asterisks — no spaces needed!"
    },

    // ── LEVEL 16: Cave Collapse ──
    16: {
        hint: "Use sorted() to sort characters by ASCII value, then join them back with \"\".join().",
        concept: "sorted(), join() & ASCII Values",
        theory: "Every character has an ASCII value.\nLowercase a-z = 97-122.\nsorted() sorts by these values.\n\"\".join() combines a list into a string.",
        code: 'word = "speed"\nresult = "".join(sorted(word))\nprint(result)  # deeps\n\n# ASCII: d=100, e=101, p=112, s=115',
        tip: "sorted() returns a list — wrap it with \"\".join() to get a string!"
    },

    // ── LEVEL 17: The Wizard's Riddle ──
    17: {
        hint: "Use a for loop to check numbers 500-1000. Inside, use nested if-else to check: is it odd? Is it less than 9**3? Is it greater than math.factorial(6)? Track the largest.",
        concept: "Nested If-Else & Nested Loops",
        theory: "Nested if-else checks multiple conditions:\nif condition1:\n    if condition2:\n        if condition3:\n            # all true\n\nUse ** for power, math.factorial() for !",
        code: 'import math\nresult = 0\nfor n in range(500, 1001):\n    if n % 2 != 0:\n        if n < 9 ** 3:\n            if n > math.factorial(6):\n                if n > result:\n                    result = n\nprint(result)',
        tip: "Break the riddle into parts — each clue becomes a nested if condition!"
    },

    // ── LEVEL 18: The River of Arrays ──
    18: {
        hint: "Use string slicing s[:5] to get 'River', .lower() to make it 'river', then add s[-1] to get the 's'.",
        concept: "String Slicing & Concatenation",
        theory: "s[start:end] extracts a substring.\ns[:5] = first 5 chars.\ns[-1] = last char.\n.lower() converts to lowercase.\n+ concatenates strings.",
        code: 's = "River of Shivers"\nresult = s[:5].lower() + s[-1]\nprint(result)  # rivers',
        tip: "s[:5] gives 'River' and s[-1] gives 's' — combine them!"
    },

    // ── LEVEL 19: The Broken Bridge ──
    19: {
        hint: "Use .sort() to sort the list in-place, or sorted() to get a new sorted list. Then print the result.",
        concept: "List Sorting (Ascending Order)",
        theory: "nums.sort() sorts in-place (modifies the list).\nsorted(nums) returns a new sorted list.\nBoth sort in ascending order by default.\nPrint the list to see the result.",
        code: 'nums = [42, 17, 85, 3, 56, 28, 91, 64, 10, 73]\nnums.sort()\nprint(nums)\n\n# Or: print(sorted(nums))',
        tip: ".sort() changes the original list. sorted() returns a copy!"
    },

    // ── LEVEL 20: The Statue of SIRIS ──
    20: {
        hint: "Loop through the words list. For each word, check if word == word[::-1]. If yes, it's a palindrome — print it!",
        concept: "Palindrome Check & String Reversal",
        theory: "A palindrome reads the same forwards and backwards.\nword[::-1] reverses a string.\n'MADAM'[::-1] = 'MADAM' ✓\n'CRYSTAL'[::-1] = 'LATSYRC' ✗\nLoop through a list with: for w in words:",
        code: 'words = ["MADAM", "CRYSTAL", "ARCANE"]\nfor word in words:\n    if word == word[::-1]:\n        print(word)',
        tip: "[::-1] reverses any string — if it equals the original, it's a palindrome!"
    },

    // ── LEVEL 21: The Hellfire Wasteland ──
    21: {
        hint: "A Strong Number has the sum of factorial of each digit equal to itself. Check every number from 1 to 10000!",
        concept: "Strong Numbers & Factorials",
        theory: "A Strong Number: sum of factorial of its digits = itself.\\n145 → 1! + 4! + 5! = 1 + 24 + 120 = 145 ✓\\n\\nUse import math and math.factorial(d)\\nConvert number to digits with str(num).\\nLoop through range(1, 10001).",
        code: 'import math\\nfor num in range(1, 10001):\\n    total = 0\\n    for d in str(num):\\n        total += math.factorial(int(d))\\n    if total == num:\\n        print(num)',
        tip: "There are only 3 Strong Numbers in this range: 1, 2, and 145!"
    },

    // ── LEVEL 22: The Cliff Rescue ──
    22: {
        hint: "Traverse the matrix edges clockwise: top row left→right, right col top→bottom, bottom row right→left, left col bottom→top, then the center.",
        concept: "Matrix Spiral Traversal",
        theory: "Clockwise spiral of a 3×3 matrix:\\n[[1,2,3],[4,5,6],[7,8,9]]\\n→ Top: 1 2 3\\n→ Right: 6 9\\n→ Bottom: 8 7\\n→ Left: 4\\n→ Center: 5\\nResult: 1 2 3 6 9 8 7 4 5\\n\\nUse while loop with top/bottom/left/right boundaries.",
        code: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]\\nresult = []\\ntop,bot,left,right = 0,2,0,2\\nwhile top<=bot and left<=right:\\n    for i in range(left,right+1):\\n        result.append(matrix[top][i])\\n    top += 1\\n    for i in range(top,bot+1):\\n        result.append(matrix[i][right])\\n    right -= 1\\n    for i in range(right,left-1,-1):\\n        result.append(matrix[bot][i])\\n    bot -= 1\\n    for i in range(bot,top-1,-1):\\n        result.append(matrix[i][left])\\n    left += 1\\nprint(" ".join(map(str,result)))',
        tip: "Shrink boundaries after each spiral layer. Print space-separated on one line!"
    },

    // ── LEVEL 23: The Broken Navigator ──
    23: {
        hint: "Use filter() with a lambda to keep even numbers, then map() with a lambda to square them. Print the result as a list!",
        concept: "filter(), map() & lambda",
        theory: "filter(func, iterable) keeps items where func returns True.\\nmap(func, iterable) applies func to every item.\\nlambda x: expr creates an anonymous function.\\n\\nfilter(lambda x: x%2==0, nums) → evens\\nmap(lambda x: x**2, evens) → squared",
        code: 'nums = [1,2,3,4,5,6,7,8,9,10]\\nevens = filter(lambda x: x%2==0, nums)\\nsquared = map(lambda x: x**2, evens)\\nprint(list(squared))',
        tip: "You can chain them: list(map(lambda x: x**2, filter(lambda x: x%2==0, nums)))"
    },

    // ── LEVEL 24: The Hellfire Shop ──
    24: {
        hint: "Calculate the average price using sum() and len(), then use a dict comprehension to keep only items priced below the average.",
        concept: "Dictionary Comprehension & Filtering",
        theory: "avg = sum(dict.values()) / len(dict)\\nDict comprehension: {k: v for k, v in dict.items() if condition}\\n\\nAverage of 150,80,40,200,30,100 = 600/6 = 100\\nItems below 100: Shield(80), Potion(40), Ring(30)",
        code: 'items = {"Sword": 150, "Shield": 80, "Potion": 40, "Armor": 200, "Ring": 30, "Boots": 100}\\navg = sum(items.values()) / len(items)\\nresult = {k: v for k, v in items.items() if v < avg}\\nprint(result)',
        tip: "The average is 100. Three items cost less than 100 gold!"
    },

    // ── LEVEL 25: The Full Inventory ──
    25: {
        hint: "Loop through new_items. If the item exists in inventory, add the quantity. Otherwise, create a new entry.",
        concept: "Dynamic Dictionary Update",
        theory: "Updating a dict dynamically:\\nfor item, qty in new_items:\\n    if item in inventory:\\n        inventory[item] += qty\\n    else:\\n        inventory[item] = qty\\n\\nAlternatively use dict.get(key, default):\\ninventory[item] = inventory.get(item, 0) + qty",
        code: 'inventory = {"Shield": 1, "Potion": 3, "Ring": 1}\\nnew_items = [("Potion", 2), ("Sword", 1), ("Boots", 2), ("Shield", 1)]\\nfor item, qty in new_items:\\n    inventory[item] = inventory.get(item, 0) + qty\\nprint(inventory)',
        tip: "dict.get(key, 0) returns 0 if key doesn't exist — perfect for adding new items!"
    },

    // ── LEVEL 26: The Volcano Radiation Map ──
    26: {
        hint: "Calculate distance using math.sqrt((x-vx)**2 + (y-vy)**2). Then radiation = strength / distance. Sum all 3 for total. Use nested if-else to classify the zone.",
        concept: "Nested If-Else & Distance Formula",
        theory: "Radiation decreases with distance:\\nrad = strength / distance\\ndistance = sqrt((x2-x1)² + (y2-y1)²)\\n\\nUse import math and math.sqrt()\\n\\nNested if-else for classification:\\nFirst check interference (2+ volcanoes with rad > 0.8)\\nThen check total thresholds:\\n  < 1.5 → Safe\\n  1.5-3.0 → Warning\\n  >= 3.0 → Danger",
        code: 'import math\\nvolcanoes = [(2,3,5), (8,3,4), (5,9,6)]\\nx, y = 0, -5\\nrads = []\\nfor vx, vy, s in volcanoes:\\n    d = math.sqrt((x-vx)**2 + (y-vy)**2)\\n    rads.append(s / d)\\ntotal = sum(rads)\\ninterference = sum(1 for r in rads if r > 0.8) >= 2\\nif total >= 3.0:\\n    print("Danger Zone")\\nelif interference:\\n    print("Interference Zone")\\nelif total >= 1.5:\\n    print("Warning Zone")\\nelse:\\n    print("Safe Zone")',
        tip: "For point (0,-5): all 3 volcano radiations are below 0.8, and total ≈ 1.364 < 1.5 → Safe Zone!"
    },

    // ── LEVEL 27: The Lava Crossing ──
    27: {
        hint: "Two words are anagrams if they have the exact same letters in the same quantities. Check length first, then compare sorted letters.",
        concept: "Anagram Check & sorted()",
        theory: "An anagram uses the exact same letters rearranged.\\n'listen' and 'silent' → Anagrams ✓\\n'flying' and 'lying' → Not Anagrams ✗\\n\\nQuick check: sorted(str1) == sorted(str2)\\nBut also check len(str1) == len(str2) first!\\n\\nsorted('cat') → ['a', 'c', 't']\\nsorted('act') → ['a', 'c', 't'] → Same!",
        code: 'str1 = "flying"\\nstr2 = "lying"\\nif sorted(str1) == sorted(str2):\\n    print("Anagrams")\\nelse:\\n    print("Not Anagrams")',
        tip: "'flying' has 6 letters (f,l,y,i,n,g) but 'lying' has 5 (l,y,i,n,g). Different lengths = Not Anagrams!"
    },

    // ── LEVEL 28: Lucifer's Castle ──
    28: {
        hint: "Use Manhattan distance: dist = abs(i - mid) + abs(j - mid). If dist == mid → '*' (border), dist < mid → ' ' (hollow), dist > mid → '#' (outside).",
        concept: "Hollow Diamond Pattern & Nested Loops",
        theory: "A hollow diamond in a square matrix uses:\\nmid = n // 2\\nManhattan distance = |row - mid| + |col - mid|\\n\\nFor each cell:\\n  dist == mid → diamond border (*)\\n  dist < mid  → inside, hollow (space)\\n  dist > mid  → outside (#)\\n\\nFor n=5, mid=2:\\n  ##*##\\n  #* *#\\n  *   *\\n  #* *#\\n  ##*##",
        code: 'n = 5\\nmid = n // 2\\nfor i in range(n):\\n    row = ""\\n    for j in range(n):\\n        dist = abs(i - mid) + abs(j - mid)\\n        if dist == mid:\\n            row += "*"\\n        elif dist < mid:\\n            row += " "\\n        else:\\n            row += "#"\\n    print(row)',
        tip: "The key insight is Manhattan distance: abs(i-mid) + abs(j-mid). This creates the diamond shape naturally in a grid!"
    },

    // ── LEVEL 29: The Three Lucifers ──
    29: {
        hint: "An Armstrong number: sum of cubes of digits == the number. Check 245, 153, 312 — only one satisfies this!",
        concept: "Armstrong Number & Digit Manipulation",
        theory: "Armstrong number (3-digit):\\nSum of CUBES of each digit = number itself\\n\\n153 → 1³+5³+3³ = 1+125+27 = 153 ✓\\n245 → 2³+4³+5³ = 8+64+125 = 197 ✗\\n312 → 3³+1³+2³ = 27+1+8 = 36 ✗\\n\\nExtract digits with % and //:\\n  ones = num % 10\\n  tens = (num // 10) % 10\\n  hundreds = num // 100\\n\\nOr use str(): int(d)**3 for d in str(num)",
        code: 'numbers = [245, 153, 312]\\nfor num in numbers:\\n    total = sum(int(d)**3 for d in str(num))\\n    if total == num:\\n        print(num)',
        tip: "153 is the Armstrong number! 1³+5³+3³ = 1+125+27 = 153. The other two fail the check."
    },

    // ── LEVEL 30: The Dragon's Heart ──
    30: {
        hint: "Walk through the string, count consecutive same characters, then append char+count to the result. Don't forget the last group!",
        concept: "String Compression (Run-Length Encoding)",
        theory: "String compression counts consecutive repeats:\\n'aabcccccaaa' → 'a2b1c5a3'\\n\\nAlgorithm:\\n1. Set current = first char, count = 1\\n2. Loop from index 1 to end:\\n   If same as current → count += 1\\n   Else → append current+count to result,\\n          reset current and count\\n3. Don't forget to append the LAST group!\\n\\nThis is also called Run-Length Encoding (RLE).",
        code: 's = "aabcccccaaa"\\nresult = ""\\ncount = 1\\nfor i in range(1, len(s)):\\n    if s[i] == s[i-1]:\\n        count += 1\\n    else:\\n        result += s[i-1] + str(count)\\n        count = 1\\nresult += s[-1] + str(count)\\nprint(result)',
        tip: "The trickiest part is handling the LAST group — after the loop ends, append the final character and its count!"
    }
};

// ── Quick Reference (always the same, collapsible) ──
var QUICK_REF = ''
    + '<div class="help-code">'
    + '# Print text\n'
    + 'print("Hello")\n\n'
    + '# Variables\n'
    + 'x = 10\n'
    + 'name = "cat"\n\n'
    + '# Math: + - * / ** %\n'
    + 'print(5 + 3)    # 8\n'
    + 'print(10 % 3)   # 1\n'
    + 'print(2 ** 3)   # 8\n\n'
    + '# if / elif / else\n'
    + 'if x > 0:\n'
    + '    print("yes")\n'
    + 'elif x == 0:\n'
    + '    print("zero")\n'
    + 'else:\n'
    + '    print("no")\n\n'
    + '# for loop\n'
    + 'for i in range(5):\n'
    + '    print(i)\n\n'
    + '# Useful functions\n'
    + 'max(3, 7, 2)    # 7\n'
    + 'min(3, 7, 2)    # 2\n'
    + 'abs(-5)         # 5\n'
    + 'int("42")       # 42'
    + '</div>';


/**
 * Call this in each level's HTML to create the help box.
 * @param {number} level — Level number (1–10)
 */
function createHelpBox(level) {
    var data = HELP_DATA[level];
    if (!data) return;

    // ── Build the help button ──
    var btn = document.createElement('button');
    btn.id = 'help-btn';
    btn.title = 'Help & Hints';
    btn.textContent = '📖';

    // ── Build the overlay ──
    var overlay = document.createElement('div');
    overlay.id = 'help-overlay';

    overlay.innerHTML = ''
        + '<div id="help-panel">'
        +   '<div id="help-header">'
        +     '<span id="help-title">📖 HELP — LEVEL ' + level + '</span>'
        +     '<button id="help-close">✕</button>'
        +   '</div>'
        +   '<div id="help-body">'

        // Section 1: Hint
        +     '<div class="help-section">'
        +       '<div class="help-section-title">💡 HINT</div>'
        +       '<div class="help-text">' + data.hint + '</div>'
        +     '</div>'

        +     '<hr class="help-divider">'

        // Section 2: Concept
        +     '<div class="help-section">'
        +       '<div class="help-section-title">📘 ' + data.concept.toUpperCase() + '</div>'
        +       '<div class="help-text">' + data.theory + '</div>'
        +       '<div class="help-code">' + data.code + '</div>'
        +       '<div class="help-text">💡 Tip: ' + data.tip + '</div>'
        +     '</div>'

        +     '<hr class="help-divider">'

        // Section 3: Quick Reference (collapsible)
        +     '<div class="help-section">'
        +       '<button class="help-toggle" id="help-ref-toggle">'
        +         '📚 PYTHON QUICK REFERENCE'
        +         '<span id="help-toggle-arrow">▼</span>'
        +       '</button>'
        +       '<div class="help-toggle-content" id="help-ref-content">'
        +         QUICK_REF
        +       '</div>'
        +     '</div>'

        +   '</div>'
        + '</div>';

    // ── Add to page ──
    document.body.appendChild(btn);
    document.body.appendChild(overlay);

    // ── Event listeners ──
    btn.addEventListener('click', function () {
        overlay.classList.add('open');
    });

    overlay.querySelector('#help-close').addEventListener('click', function () {
        overlay.classList.remove('open');
    });

    // Close when clicking outside the panel
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            overlay.classList.remove('open');
        }
    });

    // Toggle quick reference
    overlay.querySelector('#help-ref-toggle').addEventListener('click', function () {
        var content = document.getElementById('help-ref-content');
        var arrow = document.getElementById('help-toggle-arrow');
        if (content.classList.contains('open')) {
            content.classList.remove('open');
            arrow.textContent = '▼';
        } else {
            content.classList.add('open');
            arrow.textContent = '▲';
        }
    });
}
