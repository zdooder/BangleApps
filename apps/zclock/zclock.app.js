require("FontHaxorNarrow7x17").add(Graphics);

var steps=0;

function draw() {
  var d = new Date();
  var h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
  var time = (" " + h).substr(-2) + ":" + ("0"+m).substr(-2) + " ";
  var secs = ("0" + s).substr(-2) + " ";

  var timecolor = "#" + ("0" + (0x80 + Math.floor(h/24*128)).toString(16)).substr(-2)
                      + ("0" + (0x80 + Math.floor(m/60*128)).toString(16)).substr(-2)
                      + ("0" + (0x80 + Math.floor(s/60*128)).toString(16)).substr(-2);

  g.reset();

  g.setColor(timecolor)
   .setFont("HaxorNarrow7x17",5)
   .setFontAlign(-1, 1);

  var dw = g.getWidth();
  var w = g.setFont("HaxorNarrow7x17", 5).stringWidth(time);
  var sw = g.setFont("HaxorNarrow7x17", 3).stringWidth(secs);
  var ct = (dw - w - sw)/2;
  var cs = (dw - w - sw)/2 + w;

  g.setFont("HaxorNarrow7x17", 5).drawString(time, ct, 115, true);
  g.setFont("HaxorNarrow7x17",3).drawString(secs, cs, 110, true); 

  var dateStr = "    " + require("locale").date(d) + "    ";
  g.setColor(-1)
   .setFont("6x8",2)
   .setFontAlign(0,1)
   .drawString(dateStr, g.getWidth()/2, 125, true);

  g.setColor("#00ff00")
   .setFont("6x8",2)
   .setFontAlign(-1, -1)
   .drawString(steps + " steps ", dw/2, 140, true);

  var batteryLevel = E.getBattery();
  var batteryColor = "#" + ("0" + (0x80 + (100-batteryLevel)).toString(16)).substr(-2)
                         + ("0" + (0x80 + batteryLevel).toString(16)).substr(-2)
                         + "00";
  g.setColor(batteryColor)
   .drawString(batteryLevel + "%  ", 0, 140, true);
}

function checkBR() {
  NRF.requestDevice({
    filters: [{ services: ['1823'] }]
  }).then(function(dev) {
    require("ble_http").httpRequest(dev, "akropolys.com/br.php?request=nowPlaying", function(data) {
      Bangle.setLCDOffset(-10);
      g.reset()
       .setColor(-1)
       .setFont("6x8",1)
       .setFontAlign(-1, -1)
       .drawString("BR:".JSON_stringify(data), 0, 160, true);
    });
  }).catch(function(err) {
    console.log("ERR:" + err);
    g.reset()
     .setColor(1, 0, 0)
     .setFont("6x8", 1)
     .setFontAlign(-1,-1)
     .drawString("ERR:" +err, 0, 160, true);
  });
}

draw();
var clockInterval = setInterval(draw, 1000);
Bangle.on('lcdPower', on=>{
  if (clockInterval) clearInterval(clockInterval);
  clockInterval = undefined;
  if (on) {
    clockInterval = setInterval(draw, 1000);
    draw();
  }
});

Bangle.on('step', function(up) {
  if ( "activepedom" in WIDGETS ) {
    steps = WIDGETS.activepedom.getSteps();
  } else {
    steps = up;
  }
});

Bangle.loadWidgets();
Bangle.drawWidgets();
setWatch(Bangle.showLauncher, BTN2, {repeat: false, edge: "falling"});
setWatch(checkBR, BTN3, {repeat: false, edge: "falling"});
