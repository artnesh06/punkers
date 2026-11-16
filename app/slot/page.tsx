import SlotMachine from '@/components/game/SlotMachine';

export default function SlotPage() {
  return (
    <div className="main">
      <div className="slot-page">
        <div className="slot-hero">
          <h1>SLOT MACHINE</h1>
          <p>Spin the reels · Match symbols · Win $PUNK</p>
        </div>
        <SlotMachine />
      </div>
    </div>
  );
}
