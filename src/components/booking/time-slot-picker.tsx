import React from "react";
import { format, isBefore, isSameDay } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { useTranslation } from 'react-i18next';

interface TimeSlotPickerProps {
  date: Date;
  availableSlots: {
    startTime: Date;
    endTime: Date;
  }[];
  selectedStartTime: Date | null;
  onSelectTimeSlot: (startTime: Date, endTime: Date) => void;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  date,
  availableSlots,
  selectedStartTime,
  onSelectTimeSlot,
}) => {
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language === 'fr' ? fr : enUS;

  // Generate time slots for the day (1-hour slots from 8am to 10pm)
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 8; // 8am
    const endHour = 22; // 10pm

    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = new Date(date);
      startTime.setHours(hour, 0, 0, 0);

      const endTime = new Date(startTime);
      endTime.setHours(hour + 1, 0, 0, 0);

      // Check if slot is in the past (for today)
      const isPast =
        isSameDay(date, new Date()) && isBefore(startTime, new Date());

      // Check if slot is available (not conflicting with any reservation)
      const isAvailable =
        !isPast &&
        availableSlots.some(
          (slot) =>
            isSameDay(slot.startTime, startTime) &&
            slot.startTime.getHours() === startTime.getHours(),
        );

      slots.push({
        startTime,
        endTime,
        isAvailable,
      });
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-3">{t('timeSlotPicker.title')}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {timeSlots.map((slot, index) => {
          const isSelected = selectedStartTime
            ? format(selectedStartTime, "HH:mm") ===
            format(slot.startTime, "HH:mm")
            : false;

          return (
            <button
              key={index}
              onClick={() =>
                slot.isAvailable &&
                onSelectTimeSlot(slot.startTime, slot.endTime)
              }
              disabled={!slot.isAvailable}
              className={`
                px-3 py-2 rounded-sm text-center text-sm transition-colors
                ${isSelected
                  ? "bg-[var(--primary)] text-white"
                  : slot.isAvailable
                    ? "bg-white border border-gray-300 text-gray-700 hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    : "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed"
                }
              `}
            >
              {format(slot.startTime, "p", { locale: currentLocale })}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimeSlotPicker;
