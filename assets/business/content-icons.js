// Shared, dependency-free icons for the library, builder and learner tasks.
const paths = {
  video:'M8 4 21 12 8 20Z',
  article:'M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3ZM12 6v16',
  quiz:'M4 3h16v18H4Zm4 8 3 3 5-6',
  scenario:'M4 3h16v14H9l-5 4Zm4 5h8m-8 4h5',
  game:'M2 12Q8 2 16 12Q8 22 2 12ZM16 12l6-5v10Z'
};
export function contentIcon(format) {
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS(svg.namespaceURI,'path');
  path.setAttribute('d',paths[format] || paths.article);svg.append(path);
  return svg;
}
