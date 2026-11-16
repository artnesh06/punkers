'use client';

import { useState, useEffect, useRef } from 'react';
import { GAME } from '@/lib/constants/game';

// Tax table for 60 days
const TAX_TABLE = [3, 3, 3, 6, 6, 6, 6, 12, 12, 12, 12, 12, 12, 12, 22, 22, 22, 22, 22, 22, 22, 35, 35, 35, 35, 35, 35, 35, 35, 35, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80];

// Period definitions
const PERIODS = [
  {s:1,e:3,lbl:'1-3'},
  {s:4,e:7,lbl:'4-7'},
  {s:8,e:14,lbl:'8-14'},
  {s:15,e:21,lbl:'15-21'},
  {s:22,e:30,lbl:'22-30'},
  {s:31,e:40,lbl:'31-40'},
  {s:41,e:50,lbl:'41-50'},
  {s:51,e:60,lbl:'51-60'}
];

// Rarity data
const MULTIPLIERS = [1, 1.1, 1.21, 1.33];
const RARITY_NAMES = ['COMMON','EPIC','LEGENDARY','1/1 ART'];
const RARITY_COLORS = ['#888888','#b44dff','#ffcc00','#ff2d95'];

export const LateJoinerSimulator = () => {
  const [selectedRarity, setSelectedRarity] = useState(0);
  const [selectedDay, setSelectedDay] = useState(1);
  const sliderRef = useRef<HTMLInputElement>(null);

  const mult = MULTIPLIERS[selectedRarity];
  const earn = Math.round(10 * mult);
  const tax = TAX_TABLE[selectedDay - 1] || 80;
  const net = earn - tax;
  const rarColor = RARITY_COLORS[selectedRarity];

  // Update slider progress fill
  useEffect(() => {
    if (sliderRef.current) {
      const percentage = ((selectedDay - 1) / 59) * 100;
      sliderRef.current.style.background = `linear-gradient(to right, var(--accent-red) 0%, var(--accent-red) ${percentage}%, #2a2a2a ${percentage}%, #2a2a2a 100%)`;
    }
  }, [selectedDay]);

  const getVerdict = () => {
    if (net > 5) {
      return {
        color: '#00ff66',
        bg: 'rgba(0,255,102,0.05)',
        text: 'Profitable from day 1. Good entry point — you have room to breathe.'
      };
    } else if (net > 0) {
      return {
        color: '#ff6600',
        bg: 'rgba(255,102,0,0.05)',
        text: 'Very tight margin. One missed payment = immediate execution risk.'
      };
    } else if (net === 0) {
      return {
        color: '#ff6600',
        bg: 'rgba(255,102,0,0.05)',
        text: 'Break even on day 1. No buffer at all. High risk entry.'
      };
    } else {
      return {
        color: '#e53030',
        bg: 'rgba(229,48,48,0.05)',
        text: `${net} $PUNK on day 1. You are already behind before you even start.`
      };
    }
  };

  const verdict = getVerdict();

  return (
    <>
      <div className="vis-box" style={{padding:'20px',position:'relative'}}>
        <div style={{fontFamily:'var(--font-display)',fontSize:'8px',color:'var(--accent-yellow)',letterSpacing:'2px',marginBottom:'16px'}}>⚡ LATE JOINER SIMULATOR</div>

        {/* Rarity selector */}
        <div style={{display:'flex',gap:'8px',marginBottom:'16px',flexWrap:'wrap'}}>
          {RARITY_NAMES.map((name, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedRarity(idx)}
              style={{
                fontFamily:'var(--font-mono)',
                fontSize:'12px',
                padding:'6px 14px',
                border: selectedRarity === idx ? `1px solid ${RARITY_COLORS[idx]}` : '1px solid var(--border-color)',
                color: selectedRarity === idx ? RARITY_COLORS[idx] : 'var(--text-muted)',
                background: selectedRarity === idx ? `${RARITY_COLORS[idx]}22` : 'transparent',
                cursor:'pointer',
                transition:'all .2s'
              }}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Slider */}
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px'}}>
          <span style={{fontFamily:'var(--font-mono)',fontSize:'12px',color:'var(--text-muted)',whiteSpace:'nowrap'}}>Stake on global day</span>
          <input 
            ref={sliderRef}
            type="range" 
            min="1" 
            max="60" 
            value={selectedDay}
            onChange={(e) => setSelectedDay(Number.parseInt(e.target.value, 10))}
            style={{flex:1}}
          />
          <span style={{fontFamily:'var(--font-display)',fontSize:'10px',color:'var(--text-primary)',minWidth:'50px'}}>Day {selectedDay}</span>
        </div>

        {/* Stats row */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'1px',background:'var(--border-color)',marginBottom:'16px'}}>
          <div style={{background:'#151515',padding:'12px',textAlign:'center'}}>
            <div style={{fontFamily:'var(--font-mono)',fontSize:'9px',color:'var(--text-muted)',letterSpacing:'1px',marginBottom:'4px'}}>EARN / DAY 1</div>
            <div style={{fontFamily:'var(--font-display)',fontSize:'14px',color:rarColor}}>{earn}</div>
            <div style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-muted)'}}>$PUNK</div>
          </div>
          <div style={{background:'#151515',padding:'12px',textAlign:'center'}}>
            <div style={{fontFamily:'var(--font-mono)',fontSize:'9px',color:'var(--text-muted)',letterSpacing:'1px',marginBottom:'4px'}}>TAX / DAY 1</div>
            <div style={{fontFamily:'var(--font-display)',fontSize:'14px',color: tax <= earn ? '#00ff66' : '#e53030'}}>{tax}</div>
            <div style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-muted)'}}>$PUNK</div>
          </div>
          <div style={{background:'#151515',padding:'12px',textAlign:'center'}}>
            <div style={{fontFamily:'var(--font-mono)',fontSize:'9px',color:'var(--text-muted)',letterSpacing:'1px',marginBottom:'4px'}}>NET / DAY 1</div>
            <div style={{fontFamily:'var(--font-display)',fontSize:'14px',color: net > 5 ? '#00ff66' : net > 0 ? '#ff6600' : '#e53030'}}>
              {net > 0 ? '+' : ''}{net}
            </div>
            <div style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-muted)'}}>$PUNK</div>
          </div>
        </div>

        {/* Verdict */}
        <div style={{
          fontFamily:'var(--font-mono)',
          fontSize:'13px',
          padding:'10px 14px',
          borderLeft:`2px solid ${verdict.color}`,
          background:verdict.bg,
          color:verdict.color,
          marginBottom:'20px',
          lineHeight:'1.7',
          transition:'all .2s'
        }}>
          {verdict.text}
        </div>

        {/* Timeline bar */}
        <div style={{fontFamily:'var(--font-mono)',fontSize:'9px',color:'var(--text-muted)',letterSpacing:'1px',marginBottom:'8px'}}>GLOBAL GAME TIMELINE</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:'3px',marginBottom:'8px'}}>
          {PERIODS.map((p, idx) => {
            const t = TAX_TABLE[p.s - 1];
            const e = Math.round(10 * mult);
            const isStake = selectedDay >= p.s && selectedDay <= p.e;
            const n = e - t;
            const c = n > 5 ? '#00ff66' : n > 0 ? '#ff6600' : '#e53030';

            return (
              <div
                key={idx}
                style={{
                  borderRadius:'3px',
                  height:'28px',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  fontFamily:'var(--font-mono)',
                  fontSize:'9px',
                  transition:'all .2s',
                  background: isStake ? '#00ccff' : `${c}1a`,
                  color: isStake ? '#000' : c,
                  border: isStake ? 'none' : `1px solid ${c}44`
                }}
              >
                {isStake ? `D${selectedDay}` : p.lbl}
              </div>
            );
          })}
        </div>
        <div style={{display:'flex',gap:'14px',fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-muted)',flexWrap:'wrap'}}>
          <span><span style={{display:'inline-block',width:'8px',height:'8px',background:'var(--accent-green)',marginRight:'4px'}}></span>Profitable</span>
          <span><span style={{display:'inline-block',width:'8px',height:'8px',background:'var(--accent-orange)',marginRight:'4px'}}></span>Tight</span>
          <span><span style={{display:'inline-block',width:'8px',height:'8px',background:'var(--accent-red)',marginRight:'4px'}}></span>Break-even/loss</span>
          <span><span style={{display:'inline-block',width:'8px',height:'8px',background:'#00ccff',marginRight:'4px'}}></span>You</span>
        </div>
      </div>

      {/* WHAT IF SCENARIOS */}
      <div className="sh" style={{marginTop:'24px'}}>WHAT IF...</div>

      <button className="collapse-btn">
        <span>What if I stake on Day 1 vs Day 30?</span>
        <span className="arrow">▼</span>
      </button>
      <div className="collapse-content">
        <div className="collapse-inner">
          <p className="desc" style={{marginBottom:'8px'}}>Day 1 staker (Common): earns 10, pays 3 — net <strong style={{color:'var(--green)'}}>+7 $PUNK</strong> on day one. They&apos;ve been building a buffer from the start.</p>
          <p className="desc" style={{marginBottom:0}}>Day 30 staker (Common): earns 10, pays 35 — net <strong style={{color:'var(--red)'}}>-25 $PUNK</strong> on day one. They&apos;re immediately in debt. One missed payment = instant execution risk with zero buffer.</p>
        </div>
      </div>

      <button className="collapse-btn">
        <span>What if I have Legendary instead of Common?</span>
        <span className="arrow">▼</span>
      </button>
      <div className="collapse-content">
        <div className="collapse-inner">
          <p className="desc" style={{marginBottom:'8px'}}>Legendary earns 1.21x more — so on Day 1 you earn 12 instead of 10. The tax is identical for all rarities. That extra buffer compounds over {GAME.gameDurationDays} days — Legendary walks away with <strong style={{color:'var(--gold)'}}>+788 $PUNK</strong> net vs Common&apos;s +283.</p>
          <p className="desc" style={{marginBottom:0}}>More importantly: a late-joining Legendary (Day 20) still owes 22 tax but earns 12 — still <strong style={{color:'var(--red)'}}>-10 $PUNK</strong> on day 1. Rarity helps, but can&apos;t fully counter late entry.</p>
        </div>
      </div>

      <button className="collapse-btn">
        <span>What if I miss one tax payment?</span>
        <span className="arrow">▼</span>
      </button>
      <div className="collapse-content">
        <div className="collapse-inner">
          <p className="desc" style={{marginBottom:'8px'}}>You enter AUDITED status. You now have {GAME.auditGracePeriodHours} hours to pay the overdue tax + a <strong style={{color:'var(--orange)'}}>{GAME.auditPenaltyPercent}% penalty</strong>. If you miss that too, any player can execute your NFT for +{GAME.bountyReward} $PUNK bounty.</p>
          <p className="desc" style={{marginBottom:0}}>Late joiners are most vulnerable — they have no $PUNK buffer from earlier days, so one missed payment can be fatal immediately.</p>
        </div>
      </div>

      <button className="collapse-btn">
        <span>What if I stake late but have 1/1 Art?</span>
        <span className="arrow">▼</span>
      </button>
      <div className="collapse-content">
        <div className="collapse-inner">
          <p className="desc" style={{marginBottom:'8px'}}>1/1 Art earns 1.33x — so 13 $PUNK on personal Day 1. Staking on global Day 10 means tax is already 12, so net is only <strong style={{color:'var(--green)'}}>+1 $PUNK</strong>. Barely profitable.</p>
          <p className="desc" style={{marginBottom:0}}>Stake on Day 15 and tax jumps to 22 — even 1/1 Art is <strong style={{color:'var(--red)'}}>-9 $PUNK</strong> on day one. No rarity is immune to late entry at high global days.</p>
        </div>
      </div>

      <button className="collapse-btn">
        <span>What if the game is already on Day 50 — should I still stake?</span>
        <span className="arrow">▼</span>
      </button>
      <div className="collapse-content">
        <div className="collapse-inner">
          <p className="desc" style={{marginBottom:0}}>Probably not. At Day 50, tax is 63 $PUNK/day and you earn only 10. You&apos;d be <strong style={{color:'var(--red)'}}>-53 $PUNK</strong> on day one with zero buffer. You&apos;d be eliminated almost instantly. The only reason to stake this late is if you&apos;re hunting bounties and expect to earn $PUNK from executing others — but that&apos;s a very risky play.</p>
        </div>
      </div>
    </>
  );
};

export const CommonSchedule = () => (
  <>
    <button className="collapse-btn">
      <span><span className="r-common">COMMON</span> — Earning Schedule</span>
      <span className="arrow">▼</span>
    </button>
    <div className="collapse-content">
      <div className="collapse-inner">
        <table>
          <thead><tr><th>Period</th><th>Earn/Day</th><th>Tax/Day</th><th>Net/Day</th></tr></thead>
          <tbody>
            <tr><td>Day 1–3</td><td>10</td><td>3</td><td className="pos">+7</td></tr>
            <tr><td>Day 4–7</td><td>15</td><td>6</td><td className="pos">+9</td></tr>
            <tr><td>Day 8–14</td><td>20</td><td>12</td><td className="pos">+8</td></tr>
            <tr><td>Day 15–21</td><td>30</td><td>22</td><td className="pos">+8</td></tr>
            <tr><td>Day 22–30</td><td>40</td><td>35</td><td className="warn">+5</td></tr>
            <tr><td>Day 31–40</td><td>50</td><td>48</td><td className="neg">+2</td></tr>
            <tr><td>Day 41–50</td><td>65</td><td>63</td><td className="neg">+2</td></tr>
            <tr><td>Day 51–60</td><td>80</td><td>80</td><td className="neg">0</td></tr>
          </tbody>
        </table>
        <div className="collapse-note red">⚠️ Common breaks even at Day 51. One missed tax = death.</div>
      </div>
    </div>
  </>
);

export const EpicSchedule = () => (
  <>
    <button className="collapse-btn">
      <span><span className="r-epic">EPIC</span> — Earning Schedule (1.1x)</span>
      <span className="arrow">▼</span>
    </button>
    <div className="collapse-content">
      <div className="collapse-inner">
        <table>
          <thead><tr><th>Period</th><th>Earn/Day</th><th>Tax/Day</th><th>Net/Day</th></tr></thead>
          <tbody>
            <tr><td>Day 1–3</td><td>11</td><td>3</td><td className="pos">+8</td></tr>
            <tr><td>Day 4–7</td><td>17</td><td>6</td><td className="pos">+11</td></tr>
            <tr><td>Day 8–14</td><td>22</td><td>12</td><td className="pos">+10</td></tr>
            <tr><td>Day 15–21</td><td>33</td><td>22</td><td className="pos">+11</td></tr>
            <tr><td>Day 22–30</td><td>44</td><td>35</td><td className="pos">+9</td></tr>
            <tr><td>Day 31–40</td><td>55</td><td>48</td><td className="pos">+7</td></tr>
            <tr><td>Day 41–50</td><td>72</td><td>63</td><td className="pos">+9</td></tr>
            <tr><td>Day 51–60</td><td>88</td><td>80</td><td className="pos">+8</td></tr>
          </tbody>
        </table>
        <div className="collapse-note">Epic still profits +8/day at Day 51–60. Survivable but tight.</div>
      </div>
    </div>
  </>
);

export const LegendarySchedule = () => (
  <>
    <button className="collapse-btn">
      <span><span className="r-leg">LEGENDARY</span> — Earning Schedule (1.21x)</span>
      <span className="arrow">▼</span>
    </button>
    <div className="collapse-content">
      <div className="collapse-inner">
        <table>
          <thead><tr><th>Period</th><th>Earn/Day</th><th>Tax/Day</th><th>Net/Day</th></tr></thead>
          <tbody>
            <tr><td>Day 1–3</td><td>12</td><td>3</td><td className="pos">+9</td></tr>
            <tr><td>Day 4–7</td><td>18</td><td>6</td><td className="pos">+12</td></tr>
            <tr><td>Day 8–14</td><td>24</td><td>12</td><td className="pos">+12</td></tr>
            <tr><td>Day 15–21</td><td>36</td><td>22</td><td className="pos">+14</td></tr>
            <tr><td>Day 22–30</td><td>48</td><td>35</td><td className="pos">+13</td></tr>
            <tr><td>Day 31–40</td><td>60</td><td>48</td><td className="pos">+12</td></tr>
            <tr><td>Day 41–50</td><td>79</td><td>63</td><td className="pos">+16</td></tr>
            <tr><td>Day 51–60</td><td>97</td><td>80</td><td className="pos">+17</td></tr>
          </tbody>
        </table>
        <div className="collapse-note">Legendary is king. Profit grows in late game — the ultimate endgame NFT.</div>
      </div>
    </div>
  </>
);

export const ArtSchedule = () => (
  <>
    <button className="collapse-btn">
      <span><span className="r-art">1/1 ART</span> — Earning Schedule (1.33x)</span>
      <span className="arrow">▼</span>
    </button>
    <div className="collapse-content">
      <div className="collapse-inner">
        <table>
          <thead><tr><th>Period</th><th>Earn/Day</th><th>Tax/Day</th><th>Net/Day</th></tr></thead>
          <tbody>
            <tr><td>Day 1–3</td><td>13</td><td>3</td><td className="pos">+10</td></tr>
            <tr><td>Day 4–7</td><td>20</td><td>6</td><td className="pos">+14</td></tr>
            <tr><td>Day 8–14</td><td>27</td><td>12</td><td className="pos">+15</td></tr>
            <tr><td>Day 15–21</td><td>40</td><td>22</td><td className="pos">+18</td></tr>
            <tr><td>Day 22–30</td><td>53</td><td>35</td><td className="pos">+18</td></tr>
            <tr><td>Day 31–40</td><td>67</td><td>48</td><td className="pos">+19</td></tr>
            <tr><td>Day 41–50</td><td>86</td><td>63</td><td className="pos">+23</td></tr>
            <tr><td>Day 51–60</td><td>106</td><td>80</td><td className="pos">+26</td></tr>
          </tbody>
        </table>
        <div className="collapse-note pink">1/1 Art is the apex predator. Net profit keeps climbing — untouchable.</div>
      </div>
    </div>
  </>
);

export const FAQSection = () => (
  <>
    <button className="collapse-btn">
      <span>📋 TL;DR — Too long, didn&apos;t read?</span>
      <span className="arrow">▼</span>
    </button>
    <div className="collapse-content">
      <div className="collapse-inner">
        <p className="desc" style={{marginBottom:0}}>{GAME.totalNFTs} enter. {GAME.survivorTarget} survive. Stake your NFT, earn <strong>$PUNK</strong> daily, pay rising taxes to stay alive. $PUNK is in-game — no gas fees, no extra cost. Miss a payment and other players can audit and execute your NFT permanently. Last {GAME.survivorTarget} standing split the treasury. Survive or die.</p>
      </div>
    </div>

    <button className="collapse-btn">
      <span>Do I need gas fees or real money to pay tax?</span>
      <span className="arrow">▼</span>
    </button>
    <div className="collapse-content">
      <div className="collapse-inner">
        <p className="desc" style={{marginBottom:0}}>No. <strong>$PUNK is an in-game token</strong> — like points. Tax is paid using $PUNK you already earned from staking. No gas fees, no ETH, no extra money needed. Everything runs inside the game.</p>
      </div>
    </div>

    <button className="collapse-btn">
      <span>Can I stake a dead NFT?</span>
      <span className="arrow">▼</span>
    </button>
    <div className="collapse-content">
      <div className="collapse-inner">
        <p className="desc" style={{marginBottom:0}}>No. Death follows the token ID, not the wallet. Buy a dead Punker from someone? Still dead. Can&apos;t stake it. Can&apos;t earn with it. Ever.</p>
      </div>
    </div>

    <button className="collapse-btn">
      <span>Can I unstake my NFT?</span>
      <span className="arrow">▼</span>
    </button>
    <div className="collapse-content">
      <div className="collapse-inner">
        <p className="desc" style={{marginBottom:0}}>No. No unstake button. You&apos;re in. The only exit is: survive to the end, get executed, or transfer/list your NFT — which auto-unstakes it and all unclaimed $PUNK gets burned to the treasury.</p>
      </div>
    </div>

    <button className="collapse-btn">
      <span>What happens if I list or transfer my NFT?</span>
      <span className="arrow">▼</span>
    </button>
    <div className="collapse-content">
      <div className="collapse-inner">
        <p className="desc" style={{marginBottom:0}}>Auto-unstaked. All unclaimed $PUNK goes to the treasury. New owner can re-stake it but starts from zero.</p>
      </div>
    </div>

    <button className="collapse-btn">
      <span>Can I earn $PUNK while my NFT is listed?</span>
      <span className="arrow">▼</span>
    </button>
    <div className="collapse-content">
      <div className="collapse-inner">
        <p className="desc" style={{marginBottom:0}}>No. List it = auto-unstake. Pick one — play the game or sell.</p>
      </div>
    </div>

    <button className="collapse-btn">
      <span>What happens to my $PUNK when my NFT dies?</span>
      <span className="arrow">▼</span>
    </button>
    <div className="collapse-content">
      <div className="collapse-inner">
        <p className="desc" style={{marginBottom:0}}>Unclaimed $PUNK? Gone. Straight to treasury. $PUNK you already claimed to your wallet is safe.</p>
      </div>
    </div>

    <button className="collapse-btn">
      <span>Who can audit or execute my NFT?</span>
      <span className="arrow">▼</span>
    </button>
    <div className="collapse-content">
      <div className="collapse-inner">
        <p className="desc" style={{marginBottom:0}}>Anyone. {GAME.auditGracePeriodHours}h+ unpaid = anyone can audit you. {GAME.executionGracePeriodHours}h+ = anyone can execute you. They get {GAME.bountyReward} $PUNK each time. Your enemies are everywhere.</p>
      </div>
    </div>

    <button className="collapse-btn">
      <span>What happens when only {GAME.survivorTarget} Punkers are left?</span>
      <span className="arrow">▼</span>
    </button>
    <div className="collapse-content">
      <div className="collapse-inner">
        <p className="desc" style={{marginBottom:0}}>Game over. The 500 survivors split the treasury — all the $PUNK from taxes, penalties, and dead players&apos; forfeited earnings. Winner takes all.</p>
      </div>
    </div>

    <button className="collapse-btn">
      <span>Is the tax the same for all rarities?</span>
      <span className="arrow">▼</span>
    </button>
    <div className="collapse-content">
      <div className="collapse-inner">
        <p className="desc" style={{marginBottom:0}}>Yes. Same tax for everyone. Rarer NFTs just earn more so they can absorb it longer. Commons die first.</p>
      </div>
    </div>

    <button className="collapse-btn">
      <span>When does the game end?</span>
      <span className="arrow">▼</span>
    </button>
    <div className="collapse-content">
      <div className="collapse-inner">
        <p className="desc" style={{marginBottom:0}}>When only <strong>{GAME.survivorTarget} Punkers</strong> are left alive. No fixed deadline. Players get eliminated through executions and unstaking — game ends when enough people die. The {GAME.gameDurationDays}-day projections are estimates. Could be faster, could be slower. Depends on how aggressive the hunting gets.</p>
      </div>
    </div>

    <button className="collapse-btn">
      <span>When should I stake to get the best advantage?</span>
      <span className="arrow">▼</span>
    </button>
    <div className="collapse-content">
      <div className="collapse-inner">
        <p className="desc" style={{marginBottom:0}}><strong>Day 1.</strong> Early stakers earn at low tax and build up a $PUNK buffer. Late stakers earn Day 1 rates but pay current global tax — could be in the red from minute one. Early = more margin, more safety, more $PUNK. Don&apos;t sleep on it.</p>
      </div>
    </div>
  </>
);
