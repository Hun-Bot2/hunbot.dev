/** Select an existing card; never overlay or replace authored text with HTML. */
export function initializeReadingGraphs() {
 for (const graph of document.querySelectorAll<HTMLElement>('[data-reading-graph]')) {
  if (graph.dataset.ready) continue;
  const nodes = [...graph.querySelectorAll<HTMLButtonElement>('[data-reading-index]')];
  const panels = [...graph.querySelectorAll<HTMLElement>('[data-reading-panel]')];
  if (!nodes.length || nodes.length !== panels.length) continue;
  const select = (index: number) => {
   nodes.forEach((node,i) => node.setAttribute('aria-pressed', String(i === index)));
   panels.forEach((panel,i) => {
    panel.hidden = i !== index;
    panel.classList.toggle('is-active',i === index);
   });
  };
  nodes.forEach((node,index) => {
   node.addEventListener('pointerenter',() => select(index));
   node.addEventListener('focus',() => select(index));
   node.addEventListener('click',() => select(index));
   node.addEventListener('keydown',event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    nodes[(index+(event.key === 'ArrowRight' ? 1 : nodes.length-1))%nodes.length].focus();
   });
  });
  select(0);
  graph.querySelector<HTMLElement>('[data-reading-controls]')?.removeAttribute('hidden');
  graph.dataset.ready = 'true';
 }
}
