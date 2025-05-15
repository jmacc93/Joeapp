
/*
TOIMPLEMENT:
no task zones (eg: lunch, night, etc)

TODO:
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
  const months = days / 30
  if(months < 1)
    return `${negativestr}${Math.round(weeks)} wk`
  const years = days / 365
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
  for(const day of strToDate_days)
    if(containsDayName(str, day))
      return nextDayDate(dayNumbers[day])
}
function strToDateNum(str) {
  return strToDate(str).getTime()
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
let timeBlocks = []
let noTaskZones = []

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
  await storageWriter.write(JSON.stringify({tasks, timeBlocks, noTaskZones}))
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
  timeBlocks = parsedContents.timeBlocks
  noTaskZones = parsedContents.noTaskZones
}

// #ENDREGION


// #REGION time blocks / scheduled tasks

function findTimeBlock(timeblocks, notaskzones, durms, fromDateNum = nowDateNum()) {
  // try going from current time first
  let testInterval = intervalFrom(fromDateNum, durms)
  if(fitsAtTime(timeblocks, notaskzones, testInterval))
    return testInterval
  // else, try adding after currently scheduled tasks
  for(let i = 0; i < timeblocks.length; i++) {
    if(timeblocks[i].interval.end < fromDateNum)
      continue
    testInterval = intervalRightAfter(timeblocks[i].interval, durms)
    if(fitsAtTime(timeblocks, notaskzones, testInterval))
      return testInterval
  }
  // nothing fits
  return undefined
}

function sortTimeBlocks(timeBlocks) {
  timeBlocks.sort((a, b)=> a.interval.start - b.interval.start)
}

function makeScheduledElem(id, interval) {
  return elemFromTemplate('scheduled-template', {
    'scheduled-task': n=> n.dataset.id = id,
    datestr: n=>n.textContent = prettyDateNumStrShort(interval.start),
    timetostr: n=> {
      function updateTimeTo() {
        const nowms = nowDateNum()
        const diffms = interval.start - nowms
        n.textContent = Math.abs(diffms) < 1000 ? 'Now' : prettyDurStr(diffms)
      }
      const updateId = setInterval(() => { // note: the word 'interval' in setInterval means something fundamentally different from the 'interval' variable above
        if(!document.body.contains(n)) {
          clearInterval(updateId)
          return
        }
        updateTimeTo()
      }, 1000 * 60) // every minute
      updateTimeTo()
    },
    unschedule: n=> n.addEventListener('click', e=> {
      timeBlocks.splice(timeBlocks.findIndex(b=>b.id == id), 1)
      saveToStorage()
      populateScheduledElem()
    }),
    'task-spot': n=>n.replaceWith(makeTaskElem(findTaskWithID(id)))
  })
}

function populateScheduledElem() {
  const schedElem = document.getElementById('scheduled')
  schedElem.innerHTML = ''
  for(const {id, interval} of timeBlocks)
    schedElem.appendChild(makeScheduledElem(id, interval))
}

// #ENDREGION


// #REGION tasks

function logisticSigmoid(x) {
  return 1 / (1 + Math.exp(-x))
}

function calculatePriority(task, M = 3, k = 0.5) {
  const timeTo = (task.due - nowDateNum()) / (1000 * 60 * 60 * 24) // in days
  const bp = task.basePriority
  if(timeTo > 0)
    return bp * Math.exp(-k * timeTo)
  else
    return bp * M * logisticSigmoid(-k * timeTo + Math.log(1/(M - 1)))
}

function scheduleTask(id) {
  const task = findTaskWithID(id)
  const dur = task.duration
  const newblock = findTimeBlock(timeBlocks, noTaskZones, dur)
  if(newblock == undefined)
    throw new Error('Could not find time block')
  timeBlocks.push({id, interval:newblock})
  sortTimeBlocks(timeBlocks)
  populateScheduledElem()
}

function addNewTask(content, due, duration, basePriority = '1', frequency = '', autoschedule = false) {
  const realDue = (due == "") ? endOfDayDateNum() : strToDateNum(due) // end of day by default
  const realDur = (duration == "") ? magUnitToDur(5, 'minutes') : strToDur(duration)
  const realBasePriority = parseInt(basePriority)
  const realFrequency = (frequency == "") ? null : strToDur(frequency)
  const id = randomString(8)
  const newTask = {id, content, due:realDue, duration:realDur, basePriority:realBasePriority, frequency:realFrequency, autoschedule}
  tasks.push(newTask)
  populateAllTasksElem()
  if(autoschedule)
    scheduleTask(id)
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

// #ENDREGION


// #REGION html

function makeTaskElem(task) {
  return elemFromTemplate('task-template', {
    priority:  n=> {
      n.textContent = task.basePriority
    },
    frequency: n=> {
      n.textContent = task.frequency != undefined ? `Every ${prettyDurStr(task.frequency)}` : ''
    },
    duration:  n=> {
      n.textContent = `For ${prettyDurStr(task.duration)}`
    },
    task: n=> {
      n.dataset.id = task.id
      if(nowDateNum() > task.due)
        n.classList.add('overdue')
    },
    due: n=>n.textContent = `Due ${prettyDateNumStrShort(task.due)}`,
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
          task.due = task.due + task.frequency
        else // completely done, so remove
          tasks.splice(tasks.indexOf(task), 1)
        timeBlocks.splice(timeBlocks.findIndex(b=>b.id == task.id), 1)
        saveToStorage()
        populateAllTasksElem()
        populateScheduledElem()
      })
    },
    schedule: n=> n.addEventListener('click', e=> {
      const presentBlockIndex = timeBlocks.findIndex(b=>b.id == task.id)
      if(presentBlockIndex != -1) // already present, unschedule before scheduling again
        timeBlocks.splice(presentBlockIndex, 1)
      scheduleTask(task.id)
    }),
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
  const newcontent           = document.getElementById('new-content')
  const newfrequency         = document.getElementById('new-frequency')
  const newbasepriority      = document.getElementById('new-base-priority')
  const newdue               = document.getElementById('new-due')
  const newduration          = document.getElementById('new-duration')
  const newadd               = document.getElementById('new-add')
  const newautoschedule      = document.getElementById('new-autoschedule')
  const newautoscheduletext  = document.getElementById('new-autoschedule-text')
  newautoscheduletext.addEventListener('click', e=> newautoschedule.checked = !newautoschedule.checked)
  newadd.addEventListener('click', () => {
    addNewTask(newcontent.value, newdue.value, newduration.value, newbasepriority.value, newfrequency.value, newautoschedule.checked)
    newcontent.value = ''
  })
  
  const rescheduleAllElem = document.getElementById('reschedule-all')
  rescheduleAllElem.addEventListener('click', e=>{
    const priorityOrderedBlocks = structuredClone(timeBlocks)
    for(const block of priorityOrderedBlocks)
      block.task = findTaskWithID(block.id)
    priorityOrderedBlocks.sort((a, b) => calculatePriority(b.task) - calculatePriority(a.task))
    print(priorityOrderedBlocks.map(b=>calculatePriority(b.task)))
    const ids = priorityOrderedBlocks.map(b=>b.id)
    timeBlocks = []
    for(const id of ids)
      scheduleTask(id)
  })
  
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
  
  
  
  const frequencyInputElem  = document.getElementById('new-frequency')
  const parsedFrequencyElem = document.getElementById('new-frequency-parsed')
  function updateParsedFrequency() {
    const frequency = frequencyInputElem.value
    parsedFrequencyElem.textContent = (frequency == "") ? '' : strToDur(frequency)
  }
  frequencyInputElem.addEventListener('input', updateParsedFrequency)
  updateParsedFrequency()
  
  const dueInputElem = document.getElementById('new-due')
  const parsedDueElem = document.getElementById('new-due-parsed')
  function updateParsedDue() {
    const due = dueInputElem.value
    const realDue = (due == "") ? endOfDayDateNum() : strToDateNum(due)
    parsedDueElem.textContent = prettyDateNumStrShort(realDue)
  }
  dueInputElem.addEventListener('input', updateParsedDue)
  updateParsedDue()
  
  const durationInputElem = document.getElementById('new-duration')
  const parsedDurationElem = document.getElementById('new-duration-parsed')
  function updateParsedDuration() {
    const duration = durationInputElem.value
    const realDuration = (duration == "") ? null : strToDur(duration)
    parsedDurationElem.textContent = realDuration != undefined ? prettyDurStr(realDuration) : ''
  }
  durationInputElem.addEventListener('input', updateParsedDuration)
  updateParsedDuration()
  
  
  populateAllTasksElem()
  populateScheduledElem()
  
})


