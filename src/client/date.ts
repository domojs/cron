import * as akala from '@akala/core'
const debug = akala.log('ifttt:date');

function calcTimeJulianCent(jd)
{
    var T = (jd - 2451545.0) / 36525.0
    return T
}

function calcJDFromJulianCent(t)
{
    var JD = t * 36525.0 + 2451545.0
    return JD
}

function isLeapYear(yr) 
{
    return ((yr % 4 == 0 && yr % 100 != 0) || yr % 400 == 0);
}

function calcDoyFromJD(jd)
{
    var z = Math.floor(jd + 0.5);
    var f = (jd + 0.5) - z;
    if (z < 2299161)
    {
        var A = z;
    } else
    {
        let alpha = Math.floor((z - 1867216.25) / 36524.25);
        var A = z + 1 + alpha - Math.floor(alpha / 4);
    }
    var B = A + 1524;
    var C = Math.floor((B - 122.1) / 365.25);
    var D = Math.floor(365.25 * C);
    var E = Math.floor((B - D) / 30.6001);
    var day = B - D - Math.floor(30.6001 * E) + f;
    var month = (E < 14) ? E - 1 : E - 13;
    var year = (month > 2) ? C - 4716 : C - 4715;

    var k = (isLeapYear(year) ? 1 : 2);
    var doy = Math.floor((275 * month) / 9) - k * Math.floor((month + 9) / 12) + day - 30;
    return doy;
}


function radToDeg(angleRad) 
{
    return (180.0 * angleRad / Math.PI);
}

function degToRad(angleDeg) 
{
    return (Math.PI * angleDeg / 180.0);
}

function calcGeomMeanLongSun(t)
{
    var L0 = 280.46646 + t * (36000.76983 + t * (0.0003032))
    while (L0 > 360.0)
    {
        L0 -= 360.0
    }
    while (L0 < 0.0)
    {
        L0 += 360.0
    }
    return L0    	// in degrees
}

function calcGeomMeanAnomalySun(t)
{
    var M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    return M;		// in degrees
}

function calcEccentricityEarthOrbit(t)
{
    var e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
    return e;		// unitless
}

function calcSunEqOfCenter(t)
{
    var m = calcGeomMeanAnomalySun(t);
    var mrad = degToRad(m);
    var sinm = Math.sin(mrad);
    var sin2m = Math.sin(mrad + mrad);
    var sin3m = Math.sin(mrad + mrad + mrad);
    var C = sinm * (1.914602 - t * (0.004817 + 0.000014 * t)) + sin2m * (0.019993 - 0.000101 * t) + sin3m * 0.000289;
    return C;		// in degrees
}

function calcSunTrueLong(t)
{
    var l0 = calcGeomMeanLongSun(t);
    var c = calcSunEqOfCenter(t);
    var O = l0 + c;
    return O;		// in degrees
}

function calcSunTrueAnomaly(t)
{
    var m = calcGeomMeanAnomalySun(t);
    var c = calcSunEqOfCenter(t);
    var v = m + c;
    return v;		// in degrees
}

function calcSunRadVector(t)
{
    var v = calcSunTrueAnomaly(t);
    var e = calcEccentricityEarthOrbit(t);
    var R = (1.000001018 * (1 - e * e)) / (1 + e * Math.cos(degToRad(v)));
    return R;		// in AUs
}

function calcSunApparentLong(t)
{
    var o = calcSunTrueLong(t);
    var omega = 125.04 - 1934.136 * t;
    var lambda = o - 0.00569 - 0.00478 * Math.sin(degToRad(omega));
    return lambda;		// in degrees
}

function calcMeanObliquityOfEcliptic(t)
{
    var seconds = 21.448 - t * (46.8150 + t * (0.00059 - t * (0.001813)));
    var e0 = 23.0 + (26.0 + (seconds / 60.0)) / 60.0;
    return e0;		// in degrees
}

function calcObliquityCorrection(t)
{
    var e0 = calcMeanObliquityOfEcliptic(t);
    var omega = 125.04 - 1934.136 * t;
    var e = e0 + 0.00256 * Math.cos(degToRad(omega));
    return e;		// in degrees
}

function calcSunRtAscension(t)
{
    var e = calcObliquityCorrection(t);
    var lambda = calcSunApparentLong(t);
    var tananum = (Math.cos(degToRad(e)) * Math.sin(degToRad(lambda)));
    var tanadenom = (Math.cos(degToRad(lambda)));
    var alpha = radToDeg(Math.atan2(tananum, tanadenom));
    return alpha;		// in degrees
}

function calcSunDeclination(t)
{
    var e = calcObliquityCorrection(t);
    var lambda = calcSunApparentLong(t);

    var sint = Math.sin(degToRad(e)) * Math.sin(degToRad(lambda));
    var theta = radToDeg(Math.asin(sint));
    return theta;		// in degrees
}

function calcEquationOfTime(t)
{
    var epsilon = calcObliquityCorrection(t);
    var l0 = calcGeomMeanLongSun(t);
    var e = calcEccentricityEarthOrbit(t);
    var m = calcGeomMeanAnomalySun(t);

    var y = Math.tan(degToRad(epsilon) / 2.0);
    y *= y;

    var sin2l0 = Math.sin(2.0 * degToRad(l0));
    var sinm = Math.sin(degToRad(m));
    var cos2l0 = Math.cos(2.0 * degToRad(l0));
    var sin4l0 = Math.sin(4.0 * degToRad(l0));
    var sin2m = Math.sin(2.0 * degToRad(m));

    var Etime = y * sin2l0 - 2.0 * e * sinm + 4.0 * e * y * sinm * cos2l0 - 0.5 * y * y * sin4l0 - 1.25 * e * e * sin2m;
    return radToDeg(Etime) * 4.0;	// in minutes of time
}

function calcHourAngleSunrise(lat, solarDec)
{
    var latRad = degToRad(lat);
    var sdRad = degToRad(solarDec);
    var HAarg = (Math.cos(degToRad(90.833)) / (Math.cos(latRad) * Math.cos(sdRad)) - Math.tan(latRad) * Math.tan(sdRad));
    var HA = Math.acos(HAarg);
    return HA;		// in radians (for sunset, use -HA)
}

function isNumber(inputVal) 
{
    var oneDecimal = false;
    var inputStr = "" + inputVal;
    for (var i = 0; i < inputStr.length; i++) 
    {
        var oneChar = inputStr.charAt(i);
        if (i == 0 && (oneChar == "-" || oneChar == "+"))
        {
            continue;
        }
        if (oneChar == "." && !oneDecimal) 
        {
            oneDecimal = true;
            continue;
        }
        if (oneChar < "0" || oneChar > "9")
        {
            return false;
        }
    }
    return true;
}


function zeroPad(n, digits)
{
    n = n.toString();
    while (n.length < digits)
    {
        n = '0' + n;
    }
    return n;
}

function month(name, numdays, abbr) 
{
    this.name = name;
    this.numdays = numdays;
    this.abbr = abbr;
}

var monthList = new Array();
var i = 0;
monthList[i++] = new month("January", 31, "Jan");
monthList[i++] = new month("February", 28, "Feb");
monthList[i++] = new month("March", 31, "Mar");
monthList[i++] = new month("April", 30, "Apr");
monthList[i++] = new month("May", 31, "May");
monthList[i++] = new month("June", 30, "Jun");
monthList[i++] = new month("July", 31, "Jul");
monthList[i++] = new month("August", 31, "Aug");
monthList[i++] = new month("September", 30, "Sep");
monthList[i++] = new month("October", 31, "Oct");
monthList[i++] = new month("November", 30, "Nov");
monthList[i++] = new month("December", 31, "Dec");


function getJD(date)
{
    if (typeof (date) == 'undefined')
        date = new Date();

    var docmonth = date.getMonth() + 1
    var docday = date.getDate()
    var docyear = date.getYear() + 1900
    if (docmonth <= 2)
    {
        docyear -= 1
        docmonth += 12
    }
    var A = Math.floor(docyear / 100)
    var B = 2 - A + Math.floor(A / 4)

    var JD = Math.floor(365.25 * (docyear + 4716)) + Math.floor(30.6001 * (docmonth + 1)) + docday + B - 1524.5

    return JD
}

function IsDST(day, month, dayOfWeek)
{
    //January, february, and december are out.
    if (month < 3 || month > 11)
        return false;
    //April to October are in
    if (month > 3 && month < 11)
        return true;

    var previousSunday = day - dayOfWeek;
    //In march, we are DST if our previous sunday was on or after the 8th.
    if (month == 3)
        return previousSunday >= 8;
    //In november we must be before the first sunday to be dst.
    //That means the previous sunday must be before the 1st.
    return previousSunday <= 0;
}

function dayString(jd: number, next: boolean, flag: 1): Date
function dayString(jd: number, next: boolean, flag: 2 | 3 | 4): string
function dayString(jd: number, next: boolean, flag: 1 | 2 | 3 | 4)
{
    // returns a string in the form DDMMMYYYY[ next] to display prev/next rise/set
    // flag=2 for DD MMM, 3 for DD MM YYYY, 4 for DDMMYYYY next/prev
    if ((jd < 900000) || (jd > 2817000))
    {
        throw new Error(`not support jd (${jd})`);
    }
    else
    {
        var z = Math.floor(jd + 0.5);
        var f = (jd + 0.5) - z;
        var A = z;
        if (z >= 2299161)
        {
            let alpha = Math.floor((z - 1867216.25) / 36524.25);
            A = z + 1 + alpha - Math.floor(alpha / 4);
        }
        var B = A + 1524;
        var C = Math.floor((B - 122.1) / 365.25);
        var D = Math.floor(365.25 * C);
        var E = Math.floor((B - D) / 30.6001);
        var day = B - D - Math.floor(30.6001 * E) + f;
        var month = (E < 14) ? E - 1 : E - 13;
        var year = ((month > 2) ? C - 4716 : C - 4715);
        switch (flag)
        {
            case 1:
                return new Date(year, month - 1, day);
            case 2:
                return zeroPad(day, 2) + " " + monthList[month - 1].abbr;
            case 3:
                return zeroPad(day, 2) + monthList[month - 1].abbr + year.toString();
            case 4:
                return zeroPad(day, 2) + monthList[month - 1].abbr + year.toString() + ((next) ? " next" : " prev");
        }
    }
    return;
}

function timeDateString(JD, minutes)
{
    var date = dayString(JD, false, 1);
    date.setMinutes(minutes);
    return date;
}

function timeString(minutes, flag)
{

    if ((minutes >= 0) && (minutes < 1440))
    {
        var time = new Date();

        var floatHour = minutes / 60.0;
        var hour = Math.floor(floatHour);
        if (hour < time.getHours())
            time.setDate(time.getDate() + 1);

        var floatMinute = 60.0 * (floatHour - Math.floor(floatHour));
        var minute = Math.floor(floatMinute);
        var floatSec = 60.0 * (floatMinute - Math.floor(floatMinute));
        var second = Math.floor(floatSec + 0.5);
        if (second > 59)
        {
            second = 0
            minute += 1
        }
        if ((flag == 2) && (second >= 30)) minute++;
        if (minute > 59)
        {
            minute = 0
            hour += 1
        }
        time.setHours(hour);
        time.setMinutes(minute);
        time.setSeconds(second);
        return time;
    } else
    {
        var output = "error"
    }
    return output;
}

function calcSunriseSetUTC(rise, JD, latitude, longitude)
{
    var t = calcTimeJulianCent(JD);
    var eqTime = calcEquationOfTime(t);
    var solarDec = calcSunDeclination(t);
    var hourAngle = calcHourAngleSunrise(latitude, solarDec);
    //alert("HA = " + radToDeg(hourAngle));
    if (!rise)
        hourAngle = -hourAngle;
    var delta = longitude + radToDeg(hourAngle);
    var timeUTC = 720 - (4.0 * delta) - eqTime;	// in minutes
    // console.log("t:"+t);
    // console.log("eqTime:"+eqTime);
    // console.log("solarDec:"+solarDec);
    // console.log("hourAngle:"+hourAngle);
    // console.log("delta:"+delta);
    //console.log("timeUTC:"+timeUTC);
    return timeUTC
}

function calcSunriseSet(rise, JD, latitude, longitude, timezone, dst)
// rise = 1 for sunrise, 0 for sunset
{
    var timeUTC = calcSunriseSetUTC(rise, JD, latitude, longitude);
    var newTimeUTC = calcSunriseSetUTC(rise, JD + timeUTC / 1440.0, latitude, longitude);
    if (isNumber(newTimeUTC))
    {
        var timeLocal = newTimeUTC + (timezone * 60.0)
        timeLocal += ((dst) ? 60.0 : 0.0);
        if ((timeLocal >= 0.0) && (timeLocal < 1440.0)) 
        {
            return timeDateString(JD, timeLocal);
        }
        else  
        {
            var jday = JD
            var increment = ((timeLocal < 0) ? 1 : -1)
            while ((timeLocal < 0.0) || (timeLocal >= 1440.0)) 
            {
                timeLocal += increment * 1440.0
                jday -= increment
            }
            return timeDateString(jday, timeLocal)
        }
    } else
    {
        // no sunrise/set found
        var doy = calcDoyFromJD(JD)
        if (((latitude > 66.4) && (doy > 79) && (doy < 267)) ||
            ((latitude < -66.4) && ((doy < 83) || (doy > 263))))
        {
            var jdy: number;
            //previous sunrise/next sunset
            if (rise)
            { // find previous sunrise
                jdy = calcJDofNextPrevRiseSet(0, rise, JD, latitude, longitude, timezone, dst)
            } else
            { // find next sunset
                jdy = calcJDofNextPrevRiseSet(1, rise, JD, latitude, longitude, timezone, dst)
            }
            return dayString(jdy, false, 3)
        }
        else
        {
            //previous sunset/next sunrise
            if (rise == 1)
            { // find previous sunrise
                jdy = calcJDofNextPrevRiseSet(1, rise, JD, latitude, longitude, timezone, dst)
            } else
            { // find next sunset
                jdy = calcJDofNextPrevRiseSet(0, rise, JD, latitude, longitude, timezone, dst)
            }
            return dayString(jdy, false, 3)
        }
    }
}

function calcJDofNextPrevRiseSet(next, rise, JD, latitude, longitude, tz, dst)
{
    var julianday = JD;
    var increment = ((next) ? 1.0 : -1.0);

    var time = calcSunriseSetUTC(rise, julianday, latitude, longitude);
    while (!isNumber(time))
    {
        julianday += increment;
        time = calcSunriseSetUTC(rise, julianday, latitude, longitude);
    }
    var timeLocal = time + tz * 60.0 + ((dst) ? 60.0 : 0.0)
    while ((timeLocal < 0.0) || (timeLocal >= 1440.0))
    {
        var incr = ((timeLocal < 0) ? 1 : -1)
        timeLocal += (incr * 1440.0)
        julianday -= incr
    }
    return julianday;
}

function calculate(lat, lng, tz, dst, date)
{
    var jday = getJD(date)
    debug('computing');
    return { rise: calcSunriseSet(1, jday, lat, lng, tz, dst), set: calcSunriseSet(0, jday, lat, lng, tz, dst) };
}
export function getTarget(fields: { minute?: number, hour?: number, day?: number[], exceptions?: number[], date?: number | 'last', month?: number, lat?: number, lng?: number, tz?: number, 'rise/set'?: 'rise' | 'set', applyDst?: boolean }, target?: Date): Date
{
    var now = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);
    if (typeof (target) == 'undefined')
    {
        target = new Date();
        target.setSeconds(0);
        target.setMilliseconds(0);
    }

    if (typeof (fields.minute) != 'undefined')
    {
        target.setMinutes(fields.minute);
        if (target <= now)
            target.setHours(target.getHours() + 1);
    }
    if (typeof (fields.hour) != 'undefined')
    {
        target.setHours(fields.hour);
        if (target <= now)
            target.setDate(target.getDate() + 1);
    }
    else if (typeof (fields.minute) != 'undefined' && target <= now)
        target.setHours(target.getHours() + 1);
    if (typeof (fields.day) != 'undefined')
    {
        while (akala.grep(fields.day || [0, 1, 2, 3, 4, 5, 6], function (element) { return element == target.getDay() }).length === 0)
        {
            target.setDate(target.getDate() + 1);
        }
    }
    else if (typeof (fields.hour) != 'undefined' && target <= now)
        target.setDate(target.getDate() + 1);
    if (typeof (fields.date) != 'undefined')
    {
        if (fields.date == 'last')
        {
            var lastDay = new Date(target.getTime());
            lastDay.setDate(1);
            lastDay.setMonth(lastDay.getMonth() + 1);
            lastDay.setDate(0);
            target.setDate(lastDay.getDate());
        }
        else if (fields.date <= 28)
            target.setDate(fields.date);
        if (target <= now)
        {
            target.setDate(target.getDate() + 1);
            return getTarget(fields, target);
        }
    }
    if (typeof (fields.month) != 'undefined')
    {
        target.setMonth(fields.month);
        if (target <= now)
            target.setFullYear(target.getFullYear() + 1);
    }
    else if (typeof (fields.date) != 'undefined' && target <= now)
        target.setMonth(target.getMonth() + 1);

    if (fields.exceptions)
    {
        for (var i in fields.exceptions)
        {
            var exception = new Date(fields.exceptions[i]);
            if (exception.getHours() == 0 && exception.getMinutes() == 0)
            {
                if (target >= exception)
                {
                    exception.setDate(exception.getDate() + 1)
                    if (target < exception)
                    {
                        target.setDate(target.getDate() + 1);
                        getTarget(fields, target);
                    }
                }
            }
        }
    }

    if (typeof (fields['rise/set']) != 'undefined')
    {
        var tmpTarget = calcSunriseSet(fields['rise/set'] == 'rise' ? 1 : 0, getJD(target), fields.lat, fields.lng, fields.tz, fields.applyDst && IsDST(target.getDay(), target.getMonth(), target.getDate()));
        if (typeof (tmpTarget) == 'string')
        {
            throw new Error(tmpTarget);
        }
        target = tmpTarget;
        if (target <= now)
        {
            target.setDate(target.getDate() + 1);
            return getTarget(fields, target);
        }
    }
    debug(target);

    return target;
}