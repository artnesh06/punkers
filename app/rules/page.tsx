'use client';

import { useEffect } from 'react';
import './rules.css';
import { CommonSchedule, EpicSchedule, LegendarySchedule, ArtSchedule, FAQSection, LateJoinerSimulator } from './components';
import { GAME } from '@/lib/constants/game';

export default function Rules() {
  useEffect(() => {
    // Attach collapse button handlers
    const toggle = (btn: HTMLElement) => {
      const content = btn.nextElementSibling as HTMLElement;
      btn.classList.toggle('open');
      content?.classList.toggle('open');
    };

    const handleInteraction = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const btn = e.currentTarget as HTMLElement;
      toggle(btn);
    };

    const buttons = document.querySelectorAll('.collapse-btn');
    buttons.forEach((btn) => {
      // Remove any existing onclick attributes
      btn.removeAttribute('onclick');
      btn.addEventListener('click', handleInteraction);
      btn.addEventListener('touchend', handleInteraction);
    });

    return () => {
      buttons.forEach((btn) => {
        btn.removeEventListener('click', handleInteraction);
        btn.removeEventListener('touchend', handleInteraction);
      });
    };
  }, []);

  return (
    <div className="wrapper">
      <div className="main-card">
        {/* OBJECTIVE CARD */}
        <div className="section-card">
          <div className="sh">OBJECTIVE</div>

          {/* Premium Funnel Visual */}
          <div className="vis-box" style={{padding:'28px 20px',position:'relative',overflow:'hidden'}}>
            {/* Background scanline effect */}
            <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,background:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.008) 3px,rgba(255,255,255,0.008) 4px)',pointerEvents:'none'}}></div>
            
            <div style={{display:'flex',alignItems:'center',position:'relative',zIndex:1}}>
              {/* 5000 ENTER */}
              <div style={{textAlign:'center',flex:'1.2',animation:'countFade 0.8s ease both'}}>
                <div style={{fontSize:'clamp(32px,6vw,48px)',fontWeight:700,color:'var(--text)',letterSpacing:'-1px',textShadow:'0 0 30px rgba(180,180,180,0.15)'}} className="counter" data-target="5000">{GAME.totalNFTs}</div>
                <div style={{fontSize:'10px',color:'var(--dim)',letterSpacing:'4px',marginTop:'4px'}}>ENTER</div>
              </div>

              {/* Arrow 1 */}
              <div style={{flex:'0.8',padding:'0 8px'}}>
                <svg viewBox="0 0 120 24" style={{width:'100%',height:'24px'}}>
                  <defs>
                    <linearGradient id="ag1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{stopColor:'#333'}}/>
                      <stop offset="100%" style={{stopColor:'var(--red)'}}/>
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="12" x2="100" y2="12" stroke="url(#ag1)" strokeWidth="1.5" strokeDasharray="6,4">
                    <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.5s" repeatCount="indefinite"/>
                  </line>
                  <polygon points="98,6 112,12 98,18" fill="var(--red)" opacity="0.8">
                    <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite"/>
                  </polygon>
                </svg>
              </div>

              {/* TAX / AUDITS / EXECUTIONS */}
              <div style={{textAlign:'center',flex:'1.2',animation:'countFade 0.8s ease 0.3s both'}}>
                <div style={{fontSize:'clamp(14px,3vw,18px)',fontWeight:700,color:'var(--red)',letterSpacing:'3px'}}>
                  <span style={{animation:'pulse 2s ease infinite',display:'inline-block'}}>TAX ↑</span>
                </div>
                <div style={{fontSize:'10px',color:'var(--dim)',letterSpacing:'3px',marginTop:'2px'}}>AUDITS</div>
                <div style={{fontSize:'10px',color:'var(--dim)',letterSpacing:'3px'}}>EXECUTIONS</div>
                <div style={{marginTop:'8px',width:'60%',height:'2px',background:'linear-gradient(90deg,transparent,var(--red),transparent)',marginLeft:'auto',marginRight:'auto',animation:'pulse 3s ease infinite'}}></div>
              </div>

              {/* Arrow 2 */}
              <div style={{flex:'0.8',padding:'0 8px'}}>
                <svg viewBox="0 0 120 24" style={{width:'100%',height:'24px'}}>
                  <defs>
                    <linearGradient id="ag2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{stopColor:'var(--red)'}}/>
                      <stop offset="100%" style={{stopColor:'var(--green)'}}/>
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="12" x2="100" y2="12" stroke="url(#ag2)" strokeWidth="1.5" strokeDasharray="6,4">
                    <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.5s" repeatCount="indefinite"/>
                  </line>
                  <polygon points="98,6 112,12 98,18" fill="var(--green)" opacity="0.8">
                    <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite"/>
                  </polygon>
                </svg>
              </div>

              {/* 500 SURVIVE */}
              <div style={{textAlign:'center',flex:'1.2',animation:'countFade 0.8s ease 0.6s both'}}>
                <div style={{fontSize:'clamp(32px,6vw,48px)',fontWeight:700,color:'var(--green)',letterSpacing:'-1px',textShadow:'0 0 30px rgba(61,224,61,0.2)'}} className="counter" data-target="500">{GAME.survivorTarget}</div>
                <div style={{fontSize:'10px',color:'var(--green)',letterSpacing:'4px',marginTop:'4px'}}>SURVIVE</div>
              </div>
            </div>

            {/* Bottom accent line */}
            <div style={{position:'absolute',bottom:0,left:0,right:0,height:'1px',background:'linear-gradient(90deg,transparent,var(--red),var(--green),transparent)'}}></div>
          </div>
          <p className="desc">Stake your Punker NFTs to earn <strong>$PUNK</strong> every day. But this isn&apos;t just about earning — you also have to pay taxes to stay alive. The tax rate keeps rising over time, and if you fall behind or miss a payment, other players can audit and even execute your NFT to knock you off the leaderboard.</p>
          <p className="desc">This game is all about who survives the longest. Use your best strategy, stack as much <strong>$PUNK</strong> as you can, and stay alive until the very end.</p>
          <p className="desc">There are <strong>{GAME.totalNFTs} Punkers</strong> in total, but only <strong>{GAME.survivorTarget} will survive</strong> to the finish line. If you&apos;re one of the last ones standing, you&apos;ll earn $PUNK rewards from all the taxes and activity generated on the platform. So make sure you don&apos;t die halfway through — this is a survival game, have fun!</p>
        </div>

        {/* HOW TO PLAY */}
        <div className="section-card">
          <div className="sh">HOW TO PLAY</div>

          {/* Animated Step Flow */}
          <div className="vis-box" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:0,flexWrap:'wrap'}}>
            <div style={{textAlign:'center',padding:'6px 12px'}} className="anim-fade anim-d1">
              <div style={{fontSize:'16px'}}>🔒</div>
              <div style={{fontSize:'9px',color:'var(--green)',letterSpacing:'1px',marginTop:'2px'}}>STAKE</div>
            </div>
            <div style={{color:'var(--dim)',fontSize:'12px',padding:'0 4px',animation:'arrowPulse 1.5s ease 0.2s infinite'}}>→</div>
            <div style={{textAlign:'center',padding:'6px 12px'}} className="anim-fade anim-d2">
              <div style={{fontSize:'16px'}}>💰</div>
              <div style={{fontSize:'9px',color:'var(--green)',letterSpacing:'1px',marginTop:'2px'}}>EARN</div>
            </div>
            <div style={{color:'var(--dim)',fontSize:'12px',padding:'0 4px',animation:'arrowPulse 1.5s ease 0.4s infinite'}}>→</div>
            <div style={{textAlign:'center',padding:'6px 12px'}} className="anim-fade anim-d3">
              <div style={{fontSize:'16px'}}>📈</div>
              <div style={{fontSize:'9px',color:'var(--orange)',letterSpacing:'1px',marginTop:'2px'}}>PAY TAX</div>
            </div>
            <div style={{color:'var(--dim)',fontSize:'12px',padding:'0 4px',animation:'arrowPulse 1.5s ease 0.6s infinite'}}>→</div>
            <div style={{textAlign:'center',padding:'6px 12px'}} className="anim-fade anim-d4">
              <div style={{fontSize:'16px'}}>⚔️</div>
              <div style={{fontSize:'9px',color:'var(--orange)',letterSpacing:'1px',marginTop:'2px'}}>SURVIVE</div>
            </div>
            <div style={{color:'var(--dim)',fontSize:'12px',padding:'0 4px',animation:'arrowPulse 1.5s ease 0.8s infinite'}}>→</div>
            <div style={{textAlign:'center',padding:'6px 12px'}} className="anim-fade anim-d5">
              <div style={{fontSize:'16px'}}>🏆</div>
              <div style={{fontSize:'9px',color:'var(--gold)',letterSpacing:'1px',marginTop:'2px'}}>WIN</div>
            </div>
          </div>
          <p className="desc">Getting started is simple — stake your Punker NFT and you&apos;ll start earning <strong>$PUNK</strong> immediately. But keep in mind, once you&apos;re in, the clock starts ticking.</p>
          <ul className="blist">
            <li><strong>Stake:</strong> Lock your Punker NFT into the staking contract to start earning</li>
            <li><strong>Earn Daily:</strong> Your NFT earns $PUNK every day automatically based on its rarity</li>
            <li><strong>Pay Tax:</strong> You must pay daily tax from your earnings to keep your NFT alive</li>
            <li><strong>No Unstake:</strong> Once you stake, there is no unstake button. You&apos;re in the game until you survive or die</li>
            <li><strong>Transfer or List = Auto Unstake:</strong> If you send your NFT to another wallet or list it on any marketplace, it automatically gets unstaked and all unclaimed $PUNK is forfeited</li>
          </ul>
        </div>

        {/* EARNING & TAX */}
        <div className="section-card">
          <div className="sh">EARNING & TAX</div>

          <p className="desc">Your NFT earns <strong>$PUNK</strong> daily based on rarity. But every NFT must also pay a daily tax — and the tax <strong>increases over time</strong>. Early days are profitable, but as the game progresses, the gap between earning and tax shrinks. Common Punkers break even at Day 51. Rarer NFTs have more breathing room.</p>

          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Rarity</th><th>Multiplier</th><th>Base Day 1 Earn</th></tr></thead>
              <tbody>
                <tr><td className="r-common">COMMON</td><td>1.0x</td><td>10 $PUNK</td></tr>
                <tr><td className="r-epic">EPIC</td><td>1.1x</td><td>11 $PUNK</td></tr>
                <tr><td className="r-leg">LEGENDARY</td><td>1.21x</td><td>12 $PUNK</td></tr>
                <tr><td className="r-art">1/1 ART</td><td>1.33x</td><td>13 $PUNK</td></tr>
              </tbody>
            </table>
          </div>

          <p className="desc">Tax is the same for all rarities. The difference is how much room each rarity has to absorb it. Click each rarity below to see the full earning vs tax breakdown:</p>

          <CommonSchedule />
          <EpicSchedule />
          <LegendarySchedule />
          <ArtSchedule />

          {/* 60-DAY TOTAL */}
          <div className="sh" style={{marginTop:'28px'}}>60-DAY TOTAL PROJECTION</div>
          <p className="desc">If you survive the full {GAME.gameDurationDays} days without missing a single tax payment, here&apos;s how much <strong>$PUNK</strong> each rarity walks away with:</p>

          <div className="sum-grid">
            <div className="sum-item">
              <span className="r-common">COMMON</span>
              <div className="num" style={{color:'#888'}}>+283</div>
              <div className="lbl">Net $PUNK</div>
              <div className="sub">Earn 2435 — Tax 2152</div>
            </div>
            <div className="sum-item">
              <span className="r-epic">EPIC</span>
              <div className="num" style={{color:'var(--purple)'}}>+537</div>
              <div className="lbl">Net $PUNK</div>
              <div className="sub">Earn 2689 — Tax 2152</div>
            </div>
            <div className="sum-item">
              <span className="r-leg">LEGENDARY</span>
              <div className="num" style={{color:'var(--gold)'}}>+788</div>
              <div className="lbl">Net $PUNK</div>
              <div className="sub">Earn 2940 — Tax 2152</div>
            </div>
            <div className="sum-item">
              <span className="r-art">1/1 ART</span>
              <div className="num" style={{color:'var(--pink)'}}>+1503</div>
              <div className="lbl">Net $PUNK</div>
              <div className="sub">Earn 3655 — Tax 2152</div>
            </div>
          </div>
        </div>

        {/* LATE JOINERS */}
        <div className="section-card">
          <div className="sh">LATE JOINERS</div>

          <p className="desc">You can stake at any point — but the later you join, the harder it gets. Your <strong>earn rate</strong> always starts at personal Day 1. But your <strong>tax rate</strong> follows the global game clock from the moment you stake.</p>

          {/* INTERACTIVE SIMULATOR */}
          <LateJoinerSimulator />
        </div>

        {/* WHAT HAPPENS IF YOU DON'T PAY */}
        <div className="section-card">
          <div className="sh">WHAT HAPPENS IF YOU DON&apos;T PAY</div>
          <p className="desc">Miss a tax payment? You got <strong>{GAME.executionGracePeriodHours} hours</strong> before your NFT is dead. The system won&apos;t kill you. Other players will.</p>

          <div className="flow">
            <div className="flow-box">🚫 Tax not paid</div>
            <div className="flow-arr">↓</div>
            <div className="flow-lbl">{GAME.auditGracePeriodHours} HOURS</div>
            <div className="flow-arr">↓</div>
            <div className="flow-box warn-box">📋 STATUS: <strong style={{color:'var(--orange)'}}>AUDITED</strong><br/><span style={{color:'var(--dim)',fontSize:'11px'}}>Pay tax + {GAME.auditPenaltyPercent}% penalty to survive</span></div>
            <div className="flow-arr">↓</div>
            <div className="flow-lbl">STILL NOT PAID — {GAME.auditGracePeriodHours} MORE HOURS</div>
            <div className="flow-arr">↓</div>
            <div className="flow-box dead-box">💀 STATUS: <strong style={{color:'var(--red)'}}>EXECUTED</strong><br/><span style={{color:'#cc5555',fontSize:'11px'}}>NFT is dead — Sent to Graveyard permanently</span></div>
          </div>

          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Phase</th><th>Window</th><th>Action Required</th></tr></thead>
              <tbody>
                <tr><td>0–{GAME.auditGracePeriodHours}h</td><td>Grace Period</td><td>Pay overdue tax — no extra penalty</td></tr>
                <tr><td>{GAME.auditGracePeriodHours}–{GAME.executionGracePeriodHours}h</td><td style={{color:'var(--orange)'}}>AUDITED</td><td>Pay tax + <strong style={{color:'var(--orange)'}}>{GAME.auditPenaltyPercent}% penalty</strong></td></tr>
                <tr><td>{GAME.executionGracePeriodHours}h+</td><td style={{color:'var(--red)'}}>EXECUTED</td><td>NFT is dead. No recovery.</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* BOUNTY HUNTING */}
        <div className="section-card">
          <div className="sh">BOUNTY HUNTING</div>

          {/* Animated Hunt Flow */}
          <div className="vis-box" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:0,flexWrap:'wrap'}}>
            <div style={{textAlign:'center',padding:'6px 16px'}} className="anim-fade anim-d1">
              <div style={{fontSize:'20px'}}>🔍</div>
              <div style={{fontSize:'9px',color:'var(--dim)',letterSpacing:'1px',marginTop:'2px'}}>SPOT</div>
            </div>
            <div style={{color:'var(--dim)',fontSize:'12px',padding:'0 4px',animation:'arrowPulse 1.2s ease 0.2s infinite'}}>→</div>
            <div style={{textAlign:'center',padding:'6px 16px'}} className="anim-fade anim-d2">
              <div style={{fontSize:'20px'}}>🎯</div>
              <div style={{fontSize:'9px',color:'var(--orange)',letterSpacing:'1px',marginTop:'2px'}}>AUDIT</div>
            </div>
            <div style={{color:'var(--dim)',fontSize:'12px',padding:'0 4px',animation:'arrowPulse 1.2s ease 0.4s infinite'}}>→</div>
            <div style={{textAlign:'center',padding:'6px 16px'}} className="anim-fade anim-d3">
              <div style={{fontSize:'20px',animation:'pulse 1.5s ease infinite'}}>⚔️</div>
              <div style={{fontSize:'9px',color:'var(--red)',letterSpacing:'1px',marginTop:'2px'}}>EXECUTE</div>
            </div>
            <div style={{color:'var(--dim)',fontSize:'12px',padding:'0 4px',animation:'arrowPulse 1.2s ease 0.6s infinite'}}>→</div>
            <div style={{textAlign:'center',padding:'6px 16px'}} className="anim-fade anim-d4">
              <div style={{fontSize:'20px'}}>💰</div>
              <div style={{fontSize:'9px',color:'var(--green)',letterSpacing:'1px',marginTop:'2px',fontWeight:700}}>+{GAME.bountyReward} $PUNK</div>
            </div>
          </div>
          <p className="desc">See someone who hasn&apos;t paid tax? That&apos;s your target. Trigger their audit or execution and collect <strong>$PUNK</strong> for it. Hunt or be hunted.</p>

          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Action</th><th>Condition</th><th>Reward</th></tr></thead>
              <tbody>
                <tr><td style={{color:'var(--orange)',fontWeight:700}}>🔍 Audit</td><td>Target NFT unpaid for {GAME.auditGracePeriodHours}h+</td><td className="pos">+{GAME.bountyReward} $PUNK</td></tr>
                <tr><td style={{color:'var(--red)',fontWeight:700}}>⚔️ Execute</td><td>Target NFT unpaid after {GAME.executionGracePeriodHours}h+</td><td className="pos">+{GAME.bountyReward} $PUNK</td></tr>
              </tbody>
            </table>
          </div>

          <div className="collapse-note">💡 Same reward for both. The real payoff isn&apos;t the {GAME.bountyReward} $PUNK — it&apos;s removing a competitor. Every kill = one less Punker between you and the top {GAME.survivorTarget}.</div>
        </div>

        {/* DEATH & GRAVEYARD */}
        <div className="section-card">
          <div className="sh">DEATH & GRAVEYARD</div>
          <p className="desc">Every Punker falls into one of two categories — <strong>alive</strong> or <strong>dead</strong>. There&apos;s no in-between.</p>

          <p className="desc" style={{marginBottom:'8px'}}><strong>Survivors:</strong></p>
          <ul className="blist">
            <li>Active NFTs that are staked and paying tax</li>
            <li>Continue earning $PUNK daily</li>
            <li>Visible on the leaderboard</li>
          </ul>

          <p className="desc" style={{marginBottom:'8px',color:'var(--accent-red)',fontWeight:600}}>Graveyard:</p>
          <ul className="blist">
            <li>NFTs that were <strong>executed</strong> by other players for unpaid tax</li>
            <li>Dead NFTs stay in your wallet but <strong style={{color:'var(--accent-red)'}}>can never earn $PUNK again</strong></li>
            <li><strong style={{color:'var(--accent-red)'}}>Permanent death</strong> — no revival, no second chance, no exceptions</li>
            <li>Displayed in the Graveyard as a memorial for fallen Punkers</li>
            <li>Dead NFTs can be sold or transferred, but <strong style={{color:'var(--accent-red)'}}>death follows the token</strong> — the new owner cannot stake or earn with it either</li>
          </ul>

          <div className="alert">Once your Punker is executed, it&apos;s gone from the game forever. There is no way to bring it back — not even by selling it to someone else. Death is tied to the token ID, not the wallet. Stay alive.</div>

          <div style={{marginTop:'16px',padding:'16px 18px',background:'#0d0d0d',border:'1px solid var(--border-color)',borderLeft:'3px solid var(--accent-magenta)'}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:'8px',color:'var(--accent-magenta)',letterSpacing:'2px',marginBottom:'8px'}}>🌸 DEAD BUT NOT FORGOTTEN</div>
            <p style={{fontFamily:'var(--font-mono)',fontSize:'16px',color:'var(--text-primary)',lineHeight:'1.8',margin:0}}>When your Punker dies, you can&apos;t stake, earn, or do anything with it in-game anymore. But other players can visit your fallen Punker in the Graveyard and <strong style={{color:'var(--accent-magenta)'}}>leave a flower</strong> as a tribute. That&apos;s it. Death is permanent.</p>
          </div>
        </div>

        {/* TREASURY & REWARDS */}
        <div className="section-card">
          <div className="sh">TREASURY & REWARDS</div>

          {/* Animated Treasury Flow Visual */}
          <div className="vis-box" style={{padding:'24px 16px',position:'relative'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,background:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.008) 3px,rgba(255,255,255,0.008) 4px)',pointerEvents:'none'}}></div>
            <div style={{position:'relative',zIndex:1}}>

              {/* Sources Row */}
              <div style={{display:'flex',justifyContent:'center',gap:'16px',marginBottom:'6px'}}>
                <div style={{textAlign:'center',animation:'fadeUp 0.4s ease 0.1s both'}}>
                  <div style={{fontSize:'14px'}}>📈</div>
                  <div style={{fontSize:'8px',color:'var(--dim)',letterSpacing:'1px',marginTop:'2px'}}>TAXES</div>
                </div>
                <div style={{textAlign:'center',animation:'fadeUp 0.4s ease 0.2s both'}}>
                  <div style={{fontSize:'14px'}}>⚔️</div>
                  <div style={{fontSize:'8px',color:'var(--dim)',letterSpacing:'1px',marginTop:'2px'}}>PENALTIES</div>
                </div>
                <div style={{textAlign:'center',animation:'fadeUp 0.4s ease 0.3s both'}}>
                  <div style={{fontSize:'14px'}}>💀</div>
                  <div style={{fontSize:'8px',color:'var(--dim)',letterSpacing:'1px',marginTop:'2px'}}>FORFEIT</div>
                </div>
                <div style={{textAlign:'center',animation:'fadeUp 0.4s ease 0.4s both'}}>
                  <div style={{fontSize:'14px'}}>🔍</div>
                  <div style={{fontSize:'8px',color:'var(--dim)',letterSpacing:'1px',marginTop:'2px'}}>BOUNTIES</div>
                </div>
              </div>

              {/* Animated Arrows Down */}
              <div style={{textAlign:'center',padding:'4px 0'}}>
                <svg viewBox="0 0 200 20" style={{width:'160px',height:'20px'}}>
                  <line x1="40" y1="0" x2="40" y2="14" stroke="#555" strokeWidth="1" strokeDasharray="3,2"><animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite"/></line>
                  <line x1="80" y1="0" x2="80" y2="14" stroke="#555" strokeWidth="1" strokeDasharray="3,2"><animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite"/></line>
                  <line x1="120" y1="0" x2="120" y2="14" stroke="#555" strokeWidth="1" strokeDasharray="3,2"><animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite"/></line>
                  <line x1="160" y1="0" x2="160" y2="14" stroke="#555" strokeWidth="1" strokeDasharray="3,2"><animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite"/></line>
                  <polygon points="38,14 42,14 40,18" fill="#555"><animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite"/></polygon>
                  <polygon points="78,14 82,14 80,18" fill="#555"><animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite"/></polygon>
                  <polygon points="118,14 122,14 120,18" fill="#555"><animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite"/></polygon>
                  <polygon points="158,14 162,14 160,18" fill="#555"><animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite"/></polygon>
                </svg>
              </div>

              {/* Treasury Box */}
              <div style={{textAlign:'center',margin:'4px auto',padding:'14px 24px',border:'1px solid var(--gold)',background:'#1a1a00',maxWidth:'280px',animation:'glowPulse 2.5s ease infinite'}}>
                <div style={{fontSize:'18px',fontWeight:700,color:'var(--gold)',letterSpacing:'3px'}}>🏦 TREASURY</div>
                <div style={{fontSize:'9px',color:'var(--dim)',marginTop:'4px',letterSpacing:'1px'}}>ALL PLATFORM ACTIVITY</div>
              </div>

              {/* Arrow Down to Distribution */}
              <div style={{textAlign:'center',padding:'6px 0'}}>
                <svg viewBox="0 0 200 24" style={{width:'120px',height:'24px'}}>
                  <line x1="100" y1="0" x2="100" y2="16" stroke="var(--gold)" strokeWidth="1.5" strokeDasharray="4,3"><animate attributeName="stroke-dashoffset" from="14" to="0" dur="1.2s" repeatCount="indefinite"/></line>
                  <polygon points="96,16 104,16 100,22" fill="var(--gold)"><animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite"/></polygon>
                </svg>
              </div>

              {/* 500 Survivors Distribution */}
              <div style={{textAlign:'center',margin:'0 auto',padding:'14px 24px',border:'1px solid var(--green)',background:'#0a1a0a',maxWidth:'320px',animation:'countFade 0.8s ease 0.8s both'}}>
                <div style={{fontSize:'24px',fontWeight:700,color:'var(--green)',letterSpacing:'2px'}}>🏆 {GAME.survivorTarget} SURVIVORS</div>
                <div style={{fontSize:'9px',color:'var(--dim)',marginTop:'4px',letterSpacing:'1px'}}>SPLIT THE ENTIRE REWARD POOL</div>
              </div>

            </div>
            <div style={{position:'absolute',bottom:0,left:0,right:0,height:'1px',background:'linear-gradient(90deg,transparent,var(--gold),var(--green),transparent)'}}></div>
          </div>

          <p className="desc">All $PUNK from taxes, penalties, bounties, and forfeited earnings go into one pool — the treasury. That&apos;s the prize the last <strong>{GAME.survivorTarget} survivors</strong> are fighting over.</p>
          <p className="desc">Leaderboard rank = total $PUNK accumulated. Updates in real-time. Every tax paid, every bounty claimed, every day survived moves you up or down.</p>
          <p className="desc"><strong>How&apos;s it split?</strong> Based on your <strong>leaderboard rank</strong> among the final {GAME.survivorTarget}. Not equal. Higher rank = bigger cut. The ones who stacked the most and survived the longest eat the most.</p>
        </div>

        {/* SURVIVAL TIMELINE */}
        <div className="section-card">
          <div className="sh">SURVIVAL TIMELINE</div>
          <p className="desc">Not all Punkers are built equal. Here&apos;s when each rarity starts sweating — and when they&apos;re most likely to die:</p>

          <button className="collapse-btn">
            <span>View Survival Timeline</span>
            <span className="arrow">▼</span>
          </button>
          <div className="collapse-content">
            <div className="collapse-inner">
              <table>
                <thead><tr><th>Rarity</th><th>Struggle</th><th>Critical</th><th>Projected Death</th></tr></thead>
                <tbody>
                  <tr><td className="r-common">COMMON</td><td>Day 22+</td><td>Day 31+ (net +2)</td><td className="neg">Day 51 (break even)</td></tr>
                  <tr><td className="r-epic">EPIC</td><td>Day 31+</td><td>Day 51+ (net +8)</td><td className="warn">Survives {GAME.gameDurationDays} days</td></tr>
                  <tr><td className="r-leg">LEGENDARY</td><td>—</td><td>—</td><td className="pos">Comfortable {GAME.gameDurationDays} days</td></tr>
                  <tr><td className="r-art">1/1 ART</td><td>—</td><td>—</td><td className="pos">Untouchable</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SURVIVOR CERTIFICATE */}
        <div className="section-card">
          <div className="sh">SURVIVOR CERTIFICATE</div>
          <p className="desc">Every active Punker holder gets a <strong>Survivor Certificate</strong> — a dynamic card that shows your rank, level, and stats. It&apos;s your badge of survival in the PUNKERS game.</p>

          <div style={{margin:'20px 0',display:'flex',gap:'16px',flexWrap:'wrap'}}>
            <div style={{flex:'1',minWidth:'200px',background:'#0d0d0d',border:'1px solid var(--border-color)',padding:'16px 18px'}}>
              <div style={{fontFamily:'var(--font-display)',fontSize:'8px',color:'var(--accent-yellow)',letterSpacing:'2px',marginBottom:'8px'}}>⚡ HOW IT WORKS</div>
              <ul className="blist" style={{marginBottom:0}}>
                <li>Open your certificate from the Profile page or the 🏆 button in the navbar</li>
                <li><strong style={{color:'var(--accent-yellow)'}}>Tap the certificate</strong> to gain XP and level up</li>
                <li>Each level unlocks a new frame style and color</li>
                <li>Your level is saved permanently — it doesn&apos;t reset</li>
              </ul>
            </div>
            <div style={{flex:'1',minWidth:'200px',background:'#0d0d0d',border:'1px solid var(--border-color)',padding:'16px 18px'}}>
              <div style={{fontFamily:'var(--font-display)',fontSize:'8px',color:'var(--accent-green)',letterSpacing:'2px',marginBottom:'8px'}}>📋 LEADERBOARD</div>
              <ul className="blist" style={{marginBottom:0}}>
                <li>Your certificate level is visible on the <strong>Leaderboard</strong> next to your address</li>
                <li>Higher level = more street cred in the community</li>
                <li>Level up as much as you want — no cap, unlimited levels</li>
                <li>More certificate features coming soon</li>
              </ul>
            </div>
          </div>

          <div className="alert" style={{borderLeftColor:'var(--accent-yellow)',background:'#1a1500',color:'#ccaa33'}}>
            🏆 Certificate level is currently for leaderboard display and community status only. Gameplay rewards tied to certificate level are coming in a future update.
          </div>
        </div>

        {/* FAQ */}
        <div className="section-card">
          <div className="sh">FAQ</div>
          <FAQSection />
        </div>

      </div>
    </div>
  );
}
