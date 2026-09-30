import {PageHeader} from './ui';
import {kingdomTimelineSource} from '@/data/timeline';
import {progression} from '@/data/progression';

export function KingdomTimeline(){
  return <><PageHeader number="02" title="KINGDOM TIMELINE" intro="Follow Kingdom 2312 through every generation and milestone."/><div className="wrap page-body">
    <section aria-labelledby="current-progression-title"><div className="eyebrow">01 / CURRENT KINGDOM PROGRESSION</div><h2 id="current-progression-title" className="timeline-record-title">Where 2312 stands.</h2><p>Kingdom-confirmed progression, used by the member forms and construction tools.</p>
      <div className="three-grid progression-cards">
        <article className="card"><span className="eyebrow">HEROES</span><h3>Generation {progression.heroGeneration}</h3><p>Generation 1–2 heroes, including Hilde, Marlin, and Zoe.</p></article>
        <article className="card"><span className="eyebrow">CONSTRUCTION</span><h3>Truegold {progression.maxTruegoldLevel}</h3><p>Building plans include every upgrade step through TG3.</p></article>
        <article className="card"><span className="eyebrow">TROOPS</span><h3>Tier {progression.maxTroopTier}</h3><p>Choose current troop tiers through T10 in your player profile.</p></article>
      </div>
    </section>
    <section className="timeline-source" aria-labelledby="timeline-source-title"><div className="eyebrow">02 / KINGDOM 2312 TIMELINE</div><h2 id="timeline-source-title">See what’s coming next.</h2><p>Explore dated hero generations, Truegold unlocks, and event milestones on the Kingdom 2312 timeline from {kingdomTimelineSource.label}.</p><a className="button" href={kingdomTimelineSource.url} target="_blank" rel="noopener noreferrer">Open Kingdom 2312 timeline ↗</a><p className="field-help">Opens {kingdomTimelineSource.label} in a new tab. Future dates on that community timeline are estimates; check in-game notices for confirmed unlocks.</p></section>
  </div></>;
}
