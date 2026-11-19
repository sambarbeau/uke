// Word ranges refer to plainLyrics.trim().split(/\s+/u) from the pinned LRCLIB record.
// Sections parallel song.parts. Each sung line is [firstWord, endWordExclusive, anchors].
// Join the word slice with one space. Anchors are UTF-16 offsets into that line, in
// order of its chart chord events (one per chord token, including repeated bars).
// null marks a continued chord with no printed attack. The end offset is a trailing chord.
export const lyricTiming = {
  'lava': {
    recordId: 29961453, wordCount: 381,
    sections: [
      [ // Verse 1
        [0, 9, [0, null, 22, null]],
        [9, 18, [0, null, 24, 38, 41]],
        [18, 29, [0, null, 26, null]],
        [29, 36, [0, null, 17, 33, 36]],
        [36, 52, [0, null, 28, null, 58, null]],
        [52, 56, [0, 14, 19]],
      ],
      [ // Chorus 1
        [56, 65, [0, null, 17, null]],
        [65, 75, [5, null, 29, null]],
        [75, 85, [0, null, 32, null]],
        [85, 91, [5, 13, 24, 28, 28, 28]],
      ],
      [ // Verse 2
        [91, 101, [0, null, 27, null]],
        [101, 109, [2, null, 20, 36, 39]],
        [109, 120, [0, null, 28, null]],
        [120, 127, [2, null, 20, 37, 41]],
      ],
      [ // Verse 3
        [127, 137, [0, null, 32, null]],
        [137, 146, [2, null, 25, 44, 47]],
        [146, 157, [0, null, 24, null]],
        [157, 168, [6, null, 28, 41, 45]],
      ],
      [ // Chorus 2
        [168, 177, [0, null, 17, null]],
        [177, 187, [5, null, 29, null]],
        [187, 197, [0, null, 32, null]],
        [197, 203, [5, 13, 24, 28, 28, 28]],
      ],
      [ // Verse 4
        [203, 212, [0, null, 26, null]],
        [212, 221, [0, null, 24, 42, 45]],
        [221, 235, [3, null, 38, null]],
        [235, 244, [4, null, 22, 35, 39]],
      ],
      [ // Verse 5
        [244, 256, [3, null, 33, null]],
        [256, 265, [3, null, 27, 41, 44]],
      ],
      [ // Chorus 3
        [265, 274, [0, null, 17, null]],
        [274, 284, [5, null, 29, null]],
        [284, 294, [0, null, 32, null]],
        [294, 300, [5, 13, 24, 28, 28, 28]],
      ],
      [ // Verse 6
        [300, 311, [0, null, 25, null]],
        [311, 319, [0, null, 23, 37, 41]],
        [319, 331, [0, null, 36, null]],
        [331, 341, [4, null, 24, 42, 46]],
      ],
      [ // Last chorus
        [341, 350, [0, null, 17, null]],
        [350, 362, [5, null, 33, null]],
        [362, 372, [0, null, 29, null]],
      ],
      [ // Ending
        [372, 375, [0, 2, 7, null]],
        [375, 378, [0, 2, 7, null]],
        [378, 381, [0, 2, 5, 7]],
      ],
    ],
  },
  'cant-help-falling-in-love': {
    recordId: 7114330, wordCount: 112,
    sections: [
      [], // Intro
      [ // Verse 1
        [0, 7, [0, 5, 9, null, 18, 24, 29, 31]],
        [7, 16, [4, 6, 12, 17, 28, 33, 38, 41]],
      ],
      [ // Verse 2
        [16, 24, [0, 6, 8, null, 23, 26, 28, 31]],
        [24, 33, [3, 5, 11, 16, 27, 32, 37, 41]],
      ],
      [ // Bridge 1
        [33, 41, [0, 13, 19, 33]],
        [41, 45, [0, 15]],
        [45, 51, [5, 16, 25, 26, 26, 27]],
      ],
      [ // Verse 3
        [51, 59, [0, 5, 8, null, 21, 27, 32, 35]],
        [59, 68, [4, 6, 12, 17, 28, 33, 38, 41]],
      ],
      [ // Bridge 2
        [68, 76, [0, 13, 19, 33]],
        [76, 80, [0, 15]],
        [80, 86, [5, 16, 25, 26, 26, 27]],
      ],
      [ // Final verse
        [86, 94, [0, 5, 8, null, 21, 27, 32, 35]],
        [94, 103, [4, 6, 12, 17, 28, 33, 38, 41]],
      ],
      [ // Ending
        [103, 112, [4, 6, 12, 17, 28, 30, 33, 35, 38, 40, 40, 41]],
      ],
    ],
  },
  'yesterday': {
    recordId: 7950727, wordCount: 133,
    sections: [
      [], // Intro
      [ // Verse 1
        [0, 1, [0]],
        [1, 8, [0, 7, 26]],
        [8, 17, [0, 7, 31]],
        [17, 22, [4, 8, 17, 23]],
      ],
      [ // Verse 2
        [22, 23, [0]],
        [23, 32, [0, 8, 23]],
        [32, 38, [0, 10, 25]],
        [38, 42, [4, 10, 19, 25]],
      ],
      [ // Bridge 1
        [42, 47, [0, 8, 12, 15]],
        [47, 53, [8, 18, 27]],
        [53, 57, [0, 7, 11, 17]],
        [57, 62, [6, 15, 21]],
      ],
      [ // Verse 3
        [62, 63, [0]],
        [63, 71, [0, 9, 22]],
        [71, 79, [0, 6, 22]],
        [79, 84, [4, 8, 17, 23]],
      ],
      [ // Bridge 2
        [84, 89, [0, 8, 12, 15]],
        [89, 95, [8, 18, 27]],
        [95, 99, [0, 7, 11, 17]],
        [99, 104, [6, 15, 21]],
      ],
      [ // Verse 4
        [104, 105, [0]],
        [105, 113, [0, 9, 22]],
        [113, 121, [0, 6, 22]],
        [121, 126, [4, 8, 17, 23]],
      ],
      [ // Hummed ending
        [126, 133, [0, 8, 16, 24]],
      ],
    ],
  },
};
