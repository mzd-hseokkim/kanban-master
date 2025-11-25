import './CapacityBar.css';

interface CapacityBarProps {
  allocated: number;
  capacity: number;
}

export const CapacityBar = ({ allocated, capacity }: CapacityBarProps) => {
  const percentage = capacity > 0 ? Math.min((allocated / capacity) * 100, 100) : 0;
  const isOverCapacity = allocated > capacity;

  return (
    <div className="capacity-bar">
      <div className="capacity-bar__info">
        <span className="capacity-bar__label">Capacity</span>
        <span className={`capacity-bar__value ${isOverCapacity ? 'capacity-bar__value--over' : ''}`}>
          {allocated} / {capacity} pts
        </span>
      </div>
      <div className="capacity-bar__track">
        <div
          className={`capacity-bar__fill ${isOverCapacity ? 'capacity-bar__fill--over' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
