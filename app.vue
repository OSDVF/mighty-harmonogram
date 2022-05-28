<template>
  <div>
    <div class="noprint">
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
      <label><input
          type="checkbox"
          v-model="showComments"
        >Komentáře</label>
      <label><input
          type="checkbox"
          v-model="showNotes"
        >Poznámky</label>
    </div>
    <div class="inline-block">
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
              tabindex="0"
              :class="bgClasses[activities[day - 1]?.rows[row-1]?.type ?? 0]"
              @contextmenu="onContextMenu($event, day-1, row-1)"
            >
              <div>
                <client-only v-if="
                editDay == day &&
                 editRow == row &&
                 (activities[day - 1]?.rows[row-1]?.touch < nowTimestamp - 2000
                  ||
                  activities[day - 1]?.rows[row-1]?.key == this.meKey
                 )
                 ">
                  <TipTap
                    v-if="!commentNotName"
                    title="Upravit název aktivity"
                    v-model="activities[day - 1].rows[row-1].name"
                    @update:modelValue="touchCell(day - 1, row - 1)"
                    @close="stopEdit()"
                  />
                </client-only>
                <div v-else>
                  <div
                    v-html="activities[day - 1]?.rows[row-1]?.name ?? ''"
                    @dblclick="startEdit(day, row, false)"
                  >
                  </div>
                  <button
                    v-if="!(activities[day - 1]?.rows[row - 1]?.name ?? false)"
                    class="startEdit"
                    @click="startEdit(day, row, false)"
                  >+ popisek</button>
                </div>
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
                  title="Upravit komentář"
                  @update:modelValue="touchCell(day - 1, row - 1)"
                  @close="stopEdit()"
                />
              </client-only>
              <div
                class="comment"
                v-else-if="activities[day - 1]?.rows[row-1]?.comment?.replace(/<(.|\n)*?>/g, '')?.trim() && showComments"
                v-html="activities[day - 1]?.rows[row-1]?.comment"
                @dblclick="startEdit(day, row, true)"
              >
              </div>
              <button
                v-if="activities[day - 1]?.rows[row - 1]?.name
                &&!(activities[day - 1]?.rows[row - 1]?.comment)"
                class="startEdit"
                @click="startEdit(day, row, true)"
              >+ komentář</button>
            </td>
          </tr>
        </tbody>
      </table>
      {{error}}
      <a
        href="https://github.com/osdvf/mighty-harmonogram"
        target="_blank"
        class="noprint"
      >GitHub Repozitář</a>
    </div>
    &ensp;&ensp;
    <template v-if="showNotes">
      <div
        class="inline-block notes"
        @click="editingNotes = true"
        v-html="note"
      >
      </div>
      <TipTap
        v-if="editingNotes"
        v-model="note"
        title="Poznámky"
        @close="editingNotes = false"
        @update:modelValue="updateNotes"
      />
    </template>
  </div>
</template>
<script>
import '~/style.scss'
import { db } from "~/firebase.js"
import { get, ref, set, onValue } from "firebase/database";
import '~/jsExtensions';
import { debounce } from 'throttle-debounce';

export default {
  data() {
    return {
      showNotes: false,
      editingNotes: false,
      note: 'Poznámky...',
      databaseKey: 'test',
      meKey: (Math.random() + 1).toString(36).substring(7),
      nowTimestamp: Date.now(),
      error: '',
      editDay: 0,
      editRow: 0,
      commentNotName: false,
      showComments: true,
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
      this.addMissingRows();
    },
    from() {
      this.addMissingDays();
      this.addMissingRows();
    },
    to() {
      this.addMissingDays();
      this.addMissingRows();
    }
  },
  beforeMount() {
    this.debouncedWrite = debounce(1000, this.writeToDatabase);
  },
  async mounted() {
    if (this.$route.hash) {
      this.databaseKey = this.$route.hash.substring(1);
    }

    try {
      await this.downloadActivities();
      onValue(ref(db, this.databaseKey), (snapshot) => {
        const data = snapshot.val();
        this.updateDisplayedData(data);
      });
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

      this.debouncedWrite();
    },
    updateNotes() {
      this.debouncedWrite();
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
      await set(ref(db, this.databaseKey), {
        activities: this.activities,
        firstDOW: this.firstDOW,
        days: this.days,
        to: this.to,
        from: this.from,
        note: this.note,
        showNotes: this.showNotes,
        showComments: this.showComments
      });
    },
    async downloadActivities() {
      var snapshot = await get(ref(db, this.databaseKey))
      if (snapshot.exists()) {
        var resultVal = snapshot.val();
        this.updateDisplayedData(resultVal);
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
            label: 'Upravit aktivitu',
            onClick: () => this.startEdit(day + 1, time + 1, false)
          },
          {
            label: 'Upravit komentář',
            onClick: () => this.startEdit(day + 1, time + 1, true)
          },
          {
            label: "Barva",
            children: [
              { label: 'white', onClick: () => this.setActivityType(day, time, 0) },
              { label: 'amber', icon: 'bg-amber', onClick: () => this.setActivityType(day, time, 1) },
              { label: 'blue', icon: 'bg-blue', onClick: () => this.setActivityType(day, time, 2) },
              { label: 'blue-grey', icon: 'bg-blue-grey', onClick: () => this.setActivityType(day, time, 3) },
              { label: 'brown', icon: 'bg-brown', onClick: () => this.setActivityType(day, time, 4) },
              { label: 'cyan', icon: 'bg-cyan', onClick: () => this.setActivityType(day, time, 5) },
              { label: 'deep-orange', icon: 'bg-deep-orange', onClick: () => this.setActivityType(day, time, 6) },
              { label: 'deep-purple', icon: 'bg-deep-purple', onClick: () => this.setActivityType(day, time, 7) },
              { label: 'green', icon: 'bg-green', onClick: () => this.setActivityType(day, time, 8) },
              { label: 'grey', icon: 'bg-grey', onClick: () => this.setActivityType(day, time, 9) },
              { label: 'indigo', icon: 'bg-indigo', onClick: () => this.setActivityType(day, time, 10) },
              { label: 'light-blue', icon: 'bg-light-blue', onClick: () => this.setActivityType(day, time, 11) },
              { label: 'light-green', icon: 'bg-light-green', onClick: () => this.setActivityType(day, time, 12) },
              { label: 'lime', icon: 'bg-lime', onClick: () => this.setActivityType(day, time, 13) },
              { label: 'orange', icon: 'bg-orange', onClick: () => this.setActivityType(day, time, 14) },
              { label: 'pink', icon: 'bg-pink', onClick: () => this.setActivityType(day, time, 15) },
              { label: 'purple', icon: 'bg-purple', onClick: () => this.setActivityType(day, time, 16) },
              { label: 'red', icon: 'bg-red', onClick: () => this.setActivityType(day, time, 17) },
              { label: 'teal', icon: 'bg-teal', onClick: () => this.setActivityType(day, time, 18) },
              { label: 'yellow', icon: 'bg-yellow', onClick: () => this.setActivityType(day, time, 19) },
            ]
          },
        ]
      });
    },
    startEdit(day, row, commentNotName) {
      var theActivity = this.activities[day - 1].rows[row - 1];
      if (theActivity.touch < Date.now() - 1000 || theActivity.key == this.meKey) {
        this.commentNotName = commentNotName;
        this.editDay = day;
        this.editRow = row;
      }
      else {
        alert("Někdo tuto buňku právě upravuje.");
      }
    },
    stopEdit() {
      this.editDay = 0;
      this.editRow = 0;
    },
    updateDisplayedData(resultVal) {
      this.activities = resultVal.activities;
      this.days = resultVal.days;
      this.from = resultVal.from;
      this.to = resultVal.to;
      this.firstDOW = resultVal.firstDOW;
      this.showComments = resultVal.showComments ?? this.showComments;
      this.note = resultVal.note || this.note;
      this.showNotes = resultVal.showNotes;
    }
  },
}
</script>