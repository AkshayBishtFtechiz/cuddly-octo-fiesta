const { format, subDays } = require("date-fns");

const filterDays = (daysToSubtract) => {
  const currentDate = new Date();
  const formattedCurrentDate = format(currentDate, "MMMM dd, yyyy");

  const targetDate = subDays(currentDate, daysToSubtract);
  const formattedTargetDate = format(targetDate, "MMMM dd, yyyy");

  return {
    currentDate: currentDate,
    formattedCurrentDate: formattedCurrentDate,
    targetDate: targetDate,
    formattedTargetDate: formattedTargetDate,
    isBefore: targetDate < currentDate,
    isAfter: targetDate > currentDate,
    isEqual: targetDate.getTime() === currentDate.getTime(),
  };
};

module.exports = { filterDays };

