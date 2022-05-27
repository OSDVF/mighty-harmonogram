<script setup>
useHead({
  titleTemplate: 'Mighty Harmonogram',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  charset: 'utf-8',
  meta: [
    { name: 'description', content: 'K plánování Letní Travné.' }
  ],
  script: { src: "https://cdn.tiny.cloud/1/1lwj3hyoynp6tw1pudkz7m2x9f5hrw50kylh837tzmbkv2mz/tinymce/6/tinymce.min.js", referrerpolicy: "origin" }
})
</script>

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
          >
            <div
              :class="bgClasses[activities[day - 1]?.rows[row-1]?.type ?? 0]"
              @contextmenu="onContextMenu($event, day-1, row-1)"
            >
              <client-only v-if="
              editDay == day &&
               editRow == row &&
               !commentNotName &&
               (activities[day - 1]?.rows[row-1].touch < nowTimestamp - 2000 
                || 
                activities[day - 1]?.rows[row-1].key == this.meKey
               )
               ">
                <TipTap
                  v-model="activities[day - 1].rows[row-1].name"
                  @input="touchCell(day - 1, row - 1)"
                />
              </client-only>
              <template v-else>
                {{activities[day - 1]?.rows[row-1]?.name}}
              </template>
            </div>
            <client-only v-if="activities[day - 1]?.rows[row-1] != null &&
               editDay == day &&
               editRow == row &&
               commentNotName &&
               (activities[day - 1]?.rows[row-1].touch < nowTimestamp
               || 
                activities[day - 1]?.rows[row-1].key == this.meKey
                )
               ">
              <TipTap
                v-model="activities[day - 1].rows[row-1].comment"
                @input="touchCell(day - 1, row - 1)"
              />
            </client-only>
            <div v-else>
              {{activities[day - 1]?.rows[row-1]?.comment}}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    {{error}}
  </div>
</template>
<script>
import { db } from "~/firebase.js"
import { get, ref, set } from "firebase/database";
import '~/jsExtensions';

export default {
  data() {
    return {
      meKey: (Math.random() + 1).toString(36).substring(7),
      nowTimestamp: Date.now(),
      error: '',
      editDay: 0,
      editRow: 0,
      commentNotName: false,
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
              touch: 0 //Last touched timestamp
            } */
          ]
        }
      ]
    }
  },
  watch:
  {
    days() {
      this.addMissingDays();
    }
  },
  async mounted() {
    try {
      await this.downloadActivities();
    }
    catch (e) {
      this.error = e;
    }
    this.addMissingDays();
    this.addMissingRows();

    setInterval(() => {
      this.nowTimestamp = Date.now();//Refresh editing lock
    }, 1000);
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
    touchCell(day, row) {
      this.activities[day].rows[row].touch = Date.now();
      this.activities[day].rows[row].key = this.meKey;
      // TODO sync with server
    },
    addMissingDays() {
      var missingDaysCount = this.days - this.activities.length;
      if (missingDaysCount > 0) {
        for (var i = 0; i < missingDaysCount; i++) {
          this.activities.push({
            rows: []
          });
        }
      }
    },
    addMissingRows() {
      for (var i = 0; i < this.days; i++) {
        var day = this.activities[i];
        var missingRowsCount = this.nOfRows - day.rows.length;

        if (missingRowsCount > 0) {
          for (var j = 0; j < missingRowsCount; j++) {
            this.activities[i].rows.push({
              name: '',
              type: 0,
              comment: '',
              touch: 0
            });
          }
        }
      }
    },
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
    setActivityType(day, time, type) {
      this.activities[day].rows[time].type = type;
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
            label: "Barva",
            children: [
              { label: 'white', onClick: this.setActivityType(day, time, 0) },
              { label: 'amber', icon: 'bg-amber', onClick: this.setActivityType(day, time, 1) },
              { label: 'blue', icon: 'bg-blue', onClick: this.setActivityType(day, time, 2) },
              { label: 'blue-grey', icon: 'bg-blue-grey', onClick: this.setActivityType(day, time, 3) },
              { label: 'brown', icon: 'bg-brown', onClick: this.setActivityType(day, time, 4) },
              { label: 'cyan', icon: 'bg-cyan', onClick: this.setActivityType(day, time, 5) },
              { label: 'deep-orange', icon: 'bg-deep-orange', onClick: this.setActivityType(day, time, 6) },
              { label: 'deep-purple', icon: 'bg-deep-purple', onClick: this.setActivityType(day, time, 7) },
              { label: 'green', icon: 'bg-green', onClick: this.setActivityType(day, time, 8) },
              { label: 'grey', icon: 'bg-grey', onClick: this.setActivityType(day, time, 9) },
              { label: 'indigo', icon: 'bg-indigo', onClick: this.setActivityType(day, time,) },
              { label: 'light-blue', icon: 'bg-light-blue', onClick: this.setActivityType(day, time, 10) },
              { label: 'light-green', icon: 'bg-light-green', onClick: this.setActivityType(day, time, 11) },
              { label: 'lime', icon: 'bg-lime', onClick: this.setActivityType(day, time, 12) },
              { label: 'orange', icon: 'bg-orange', onClick: this.setActivityType(day, time, 13) },
              { label: 'pink', icon: 'bg-pink', onClick: this.setActivityType(day, time, 14) },
              { label: 'purple', icon: 'bg-purple', onClick: this.setActivityType(day, time, 15) },
              { label: 'red', icon: 'bg-red', onClick: this.setActivityType(day, time, 16) },
              { label: 'teal', icon: 'bg-teal', onClick: this.setActivityType(day, time, 17) },
              { label: 'yellow', icon: 'bg-yellow', onClick: this.setActivityType(day, time, 18) },
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