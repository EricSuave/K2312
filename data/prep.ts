// Display matches the supplied K710 screenshots. These are requested availability
// times, not confirmed Kingdom 2312 appointments or a live slot inventory.
export const prepDays = [1,2,4,5] as const;
export const prepTimeSlots = Array.from({length:48},(_,i)=>{
 const minutes=(23*60+45+i*30)%(24*60);
 return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
});
