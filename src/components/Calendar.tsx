import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface CalendarProps {
  availableDates: string[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ availableDates, selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(parseISO(selectedDate));

  React.useEffect(() => {
    setCurrentMonth(parseISO(selectedDate));
  }, [selectedDate]);

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-orange-600" />
          {format(currentMonth, 'MMMM yyyy')}
        </h4>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day) => (
          <div key={day} className="text-[10px] font-bold text-gray-400 uppercase text-center">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dateStr = format(day, 'yyyy-MM-dd');
        const hasPost = availableDates.includes(dateStr);
        const isSelected = isSameDay(day, parseISO(selectedDate));
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "relative h-8 flex items-center justify-center text-xs font-medium rounded-lg transition-all",
              !isCurrentMonth ? "text-gray-200" : "text-gray-700",
              hasPost ? "cursor-pointer hover:bg-orange-50 hover:text-orange-600" : "cursor-default",
              isSelected ? "bg-orange-600 text-white hover:bg-orange-600 hover:text-white shadow-sm" : ""
            )}
            onClick={() => {
              if (hasPost) {
                onDateSelect(dateStr);
              }
            }}
          >
            <span>{format(day, 'd')}</span>
            {hasPost && !isSelected && (
              <div className={cn(
                "absolute bottom-1 w-1 h-1 rounded-full",
                isCurrentMonth ? "bg-orange-600/40" : "bg-gray-300"
              )} />
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="space-y-1">{rows}</div>;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      <div className="mt-4 pt-4 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-600" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Archived Coverage</span>
        </div>
      </div>
    </div>
  );
};
