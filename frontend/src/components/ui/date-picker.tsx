import { useState } from 'react';
import {
  format,
  parse,
  isValid,
  setYear,
  setMonth,
  addMonths,
  subMonths,
  getYear,
  getMonth,
} from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type View = 'years' | 'months' | 'days';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  'aria-invalid'?: boolean;
}

export function DatePicker({
  value,
  onChange,
  disabled,
  placeholder = 'Pick a date',
  'aria-invalid': ariaInvalid,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('days');
  const [inputValue, setInputValue] = useState(value);
  const [inputError, setInputError] = useState(false);

  const parsed = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;

  const today = new Date();
  const [displayMonth, setDisplayMonth] = useState<Date>(selected ?? today);
  const [yearBase, setYearBase] = useState<number>(
    Math.floor(getYear(selected ?? today) / 12) * 12,
  );

  const displayYear = getYear(displayMonth);
  const displayMonthIndex = getMonth(displayMonth);
  const yearsOnPage = Array.from({ length: 12 }, (_, i) => yearBase + i);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      const base = selected ?? today;
      setDisplayMonth(base);
      setYearBase(Math.floor(getYear(base) / 12) * 12);
      setInputValue(value);
      setInputError(false);
      setView('days');
    }
  }

  function handleDaySelect(day: Date | undefined) {
    const formatted = day ? format(day, 'yyyy-MM-dd') : '';
    setInputValue(formatted);
    setInputError(false);
    onChange(formatted);
    setOpen(false);
  }

  function handleInputChange(raw: string) {
    setInputValue(raw);
    setInputError(false);
    if (raw.length < 10) return;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const d = parse(raw, 'yyyy-MM-dd', new Date());
      if (isValid(d)) {
        setDisplayMonth(d);
        setYearBase(Math.floor(getYear(d) / 12) * 12);
        setView('days');
        onChange(raw);
      } else {
        setInputError(true);
      }
    } else {
      setInputError(true);
    }
  }

  function handleClear() {
    setInputValue('');
    setInputError(false);
    onChange('');
    setOpen(false);
  }

  function openYearView() {
    setYearBase(Math.floor(displayYear / 12) * 12);
    setView('years');
  }

  const navBtn = cn(
    buttonVariants({ variant: 'outline' }),
    'h-7 w-7 p-0 opacity-60 hover:opacity-100',
  );

  const gridBtn = (active: boolean) =>
    cn(
      'w-full rounded-md py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
      active && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
    );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className={cn(
            'w-full justify-start text-left font-normal',
            !selected && 'text-muted-foreground',
            ariaInvalid && 'border-destructive focus-visible:ring-destructive',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, 'MMM d, yyyy') : placeholder}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[280px] p-0" align="start">
        {/* ── Year grid ── */}
        {view === 'years' && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <button type="button" className={navBtn} onClick={() => setYearBase((b) => b - 12)}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold">
                {yearBase} – {yearBase + 11}
              </span>
              <button type="button" className={navBtn} onClick={() => setYearBase((b) => b + 12)}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {yearsOnPage.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => {
                    setDisplayMonth(setYear(displayMonth, yr));
                    setView('months');
                  }}
                  className={cn(
                    gridBtn(yr === displayYear),
                    yr === getYear(today) && yr !== displayYear && 'font-semibold text-primary',
                  )}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Month grid ── */}
        {view === 'months' && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <button type="button" className={navBtn} onClick={() => setView('years')}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="text-sm font-semibold hover:text-primary transition-colors"
                onClick={openYearView}
              >
                {displayYear}
              </button>
              <div className="h-7 w-7" />
            </div>
            <div className="grid grid-cols-3 gap-1">
              {MONTHS.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setDisplayMonth(setMonth(displayMonth, i));
                    setView('days');
                  }}
                  className={gridBtn(i === displayMonthIndex)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Day grid ── */}
        {view === 'days' && (
          <div className="pb-2">
            <div className="flex items-center justify-between px-3 pt-3 pb-1">
              <button
                type="button"
                className={navBtn}
                onClick={() => setDisplayMonth((m) => subMonths(m, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="text-sm font-semibold hover:text-primary transition-colors"
                onClick={openYearView}
              >
                {format(displayMonth, 'MMMM yyyy')}
              </button>
              <button
                type="button"
                className={navBtn}
                onClick={() => setDisplayMonth((m) => addMonths(m, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleDaySelect}
              month={displayMonth}
              onMonthChange={setDisplayMonth}
              showOutsideDays
              components={{ Caption: () => null }}
              classNames={{
                months: 'flex flex-col',
                month: '',
                table: 'w-full border-collapse',
                head_row: 'flex px-3',
                head_cell: 'text-muted-foreground w-8 text-center font-normal text-[0.75rem]',
                row: 'flex w-full px-3 mt-1',
                cell: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:rounded-md [&:has([aria-selected])]:bg-accent',
                day: 'h-8 w-8 inline-flex items-center justify-center rounded-md p-0 text-sm font-normal hover:bg-accent hover:text-accent-foreground transition-colors aria-selected:opacity-100',
                day_selected:
                  'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                day_today: 'bg-accent text-accent-foreground font-semibold',
                day_outside: 'text-muted-foreground opacity-40',
                day_disabled: 'text-muted-foreground opacity-30',
                day_hidden: 'invisible',
              }}
            />
          </div>
        )}

        {/* ── Footer: manual input + clear ── always visible ── */}
        <div className="flex items-center gap-2 px-3 py-2 border-t">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="YYYY-MM-DD"
              maxLength={10}
              className={cn(
                'h-7 w-full rounded-md border bg-background px-2 py-1 text-sm shadow-sm',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                inputError ? 'border-destructive focus-visible:ring-destructive' : 'border-input',
              )}
            />
            {inputError && (
              <span className="absolute -bottom-4 left-0 text-[10px] text-destructive whitespace-nowrap">
                Invalid date
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
          >
            Clear
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
