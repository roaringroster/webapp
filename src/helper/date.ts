
export function toUTC(date: Date) {
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    )
  );
}

export function fromUTC(date: Date) {
  return new Date(date.toISOString().substring(0, 19));
}

/**
 * Returns the week number for this date. dowOffset is the day of week the week
 * "starts" on for your locale - it can be from 0 to 6. If dowOffset is 1 (Monday),
 * the week returned is the ISO 8601 week number.
 * @param int dowOffset
 * @return int
 */
export function getWeek(value: Date, dowOffset = 0) {
/*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.epoch-calendar.com */
	const newYear = new Date(value.getFullYear(),0,1);
	let day = newYear.getDay() - dowOffset; //the day of week the year begins on
	day = (day >= 0 ? day : day + 7);
	const daynum = Math.floor((value.getTime() - newYear.getTime() - 
	(value.getTimezoneOffset()-newYear.getTimezoneOffset())*60000)/86400000) + 1;
	let weeknum;
	//if the year starts before the middle of a week
	if (day < 4) {
		weeknum = Math.floor((daynum+day-1)/7) + 1;
		if (weeknum > 52) {
			const nYear = new Date(value.getFullYear() + 1,0,1);
			let nday = nYear.getDay() - dowOffset;
			nday = nday >= 0 ? nday : nday + 7;
			/*if the next year starts before the middle of
 			  the week, it is week #1 of that year*/
			weeknum = nday < 4 ? 1 : 53;
		}
	}
	else {
		weeknum = Math.floor((daynum+day-1)/7);
	}
	return weeknum;
};

export function toDDMMYYYY(date: Date) {
	return date.getDate().toString().padStart(2, "0")
		+ (date.getMonth() + 1).toString().padStart(2, "0")
		+ date.getFullYear()
}
