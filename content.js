function sanitize_filename(s) {
  // Replace risky characters with sensible substitutions
  return s.replace(/[<>:"\/\\|?*]/g, match => {
      switch (match) {
          case '<': return '(';
          case '>': return ')';
          case ':': return ' --';
          case '"': return '\'';
          case '/': return ' or ';
          case '\\': return ' or ';
          case '\|': return ',';
          case '?': return '!';
          case '*': return 'x';
          default: return '_';
      }
  });
}

const copiedMessage = ' ✓ Copied';
const plexNameBoxClassname = 'plex-name-box';

function hasPlexNameBox(result) {
  return result.querySelector(`.${plexNameBoxClassname}`);
}

function makePlexNameBox(title, year, source, code) {
  const plexNameBox = document.createElement('div');
  plexNameBox.className = plexNameBoxClassname;
  var yearText;
  if (year === null)
    yearText = '';
  else
    yearText = ` (${year})`;
  plexNameBox.textContent = `${sanitize_filename(title)}${yearText} {${source}-${code}}`;
  plexNameBox.style.cursor = 'copy';
  plexNameBox.addEventListener('click', (event) => {
    event.stopPropagation();
    if (plexNameBox.textContent.endsWith(copiedMessage))
      plexNameBox.textContent = plexNameBox.textContent.slice(0, -copiedMessage.length);
    navigator.clipboard.writeText(plexNameBox.textContent);
    setTimeout(() => {
      if (plexNameBox.textContent.endsWith(copiedMessage))
        plexNameBox.textContent = plexNameBox.textContent.slice(0, -copiedMessage.length);
    }, 2000);
    plexNameBox.textContent += copiedMessage;
  });

  return plexNameBox;
}

function modifyIMDBSearchResults() {
  const results = document.querySelectorAll('.ipc-metadata-list-summary-item');

  results.forEach(result => {
    // Check if the formatted box already exists to avoid duplicates
    if (hasPlexNameBox(result))
      return;
    const linkElement = result.querySelector('.ipc-title-link-wrapper');
    if (linkElement === null)
      return;
    const titleElement = linkElement.querySelector('.ipc-title__text');
    if (titleElement === null)
      return;
    const metadataContainer = result.querySelector('.cli-title-metadata');
    if (metadataContainer === null)
      return;
    const yearElement = result.querySelector('.cli-title-metadata-item');
    var year;
    if (yearElement === null)
      year = null;
    else
      year = yearElement.textContent.trim();
    const href = linkElement.getAttribute('href');
    var imdbCode;
    const imdbCodematch = href.match(/title\/(tt\d+)/);
    if (imdbCodematch === null)
      return;
    else
      imdbCode = imdbCodematch[1];
    const plexNameBox = makePlexNameBox(titleElement.textContent, year, 'imdb', imdbCode);
    plexNameBox.style.display = 'block';
    plexNameBox.style.marginTop = '0.25rem';
    metadataContainer.parentNode.insertBefore(plexNameBox, metadataContainer.nextSibling);
  });
}

function modifyTVDBSearchResults() {
  const results = document.querySelectorAll('.media-body');
  results.forEach(result => {
    // Check if the formatted box already exists to avoid duplicates
    if (hasPlexNameBox(result))
      return;    
    const titleElement = result.querySelector('h3.media-heading');
    const yearAndIdElement = result.querySelector('div.text-muted');
    const yearMatch = yearAndIdElement.textContent.match(/\d{4},/);
    var year;
    if (yearMatch === null)
      year = null;
    else
      year = yearMatch[0].slice(0, -1)
    const seriesCodeMatch = yearAndIdElement.textContent.match(/Series \#(\d+)/);
    const movieCodeMatch = yearAndIdElement.textContent.match(/Movie \#(\d+)/);
    if (seriesCodeMatch === null && movieCodeMatch === null)
      return;
    var tvdbCode;
    if (seriesCodeMatch === null)
      tvdbCode = movieCodeMatch[1];
    else
      tvdbCode = seriesCodeMatch[1];
    const plexNameBox = makePlexNameBox(titleElement.textContent, year, 'tvdb', tvdbCode);
    yearAndIdElement.appendChild(plexNameBox);
  });
}

const observer = new MutationObserver((mutations, obs) => {
  if (document.querySelector('.ipc-metadata-list-summary-item'))
    modifyIMDBSearchResults();
  if (document.querySelector('.media-body'))
    modifyTVDBSearchResults();
});

observer.observe(document, {
  childList: true,
  subtree: true
});
