
/*
*/


if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("./service_worker.js").then(()=>console.log("Service worker registered"))

// #REGION utils

const print = console.log

function echo(x) {
  console.log(x)
  return x
}

let assertionsEnabled = true
function assert(cond) {
  if(!cond)
    throw new Error('Assertion failure')
}

function mod(a, n) {
  return ((a % n) + n) % n;
}

function upToRegexStr(word) {
  let segs = [word[0]]
  for(let i = 1; i < word.length; i++)
    segs.push(`(?:${word[i]}`)
  segs.push(')?'.repeat(word.length-1))
  return segs.join('')
}

function upToRegex(word) {
  return new RegExp(`^${upToRegexStr(word)}$`, 'gi')
}

const randomString_characters       = '_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const randomString_charactersLength = randomString_characters.length;
function randomString(length) {
  let ret = '';
  for(var i = 0; i < length; i++)
     ret += randomString_characters.charAt(Math.floor(Math.random() * randomString_charactersLength));
  return ret;
}

function elemFromTemplate(templateId, classApps) {
  const template = document.getElementById(templateId)
  assert(template != undefined)
  const ret = template.content.cloneNode(true).firstElementChild
  if(classApps != undefined)
    for(const [key, fn] of Object.entries(classApps)) {
      if(ret.matches(`.${key}`))
        fn(ret)
      for(const found of ret.querySelectorAll(`.${key}`))
        fn(found)
    }
  return ret
}

function h(tag, ...args) {
  const newElem = document.createElement(tag)
  for(const a of args) {
    if(a instanceof Function)
      a(newElem)
    else if(a instanceof HTMLElement)
      newElem.appendChild(a)
    else
      newElem.appendChild(document.createTextNode(String(a)))
  }
  return newElem
}

// #ENDREGION


// #REGION time and duration

function strToDurSpec(str) {
  const numMatches  = str.match(/\d+/gi)
  const wordMatches = str.match(/[a-z]+/gi)
  return [numMatches?.[0], wordMatches?.[0]]
}

function standardizeUnit(unit, wordstds) {
  for(const {regexps, std} of wordstds)
    for(const reg of regexps)
      if(unit.match(reg) != undefined)
        return std
  return null
}

function magUnitToDur(mag, unit) {
  switch(unit) {
    case 'seconds': return mag * 1000
    case 'minutes': return mag * 60 * 1000
    case 'hours':   return mag * 60 * 60 * 1000
    case 'days':    return mag * 24 * 60 * 60 * 1000
    case 'weeks':   return mag * 7 * 24 * 60 * 60 * 1000
    case 'months':  return mag * 30 * 24 * 60 * 60 * 1000
    case 'years':   return mag * 365 * 24 * 60 * 60 * 1000
    default: throw new Error(`Unknown unit: ${unit}`)
  }
}

const strToDur_unitSpecs = [
  {std: 'hours',   regexps: [upToRegex('hours'),    upToRegex('hr')   ]},
  {std: 'seconds', regexps: [upToRegex('seconds'), upToRegex('secs') ]},
  {std: 'minutes', regexps: [upToRegex('minutes'), upToRegex('mins') ]},
  {std: 'days',    regexps: [upToRegex('days')                       ]},
  {std: 'weeks',   regexps: [upToRegex('weeks'),   upToRegex('wks')  ]},
  {std: 'months',  regexps: [upToRegex('months')                     ]},
  {std: 'years',   regexps: [upToRegex('years'),   upToRegex('yrs')  ]}
]
function strToDur(str) {
  const lowstr = str.toLowerCase()
  let [num, unit] = strToDurSpec(lowstr)
  if(num == null)
    throw new Error(`Unknown duration: ${str}`)
  unit = (unit == null) ? 'minutes' : standardizeUnit(unit, strToDur_unitSpecs)
  return magUnitToDur(num, unit)
}

function prettyDurStr(durms) {
  const absdurms = durms < 0 ? -durms : durms
  const negativestr = durms < 0 ? '-' : ''
  const seconds = absdurms / 1000
  if(seconds < 1)
    return `< ${negativestr}1 sec`
  const minutes = seconds / 60
  if(minutes < 1)
    return `${negativestr}${Math.round(seconds)} sec`
  const hours = minutes / 60
  if(hours < 1) 
    return `${negativestr}${Math.round(minutes)} min`
  const days = hours / 24
  if(days < 1)
    return `${negativestr}${Math.round(hours)} hr`
  const weeks = days / 7
  if(weeks < 1)
    return `${negativestr}${Math.round(days)} day`
  const months = weeks / 4
  if(months < 1)
    return `${negativestr}${Math.round(weeks)} wk`
  const years = days / 365
  if(years < 1)
    return `${negativestr}${Math.round(months)} mo`
  return `${negativestr}${Math.round(years)} yr`
}

function daysUntilDay(toDayNum, nowDayNum) {
  return mod(toDayNum - nowDayNum - 1, 7) + 1
}

function dateNumDayOrigin(dateNum) {
  const date = new Date(dateNum)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function dateNumDayOffset(dateNum, fromDateNumOpt = nowDateNum()) {
  const dateOffset = dateNumDayOrigin(dateNum) - dateNumDayOrigin(fromDateNumOpt)
  return dateOffset / (24 * 60 * 60 * 1000)
}

function addTimeToDate(startDate, durms) {
  return new Date(startDate.getTime() + durms)
}
// function addTime(time, durms) { // pretty much redundant
//   return time + durms
// }

function dateNumToDate(time) {
  return new Date(time)
}

function nowDateNum() {
  return (new Date()).getTime()
}

function endOfDayDateNum() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime()
}

const dayNumbers = {'sunday': 0, 'monday': 1, 'tueday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6}
function dayNumber(day) {
  return dayNumbers[day]
}

function nextDayDate(toDayNum) {
  const now = new Date()
  const nowDayNum = now.getDay()
  const dayOffset = daysUntilDay(toDayNum, nowDayNum)
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset)
}
function nextDayDateNum(toDayNum) {
  return nextDayDate(toDayNum).getTime()
}

function containsDayName(str, day) {
  const dayRegex = new RegExp(`\\b${upToRegexStr(day)}\\b`, 'i')
  return str.match(dayRegex) != undefined
}

const strToDate_days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
function strToDate(str) {
  if(containsDayName(str, 'today') || containsDayName(str, 'now'))
    return new Date()
  // not today, maybe tomorrow?
  if(containsDayName(str, 'tomorrow'))
    return new Date()
  // not tomorrow, so try to parse as a day name
  for(const day of strToDate_days)
    if(containsDayName(str, day))
      return nextDayDate(dayNumbers[day])
  // not a day name, so try to parse as mm/dd, /dd, or mm/
  const monthDayMatch = str.match(/(\d{0,2})\/(\d{0,2})/)
  if(monthDayMatch != null) {
    let   month = monthDayMatch[1] == '' ? new Date().getMonth() : Number(monthDayMatch[1])
    const day = monthDayMatch[2] == '' ? new Date().getDate() : Number(monthDayMatch[2])
    const curDate = new Date()
    if(day < curDate.getDate())
      month++
    const year = month < new Date().getMonth() ? new Date().getFullYear() + 1 : new Date().getFullYear()
    return new Date(year, month, day)
  }
  // not a month/day, so try to parse as a day offset +dd
  const dayOffsetMatch = str.match(/\+(\d+)/)
  if(dayOffsetMatch != null) {
    const dayOffset = Number(dayOffsetMatch[1])
    const curDate = new Date()
    const day = curDate.getDate() + dayOffset
    return new Date(new Date().getFullYear(), curDate.getMonth(), day)
  }
  // not a day offset, so try to parse as dd
  const dayMatch = str.match(/(\d{1,2})/)
  if(dayMatch != null) {
    const day = Number(dayMatch[1])
    const curDate = new Date()
    const month = day < curDate.getDate() ? curDate.getMonth() + 1 : curDate.getMonth()
    return new Date(new Date().getFullYear(), month, day)
  }
  // unknown
  throw new Error(`Unknown date: ${str}`)
}
function strToDateNum(str) {
  return strToDate(str).getTime()
}

function isToday(dateNum) {
  const nowDate = new Date()
  const argDate = new Date(dateNum)
  return (nowDate.getDate() == argDate.getDate()) && (nowDate.getMonth() == argDate.getMonth()) && (nowDate.getFullYear() == argDate.getFullYear())
}

function prettyDateNumStr(dateNum) {
  const date = new Date(dateNum)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}
function prettyDateNumStrShort(dateNum) {
  const date = new Date(dateNum)
  const pm = date.getHours() > 12
  const hours = pm ? date.getHours() - 12 : date.getHours()
  return `${date.getMonth()}/${date.getDate()} ${hours}:${date.getMinutes()}${pm ? 'pm' : 'am'}`
}
function prettyDateNumStrYearMonth(dateNum) {
  const date = new Date(dateNum)
  return `${date.getMonth()}/${date.getDate()}`
}

function dateIntervalsOverlap(a, b) {
  return a.start <= b.end && b.start <= a.end
}

function fitsAtTime(timeblocks, notaskzones, dateinterval) {
  return timeblocks.every(({id, interval})=> !dateIntervalsOverlap(dateinterval, interval)) &&
         notaskzones.every(({id, interval})=> !dateIntervalsOverlap(dateinterval, interval))
}

function intervalFrom(start, durms) {
  return {start, end: start + durms}
}

function intervalRightAfter(interval, durms) {
  return {start: interval.end + 1000, end: interval.end + durms}
}

// #ENDREGION



// #REGION state

let tasks = []

async function _dbg_printStorage() {
  const opfsRoot = await navigator.storage.getDirectory()
  const storageFileHandle = await opfsRoot.getFileHandle('storage.json')
  const storageFile = await storageFileHandle.getFile()
  const contents = await storageFile.text()
  console.log(contents)
}

async function saveToStorage() {
  const opfsRoot = await navigator.storage.getDirectory()
  const storageFileHandle = await opfsRoot.getFileHandle('storage.json', {create:true})
  const storageWriter = await storageFileHandle.createWritable()
  await storageWriter.write(JSON.stringify({tasks}))
  await storageWriter.close()
}
async function loadFromStorage() {
  const opfsRoot = await navigator.storage.getDirectory()
  const storageFileHandle = await opfsRoot.getFileHandle('storage.json', {create:true})
  const storageFile = await storageFileHandle.getFile()
  const contents = await storageFile.text()
  if(contents == '')
    return
  const parsedContents = JSON.parse(contents)
  tasks = parsedContents.tasks
}

// #ENDREGION


// #REGION tasks

function logisticSigmoid(x) {
  return 1 / (1 + Math.exp(-x))
}

function calculatePriority(task, M = 5, k = 10) {
  const bp = task.basePriority
  const durHr = task.duration / (1000 * 60 * 60) // duration in hours
  return bp * (1 + (M - 1)/(k*durHr + 1)) // Shorter tasks are worth more
}

function addNewTask(content, due, duration, basePriority = '1', frequency = '', autoschedule = false) {
  // nowDateNum() + task.frequency
  const realFrequency = (frequency == "") ? null : strToDur(frequency)
  const realDue = (due == "") ? (realFrequency == null ? endOfDayDateNum() : nowDateNum() + realFrequency) : strToDateNum(due) // end of day by default
  const realDur = (duration == "") ? magUnitToDur(5, 'minutes') : strToDur(duration)
  const realBasePriority = parseInt(basePriority)
  const newTask = {content, due:realDue, duration:realDur, basePriority:realBasePriority, frequency:realFrequency, autoschedule}
  tasks.push(newTask)
  populateAllTasksElem()
  saveToStorage()
}

function findTaskIndex(id) {
  for(let i = 0; i < tasks.length; i++)
    if(tasks[i].id == id)
      return i
}

function findTaskWithID(id) {
  return tasks[findTaskIndex(id)]
}

function sortTasks() {
  const taskDays = {}
  for(const t of tasks) {
    const origin = dateNumDayOrigin(t.due)
    if(!taskDays[origin])
      taskDays[origin] = []
    taskDays[origin].push(t)
  }
  const dayOrigins = Object.keys(taskDays).map(o=> parseInt(o))
  dayOrigins.sort()
  for(const d of dayOrigins)
    taskDays[d] = taskDays[d].sort((a, b)=> a.due - b.due)
  tasks = dayOrigins.map(o=> taskDays[o]).flat()
}

const scheduleGrace = 1000 * 60 * 1 // 1 minute grace
function scheduleTasks() {
  let curTime = nowDateNum()
  for(const t of tasks) {
    if(isToday(t.due)) {
      t.scheduledTime = curTime
      curTime += t.duration + scheduleGrace
    } else {
      t.scheduledTime = t.due + (1000 * 60 * 60 * 24)
    }
  }
}

// #ENDREGION


// #REGION html

function makeTaskElem(task) {
  return elemFromTemplate('task-template', {
    basepriority:  n=> {
      n.textContent = task.basePriority
      n.addEventListener('focusout', e=> {
        task.basePriority = parseInt(n.textContent)
        sortTasks()
        scheduleTasks()
        saveToStorage()
        populateAllTasksElem()
      })
    },
    priority: n=> {
      n.textContent = Math.round(calculatePriority(task))
    },
    frequency: n=> {
      function setViewing() {
        if(task.frequency == null) {
          n.hidden = true
          return
        } else {
          n.hidden = false
          n.textContent = task.frequency != undefined ? `Every ${prettyDurStr(task.frequency)}` : ''
        }
      }
      function setEditing() {
        n.textContent = prettyDurStr(task.frequency)
      }
      setViewing()
      n.addEventListener('focusin', e=> {
        setEditing()
      })
      n.addEventListener('focusout', e=> {
        task.frequency = strToDur(n.textContent)
        sortTasks()
        scheduleTasks()
        saveToStorage()
        populateAllTasksElem()
      })
    },
    timeto: n=> {
      const nowms = nowDateNum()
      const diffms = task.scheduledTime - nowms
      n.textContent = Math.abs(diffms) < 1000 ? 'Now' : `In ${prettyDurStr(diffms)}`
    },
    duration:  n=> {
      function setViewing() {
        n.textContent = `For ${prettyDurStr(task.duration)}`
      }
      function setEditing() {
        n.textContent = prettyDurStr(task.duration)
      }
      setViewing()
      n.addEventListener('focusin', e=> {
        setEditing()
      })
      n.addEventListener('focusout', e=> {
        task.duration = strToDur(n.textContent)
        sortTasks()
        scheduleTasks()
        saveToStorage()
        populateAllTasksElem()
      })
    },
    task: n=> {
      n.dataset.id = task.id
      if(nowDateNum() > task.due)
        n.classList.add('overdue')
      if(isToday(task.scheduledTime))
        n.classList.add('today')
    },
    due: n=>{
      function setViewing() {
        n.textContent = `Due ${isToday(task.due) ? 'Today' : prettyDateNumStrYearMonth(task.due)}`
      }
      function setEditing() {
        n.textContent = prettyDateNumStrYearMonth(task.due)
      }
      setViewing()
      n.addEventListener('focusin', e=> {
        setEditing()
      })
      n.addEventListener('focusout', e=> {
        task.due = strToDateNum(n.textContent)
        sortTasks()
        scheduleTasks()
        saveToStorage()
        populateAllTasksElem()
      })
    },
    done: n=>{
      const removeTime = 1000
      let mousedownTime = 0
      function mousedown(e) {
        e.preventDefault()
        e.stopPropagation()
        mousedownTime = nowDateNum()
      }
      n.addEventListener('mousedown', mousedown)
      n.addEventListener('touchstart', mousedown)
      function mouseup(e) {
        e.preventDefault()
        e.stopPropagation()
        const curTime = nowDateNum()
        if(curTime - mousedownTime > removeTime) { // totally remove, regardless if frequency is set
          tasks.splice(tasks.indexOf(task), 1)
        } else if(task.frequency != undefined) { // go again later: adjust due date
          task.due = nowDateNum() + task.frequency
        } else { // completely done, so remove
          tasks.splice(tasks.indexOf(task), 1)
        }
        saveToStorage()
        populateAllTasksElem()
      }
      n.addEventListener('mouseup', mouseup)
      n.addEventListener('touchend', mouseup)
    },
    content: n=>{
      n.textContent = task.content
      n.addEventListener('focusout', e=> {
        task.content = n.textContent
        saveToStorage()
        populateAllTasksElem()
      })
    }
  })
}

function populateAllTasksElem() {
  const allTasksElem = document.getElementById('all-tasks')
  allTasksElem.innerHTML = ''
  for(const task of tasks) {
    const newElem = makeTaskElem(task)
    allTasksElem.appendChild(newElem)
  }
}

// #ENDREGION


document.addEventListener('DOMContentLoaded', async ()=>{
  await loadFromStorage()
  sortTasks()
  scheduleTasks()
  
  const taskSearchElem = document.getElementById('task-search')
  taskSearchElem.addEventListener('input', e=>{
    const searchstr = taskSearchElem.value.toLowerCase()
    const filteredTasks = tasks.filter(t=>t.content.toLowerCase().includes(searchstr))
    const allTasksElem = document.getElementById('all-tasks')
    allTasksElem.innerHTML = ''
    for(const task of filteredTasks) {
      const newElem = makeTaskElem(task)
      allTasksElem.appendChild(newElem)
    }
  })
  
  function addTaskUsingNewElems() {
    const newcontent      = document.getElementById('new-content')
    const newfrequency    = document.getElementById('new-frequency')
    const newbasepriority = document.getElementById('new-base-priority')
    const newdue          = document.getElementById('new-due')
    const newduration     = document.getElementById('new-duration')
    addNewTask(newcontent.value, newdue.value, newduration.value, newbasepriority.value, newfrequency.value)
    newcontent.value = ''
    sortTasks()
    scheduleTasks()
    saveToStorage()
    populateAllTasksElem()
  }
  
  const newContentButton = document.getElementById('new-content')
  newContentButton.addEventListener('keydown', e=>{
    if(e.key == 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      addTaskUsingNewElems()
    }
  })
  
  const addButtonElem = document.getElementById('new-add')
  addButtonElem.addEventListener('click', addTaskUsingNewElems)
  
  const frequencyInputElem  = document.getElementById('new-frequency')
  function checkNewFrequency() {
    if(frequencyInputElem.value == '') {
      frequencyInputElem.classList.remove('error')
      return
    }
    try {
      strToDur(frequencyInputElem.value)
      frequencyInputElem.classList.remove('error')
    } catch(err) {
      frequencyInputElem.classList.add('error')
    }
  }
  frequencyInputElem.addEventListener('input', checkNewFrequency)
  checkNewFrequency()
  
  const dueInputElem = document.getElementById('new-due')
  function checkNewDue() {
    if(dueInputElem.value == '') {
      dueInputElem.classList.remove('error')
      return
    }
    try {
      strToDateNum(dueInputElem.value)
      dueInputElem.classList.remove('error')
    } catch(err) {
      dueInputElem.classList.add('error')
    }
  }
  dueInputElem.addEventListener('input', checkNewDue)
  checkNewDue()
  
  const durationInputElem = document.getElementById('new-duration')
  function checkNewDuration() {
    if(durationInputElem.value == '') {
      durationInputElem.classList.remove('error')
      return
    }
    try {
      strToDur(durationInputElem.value)
      durationInputElem.classList.remove('error')
    } catch(err) {
      durationInputElem.classList.add('error')
    }
  }
  durationInputElem.addEventListener('input', checkNewDuration)
  checkNewDuration()
  
  const copyBackupElem = document.getElementById('copy-backup')
  copyBackupElem.addEventListener('click', e=>{
    navigator.clipboard.writeText(JSON.stringify({tasks}))
  })
  const pasteBackupElem = document.getElementById('paste-backup')
  let pasteMousedownTime = undefined
  function pasteMousedown(e) {
    e.preventDefault()
    e.stopPropagation()
    pasteMousedownTime = nowDateNum()
  }
  pasteBackupElem.addEventListener('mousedown', pasteMousedown)
  pasteBackupElem.addEventListener('touchstart', pasteMousedown)
  function pasteMouseup(e) {
    if(nowDateNum() - pasteMousedownTime < 2000)
      return
    navigator.clipboard.readText().then(text=>{
      const obj = JSON.parse(text)
      tasks = obj.tasks
      saveToStorage()
      populateAllTasksElem()
    })
  }
  pasteBackupElem.addEventListener('mouseup', pasteMouseup)
  pasteBackupElem.addEventListener('touchend', pasteMouseup)
  
  populateAllTasksElem()
  
})


