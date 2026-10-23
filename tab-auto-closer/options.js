import { DEFAULTS, getSettings, isValidDelay, MAX_DELAY_SECONDS, originOf, parsePatterns } from "./settings.js";

const form = document.getElementById("options");
const delayInput = document.getElementById("delay");
const patternsInput = document.getElementById("patterns");
const status = document.getElementById("status");
const access = document.getElementById("access");

function fill({ delaySeconds, patterns }) {
  delayInput.value = delaySeconds;
  patternsInput.value = patterns.join("\n");
}

function report(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

async function renderAccess() {
  const { patterns } = await getSettings();
  const origins = [...new Set(patterns.map(originOf))];
  const items = await Promise.all(
    origins.map(async (origin) => {
      const item = document.createElement("li");
      item.textContent = origin;
      item.className = (await chrome.permissions.contains({ origins: [origin] })) ? "granted" : "denied";
      return item;
    }),
  );
  access.replaceChildren(...items);
  if (items.length === 0) {
    access.textContent = "No patterns: no tab gets closed.";
  }
}

// Gives up access to sites that no pattern needs anymore.
async function releaseUnusedOrigins(origins) {
  const { origins: granted = [] } = await chrome.permissions.getAll();
  const unused = granted.filter((origin) => !origins.includes(origin));
  if (unused.length > 0) {
    await chrome.permissions.remove({ origins: unused });
  }
}

async function save(delaySeconds, patterns, origins, granted) {
  await chrome.storage.sync.set({ delaySeconds, patterns });
  await releaseUnusedOrigins(origins);
  await renderAccess();
  if (granted) {
    report("Saved.");
  } else {
    report("Saved, but Chrome was not given access to every site: tabs on those sites stay open.", true);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const delaySeconds = Number(delayInput.value);
  if (delayInput.value.trim() === "" || !isValidDelay(delaySeconds)) {
    report(`The delay must be a whole number of seconds from 0 to ${MAX_DELAY_SECONDS}.`, true);
    return;
  }
  const { patterns, invalid } = parsePatterns(patternsInput.value);
  if (invalid.length > 0) {
    report(`Not a valid pattern: ${invalid.join(", ")}`, true);
    return;
  }

  // Chrome only shows the permission prompt during the click itself, so the request comes before anything that
  // awaits.
  const origins = [...new Set(patterns.map(originOf))];
  const request = origins.length > 0 ? chrome.permissions.request({ origins }) : Promise.resolve(true);
  request
    .then((granted) => save(delaySeconds, patterns, origins, granted))
    .catch((error) => report(`Could not save: ${error.message}`, true));
});

document.getElementById("defaults").addEventListener("click", () => {
  fill(DEFAULTS);
  report("Defaults restored. Save to apply them.");
});

getSettings().then(fill);
renderAccess();
