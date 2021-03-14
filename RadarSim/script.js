// get our canvas element
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
var canvasRect;


// list of all strokes drawn
const drawings = [];
const vt = new ViewTools(canvas,context,30);
const holdList = new HoldManager();
const runway1={x:canvas.width/2,y:canvas.height/2-10};
const runway2={x:canvas.width/2,y:canvas.height/2+10};
const runwayRange=150;
var Objs=[];
var tcas=[];
var aircraftID=1;

function setup()
{
  try
  {
  //AddStatus("Entering setup()");
  //AddStatus(JSON.stringify(vt));
  singleTouch = false;
  doubleTouch = false;
  dragmv = undefined; // dragging from this moving vector object 
  dragto = undefined;
  // Touch Event Handlers 
  canvas.addEventListener('touchstart', onTouchStart);
  canvas.addEventListener('touchend', onTouchEnd);
  canvas.addEventListener('touchcancel', onTouchEnd);
  canvas.addEventListener('touchmove', onTouchMove);
  
  context.font = "15px Georgia";
  context.fillStyle="black";
  context.textAlign = "center";
  canvasRect = canvas.getBoundingClientRect();
  //AddStatus("top="+canvasRect.top);
  //AddStatus("Exiting setup()");
  }
  catch(err)
  {
    AddStatus("setup error...");
    AddStatus(err);
  }
}

// disable right clicking
document.oncontextmenu = function() {
  return false;
}

// closes all drop down menus, with the exception of the one passed in
function CloseAllDropDowns(skip=null)
{
  let menu = document.getElementById("main-menu");
  let dropdowns = menu.querySelectorAll(".menu-content");
  for (let dd of dropdowns)
  {
    if (dd!=skip)
      CloseDropDown(dd);
  }
}

function DropDownIsOpen()
{
  let menu = document.getElementById("main-menu");
  let dropdowns = menu.querySelectorAll(".menu-content");
  for (let dd of dropdowns)
  {
    if (dd.style.display!="")
      return true;
  }
  return false;
}

function CloseDropDown(child)
{
  let dropmenu = child.closest(".dropdown-menu");
  let dropbtn = dropmenu.querySelector('.menu-btn');
  let arrow = dropbtn.getElementsByTagName("span")[0];
  let dropdwn = dropmenu.querySelector('.menu-content');
  arrow.innerHTML='&#x2193';
  dropdwn.style.display="";
}

// toggles the display of a menu below a drop down button
function DropDown(btn)
{
  let arrow = btn.getElementsByTagName("span")[0];
  let dd = btn.parentElement.querySelector('.menu-content');
  CloseAllDropDowns(dd);
  if (dd.style.display=="")
  {
    arrow.innerHTML='&#x2191';
    dd.style.display="block";
  }
  else
  {
    CloseDropDown(btn);
    vt.vs=get("vs").value;
  }
}

// handles all menu button clicks
function BtnClicked(btn)
{
  CloseAllDropDowns();
  //AddStatus(btn.name+" clicked");
  btn.parentElement.style.display="";
  switch (btn.name)
  {
    case "startsim":
    if (btn.innerHTML=="Start")
    {
      btn.innerHTML="Stop";
      StartAnimation(true);
    }
    else
    {
      btn.innerHTML="Start";
      StartAnimation(false);
      // stop addplanes if its running
      get("addplanes").innerHTML="Start";
    }
    break;

    case "addplanes":
    AddPlanes();
    break;

    case "addplane":
    AddPlane();
    break;

    case "alt":
    //AddStatus(btn.innerHTML);
    SetAltitude(btn);
    break;

    case "speed":
    //AddStatus(btn.innerHTML);
    SetSpeed(Number(btn.innerHTML));
    break;

    case "clearsketch":
    let radial = drawings.filter(x=>x.lbl=="radial");
    let fix = drawings.filter(x=>x.lbl=="hold");
    if (radial.length>0)
      ClearSketch("line,radial,hold");
    else
      ClearSketch("line,fix");
    break;

    case "clearstatus":
    ClearStatus();
    break;

    case "debug":
    Debug(btn);
    break;

    case "Help":
    AddStatus("in Help");
    window.location.href="../RadarSimHelp/index.html";
    break;

   case "grid":
   if (btn.innerHTML.includes("Clear"))
   {
     btn.innerHTML="Draw Grid";
     ClearSketch("grid");
   }
   else
   {
     btn.innerHTML="Clear Grid";
     DrawGrid();
   }
   break;
  }
}

function ClearStatus()
{
  get("status").value="";
}

function Debug(obj)
{
  if (obj.innerHTML=="Debug On")
  {
    obj.innerHTML="Debug off"
    get("status").style.display="block"
    debugMode=true;
  }
  else
  {
    obj.innerHTML="Debug On"
    get("status").style.display=""
    debugMode=false;
  }
}

function SetAltitude(obj)
{
  if (Objs.length>0)
  {
    let mv = Objs.filter(x=>x.ContainsColor("green"));
    if (mv.length==1)
    {
      if (obj.innerHTML=="Hold")
      {
        mv[0].Hold(dragto);
      }
      else if (obj.innerHTML=="Radial")
      {
        let trueX = vt.toTrueX(dragto[0]);
        let trueY = vt.toTrueY(dragto[1]); 
        mv[0].FlyRadialFromCurrentPosition([trueX,trueY]);
      }
      else
        mv[0].SetAltitude(Number(obj.innerHTML));
    }
  }
}

function SetSpeed(speed)
{
  if (Objs.length>0)
  {
    let mv = Objs.filter(x=>x.ContainsColor("green"));
    if (mv.length==1)
    {
      /*
      let currentSpeed= MvSpeed(mv[0],vt.fi/1000,10);
      mv[0].vector.ScaleMe(speed/currentSpeed);
      */
      mv[0].SlewToSpeed(speed);
    }
  }
}

function redrawCanvas(heightPercent = 80, widthPercent = 100) 
{
  // set the canvas to the size of the window
  canvas.width = document.body.clientWidth * widthPercent / 100;
  canvas.height = document.body.clientHeight * heightPercent / 100;
  runway1.x = canvas.width / 2;
  runway1.y = canvas.height / 2 - 10;
  runway2.x = canvas.width / 2;
  runway2.y = canvas.height / 2 + 10;
  //canvas.width = document.body.clientWidth;
  //canvas.height = document.body.clientHeight;

  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  canvasRect = canvas.getBoundingClientRect();
  for (let i = 0; i < drawings.length; i++) 
  {
    const line = drawings[i];
    drawLine(vt.toScreenX(line.x0), vt.toScreenY(line.y0),
      vt.toScreenX(line.x1), vt.toScreenY(line.y1));
  }
  if (Objs != undefined) 
  {
    for (let mv of Objs) 
    {
      mv.Draw(context);
    }
  }
  holdList.DrawHolds();
}
redrawCanvas();

// if the window changes size, redraw the canvas
window.addEventListener("resize", (event) => 
{
  redrawCanvas();
});

function drawLine(x0, y0, x1, y1) // used in redrawCanvas
{
  context.beginPath();
  context.moveTo(x0, y0);
  context.lineTo(x1, y1);
  context.strokeStyle = '#000';
  context.lineWidth = 1;
  context.stroke();
}

function DrawSquare(x,y,size=2,label="line")
{
  Draw(label,x,y,[[-size,-size,-size,size],[-size,size,size,size],
                   [size,size,size,-size],[size,-size,-size,-size]]);
}

function DrawCircle(x,y,radius,label="line")
{
}

function DrawFix(x,y,size=5,label="fix")
{
  Draw(label,x,y,[[-size,0,0,size],[0,size,size,0],[size,0,0,-size],
                  [0,-size,-size,0]]);
}

function DrawGrid(spacing=200)
{
  for(let x=0;x<=(canvas.width+200);x+=200)
    for (let y=0;y<=(canvas.height+200);y+=200)
      DrawFix(x,y,5,"grid");
}

function DrawRunway(x,y,runwayLen,coneLen,coneWidth)
{
  let rl=runwayLen/2;
  let cl=coneLen;
  let cw=coneWidth/2;
  Draw("rwy",x,y,
       [
         [-rl,0,rl,0],
         [-rl,0,-rl-cl,5],[-rl,0,-rl-cl,-cw],[-rl-cl,-cw,-rl-cl,cw],
         [rl,0,rl+cl,5],[rl,0,rl+cl,-cw],[rl+cl,-cw,rl+cl,cw]
       ]);
}

/*
deltaLine = [[dx0,dy0,dx1,dy1],...]
*/
function Draw(label,x,y,deltaLine)
{
  for (let pt of deltaLine)
    drawings.push({lbl:label,x0:x+pt[0],y0:y+pt[1],x1:x+pt[2],y1:y+pt[3]});
}

// clears all line types passed in type
// linetype is a comma delimited string
// "line,rwy,hanger"
function ClearSketch(linetype)
{
  for (let i = drawings.length-1;i>=0;i--)
  {
    if (linetype.includes(drawings[i].lbl))
    {
      drawings.splice(i,1);
    }
  }
  redrawCanvas();
}


// touch functions and variables
const prevTouches = [null, null]; // up to 2 touches
var tapTime = [null,null];
const tapDebounce=100;
let singleTouch = false;
let doubleTouch = false;
var dragmv = undefined; // dragging from this moving vector object 
var dragto = undefined;

function onTouchStart(event) 
{
  try
  {
    //AddStatus("in Touch Start, with "+Objs.length+" planes");
    tapTime[0]=performance.now();
    if (event.touches.length == 1) 
    {
      prevTouches[0] = event.touches[0];
      singleTouch = true;
      doubleTouch = false;
      dragmv=undefined;
    }
    if (event.touches.length >= 2) 
    {
      prevTouches[0] = event.touches[0];
      prevTouches[1] = event.touches[1];
      singleTouch = false;
      doubleTouch = true;
    }
  }
  catch (err)
  {
    AddStatus(err,true);
  }
}

function ClosestPlane(scaledX,scaledY)
{
  let tempmv = new MovingVector(1, 1, scaledX, scaledY);
  let closestmv = Objs[0];
  //AddStatus("checking distance with temp");
  let dist = DistBetween(tempmv, closestmv);
  for (let mv of Objs) 
  {
    //AddStatus("checking distance");
    let testdist = DistBetween(mv, tempmv);
    if (testdist < dist) 
    {
      //AddStatus("found closest="+mv.xpos+","+mv.ypos);
      dist = testdist;
      closestmv = mv;
    }
  }
  return closestmv;
}

function onTouchMove(event)
{
  try
  {
  // get first touch coordinates
  const touch0X = event.touches[0].pageX;
  const touch0Y = event.touches[0].pageY-canvasRect.top;
  const prevTouch0X = prevTouches[0].pageX;
  const prevTouch0Y = prevTouches[0].pageY-canvasRect.top;

  const scaledX = vt.toTrueX(touch0X);
  const scaledY = vt.toTrueY(touch0Y);
  const prevScaledX = vt.toTrueX(prevTouch0X);
  const prevScaledY = vt.toTrueY(prevTouch0Y);
  if (event.touches.length >= 2) 
  {
    singleTouch = false;
    doubleTouch = true;
  }

  if (singleTouch) 
  {
    //AddStatus("SingleTouch");
    if (get("sketch").checked) 
    {
      // add to history
      drawings.push(
      {
        lbl: "line",
        x0: prevScaledX,
        y0: prevScaledY,
        x1: scaledX,
        y1: scaledY
      });
    } 
    else if (Objs.length!=0)
    {
      tapTime[1]=performance.now();
      //get("debug04").innerHTML=tapTime[1]-tapTime[0];
      if ((tapTime[1]-tapTime[0])<tapDebounce)return;
      //AddStatus("not sketching");
      if (dragmv == undefined || dragmv.tag!="drag")
        dragmv=ClosestPlane(scaledX, scaledY);
      if (dragmv.tag == "none") 
        dragmv.tag="drag";
      //AddStatus("setting color green");
      let green = Objs.filter(x=>x.ContainsColor("green"));
      for (let x of green)
      {
        if (x != dragmv)
          x.ClearColor("green");
      }
      dragmv.SetColor("green");
      //AddStatus("assigning dragto");
      dragto = [touch0X, touch0Y]
      //get("debug09").innerHTML=touch0X.toFixed(1)+","+touch0Y.toFixed(1);
    }
  }

  if (doubleTouch) 
  {
    dragmv=undefined;
    //AddStatus("double");
    // get second touch coordinates
    const touch1X = event.touches[1].pageX;
    const touch1Y = event.touches[1].pageY;
    const prevTouch1X = prevTouches[1].pageX;
    const prevTouch1Y = prevTouches[1].pageY;

    // get midpoints
    const midX = (touch0X + touch1X) / 2;
    const midY = (touch0Y + touch1Y) / 2;
    const prevMidX = (prevTouch0X + prevTouch1X) / 2;
    const prevMidY = (prevTouch0Y + prevTouch1Y) / 2;

    // calculate the distances between the touches
    const hypot = Math.sqrt(Math.pow((touch0X - touch1X), 2) + Math.pow((touch0Y - touch1Y), 2));
    const prevHypot = Math.sqrt(Math.pow((prevTouch0X - prevTouch1X), 2) + Math.pow((prevTouch0Y - prevTouch1Y), 2));

    // calculate the screen scale change
    var zoomAmount = hypot / prevHypot;
    vt.scale = vt.scale * zoomAmount;
    //get("debug02").innerHTML = "Scale=" + vt.scale.toFixed(2);
    const scaleAmount = 1 - zoomAmount;

    // calculate how many pixels the midpoints have moved in the x and y direction
    const panX = midX - prevMidX;
    const panY = midY - prevMidY;
    // scale this movement based on the zoom level
    vt.offsetX += (panX / vt.scale);
    vt.offsetY += (panY / vt.scale);

    // Get the relative position of the middle of the zoom.
    // 0, 0 would be top left. 
    // 0, 1 would be top right etc.
    var zoomRatioX = midX / canvas.clientWidth;
    var zoomRatioY = midY / canvas.clientHeight;

    // calculate the amounts zoomed from each edge of the screen
    const unitsZoomedX = vt.trueWidth() * scaleAmount;
    const unitsZoomedY = vt.trueHeight() * scaleAmount;

    const unitsAddLeft = unitsZoomedX * zoomRatioX;
    const unitsAddTop = unitsZoomedY * zoomRatioY;

    vt.offsetX += unitsAddLeft;
    vt.offsetY += unitsAddTop;

    redrawCanvas();
  }
  prevTouches[0] = event.touches[0];
  prevTouches[1] = event.touches[1];
  }
  catch(err)
  {
    AddStatus(err,true);
  }
}

function onTouchEnd(event) 
{
  try
  {
  
  if ((dragto==undefined || dragmv==undefined) && singleTouch) 
  {
    //AddStatus("clearing dragto");
    dragto=undefined;
    if (DropDownIsOpen())
    {
      CloseAllDropDowns();
      return;
    }
    let touchX = prevTouches[0].pageX;
    let touchY = prevTouches[0].pageY-canvasRect.top;

    if (Objs.length != 0)
    {
      // this was a tap, clear previous green, and select a new one.
      let green = Objs.filter(x=>x.ContainsColor("green"));
      for (let x of green)
        x.ClearColor("green");
      let tempmv = ClosestPlane(vt.toTrueX(touchX),vt.toTrueY(touchY));
      tempmv.SetColor("green");
    }
    singleTouch = false;
    return;
  }
  singleTouch = false;
  doubleTouch = false;
  if ((tapTime[1]-tapTime[0])<tapDebounce)return;
  if (dragmv==undefined || dragmv.tag!="drag")return;
  //AddStatus(dragmv.Snapshot());
  let dragVector = new Vector(vt.toTrueX(dragto[0]) - dragmv.xpos,
    vt.toTrueY(dragto[1]) - dragmv.ypos);
  let direction = Math.round(dragVector.GetDirection()/10)*10;
  dragVector.SetDirection(direction);
  // allow the user to cancel the vector by moving back to the plane
  //get("debug05").innerHTML=dragVector.GetLength()*vt.scale;
  if ((dragVector.GetLength()*vt.scale)< 50) 
  {
    dragmv.tag = "none";
    return;
  }
  if (get("radiusturn").checked)
    dragmv.SlewTo(dragVector);
  else
    dragmv.SetHeading(dragVector.GetDirection()+90);
  dragmv.tag="none";
  if (get("altonvector").checked)DropDown(get("altbtn"));
  }
  catch(err)
  {
    AddStatus(err,true);
  }
}
function Settings()
{
  redrawCanvas(80,80);
}

function get(id)
{
  return document.getElementById(id);
}

function AddPlanes()
{
  let button = get("addplanes");
  switch (button.innerHTML)
  {
    case "Start":
    let ymin = vt.toTrueY(0);
    let ymax = vt.toTrueY(canvas.height);
    let xmin = vt.toTrueX(0);
    let xmax = vt.toTrueX(canvas.width);
    let side=0;
    let speed=Number(get("speed").value);
    let vlen=VectorLength(speed,vt.FrameIntervalInSeconds(),10);
    button.innerHTML="Stop";
    let midx = runway1.x;
    let midy = runway1.y
    let sides = [];
    if (get("addleft").checked)
      sides.push("left");
    if (get("addtop").checked)
      sides.push("top");
    if (get("addright").checked)
      sides.push("right");
    if (get("addbottom").checked)
      sides.push("bottom");
    let rate = get("insertrate").value;
    var id2 = setInterval(addPlanes, rate*1000);
    let rd=Number(get("rangedelta").value)*10/vt.scale;
    let rdalt = (Number(get("rangedelta").value)/10)*3000;
    let altOffset = Number(get("altitude").value);
    function addPlanes()
    {
      if (button.innerHTML!="Stop") 
      {
        clearInterval(id2);
        return;
      }
      let randy = ymin+Math.random()*(ymax-ymin);
      let randx = xmin+Math.random()*(xmax-xmin);
      let plane={type:"plane",length:15,width:12,color:"black",
               drag:0,gravity:0,id:aircraftID++};
      let movingVector;
      switch (sides[side])
      {
        case "left":
          var distToAp = Math.hypot(midx-xmin,midy-randy)/10;
          var newAlt = Math.round((distToAp*300+altOffset)/1000)*1000;
          if (newAlt>40000)newAlt=40000;
          movingVector = new MovingVector(vlen,0,xmin,randy,plane,vt,newAlt);
          var unitv = new Vector(midx-xmin,midy-randy).Unit();
          movingVector.vector.SetDirection(unitv.GetDirection());
          Objs.push(movingVector);
          if(++side>=sides.length)
          {
            side=0;
            xmin-=rd;
            ymin-=rd;
            xmax+=rd;
            ymax+=rd;
            //AddStatus(xmin);
          }
        break;

        case "top":
          var distToAp = Math.hypot(midx-randx,midy-ymin)/10;
          var newAlt = Math.round((distToAp*300+altOffset)/1000)*1000;
          if (newAlt>40000)newAlt=40000;
          movingVector = new MovingVector(vlen,0,randx,ymin,plane,vt,newAlt);
          var unitv = new Vector(midx-randx,midy-ymin).Unit();
          movingVector.vector.SetDirection(unitv.GetDirection());
          Objs.push(movingVector);
          if(++side>=sides.length)
          {
            side=0;
            xmin-=rd;
            ymin-=rd;
            xmax+=rd;
            ymax+=rd;
            alt+=rdalt;
            //AddStatus(ymin);
          }
        break;

        case "right":
          var distToAp = Math.hypot(midx-xmax,midy-randy)/10;
          var newAlt = Math.round((distToAp*300+altOffset)/1000)*1000;
          if (newAlt>40000)newAlt=40000;
          movingVector = new MovingVector(vlen,0,xmax,randy,plane,vt,newAlt);
          var unitv = new Vector(midx-xmax,midy-randy).Unit();
          movingVector.vector.SetDirection(unitv.GetDirection());
          Objs.push(movingVector);
          if(++side>=sides.length)
          {
            side=0;
            xmin-=rd;
            ymin-=rd;
            xmax+=rd;
            ymax+=rd;
            alt+=rdalt;
            //AddStatus(xmax);
          }
        break;

        case "bottom":
          var distToAp = Math.hypot(midx-randx,midy-ymax)/10;
          var newAlt = Math.round((distToAp*300+altOffset)/1000)*1000;
          if (newAlt>40000)newAlt=40000;
          movingVector = new MovingVector(vlen,0,randx,ymax,plane,vt,newAlt);
          var unitv = new Vector(midx-randx,midy-ymax).Unit();
          movingVector.vector.SetDirection(unitv.GetDirection());
          Objs.push(movingVector);
          if(++side>=sides.length)
          {
            side=0;
            xmin-=rd;
            ymin-=rd;
            xmax+=rd;
            ymax+=rd;
            alt+=rdalt;
            //AddStatus(ymax);
          }
        break;
      }
    }
    break;

    case "Stop":
    button.innerHTML="Start";
    break;
  }
}

function AddPlane()
{
  // 150mph = 2.5 mi/min = .0417 mps
  // 
  //AddStatus("In AddPlane");
  //let speed=Number(get("speed").value);
  let plane={type:"plane",length:15,width:12,color:"black",
               drag:0,gravity:0,id:aircraftID++};
  // VectorLength(targetMPH,frameInterval,pixelsPerMile)
  let speed = Number(get("speed").value)
  let vlen=VectorLength(speed,vt.FrameIntervalInSeconds(),10);
  //AddStatus("vector length="+vlen);
  let movingVector = new MovingVector(vlen,0,0,0,plane,vt);
  movingVector.vector.SetDirection(45);
  //AddStatus(JSON.stringify(movingVector));
  Objs.push(movingVector);
}

function StartAnimation(start)
{
  if (!start) // stop
  {
    runAnimate=false;
  }
  else // start
  {
    ClearSketch("rwy,hanger,fix")
    Objs=[];
    runAnimate=true;
    Draw("hanger",0,0,[[0,0,30,0],[0,0,0,30],[0,30,30,0]]);
    DrawRunway(runway1.x,runway1.y,20,100,10);
    DrawRunway(runway2.x,runway2.y,20,100,10);
    Animate();
  }
}


let runAnimate=false;
function Animate()
{
try
  {
  //AddStatus("In Animate");
  var id = setInterval(frame, vt.fi);
  var count=0;
  var maxPerformance=0
  function frame() 
  {
    var t0 = performance.now();
    try
    {
    //AddStatus("in Frame");
    if (!runAnimate) 
    {
      clearInterval(id);
      Objs=[];
    } 
    else 
    {
      count++;
      // bump the position of all objects
      // new positions will be updated when we redraw
      for (let mv of Objs)
      {
        mv.Move();
      } 
      // look for planes too close
      for (let mv of Objs)
      {
        mv.ClearColor("red");
        mv.ClearColor("orange");
      }
      for (let i=0;i<Objs.length-1;i++)
      {
        for (let j=i+1;j<Objs.length;j++)
        {
          if (Math.abs(Objs[i].alt-Objs[j].alt)<1000)
          {
            let dist = DistBetween(Objs[i],Objs[j]);
            if (30<dist && dist<60)
            {
              Objs[i].SetColor("orange");
              Objs[j].SetColor("orange");
            }
            if (dist<30)
            {
              Objs[i].SetColor("red");
              Objs[j].SetColor("red");
            }
          }
        }
      }
      // check for intercepts
      for (let i=0;i<Objs.length;i++)
      {
        let mv = Objs[i];
        let mvx = mv.xpos;
        let mvy = mv.ypos;
        let r1x = runway1.x;
        let r1y = runway1.y;
        let r2x = runway2.x;
        let r2y = runway2.y;
        let dist1 = Math.hypot(mvx-r1x,mvy-r1y);
        let dist2 = Math.hypot(mvx-r2x,mvy-r2y);
        let direction = mv.vector.GetDirection();
        if (mv.tag=="ongs")
        {
          if (dist1<10 || dist2<10)
          {
            //AddStatus("Spliced");
            Objs.splice(i,1);
          }
          if (dist1<120 && (Math.abs(mv.GetSpeed()-150)>1))
            mv.SlewToSpeed(150);
        }
        else
        {
          if (((dist1<300) || (dist2<300)) && 
              (((direction<31) || (direction>329)) ||
               ((direction<211) && (direction>149))) &&
              ((Math.abs(mvy-r1y)<2) || (Math.abs(mvy-r2y)<2)))
          {
            mv.CancelSlew();
            if ((direction<211) && (direction>149))
              mv.vector.SetDirection(180);
            else
              mv.vector.SetDirection(0);
            if (Math.abs(mvy-r1y)<2)
              mv.ypos=r1y;
            else 
              mv.ypos=r2y;
            mv.tag="ongs";
            mv.SetColor("silver");
          }
        }
      }

      // update the selected plane stats
      if (count>1)
      {
        let selmv = Objs.filter(x=>x.ContainsColor("green"))
        if (selmv!=undefined && selmv.length==1)
        {
          get("debug02").innerHTML= selmv[0].Stats();
          get("debug06").innerHTML="State: "+selmv[0].state.GetStateName();
        }
      }

      //AddStatus("Clear, then draw everything");
      redrawCanvas();

      // draw the drag vector if currently dragging
      if (dragmv!=undefined && dragmv.tag=="drag")
      {
        let speed = Number(get("speed").value)
        let x0=vt.toScreenX(dragmv.xpos);
        let y0=vt.toScreenY(dragmv.ypos);
        let x1=dragto[0];
        let y1=dragto[1];
        drawLine(x0,y0,x1,y1);
        let v = new Vector(x1-x0,y1-y0);
        let screenDist = Math.hypot(x1-x0,y1-y0);
        //get("debug04").innerHTML=screenDist;
        if (screenDist<50)
          get("debug02").innerHTML="CANCEL";
        else
        {
          let heading = FixHeading(Math.round((v.GetDirection()+90)/10)*10);
          get("debug02").innerHTML="Hdg:"+ heading+
                    " "+(MvSpeed(dragmv,vt.fi/1000,10)).toFixed(0)+"kts"+
                    " "+(Math.hypot(x1-x0,y1-y0)/(10*vt.scale)).toFixed(1)+"mi";
        }
      }
    }
    let t1=performance.now();
    let delta = t1-t0;
    if (delta>maxPerformance)maxPerformance=delta;
    get("debug04").innerHTML="Execution Time: "+delta.toFixed(1)+"/max="+
                             maxPerformance.toFixed(1)+"ms";
    get("debug01").innerHTML=Objs.length+" Plane(s)";
    }
    catch(err)
    {
      AddStatus("frame:"+err.message);
    }
  }
  }
  catch(err)
  {
    AddStatus("Animate:"+err.message);
  }
}

function CollisionBounce(mv1,mv2)
{
  /*
  In an elastic collision between spheres, bodies retain their speed in the 
  direction tangent to the collision. they swap speeds in the direction
  normal to the collision point.
  */
  // get the vector between the two center points
  // this will be normal to the collision point
  let normal = new Vector(mv2.xpos-mv1.xpos,mv2.ypos-mv1.ypos);
  // get the tangent vector
  let tangent = normal.UnitNormal();
  //AddStatus("normal\n"+JSON.stringify(normal));
  //AddStatus("tangent\n"+JSON.stringify(tangent));
  //setup mv2
  let projTangent2=mv2.vector.ProjectOn(tangent);
  let otherNormal2=mv1.vector.ProjectOn(normal);
  let newVector2=projTangent2.Add(otherNormal2);

  //AddStatus("normal dir = "+normal.GetDirection());
  //AddStatus("tangent dir = "+tangent.GetDirection());
  //AddStatus("projTangent2 dir = "+projTangent2.GetDirection());
  //AddStatus("otherNormal2 dir = "+otherNormal2.GetDirection());
  //AddStatus("newVector2 dir = "+newVector2.GetDirection());

  // setup mv1
  let projTangent1=mv1.vector.ProjectOn(tangent);
  let OtherNormal1=mv2.vector.ProjectOn(normal);
  let newVector1=projTangent1.Add(OtherNormal1);

  mv1.vector=newVector1;
  mv2.vector=newVector2; 
}

function DistBetween(mv1,mv2)
{
  let dist = Math.hypot(mv2.xpos-mv1.xpos,mv2.ypos-mv1.ypos); 
  //AddStatus("mv1/mv2=["+mv1.xpos+","+mv1.ypos+"]["+mv2.xpos+","+mv2.ypos+"]");
  return dist;
}