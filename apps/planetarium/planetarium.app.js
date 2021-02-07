/*
 * Degrees to radians
 */
function toRadians(degrees)
{
    return Math.PI * degrees / 180;
}

/*
 * Julian day number
 * Assumes a proleptic gregorian calendar where the year 1 is preceded by the
 * year 0.
 */
function toJulianDay(year, month, day, hours, minutes, seconds)
{
    day += hours / 24 + minutes / 1440 + seconds / 86400;
    
    if(month <= 2)
    {
        year -= 1;
        month += 12;
    }
    
    var A = Math.floor(year / 100);
    var B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

/*
 * Sidereal time in Greenwich
 */
function siderealTime(julianDay)
{
    var T = (julianDay - 2451545.0) / 36525;
    return toRadians(280.46061837 + 360.98564736629 * (julianDay - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000);
}

function drawStars(lat,lon,date){
  var longitude = toRadians(-lon);
  var latitude = toRadians(lat);

  var julianDay = toJulianDay(date.getFullYear(), date.getMonth()+1,date.getDate(),
                              date.getHours() + date.getTimezoneOffset() / 60,
                              date.getMinutes(), date.getSeconds());
  var size = 240;

  storage = require('Storage');
  f=storage.read("planetarium.data.csv","r");
  g.clear();

  //Common calculations based only on time
  var t = (julianDay - 2451545.0) / 36525;
  var zeta = toRadians((2306.2181 * t + 0.30188 * t * t + 0.017998 * t * t * t) / 3600);
  var theta = toRadians((2004.3109 * t - 0.42665 * t * t - 0.041833 * t * t * t) / 3600);
  var z = toRadians((2306.2181 * t + 1.09468 * t * t + 0.018203 * t * t * t) / 3600);


  let starNumber = 0;
  var starPositions = {};

  var line,linestart = 0;
  lineend = f.indexOf("\n");
  while (lineend>=0) {
    line = f.substring(linestart,lineend);
    starNumber++;
    //console.log(line);
    //Process the star
    starInfo = line.split(',');
    //console.log(starInfo[0]);
    starRA = parseFloat(starInfo[0]);
    starDE = parseFloat(starInfo[1]);
    starMag = parseFloat(starInfo[2]);
    //var start = new Date().getTime();
    var dec = Math.asin(Math.sin(theta) * Math.cos(starDE) * Math.cos(starRA + zeta) + Math.cos(theta) * Math.sin(starDE));
    var ascen = Math.atan2(Math.cos(starDE) * Math.sin(starRA + zeta), Math.cos(theta) * Math.cos(starDE) * Math.cos(starRA + zeta) - Math.sin(theta) * Math.sin(starDE)) + z;
    var H = siderealTime(julianDay) - longitude - ascen;
    //Compute altitude
    var alt = Math.asin(Math.sin(latitude) * Math.sin(dec) + Math.cos(latitude) * Math.cos(dec) * Math.cos(H));
    if(alt >= 0)
    {
      //Compute azimuth  
      var azi = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(latitude) - Math.tan(dec) * Math.cos(latitude));
      var x = size / 2 + size / 2 * Math.cos(alt) * Math.sin(azi);
      var y = size / 2 + size / 2 * Math.cos(alt) * Math.cos(azi);
      starPositions[starNumber] = [x,y];
      var magnitude = starMag<1?2:1;
      //Stars between 1.5 and 4 magnitude should get a different colour
      var col=1;
      if (starMag<=1.5)
        col=1;
      else if (starMag>1.5 && starMag<2)
        col=0.9;
      else if (starMag>=2 && starMag<3)
        col=0.7;
      else if (starMag>=3 && starMag<3.5)
        col=0.5;
      else
        col=0.3;
        
      g.setColor(col,col,col);
      g.fillCircle(x, y, magnitude);
      if (starMag<1 && settings.starnames)
        g.drawString(starInfo[3],x,y+2);
      g.flip();

    }
    linestart = lineend+1;
    lineend = f.indexOf("\n",linestart);
  }
  

  if (settings.constellations){
    //Each star has a number (the position on the file (line number)). These are the lines
    //joining each star in the constellations.
    constelations=[[[7,68],[10,53],[53,56],[28,68],"Orion"],[[13,172],[13,340],[293,340],[29,293],"Taurus"],
                      [[155,8],"Canis Menor"],[[36,81],[87,81],[235,87],[33,235],[33,75],[75,40],[36,235],"Ursa Major"],[[67,91],[74,67],[91,110],[110,252],"Cassiopeia"],[[23,166],[16,294],[294,44],[166,149],[230,149],[16,23],"Gemini"],[[88,218],[215,292],[218,292],[245,88],[292,245],[215,218],"Cepheus"],[[150,62],[150,175],[175,35],[403,62],[487,158],[384,487],[384,158],[35,158],[487,403],"Perseus"],[[19,65],[65,90],[65,147],[466,65],[466,189],[147,401],[213,90],"Cygnus"],[[6,42],[168,6],[168,113],[113,29],[104,29],[104,42],"Auriga"],[[1,47],[1,37],[37,22],[22,178],[37,89],"Can Maior"],[[3,118],[118,279],[279,286],[286,180],[180,316],[316,3],"Bootes"]];
    g.setColor(0,255,0);
    for (i=0;i<constelations.length;i++)
    {
      constelationShowing=false;
      for (j=0;j<constelations[i].length-1;j++){
        positionStar1=starPositions[constelations[i][j][0]];
        positionStar2=starPositions[constelations[i][j][1]];
        //Both stars need to be visible
        if (positionStar1 && positionStar2)
        {
          g.drawLine(positionStar1[0],positionStar1[1],positionStar2[0],positionStar2[1]);
          constelationShowing=true;
        }
        else
          constelationShowing=false;
        g.flip();
      }
      //Write the name
      if (constelationShowing && settings.consnames)
        g.drawString(constelations[i][constelations[i].length-1],positionStar2[0]+10,positionStar2[1]);
    }
  }
}

Bangle.setGPSPower(1);

var gps = { fix : 0};
var prevSats = 0;
g.clear();

var settings = require('Storage').readJSON('planetarium.json',1)||
      { starnames:false,constellations:true,consnames:false};

g.setFontAlign(0,0);

Bangle.on('GPS',function(gp) {
  date = new Date();
  gps = gp;
  if (gp.fix) {
    lat = gp.lat;
    lon = gp.lon;
    Bangle.setGPSPower(0);
    setTimeout(function() {
      drawStars(lat,lon,new Date());},0);
  } else {
    g.setFont("Vector",20); 
    g.drawString("Waiting for position",120,120);
    g.setFont("Vector",15); 
    if (gp.satellites>prevSats || prevSats===0){
      prevSats = gp.satellites;
      g.clearRect(0,150,240,180);
      g.drawString("Got "+gp.satellites+" satellites",120,160);
    }
    g.clearRect(0,180,240,220);
    g.drawString("GMT:"+(date.getHours()+date.getTimezoneOffset() / 60)+":"+date.getMinutes()+":"+date.getSeconds(),120,200);
    g.drawString(date.getDate()+'/'+date.getMonth()+1+"/"+date.getFullYear(),120,215);
    g.flip();
  }
});