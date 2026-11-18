# Ukulele

A browser-local songbook for standard high-G ukulele (G4 C4 E4 A4). The public project path is `https://sambarbeau.com/uke/`. Its independent Cloudflare Pages project serves the contents of `public/` from this repository’s main branch. The personal site's Worker proxies the public path, and its preview script mounts the same directory.

Run the sibling site's `node scripts/preview.mjs` for an integrated preview, or run `python3 -m http.server 8001 --directory public` here. Run `node --test tests/*.test.mjs` to check the arrangements and pitch detector.

## Adding a song

Add an entry to `public/songs.js` with a stable link ID, title, credit, major key, time signature, quarter-note BPM and measures. The current format supports single-note melodies. Each measure contains a space-separated note row and an optional syllable row. The same notes drive the score, tab, fingering diagram, playback and highlight.

```js
['C4 D4 E4:2', 'Sing to- day.']
```

Bare notes last one quarter-note beat. Use `:0.5`, `:1.5`, `:2`, `:3` or `:4` for other supported durations. Spell accidentals in the note (for example `Bb4`). Every full bar must fill its meter. Set `pickup` to the opening length in quarter beats for an anacrusis, with its complement in the final bar. A leading tilde on a repeated pitch (e.g. `~A4:2`) ties it to the previous note on that string. Provide one lyric token per note when adding words. Use `_` for a continued syllable or a note without words. Optional named sections index the measures from zero, including the pickup. The default fingering uses the smallest playable fret, including the open high G. Override a particular fingering with a string number, for example `G4@2:2` for a half note on fret 3 of the E string. String 1 is A and string 4 is G. Check the melody, lyric alignment and positions on a phone when adding arrangements. Use original, public-domain or appropriately licensed material.

## Design and sources

[VexFlow](https://www.vexflow.com/) engraves the staff and aligns it with four-string tab. The local 4.2.5 Bravura bundle comes from the official npm package. License texts are in `public/vendor/`. Each system reflows at measure boundaries. A fixed lyric baseline keeps the syllables above their corresponding notes.

[Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques) schedules synthesized plucks against the audio clock. The tuner analyzes live waveform samples locally once the player enables the microphone. It releases the input on stop, tab hide, navigation or reference-tone playback. Microphone capture requires [a secure context and permission](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia). The [Lanikai care guide](https://lanikaiukuleles.com/wp-content/uploads/2023/03/Lanikai_CareGuide_2023.pdf) documents the high-G tuning.

The starter arrangements were entered for this project. Historical references include the [Morgan Library’s French tune manuscript](https://www.themorgan.org/exhibitions/online/mozart/418), [Twinkle’s printed words](https://www.gutenberg.org/ebooks/61009), the [Frère Jacques round](https://www.gutenberg.org/cache/epub/42711/music/018-019frerejacques.pdf), and [Beethoven’s Ninth Symphony manuscript](https://www.loc.gov/resource/gdcwdl.wdl_15063/). Ode to Joy is presented as an instrumental melody.

Hosting uses static Pages assets with no build command, database or paid music API. Requests through the personal site's Worker count toward its existing [Workers quota](https://developers.cloudflare.com/pages/functions/pricing/).


## Requested songs

“Cielito Lindo” follows the melody and Spanish text on pp. 298–299 of Carl Sandburg’s 1927 *The American Songbag*. The one-beat pickup and two-beat ending complete 32 bars of 3/4. The verse and chorus can be practiced separately. [Scanned edition](https://upload.wikimedia.org/wikipedia/commons/c/cb/Carl_Sandburg_-_The_American_Songbag.pdf#page=326) · [Sam’s Rock Class 101 tutorial](https://www.youtube.com/watch?v=cDc6dDq0gdM)

“Lava,” “Can’t Help Falling in Love,” and “Yesterday” open with their respective video lessons. Each includes an original picking exercise with synchronized notation and a link to the published score. The full commercial scores and lyrics are available through their publishers. The YouTube embed loads on request. Selecting another mode, another song or the tuner stops the lesson. My sheet opens a PDF supplied by the player and stores it in this browser’s IndexedDB under the song ID. PDF pages are for reading and do not drive audio playback.
