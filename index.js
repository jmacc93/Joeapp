
/*
Done button should not be so close to schedule button
Task elements should show all their details (frequency, etc) and that data should be editable
Some sort of bug when scheduling old tasks amongst other scheduled old tasks: they don't go to the end like they should
Some problem with interpreting due dates
*/

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
    return null
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
  const dayOffsetMatch = str.match(/\+(\d{0,2})/)
  if(dayOffsetMatch != null) {
    const dayOffset = Number(dayOffsetMatch[1])
    const curDate = new Date()
    const day = curDate.getDate() + dayOffset
    return new Date(new Date().getFullYear(), curDate.getMonth(), day)
  }
  // not a day offset, so try to parse as dd
  const dayMatch = str.match(/(\d{0,2})/)
  if(dayMatch != null) {
    const day = Number(dayMatch[1])
    const curDate = new Date()
    const month = day < curDate.getDate() ? curDate.getMonth() + 1 : curDate.getMonth()
    return new Date(new Date().getFullYear(), month, day)
  }
  // unknown
  return null
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

function calculatePriority(task, M = 3, k = 0.5) {
  // M is max priority for overdue tasks
  // k is priority decay rate
  const timeTo = (task.due - nowDateNum()) / (1000 * 60 * 60 * 24) // in days
  const bp = task.basePriority
  if(timeTo > 0)
    return bp * Math.exp(-k * timeTo)
  else
    return bp * M * logisticSigmoid(-k * timeTo + Math.log(1/(M - 1)))
}

function addNewTask(content, due, duration, basePriority = '1', frequency = '', autoschedule = false) {
  // nowDateNum() + task.frequency
  const realFrequency = (frequency == "") ? null : strToDur(frequency)
  const realDue = (due == "") ? (frequency == null ? endOfDayDateNum() : nowDateNum() + realFrequency) : strToDateNum(due) // end of day by default
  const realDur = (duration == "") ? magUnitToDur(5, 'minutes') : strToDur(duration)
  const realBasePriority = parseInt(basePriority)
  const id = randomString(8)
  const newTask = {id, content, due:realDue, duration:realDur, basePriority:realBasePriority, frequency:realFrequency, autoschedule}
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
  tasks.sort((a, b)=> {
    const aPriority = calculatePriority(a)
    const bPriority = calculatePriority(b)
    return bPriority - aPriority
  })
}

// #ENDREGION


// #REGION html

function makeTaskElem(task) {
  return elemFromTemplate('task-template', {
    basepriority:  n=> {
      n.textContent = task.basePriority
    },
    priority: n=> {
      n.textContent = Math.round(calculatePriority(task))
    },
    frequency: n=> {
      n.textContent = task.frequency != undefined ? `Every ${prettyDurStr(task.frequency)}` : ''
    },
    timeto: n=> {
      const nowms = nowDateNum()
      const diffms = task.due - nowms
      n.textContent = Math.abs(diffms) < 1000 ? 'Now' : `In ${prettyDurStr(diffms)}`
    },
    duration:  n=> {
      n.textContent = `For ${prettyDurStr(task.duration)}`
    },
    task: n=> {
      n.dataset.id = task.id
      if(nowDateNum() > task.due)
        n.classList.add('overdue')
    },
    due: n=>n.textContent = `Due ${isToday(task.due) ? 'Today' : prettyDateNumStrYearMonth(task.due)}`,
    done: n=>{
      const removeTime = 1000
      let mousedownTime = 0
      n.addEventListener('mousedown', e=> {
        mousedownTime = nowDateNum()
      })
      n.addEventListener('mouseup', e=> {
        const curTime = nowDateNum()
        if(curTime - mousedownTime > removeTime) // totally remove, regardless if frequency is set
          tasks.splice(tasks.indexOf(task), 1)
        else if(task.frequency != undefined) // go again later: adjust due date
          task.due = nowDateNum() + task.frequency
        else // completely done, so remove
          tasks.splice(tasks.indexOf(task), 1)
        saveToStorage()
        populateAllTasksElem()
      })
    },
    content: n=>n.textContent = task.content
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
  
  const addButtonElem = document.getElementById('new-add')
  addButtonElem.addEventListener('click', () => {
    const newcontent           = document.getElementById('new-content')
    const newfrequency         = document.getElementById('new-frequency')
    const newbasepriority      = document.getElementById('new-base-priority')
    const newdue               = document.getElementById('new-due')
    const newduration          = document.getElementById('new-duration')
    addNewTask(newcontent.value, newdue.value, newduration.value, newbasepriority.value, newfrequency.value)
    newcontent.value = ''
    sortTasks()
    saveToStorage()
    populateAllTasksElem()
  })
  
  const frequencyInputElem  = document.getElementById('new-frequency')
  const parsedFrequencyElem = document.getElementById('new-frequency-parsed')
  function updateParsedFrequency() {
    const frequency = frequencyInputElem.value
    parsedFrequencyElem.textContent = frequency == '' ? '' : prettyDurStr(strToDur(frequency))
  }
  frequencyInputElem.addEventListener('input', updateParsedFrequency)
  updateParsedFrequency()
  
  const dueInputElem = document.getElementById('new-due')
  const parsedDueElem = document.getElementById('new-due-parsed')
  function updateParsedDue() {
    const due = dueInputElem.value
    const realDue = (due == "") ? endOfDayDateNum() : strToDateNum(due)
    parsedDueElem.textContent = prettyDateNumStrYearMonth(realDue)
  }
  dueInputElem.addEventListener('input', updateParsedDue)
  updateParsedDue()
  
  const durationInputElem = document.getElementById('new-duration')
  const parsedDurationElem = document.getElementById('new-duration-parsed')
  function updateParsedDuration() {
    const duration = durationInputElem.value
    parsedDurationElem.textContent = duration == '' ? '' : prettyDurStr(strToDur(duration))
  }
  durationInputElem.addEventListener('input', updateParsedDuration)
  updateParsedDuration()
  
  
  populateAllTasksElem()
  
})


