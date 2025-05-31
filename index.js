

/*
*/


if("serviceWorker" in navigator)
  navigator.serviceWorker.register("./service_worker.js").then(()=>console.log("Service worker registered"))

// #REGION utils

const print = console.log

function echo(x) {
  console.log(x)
  return x
}

let assertionsEnabled = true
function assert(cond) {
  if(assertionsEnabled && !cond)
    throw new Error('Assertion failure')
}
function rtassert(cond) {
  if(!cond)
    throw new Error('Assertion failure')
}

function logisticSigmoid(x) {
  return 1 / (1 + Math.exp(-x))
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


function floorTo(x, r) {
  return Math.floor(x / r) * r
}

function ceilingTo(x, r) {
  return Math.ceil(x / r) * r
}

function roundTo(x, r) {
  return Math.round(x / r) * r
}

function* range(a, b, step=1) {
  for(let x = a; x <= b; x += step)
    yield x
}


const randomString_characters       = '_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const randomString_charactersLength = randomString_characters.length;
function randomString(length) {
  let ret = '';
  for(var i = 0; i < length; i++)
     ret += randomString_characters.charAt(Math.floor(Math.random() * randomString_charactersLength));
  return ret;
}


function appOn(x, ...fns) {
  for(const f of fns)
    f(x)
  return x
}

function todo() {
  print('TODO')
}

// #ENDREGION


// #REGION  html support

const _p = Symbol('private')
function getElemPropr(elem) {
  if(!(_p in elem))
    elem[_p] = {}
  return elem[_p]
}

function h(tag, ...args) {
  const newElem = document.createElement(tag)
  for(const a of args) {
    if(a instanceof Function)
      a(newElem)
    else if(a instanceof HTMLElement)
      newElem.appendChild(a)
    else if(a == undefined)
      continue
    else
      newElem.appendChild(document.createTextNode(String(a)))
  }
  return newElem
}
function df(...args) {
  const newFrag = document.createDocumentFragment()
  for(const a of args) {
    if(a instanceof Function)
      a(newFrag)
    else if(a instanceof HTMLElement)
      newFrag.appendChild(a)
    else if(a == undefined)
      continue
    else
      newFrag.appendChild(document.createTextNode(String(a)))
  }
  return newFrag
}

function setElemId(id) {
  return n=> n.id = id
}
function setElemClass(...classes) {
  return n=> n.classList.add(...classes)
}

function makeIntoCheckbutton(opts) {
  const elem = opts.elem
  if(elem == undefined) // turn into a lambda:
    return n=>makeIntoCheckbutton(Object.assign(opts, {elem: n}))
  elem.classList.add('checkbutton')
  const toggleClass = opts.toggleClass ?? 'on'
  const toggleFunc  = opts.toggleFunc ?? ((_e,_s)=>{})
  let state = opts.initialState ?? false
  elem.classList.toggle(toggleClass, state)
  elem.addEventListener('click', e=> {
    state = !state
    elem.classList.toggle(toggleClass, state)
    toggleFunc(elem, state)
  })
}

function makeIntoTextualInput(opts) {
  // if opts has an .elem value, then use that
  const elem = opts.elem
  // otherwise turn this call into a lambda that takes an element (for use in h)
  if(elem == undefined)
    return n=>makeIntoTextualInput({elem: n, ...opts})
  //
  const elemP = getElemPropr(elem)
  elem.classList.add('textualinput')
  const {tovaluefn, displayfn, totextfn, checkfn} = opts
  elem.setAttribute('contenteditable', 'true')
  elem.spellcheck = false
  elemP.value = opts.initialValue
  elem.textContent = displayfn(elemP.value)
  // prevent using enter to make a newline
  elem.addEventListener('beforeinput', e=> {
    if(e.inputType == "insertParagraph") {
      e.preventDefault()
      e.stopPropagation()
      document.body.focus()
    }
  })
  // check for errors on each new char
  elem.addEventListener('input', e=> {
    try {
      checkfn?.(elem.textContent) // errors cause to skip next line
      elem.classList.remove('error')
    } catch(err) {
      elem.classList.add('error')
    }
  })
  elem.addEventListener('focus', e=> {
    try {
      elem.textContent = totextfn(elemP.value)
      elem.classList.remove('error')
    } catch(err) {
      elem.classList.add('error')
    }
  })
  elem.addEventListener('focusout', e=> {
    try {
      elemP.value = tovaluefn(elem.textContent)
      elem.classList.remove('error')
    } catch(err) {
      elem.classList.add('error')
    }
    elem.textContent = displayfn(elemP.value)
  })
  // .setValue is to allow other elements to modify this element's internal value more-or-less easily
  elem[_p].setValue = function(newValue) {
    try {
      elem.textContent = displayfn(newValue)
      elemP.value = newValue
      elem.classList.remove('error')
    } catch(err) {
    elem.classList.add('error')}
  }
}

const cssSegments = []
function addCss(str) {
  cssSegments.push(str)
}
function collectCss() {
  return cssSegments.join('\n')
}

addCss(`
  .multiselector > .choice {
    background: rgba(0, 0, 0, 5%);
    padding: 0;
    border: none;
    margin-left: 2px;
  }
  .multiselector > .choice.chosen {
    background: rgba(0, 0, 255, 10%);
  }
`)
function makeMultiselector(label, selectionfn, ...choices) {
  return h('span', setElemClass('multiselector'),
    h('span', setElemClass('label'), label),
    n=>{
      const msp = getElemPropr(n) // assure we have a _p property
      msp.value = undefined
      msp.clear = function() {
        msp.value = undefined
        n.querySelectorAll(':scope > .choice').forEach(n=>n.classList.toggle('chosen', false))
      }
    },
    ...choices.map(([name, value])=>h('button', setElemClass('choice'), name,
      n=>n.addEventListener('click', e=>{
        const multiselector = n.parentElement
        const msp = getElemPropr(multiselector)
        const isCurChosen = n.classList.contains('chosen')
        msp.clear()
        if(isCurChosen)
          return // unchose and do nothing more
        msp.value = value
        selectionfn(value)
        n.classList.toggle('chosen', true)
      })
    ))
  )
}

function addClickHoldListener(...args) {
  if(args.length == 2) {
    const [delay, fn] = args
    return elem=>addClickHoldListener(elem, delay, fn)
  }
  // else, args.length >= 3
  const [elem, delay, fn] = args
  assert(elem instanceof HTMLElement)
  let timeoutid = undefined
  elem.addEventListener('mousedown', e=> {
    timeoutid = setTimeout(()=> { fn(elem) }, delay)
  })
  elem.addEventListener('mouseup', e=> {
    clearTimeout(timeoutid)
  })
}

// #ENDREGION



// #REGION time and duration

const minuteMsCount = 1000 * 60
const hourMsCount   = minuteMsCount * 60
const dayMsCount    = hourMsCount * 24
const weekMsCount   = dayMsCount * 7
const monthMsCount  = weekMsCount * 4

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

/// Gives the datenum for the same time on the day offset number of days in the past or future
/// Use offset = -1 for yesterday, +1 for tomorrow, +2 for two days from now, etc
function offsetDateNumDays(datenum, offset) {
  return datenum + 1000 * 60 * 60 * 24 * offset
}

/// Gives the datenum for the same time on the following day
function tomorrowDateNum(datenum) {
  return offsetDateNumDays(datenum, 1)
}

/// Gives the datenum for the same time on the previous day
function yesterdayDateNum(datenum) {
  return offsetDateNumDays(datenum, -1)
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

function hourMinStrToDayMs(str) {
  const hourMinMatch = str.match(/^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*$/)
  rtassert(hourMinMatch != null)
  const hourMatch = hourMinMatch[1]
  const minMatch  = hourMinMatch[2]
  const ampmMatch = hourMinMatch[3]
  let   hours   = Number(hourMatch)
  const minutes = Number(minMatch ?? 0)
  const ampm    = (ampmMatch ?? '').toLowerCase()
  if(ampm === 'pm')
    hours += 12
  else if(ampm === 'am' && hours === 12)
    hours = 0
  return hours * hourMsCount  +  minutes * minuteMsCount // ms from midnight
}

function hourMinStrToDateNum(dayOrigin, str) {
  const msFromMidnight = hourMinStrToDayMs(str);
  return new Date(dayOrigin).getTime() + msFromMidnight
}

function hourMinStrToDayMins(str) {
  return hourMinStrToDayMs(str) / minuteMsCount
}

function dayMsToHourMinStr(dayms) {
  const hours = Math.floor(dayms / hourMsCount) % 24
  const minutes = Math.floor((dayms % hourMsCount) / (60 * 1000))
  const ampm = hours >= 12 ? 'pm' : 'am'
  const h = hours == 0 ? 12 : (hours > 12 ? hours - 12 : hours)
  const m = minutes < 10 ? '0' + minutes : minutes
  return `${h}:${m} ${ampm}`
}

function dateNumToHourMinStr(datenum) {
  const date = new Date(datenum)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'pm' : 'am'
  const h = ampm == 'pm' ? hours - 12 : hours
  const m = minutes < 10 ? '0' + minutes : minutes
  return `${h}:${m} ${ampm}`
}

function dateNumToDayMsCount(datenum) {
  const dayOrigin = dateNumDayOrigin(datenum)
  return datenum - dayOrigin
}

function strToTime(str) {
  const colonMatch = str.match(/(\d{1,2}):(\d{2})(am|pm)/)
  if(colonMatch != null) {
    let hours = Number(colonMatch[1])
    const minutes = Number(colonMatch[2])
    const ampm = colonMatch[3].toLowerCase()
    if(ampm === 'pm')
      hours += 12
    else if(ampm === 'am' && hours === 12)
      hours = 0
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes).getTime()
  }
  const hoursMatch = str.match(/(\d{1,2})(am|pm)/)
  if(hoursMatch != null) {
    let hours = Number(hoursMatch[1])
    const ampm = hoursMatch[2].toLowerCase()
    if(ampm === 'pm')
      hours += 12
    else if(ampm === 'am' && hours === 12)
      hours = 0
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, 0).getTime()
  }
  throw new Error(`Unknown time: ${str}`)
}
function strToTimeDateNum(str) {
  return strToTime(str).getTime()
}

function isPastDay(dateNum) {
  return dateNum < dateNumDayOrigin(nowDateNum())
}

function isToday(dateNum) {
  const nowDate = dateNumDayOrigin(nowDateNum())
  const argDate = dateNumDayOrigin(dateNum)
  return nowDate == argDate
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

function dateIntervalsOverlap(startA, durA, startB, durB) {
  return startA <= startB + durB && startB <= startA + durA
}

function dayMinsTo12HourMin(minute) {
  let hour = Math.floor(minute / 60)
  const ampm = hour < 12 ? 'am' : 'pm'
  if(hour > 12)
    hour -= 12
  const minrem = minute % 60
  return [hour, minrem, ampm]
}

function dayMinsTo12HourMinStr(minute) {
  const [hr, min, ampm] = dayMinsTo12HourMin(minute)
  return `${String(hr).padStart(2,'0')}:${String(min).padStart(2,'0')} ${ampm}`
}

function dateNumToDayMins(datenum) {
  const date = new Date(datenum)
  const mins = date.getHours() * 60 + date.getMinutes()
  return mins
}
function dateNumTo12HourMinStr(datenum) {
  return dayMinsTo12HourMinStr(dateNumToDayMins(datenum))
}

function dateNumTo12HourMin(datenum) {
  return dayMinsTo12HourMin(dateNumToDayMins(datenum))
}

function dateNumLast5Min(datenum) {
  const dayOrigin = dateNumDayOrigin(datenum)
  const diff = datenum - dayOrigin
  const nearest5Min = floorTo(diff, 5 * 60 * 1000)
  return dayOrigin + nearest5Min
}
function dateNumNext5Min(datenum) {
  const dayOrigin = dateNumDayOrigin(datenum)
  const diff = datenum - dayOrigin
  const nearest5Min = ceilingTo(diff, 5 * 60 * 1000)
  return dayOrigin + nearest5Min
}

// #ENDREGION



// #REGION state

// these 3 set by loadFromStorage (and saved via saveToStorage)
let tasks = []
let daystart = 1000 * 60 * 60 * 6
let dayend = 1000 * 60 * 60 * (12 + 10)

/// Finds the start of the working day for the given datenum (regardless the time of that datenum)
function dateNumToDayStart(datenum) {
  return dateNumDayOrigin(datenum) + daystart
}

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
  await storageWriter.write(JSON.stringify({tasks, daystart, dayend}))
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
  tasks    = parsedContents.tasks
  daystart = parsedContents.daystart
  dayend   = parsedContents.dayend
}

// #ENDREGION


// #REGION tasks

function findTaskIndexById(id) {
  return tasks.findIndex(t=>t.id == id)
}

function findTaskById(id) {
  const index = findTaskIndexById(id)
  return (index != -1) ? tasks[index] : undefined
}

function randomNewTaskId() {
  while(true) {
    const id = randomString(5)
    if(findTaskIndexById(id) == -1)
      return id
  }
}

function calculatePriority(task, M = 5, k = 10) {
  const imp = task.isimportant ? 10 : 0
  const durHr = task.duration / (1000 * 60 * 60) // duration in hours
  return imp + (1 + (M - 1)/(k*durHr + 1)) // Shorter tasks are worth more
}

function funnelToDurNum(value) {
  if(typeof value == 'number')
    return value
  else if(typeof value == 'string')
    return strToDur(value)
}

function funnelToDateNum(value) {
  if(typeof value == 'number')
    return value
  else if(typeof value == 'string')
    return 
}

function addNewTask(optsarg) {
  const opts = Object.assign({}, optsarg)
  //
  opts.duration = 
    (typeof opts.duration == 'number') ? 
      opts.duration : 
    (typeof opts.duration == 'string') ?
      strToDur(opts.duration) :
      5 * minuteMsCount
  //
  opts.dayOrigin =
    (typeof opts.dayOrigin == 'number') ? 
      opts.dayOrigin :
    (typeof opts.dayOrigin == 'string') ?
      strToDateNum(opts.dayOrigin) :
      nowDateNum()
  opts.dayOrigin = dateNumDayOrigin(opts.dayOrigin)
  //
  opts.frequency =
    (typeof opts.frequency == 'number') ? 
      opts.frequency :
    (typeof opts.frequency == 'string') ?
      strToDur(opts.frequency) :
      null
  //
  opts.frequency =
    (typeof opts.frequency == 'number') ? 
      opts.frequency :
    (typeof opts.frequency == 'string') ?
      strToDur(opts.frequency) :
      null
  //
  opts.defaultNow ??= nowDateNum()
  //
  opts.daydatenum =
  (typeof opts.daydatenum == 'number') ? 
    opts.daydatenum :
  (typeof opts.daydatenum == 'string') ?
    strToDateNum(opts.daydatenum) :
    opts.daydatenum
  opts.daydatenum = dateNumDayOrigin(opts.daydatenum)
  //
  opts.attime =
  (typeof opts.attime == 'number') ? 
    opts.attime :
  (typeof opts.attime == 'string') ?
    hourMinStrToDayMins(opts.attime) :
    0
  //
  opts.isimportant  ??= false
  opts.fixedtime    ??= false
  opts.autoschedule ??= true
  opts.content      ??= ''
  //
  const datenum = opts.daydatenum + opts.attime
  const scheduled = findFirstAvailableTimeBlock(opts.duration, datenum)
  const id = randomNewTaskId()
  const newTask = {
    id:              id, 
    content:         opts.content, 
    duration:        opts.duration,
    frequency:       opts.frequency, 
    lastCompleted:   undefined,
    isimportant:     opts.isimportant,
    scheduled:       scheduled,
    fixedtime:       opts.fixedtime,
    autoschedule:    opts.autoschedule
  }
  tasks.push(newTask)
  sortTasksByTime()
  updateCurrentPage()
  saveToStorage()
}

function sortTasksByTime() {
  tasks.sort((a, b)=> a.scheduled - b.scheduled)
}

function timeBlockAvailable(start, dur) {
  const dayOrigin = dateNumDayOrigin(start)
  const startDayMsnum = start - dayOrigin
  if(startDayMsnum < daystart || startDayMsnum + dur > dayend)
    return false
  for(const t of tasks)
    if(dateIntervalsOverlap(start, dur, t.scheduled, t.duration))
      return false
  return true
}

function scheduleTask(task, afterDatenumArg = undefined) {
  // first remove the task (if applicable) from the tasks list so it doesn't collide with itself
  const i = findTaskIndexById(task.id)
  if(i != -1)
    tasks.splice(i, 1)
  // now find a time and set the time
  let afterDatenum = afterDatenumArg ?? task.scheduled
  let availableTime
  if(task.fixedtime) {
    const taskDayMsCount = dateNumToDayMsCount(task.scheduled) // note: fixedtime demands .scheduled be set
    availableTime = findFirstAvailableTimeBlockFixedTime(task.duration, taskDayMsCount, afterDatenum)
  } else {
    availableTime = findFirstAvailableTimeBlock(task.duration, afterDatenum)
  }
  task.scheduled = availableTime
  // finally, readd to tasks list if applicable
  if(i != -1) {
    tasks.push(task)
    sortTasksByTime()
  }
}

function isRegularTask(task) {
  return (task.frequency != null)
}

function shouldScheduleAtRegularTime(task) {
  return isRegularTask(task) && (task.lastCompleted != null)
}

function nextRegularTime(task) {
  const nextTime = task.lastCompleted + task.frequency
  // tasks longer than a day should be rounded down to the day
  return (task.frequency > dayMsCount) ? dateNumDayOrigin(nextTime) : nextTime
}

/// Note: this just removes, schedules, then adds the given tasks in priority order
/// only use this function when all the tasks in `taskList` are already in `tasks`
/// Note: this function respects regular tasks' regular times
function rescheduleMultiple(taskListArg, afterDatenumArg = undefined) {
  // don't reschedule non autoscheduled tasks:
  const taskList = taskListArg.filter(t=>t.autoschedule)
  taskList.sort((a, b)=>calculatePriority(b)-calculatePriority(a))
  // remove all taskList tasks from global tasks
  const taskIds = new Set(taskList.map(t=>t.id))
  tasks = tasks.filter(t=>!taskIds.has(t.id))
  // now schedule and add each successively
  for(const t of taskList) {
    const toScheduleDatenum =
      isRegularTask(t) && shouldScheduleAtRegularTime(t) ?
        Math.max(afterDatenumArg, nextRegularTime(t)) :
        afterDatenumArg
    scheduleTask(t, toScheduleDatenum)
    tasks.push(t)
  }
  sortTasksByTime()
}

/// reschedules important then nonimportant tasks
/// all tasks in taskList should be in global tasks
function scheduleImportantThenNonimportant(taskList, datenum) {
  // first schedule important tasks
  const importantTasks = taskList.filter(t=> t.isimportant ?? false)
  rescheduleMultiple(importantTasks, datenum)
  // then non-important tasks
  const nonimportantTasks = taskList.filter(t=> !(t.isimportant ?? false))
  rescheduleMultiple(nonimportantTasks, datenum)
}

function rescheduleAllDue() {
  sortTasksByTime()
  const curDatenum = nowDateNum()
  const dueTasks = tasks.filter(t=> (t.scheduled + t.duration < curDatenum) && t.autoschedule)
  // reschedule tasks with fixed times first, to not prevent others from getting scheduled at their fixed times
  scheduleImportantThenNonimportant(dueTasks.filter(t=> t.fixedtime), curDatenum)
  // then reschedule non-fixed time tasks
  scheduleImportantThenNonimportant(dueTasks.filter(t=> !t.fixedtime), curDatenum)
}

function rescheduleAll() {
  scheduleImportantThenNonimportant(tasks.filter(t=>t.autoschedule), nowDateNum())
}

/// just like findFirstAvailableTimeBlock but only checks the given time on consecutive days
function findFirstAvailableTimeBlockFixedTime(dur, fixedDayMsCount, afterDatenum = nowDateNum()) {
  // we have to only start looking after the given afterDatenum
  const afterDayOrigin = dateNumDayOrigin(afterDatenum)
  // if afterDatenum's time is after fixed time, then use next day after afterDatenum, otherwise use afterDatenum's day
  const searchStartDayOrigin = dateNumToDayMsCount(afterDatenum) > fixedDayMsCount ? afterDayOrigin + dayMsCount : afterDayOrigin
  const searchDateNum = searchStartDayOrigin + fixedDayMsCount
  for(let d = 0; d < 80; d++) { // check 80 days ahead
    const candidateTime = searchDateNum + d * dayMsCount
    if(timeBlockAvailable(candidateTime, dur))
      return candidateTime
  }
  // nothing fits
  return undefined
}

function findFirstAvailableTimeBlock(dur, afterDatenum = nowDateNum()) {
  const now = nowDateNum()
  const toCheck = []
  // try starting now, at afterDatenum, or at the start of the day of afterDatenum, whichever is biggest
  toCheck.push(Math.max(afterDatenum, now, dateNumToDayStart(afterDatenum)))
  // else, try adding after each currently scheduled task and day start in order
  for(const t of tasks) { // check all tasks after afterDatenum
    const endtime = t.scheduled + t.duration
    if(afterDatenum < endtime)
      toCheck.push(endtime + 1)
  }
  const todayStartTime = dateNumDayOrigin(afterDatenum) + daystart
  for(let d = 1; d < 20; d++) // check 20 days ahead
    toCheck.push(todayStartTime + d * dayMsCount)
  // we add all of the above so we can interleave the day start times with task times
  toCheck.sort() // do the interleaving
  // now we can check those times
  for(const checkDatenum of toCheck) {
    const start = dateNumNext5Min(checkDatenum)
    if(timeBlockAvailable(start, dur))
      return start
  }
  // nothing fits
  return undefined
}

addCss(`
  .task > .top {
    display: flex;
    flex-direction: row;
    height: 25px;
  }
  .task > .top > * {
    margin-right: 1em;
  }
`)
function makeTaskElem(ogtask) {
  const id = ogtask.id
  return h('div', setElemClass('task'), setElemClass(`task-${id}`),
    h('div', setElemClass('top'),
      h('button', setElemClass('done', 'iconbutton'), '✔', n=> {
        n.addEventListener('click', e=> {
          const index = findTaskIndexById(id)
          const task = tasks[index]
          task.lastCompleted = nowDateNum()
          if(shouldScheduleAtRegularTime(task)) // reschedule `.frequency` ms out
            scheduleTask(task, nextRegularTime(task))
          else  // just remove
            tasks.splice(index, 1)
          saveToStorage()
          updateCurrentPage()
        })
      }),
      h('button', setElemClass('autoschedule', 'checkbutton'), 'As', makeIntoCheckbutton({
        initialState: ogtask.autoschedule,
        toggleFunc: (_e, state)=>{
          const task = findTaskById(id)
          task.autoschedule = state
          saveToStorage()
        }
      })),
      ogtask.fixedtime ? null : h('button', setElemClass('later', 'iconbutton'), '↧', n=> n.addEventListener('click', e=> {
          const task = findTaskById(id)
          scheduleTask(task, task.scheduled + hourMsCount) // after 1 hour
          saveToStorage()
          updateCurrentPage()
        })
      ),
      h('button', setElemClass('tomorrow','iconbutton'), '↦', n=> n.addEventListener('click', e=> {
        const task = findTaskById(id)
        scheduleTask(task, dateNumDayOrigin(task.scheduled) + dayMsCount) // next day
        saveToStorage()
        updateCurrentPage()
      })),
      (ogtask.frequency == null ?
        h('button', setElemClass('iconbutton'), '↺', n=> n.addEventListener('click', e=>{
          const task = findTaskById(id)
          task.frequency = 1 * dayMsCount
          saveToStorage()
          updateCurrentPage()
        })) :
        h('span', setElemClass('frequency'), makeIntoTextualInput({
            initialValue: ogtask.frequency,
            tovaluefn: text=>{
              const task = findTaskById(id)
              task.frequency = (text == '') ? null : strToDur(text)
              saveToStorage()
              updateCurrentPage()
              return task.frequency
            },
            totextfn: v=>prettyDurStr(v),
            displayfn: v=>`Every ${prettyDurStr(v)}`
          })
        )
      ),
      h('button', setElemClass('iconbutton'), '◬', makeIntoCheckbutton({
        toggleFunc: (_, state)=>{
          const task = findTaskById(id)
          task.fixedtime = state
          saveToStorage()
        }
      }))
    ),
    h('div', setElemClass('content'), n=> {
      n.setAttribute('contenteditable', "true")
      n.spellcheck = false
      n.textContent = ogtask.content
      n.addEventListener('focusout', e=> {
        const task = findTaskById(id)
        task.content = n.textContent
        saveToStorage()
      })
    })
  )
}


// #ENDREGION

// #REGION timeline page

// time tick css
addCss(`
  .time-tick.past {
    opacity: 50%;
  }
  .empty-block-time.past {
    background-color: color-mix(in srgb, lightgray, white 80%)
  }

  .time-tick.now {
    background-color: color-mix(in srgb, yellow, white 80%);
  }

  .time-tick.morning {
    color: blue;
  }
  .time-tick.afternoon {
    color: red;
  }
  .time-tick.onhour {
    font-weight: bold;
  }
`)
function makeTickElem(minute, dayRelation) {
  return h('div', setElemClass('time-tick'), n=> {
    const curTodayMins = floorTo(dateNumToDayMins(nowDateNum()), 5)
    const isPast    = dayRelation == 'past'
    const isToday   = dayRelation == 'today'
    const _isFuture = dayRelation == 'future'
    if(isPast || (isToday && minute < curTodayMins))
      n.classList.add('past')
    n.dataset.minute = minute
    let hour = Math.floor(minute / 60)
    const ampm = hour < 12 ? 'am' : 'pm'
    if(hour > 12)
      hour -= 12
    const minrem = minute % 60
    n.textContent = `${hour}:${String(minrem).padStart(2, '0')}`
    if(minrem == 0)
      n.classList.add('onhour')
    n.classList.add(ampm == 'am' ? 'morning' : 'afternoon')
    if(isToday && floorTo(minute, 5) === floorTo(curTodayMins, 5))
      n.classList.add('now')
  })
}

function makeTickSequenceElems(startDateNum, endDateNum, incrementMins = 5, dayRelation) {
  const ret = []
  const startMins = dateNumToDayMins(startDateNum)
  const endMins   = dateNumToDayMins(endDateNum)
  const nowMins   = ceilingTo(dateNumToDayMins(nowDateNum()), 1)
  const nowWithinRange = (startMins < nowMins) && (nowMins < endMins)
  const checkNowTick = (dayRelation == 'today') && nowWithinRange
  let didNowTick  = false
  let lastHourMins = ceilingTo(startMins, 60)
  for(let minute = startMins; minute <= endMins; minute = floorTo(minute, 5) + incrementMins) {
    if(minute > lastHourMins)
      ret.push(makeTickElem(lastHourMins, dayRelation))
    // if(checkNowTick && nowWithinRange && !didNowTick && nowMins < lastHourMins) {
    //   ret.push(makeTickElem(nowMins, dayRelation))
    //   didNowTick = true
    // }
    const tick = makeTickElem(minute, dayRelation)
    if(checkNowTick && !didNowTick && minute > nowMins) {
      didNowTick = true
      tick.classList.add('now')
    }
    ret.push(tick)
    lastHourMins = ceilingTo(minute+1, 60)
  }
  return ret
}

function makeEmptyBlockElem(startDateNum, endDateNum, dayRelation) {
  const isLongSequence = (endDateNum - startDateNum) / hourMsCount > 2 // over 2 hours? Use larger tick increments
  const tickIncrements = isLongSequence ? 15 : 5
  return h('div', setElemClass('empty-block'),
    ...makeTickSequenceElems(startDateNum, endDateNum, tickIncrements, dayRelation).map(n => {
      n.classList.add('empty')
      if(!n.classList.contains('past')) { // if not in the past
        n.addEventListener('click', e=>{
          // add this time to the at input
          const timelineElem = document.getElementById('timeline-page')
          const atInputElem = timelineElem.querySelector('.new-at')
          atInputElem[_p].setValue(Number(n.dataset.minute))
        })
      }
      return n
    })
  )
}

// task block css
addCss(`
  .task-block {
    padding: 2px;
    margin: 2px;
    border: 1px solid black;
    background-color: color-mix(in srgb, green, white 95%);
    border-radius: 6px;
    box-shadow: lightgray 4px 4px 0;
    display: flex;
    flex-direction: row;
  }
  .task-block > .task-area {
    width: 100%;
  }

  .task-block > .task {
    margin-left: 1em;
    flex-grow: 1;
  }
  .task-block > .task > .content {
    width: 100%;
    box-sizing: border-box;
    background: none;
    border: none;
    resize: none;
  }
  .task-block.important {
    background-color: color-mix(in srgb, red, white 95%)
  }
`)
function makeTaskBlockElem(task, dayRelation) {
  const isLongSequence = task.duration / hourMsCount > 2 // over 2 hours? Use larger tick increments
  const tickIncrements = isLongSequence ? 15 : 5
  return h('div', setElemClass('task-block'), task.isimportant ? setElemClass('important') : null,
    h('div', setElemClass('ticks'), ...makeTickSequenceElems(task.scheduled, task.scheduled + task.duration, tickIncrements, dayRelation)), // 5 means 5 minute tick increments
    makeTaskElem(task)
  )
}

function addTimelineBlocks(datenum, dayRelation) {
  const timelineElem = document.getElementById('timeline-page')
  const blocksElem = timelineElem.querySelector('.time-blocks')
  blocksElem.innerHTML = ''
  const dayOrigin = dateNumDayOrigin(datenum)
  const tasksToday = tasks.filter(t=> dateNumDayOrigin(t.scheduled) == dayOrigin)
  tasksToday.sort((a,b)=>a.scheduled - b.scheduled)
  const dayStartDateNum = dayOrigin + daystart
  const dayEndDateNum = dayOrigin + dayend
  let lastTime = dayStartDateNum
  for(const t of tasksToday) {
    // push empty block from last time to start of this task's block
    if(Math.abs(lastTime - t.scheduled) > 1000*60*5)
      blocksElem.appendChild(makeEmptyBlockElem(lastTime, t.scheduled, dayRelation))
    // push task's block as well
    blocksElem.appendChild(makeTaskBlockElem(t, dayRelation))
    lastTime = t.scheduled + t.duration
  }
  // push empty block after last task if appropriate
  if(lastTime < dayEndDateNum)
    blocksElem.appendChild(makeEmptyBlockElem(lastTime, dayEndDateNum, dayRelation))
}

function updateTimelinePage() {
  let scrollToNow = false
  if(timelineDatenum == undefined) {
    scrollToNow = true
    timelineDatenum = nowDateNum()
  }
  // update date selector day
  const timelineElem = document.getElementById('timeline-page')
  const dateSelectorElem = timelineElem.querySelector('.date-selector')
  const date = new Date(timelineDatenum)
  dateSelectorElem.value = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
  // and populate timeline elem
  const dayRelation = isPastDay(timelineDatenum) ? 'past' : isToday(timelineDatenum) ? 'today' : 'future'
  addTimelineBlocks(timelineDatenum, dayRelation)
  if(scrollToNow)
    document.querySelector('.time-tick.now').scrollIntoView()
}

let timelineDatenum = undefined
function setTimelineDay(datenum) {
  timelineDatenum = dateNumDayOrigin(datenum) + 1
  if(currentPage == 'timeline-page')
    updateCurrentPage()
}

function addTaskUsingNewElems(rootElemSelector) {
  const rootElem = document.querySelector(rootElemSelector)
  const newcontent      = rootElem.querySelector('.new-content')
  const newfrequency    = rootElem.querySelector('.new-frequency')
  const newimportant    = rootElem.querySelector('.new-important')
  const newat           = rootElem.querySelector('.new-at')
  const newduration     = rootElem.querySelector('.new-duration')
  const newFixedTime    = rootElem.querySelector('.new-fixed-time')
  if(newFixedTime.checked  &&  newat.value == '') {
    errorPopup(`A time must be given when the time is fixed`)
    return
  }
  addNewTask({
    daydatenum:   timelineDatenum,
    content:      newcontent.value,
    duration:     newduration[_p].value,
    attime:       newat[_p].value * 60 * 1000,
    frequency:    newfrequency[_p].value,
    isimportant:  newimportant.classList.contains('on'),
    fixedtime:    newFixedTime.classList.contains('on')
  })
  newcontent.value = ''
  saveToStorage()
}

const timelineDaySwipeTransitionDistance = () => window.innerWidth / 3;

// timeline css
addCss(`
  #timeline-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 98vw;
    overflow: hidden;
  }

  #timeline-page > .new-task-area {
    border: 1px solid black;
  }
  #timeline-page > .new-task-area  .new-content {
    width: 70%;
    resize: none;
  }
  #timeline-page > .new-task-area > * > * {
    margin-right: 1em;
  }
  #timeline-page > .new-task-area input[type='number'] {
    width: 10%;
  }
  #timeline-page > .new-task-area .error {
    background-color: color-mix(in srgb, white, red 10%);
  }

  #timeline-page > .timeline {
    overflow-y: scroll;
    overflow-x: clip;
    height: 100%;
  }

  #timeline-page > .timeline > .timeline-overscroll {
    height: 300px;
  }
  
  #timeline-page > .command-line {
    height: 30px;
  }
`)
function makeTimelinePage() {
  return h('div', setElemId('timeline-page'),
    h('div', setElemClass('new-task-area'),
      h('div',
        h('span', 'Do'),
        h('input', setElemClass('new-content'), n=> {
          n.type = 'text'
          n.addEventListener('keydown', e=>{
            if(e.key == 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              addTaskUsingNewElems('#timeline-page')
            }
          })
        })
      ),
      h('div',
        // h('span', setElemId('new-duration'), makeIntoTextualInput({
        //   initialValue: null,
        //   tovaluefn: v=> (v == '') ? null : strToDur(v),
        //   checkfn: strToDur,
        //   totextfn: v=>(v == null) ? '' : prettyDurStr(v),
        //   displayfn: v=> (v == null) ? `Duration?` : `For ${prettyDurStr(v)}`
        // })),
        appOn(makeMultiselector('For',
          v=>{},
          ['5 m', 5*minuteMsCount],
          ['15 m', 15*minuteMsCount],
          ['30 m', 30*minuteMsCount],
          ['1 hr', 1*hourMsCount],
          ['2 hr', 2*hourMsCount],
          ['4 hr', 4*hourMsCount],
        ), setElemClass('new-duration')),
        h('span', setElemClass('new-frequency'), makeIntoTextualInput({
          initialValue: null,
          tovaluefn: v=> (v == '') ? null : strToDur(v),
          checkfn: strToDur,
          totextfn: v=>(v == null) ? '..' : prettyDurStr(v),
          displayfn: v=> (v == null) ? `Periodic?` : `Every ${prettyDurStr(v)}`
        })),
        h('span', setElemClass('new-at'), makeIntoTextualInput({
          initialValue: null,
          tovaluefn: txt=> (txt == '') ? null : hourMinStrToDayMins(txt),
          checkfn: txt=> (txt == '') ? null : hourMinStrToDayMins(txt),
          totextfn: v=> (v == null) ? '' : dayMinsTo12HourMinStr(v),
          displayfn: v=> (v == null) ? `Time?` : `At ${dayMinsTo12HourMinStr(v)}`
        })),
        h('button', setElemClass('new-important'), '!!', makeIntoCheckbutton({initialState: false})),
        h('button', setElemClass('new-fixed-time'), '◬', makeIntoCheckbutton({initialState: false})),
      )
    ),
    h('div', setElemClass('command-line'),
      h('button', setElemClass('options-tab'), setElemClass('page-link', 'iconbutton'), '⚙', n=> n.addEventListener('click', e=>{
        switchToPage('options-page')
      })),
      h('button', setElemClass('all-tasks-tab'), setElemClass('page-link', 'iconbutton'), '▤', n=> n.addEventListener('click', e=>{
        switchToPage('all-tasks-page')
      })),
      h('button', setElemClass('new-add'), setElemClass('iconbutton'), '✔', n=> n.addEventListener('click', e=>addTaskUsingNewElems('#timeline-page'))),
      h('button', setElemClass('prev-day'), setElemClass('iconbutton'), '←', n=> n.addEventListener('click', e=>{
        setTimelineDay(offsetDateNumDays(timelineDatenum, -1))
      })),
      h('button', setElemClass('goto-today'), setElemClass('iconbutton'), '☉', n=>n.addEventListener('click', e=> {
        setTimelineDay(nowDateNum())
        updateCurrentPage()
      })),
      h('button', setElemClass('next-day'), setElemClass('iconbutton'), '→', n=> n.addEventListener('click', e=>{
        setTimelineDay(offsetDateNumDays(timelineDatenum, 1))
      })),
      h('input', setElemClass('date-selector'), n=> {
        n.type='date'
        n.addEventListener('change', e=>{
          const [ystr, mstr, dstr] = n.value.split('-')
          const yr = Number(ystr)
          const mo = Number(mstr)
          const da = Number(dstr)
          const datenum = (new Date(yr, mo-1, da)).getTime()
          setTimelineDay(datenum)
        })
      }),
      h('button', setElemClass('reschedule-due'), setElemClass('iconbutton'), '⤈', n=>n.addEventListener('click', e=> {
        rescheduleAllDue()
        saveToStorage()
        updateCurrentPage()
      })),
      h('button', setElemClass('reschedule-all'), setElemClass('iconbutton'), '⇑', n=>n.addEventListener('click', e=> {
        rescheduleAll()
        saveToStorage()
        updateCurrentPage()
      }))
    ),
    h('div', setElemClass('timeline'),
      n=> { // swipe behavior
        let startx = undefined
        n.addEventListener('touchstart', e=>{
          startx = e.touches[0].clientX
        })
        n.addEventListener('touchend', e=>{
          const endx = e.changedTouches[0].clientX
          if(Math.abs(endx-startx) > timelineDaySwipeTransitionDistance())
            setTimelineDay(offsetDateNumDays(timelineDatenum, endx > startx ? -1 : 1))
        })
      },
      h('div', setElemClass('time-blocks')),
      h('div', setElemClass('timeline-overscroll'))
    )
  )
}


// #ENDREGION


// #REGION all-tasks page

addCss(`
  
  .task-list-block {
    padding: 2px;
    margin: 2px;
    border: 1px solid black;
    background-color: color-mix(in srgb, green, white 95%);
    border-radius: 6px;
    box-shadow: lightgray 4px 4px 0;
  }
  .task-list-block > textarea.content {
    display: block;
    width: 100%;
    height: 4em;
    resize: none;
    flex-grow: 5;
    border: none;
    background: none;
    font-size: 1.5em;
  }
  .task-list-block > .task-area {
    width: 100%;
  }

  .task-list-block > .task > .content {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background: none;
    border: none;
    resize: none;;
  }

  .task-list-block > .top {
    display: flex;
    flex-direction: row;
  }

  .task-list-block.today {
    border: 1px solid yellow;
  }
`)
function makeAllTasksListTaskBlockElem(ogtask) {
  const id = ogtask.id
  return h('div', setElemClass('task-list-block'),
    h('div', setElemClass('top'),
      h('button', setElemClass('iconbutton'), '℄', n=>n.addEventListener('click', e=>{
        const task = findTaskById(id)
        switchToPage('timeline-page')
        setTimelineDay(task.scheduled)
        const timelineElem = document.getElementById('timeline-page')
        const taskElem = timelineElem.querySelector(`.task-${id}`)
        assert(taskElem != undefined)
        taskElem.scrollIntoView()
      })),
      h('div', setElemClass('time-range'), n=> {
        const task = findTaskById(id)
        const timeToMs = task.scheduled - nowDateNum()
        n.textContent = `${prettyDateNumStrShort(task.scheduled)},  in ${prettyDurStr(timeToMs)},  for ${prettyDurStr(task.duration)}`
      })
    ),
    makeTaskElem(ogtask)
  )
}

function updateAllTasksPage() {
  const allTaskPageElem = document.getElementById('all-tasks-page')
  const allTasksElems = allTaskPageElem.querySelector('.all-tasks')
  allTasksElems.innerHTML = ''
  sortTasksByTime()
  const nowDayOrigin = dateNumDayOrigin(nowDateNum())
  for(const t of tasks) {
    const taskBlockElem = makeAllTasksListTaskBlockElem(t)
    const taskDayOrigin = dateNumDayOrigin(t.daydatenum)
    if(taskDayOrigin == nowDayOrigin)
      taskBlockElem.classList.add('today')
    else if(taskDayOrigin < nowDayOrigin)
      taskBlockElem.classList.add('past')
    allTasksElems.appendChild(taskBlockElem)
  }
}

// all-tasks
addCss(`
  #all-tasks-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 98vw;
    overflow: hidden;
  }

  #all-tasks-page > .new-task-area {
    border: 1px solid black;
  }
  #all-tasks-page > .new-task-area  .new-content {
    width: 70%;
    resize: none;
  }
  #all-tasks-page > .new-task-area > * > * {
    margin-right: 1em;
  }
  #all-tasks-page > .new-task-area input[type='number'] {
    width: 10%;
  }
  #all-tasks-page > .new-task-area .error {
    background-color: color-mix(in srgb, white, red 10%);
  }

  #all-tasks-page > .timeline {
    overflow-y: scroll;
    overflow-x: clip;
    height: 100%;
  }

  #all-tasks-page > .timeline > .timeline-overscroll {
    height: 300px;
  }
  
  #all-tasks-page > .command-line {
    height: 30px;
  }
`)
function makeAllTaskPage() {
  return h('div', setElemId('all-tasks-page'),
    h('div', setElemClass('new-task-area'),
      h('div',
        h('span', 'Do'),
        h('input', setElemClass('new-content'), n=> {
          n.type = 'text'
          n.addEventListener('keydown', e=>{
            if(e.key == 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              addTaskUsingNewElems('#all-tasks-page')
            }
          })
        })
      ),
      h('div',
        // h('span', setElemId('new-duration'), makeIntoTextualInput({
        //   initialValue: null,
        //   tovaluefn: v=> (v == '') ? null : strToDur(v),
        //   checkfn: strToDur,
        //   totextfn: v=>(v == null) ? '' : prettyDurStr(v),
        //   displayfn: v=> (v == null) ? `Duration?` : `For ${prettyDurStr(v)}`
        // })),
        appOn(makeMultiselector('For',
          v=>{},
          ['5 m', 5*minuteMsCount],
          ['15 m', 15*minuteMsCount],
          ['30 m', 30*minuteMsCount],
          ['1 hr', 1*hourMsCount],
          ['2 hr', 2*hourMsCount],
          ['4 hr', 4*hourMsCount],
        ), setElemClass('new-duration')),
        h('span', setElemClass('new-frequency'), makeIntoTextualInput({
          initialValue: null,
          tovaluefn: v=> (v == '') ? null : strToDur(v),
          checkfn: strToDur,
          totextfn: v=>(v == null) ? '' : prettyDurStr(v),
          displayfn: v=> (v == null) ? `Periodic?` : `Every ${prettyDurStr(v)}`
        })),
        h('span', setElemClass('new-at'), makeIntoTextualInput({
          initialValue: null,
          tovaluefn: txt=> (txt == '') ? null : hourMinStrToDayMins(txt),
          checkfn: txt=> (txt == '') ? null : hourMinStrToDayMins(txt),
          totextfn: v=> (v == null) ? '' : dayMinsTo12HourMinStr(v),
          displayfn: v=> (v == null) ? `Time?` : `At ${dayMinsTo12HourMinStr(v)}`
        })),
        h('button', setElemClass('new-important'), '!!', makeIntoCheckbutton({initialState: false})),
        h('button', setElemClass('new-fixed-time'), '◬', makeIntoCheckbutton({initialState: false})),
      )
    ),
    h('div', setElemClass('command-line'),
      h('button', setElemClass('options-tab'), setElemClass('page-link', 'iconbutton'), '⚙', n=> n.addEventListener('click', e=>{
        switchToPage('options-page')
      })),
      h('button', setElemClass('all-tasks-tab'), setElemClass('page-link', 'iconbutton'), '🜁', n=> n.addEventListener('click', e=>{
        switchToPage('timeline-page')
      })),
      h('button', setElemClass('new-add'), setElemClass('iconbutton'), '✔', n=> n.addEventListener('click', e=>addTaskUsingNewElems('#all-tasks-page')))
    ),
    h('input', setElemClass('search-bar'), n=> {
      n.type = 'text'
      n.addEventListener('input', e=>{
        const searchstr = n.value.toLowerCase()
        const taskContentElems = document.querySelectorAll('#all-tasks-page .all-tasks .task .content')
        for(const taskContentElem of taskContentElems) {
          const taskBlock = taskContentElem.closest('.task-list-block')
          const matches   = taskContentElem.textContent.toLowerCase().includes(searchstr)
          taskBlock.style.display = matches ? '' : 'none'
        }
      })
    }),
    h('div', setElemClass('all-tasks-parent'),
      h('div', setElemClass('all-tasks')),
      h('div', setElemClass('tasks-overscroll'))
    )

  )
}

// #ENDREGION


// #REGION options page

addCss(`
  #options-list {
    display: flex;
    flex-direction: column;
  }

`)
function makeOptionsPage() {
  return h('div', setElemId('options-page'),
    h('div', setElemId('command-line'),
      h('button', setElemId('options-tab'), setElemClass('page-link'), 'All tasks', n=> n.addEventListener('click', e=> switchToPage('all-tasks-page'))),
      h('button', setElemId('timeline-tab'), setElemClass('page-link'), 'Timeline', n=> n.addEventListener('click', e=> switchToPage('timeline-page')))
    ),
    h('div', setElemId('options-list'),
      h('div', setElemClass('options-row'),
        h('input', n=> {
          n.type = 'text'
          n.value = dayMsToHourMinStr(daystart)
          n.addEventListener('change', e=> {
            const newdaystart = hourMinStrToDayMs(n.value)
            if(newdaystart == null) {
              errorPopup(`Cannot convert ${n.value} to a time`)
              n.value = dayMsToHourMinStr(daystart)
              return
            }
            if(newdaystart >= dayend) {
              errorPopup(`Day start must be before day end`)
              n.value = dayMsToHourMinStr(daystart)
              return
            }
            daystart = newdaystart
            saveToStorage()
          })
        }),
        'Day start time'
      ),
      h('div', setElemClass('options-row'),
        h('input', n=> {
          n.type = 'text'
          n.value = dayMsToHourMinStr(dayend)
          n.addEventListener('change', e=> {
            const newdayend = hourMinStrToDayMs(n.value)
            if(newdayend == null) {
              errorPopup(`Cannot convert ${n.value} to a time`)
              n.value = dayMsToHourMinStr(dayend)
              return
            }
            if(newdayend <= daystart) {
              errorPopup(`Day end must be after day start`)
              n.value = dayMsToHourMinStr(dayend)
              return
            }
            dayend = newdayend
            saveToStorage()
          })
        }),
        'Day end time'
      ),
    ),
    h('div', setElemClass('options-list'),
      h('button', 'Copy backup data', n=>n.addEventListener('click', e=>{
        navigator.clipboard.writeText(JSON.stringify({tasks, daystart, dayend}))
      })),
      h('button', 'Overwrite data from clipboard', n=>n.addEventListener('click', e=> {
        yesNoQuestionPopup(`Are you sure?`,
          ()=> {
            navigator.clipboard.readText().then(text => {
              try {
                const obj = JSON.parse(text)
                tasks = obj.tasks
                daystart = obj.daystart || daystart
                dayend = obj.dayend || dayend
                saveToStorage()
              } catch (err) {
                errorPopup('Invalid JSON data from clipboard')
              }
            })
          },
          ()=>{} // do nothing on no
        )
      }))
    )
  )
}

// #ENDREGION


// #REGION popups

addCss(`
  #popup > .error {
    display: flex;
    flex-direction: column;
    background-color: hsl(0 100 98%);
  }
`)
function errorPopup(msg) {
  makePopupWith(h('div', setElemClass('error'),
    msg,
    h('button', 'Ok', n=>n.addEventListener('click', e=>closePopup()))
  ))
}

addCss(`
  #popup > .info {
    display: flex;
    flex-direction: column;
  }
`)
function infoPopup(msg) {
  makePopupWith(h('div', setElemClass('info'),
    msg,
    h('button', 'Ok', n=>n.addEventListener('click', e=>closePopup()))
  ))
}

addCss(`
  #popup > .yesno-question {
    display: flex;
    flex-direction: column;
  }
  #popup > .yesno-question > .row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
`)
function yesNoQuestionPopup(questionmsg, yesfn, nofn) {
  makePopupWith(h('div', setElemClass('yesno-question'),
    questionmsg,
    h('div', setElemClass('row'),
      h('button', 'Yes', n=>n.addEventListener('click', e=>{
        closePopup()
        yesfn()
      })),
      h('button', 'No', n=>n.addEventListener('click', e=>{
        closePopup()
        nofn()
      }))
    )
  ))
}

addCss(`
  #popup-parent {
    position: absolute;
    left: 25%;
    top: 25%;
  }
  #popup {
    position: relative;
    border: 1px solid black;
    border-radius: 3px;
    background-color: hsl(0 0 98%);
    width: 50vw;
    padding: 4px;
  }
`)
function makePopupWith(...elems) {
  const popupElem = document.getElementById('popup')
  popupElem.innerHTML = ''
  popupElem.hidden = false
  popupElem.appendChild(df(...elems))
}
function closePopup() {
  const popupElem = document.getElementById('popup')
  popupElem.innerHTML = ''
  popupElem.hidden = true
}

// #ENDREGION

// #REGION page infrastructure

let currentPage = ''

// CSS for all pages
addCss(`
  .hidden-page {
    display: none !important;
  }

  .iconbutton {
    background: none;
    border: none;
    color: blue;
    font-size: 1em;
  }
  .page-link.iconbutton {
    color: rgb(47, 140, 47);
  }

  .checkbutton {
    background: none;
    color: blue;
    border: none;
  }
  .checkbutton.on {
    background: rgba(0, 0, 255, 0.1);
  }
`)

const pageNameToPopulatorMap = {
  'all-tasks-page': updateAllTasksPage,
  'timeline-page': updateTimelinePage,
  'options-page': ()=>{}
}
function updateCurrentPage() {
  const populator = pageNameToPopulatorMap[currentPage]
  populator?.()
}

function switchToPage(pageid) {
  currentPage = pageid
  const pageElem = document.getElementById('page')
  for(const child of pageElem.children)
    child.classList.add('hidden-page')
  const targetPageElem = document.getElementById(pageid)
  assert(targetPageElem != undefined)
  targetPageElem.classList.remove('hidden-page')
  updateCurrentPage()
}

// #ENDREGION

// Generally applied css
addCss(`
  body {
    overflow: hidden;
    margin: 0;
  }
    
  #main-input, #search-field {
    width: 100%;
  }

  .dim {
    color: rgba(0, 0, 0, 0.5);
  }

  .error {
    background-color: color-mix(in srgb, white, red 10%);
  }

  #page {
    height: 100vh;
    width: 98vw;
    overflow: hidden;
  }

  span {
    user-select: none;
  }

  div {
    user-select: none;
  }
    
  input[type="date"] {
    width: 7em;
  }
`)

document.addEventListener('DOMContentLoaded', async ()=>{
  document.head.appendChild(h('style', collectCss()))

  const pageElem = document.getElementById('page')
  pageElem.appendChild(df(
    makeTimelinePage(),
    makeAllTaskPage(),
    makeOptionsPage()
  ))

  // addNewTask({daydatenum:nowDateNum(), content:'Clean tub', duration:'15 min', frequency:'5 days'})
  // addNewTask({daydatenum:nowDateNum(), content:'Do other stuff', duration:'5 min'})
  
  await loadFromStorage()
  switchToPage('timeline-page')
})
