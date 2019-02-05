import { getTarget } from '../client/date'

var expected = new Date();
expected.setMinutes(5);
if (expected < new Date())
    expected.setHours(expected.getHours() + 1)
expected.setSeconds(0);
console.assert(getTarget({ minute: 5 }).toTimeString() == expected.toTimeString(), "at x:5 minutes");
console.log(getTarget({
    applyDst: true,
    lat: 48.0927988,
    lng: 7.370460299999999,
    tz: 1,
    "rise/set": "set"
}).toLocaleString());
