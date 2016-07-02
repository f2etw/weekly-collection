var now = new Date();
var sundayBeforeLastSunday = new Date(now.setDate(now.getDate() - now.getDay() - 7));
this.date = new Date(sundayBeforeLastSunday - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
