# Ukulele

A browser-local songbook for standard high-G ukulele (G4 C4 E4 A4). The public project path is `https://sambarbeau.com/uke/`. Its independent Cloudflare Pages project serves the contents of `public/` from this repository’s main branch. The personal site's Worker proxies the public path, and its preview script mounts the same directory.

Run the sibling site's `node scripts/preview.mjs` for an integrated preview, or run `python3 -m http.server 8001 --directory public` here. Run `node --test tests/*.test.mjs` to check the arrangements and pitch detector.

## Adding a song

Add an entry to `public/songs.js` with a stable link ID, title, credit, major key, time signature, quarter-note BPM and measures. For a picked melody, enter the notes and any sung syllables. Each measure contains a space-separated note row and an optional syllable row. The same notes drive the score, tab, fingering diagram, playback and highlight.

```js
['C4 D4 E4:2', 'Sing to- day.']
```

Bare notes last one quarter-note beat. Use `:0.5`, `:1.5`, `:2`, `:3` or `:4` for other supported durations. Spell accidentals in the note (for example `Bb4`). Every full bar must fill its meter. Set `pickup` to the opening length in quarter beats for an anacrusis, with its complement in the final bar. A leading tilde on a repeated pitch (e.g. `~A4:2`) ties it to the previous note on that string. Provide one lyric token per note when adding words. Use `_` for a continued syllable or a note without words. Optional named sections index the measures from zero, including the pickup. The default fingering uses the smallest playable fret, including the open high G. Override a particular fingering with a string number, for example `G4@2:2` for a half note on fret 3 of the E string. String 1 is A and string 4 is G. Check the melody, lyric alignment and positions on a phone when adding arrangements. Use original, public-domain or appropriately licensed material.

## Design and sources

The picked score is a responsive four-line ukulele tab. Each fret number and Spanish syllable is drawn from the same event used for audio. Parenthesized frets sustain a tied note.

[Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques) schedules synthesized plucks against the audio clock. The tuner analyzes live waveform samples locally once the player enables the microphone. It releases the input on stop, tab hide, navigation or reference-tone playback. Microphone capture requires [a secure context and permission](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia). The [Lanikai care guide](https://lanikaiukuleles.com/wp-content/uploads/2023/03/Lanikai_CareGuide_2023.pdf) documents the high-G tuning.

Hosting uses static Pages assets with no build command, database or paid music API. Requests through the personal site's Worker count toward its existing [Workers quota](https://developers.cloudflare.com/pages/functions/pricing/).


## Requested songs

“Cielito Lindo” follows the melody and Spanish text on pp. 298–299 of Carl Sandburg’s 1927 *The American Songbag*. The one-beat pickup and two-beat ending complete 32 bars of 3/4. The verse and chorus can be practiced separately. [Scanned edition](https://upload.wikimedia.org/wikipedia/commons/c/cb/Carl_Sandburg_-_The_American_Songbag.pdf#page=326) · [Sam’s Rock Class 101 tutorial](https://www.youtube.com/watch?v=cDc6dDq0gdM)

Strummed songs use native chord-and-lyric rows, with each chord positioned over its word or syllable. The accompaniment, active chord, diagram, and strum arrows share the same audio clock. The section selector and repeat control apply to the chart and player together.

The browser retrieves words directly from the [LRCLIB API](https://lrclib.net/docs) by a verified recording ID. The per-song word ranges and chord offsets in `public/lyric-timing.js` match each recording to its printed arrangement. Previously loaded lyrics are stored on this device. If the service is unavailable on a first visit, the chord chart is playable while lyrics can be retried.

- **Lava** uses the [Uke Like the Pros printable arrangement](https://www.ukelikethepros.com/ukulele-songs-lava), including its six verses, contrasting last chorus and tagged ending. The pattern shown on its first page has a quarter-note downstroke followed by three down/up pairs, with accented downstrokes on beats 2 and 4. The verse changes use the two-measure phrasing described in [Ukulele Go’s lesson](https://ukulelego.com/lessons/lava-ukulele-lesson/).
- **Can’t Help Falling in Love** follows the introduction, verses, bridges and tag of the [Gloucester Strings club sheet](https://glosukeclub.org.uk/wp-content/uploads/simple-file-list/Cant-Help-Falling-in-Love-With-You-GS.pdf). The light down/up accompaniment is a practice interpretation of its six-count feel. The tempo selector counts dotted-quarter pulses.
- **Yesterday** follows [Hull Ukulele Group’s version in F](https://hullukulelegroup.com/wp-content/uploads/2025/01/yesterday-v1.pdf), including its four even downstrokes, seven-bar verses, eight-bar bridges and hummed ending.

Add future strummed arrangements in `public/arrangements.js`. Set their chord sheet, pulse, down/up pattern, sections and measures. Vertical bars divide measures. Multiple chords in a measure share its pulses equally unless an explicit duration is supplied, as in `Dm:1 C:1 Bb:2`. A final `!` gives the chord one attack and lets it ring. A `*` uses only main pulses. Each optional `lines` list identifies the zero-based measure starts of the printed lyric lines in that section. The library derives every chord diagram from the actual progression. Store new G–C–E–A fret and finger positions in `public/chords.js`.

Older personal PDFs remain accessible through a download link on their song. Songbook pages load no document viewers.
