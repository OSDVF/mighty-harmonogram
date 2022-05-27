<template>
  <div>
    <h1 style="display:inline-block">Harmonikogram 😎👉📈</h1>&ensp;
    <label>
      <input
        type="number"
        v-model="days"
      >
      Dní
    </label>
    &ensp;
    <label>
      Od
      <VueTimepicker v-model="from" />
    </label>
    <label>
      Do
      <VueTimepicker v-model="to" />
    </label>
    <label>
      První den:
      <select v-model="firstDOW">
        <option
          :value="index"
          v-for="(dayName, index) in dayNames"
          :key="dayName"
        >
          {{ dayName }}
        </option>
      </select>
    </label>
    <table class="schedule">
      <thead>
        <tr>
          <td>{{text.time}}</td>
          <td
            v-for="day in days"
            :key="day"
          >
            {{dayNames[(day + firstDOW - 1) % dayNames.length].capitalize()}}
          </td>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in nOfRows"
          :key="`r${row - 1}`"
        >
          <td>
            {{
                `${parseInt(from.HH) + Math.floor(row/2)}:${(row - 1)%2 ? '30':'00'}`
              }}
          </td>
          <td
            v-for="day in days"
            :key="`a${day}`"
            :class="bgClasses[activities[day - 1]?.rows[row-1]?.type ?? 0]"
            @contextmenu="onContextMenu($event, day-1, row-1)"
          >
            {{
            activities[day - 1]?.rows[row-1]?.name
          }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script>
import { db } from "~/firebase.js"
import { ref, set, child } from "firebase/database";
import '~/jsExtensions';

export default {
  data() {
    return {
      text: {
        time: 'Čas'
      },
      firstDOW: 0,
      days: 7,
      from: {
        HH: '07',
        mm: '00',
      },
      to: {
        HH: '23',
        mm: '00',
      },
      activities: [
        {
          rows: [
            /* {
              name: 'Budíček',
              type: 0,
              comment: 'ahoj<br>čau',
              halfHours: 2
            } */
          ]
        }
      ]
    }
  },
  async fetch() {
    await this.downloadActivities();
  },
  computed: {
    bgClasses() {
      const allBgs = [
        '',
        'bg-amber',
        'bg-blue',
        'bg-blue-grey',
        'bg-brown',
        'bg-cyan',
        'bg-deep-orange',
        'bg-deep-purple',
        'bg-green',
        'bg-grey',
        'bg-indigo',
        'bg-light-blue',
        'bg-light-green',
        'bg-lime',
        'bg-orange',
        'bg-pink',
        'bg-purple',
        'bg-red',
        'bg-teal',
        'bg-yellow',
      ];

      return allBgs;
    },
    nOfRows() {
      return 2 * (parseInt(this.to.HH) - parseInt(this.from.HH));
    },
    dayNames() {
      const weekdayDateMap = {
        Mon: new Date('2020-01-06T00:00:00.000Z'),
        Tue: new Date('2020-01-07T00:00:00.000Z'),
        Wed: new Date('2020-01-08T00:00:00.000Z'),
        Thu: new Date('2020-01-09T00:00:00.000Z'),
        Fri: new Date('2020-01-10T00:00:00.000Z'),
        Sat: new Date('2020-01-11T00:00:00.000Z'),
        Sun: new Date('2020-01-12T00:00:00.000Z'),
      };
      const shortWeekdays = Object.keys(weekdayDateMap);

      const getDayOfWeek = (shortName, locale = 'en-US', length = 'short') =>
        new Intl.DateTimeFormat(locale, { weekday: length }).format(weekdayDateMap[shortName]);

      const getDaysOfWeek = (locale = 'en-US', length = 'short') =>
        shortWeekdays.map(shortName => getDayOfWeek(shortName, locale, length));

      var lang = 'cs-CZ';
      if (typeof window != 'undefined') {
        lang = navigator.language;
      }
      return getDaysOfWeek(lang, 'long');
    }
  },
  methods: {
    async writeToDatabase() {
      await set(ref(db, 'activities'), this.activities);
    },
    async downloadActivities() {
      var snapshot = await get(ref(db, 'activities'))
      if (snapshot.exists()) {
        console.log(snapshot.val());
        this.activities = snapshot.val();
      } else {
        console.log("No data available");
      }
    },
    onContextMenu(event, day, time) {
      //prevent the browser's default menu
      event.preventDefault();
      //shou our menu
      this.$contextmenu({
        x: event.x,
        y: event.y,
        items: [
          {
            label: "A menu item",
            onClick: () => {
              alert("You click a menu item");
            }
          },
          {
            label: "Barva",
            children: [
              { label: 'white' },
              { label: 'amber', icon: 'bg-amber' },
              { label: 'blue', icon: 'bg-blue' },
              { label: 'blue-grey', icon: 'bg-blue-grey' },
              { label: 'brown', icon: 'bg-brown' },
              { label: 'cyan', icon: 'bg-cyan' },
              { label: 'deep-orange', icon: 'bg-deep-orange' },
              { label: 'deep-purple', icon: 'bg-deep-purple' },
              { label: 'green', icon: 'bg-green' },
              { label: 'grey', icon: 'bg-grey' },
              { label: 'indigo', icon: 'bg-indigo' },
              { label: 'light-blue', icon: 'bg-light-blue' },
              { label: 'light-green', icon: 'bg-light-green' },
              { label: 'lime', icon: 'bg-lime' },
              { label: 'orange', icon: 'bg-orange' },
              { label: 'pink', icon: 'bg-pink' },
              { label: 'purple', icon: 'bg-purple' },
              { label: 'red', icon: 'bg-red' },
              { label: 'teal', icon: 'bg-teal' },
              { label: 'yellow', icon: 'bg-yellow' },
            ]
          },
        ]
      });
    }
  },
}
</script>

<style>
:root {
  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI",
    Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji",
    "Segoe UI Symbol";
}

.schedule {
  --bg: 230, 230, 230;
  border-collapse: collapse;
}
.schedule td.day {
  border-bottom: 1px solid gray;
}

.bg-amber {
  --bg: 255, 193, 7;
}

.bg-blue {
  --bg: 33, 150, 243;
}

.bg-blue-grey {
  --bg: 96, 125, 139;
}

.bg-brown {
  --bg: 121, 85, 72;
}

.bg-cyan {
  --bg: 0, 188, 212;
}

.bg-deep-orange {
  --bg: 255, 87, 34;
}

.bg-deep-purple {
  --bg: 103, 58, 183;
}

.bg-green {
  --bg: 76, 175, 80;
}

.bg-grey {
  --bg: 158, 158, 158;
}

.bg-indigo {
  --bg: 63, 81, 181;
}

.bg-light-blue {
  --bg: 3, 169, 244;
}

.bg-light-green {
  --bg: 139, 195, 74;
}

.bg-lime {
  --bg: 205, 220, 57;
}

.bg-orange {
  --bg: 255, 152, 0;
}

.bg-pink {
  --bg: 233, 30, 99;
}

.bg-purple {
  --bg: 156, 39, 176;
}

.bg-red {
  --bg: 244, 67, 54;
}

.bg-teal {
  --bg: 0, 150, 136;
}

.bg-yellow {
  --bg: 255, 235, 59;
}

.schedule > tbody > tr:nth-child(even) > td {
  background: rgba(var(--bg), 0.2);
}
.schedule > tbody > tr:nth-child(odd) > td {
  background: rgba(var(--bg), 0.1);
}
.schedule > tbody > tr > td:first-child {
  --bg: 127, 127, 127;
}

.schedule thead td {
  background: #00000017;
  padding: 5px;
  border: 1px solid #00000050;
  border-top: none;
  border-bottom-style: dashed;
}

.schedule thead td:first-child {
  border-left: none;
}

.schedule thead td:last-child {
  border-right: none;
}

i.icon {
  height: 26px;
  background: rgb(var(--bg));
  width: 16px !important;
  margin-right: 7px;
}
</style>