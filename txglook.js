/* Data Structures */
const tangraphScores = {}; // Will be populated from external source

/* DOM Elements */
const elements = {
    output: document.getElementById('output'),
    rolloverInfo: document.getElementById('rollover-info'),
    resultList: document.getElementById('result-list'),
    strokeEntryField: document.getElementById('stroke-entry-field'),
    strokeBeginsWith: document.getElementById('stroke-begins-with'),
    strokeEndsWith: document.getElementById('stroke-ends-with'),
    lfwEntryField: document.getElementById('lfw-entry-field'),
    fourcodeEntryField: document.getElementById('fourcode-entry-field'),
    unicodeEntryField: document.getElementById('unicode-entry-field')
};

/* Code Input Kind */
if (typeof CodeInputKind === 'undefined') {
    const CodeInputKind = Object.freeze({
      STROKE: 0,
      LFW: 1,
      FOURCODE: 2,
      UNICODE: 3
    });
}

/* State */
let results = [];

/* jQuery initializations */
$(() => {
    $('.toggler').on('click', function () {
        $(this).next('div').slideToggle();
        const isPlus = $(this).hasClass('glyphicon-plus-sign');
        $(this)
            .toggleClass('glyphicon-plus-sign', !isPlus)
            .toggleClass('glyphicon-minus-sign', isPlus);
    });
});

/**
 * Switch writing mode between LTR and TTB
 * @param {string} mode - The writing mode to switch to
 */
function switchWritingMode(mode) {
    if (!elements.output) return;
    elements.output.style['writing-mode'] = mode;
}

/**
 * Update rollover information text
 * @param {string} tangraph - The tangraph character
 */
function rolloverResult(tangraph) {
    if (!elements.rolloverInfo || !tangraphInfo[tangraph]) return;
    elements.rolloverInfo.textContent = `${tangraph} ${tangraphInfo[tangraph]?.[3] || ''}`;
}

/**
 * Update list of result tangraphs on page
 * @param {number} maxChars - Maximum number of characters to display
 */
function updatePageResults(maxChars = 80) {
    if (!elements.resultList) return;

    const resultItems = results
        .slice(0, maxChars)
        .map(tangraph => `
            <li class="results-item" 
                    onmouseover="rolloverResult('${tangraph}');" 
                    onclick="insertAtCursor('output', '${tangraph}');">
                ${tangraph}
            </li>
        `)
        .join('');

    elements.resultList.innerHTML = resultItems;
}

/**
 * Insert character at cursor position
 * @param {string} elementId - Target element ID
 * @param {string} char - Character to insert
 */
function insertAtCursor(elementId, char) {
    const output = document.getElementById(elementId);
    if (!output) return;

    if (output.selectionStart || output.selectionStart === 0) {
        const startPos = output.selectionStart;
        const endPos = output.selectionEnd;
        output.value =
            output.value.substring(0, startPos) +
            char +
            output.value.substring(endPos);
    } else {
        output.value += char;
    }

    if (!!output.value) {
        const outputHisState = document.getElementById("outputHisState");
        let history = !!outputHisState.value ? JSON.parse(outputHisState.value) : [];
        const currentValue = output.value;
        const lastValue = !! history ? history[history.length - 1] : "";

        // add different value into history
        if (currentValue !== lastValue) {
            history.push(currentValue);
        }        
        outputHisState.value = JSON.stringify(history);  
    }    
    // show Field Clear Button
    updateFieldClearState(output);    
}

/**
 * Safe check for tangraph data
 * @returns {boolean} Whether the required data is available
 */
function isDataAvailable() {
    return typeof tangraphInfo === 'object' &&
        typeof tangraphScores === 'object' &&
        Object.keys(tangraphInfo).length > 0;
}

/**
 * Update results list based on current filters
 */
function updateResultsList(field, inputKind) {
    if (!isDataAvailable()) {
        console.warn('Tangraph data not yet available');
        return;
    }

    // special code patterns (LFW code or Four Corner code)
    const isValidFourCode = inputKind == CodeInputKind.FOURCODE;
    const isLFWCode = inputKind == CodeInputKind.LFW;
    const isUnicode = inputKind == CodeInputKind.UNICODE;
    const isSpecialCode = isValidFourCode || isLFWCode || isUnicode;

    let codeValue = field?.value || '';
    if (isLFWCode) {
        codeValue = "L" + codeValue;
    } else if (isUnicode) {
        codeValue = "U+" + codeValue;
    }
    if (!codeValue) {
        // Default sorting by score when no input
        results = Object.keys(tangraphInfo)
            .filter(key => tangraphScores[key] > 0)
            .sort((a, b) => (tangraphScores[b] || 0) - (tangraphScores[a] || 0));
        updatePageResults();
        return;
    }

    // Build regex pattern
    let regex = codeValue.replace('*', '.*');
    if (isSpecialCode) {
        regex = codeValue.replace(/[.*+^${}()|[\]\\]/g, "\\$&").replace(/\?/g, ".");
    } else {
        if (elements.strokeBeginsWith?.checked) regex = `^${regex}`;
        if (elements.strokeEndsWith?.checked) regex += '$';
    }

    // Searches for matching strings(Tangut characters) using a regular expression based 
    // on the input code.
    const startsWithSeq = [];
    const containsSeq = [];
    const maxChars = 80;

    try {
        const getSortItems = (array, startIndex, count, key) => {
            const items = [
                ...[key],
                ...array.slice(startIndex, startIndex + count),
                ...Array(Math.max(0, count - (array.length - startIndex))).fill(""),
              ];
            return items;
        };

        const pattern = new RegExp(regex);
        const startPattern = new RegExp(`^${regex}`);

        let logCount = 0;
        Object.entries(tangraphInfo).forEach(([tangraph, info]) => {
            // - If the input code (=codeValue) is a valid LFW code or 4+ digit's Four Corner 
            //     code, search for the corresponding character from info[3] using them as keys.
            // - Otherwise, treat it as an existing radical code, and 
            //     search for the corresponding character from info[2] based on that radical. 
            if (startsWithSeq.length + containsSeq.length > maxChars) {
                // limit the cont of result list
                return;
            }
            if (isSpecialCode) {
                const specialCodeInfo = info[3];
                const codes = specialCodeInfo.split(/\s+/);
                const isMatch = codes.some(code => startPattern.test(code));
                if (!!isMatch) {
                    startsWithSeq.push(getSortItems(codes, 0, 3, tangraph));
                }
            } else {
                const strokeInfo = info[2];
                const codes = info[3].split(/\s+/);
                if (startPattern.test(strokeInfo)) {
                    startsWithSeq.push(getSortItems(codes, 0, 3, tangraph));
                } else if (pattern.test(strokeInfo)) {
                    containsSeq.push(getSortItems(codes, 0, 3, tangraph));
                }
            }
        });

        const tempResults = [...startsWithSeq, ...containsSeq];
        if (inputKind == CodeInputKind.LFW) {
            // sort by LFW -> FOURCODE -> UNICODE
            results = sortTangutCharData(array = tempResults, key1 = 3, key2 = 2, key3 = 1);
        } else if (inputKind == CodeInputKind.FOURCODE || inputKind == CodeInputKind.STROKE) {
            // sort by FOURCODE -> LFW -> UNICODE
            results = sortTangutCharData(array = tempResults, key1 = 2, key2 = 3, key3 = 1);
        } else {
            // sort by UNICODE -> LFW -> FOURCODE
            results = sortTangutCharData(array = tempResults, key1 = 1, key2 = 3, key3 = 2);
        }
        updatePageResults();
    } catch (error) {
        console.error('Invalid regex pattern:', error);
        results = [];
        updatePageResults();
    }
}

/**
 * Sorts a two-dimensional array by multiple keys and
 * returns only the first element of each row.
 *
 * @param {Array} data       A two-dimensional array.
 * @param {number} key1      The primary sort key (default: 0).
 * @param {number} key2      The secondary sort key (default: 1).
 * @param {number} key3      The secondary sort key (default: 2).
 * @returns {Array}          An array of the first elements after sorting.
 * 
 * @example
 * const data = [["𗀜","U+1701C","102252","L0043"], 
 *  ["𗀪","U+1702A","104124", "L0085"], ...];
 * 
 * const results = sortTangutCharData(data, 2, 3, 1);
 */
function sortTangutCharData(data, key1 = 0, key2 = 1, key3 = 2) {

    // Copy the original array to avoid mutating it, then sort the copy.
    const sorted = [...data].sort((a, b) => {

        // Compare by the primary sort key.
        if (!!a[key1] && !!b[key1]) {
            if (a[key1] < b[key1]) return -1;
            if (a[key1] > b[key1]) return 1;            
        }

        // If the primary keys are equal, compare by the secondary key.
        if (!!a[key2] && !!b[key2]) {
            if (a[key2] < b[key2]) return -1;
            if (a[key2] > b[key2]) return 1;
        }

        // If the second keys are equal, compare by the third key.
        if (!!a[key3] && !!b[key3]) {
            if (a[key3] < b[key3]) return -1;
            if (a[key3] > b[key3]) return 1;
        }

        return 0;
    });

    // Extract only the first element of each row.
    return sorted.map(row => row[0]);
}

/**
 * Toggle checkbox state and update results
 * @param {string} id - Checkbox element ID
 */
function toggleCheckbox(id) {
    const checkbox = document.getElementById(id);
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
        updateCodeEntry(elements.strokeEntryField, CodeInputKind.STROKE);
    }
}
/**
 * Insert stroke and update results
 * @param {string} stroke - Stroke to insert
 */
function insertStroke(stroke) {
    const field = elements.strokeEntryField;
    field.value += stroke;
    updateCodeEntry(field, CodeInputKind.STROKE);
    // show Field Clear Button if need
    updateFieldClearState(field);
}

/**
 * Updates the code entry field
 */
function updateCodeEntry(field, inputKind) {
    if (!field || !field.value) return;

    let val = field.value.toUpperCase();
    let shouldUpdateResults = false; 

    // 1. If `inputKind` is LFW: Allow 'L' followed by up to 4 digits (L0000 format).
    if (inputKind == CodeInputKind.LFW) {
        const match = val.match(/^[0-9]{0,4}/);
        val = !!match ? match[0] : '';
        shouldUpdateResults = val.length >= 3;       
    }
    // 2. If `inputKind` is FOURCODE: Allow digits or "?", up to a maximum of 6 digits.
    else if (inputKind == CodeInputKind.FOURCODE) {
        let match = val.match(/\?/g) || [];
        if ((val.length <=4 && match.length > 2) 
            || val.length > 4 && match.length > 3) {
            val = val.substring(0, val.length - 1);
        }
        match = val.match(/^[0-9?]{0,6}/);
        val = !!match ? match[0] : '';
        shouldUpdateResults = val.length >= 4;       
    }
    // 3. If `inputKind` is STROKE: then value should be in between 'A' and 'Q': 
    // Allow alphabetic characters only (no length limit, numbers prohibited).
    else if (inputKind == CodeInputKind.STROKE) {
        const match = val.match(/^[A-Q]+/);
        val = !!match ? match[0] : '';
        shouldUpdateResults = val.length >= 2;       
    }
    // 4. If `inputKind` is UNICODE: then value should be in between 0-9, 'A' and 'F': 
    // Allow alphabetic characters only (no length limit, numbers prohibited).
    else if (inputKind == CodeInputKind.UNICODE) {
        const match = val.match(/^[0-9A-F]{0,5}/);
        val = !!match ? match[0] : '';
        shouldUpdateResults = val.length >= 4;       
    }
    // 4. Clear the input for any other unauthorized characters.
    else {
        val = '';
    }

    // Reflect the validated value in the input field and update the results list.
    field.value = val;
    if (!val) {
        updateFieldClearState(field);
    }
    // Update the relevant result list based on the current input type's update availability.
    // Update conditions (using the above local var `shouldUpdateResults`):
    // - Stroke entry: 2+ alphabetic characters
    // - LFW entry: 3+ digits
    // - Four-Corner entry: 4+ digits
    // - Unicode entry: 4+ alphanumeric characters
    if (shouldUpdateResults) {
        updateResultsList(field, inputKind);
    }
}

/**
 *  show Field Clear Button (x) if need
 */
function updateFieldClearState(field) {
    const parent = field.parentElement;
    if (parent && parent.tagName === 'DIV' 
        && parent.classList.contains('has-clear')) {
        parent.classList.toggle("has-value", !!field.value);
    }    
}


/**
 * Initialize application
 */
function init() {
    // Add event listeners only if elements exist
    if (elements.strokeEntryField) {
        elements.strokeEntryField.addEventListener('keyup', (event) => {
            updateCodeEntry(elements.strokeEntryField, CodeInputKind.STROKE);
        });
    }

    if (elements.strokeBeginsWith) {
        elements.strokeBeginsWith.addEventListener('change', (event) => {
            updateCodeEntry(elements.strokeEntryField, CodeInputKind.STROKE);
        });
    }

    if (elements.strokeEndsWith) {
        elements.strokeEndsWith.addEventListener('change', (event) => {
            updateCodeEntry(elements.strokeEntryField, CodeInputKind.STROKE);
        });
    }

    // Wait for data to be available before initial update
    if (isDataAvailable()) {
        updateResultsList(elements.strokeEntryField, CodeInputKind.STROKE);
    } else {
        console.warn('Waiting for tangraph data to be loaded...');
    }
}

/* Initialize application when DOM is ready */
$(init);