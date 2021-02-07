let secondInterval;
let showRealTime = false;

const utils = {
  random: function(items) {
    return items[~~(items.length * Math.random())];
  },

  oneIn: function(chance) {
    return Math.floor(Math.random() * Math.floor(chance + 1)) === chance;
  },

  hours2Word: function(hours, minutes) {
    const numbers = [
      'twelve',
      'one',
      'two',
      'three',
      'four',
      'five',
      'six',
      'seven',
      'eight',
      'nine',
      'ten',
      'eleven',
      'twelve',
    ];

    let adjustedHours = hours;

    if (minutes > 40) {
      adjustedHours += 1;
    }

    if (adjustedHours > 12) {
      adjustedHours -= 12;
    }

    return numbers[adjustedHours];
  },

  print: function(str) {
    let fontSize = 4;
    const width = g.getWidth();
    const height = g.getHeight() - 48;
    const lines = str.split(`\n`).length;
    let totalHeight;

    do {
      g.setFont("6x8", fontSize);
      totalHeight = g.getFontHeight() * lines;
      if (fontSize === 1 || (g.stringWidth(str) < width && totalHeight < height)) {
          break;
      }
      fontSize--;

    } while (true);

    const x = width / 2;

    const y = (g.getHeight() / 2) - (g.getFontHeight() * ((lines - 1) / 2));
    g.drawString(str, x, y < 25 ? 24 : y);
  }
};

const words = {
  approx: ['\'Bout', 'About', 'Around', `Summat\nlike`, 'Near', 'Close to'],
  approach: ['Nearly', `Coming\nup to`, 'Approaching', `A touch\nbefore`],
  past: [`A shade\nafter`, `A whisker\nafter`, 'Just gone'],
  quarter: ['Quarter', `Fifteen\nminutes`],
  half: ['Half', 'Half past'],
  exactly: ['exactly', 'on the dot',  'o\' clock'],
  ish: ['-ish', `\n(ish)`]
};

function switchMode() {
  showRealTime = !showRealTime;
  refreshTime();
}

function drawRealTime(date) {
  const pad = (number) => `0${number}`.substr(-2);
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  g.setFontAlign(0,1);
  g.setFont("6x8", 8);
  g.drawString(`${hours}:${minutes}`, g.getWidth() / 2, g.getHeight() / 2);

  g.setFont("6x8", 3);
  g.setFontAlign(0, -1);
  g.drawString(date.toISOString().split('T')[0], g.getWidth() / 2, g.getHeight() / 2);

}

function drawDumbTime(time) {
  const hours = time.getHours();
  const minutes = time.getMinutes();

  function formatTime(hours, minutes) {
    const makeApprox = (str, template) => {
      let _template = template || 'approx';
      if (utils.oneIn(2)) {
        _template = 'approx';

        if (utils.oneIn(words.approx.length)) {
          const ish = utils.random(words.ish);
          return `${str}${ish}`;
        }
      }

      const approx = `${utils.random(words[_template])} `;

      return `${approx}\n${str.toLowerCase()}`;
    };

    const formatters = {
      'onTheHour': (hoursAsWord) => {
          const exactly = utils.random(words.exactly);

          return `${hoursAsWord}\n${exactly}`;
      },
      'nearTheHour': (hoursAsWord) => {
        const template = (minutes < 10) ? 'past' : 'approach';

        return makeApprox(hoursAsWord, template);
      },
      'nearQuarter': (hoursAsWord, minutes) => {
        const direction = (minutes > 30) ? 'to' : 'past';
        const quarter = utils.random(words.quarter);

        const formatted = `${quarter} ${direction}\n${hoursAsWord}`;

        return (minutes === 15 || minutes === 45) ? formatted : makeApprox(formatted);
      },
      'nearHalf': (hoursAsWord, minutes) => {
        const half = utils.random(words.half);

        const formatted = `${half}\n${hoursAsWord}`;

        const template = (minutes > 30) ? 'past' : 'approach';
        return (minutes === 30) ? formatted : makeApprox(formatted, template);
      },
    };

    function getFormatter(hours, minutes) {
      if (minutes === 0) {
        return formatters.onTheHour;
      } else if (minutes > 50 || minutes < 10) {
        return formatters.nearTheHour;
      } else if (minutes > 40|| minutes < 20) {
        return formatters.nearQuarter;
      } else {
        return formatters.nearHalf;
      }
    }

    const hoursAsWord = utils.hours2Word(hours, minutes);

    const formatter = getFormatter(hours, minutes);

    return formatter(hoursAsWord, minutes);
  }

  utils.print(formatTime(hours, minutes));
}

function cancelTimeout() {
  if (secondInterval) {
    clearTimeout(secondInterval);
  }

  secondInterval = undefined;
}

function refreshTime() {
  cancelTimeout();

  g.clearRect(0, 24, g.getWidth(), g.getHeight()-24);
  g.reset();
  g.setFontAlign(0,0);

  const time = new Date();

  const method = showRealTime ? drawRealTime : drawDumbTime;

  method(time);

  const secondsTillRefresh = 60 - time.getSeconds();

  secondInterval = setTimeout(refreshTime, secondsTillRefresh * 1000);
}


function startClock() {
  const secondsToRefresh = refreshTime();
}

function addEvents() {
  Bangle.on('lcdPower', (on) => {
    cancelTimeout();
    if (on) {
      startClock();
    }
  });

  setWatch(switchMode, BTN1, {
    repeat: true,
    edge: "falling"
  });

  setWatch(Bangle.showLauncher, BTN2, {
    repeat: false,
    edge: "falling"
  });


  setWatch(refreshTime, BTN3, {
    repeat: true,
    edge: "falling"
  });
}

function init() {
  g.clear();

  startClock();
  Bangle.loadWidgets();
  Bangle.drawWidgets();  

  addEvents();
}


init();
