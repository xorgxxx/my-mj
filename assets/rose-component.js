// assets/rose-component.js
// Controls the SVG "line-draw" sequence: draw stem -> ground -> bloom outline -> fill -> fall -> settle
(function(){
  const stem = document.getElementById('stemPath');
  const ground = document.getElementById('groundPath');
  const outline = document.getElementById('bloomOutline');
  const fill = document.getElementById('bloomFill');
  const group = document.getElementById('roseGroup');
  const container = document.getElementById('rose-svg-container');

  if(!stem || !ground || !outline || !fill || !group || !container){
    // elements not found; nothing to run
    return;
  }

  // durations in milliseconds
  const durations = { stem:700, ground:600, outline:1000 };

  function animatePath(pathEl, ms){
    const len = pathEl.getTotalLength();
    pathEl.style.strokeDasharray = len;
    pathEl.style.strokeDashoffset = len;
    // force layout
    pathEl.getBoundingClientRect();
    return new Promise(resolve => {
      pathEl.style.transition = `stroke-dashoffset ${ms}ms cubic-bezier(.2,.8,.2,1)`;
      pathEl.style.strokeDashoffset = '0';
      const onEnd = (e) => { if(e.propertyName==='stroke-dashoffset'){ pathEl.removeEventListener('transitionend', onEnd); resolve(); } };
      pathEl.addEventListener('transitionend', onEnd);
    });
  }

  async function runSequence(){
    try{
      await animatePath(stem, durations.stem);
      await new Promise(r => setTimeout(r,120));
      await animatePath(ground, durations.ground);
      await new Promise(r => setTimeout(r,140));
      await animatePath(outline, durations.outline);

      // reveal fill
      fill.style.transition = 'opacity .6s ease 0.06s';
      fill.style.opacity = '1';

      // short pause to appreciate the bloom
      await new Promise(r => setTimeout(r,900));

      // trigger fall (group transforms as one object)
      group.classList.add('fall');

      // when transition ends, reveal shadow / settle
      const onFall = (e) => {
        if(e.propertyName && e.propertyName.includes('transform')){
          group.removeEventListener('transitionend', onFall);
          container.classList.add('rose-settled');
        }
      };
      group.addEventListener('transitionend', onFall);

    }catch(err){
      // swallow errors to avoid breaking page
      // but log for debugging
      if(window.console) console.error('rose-component error:', err);
    }
  }

  // start automatically after DOM ready; consumer can also call runSequence() manually
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runSequence);
  } else {
    runSequence();
  }

  // expose for debugging
  window.__roseComponent = { runSequence };
})();
