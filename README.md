# Type Tune

Type text on a grid and a scan line turns it into music. Every grid cell your letters touch plays a note: higher rows play higher notes, and notes are panned left to right.

A [Maybe Machine](https://ravipopat.info/maybe-machines) by [Ravi Popat](https://ravipopat.info).

## Run

No build step. Plain HTML, CSS and JavaScript, with the fonts in `fonts/`. Serve the folder (fonts may not load from file:// in every browser):

```
npx serve .
```

## GitHub Pages

Push `index.html` to a repo, then go to Settings → Pages and deploy from the `main` branch root.

## Controls

- **Click anywhere** to create text. Click text to edit it, or drag it to move it.
- **Play / Space** starts and stops the scan.
- **Drag over empty space** to select several blocks. **Copy / Paste** (or Cmd/Ctrl+C / V) duplicate them, and Alt/Opt-drag clones them.
- **Del**, the Delete key, or dragging text into the bottom-right corner deletes it.
- **Loop lines** (cyan / magenta) can be dragged to set the playback range.
- **Top row:** tempo − / BPM / + (click the BPM to type a tempo), the scale picker (58 TidalCycles scales), and text size − / + .
- **Bottom row:** scan direction (8 directions), play, metronome.
