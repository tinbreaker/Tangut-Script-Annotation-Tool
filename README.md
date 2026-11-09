# 西夏文自动标注工具 α 
[中文](#西夏文自动标注工具-α) | [English](#tangut-annotation-tool-α)

这是一个用于西夏文标注的在线工具,可以帮助研究者和学习者快速生成西夏文的语言学标注。

## 功能特点

- 支持西夏文字符输入和查询
- 提供笔画，LFW序号，四角号码检索功能，
此外还提供Unicode编码检索功能
- 自动生成语言学标注
- 支持多种输出格式(Typst和Obsidian)
- 提供中英双语解释
- 支持两种读音系统(龚勋和龚煌城)

## 使用说明

### 基本操作

1. 在输入框中输入西夏文字符
2. 选择所需的配置:
   - 语言选择: 中文/English
   - 读音系统: 龚勋/龚煌城
   - 输出格式: Typst/Obsidian
3. 点击"生成"按钮获取标注结果
4. 使用"复制到剪贴板"按钮复制结果

### 笔画检索

工具提供了笔画检索功能,支持以下操作:

- 在[笔画]Tab页使用笔画按钮输入检索序列
- 支持起始(^)和结束($)位置限定
- 支持通配符(*)
- 实时显示检索结果

可用的笔画代码:
- A: 橫 <img src="img/A.png" alt="A" style="height:1em; vertical-align:baseline" />
- B: 竖 <img src="img/B.png" alt="B" style="height:1em; vertical-align:baseline" />
- C: 撇 <img src="img/C.png" alt="C" style="height:1em; vertical-align:baseline" />
- D: 点 <img src="img/D.png" alt="D" style="height:1em; vertical-align:baseline" />
- E: 横折 <img src="img/E.png" alt="E" style="height:1em; vertical-align:baseline" />
- F: 横折弯钩 <img src="img/F.png" alt="F" style="height:1em; vertical-align:baseline" />
- G: 横撇 <img src="img/G.png" alt="G" style="height:1em; vertical-align:baseline" />
- H: 横折折撇 <img src="img/H.png" alt="H" style="height:1em; vertical-align:baseline" />
- I: 横折折折撇 <img src="img/I.png" alt="I" style="height:1em; vertical-align:baseline" />
- J: 横折折折勾 <img src="img/J.png" alt="J" style="height:1em; vertical-align:baseline" />
- K: 横折横 <img src="img/K.png" alt="K" style="height:1em; vertical-align:baseline" />
- L: 撇折 <img src="img/L.png" alt="L" style="height:1em; vertical-align:baseline" />
- M: 竖弯钩 <img src="img/M.png" alt="M" style="height:1em; vertical-align:baseline" />
- N: 横撇点提 <img src="img/N.png" alt="N" style="height:1em; vertical-align:baseline" />
- O: 撇点提 <img src="img/O.png" alt="O" style="height:1em; vertical-align:baseline" />
- P: 撇捺 <img src="img/P.png" alt="P" style="height:1em; vertical-align:baseline" />
- Q: 捺 <img src="img/Q.png" alt="Q" style="height:1em; vertical-align:baseline" />

### LFW序号检索

工具提供了LFW序号(即夏汉字典的编码顺序)的检索功能,支持以下操作:

- 在[LFW序号]Tab页输入3位以上LFW序号（0-9的数字）
- 不支持任何通配符
- 实时显示检索结果

### 四角号码检索

工具提供了四角号码(类似于汉字的四角号码)的检索功能,支持以下操作:

- 在[四角号码]Tab页输入4-6位四角号码（0-9的数字）
- 支持2-3位的通配符(?)
- 实时显示检索结果

### Unicode编码检索

工具提供了Unicode编码的检索功能,支持以下操作:

- 在[Unicode]Tab页输入4位以上的Unicode码位（0-9, A-F的字符）
- 暂不支持任何通配符
- 实时显示检索结果

## 技术特性

- 支持复杂的字符组合规则
- 智能词组识别
- 自动处理连字符和等号
- 实时检索结果更新
- 响应式界面设计

## 系统要求

- 现代网络浏览器(支持Unicode)
- Obsidian 需安装[Obsidian Interlinear Glosses](https://github.com/Mijyuoon/obsidian-ling-gloss),并参考使用文档
- Typst 需引用[leipzig-glossing](https://typst.app/universe/package/leipzig-glossing/),并参考使用文档

## 致谢

- 输入法基于 [TXGlook](https://github.com/adlpr/TXGlook) 开发。
- 语法标注基于：[Grammaire du tangoute. Phonologie et morphologie / Mathieu Beaudouin](https://theses.hal.science/tel-04711865)。
- 龚勋拟音：[GX202409 transcription of Tangut](https://homepage.univie.ac.at/xun.gong/tangut/phonology-202409.html)。
- 龚煌城拟音：[Module:txg/data/LFW2008](https://en.wiktionary.org/wiki/Module:txg/data/LFW2008)
- 词表来自：[Module:txg/data/wordlist](https://en.wiktionary.org/wiki/Module:txg/data/wordlist)
- 制作过程中使用了[古今文字集成](ccamc.org)部分数据，特此感谢。

## 版权信息

© 𗼇𘝞𗫸𗯿𘍞

## 注意事项

- 工具目前处于 α 测试阶段
- 字典/词典数据持续更新中
- 某些复杂组合可能需要手动调整

# Tangut Annotation Tool α 
[中文](#西夏文自动标注工具-α) | [English](#tangut-annotation-tool-α)

This is an online tool for annotating Tangut text that helps researchers and learners quickly generate linguistic annotations for Tangut characters.

## Features

- Support for Tangut character input and lookup
- Provides stroke-based, LFW code, and Four-Corner code 
search, as well as Unicode search.
- Automatic linguistic annotation generation
- Multiple output formats (Typst and Obsidian)
- Bilingual explanations (Chinese/English)
- Support for two phonological systems (Gong Xun and Gong Hwang-cherng)

## Usage Instructions

### Basic Operations

1. Enter Tangut characters in the input box
2. Select desired configuration:
   - Language: Chinese/English 
   - Phonological system: Gong Xun/Gong Hwang-cherng
   - Output format: Typst/Obsidian
3. Click "Generate" button to get annotations
4. Use "Copy to Clipboard" button to copy results

### Stroke Search

The tool provides stroke-based search with the following features:

- Use stroke buttons to input search sequences in the \[Strokes\] tab
- Support for start (^) and end ($) position markers
- Wildcard (\*) support
- Real-time search results

Available stroke codes:
- A: Horizontal <img src="img/A.png" alt="A" style="height:1em; vertical-align:baseline" />
- B: Vertical <img src="img/B.png" alt="B" style="height:1em; vertical-align:baseline" />
- C: Falling <img src="img/C.png" alt="C" style="height:1em; vertical-align:baseline" />
- D: Dot <img src="img/D.png" alt="D" style="height:1em; vertical-align:baseline" />
- E: Horizontal-fold <img src="img/E.png" alt="E" style="height:1em; vertical-align:baseline" />
- F: Horizontal-fold-curved-hook <img src="img/F.png" alt="F" style="height:1em; vertical-align:baseline" />
- G: Horizontal-falling <img src="img/G.png" alt="G" style="height:1em; vertical-align:baseline" />
- H: Horizontal-fold-fold-falling <img src="img/H.png" alt="H" style="height:1em; vertical-align:baseline" />
- I: Horizontal-fold-fold-fold-falling <img src="img/I.png" alt="I" style="height:1em; vertical-align:baseline" />
- J: Horizontal-fold-fold-fold-hook <img src="img/J.png" alt="J" style="height:1em; vertical-align:baseline" />
- K: Horizontal-fold-horizontal <img src="img/K.png" alt="K" style="height:1em; vertical-align:baseline" />
- L: Falling-fold <img src="img/L.png" alt="L" style="height:1em; vertical-align:baseline" />
- M: Vertical-curved-hook <img src="img/M.png" alt="M" style="height:1em; vertical-align:baseline" />
- N: Horizontal-falling-dot-rising <img src="img/N.png" alt="N" style="height:1em; vertical-align:baseline" />
- O: Falling-dot-rising <img src="img/O.png" alt="O" style="height:1em; vertical-align:baseline" />
- P: Falling-rising <img src="img/P.png" alt="P" style="height:1em; vertical-align:baseline" />
- Q: Rising <img src="img/Q.png" alt="Q" style="height:1em; vertical-align:baseline" />

### LFW Code Search

The tool provides search by LFW code (the numbering sequence used in the _Tangraphic Sea_ dictionary) with the following features:

- Enter a 3+ digit LFW code (digits 0-9) in the \[LFW Code\] tab
- Wildcards are not currently supported
- Real-time search results

### Four-Corner Code Search

The tool provides search by Four-Corner codes (similar to the Four-Corner Method used for Chinese characters) with the following features:

- Enter a 4-6 digits Four-Corner code (digits 0-9) in the \[Four-Corner Code\] tab
- Supports wildcards (?) consisting of 2-3 digits
- Real-time search results

### Unicode Search

The tool provides search by Unicode code point with the following features:

- Enter a Unicode code point of at least 4 hexadecimal digits (0-9, A-F) in the \[Unicode\] tab
- Wildcards are not currently supported
- Real-time search results

## Technical Features

- Support for complex character combinations
- Intelligent phrase recognition
- Automatic handling of hyphens and equals signs
- Real-time search result updates
- Responsive interface design

## System Requirements

- Modern web browser (with Unicode support)
- For Obsidian: Install [Obsidian Interlinear Glosses](https://github.com/Mijyuoon/obsidian-ling-gloss) and refer to documentation
- For Typst: Import [leipzig-glossing](https://typst.app/universe/package/leipzig-glossing/) and refer to documentation

## Acknowledgements

- Input method based on [TXGlook](https://github.com/adlpr/TXGlook).
-Grammar annotations based on: [Grammaire du tangoute. Phonologie et morphologie / Mathieu Beaudouin](https://theses.hal.science/tel-04711865).
- Gong Xun transcription: [GX202409 transcription of Tangut](https://homepage.univie.ac.at/xun.gong/tangut/phonology-202409.html).
- Gong Hwang-cherng transcription: [Module:txg/data/LFW2008](https://en.wiktionary.org/wiki/Module:txg/data/LFW2008)
- Word list from: [Module:txg/data/wordlist](https://en.wiktionary.org/wiki/Module:txg/data/wordlist)
- Some data from [CCAMC](ccamc.org) was used in development.

## Copyright

© 𗼇𘝞𗫸𗯿𘍞

## Notes

- Tool is currently in α testing phase
- Dictionary/lexicon data is continuously updated
- Some complex combinations may require manual adjustment
