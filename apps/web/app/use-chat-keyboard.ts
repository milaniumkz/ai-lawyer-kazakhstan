"use client";
import {useEffect,useState} from 'react';

// Safari shrinks the visual viewport while the layout viewport stays behind
// the keyboard. Chrome may resize both; keep the composer visible in either case.
export function useChatKeyboard(active:boolean,view:string) {
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    if(!active)return;
    const viewport=window.visualViewport;
    const shell=document.querySelector<HTMLElement>('.appShell');
    const composer=document.querySelector<HTMLElement>('[data-chat-composer]');
    if(!shell || !composer)return;
    let baseline=Math.max(window.innerHeight,viewport?.height || 0);
    let composerFocused=false,frame=0;
    const update=()=>{
      const height=viewport?.height || window.innerHeight;
      const focusInside=composer.contains(document.activeElement);
      composerFocused ||= focusInside;
      baseline=Math.max(baseline,window.innerHeight,height);
      const covered=Math.max(0,window.innerHeight-height-(viewport?.offsetTop || 0));
      const raised=composerFocused && Math.max(covered,baseline-height)>120;
      setOpen(raised);
      shell.style.setProperty('--chat-keyboard-offset',`${raised ? covered : 0}px`);
      shell.style.setProperty('--chat-composer-height',`${composer.offsetHeight}px`);
      if(!raised && !focusInside)composerFocused=false;
    };
    const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);};
    const focus=(event:FocusEvent)=>{
      if(event.target instanceof Node)composerFocused=composer.contains(event.target);
      schedule();
    };
    const resize=new ResizeObserver(schedule);resize.observe(composer);
    viewport?.addEventListener('resize',schedule);viewport?.addEventListener('scroll',schedule);
    window.addEventListener('resize',schedule);document.addEventListener('focusin',focus);
    schedule();
    return ()=>{
      cancelAnimationFrame(frame);resize.disconnect();
      viewport?.removeEventListener('resize',schedule);viewport?.removeEventListener('scroll',schedule);
      window.removeEventListener('resize',schedule);document.removeEventListener('focusin',focus);
      shell.style.removeProperty('--chat-keyboard-offset');shell.style.removeProperty('--chat-composer-height');
    };
  },[active,view]);
  return active && open;
}
