// Global variable to hold the database instance
let db, stmts;

// Initialize the database directly within an anonymous async function
(async () => {
    try {
        // 1. Initialize the WebAssembly engine
        const SQL = await initSqlJs({
            locateFile: file => `https://sql.js.org/dist/${file}`
        });

        // 2. Fetch the database file as binary data
        const resp = await fetch('./tgt_data.db');
        if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
        
        const buf = await resp.arrayBuffer();

        // 3. Assign the created instance to the 'db' variable
        db = new SQL.Database(new Uint8Array(buf));

        console.log("Database is ready directly:", db);

        // Pre-compile SQL statements for better performance.
        // This avoids recompiling the SQL string for every single lookup.
        stmts = (() => {
            const _instances = {
                word: db.prepare('SELECT * FROM WORD_DATA WHERE word LIKE ? LIMIT ?'),
                char: db.prepare('SELECT * FROM CHARACTER_DATA WHERE character = ? LIMIT ?')
            };

            // convert snake case into camel case.
            const _toCamelCase = (str) => {
                return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
            };

            // convert all keys into camel case. 
            const _convertKeysToCamelCase = (obj) => {
                const camelCaseObj = {};
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        camelCaseObj[_toCamelCase(key)] = obj[key];
                    }
                }
                return camelCaseObj;
            };    
                    
            const _fetchAndReset = (stmt) => {
                    const results = [];
                    try {
                        while (stmt.step()) {
                            const rawRow = stmt.getAsObject();
                            // After converting a record keys as camel case, and push it into results list.
                            results.push(_convertKeysToCamelCase(rawRow));
                        }
                    } finally {
                        stmt.reset(); // reset if error
                    }
                    return results;
                };

            // --- Public API ---
            // open as 'stmts'
        return {
                /**
                 *  Partial/whole match with the specified word
                 * @param {string} searchWord 
                 * @param {int} limit - limit count for getting data
                 */
                getWordData(searchWord, limit = 1) {
                    const stmt = _instances.word;
                    // LIKE statement
                    const lim = limit > 0 ? limit : 1;
                    stmt.bind([`${searchWord}`, lim]);
                    const results = _fetchAndReset(stmt);
                    if (lim == 1) {
                        if (!!results && results.length > 0) {
                            return results[0];
                        } else{
                            return null;
                        }
                    }
                    return results;
                },

                /**
                 * Contains the specified char 
                 * @param {string} char - one word(char)
                 * @param {int} limit - limit count for getting data
                 */
                getCharData(char, limit = 1) {
                    const stmt = _instances.char;
                    const lim = limit > 0 ? limit : 1;
                    stmt.bind([char, lim]);
                    const results = _fetchAndReset(stmt);
                    if (lim == 1) {
                        if (!!results && results.length > 0) {
                            return results[0];
                        } else{
                            return null;
                        }
                    }
                    return results;
                },

                // free method
                free() {
                    Object.values(_instances).forEach(s => s.free());
                }
            };
        })();

        // Start your application logic here (e.g., render UI)
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
})();


/**
 * Checks if a word exists in the WORD_DATA table.
 * @param {string|Array} chars - The string or array of characters to check.
 */
function checkWordInDictionary(chars) {
    const word = Array.isArray(chars) ? chars.join('') : chars;
    const entry = stmts.getWordData(word);
    return !!entry; // Returns true if record exists, false otherwise
}

/**
 * Retrieves the explanation for a specific word from the DB.
 * @param {string} word - The word key.
 * @param {string} lang - Language suffix (e.g., 'EN', 'CN').
 */
function getWordExplanation(word, lang) {
    const entry = stmts.getWordData(word);
    return entry ? entry[`explanation${lang}`] || '' : '';
}

// 检查是否为有效字符（非符号）
function isValidChar(char) {
    // 如果包含连接符，检查连接符前后的字符
    if (char && (char.includes('-') || char.includes('='))) {
        const parts = char.split(/[-=]/);
        return parts.some(part => part && !/[\p{P}\s]/u.test(part));
    }
    return char && !/[\p{P}\s]/u.test(char);
}

const COMBINE_RULES = {
    characters: {
        // 定义通用的连接规则模板
        COMBINE_TEMPLATES: {
            PREV_EQUAL: {
                combineWithPrevious: true,
                connector: '='
            },
            PREV_HYPHEN: {
                combineWithPrevious: true,
                connector: '-'
            },
            NEXT_HYPHEN: {
                combineWithNext: true,
                connector: '-'
            }
        },
        
        // 特殊规则(需要单独定义的变体规则)
        '𗧓': {
            variants: [
                {
                    type: 'standalone',
                    condition: (prev, next) => !isValidChar(prev),
                    explanationEN: 'I',
                    explanationCN: '我',
                },
                {
                    type: 'combineWithPrevious',
                    connector: '-',
                    condition: (prev, next) => isValidChar(prev),
                    explanationEN: '𝟣ꜱɢ',
                    explanationCN: '𝟣ꜱɢ',
                },
            ]
        },
        '𘄢': {
            variants: [
                {
                    type: 'standalone',
                    condition: (prev, next) => !isValidChar(prev) & !isValidChar,
                    explanationEN: 'Yes',
                    explanationCN: '是',
                },
                {
                    type: 'combineWithPrevious',
                    connector: '=',
                    condition: (prev, next) => isValidChar(prev),
                    explanationEN: 'ɪɴᴛʀɢ.ʀᴛʜ',
                    explanationCN: 'ɪɴᴛʀɢ.ʀᴛʜ',
                },
            ]
        },
        '𘃞': {
            variants: [
                {
                    type: 'standalone',
                    condition: (prev, next) => !isValidChar(prev),
                    explanationEN: '=',
                    explanationCN: '=',
                },
                {
                    type: 'combineWithPrevious',
                    connector: '=',
                    condition: (prev, next) => isValidChar(prev),
                    explanationEN: 'ᴇxʟᴀᴍ',
                    explanationCN: 'ᴇxʟᴀᴍ',
                },
            ]
        },
        '𗭪': {
            combineWithPrevious: true,
            connector: '-='
        },
        
        // 使用规则模板的字符
        PREV_EQUAL_CHARS: [
            '𗫂', '𗅁', '𘆄', '𗇋', '𗗙', '𗦇', '𘏚', '𗑠', '𘋩', '𗳒',
            '𗸒', '𗖵', '𘔼', '𗏣', '𘕿', '𗀔', '𗯴', '𘂤', '𗙼', '𘅍',
            '𘝨', '𗍊', '𗗂', '𘃡'
        ],
        
        PREV_HYPHEN_CHARS: [
            '𘉞', '𗐱', '𗗟', '𗫶', '𘂆','𗣬'
        ],
        
        NEXT_HYPHEN_CHARS: [
            '𗅋', '𗷝', '𘖑', '𘅇', '𗈪', '𗱢', '𗋚', '𘙌', '𘙇', '𗞞',
            '𗌽', '𗭊', '𘀆', '𗘯', '𘊐', '𗏺', '𘗐', '𗋸'
        ]
    }
};

// 在代码初始化时展开模板
function expandCombineRules(rules) {
    const { COMBINE_TEMPLATES, PREV_EQUAL_CHARS, PREV_HYPHEN_CHARS, NEXT_HYPHEN_CHARS, ...specificRules } = rules.characters;
    
    const expandedRules = { ...specificRules };
    
    // 展开使用等号连接前面字符的规则
    PREV_EQUAL_CHARS.forEach(char => {
        expandedRules[char] = { ...COMBINE_TEMPLATES.PREV_EQUAL };
    });
    
    // 展开使用连字符连接前面字符的规则
    PREV_HYPHEN_CHARS.forEach(char => {
        expandedRules[char] = { ...COMBINE_TEMPLATES.PREV_HYPHEN };
    });
    
    // 展开使用连字符连接后面字符的规则
    NEXT_HYPHEN_CHARS.forEach(char => {
        expandedRules[char] = { ...COMBINE_TEMPLATES.NEXT_HYPHEN };
    });
    
    return {
        characters: expandedRules
    };
}

// 初始化时展开规则
const EXPANDED_COMBINE_RULES = expandCombineRules(COMBINE_RULES);


/**
 * Main logic to retrieve character explanation, handling complex combining rules.
 */
function getExplanation(char, lang, prevChar, nextChar) {
    // 1. Check for special variant rules in static configuration
    const rules = EXPANDED_COMBINE_RULES.characters[char];
    if (rules?.variants) {
        const variant = rules.variants.find(v => v.condition(prevChar, nextChar));
        if (variant) {
            return variant[`explanation${lang}`] || '';
        }
    }

    // 2. Handle compound characters separated by '-' or '='
    if (char.includes('-') || char.includes('=')) {
        const connectors = char.match(/[-=]/g);
        const parts = char.split(/[-=]/);
        let explanation = '';

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const prevPart = i > 0 ? parts[i - 1] : prevChar;
            const nextPart = i < parts.length - 1 ? parts[i + 1] : nextChar;
            
            const partRules = EXPANDED_COMBINE_RULES.characters[part];
            if (partRules?.variants) {
                const variant = partRules.variants.find(v => v.condition(prevPart, nextPart));
                if (variant) {
                    explanation += variant[`explanation${lang}`] || '';
                } else {
                    explanation += fetchCharFromDb(part, lang);
                }
            } else {
                explanation += fetchCharFromDb(part, lang);
            }

            // Re-attach the connector symbol if present
            if (connectors && connectors[i]) {
                explanation += connectors[i];
            }
        }
        return explanation;
    }

    // 3. Fallback to standard character dictionary lookup
    return fetchCharFromDb(char, lang);
}

/**
 * Internal helper to query CHARACTER_DATA table.
 * @param {string} char - The character to look up.
 * @param {string} lang - Language suffix.
 */
function fetchCharFromDb(char, lang) {
    const entry = stmts.getCharData(char);
    return entry ? entry[`explanation${lang}`] || '' : '';
}

// 定义输出格式的分隔符
const FORMAT_SEPARATORS = {
    typst: {
        items: ', '
    },
    obsidian: {
        items: ' '
    },
    plaintext: {
        items: ' ',
        vertical: '\n',
        padding: ' '
    }
};

function processCombination(items) {
    const result = [];
    let i = 0;
    console.log("items.count=", items.length);
    while (i < items.length) {
        const currentItem = items[i];
        if (currentItem.trim().length < 1) {
            i++;
            continue;
        }

        // 如果是标点符号，直接处理
        if (/[\p{P}\s]/u.test(currentItem)) {
            result.push(currentItem);
            i++;
            continue;
        }

        let handled = false;
        const rules = EXPANDED_COMBINE_RULES.characters;

        // 查找所有以当前字符开头的词组
        const possibleWords = findWordsStartingWith(currentItem);
        
        // 如果找到词组，检查是否完全匹配
        if (possibleWords.length > 0) {
            const matchedWord = findExactMatch(items, i, possibleWords);
            if (matchedWord) {
                // 获取词组的格式信息
                const wordEntry = stmts.getWordData(matchedWord.word);
                let formattedWord = matchedWord.word;
                if (wordEntry && wordEntry.format && wordEntry.format.prefix) {
                    formattedWord = wordEntry.format.prefix + formattedWord;
                }

                // 检查是否需要与前一个字符组合
                if (result.length > 0 && rules[matchedWord.word[0]]?.combineWithPrevious) {
                    const connector = rules[matchedWord.word[0]].connector;
                    result[result.length - 1] = `${result[result.length - 1]}${connector}${formattedWord}`;
                } else {
                    result.push(formattedWord);
                }
                i += matchedWord.length;
                handled = true;
                continue;
            }
        }

        // 如果没有找到词组匹配，处理单字的组合规则
        if (!handled) {
            // 处理向后组合的规则
            if (rules[currentItem]?.combineWithNext) {
                const connector = rules[currentItem].connector;
                if (i + 1 < items.length) {
                    let combinedStr = currentItem;
                    let nextIndex = i + 1;
                    
                    // 首先检查后续字符是否构成词组
                    const remainingItems = items.slice(nextIndex);
                    const possibleWords = findWordsStartingWith(remainingItems[0]);
                    const matchedWord = findExactMatch(remainingItems, 0, possibleWords);
                    
                    if (matchedWord) {
                        // 如果找到词组，只添加当前字符和连接符
                        result.push(combinedStr + connector);
                        i++;
                        continue;  // 让主循环继续处理词组
                    }
                    
                    // 如果没找到词组，处理连续的向后连接
                    while (nextIndex < items.length) {
                        const nextItem = items[nextIndex];
                        
                        // 检查下一个位置开始是否构成词组
                        const nextPossibleWords = findWordsStartingWith(nextItem);
                        const nextMatchedWord = findExactMatch(items, nextIndex, nextPossibleWords);
                        
                        if (nextMatchedWord) {
                            // 如果发现词组，添加连接符并退出循环
                            combinedStr += connector;
                            result.push(combinedStr);
                            i = nextIndex;
                            break;
                        }
                        
                        // 添加连接符和下一个字符
                        combinedStr += connector + nextItem;
                        
                        // 如果下一个字符也有向后组合规则且不是最后一个字符，继续处理
                        if (rules[nextItem]?.combineWithNext && nextIndex < items.length - 1) {
                            nextIndex++;
                        } else {
                            // 如果是最后一个字符或下一个字符没有向后组合规则
                            result.push(combinedStr);
                            i = nextIndex + 1;  // 更新索引到下一个位置
                            break;
                        }
                    }
                    handled = true;
                    continue;
                }
            }

            // 处理与前一个字符组合的规则
            if (result.length > 0) {            
                let shouldCombine = false;
                let connector = '';

                if (rules[currentItem]?.variants) {
                    const variant = rules[currentItem].variants.find(v => {
                        return v.type === 'combineWithPrevious' && 
                            v.condition(result[result.length - 1], items[i + 1]);
                    });
                    
                    if (variant) {
                        shouldCombine = true;
                        connector = variant.connector;
                    }
                } else if (rules[currentItem]?.combineWithPrevious) {
                    shouldCombine = true;
                    connector = rules[currentItem].connector;
                }

                if (shouldCombine) {
                    result[result.length - 1] = `${result[result.length - 1]}${connector}${currentItem}`;
                    i++;
                    handled = true;
                    continue;
                }
            }
        }

        // 如果没有被处理，作为单个字符添加
        if (!handled) {
            result.push(currentItem);
            i++;
        }
    }

    return result;
}

// 查找以指定字符开头的所有词组
function findWordsStartingWith(char) {
    if (!!char && char.trim().length < 1) {
        return [];
    }
    const entries = stmts.getWordData(char + "%", limit = 100)

    const matches = (entries || [])
        .map(({word, priority}) => {
        // 将词组转换为字符数组进行比较
        return {
            word,
            length: [...word], // 使用数组长度来获取正确的字符数
            priority: priority || 0
        };
    });

    // 按优先级和长度排序
    return matches.sort((a, b) => {
        if (a.priority !== b.priority) {
            return b.priority - a.priority;
        }
        return b.length - a.length;
    });
}


// 检查是否完全匹配
function findExactMatch(items, startIndex, possibleWords) {
    for (const wordInfo of possibleWords) {
        const { word, length } = wordInfo;
        if (startIndex + length > items.length) continue;
        
        // 直接比较字符串
        const candidate = items.slice(startIndex, startIndex + length).join('');
        if (candidate === word) {
            return wordInfo;
        }
    }
    return null;
}



function processTypstBrackets(text) {
    if (!text) {
        return '[]';
    }

    const bracketMatch = text.match(/^\[(.*)\]$/);
    if (bracketMatch) {
        return `[${bracketMatch[1]}]`;
    }

    return `[${text}]`;
}

function generate() {
    // 添加开始时间记录
    const startTime = performance.now();

    const inputText = document.getElementById('output').value.trim();
    if (!inputText) {
        alert('请输入要查询的字符！');
        return;
    }

    const lang = document.querySelector('input[name="lang"]:checked').value.toUpperCase();
    const readingSystem = document.querySelector('input[name="reading"]:checked').value;
    const outputFormat = document.querySelector('input[name="format"]:checked').value;
        
    const lines = inputText.split('\n');
    const outputs = lines
        .map(line => line.trim())
        .filter(line => line)
        .map(line => generateFormattedOutput(line, lang, readingSystem, outputFormat));

    document.getElementById('output-text').value = outputs.join('\n\n');

    // 计算并输出总用时
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    console.log(`处理完成，总用时: ${totalTime.toFixed(2)}ms`);
}

function generateFormattedOutput(chars, lang, readingSystem, outputFormat) {
    if (outputFormat === 'typst') {
        return generateTypstOutput(chars, lang, readingSystem);
    } else if (outputFormat === 'obsidian') {
        return generateObsidianOutput(chars, lang, readingSystem);
    } else {
        return generatePlainTextOutput(chars, lang, readingSystem);
    }
}

function generateTypstOutput(chars, lang, readingSystem) {
    const separator = FORMAT_SEPARATORS.typst.items;
    
    const processedChars = processCombination([...chars]);
    
    // 合并连接的项
    function mergeConnectedItems(items) {
        const result = [];
        let currentGroup = '';
        
        items.forEach((item, index) => {
            if (index === 0) {
                currentGroup = item;
            } else {
                // 如果当前项以连接符开始或前一组以连接符结束
                if (/^[=-]/.test(item) || /[=-]$/.test(currentGroup)) {
                    currentGroup += item;
                } else {
                    result.push(currentGroup);
                    currentGroup = item;
                }
            }
        });
        
        if (currentGroup) {
            result.push(currentGroup);
        }
        
        return result;
    }

    // 处理源字符 - 不添加LFW上标
    const charList = mergeConnectedItems(processedChars).map(char => processTypstBrackets(char));
    
    // 处理header - 添加LFW上标
    const headerWithLFW = [...chars].map(char => getCharWithLFW(char) + getCharWithFourCode(char)).join('');
    
    // 处理源字符（添加LFW上标）- 仅用于header
    const charsWithLFW = processedChars.map(char => {
        if (char.includes('-') || char.includes('=')) {
            // 处理多字符连接情况
            const parts = char.split(/[-=]/);
            const connectors = char.match(/[-=]/g);
            
            return parts.map((part, idx) => {
                const partWithLFW = getCharWithFourCode(part) + getCharWithLFW(part);
                return idx < parts.length - 1 ? 
                    `${partWithLFW}${connectors[idx]}` : partWithLFW;
            }).join('');
        }
        return getCharWithLFW(char);
    });
    
    // 处理读音
    const rawReadings = processedChars.map((char, index) => {
        // 首先检查是否在词典中
        let entry = stmts.getWordData(char);
        if (!!entry) {
            const reading = readingSystem === 'GX' ? entry.GX : entry.GHC;
            // 检查是否需要添加前缀
            if (entry.format && entry.format.prefix) {
                return entry.format.prefix + reading.replace(/[\[\]]/g, '');
            }
            return reading ? reading.replace(/[\[\]]/g, '') : '';
        }
        
        // 如果不在词典中，按原来的方式处理
        if (char.includes('-') || char.includes('=')) {
            const parts = char.split(/[-=]/);
            const connectors = char.match(/[-=]/g);
            
            return parts.map((part, idx) => {
                let reading = '';
                let entry = stmts.getWordData(part);
                // 检查是否是词组
                if (!!entry) {
                    reading = readingSystem === 'GX' ? entry.GX : entry.GHC;
                    reading = reading.replace(/[\[\]]/g, '');
                } else {
                    entry = stmts.getCharData(part);
                    reading = readingSystem === 'GX' ? entry.GX : entry.GHC;
                }
                return idx < parts.length - 1 ? 
                    `${reading || ''}${connectors[idx]}` : (reading || '');
            }).join('');
        }
        entry = stmts.getCharData(char)
        if (!!entry) {
            const reading = readingSystem === 'GX' ? entry.GX : entry.GHC;
            return reading || '';
        } else if (/[\p{P}\s]/u.test(char)) {
            return char;
        }
        return '';
    });
    
    // 合并连接的读音
    const readings = mergeConnectedItems(rawReadings).map(reading => processTypstBrackets(reading));

    // 处理词义解释
    const rawMorphemes = processedChars.map((char, index, array) => {
        // 首先检查是否在词典中
        let entry = stmts.getWordData(char);
        if (!!entry) {
            return processTypstBrackets(entry[`explanation${lang}`] || '');
        }
        
        const prevChar = index > 0 ? array[index - 1] : null;
        const nextChar = index < array.length - 1 ? array[index + 1] : null;
        
        if (char.includes('-') || char.includes('=')) {
            // 处理多个字符连接的情况
            const parts = char.split(/[-=]/);
            const connectors = char.match(/[-=]/g);
            
            const explanations = parts.map((part, idx) => {
                // 检查是否是词组
                entry = stmts.getWordData(part);
                if (!!entry) {
                    return entry[`explanation${lang}`] || '';
                }
                const prevPart = idx > 0 ? parts[idx - 1] : prevChar;
                const nextPart = idx < parts.length - 1 ? parts[idx + 1] : nextChar;
                return getExplanation(part, lang, prevPart, nextPart);
            });
            
            return explanations.map((exp, idx) => 
                idx < explanations.length - 1 ? 
                    `${exp}${connectors[idx]}` : exp
            ).join('');
        }
    
        const explanation = getExplanation(char, lang, prevChar, nextChar);
        
        if (explanation) {
            return explanation;
        } else if (/[\p{P}\s]/u.test(char)) {
            return char;
        }
        return '';
    });

    // 合并连接的词义解释
    const morphemes = mergeConnectedItems(rawMorphemes).map(morpheme => processTypstBrackets(morpheme));

    return `#gloss(\n` +
            `header: ${processTypstBrackets(headerWithLFW)},\n` +
            `source: (${charList.join(separator)}),\n` +
            `transliteration: (${readings.join(separator)}),\n` +
            `morphemes: (${morphemes.join(separator)}),\n` +
            `translation: ""\n)`;
}

function generateObsidianOutput(chars, lang, readingSystem) {
    const separator = FORMAT_SEPARATORS.obsidian.items;
    
    const processedChars = processCombination([...chars]);
    
    // 处理音读部分
    const rawReadings = processedChars.map((char, index) => {
        // 首先检查是否在词典中
        let entry = stmts.getWordData(char);
        if (!!entry) {
            const reading = readingSystem === 'GX' ? entry.GX : entry.GHC;
            // 检查是否需要添加前缀
            if (entry.format && entry.format.prefix) {
                return entry.format.prefix + reading.replace(/[\[\]]/g, '');
            }
            return reading ? reading.replace(/[\[\]]/g, '') : '';
        }
        
        // 如果不在词典中，按原来的方式处理
        if (char.includes('-') || char.includes('=')) {
            const parts = char.split(/[-=]/);
            const connectors = char.match(/[-=]/g);
            
            return parts.map((part, idx) => {
                let reading = '';
                let entry = stmts.getWordData(part);
                // 检查是否是词组
                if (!!entry) {
                    reading = readingSystem === 'GX' ? entry.GX : entry.GHC;
                    reading = reading.replace(/[\[\]]/g, '');
                } else {
                    entry = stmts.getCharData(part);
                    if (!!entry) {
                        reading = readingSystem === 'GX' ? entry.GX : entry.GHC;
                    }
                }
                return idx < parts.length - 1 ? 
                    `${reading || ''}${connectors[idx]}` : (reading || '');
            }).join('');
        }
        
        entry = stmts.getCharData(char);
        if (!!entry) {
            const reading = readingSystem === 'GX' ? entry.GX : entry.GHC;
            return reading || '';
        } else if (/[\p{P}\s]/u.test(char)) {
            return char;
        }
        return '';
    });

    // 处理词义解释部分
    const morphemes = processedChars.map((char, index, array) => {
        // 首先检查是否在词典中
        const entry = stmts.getWordData(char);
        if (!!entry) {
            const explanation = entry[`explanation${lang}`] || '';
            // 检查是否需要添加前缀
            if (entry.format && entry.format.prefix) {
                return entry.format.prefix + explanation;
            }
            return explanation;
        }
        
        const prevChar = index > 0 ? array[index - 1] : null;
        const nextChar = index < array.length - 1 ? array[index + 1] : null;
        
        if (char.includes('-') || char.includes('=')) {
            // 处理多个字符连接的情况
            const parts = char.split(/[-=]/);
            const connectors = char.match(/[-=]/g);
            
            const explanations = parts.map((part, idx) => {
                // 检查是否是词组
                const entry = stmts.getWordData(part);
                if (!!entry) {
                    return entry[`explanation${lang}`] || '';
                }
                const prevPart = idx > 0 ? parts[idx - 1] : prevChar;
                const nextPart = idx < parts.length - 1 ? parts[idx + 1] : nextChar;
                return getExplanation(part, lang, prevPart, nextPart);
            });
            
            return explanations.map((exp, idx) => 
                idx < explanations.length - 1 ? 
                    `${exp}${connectors[idx]}` : exp
            ).join('');
        }
    
        const explanation = getExplanation(char, lang, prevChar, nextChar);
        
        if (explanation) {
            return explanation;
        } else if (/[\p{P}\s]/u.test(char)) {
            return char;
        }
        return '';
    });

    // 添加LFW上标到字符
    const charsWithLFW = [...chars].map(char => getCharWithLFW(char) + getCharWithFourCode(char)).join('');

    // 处理标点符号前的空格
    function joinWithSmartSpacing(items) {
        return items.reduce((result, current, index) => {
            if (index === 0) return current;
            
            // 如果当前项以连接符开始，不添加空格
            if (/^[=-]/.test(current)) {
                return result + current;
            }
            
            // 如果前一项以连接符结束，不添加空格
            if (/[=-]$/.test(result)) {
                return result + current;
            }
            
            // 如果当前项是标点符号，不添加空格
            if (/^[\p{P}]/u.test(current)) {
                return result + current;
            }
            
            // 其他情况添加空格
            return result + separator + current;
        }, '');
    }

    // 过滤掉空字符串并使用新的连接方法
    const readingsText = joinWithSmartSpacing(rawReadings.filter(r => r));
    const morphemesText = joinWithSmartSpacing(morphemes.filter(m => m));

    // 返回Obsidian格式的输出
    return '```gloss\n' +
           '\\set exstyle big\n' +
           `\\ex ${charsWithLFW}\n` +
           `\\gla ${readingsText}\n` +
           `\\glb ${morphemesText}\n` +
           '\\ft .\n' +
           '```';
}

function generatePlainTextOutput(chars, lang, readingSystem) {
    const processedChars = processCombination([...chars]);
    
    // 获取字符、读音和词义
    const charGroups = [];
    const readingGroups = [];
    const morphemeGroups = [];
    
    let currentCharGroup = '';
    let currentReadingGroup = '';
    let currentMorphemeGroup = '';
    
    processedChars.forEach((char, index, array) => {
        // 处理字符（添加LFW上标）
        let charWithLFW = char;
        if (!char.includes('-') && !char.includes('=')) {
            charWithLFW = getCharWithLFW(char) + getCharWithFourCode(char);
        } else {
            // 处理多字符连接情况
            const parts = char.split(/[-=]/);
            const connectors = char.match(/[-=]/g);
            
            charWithLFW = parts.map((part, idx) => {
                const partWithLFW = getCharWithLFW(part) + getCharWithFourCode(part);
                return idx < parts.length - 1 ? 
                    `${partWithLFW}${connectors[idx]}` : partWithLFW;
            }).join('');
        }
        
        if (index > 0 && !charWithLFW.startsWith('-') && !charWithLFW.startsWith('=') && 
            !currentCharGroup.endsWith('-') && !currentCharGroup.endsWith('=')) {
            charGroups.push(currentCharGroup);
            readingGroups.push(currentReadingGroup);
            morphemeGroups.push(currentMorphemeGroup);
            currentCharGroup = '';
            currentReadingGroup = '';
            currentMorphemeGroup = '';
        }
        currentCharGroup += charWithLFW;

        
        // 处理读音
        let reading = '';
        let entry = stmts.getWordData(char);
        if (!!entry) {
            reading = readingSystem === 'GX' ? entry.GX : entry.GHC;
            reading = reading ? reading.replace(/[\[\]]/g, '') : '';
        } else if (char.includes('-') || char.includes('=')) {
            reading = getConnectedReading(char, readingSystem);
        } else {
            entry = stmts.getCharData(char);
            if (!!entry) {
                reading = readingSystem === 'GX' ? entry.GX : entry.GHC;
            }
        }
        if (!reading && /[\p{P}\s]/u.test(char)) {
            reading = char;
        }
        currentReadingGroup += reading;
        
        // 处理词义
        let morpheme = '';
        if (!!entry && !char.includes('-') && !char.includes('=')) {
            morpheme = entry[`explanation${lang}`] || '';
        } else {
            const prevChar = index > 0 ? array[index - 1] : null;
            const nextChar = index < array.length - 1 ? array[index + 1] : null;
            
            if (char.includes('-') || char.includes('=')) {
                const parts = char.split(/[-=]/);
                const connectors = char.match(/[-=]/g);
                
                const explanations = parts.map((part, idx) => {
                    const partEntry = stmts.getWordData(part);
                    if (!!partEntry) {
                        return partEntry[`explanation${lang}`] || '';
                    }
                    const prevPart = idx > 0 ? parts[idx - 1] : prevChar;
                    const nextPart = idx < parts.length - 1 ? parts[idx + 1] : nextChar;
                    return getExplanation(part, lang, prevPart, nextPart);
                });
                
                morpheme = explanations.map((exp, idx) => 
                    idx < explanations.length - 1 ? 
                        `${exp}${connectors[idx]}` : exp
                ).join('');
            } else if (/[\p{P}\s]/u.test(char)) {
                morpheme = char;
            } else {
                morpheme = getExplanation(char, lang, prevChar, nextChar);
            }
        }
        currentMorphemeGroup += morpheme;
    });
    
    // 添加最后一组
    if (currentCharGroup) {
        charGroups.push(currentCharGroup);
        readingGroups.push(currentReadingGroup);
        morphemeGroups.push(currentMorphemeGroup);
    }
    
    // 计算每列的最大宽度
    const columnWidths = charGroups.map((char, index) => {
        const lengths = [
            getStringWidth(char),
            getStringWidth(readingGroups[index]),
            getStringWidth(morphemeGroups[index])
        ];
        return Math.max(...lengths);
    });
    
    // 生成对齐的输出
    const lines = [
        charGroups.map((char, i) => padString(char, columnWidths[i])).join('  '),
        readingGroups.map((reading, i) => padString(reading, columnWidths[i])).join('  '),
        morphemeGroups.map((morpheme, i) => padString(morpheme, columnWidths[i])).join('  ')
    ];
    
    return lines.join('\n');
    }

// 辅助函数：计算字符串显示宽度（考虑CJK字符）
function getStringWidth(str) {
    return [...str].reduce((width, char) => {
        // CJK字符通常是全角宽度（占用2个半角字符的空间）
        if (/[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\u{2ceb0}-\u{2ebef}]/u.test(char)) {
            return width + 2;
        }
        return width + 1;
    }, 0);
}

// 辅助函数：使用空格填充字符串至指定宽度
function padString(str, width) {
    const currentWidth = getStringWidth(str);
    return str + ' '.repeat(Math.max(0, width - currentWidth));
}

// 辅助函数：获取连接字符的读音
function getConnectedReading(char, readingSystem) {
    const parts = char.split(/[-=]/);
    const connectors = char.match(/[-=]/g);
    
    return parts.map((part, idx) => {
        let reading = '';
        let entry = stmts.getWordData(part)
        if (!!entry) {
            reading = readingSystem === 'GX' ? entry.GX : entry.GHC;
            reading = reading.replace(/[\[\]]/g, '');
        } else {
            entry = stmts.getCharData(part)
            if (!!entry) {
                reading = readingSystem === 'GX' ? entry.GX : entry.GHC;
            }
        }
        return idx < parts.length - 1 ? 
            `${reading || ''}${connectors[idx]}` : (reading || '');
    }).join('');
}

function clearAll() {
    document.getElementById('output').value = '';
    document.getElementById('output-text').value = '';
}

function copyOutput() {
    const output = document.getElementById('output-text');
    if (!output.value) {
        alert('没有可复制的内容');
        return;
}

    output.select();
    document.execCommand('copy');
    
    const copyBtn = document.getElementById('copy-btn');
    copyBtn.textContent = '已复制';
    setTimeout(() => {
        copyBtn.textContent = '复制';
    }, 1000);
}
function handleGenerate() {
    const input = document.getElementById('output');
    if (!input.value.trim() && input.placeholder) {
        input.value = input.placeholder;
    }
    generate();
}
const strokeData = [
    { code: 'A', img: 'img/A.png' },
    { code: 'B', img: 'img/B.png' },
    { code: 'C', img: 'img/C.png' },
    { code: 'D', img: 'img/D.png' },
    { code: 'E', img: 'img/E.png' },
    { code: 'F', img: 'img/F.png' },
    { code: 'G', img: 'img/G.png' },
    { code: 'H', img: 'img/H.png' },
    { code: 'I', img: 'img/I.png' },
    { code: 'J', img: 'img/J.png' },
    { code: 'K', img: 'img/K.png' },
    { code: 'L', img: 'img/L.png' },
    { code: 'M', img: 'img/M.png' },
    { code: 'N', img: 'img/N.png' },
    { code: 'O', img: 'img/O.png' },
    { code: 'P', img: 'img/P.png' },
    { code: 'Q', img: 'img/Q.png' },
    { code: '.', img: 'img/dot.png' },
    { code: '*', img: 'img/star.png' }
];

function createStrokeButtons() {
const container = document.getElementById('stroke-buttons');
// 清空容器,防止重复添加
container.innerHTML = '';

strokeData.forEach(stroke => {
    const button = document.createElement('button');
    button.className = 'stroke-button';
    button.onclick = () => insertStroke(stroke.code);
    
    // 使用图片显示笔画
    const img = document.createElement('img');
    img.src = stroke.img;
    img.alt = stroke.code;
    img.style.height = '1.2em';
    img.style.verticalAlign = 'middle';
    button.appendChild(img);
    
    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip';
    tooltip.textContent = stroke.code;
    button.appendChild(tooltip);
    container.appendChild(button);
});
}

// 监听笔画输入框的变化
document.getElementById('stroke-entry-field').addEventListener('input', (e) => {
    updateSearchResults(e.target.value);
});

// 切换复选框状态的函数
function toggleCheckbox(id) {
    const checkbox = document.getElementById(id);
    checkbox.checked = !checkbox.checked;
    updateSearchResults(document.getElementById('stroke-entry-field').value);
}

// 清除笔画输入
function clearStrokeEntryField() {
    document.getElementById('stroke-entry-field').value = '';
    document.getElementById('result-list').innerHTML = '';
}

// 添加清除所有功能
function clearAll() {
    document.getElementById('output').value = '';
    document.getElementById('output-text').value = '';
    document.getElementById('stroke-entry-field').value = '';
    document.getElementById('result-list').innerHTML = '';
    // 重置复选框
    document.getElementById('stroke-begins-with').checked = false;
    document.getElementById('stroke-ends-with').checked = false;
}

// 添加 updateSearchResults 函数定义
function updateSearchResults(value) {
    const resultList = document.getElementById('result-list');
    resultList.innerHTML = ''; // 清空现有结果
    
    if (!value) return; // 如果没有输入值，直接返回
    
    // 更新笔画输入（这会触发 txglook.js 中的 updateStrokeEntry 函数）
    updateStrokeEntry();
    
    // 获取结果列表（resultList 应该是由 txglook.js 中的 updateResultsList 函数设置的全局变量）
    if (window.resultList && window.resultList.length > 0) {
        window.resultList.forEach(char => {
            const li = document.createElement('li');
            li.className = 'results-item';
            li.textContent = char;
                            
            // 添加点击事件
            li.setAttribute('onclick', `insertAtCursor('output', '${char}')`);
            
            resultList.appendChild(li);
        });
    }
}

// 修改页面加载初始化代码
document.addEventListener('DOMContentLoaded', () => {
    createStrokeButtons();
    
    // 初始化笔画输入字段的事件监听器
    const strokeEntryField = document.getElementById('stroke-entry-field');
    if (strokeEntryField) {
        strokeEntryField.addEventListener('input', (e) => {
            updateSearchResults(e.target.value);
        });
    }
});

// 多语言文本数据
const i18nData = {
    zh: {
        "title": "西夏文<br>自动标注工具 α",
        "input-label": "输入字符：",
        "generate": "生成",
        "clear": "清除",
        "language-choice": "语言选择：",
        "chinese": "中文",
        "english": "English",
        "reading-system": "读音系统：",
        "gongxun": "龚勋",
        "gonghuangcheng": "龚煌城",
        "output-format": "输出格式：",
        "format-output": "格式输出：",
        "copy-clipboard": "复制到剪贴板",
        "plain-text": "纯文本",
         "show-lfw": "显示编号：",
        "lfw-label": "LFW",
        "fourcorner-label": "四角号码",
        "stroke-entry-placeholder": "四角号码, LFW序号(四位), 部件编码(A-Q)"
    },
    en: {
        "title": "Tangut Script<br>Annotation Tool α",
        "input-label": "Input Characters:",
        "generate": "Generate",
        "clear": "Clear",
        "language-choice": "Language:",
        "chinese": "Chinese",
        "english": "English",
        "reading-system": "Reading System:",
        "gongxun": "GX",
        "gonghuangcheng": "GHC",
        "output-format": "Output Format:",
        "format-output": "Formatted Output:",
        "copy-clipboard": "Copy to Clipboard",
        "plain-text": "Plain Text",
        "show-lfw": "Show Numbers:",
        "lfw-label": "LFW",
        "fourcorner-label": "Four Corner",
        "stroke-entry-placeholder": "Four Corner, LFW(0000-9999), Radical(A-Q)"
    },
    ja: {
        "title": "西夏文字<br>注釈ツール α",
        "input-label": "入力：",
        "generate": "生成",
        "clear": "クリア",
        "language-choice": "言語選択：",
        "chinese": "中国語",
        "english": "英語",
        "reading-system": "読み方：",
        "gongxun": "龔勋",
        "gonghuangcheng": "龔煌城",
        "output-format": "出力形式：",
        "format-output": "出力：",
        "copy-clipboard": "コピー",
        "plain-text": "テキスト形式",
        "show-lfw": "番号表示：",
        "lfw-label": "LFW",
        "fourcorner-label": "四角号碼",
        "stroke-entry-placeholder": "四角号碼, LFW(0000-9999), 部首番号(A-Q)"
    },
    ru: {
        "title": "Тангутское письмо<br>Инструмент для глоссирования α",
        "input-label": "Ввод знаков тангутского письма:",
        "generate": "Создать глоссы",
        "clear": "Очистить",
        "language-choice": "Выбор языка:",
        "chinese": "Китайский",
        "english": "Английский",
        "reading-system": "Система реконструкции:",
        "gongxun": "Гун Сюня",
        "gonghuangcheng": "Гун Хуанчэна",
        "output-format": "Формат вывода:",
        "format-output": "Форматированный вывод:",
        "copy-clipboard": "Копировать в буфер обмена",
        "plain-text": "Простой текст",
        "show-lfw": "Показать номера:",
        "lfw-label": "LFW",
        "fourcorner-label": "Четырём Углам",
        "stroke-entry-placeholder": "Четырём Углам, LFW(0000-9999), Корень(A-Q)"
    }
};

// 更新页面文本的函数
function updatePageText(lang) {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (i18nData[lang][key]) {
            if (element.tagName === 'BUTTON' || element.tagName === 'LABEL' || element.tagName === 'SPAN' || element.tagName === 'INPUT') {
                if (element.getAttribute('placeholder')) {
                    element.placeholder = i18nData[lang][key];
                } else {
                    element.textContent = i18nData[lang][key];
                }
            } else {
                element.innerHTML = i18nData[lang][key];
            }
        }
    });
    // 更新文档语言
    document.documentElement.lang = lang;
}

// 语言切换函数
function changeLanguage() {
const lang = document.getElementById('languageSelect').value;
const langMap = {
    'zh': 'zh-CN',
    'en': 'en-US',
    'ja': 'ja-JP',
    'ru': 'ru-RU'
};
document.documentElement.lang = langMap[lang];
updatePageText(lang);
}

// 页面加载时初始化语言
document.addEventListener('DOMContentLoaded', () => {
// 只调用一次 createStrokeButtons
createStrokeButtons();

// 初始化笔画输入字段的事件监听器
const strokeEntryField = document.getElementById('stroke-entry-field');
if (strokeEntryField) {
    strokeEntryField.addEventListener('input', (e) => {
        updateSearchResults(e.target.value);
    });
}

// 初始化语言
const userLang = navigator.language.split('-')[0];
const supportedLangs = ['zh', 'en', 'ja', 'ru'];
const defaultLang = supportedLangs.includes(userLang) ? userLang : 'zh';

document.getElementById('languageSelect').value = defaultLang;
updatePageText(defaultLang);
});

// 将数字转换为上标形式的辅助函数
function toSuperscript(num) {
    if (!num) return '';
    // 数字到上标字符的映射
    const superscripts = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
    return num.toString().split('').map(digit => {
        return superscripts[parseInt(digit)] || digit;
    }).join('');
}

// 获取带LFW上标的字符
function getCharWithLFW(char) {
    // 检查是否启用LFW编号显示
    const showLFW = document.getElementById('show-lfw').checked;
    const entry = stmts.getCharData(char)

    if (showLFW && !!entry && entry.LFW) {
        return char + toSuperscript(entry.LFW);
    }
    return "";
}

// get the four-corner with superscript
function getCharWithFourCode(char) {
    // check if displays four-corner code
    const showLFW = document.getElementById('show-lfw').checked;
    const showFourCorner = document.getElementById('show-fourcorner').checked;
    const entry = stmts.getCharData(char)

    if (showFourCorner && !!entry && entry.fourCode) {
        const delimiter = showLFW ? "´" : char;
        return delimiter + toSuperscript(entry.fourCode);
    }
    return showLFW ? "" : char;

}

// 修改现有函数中处理字符显示的部分

// 在processCombination函数之前插入以下函数
// 处理多字符连接情况下的LFW编号
function processConnectedCharsWithLFW(char) {
    if (char.includes('-') || char.includes('=')) {
        const parts = char.split(/[-=]/);
        const connectors = char.match(/[-=]/g);
        
        return parts.map((part, idx) => {
            const partWithLFW = getCharWithLFW(part);
            return idx < parts.length - 1 ? 
                `${partWithLFW}${connectors[idx]}` : partWithLFW;
        }).join('');
    }
    return getCharWithLFW(char);
}

// 暗黑模式管理
function toggleDarkMode() {
    const currentTheme = localStorage.getItem('theme-preference') || 
                         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme-preference', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // 更新按钮文本（如果有暗黑模式按钮的话）
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.textContent = newTheme === 'dark' ? '☀️ 亮色模式' : '🌙 暗黑模式';
    }
}

// 初始化暗黑模式按钮
document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = localStorage.getItem('theme-preference') || 
                         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.textContent = currentTheme === 'dark' ? '☀️ 亮色模式' : '🌙 暗黑模式';
        themeBtn.addEventListener('click', toggleDarkMode);
    }
});
