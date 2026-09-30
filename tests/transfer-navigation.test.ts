import test from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error jsdom is used only by this runtime UI test; no declaration package is installed.
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
test('wizard validates steps and preserves answers when going back',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});
 Object.assign(globalThis,{self:dom.window,window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,HTMLInputElement:dom.window.HTMLInputElement,FormData:dom.window.FormData,React,IS_REACT_ACT_ENVIRONMENT:true});
 const{createRoot}=await import('react-dom/client');const{TransferForm}=await import('../components/transfer-form');
 const root=createRoot(document.getElementById('root')!);
 await act(async()=>root.render(React.createElement(TransferForm,{enabled:true})));
 const submit=async()=>{await act(async()=>{document.querySelector('form')!.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));});};
 await submit();assert.equal((document.querySelector('[data-step="0"]') as HTMLElement).hidden,false);
 for(const[name,value]of Object.entries({player_name:'Test Player',player_id:'12345678',contact:'Discord test',current_kingdom:'123',languages:'English'}))(document.querySelector(`[name="${name}"]`) as HTMLInputElement).value=value;
 await submit();assert.equal((document.querySelector('[data-step="1"]') as HTMLElement).hidden,false);
 assert.equal(document.querySelectorAll('[name="preferred_alliance"]').length,7);
 const back=Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Back')!;
 await act(async()=>back.click());
 assert.equal((document.querySelector('[name="player_name"]') as HTMLInputElement).value,'Test Player');
 assert.equal((document.querySelector('[data-step="0"]') as HTMLElement).hidden,false);
 await act(async()=>root.unmount());dom.window.close();
});
