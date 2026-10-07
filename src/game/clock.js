// Game time in seconds, from the device clock. Saves trim a little heat (see CLOCK_MARGIN in
// forge.js) so a phone running slightly ahead of the chain still saves fine.

const nowSec = () => Math.floor(Date.now() / 1000);

export { nowSec };
