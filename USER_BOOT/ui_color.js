// =============================================================================
//  Name: UI Color - Orange
//  Link: https://log.robco-industries.org/log/entry016/
//  Description: Update the Pip-Boy UI color to a custom orange palette.
//  Version: 1.0.0
// =============================================================================

for (
  var pal = [
      new Uint16Array(16),
      new Uint16Array(16),
      new Uint16Array(16),
      new Uint16Array(16),
    ],
    i = 0;
  i < 16;
  i++
)
  (pal[0][i] = g.toColor(i / 15, i / 30, 0)),
    (pal[1][i] = g.toColor(i / 30, i / 60, 0)),
    (pal[2][i] = g.toColor(i / 10, i / 20, 0)),
    (pal[3][i] = g.toColor(i / 20, i / 40, 0));
Pip.setPalette(pal);
