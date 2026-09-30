'use client';
import {useState,useEffect} from 'react';
export function UtcClock(){const [time,setTime]=useState('--:--:--');useEffect(()=>{const tick=()=>setTime(new Date().toLocaleTimeString('en-GB',{timeZone:'UTC',hour12:false}));tick();const id=setInterval(tick,1000);return()=>clearInterval(id)},[]);return <span className="utc-clock" aria-label="Current kingdom time in UTC">{time}<span> UTC</span></span>}
